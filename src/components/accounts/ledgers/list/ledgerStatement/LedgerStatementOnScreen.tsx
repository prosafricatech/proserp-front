import React from 'react';
import { Typography, Box, Grid, Table, TableHead, TableRow, TableCell, TableBody, useTheme } from '@mui/material';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Organization } from '@/types/auth-types';

interface AuthOrganization {
  organization: Organization;
}

interface Transaction {
  transactionDate: string;
  voucherNo?: string;
  reference?: string;
  description: string;
  debit: number;
  credit: number;
}

interface TransactionsData {
  transactions: Transaction[];
    filters: {
    from: string;
    to: string;
  };
}

interface LedgerStatementOnScreenProps {
  transactionsData: TransactionsData;
  authOrganization: AuthOrganization;
  increasesWith?: 'DR' | 'CR';
}

const LedgerStatementOnScreen: React.FC<LedgerStatementOnScreenProps> = ({ 
  transactionsData, 
  authOrganization, 
  increasesWith
}) => {
  const theme = useTheme();
  const mainColor = authOrganization.organization.settings?.main_color || "#2113AD";
  const contrastText = authOrganization.organization.settings?.contrast_text || "#FFFFFF";
  const headerColor = theme.type === 'dark' ? '#29f096' : (authOrganization?.organization.settings?.main_color || "#2113AD");

  const [openingBalanceTx, ...restTransactions] = transactionsData.transactions;

  // Opening balance seeds the cumulative balance but is excluded from DR/CR totals
  const openingBalance = openingBalanceTx
    ? increasesWith === 'DR'
      ? openingBalanceTx.debit - openingBalanceTx.credit
      : openingBalanceTx.credit - openingBalanceTx.debit
    : 0;

  const totalCredits = restTransactions.reduce((total, transaction) => total + transaction.credit, 0);
  const totalDebits = restTransactions.reduce((total, transaction) => total + transaction.debit, 0);
  let runningBalance = openingBalance;

  // Function to format balance and handle -0.00 case
  const formatBalance = (balance: number): string => {
    const formatted = balance.toLocaleString('en-US', { 
      maximumFractionDigits: 2, 
      minimumFractionDigits: 2 
    });
    return formatted === "-0.00" ? "0.00" : formatted;
  };

  const tableRows = [
    ...(openingBalanceTx
      ? [{
          transactionDate: openingBalanceTx.transactionDate,
          reference: '',
          description: openingBalanceTx.description,
          debit: null as number | null,
          credit: null as number | null,
          balance: openingBalance,
        }]
      : []),
    ...restTransactions.map((transaction) => {
      runningBalance +=
        increasesWith === 'DR'
          ? transaction.debit - transaction.credit
          : transaction.credit - transaction.debit;

      return {
        transactionDate: transaction.transactionDate,
        reference: `${transaction.voucherNo || ''} ${transaction.reference || ''}`.trim(),
        description: transaction.description,
        debit: transaction.debit,
        credit: transaction.credit,
        balance: runningBalance,
      };
    }),
  ];

  return transactionsData ? (
    <Box>
      {/* Summary Section */}
      <Grid container spacing={2} mb={3}>
        <Grid size={6}>
          <Typography variant="subtitle2" style={{ color: headerColor }}>Total Credits</Typography>
          <Typography variant="body2">{formatBalance(totalCredits)}</Typography>
        </Grid>
        <Grid size={6}>
          <Typography variant="subtitle2" style={{ color: headerColor }}>Total Debits</Typography>
          <Typography variant="body2">{formatBalance(totalDebits)}</Typography>
        </Grid>
      </Grid>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>Date</TableCell>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>Reference</TableCell>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>Description</TableCell>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>Debit</TableCell>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>Credit</TableCell>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>Balance</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tableRows.map((row, index) => (
            <TableRow 
              key={`${row.transactionDate}-${index}`}
              sx={{ 
                backgroundColor: index % 2 === 0
                  ? theme.palette.background.paper
                  : theme.palette.action.hover
              }}
            >
              <TableCell>{readableDate(row.transactionDate)}</TableCell>
              <TableCell>{row.reference}</TableCell>
              <TableCell>{row.description}</TableCell>
              <TableCell align="right">
                {row.debit && row.debit !== 0 ? formatBalance(row.debit) : '-'}
              </TableCell>
              <TableCell align="right">
                {row.credit && row.credit !== 0 ? formatBalance(row.credit) : '-'}
              </TableCell>
              <TableCell align="right">{formatBalance(row.balance)}</TableCell>
            </TableRow>
          ))}
          {/* TOTAL row */}
          <TableRow sx={{ backgroundColor: mainColor }}>
            <TableCell colSpan={3} sx={{ color: contrastText, fontWeight: 700, borderBottom: 'none' }}>TOTAL</TableCell>
            <TableCell align="right" sx={{ color: contrastText, fontWeight: 700, borderBottom: 'none' }}>{formatBalance(totalDebits)}</TableCell>
            <TableCell align="right" sx={{ color: contrastText, fontWeight: 700, borderBottom: 'none' }}>{formatBalance(totalCredits)}</TableCell>
            <TableCell sx={{ backgroundColor: mainColor, borderBottom: 'none' }} />
          </TableRow>
        </TableBody>
      </Table>
    </Box>
  ) : null;
};

export default LedgerStatementOnScreen;