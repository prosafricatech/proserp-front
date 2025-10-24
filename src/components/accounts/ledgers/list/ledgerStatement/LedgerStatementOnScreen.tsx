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

interface Ledger {
  id?: number;
  name?: string;
  increasesWith?: 'DR' | 'CR';
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
  ledger?: Ledger;
}

const LedgerStatementOnScreen: React.FC<LedgerStatementOnScreenProps> = ({ 
  transactionsData, 
  authOrganization, 
  ledger 
}) => {
  const theme = useTheme();
  const mainColor = authOrganization.organization.settings?.main_color || "#2113AD";
  const contrastText = authOrganization.organization.settings?.contrast_text || "#FFFFFF";
  const headerColor = theme.type === 'dark' ? '#29f096' : (authOrganization?.organization.settings?.main_color || "#2113AD");

  const totalCredits = transactionsData.transactions.reduce((total, transaction) => total + transaction.credit, 0);
  const totalDebits = transactionsData.transactions.reduce((total, transaction) => total + transaction.debit, 0);
  let cumulativeBalance = 0;

  // Function to format balance and handle -0.00 case
  const formatBalance = (balance: number): string => {
    const formatted = balance.toLocaleString('en-US', { 
      maximumFractionDigits: 2, 
      minimumFractionDigits: 2 
    });
    return formatted === "-0.00" ? "0.00" : formatted;
  };

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
          {transactionsData.transactions.map((transaction, index) => {
            cumulativeBalance +=
              ledger?.increasesWith === 'DR'
                ? transaction.debit - transaction.credit
                : transaction.credit - transaction.debit;

            return (
              <TableRow 
                key={index} 
                sx={{ 
                  backgroundColor: index % 2 === 0 
                    ? theme.palette.background.paper 
                    : theme.palette.action.hover
                }}
              >
                <TableCell>{readableDate(transaction.transactionDate)}</TableCell>
                <TableCell>{transaction.voucherNo || ''} {transaction.reference || ''}</TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell align="right">
                  {transaction.debit !== 0 && formatBalance(transaction.debit)}
                </TableCell>
                <TableCell align="right">
                  {transaction.credit !== 0 && formatBalance(transaction.credit)}
                </TableCell>
                <TableCell align="right">
                  {formatBalance(cumulativeBalance)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  ) : null;
};

export default LedgerStatementOnScreen;