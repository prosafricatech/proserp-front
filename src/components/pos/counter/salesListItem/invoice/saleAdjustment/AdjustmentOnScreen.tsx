import React from 'react';
import {
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  useTheme,
} from '@mui/material';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';
import { Currency } from '@/components/masters/Currencies/CurrencyType';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import { AuthObject } from '@/types/auth-types';

interface AdjustmentItem {
  quantity: number;
  rate: number;
  vat_percentage: number;
  vat_exempted: number;
  description?: string;
  product?: {
    name: string;
  };
  measurement_unit?: MeasurementUnit | string;
}

interface Creator {
  name: string;
}

interface Adjustment {
  id: number;
  voucherNo: string;
  note_type: 'debit' | 'credit';
  adjustment_date: string;
  transaction_date?: string;
  narration: string;
  currency: Currency;
  items: AdjustmentItem[];
  cost_centers: CostCenter[];
  creator: Creator;
}

interface AdjustmentOnScreenProps {
  adjustment: Adjustment;
  authObject: AuthObject;
}

const formatCurrency = (
  amount: number,
  currencyCode: string,
  options?: Intl.NumberFormatOptions
): string => {
  return amount?.toLocaleString('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  });
};

const formatNumber = (
  value: number,
  options: Intl.NumberFormatOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }
): string => {
  return value.toLocaleString('en-US', options);
};

const AdjustmentOnScreen: React.FC<AdjustmentOnScreenProps> = ({
  adjustment,
  authObject,
}) => {
  const theme = useTheme();
  const currencyCode = adjustment.currency.code;
  const {
    authOrganization: { organization },
  } = authObject;

  const mainColor = organization.settings?.main_color || '#2113AD';
  const headerColor = theme.type === 'dark' ? '#29f096' : (organization.settings?.main_color || '#2113AD');
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';

  const calculatedValues = React.useMemo(() => {
    const totalAmountForVAT = adjustment.items
      .filter((item) => item.vat_exempted !== 1)
      .reduce((total: number, item: AdjustmentItem) => {
        const itemAmount = item.quantity * item.rate;
        const vatAmount = itemAmount * (item.vat_percentage / 100);
        return total + vatAmount;
      }, 0);

    const totalAmount = adjustment.items.reduce((total: number, item: AdjustmentItem) => {
      return total + item.quantity * item.rate;
    }, 0);

    const grandTotal = totalAmount + totalAmountForVAT;

    return {
      totalAmountForVAT,
      totalAmount,
      grandTotal,
      hasVAT: totalAmountForVAT > 0,
    };
  }, [adjustment.items]);

  const { totalAmountForVAT, totalAmount, grandTotal, hasVAT } = calculatedValues;

  const tableRows = React.useMemo(() => {
    return adjustment.items.map((item: AdjustmentItem, index: number) => {
      const itemAmount = item.quantity * item.rate;
      const vatAmount =
        item.vat_exempted !== 1
          ? itemAmount * (item.vat_percentage / 100)
          : 0;

      const unitDisplay = typeof item.measurement_unit === 'string'
        ? item.measurement_unit
        : item.measurement_unit?.symbol || '';

      return (
        <TableRow
          key={`${item.product?.name || index}-${index}`}
          sx={{
            backgroundColor: theme.palette.background.paper,
            '&:nth-of-type(even)': {
              backgroundColor: theme.palette.action.hover,
            },
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          <TableCell>{index + 1}</TableCell>
          <TableCell>
            <Box>
              <Typography variant="body2" component="span" fontWeight="medium">
                {item.product?.name}
              </Typography>
              {item.description && (
                <Typography
                  variant="body2"
                  component="span"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.875rem',
                    display: 'block',
                    ml: 0.5,
                  }}
                >
                  ({item.description})
                </Typography>
              )}
            </Box>
          </TableCell>
          <TableCell>{unitDisplay}</TableCell>
          <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>
            {item.quantity.toLocaleString()}
          </TableCell>
          <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>
            {formatNumber(item.rate)}
          </TableCell>
          {hasVAT && (
            <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>
              {item.vat_exempted !== 1
                ? formatNumber(vatAmount)
                : 'Exempt'
              }
            </TableCell>
          )}
          <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>
            {formatNumber(itemAmount)}
          </TableCell>
        </TableRow>
      );
    });
  }, [adjustment.items, hasVAT, theme]);

  const renderTotalsRow = (label: string, amount: number, bold = false) => (
    <Grid container columnSpacing={1} sx={{ mb: 1 }}>
      <Grid size={8} />
      <Grid size={2}>
        <Typography
          variant="body1"
          sx={{
            textAlign: 'right',
            fontWeight: bold ? 'bold' : 'medium',
            color: bold ? headerColor : 'text.primary',
          }}
        >
          {label}
        </Typography>
      </Grid>
      <Grid size={2}>
        <Typography
          variant="body1"
          sx={{
            fontWeight: bold ? 'bold' : 'medium',
            fontFamily: 'monospace',
            color: bold ? headerColor : 'text.primary',
          }}
        >
          {formatCurrency(amount, currencyCode)}
        </Typography>
      </Grid>
    </Grid>
  );

  return (
    <>
      {/* Header Section */}
      <Grid container spacing={2} sx={{ mb: 3, alignItems: 'center' }}>
        <Grid size={6}>
          <Box>
            <Typography
              variant="h4"
              sx={{
                color: headerColor,
              }}
            >
              {adjustment.note_type === 'debit' ? 'DEBIT NOTE' : 'CREDIT NOTE'}
            </Typography>
            <Typography variant="h6" sx={{ mt: 0.5 }}>
              {adjustment.voucherNo}
            </Typography>
          </Box>
        </Grid>
        <Grid size={6} sx={{ textAlign: 'right' }}>
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
            }}
          >
            {readableDate(adjustment.adjustment_date)}
          </Typography>
        </Grid>
      </Grid>

      {/* Metadata Section */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {adjustment.cost_centers.length > 0 && (
          <Grid size={{xs: 12, md: 6}}>
            <Box>
              <Typography
                variant="subtitle2"
              >
                Cost Center{adjustment.cost_centers.length > 1 ? 's' : ''}
              </Typography>
              <Typography variant="body1" color="text.primary">
                {adjustment.cost_centers
                  .map((cost_center: CostCenter) => cost_center.name)
                  .join(', ')}
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Items Table */}
      <TableContainer
        component={Paper}
        sx={{
          mb: 2,
          borderRadius: 1,
          overflow: 'hidden',
          boxShadow: theme.shadows[2],
          '& .MuiTableRow-root:hover': {
            backgroundColor: theme.palette.action.hover,
          }
        }}
      >
        <Table sx={{ minWidth: 650 }} aria-label="Adjustment items table">
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  backgroundColor: mainColor,
                  color: contrastText,
                  width: '5%',
                  fontSize: '0.875rem',
                  py: 1.5,
                }}
              >
                #
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: mainColor,
                  color: contrastText,
                  width: '35%',
                  fontSize: '0.875rem',
                  py: 1.5,
                }}
              >
                Product
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: mainColor,
                  color: contrastText,
                  width: '10%',
                  fontSize: '0.875rem',
                  py: 1.5,
                }}
              >
                Unit
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: mainColor,
                  color: contrastText,
                  width: '10%',
                  textAlign: 'right',
                  fontSize: '0.875rem',
                  py: 1.5,
                }}
              >
                Quantity
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: mainColor,
                  color: contrastText,
                  width: '10%',
                  textAlign: 'right',
                  fontSize: '0.875rem',
                  py: 1.5,
                }}
              >
                Rate
              </TableCell>
              {hasVAT && (
                <TableCell
                  sx={{
                    backgroundColor: mainColor,
                    color: contrastText,
                    width: '10%',
                    textAlign: 'right',
                    fontSize: '0.875rem',
                    py: 1.5,
                  }}
                >
                  VAT
                </TableCell>
              )}
              <TableCell
                sx={{
                  backgroundColor: mainColor,
                  color: contrastText,
                  width: '10%',
                  textAlign: 'right',
                  fontSize: '0.875rem',
                  py: 1.5,
                }}
              >
                Amount
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tableRows}
            {adjustment.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={hasVAT ? 7 : 6} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No items found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Totals Section */}
      {adjustment.items.length > 0 && (
        <>
          {renderTotalsRow('Subtotal', totalAmount)}
          
          {hasVAT && (
            <>
              {renderTotalsRow(`VAT`, totalAmountForVAT)}
              {renderTotalsRow('Grand Total', grandTotal, true)}
            </>
          )}
          
          {!hasVAT && (
            renderTotalsRow('Total', totalAmount, true)
          )}
        </>
      )}

      {/* Footer Section */}
      <Grid container spacing={2} sx={{ mt: 3 }}>
        <Grid size={{xs: 12, md: 8}}>
          <Typography
            variant="subtitle2"
          >
            Narration
          </Typography>
          <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.5 }}>
            {adjustment.narration}
          </Typography>
        </Grid>
        <Grid size={{xs: 12, md: 4}}>
          <Typography
            variant="subtitle2"
          >
            Posted By
          </Typography>
          <Typography variant="body1" color="text.primary" fontWeight="medium">
            {adjustment.creator?.name}
          </Typography>
        </Grid>
      </Grid>
    </>
  );
};

export default AdjustmentOnScreen;