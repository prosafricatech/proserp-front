// components/humanResources/payrollRuns/PayrollRunDialogs.tsx
'use client';

import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Card,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
} from '@mui/material';
import { formatMoney, getEmployeeName } from './payrollUtils';

interface SimulationDialogProps {
  open: boolean;
  onClose: () => void;
  data: any;
}

export const SimulationDialog = ({ open, onClose, data }: SimulationDialogProps) => {
  const simulationRow = data?.row || data?.data?.row || data;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ textAlign: 'center' }}>
        <Typography variant="h5" component="div">Employee Simulation</Typography>
        <Typography variant="body2" color="text.secondary" component="div">
          {simulationRow?.employee?.name || 'Employee'} - Simulated Payslip
        </Typography>
      </DialogTitle>
      <DialogContent>
        {simulationRow ? (
          <Grid container spacing={2}>
            <Grid size={12}>
                <Grid container spacing={2}>
                    <Grid size={6}>
                        <Typography variant="caption" color="text.secondary">Basic Salary</Typography>
                        <Typography variant="h6">{formatMoney(simulationRow.basic_salary)}</Typography>
                    </Grid>
                    <Grid size={6}>
                        <Typography variant="caption" color="text.secondary">Gross Salary</Typography>
                        <Typography variant="h6">{formatMoney(simulationRow.gross_salary)}</Typography>
                    </Grid>
                    <Grid size={6}>
                        <Typography variant="caption" color="text.secondary">Total Allowances</Typography>
                        <Typography variant="h6">{formatMoney(simulationRow.total_allowances || 0)}</Typography>
                    </Grid>
                    <Grid size={6}>
                        <Typography variant="caption" color="text.secondary">Total Deductions</Typography>
                        <Typography variant="h6">{formatMoney(simulationRow.total_deductions || 0)}</Typography>
                    </Grid>
                    <Grid size={6}>
                        <Typography variant="caption" color="text.secondary">PAYE</Typography>
                        <Typography variant="h6" color="error.main">{formatMoney(simulationRow.paye || 0)}</Typography>
                    </Grid>
                    <Grid size={6}>
                        <Typography variant="caption" color="text.secondary">Net Pay</Typography>
                        <Typography variant="h6" color="success.main">{formatMoney(simulationRow.net_salary)}</Typography>
                    </Grid>
                </Grid>
            </Grid>
            {simulationRow.allowances?.length > 0 && (
              <Grid size={12}>
                <Typography variant="subtitle2" gutterBottom>Allowances</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow><TableCell>Label</TableCell><TableCell align="right">Amount</TableCell></TableRow>
                    </TableHead>
                    <TableBody>
                      {simulationRow.allowances.map((item: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>{item.label}</TableCell>
                          <TableCell align="right">{formatMoney(item.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            )}
            {simulationRow.deductions?.length > 0 && (
              <Grid size={12}>
                <Typography variant="subtitle2" gutterBottom>Deductions</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow><TableCell>Label</TableCell><TableCell align="right">Amount</TableCell></TableRow>
                    </TableHead>
                    <TableBody>
                      {simulationRow.deductions.map((item: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>{item.label}</TableCell>
                          <TableCell align="right">{formatMoney(item.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            )}
          </Grid>
        ) : (
          <Alert severity="warning">No simulation data available</Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

interface PayslipViewDialogProps {
  open: boolean;
  onClose: () => void;
  payslip: any;
}

export const PayslipViewDialog = ({ open, onClose, payslip }: PayslipViewDialogProps) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ textAlign: 'center' }}>
        <Typography variant="h5" component="div">Payslip Details</Typography>
        <Typography variant="body2" color="text.secondary" component="div">
          {payslip ? getEmployeeName(payslip.employee || payslip) : 'Employee'}
        </Typography>
      </DialogTitle>
      <DialogContent>
        {payslip ? (
          <Grid container spacing={2}>
            <Grid size={12}>
                <Grid container spacing={2}>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary">Employee</Typography>
                    <Typography variant="body2">{getEmployeeName(payslip.employee || payslip)}</Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary">Employee Number</Typography>
                    <Typography variant="body2">{(payslip.employee?.employee_number || payslip.employee_number) || 'N/A'}</Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary">Basic Salary</Typography>
                    <Typography variant="h6">{formatMoney(payslip.basic_salary || 0)}</Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary">Gross Salary</Typography>
                    <Typography variant="h6">{formatMoney(payslip.gross_salary || 0)}</Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary">Total Allowances</Typography>
                    <Typography variant="h6">{formatMoney(payslip.total_allowances || 0)}</Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary">Total Deductions</Typography>
                    <Typography variant="h6">{formatMoney(payslip.total_deductions || 0)}</Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary">PAYE</Typography>
                    <Typography variant="h6" color="error.main">{formatMoney(payslip.paye || 0)}</Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary">Net Pay</Typography>
                    <Typography variant="h6" color="success.main">{formatMoney(payslip.net_salary || 0)}</Typography>
                  </Grid>
                </Grid>
            </Grid>
            {payslip.allowances?.length > 0 && (
              <Grid size={12}>
                <Typography variant="subtitle2" gutterBottom textAlign={'center'}>Allowances</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow><TableCell>Label</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                    </TableHead>
                    <TableBody>
                      {payslip.allowances.map((item: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>{item.label}</TableCell>
                          <TableCell align="right">{formatMoney(item.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            )}
            {payslip.deductions?.length > 0 && (
              <Grid size={12}>
                <Typography variant="subtitle2" gutterBottom textAlign={'center'}>Deductions</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow><TableCell>Label</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                    </TableHead>
                    <TableBody>
                      {payslip.deductions.map((item: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>{item.label}</TableCell>
                          <TableCell align="right">{formatMoney(item.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            )}
            {payslip.employer_contributions?.length > 0 && (
              <Grid size={12}>
                <Typography variant="subtitle2" gutterBottom textAlign={'center'}>Employer Contributions</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead><TableRow><TableCell>Label</TableCell><TableCell align="right">Amount</TableCell></TableRow></TableHead>
                    <TableBody>
                      {payslip.employer_contributions.map((item: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>{item.label}</TableCell>
                          <TableCell align="right">{formatMoney(item.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            )}
          </Grid>
        ) : (
          <Alert severity="warning">No payslip data available</Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};