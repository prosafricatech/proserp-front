import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Currency } from '@/components/masters/Currencies/CurrencyType';
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';
import { Organization } from '@/types/auth-types';
import {
  Avatar,
  Box,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';

interface Product {
  name: string;
  description: string;
  vat_exempted?: boolean;
  main_photo?: { full_path: string } | null;
}

interface ProformaItem {
  id: number;
  product: Product;
  description?: string;
  measurement_unit: MeasurementUnit;
  quantity: number;
  rate: number;
}

interface Proforma {
  proformaNo: string;
  proforma_date: string;
  expiry_date?: string;
  items: ProformaItem[];
  amount: number;
  vat_amount: number;
  vat_percentage: number;
  currency: Currency;
  reference?: string | null;
  remarks?: string | null;
}

interface ProformaOnScreenProps {
  proforma: Proforma;
  organization: Organization;
}

function ProformaOnScreen({ proforma, organization }: ProformaOnScreenProps) {
  const theme = useTheme();
  const currencyCode = proforma.currency?.code;
  const mainColor = organization.settings?.main_color || '#2113AD';
  const headerColor =
    theme.type === 'dark'
      ? '#29f096'
      : organization.settings?.main_color || '#2113AD';
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';

  const formatCurrency = (amount: number) => {
    return amount?.toLocaleString('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });
  };

  const grandTotal = proforma.amount + proforma.vat_amount;

  return (
    <Box sx={{ padding: 2 }}>
      {/* Header Section */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={12}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              width: '100%',
            }}
          >
            <Typography
              variant='h4'
              color={headerColor}
              fontWeight='bold'
              gutterBottom
            >
              PROFORMA INVOICE
            </Typography>
            <Typography variant='h6' fontWeight='bold' gutterBottom>
              {proforma.proformaNo}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Metadata Section */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid
          size={{
            xs: 12,
            md: proforma?.expiry_date && proforma?.reference ? 4 : 8,
          }}
        >
          <Box>
            <Typography
              variant='subtitle2'
              color={headerColor}
              fontWeight='bold'
              gutterBottom
            >
              Proforma Date
            </Typography>
            <Typography variant='body1'>
              {readableDate(proforma.proforma_date)}
            </Typography>
          </Box>
        </Grid>
        {proforma?.reference && (
          <Grid size={{ xs: 12, md: proforma?.expiry_date ? 4 : 8 }}>
            {/* reference */}
            <>
              <Typography
                variant='subtitle2'
                color={headerColor}
                fontWeight='bold'
                gutterBottom
              >
                Reference
              </Typography>
              <Typography variant='body1'>{proforma.reference}</Typography>
            </>
          </Grid>
        )}
        {proforma?.expiry_date && (
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Typography
                variant='subtitle2'
                color={headerColor}
                fontWeight='bold'
                gutterBottom
              >
                Valid Until
              </Typography>
              <Typography variant='body1'>
                {readableDate(proforma.expiry_date)}
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Items Table */}
      <TableContainer
        component={Paper}
        sx={{
          boxShadow: theme.shadows[2],
          '& .MuiTableRow-root:hover': {
            backgroundColor: theme.palette.action.hover,
          },
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  backgroundColor: mainColor,
                  color: contrastText,
                  fontSize: '0.875rem',
                }}
              >
                S/N
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: mainColor,
                  color: contrastText,
                  fontSize: '0.875rem',
                }}
              >
                Product/Service
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: mainColor,
                  color: contrastText,
                  fontSize: '0.875rem',
                }}
              >
                Unit
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: mainColor,
                  color: contrastText,
                  fontSize: '0.875rem',
                }}
                align='right'
              >
                Quantity
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: mainColor,
                  color: contrastText,
                  fontSize: '0.875rem',
                }}
                align='right'
              >
                Price {proforma?.vat_percentage ? '(Excl.)' : ''}
              </TableCell>
              {proforma?.vat_percentage > 0 && (
                <TableCell
                  sx={{
                    backgroundColor: mainColor,
                    color: contrastText,
                    fontSize: '0.875rem',
                  }}
                  align='right'
                >
                  VAT
                </TableCell>
              )}
              <TableCell
                sx={{
                  backgroundColor: mainColor,
                  color: contrastText,
                  fontSize: '0.875rem',
                }}
                align='right'
              >
                Amount {proforma?.vat_percentage ? '(Incl.)' : ''}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {proforma.items.map((proformaItem, index) => (
              <TableRow
                key={proformaItem.id}
                sx={{
                  backgroundColor: theme.palette.background.paper,
                  '&:nth-of-type(even)': {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <Box
                    sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}
                  >
                    <Avatar
                      src={
                        proformaItem.product.main_photo?.full_path || undefined
                      }
                      variant='rounded'
                      sx={{
                        width: 48,
                        height: 48,
                        flexShrink: 0,
                        bgcolor: 'primary.light',
                        color: 'primary.contrastText',
                        fontWeight: 700,
                        fontSize: 18,
                      }}
                    >
                      {proformaItem.product.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Box
                      display={'flex'}
                      flexDirection={'column'}
                      alignItems={'start'}
                      gap={1}
                    >
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {proformaItem.product.name}
                        <span style={{ color: '#888', fontStyle: 'italic' }}>
                          ({proformaItem.product.description})
                        </span>
                      </span>
                      {proformaItem.description && (
                        <span
                          style={{
                            color: '#9e9e9eff',
                            fontStyle: 'italic',
                            fontSize: 12,
                          }}
                        >
                          {proformaItem.description}
                        </span>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{proformaItem.measurement_unit.symbol}</TableCell>
                <TableCell align='right' sx={{ fontFamily: 'monospace' }}>
                  {proformaItem.quantity.toLocaleString()}
                </TableCell>
                <TableCell align='right' sx={{ fontFamily: 'monospace' }}>
                  {formatNumber(proformaItem.rate)}
                </TableCell>
                {proforma?.vat_percentage > 0 && (
                  <TableCell align='right' sx={{ fontFamily: 'monospace' }}>
                    {!proformaItem.product?.vat_exempted
                      ? formatNumber(
                          proforma.vat_percentage * proformaItem.rate * 0.01
                        )
                      : '0.00'}
                  </TableCell>
                )}
                <TableCell align='right' sx={{ fontFamily: 'monospace' }}>
                  {formatNumber(
                    proformaItem.quantity *
                      proformaItem.rate *
                      (!proformaItem.product?.vat_exempted
                        ? (100 + proforma.vat_percentage) * 0.01
                        : 1)
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Totals Section */}
      <Box
        sx={{
          mt: 3,
          p: 2,
        }}
      >
        <Grid container spacing={1}>
          <Grid size={{ xs: 7 }}>
            <Typography variant='body1' fontWeight='medium'>
              Subtotal
            </Typography>
          </Grid>
          <Grid size={{ xs: 5 }} sx={{ textAlign: 'right' }}>
            <Typography
              variant='body1'
              fontWeight='medium'
              fontFamily='monospace'
            >
              {formatCurrency(proforma.amount)}
            </Typography>
          </Grid>

          {proforma.vat_percentage > 0 && (
            <>
              <Grid size={{ xs: 7 }}>
                <Typography variant='body1' fontWeight='medium'>
                  VAT ({proforma.vat_percentage}%)
                </Typography>
              </Grid>
              <Grid size={{ xs: 5 }} sx={{ textAlign: 'right' }}>
                <Typography
                  variant='body1'
                  fontWeight='medium'
                  fontFamily='monospace'
                >
                  {formatCurrency(proforma.vat_amount)}
                </Typography>
              </Grid>

              <Grid size={{ xs: 7 }}>
                <Typography variant='h6' fontWeight='bold' color={headerColor}>
                  Grand Total
                </Typography>
              </Grid>
              <Grid size={{ xs: 5 }} sx={{ textAlign: 'right' }}>
                <Typography
                  variant='h6'
                  fontWeight='bold'
                  color={headerColor}
                  fontFamily='monospace'
                >
                  {formatCurrency(grandTotal)}
                </Typography>
              </Grid>
            </>
          )}

          {!proforma.vat_percentage && (
            <>
              <Grid size={{ xs: 7 }}>
                <Typography variant='h6' fontWeight='bold' color={headerColor}>
                  Total
                </Typography>
              </Grid>
              <Grid size={{ xs: 5 }} sx={{ textAlign: 'right' }}>
                <Typography
                  variant='h6'
                  fontWeight='bold'
                  color={headerColor}
                  fontFamily='monospace'
                >
                  {formatCurrency(proforma.amount)}
                </Typography>
              </Grid>
            </>
          )}
        </Grid>
      </Box>

      <Grid container mt={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          {/* Remarks Section */}
          {proforma?.remarks && (
            <>
              <Typography
                variant='subtitle2'
                color={headerColor}
                fontWeight='bold'
                gutterBottom
              >
                Remarks
              </Typography>
              <Typography variant='body1'>{proforma.remarks}</Typography>
            </>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

export default ProformaOnScreen;
