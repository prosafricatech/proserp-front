'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Divider,
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
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';

interface PayrollRun {
  id: string;
  employee?: {
    first_name: string;
    last_name: string;
    employee_number: string;
  };
  contract?: {
    designation?: {
      title: string;
    };
  };
  basic_salary?: number;
  paye?: number;
  status?: string;
  payroll_period_id?: string;
}

interface PayslipOnScreenProps {
  payrollRun: PayrollRun;
}

function fmt(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const PayslipOnScreen: React.FC<PayslipOnScreenProps> = ({ payrollRun }) => {
  const theme = useTheme();
  const { theme: jumboTheme } = useJumboTheme();
  const mainColor = typeof jumboTheme?.palette?.primary?.main === 'string' 
    ? jumboTheme.palette.primary.main 
    : '#2113AD';

  const name = payrollRun
    ? [payrollRun.employee?.first_name, payrollRun.employee?.last_name]
        .filter(Boolean)
        .join(' ')
    : '';

  const gross = payrollRun?.basic_salary ?? 0;
  const paye = payrollRun?.paye ?? 0;
  const net = gross - paye;

  const earningsRows = [{ label: 'Basic Salary', value: gross }];

  const deductionsRows = [{ label: 'PAYE Tax', value: paye }];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ color: mainColor, fontWeight: 600 }}>
          PAYSLIP
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {name || 'Unknown Employee'}
        </Typography>
        {payrollRun?.employee?.employee_number && (
          <Typography variant="body2" color="text.secondary">
            {payrollRun.employee.employee_number}
            {payrollRun?.contract?.designation?.title ? ` · ${payrollRun.contract.designation.title}` : ''}
          </Typography>
        )}
      </Box>

      {/* Earnings */}
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
        Earnings
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: mainColor }}>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Description</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>
                Amount
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {earningsRows.map(({ label, value }) => (
              <TableRow key={label}>
                <TableCell>{label}</TableCell>
                <TableCell align="right">{fmt(value)}</TableCell>
              </TableRow>
            ))}
            <TableRow
              sx={{
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(33, 19, 173, 0.1)' : 'rgba(33, 19, 173, 0.05)',
              }}
            >
              <TableCell sx={{ fontWeight: 700 }}>Total Earnings</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                {fmt(gross)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Divider sx={{ my: 2 }} />

      {/* Deductions */}
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
        Deductions
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: mainColor }}>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Description</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>
                Amount
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {deductionsRows.map(({ label, value }) => (
              <TableRow key={label}>
                <TableCell>{label}</TableCell>
                <TableCell align="right">{fmt(value)}</TableCell>
              </TableRow>
            ))}
            <TableRow
              sx={{
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(33, 19, 173, 0.1)' : 'rgba(33, 19, 173, 0.05)',
              }}
            >
              <TableCell sx={{ fontWeight: 700 }}>Total Deductions</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                {fmt(paye)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Divider sx={{ my: 2 }} />

      {/* Net Pay */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: mainColor }}>
              <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>Net Pay</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>
                {fmt(net)}
              </TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default PayslipOnScreen;
