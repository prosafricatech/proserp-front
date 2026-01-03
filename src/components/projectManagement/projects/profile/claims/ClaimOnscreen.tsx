import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Grid,
  useTheme,
} from '@mui/material';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';
import { Organization } from '@/types/auth-types';
interface RevenueLedger {
  name?: string;
}

interface ProjectDeliverable {
  description?: string;
  quantity?: number;
  contract_rate?: number;
  measurement_unit?: MeasurementUnit;
}

interface ClaimItem {
  project_deliverable?: ProjectDeliverable;
  revenue_ledger?: RevenueLedger;
  remarks?: string | null;
}

interface ComplementLedger {
  name?: string;
}

interface Adjustment {
  description: string;
  type: 'addition' | 'deduction';
  amount: number | string;
  complement_ledger?: ComplementLedger;
}

interface Currency {
  code?: string;
}

interface Creator {
  name?: string;
}

interface Claim {
  claimNo: string;
  claim_date: string;
  remarks?: string | null;
  currency?: Currency;
  creator?: Creator;
  claim_items: ClaimItem[];
  adjustments?: Adjustment[];
}

interface ClaimOnscreenProps {
  claim: Claim;
  organization: Organization;
}

const ClaimOnscreen: React.FC<ClaimOnscreenProps> = ({ claim, organization }) => {
  const theme = useTheme();
  const isDark = theme.type === 'dark';

  // Branding colors
  const mainColor = organization.settings?.main_color || '#2113AD';
  const headerColor = isDark ? '#29f096' : (organization.settings?.main_color || '#2113AD');
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';
  const currencyCode = claim.currency?.code || 'TZS';

  // Adaptive background for rows
  const rowHoverBg = theme.palette.action.hover;
  const altRowBg = isDark ? '#2d2d2d' : '#f9f9f9';

  // Claimed Deliverables
  const claimedItems = claim.claim_items.map((it, index) => {
    const rate = it.project_deliverable?.contract_rate || 0;
    const contractQty = it.project_deliverable?.quantity || 0;

    return {
      sn: index + 1,
      description: it.project_deliverable?.description || '',
      ledger: it.revenue_ledger?.name || '',
      contractQty,
      unitRate: rate,
      contractAmount: contractQty * rate,
    };
  });

  const claimedTotal = claimedItems.reduce((sum, item) => sum + item.contractAmount, 0);

  // Adjustments
  const adjustmentItems = (claim.adjustments || []).map((adj, index) => ({
    sn: index + 1,
    description: adj.description,
    type: adj.type,
    amount: Number(adj.amount) || 0,
    ledger: adj.complement_ledger?.name || '',
  }));

  const netAdjustments = adjustmentItems.reduce(
    (sum, adj) => sum + (adj.type === 'addition' ? adj.amount : -adj.amount),
    0
  );

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto', bgcolor: 'background.default' }}>
      {/* Header Section - Centered like PurchaseGrnsReportOnScreen */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
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
              variant="h4"
              sx={{ color: headerColor, fontWeight: 'bold' }}
              gutterBottom
            >
              CLAIM
            </Typography>
            <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>
              {claim.claimNo}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              {`As at: ${readableDate(undefined, true)}`}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Metadata */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Claim Date
          </Typography>
          <Typography variant="body1" fontWeight="medium">
            {readableDate(claim.claim_date, false)}
          </Typography>
        </Grid>

        {claim.remarks && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Remarks
            </Typography>
            <Typography variant="body1">{claim.remarks}</Typography>
          </Grid>
        )}
      </Grid>

      <Divider sx={{ my: 5 }} />

      {/* Adjustments Table - Top */}
      {adjustmentItems.length > 0 && (
        <Box sx={{ mb: 6 }}>
          <Typography variant="h6" sx={{ mb: 3, color: headerColor, fontWeight: 'bold' }}>
            Adjustments
          </Typography>

          <TableContainer
            component={Paper}
            sx={{
              boxShadow: theme.shadows[3],
              borderRadius: 2,
              '& .MuiTableRow-root:hover': { bgcolor: rowHoverBg },
            }}
          >
            <Table size="medium">
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      bgcolor: mainColor,
                      color: contrastText,
                      fontWeight: 'bold',
                      borderRight: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    S/N
                  </TableCell>
                  <TableCell
                    sx={{
                      bgcolor: mainColor,
                      color: contrastText,
                      fontWeight: 'bold',
                      borderRight: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    Description
                  </TableCell>
                  <TableCell
                    sx={{
                      bgcolor: mainColor,
                      color: contrastText,
                      fontWeight: 'bold',
                      borderRight: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    Complement Ledger
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      bgcolor: mainColor,
                      color: contrastText,
                      fontWeight: 'bold',
                    }}
                  >
                    Amount ({currencyCode})
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {adjustmentItems.map((item, index) => (
                  <TableRow
                    key={item.sn}
                    sx={{
                      '&:nth-of-type(even)': { bgcolor: altRowBg },
                    }}
                  >
                    <TableCell>{item.sn}.</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{item.ledger}</TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontFamily: 'monospace',
                        color: item.type === 'deduction' ? 'error.main' : 'success.main',
                        fontWeight: 500,
                      }}
                    >
                      {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}

                {/* Gross Amount */}
                <TableRow sx={{ bgcolor: isDark ? 'grey.800' : 'grey.100' }}>
                  <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                    Total Amount ({currencyCode})
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 'bold', fontFamily: 'monospace', fontSize: '1.1rem' }}
                  >
                    {netAdjustments.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Claimed Deliverables Table */}
      <Box>
        <Typography variant="h6" sx={{ mb: 3, color: headerColor, fontWeight: 'bold' }}>
          Claimed Deliverables
        </Typography>

        <TableContainer
          component={Paper}
          sx={{
            boxShadow: theme.shadows[3],
            borderRadius: 2,
            '& .MuiTableRow-root:hover': { bgcolor: rowHoverBg },
          }}
        >
          <Table size="medium">
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    bgcolor: mainColor,
                    color: contrastText,
                    fontWeight: 'bold',
                    borderRight: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  S/N
                </TableCell>
                <TableCell
                  sx={{
                    bgcolor: mainColor,
                    color: contrastText,
                    fontWeight: 'bold',
                    borderRight: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  Description
                </TableCell>
                <TableCell
                  sx={{
                    bgcolor: mainColor,
                    color: contrastText,
                    fontWeight: 'bold',
                    borderRight: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  Revenue Ledger
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    bgcolor: mainColor,
                    color: contrastText,
                    fontWeight: 'bold',
                    borderRight: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  Qty
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    bgcolor: mainColor,
                    color: contrastText,
                    fontWeight: 'bold',
                    borderRight: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  Rate
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    bgcolor: mainColor,
                    color: contrastText,
                    fontWeight: 'bold',
                  }}
                >
                  Amount ({currencyCode})
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {claimedItems.map((item, index) => (
                <TableRow
                  key={item.sn}
                  sx={{
                    '&:nth-of-type(even)': { bgcolor: altRowBg },
                  }}
                >
                  <TableCell>{item.sn}.</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell sx={{ fontSize: '0.875rem' }}>{item.ledger}</TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                    {item.contractQty.toLocaleString()}
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                    {item.unitRate.toLocaleString()}
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                    {item.contractAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}

              <TableRow sx={{ bgcolor: isDark ? 'grey.800' : 'grey.100' }}>
                <TableCell colSpan={5} align="right" sx={{ fontWeight: 'bold' }}>
                  TOTAL ({currencyCode})
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 'bold', fontFamily: 'monospace', fontSize: '1.1rem' }}
                >
                  {claimedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Signature */}
      <Box sx={{ mt: 8 }}>
        <Typography variant="subtitle1" sx={{ color: headerColor, fontWeight: 'bold', mb: 2 }}>
          Prepared By:
        </Typography>
        <Box
          sx={{
            display: 'inline-block',
            px: 8,
            minWidth: 300,
            textAlign: 'center',
          }}
        >
          <Typography variant="body1" fontWeight="medium">
            {claim.creator?.name || '—'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ClaimOnscreen;