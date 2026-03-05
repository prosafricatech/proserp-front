'use client';

import {
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
import dayjs from 'dayjs';

interface FuelVoucherReportOnScreenProps {
  reportData: any[];
  organization: any;
  filters: any;
}

const FuelVoucherReportOnScreen = ({
  reportData,
  organization,
  filters,
}: FuelVoucherReportOnScreenProps) => {
  const theme = useTheme();
  const isDark = theme.type === 'dark';

  const mainColor = organization.settings?.main_color || '#2113AD';
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';
  const headerColor = isDark ? '#29f096' : mainColor;
  const lightColor = organization.settings?.light_color || '#bec5da';

  // Calculate totals
  const totalLts = reportData.reduce(
    (sum: any, fv: any) => sum + fv.quantity,
    0
  );

  const totalAmount = reportData.reduce(
    (sum: any, fv: any) => sum + fv.quantity * fv.price,
    0
  );

  let runningBalance: number = 0;

  // Determine if we should show the Stakeholder/Expense column
  const showStakeholderExpenseColumn =
    filters.stakeholder_name === '' &&
    (filters.expense_ledger_ids?.length !== 1 || !filters.expense_ledger_ids);

  // Determine if we should show Credit and Running Balance columns
  const showReceiptColumns =
    filters.with_receipts == 1 && filters.stakeholder_name;

  // Format number helper
  const formatNumber = (value: number) => {
    return value?.toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });
  };

  return (
    <Box sx={{ p: { xs: 0, md: 3 }, width: '100%' }}>
      {/* Header Section */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12 }}>
          <Typography
            variant='h4'
            sx={{
              color: headerColor,
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          >
            Fuel Vouchers Report
          </Typography>
        </Grid>
      </Grid>

      {/* Filters Section */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {filters.stationName && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography variant='subtitle2' sx={{ color: headerColor }}>
              Station Name
            </Typography>
            <Typography variant='body1'>{filters.stationName}</Typography>
          </Grid>
        )}
        {((filters.stakeholder_name && filters.stakeholder_name !== '') ||
          (filters.expense_ledger_ids &&
            filters.expense_ledger_ids?.length === 1)) && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography variant='subtitle2' sx={{ color: headerColor }}>
              {filters.stakeholder_name && filters.stakeholder_name !== ''
                ? 'Stakeholder Name'
                : 'Expense'}
            </Typography>
            <Typography variant='body1'>
              {filters.stakeholder_name && filters.stakeholder_name !== ''
                ? filters.stakeholder_name
                : filters.expense_ledger_ids &&
                    filters.expense_ledger_ids?.length === 1
                  ? reportData[0]?.expense_ledger?.name
                  : ''}
            </Typography>
          </Grid>
        )}
        {filters.from && filters.to && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography variant='subtitle2' sx={{ color: headerColor }}>
              Date Range
            </Typography>
            <Typography variant='body1'>
              {`${filters.from} - ${filters.to}`}
            </Typography>
          </Grid>
        )}
      </Grid>

      {/* Fuel Vouchers Table */}
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table size='small'>
          <TableHead>
            <TableRow sx={{ bgcolor: mainColor }}>
              <TableCell sx={{ color: contrastText, fontWeight: 'bold' }}>
                Date
              </TableCell>
              <TableCell sx={{ color: contrastText, fontWeight: 'bold' }}>
                Voucher No
              </TableCell>
              {showStakeholderExpenseColumn && (
                <TableCell sx={{ color: contrastText, fontWeight: 'bold' }}>
                  {!filters.stakeholder_name &&
                  (filters.expense_ledger_ids?.length < 1 ||
                    !filters.expense_ledger_ids)
                    ? 'Stakeholder/Expense'
                    : (!filters.stakeholder_name ||
                          filters.stakeholder_name === '') &&
                        filters.expense_ledger_ids?.length > 1
                      ? 'Expense'
                      : ''}
                </TableCell>
              )}
              <TableCell sx={{ color: contrastText, fontWeight: 'bold' }}>
                Reference
              </TableCell>
              <TableCell sx={{ color: contrastText, fontWeight: 'bold' }}>
                Product
              </TableCell>
              <TableCell sx={{ color: contrastText, fontWeight: 'bold' }}>
                Narration
              </TableCell>
              <TableCell
                align='right'
                sx={{ color: contrastText, fontWeight: 'bold' }}
              >
                Lts
              </TableCell>
              <TableCell
                align='right'
                sx={{ color: contrastText, fontWeight: 'bold' }}
              >
                Price
              </TableCell>
              <TableCell
                align='right'
                sx={{ color: contrastText, fontWeight: 'bold' }}
              >
                {showReceiptColumns ? 'Debit' : 'Amount'}
              </TableCell>
              {showReceiptColumns && (
                <TableCell
                  align='right'
                  sx={{ color: contrastText, fontWeight: 'bold' }}
                >
                  Credit
                </TableCell>
              )}
              {showReceiptColumns && (
                <TableCell
                  align='right'
                  sx={{ color: contrastText, fontWeight: 'bold' }}
                >
                  Running Balance
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {reportData.length > 0 ? (
              reportData.map((rd: any, index: number) => {
                runningBalance += rd.debit - rd.credit;
                return (
                  <TableRow
                    key={index}
                    sx={{
                      bgcolor: 'background.paper',
                      borderBottomColor: lightColor,
                      borderBottomWidth: 4,
                    }}
                  >
                    <TableCell>
                      {dayjs(rd.transaction_date).format('DD-MM-YYYY')}
                    </TableCell>
                    <TableCell>{rd.voucherNo}</TableCell>
                    {showStakeholderExpenseColumn && (
                      <TableCell>
                        {rd.expense_ledger?.name || rd.stakeholder?.name}
                      </TableCell>
                    )}
                    <TableCell>{rd.reference || ''}</TableCell>
                    <TableCell>{rd.product?.name}</TableCell>
                    <TableCell>{rd.narration}</TableCell>
                    <TableCell align='right'>
                      {formatNumber(rd.quantity)}
                    </TableCell>
                    <TableCell align='right'>
                      {formatNumber(rd.price)}
                    </TableCell>
                    <TableCell align='right'>
                      {filters.with_receipts == 0
                        ? formatNumber(rd.amount)
                        : formatNumber(rd.debit)}
                    </TableCell>
                    {showReceiptColumns && (
                      <TableCell align='right'>
                        {formatNumber(rd.credit)}
                      </TableCell>
                    )}
                    {showReceiptColumns && (
                      <TableCell align='right'>
                        {formatNumber(runningBalance)}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={
                    8 +
                    (showStakeholderExpenseColumn ? 1 : 0) +
                    (showReceiptColumns ? 2 : 0)
                  }
                  align='center'
                >
                  No data available
                </TableCell>
              </TableRow>
            )}

            {/* Totals Row */}
            {reportData.length > 0 && (
              <TableRow sx={{ bgcolor: mainColor }}>
                <TableCell
                  colSpan={
                    5 +
                    (showStakeholderExpenseColumn ? 1 : 0) +
                    (showReceiptColumns ? 0 : 0)
                  }
                  sx={{ color: contrastText, fontWeight: 'bold' }}
                >
                  TOTAL
                </TableCell>
                <TableCell
                  align='right'
                  sx={{ color: contrastText, fontWeight: 'bold' }}
                >
                  {formatNumber(totalLts)}
                </TableCell>
                <TableCell
                  align='right'
                  sx={{ color: contrastText, fontWeight: 'bold' }}
                ></TableCell>
                <TableCell
                  align='right'
                  sx={{ color: contrastText, fontWeight: 'bold' }}
                >
                  {formatNumber(totalAmount)}
                </TableCell>
                {showReceiptColumns && (
                  <TableCell
                    align='right'
                    sx={{ color: contrastText, fontWeight: 'bold' }}
                  ></TableCell>
                )}
                {showReceiptColumns && (
                  <TableCell
                    align='right'
                    sx={{ color: contrastText, fontWeight: 'bold' }}
                  ></TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default FuelVoucherReportOnScreen;
