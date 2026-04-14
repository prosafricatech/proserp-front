'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  GlobalStyles,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useState } from 'react';
import PDFContent from '@/components/pdf/PDFContent';
import { PayrollRunType } from '../payrollRuns/PayrollRunType';
import { PayslipComputed } from '../payrollRuns/payslipCalculations';
import SalarySheetPDF from './SalarySheetPDF';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';

type SalarySheetRow = {
  run: PayrollRunType;
  computed: PayslipComputed;
};

type SalarySheetDialogProps = {
  open: boolean;
  onClose: () => void;
  periodLabel: string;
  rows: SalarySheetRow[];
};

function fmt(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const findContribution = (computed: PayslipComputed, label: string) => {
  const row = computed.employerContributionRows.find(
    (entry) => entry.label.toLowerCase() === label.toLowerCase()
  );
  return row?.amount || 0;
};

const SalarySheetDialog = ({ open, onClose, periodLabel, rows }: SalarySheetDialogProps) => {
  const authObject = useJumboAuth() as any;
  const [openPdfDialog, setOpenPdfDialog] = useState(false);

    const { theme } = useJumboTheme();
    const smallScreen = useMediaQuery(theme.breakpoints.down('md'));

  const totals = rows.reduce(
    (sum, entry) => {
      const nssfEmployer = findContribution(entry.computed, 'NSSF Employer');
      const sdl = findContribution(entry.computed, 'SDL');

      return {
        basicSalary: sum.basicSalary + entry.computed.basicSalary,
        allowances: sum.allowances + entry.computed.totalAllowances,
        grossSalary: sum.grossSalary + entry.computed.grossSalary,
        otherDeductions: sum.otherDeductions + entry.computed.otherDeductions,
        paye: sum.paye + entry.computed.paye,
        totalDeductions: sum.totalDeductions + entry.computed.totalDeductions,
        netSalary: sum.netSalary + entry.computed.netSalary,
        nssfEmployer: sum.nssfEmployer + nssfEmployer,
        sdl: sum.sdl + sdl,
        totalEmployerCost: sum.totalEmployerCost + entry.computed.totalEmployerCost,
      };
    },
    {
      basicSalary: 0,
      allowances: 0,
      grossSalary: 0,
      otherDeductions: 0,
      paye: 0,
      totalDeductions: 0,
      netSalary: 0,
      nssfEmployer: 0,
      sdl: 0,
      totalEmployerCost: 0,
    }
  );

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth='xl' fullScreen={smallScreen}>
        <DialogTitle>
          <Stack direction='row' justifyContent='space-between' alignItems='center'>
            <Box>
              <Typography variant='h6'>
                {authObject?.authOrganization?.organization?.name || 'Company'}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Salary Payroll - {periodLabel}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Box id='salary-sheet-print-area'>
            <TableContainer>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>S/N</TableCell>
                    <TableCell>Employee</TableCell>
                    <TableCell>Employee No.</TableCell>
                    <TableCell>Designation</TableCell>
                    <TableCell align='right'>Basic</TableCell>
                    <TableCell align='right'>Allowances</TableCell>
                    <TableCell align='right'>Gross</TableCell>
                    <TableCell align='right'>PAYE</TableCell>
                    <TableCell align='right'>Other Deductions</TableCell>
                    <TableCell align='right'>Total Deductions</TableCell>
                    <TableCell align='right'>Net Pay</TableCell>
                    <TableCell align='right'>NSSF Employer</TableCell>
                    <TableCell align='right'>SDL</TableCell>
                    <TableCell align='right'>Employer Cost</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((entry, index) => {
                    const name = [entry.run.employee?.first_name, entry.run.employee?.last_name]
                      .filter(Boolean)
                      .join(' ');

                    return (
                      <TableRow key={entry.run.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{name || '-'}</TableCell>
                        <TableCell>{entry.run.employee?.employee_number || '-'}</TableCell>
                        <TableCell>{entry.run.contract?.designation?.title || '-'}</TableCell>
                        <TableCell align='right'>{fmt(entry.computed.basicSalary)}</TableCell>
                        <TableCell align='right'>{fmt(entry.computed.totalAllowances)}</TableCell>
                        <TableCell align='right'>{fmt(entry.computed.grossSalary)}</TableCell>
                        <TableCell align='right'>{fmt(entry.computed.paye)}</TableCell>
                        <TableCell align='right'>{fmt(entry.computed.otherDeductions)}</TableCell>
                        <TableCell align='right'>{fmt(entry.computed.totalDeductions)}</TableCell>
                        <TableCell align='right'>{fmt(entry.computed.netSalary)}</TableCell>
                        <TableCell align='right'>{fmt(findContribution(entry.computed, 'NSSF Employer'))}</TableCell>
                        <TableCell align='right'>{fmt(findContribution(entry.computed, 'SDL'))}</TableCell>
                        <TableCell align='right'>{fmt(entry.computed.totalEmployerCost)}</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow>
                    <TableCell colSpan={4} sx={{ fontWeight: 700, borderTop: '2px solid', borderColor: 'divider' }}>
                      TOTALS
                    </TableCell>
                    <TableCell align='right' sx={{ fontWeight: 700, borderTop: '2px solid', borderColor: 'divider' }}>{fmt(totals.basicSalary)}</TableCell>
                    <TableCell align='right' sx={{ fontWeight: 700, borderTop: '2px solid', borderColor: 'divider' }}>{fmt(totals.allowances)}</TableCell>
                    <TableCell align='right' sx={{ fontWeight: 700, borderTop: '2px solid', borderColor: 'divider' }}>{fmt(totals.grossSalary)}</TableCell>
                    <TableCell align='right' sx={{ fontWeight: 700, borderTop: '2px solid', borderColor: 'divider' }}>{fmt(totals.paye)}</TableCell>
                    <TableCell align='right' sx={{ fontWeight: 700, borderTop: '2px solid', borderColor: 'divider' }}>{fmt(totals.otherDeductions)}</TableCell>
                    <TableCell align='right' sx={{ fontWeight: 700, borderTop: '2px solid', borderColor: 'divider' }}>{fmt(totals.totalDeductions)}</TableCell>
                    <TableCell align='right' sx={{ fontWeight: 700, borderTop: '2px solid', borderColor: 'divider' }}>{fmt(totals.netSalary)}</TableCell>
                    <TableCell align='right' sx={{ fontWeight: 700, borderTop: '2px solid', borderColor: 'divider' }}>{fmt(totals.nssfEmployer)}</TableCell>
                    <TableCell align='right' sx={{ fontWeight: 700, borderTop: '2px solid', borderColor: 'divider' }}>{fmt(totals.sdl)}</TableCell>
                    <TableCell align='right' sx={{ fontWeight: 700, borderTop: '2px solid', borderColor: 'divider' }}>{fmt(totals.totalEmployerCost)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Box className='salary-sheet-print-footer' sx={{ display: 'none', mt: 4 }}>
              <Typography variant='body2'>
                Prepared by: _______________________    Approved by: _______________________    Date: ___________
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant='outlined' onClick={() => setOpenPdfDialog(true)}>
            Print
          </Button>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openPdfDialog} onClose={() => setOpenPdfDialog(false)} fullWidth maxWidth='xl'>
        <DialogContent>
          <PDFContent
            document={
              <SalarySheetPDF
                organization={authObject?.authOrganization?.organization}
                periodLabel={periodLabel}
                rows={rows}
              />
            }
            fileName={`Salary-Sheet-${periodLabel}`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPdfDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SalarySheetDialog;