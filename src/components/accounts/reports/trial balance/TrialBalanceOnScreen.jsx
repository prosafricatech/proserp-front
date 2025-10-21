import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { 
  Grid, 
  Typography, 
  Divider, 
  Paper, 
  TableContainer, 
  Table, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody,
  useTheme 
} from '@mui/material';
import React from 'react';

const TrialBalanceOnScreen = ({ reportData, authOrganization, user }) => {
  const theme = useTheme();
  
  if (!reportData) return null;

  const mainColor = authOrganization?.organization.settings?.main_color || "#2113AD";
  const headerColor = theme.type === 'dark' ? '#29f096' : (authOrganization?.organization.settings?.main_color || "#2113AD");
  const contrastText = authOrganization?.organization.settings?.contrast_text || "#FFFFFF";

  const debitLedgers = reportData.ledgers.filter(ledger => ledger.balance.side === 'DR');
  const creditLedgers = reportData.ledgers.filter(ledger => ledger.balance.side === 'CR');
  const nonZeroLedgers = reportData.ledgers.filter(ledger => ledger.balance.amount !== 0);

  const totalDebits = debitLedgers.reduce((total, ledger) => total + ledger.balance.amount, 0);
  const totalCredits = creditLedgers.reduce((total, ledger) => total + ledger.balance.amount, 0);

  return (
    <div>
      <Divider style={{ margin: '20px 0' }} />

      {/* Cost Centers and Printed Information */}
      <Grid container spacing={1}>
        <Grid size={12}>
          <Typography variant="subtitle1" style={{ color: headerColor }}>
            Printed On
          </Typography>
          <Typography variant="body2">
            {readableDate(undefined, true)}
          </Typography>
        </Grid>
      </Grid>

      {/* Ledger Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold' }}>
                S/N
              </TableCell>
              <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold' }}>
                Ledger Name
              </TableCell>
              <TableCell sx={{ backgroundColor: mainColor, color: contrastText, textAlign: 'right', fontWeight: 'bold' }}>
                Debit
              </TableCell>
              <TableCell sx={{ backgroundColor: mainColor, color: contrastText, textAlign: 'right', fontWeight: 'bold' }}>
                Credit
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {nonZeroLedgers.map((ledger, index) => (
              <TableRow 
                key={index} 
                sx={{ 
                  backgroundColor: index % 2 === 0 
                    ? theme.palette.background.paper 
                    : theme.palette.action.hover
                }}
              >
                <TableCell>{index + 1}</TableCell>
                <TableCell>{ledger.name}</TableCell>
                <TableCell sx={{ textAlign: 'right' }}>
                  {ledger.balance.side === 'DR' &&
                    ledger.balance.amount.toLocaleString('en-US', {
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 2,
                    })}
                </TableCell>
                <TableCell sx={{ textAlign: 'right' }}>
                  {ledger.balance.side === 'CR' &&
                    ledger.balance.amount.toLocaleString('en-US', {
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 2,
                    })}
                </TableCell>
              </TableRow>
            ))}
            
            {/* Total Row */}
            <TableRow>
              <TableCell 
                colSpan={2} 
                sx={{ 
                  backgroundColor: mainColor, 
                  color: contrastText,
                  fontWeight: 'bold',
                  borderBottom: 'none'
                }}
              >
                TOTAL
              </TableCell>
              <TableCell 
                sx={{ 
                  backgroundColor: mainColor, 
                  color: contrastText, 
                  textAlign: 'right',
                  fontWeight: 'bold',
                  borderBottom: 'none'
                }}
              >
                {totalDebits.toLocaleString('en-US', {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}
              </TableCell>
              <TableCell 
                sx={{ 
                  backgroundColor: mainColor, 
                  color: contrastText, 
                  textAlign: 'right',
                  fontWeight: 'bold',
                  borderBottom: 'none'
                }}
              >
                {totalCredits.toLocaleString('en-US', {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default TrialBalanceOnScreen;