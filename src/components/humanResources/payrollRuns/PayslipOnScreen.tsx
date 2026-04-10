'use client';

import React from 'react';
import {
  Box,
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
import { getPayslipCalculations } from './payslipCalculations';

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

  const {
    paye,
    earningsRows,
    deductionRows,
    grossSalary,
    preTaxDeductions,
    taxableIncome,
    otherDeductions,
    totalDeductions,
    netSalary,
  } = getPayslipCalculations(payrollRun);

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
            {earningsRows.map(({ label, amount, taxable }) => (
              <TableRow key={label}>
                <TableCell>
                  {label}
                  {!taxable && ' (non-taxable)'}
                </TableCell>
                <TableCell align="right">{fmt(amount)}</TableCell>
              </TableRow>
            ))}
            <TableRow
              sx={{
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(33, 19, 173, 0.1)' : 'rgba(33, 19, 173, 0.05)',
              }}
            >
              <TableCell sx={{ fontWeight: 700 }}>Total Earnings</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                {fmt(grossSalary)}
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
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Category</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>
                Amount
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>PAYE</TableCell>
              <TableCell>Tax</TableCell>
              <TableCell align="right">{fmt(paye)}</TableCell>
            </TableRow>
            {deductionRows.map(({ label, category, amount }) => (
              <TableRow key={`${label}-${category}`}>
                <TableCell>{label}</TableCell>
                <TableCell sx={{ textTransform: 'capitalize' }}>{category}</TableCell>
                <TableCell align="right">{fmt(amount)}</TableCell>
              </TableRow>
            ))}
            <TableRow
              sx={{
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(33, 19, 173, 0.1)' : 'rgba(33, 19, 173, 0.05)',
              }}
            >
              <TableCell sx={{ fontWeight: 700 }}>Total Deductions</TableCell>
              <TableCell />
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                {fmt(totalDeductions)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Divider sx={{ my: 2 }} />

      {/* Net Pay Summary */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell>Gross Salary</TableCell>
              <TableCell align="right">{fmt(grossSalary)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Pre-Tax Deductions</TableCell>
              <TableCell align="right">- {fmt(preTaxDeductions)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Taxable Income</TableCell>
              <TableCell align="right">{fmt(taxableIncome)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>PAYE</TableCell>
              <TableCell align="right">- {fmt(paye)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Other Deductions</TableCell>
              <TableCell align="right">- {fmt(otherDeductions)}</TableCell>
            </TableRow>
            <TableRow sx={{ backgroundColor: mainColor }}>
              <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>Net Salary</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>
                {fmt(netSalary)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default PayslipOnScreen;
