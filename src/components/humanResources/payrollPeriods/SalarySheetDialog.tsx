'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import PDFContent from '@/components/pdf/PDFContent';
import { faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import humanResourcesServices from '../humanResourcesServices';
import { PayrollRunType } from '../payrollRuns/PayrollRunType';
import { PayslipComputed } from '../payrollRuns/payslipCalculations';
import SalarySheetPDF from './SalarySheetPDF';

type SalaryTypeItem = {
  id?: number;
  name?: string;
  category?: string;
  is_pre_tax?: boolean;
  computation_method?:
    | 'fixed'
    | 'percentage_of_basic'
    | 'percentage_of_gross'
    | string;
  default_value?: number;
};

type SalarySheetRow = {
  run: PayrollRunType;
  computed: PayslipComputed;
};

type SalarySheetDialogProps = {
  open: boolean;
  onClose: () => void;
  periodLabel: string;
  rows: SalarySheetRow[];
  allowanceTypes: SalaryTypeItem[];
  deductionTypes: SalaryTypeItem[];
  contributionTypes: SalaryTypeItem[];
};

function fmt(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtTypeLabel(type: SalaryTypeItem, fallback: string) {
  const name = type.name || fallback;
  const raw = Number(type.default_value ?? 0);
  if (!Number.isFinite(raw) || raw <= 0) return name;

  const isPercentage = String(type.computation_method || '').startsWith(
    'percentage'
  );
  const valueText = isPercentage
    ? `${raw.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`
    : raw.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

  return `${name} (${valueText})`;
}

function toNumber(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function slug(text: string) {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function sumAllowanceByType(run: PayrollRunType, type: SalaryTypeItem) {
  const targetId = type.id;
  const targetName = slug(type.name || '');

  return (run.allowances || []).reduce((sum, item) => {
    const byId = targetId != null && item.allowance_type_id === targetId;
    const byName =
      targetName &&
      slug(item.allowance_type?.name || item.label || '') === targetName;
    if (!byId && !byName) return sum;
    return sum + toNumber(item.amount ?? item.value);
  }, 0);
}

function sumDeductionByType(run: PayrollRunType, type: SalaryTypeItem) {
  const targetId = type.id;
  const targetName = slug(type.name || '');

  return (run.deductions || []).reduce((sum, item) => {
    const byId = targetId != null && item.deduction_type_id === targetId;
    const byName =
      targetName &&
      slug(item.deduction_type?.name || item.label || '') === targetName;
    if (!byId && !byName) return sum;
    return sum + toNumber(item.amount ?? item.value);
  }, 0);
}

function sumContributionByType(run: PayrollRunType, type: SalaryTypeItem) {
  const targetId = type.id;
  const targetName = slug(type.name || '');

  return (run.employer_contributions || []).reduce((sum, item) => {
    const byId =
      targetId != null && item.employer_contribution_type_id === targetId;
    const byName =
      targetName &&
      slug(item.contribution_type?.name || item.label || '') === targetName;
    if (!byId && !byName) return sum;
    return sum + toNumber(item.amount ?? item.value);
  }, 0);
}

const SalarySheetDialog = ({
  open,
  onClose,
  periodLabel,
  rows,
  allowanceTypes,
  deductionTypes,
  contributionTypes,
}: SalarySheetDialogProps) => {
  const authObject = useJumboAuth() as any;
  const [openPdfDialog, setOpenPdfDialog] = useState(false);
  const { theme } = useJumboTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down('md'));

  const [isExporting, setIsExporting] = useState(false);

  const preTaxDeductionTypes = deductionTypes.filter((type) =>
    Boolean(type.is_pre_tax)
  );
  const postTaxDeductionTypes = deductionTypes.filter(
    (type) => !type.is_pre_tax
  );

  const totals = rows.reduce(
    (sum, entry) => {
      const allowanceByType = allowanceTypes.map((type) =>
        sumAllowanceByType(entry.run, type)
      );
      const preTaxDeductionByType = preTaxDeductionTypes.map((type) =>
        sumDeductionByType(entry.run, type)
      );
      const postTaxDeductionByType = postTaxDeductionTypes.map((type) =>
        sumDeductionByType(entry.run, type)
      );
      const contributionByType = contributionTypes.map((type) =>
        sumContributionByType(entry.run, type)
      );

      return {
        basicSalary: sum.basicSalary + entry.computed.basicSalary,
        grossSalary: sum.grossSalary + entry.computed.grossSalary,
        taxableSalary: sum.taxableSalary + entry.computed.taxableIncome,
        paye: sum.paye + entry.computed.paye,
        totalDeductions: sum.totalDeductions + entry.computed.totalDeductions,
        netSalary: sum.netSalary + entry.computed.netSalary,
        totalEmployerContributions:
          sum.totalEmployerContributions +
          entry.computed.totalEmployerContributions,
        totalEmployerCost:
          sum.totalEmployerCost + entry.computed.totalEmployerCost,
        allowanceByType: sum.allowanceByType.map(
          (value, index) => value + allowanceByType[index]
        ),
        preTaxDeductionByType: sum.preTaxDeductionByType.map(
          (value, index) => value + preTaxDeductionByType[index]
        ),
        postTaxDeductionByType: sum.postTaxDeductionByType.map(
          (value, index) => value + postTaxDeductionByType[index]
        ),
        contributionByType: sum.contributionByType.map(
          (value, index) => value + contributionByType[index]
        ),
      };
    },
    {
      basicSalary: 0,
      grossSalary: 0,
      taxableSalary: 0,
      paye: 0,
      totalDeductions: 0,
      netSalary: 0,
      totalEmployerContributions: 0,
      totalEmployerCost: 0,
      allowanceByType: allowanceTypes.map(() => 0),
      preTaxDeductionByType: preTaxDeductionTypes.map(() => 0),
      postTaxDeductionByType: postTaxDeductionTypes.map(() => 0),
      contributionByType: contributionTypes.map(() => 0),
    }
  );

  const downloadFileName = `Salary-Sheet-${periodLabel}`;

  const exportedData = {
    organization: authObject?.authOrganization?.organization,
    periodLabel: periodLabel,
    rows: rows,
    allowanceTypes: allowanceTypes,
    deductionTypes: deductionTypes,
    contributionTypes: contributionTypes,
  };

  const handleExcelExport = async (exportedData: any) => {
    try {
      setIsExporting(true);
      const blob =
        await humanResourcesServices.ExportPayrollToExcel(exportedData);
      // console.log('blob: ', blob);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${downloadFileName}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      setIsExporting(false);
    } catch (e: any) {
      console.log('error exporting excel: ', e);
      setIsExporting(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth='xl'
        fullScreen={smallScreen}
      >
        <DialogTitle>
          <Stack
            direction='row'
            justifyContent='space-between'
            alignItems='center'
          >
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
          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>S/N</TableCell>
                  <TableCell>Employee</TableCell>
                  <TableCell>Employee No.</TableCell>
                  <TableCell>Designation</TableCell>
                  <TableCell align='right'>Basic</TableCell>
                  {allowanceTypes.map((type) => (
                    <TableCell
                      key={`allowance-${type.id || type.name}`}
                      align='right'
                    >
                      {type.name || 'Allowance'}
                    </TableCell>
                  ))}
                  <TableCell align='right'>Gross</TableCell>
                  {preTaxDeductionTypes.map((type) => (
                    <TableCell
                      key={`pre-tax-deduction-${type.id || type.name}`}
                      align='right'
                    >
                      {fmtTypeLabel(type, 'Pre-Tax Deduction')}
                    </TableCell>
                  ))}
                  <TableCell align='right'>Taxable Salary</TableCell>
                  <TableCell align='right'>PAYE</TableCell>
                  {postTaxDeductionTypes.map((type) => (
                    <TableCell
                      key={`post-tax-deduction-${type.id || type.name}`}
                      align='right'
                    >
                      {fmtTypeLabel(type, 'Post-Tax Deduction')}
                    </TableCell>
                  ))}
                  <TableCell align='right'>Total Deductions</TableCell>
                  <TableCell align='right'>Net Payable</TableCell>
                  {contributionTypes.map((type) => (
                    <TableCell
                      key={`contribution-${type.id || type.name}`}
                      align='right'
                    >
                      {fmtTypeLabel(type, 'Contribution')}
                    </TableCell>
                  ))}
                  <TableCell align='right'>Total Employer Contrib.</TableCell>
                  <TableCell align='right'>Employer Cost</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.map((entry, index) => {
                  const name = [
                    entry.run.employee?.first_name,
                    entry.run.employee?.last_name,
                  ]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <TableRow key={entry.run.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{name || '-'}</TableCell>
                      <TableCell>
                        {entry.run.employee?.employee_number || '-'}
                      </TableCell>
                      <TableCell>
                        {entry.run.contract?.designation?.title || '-'}
                      </TableCell>
                      <TableCell align='right'>
                        {fmt(entry.computed.basicSalary)}
                      </TableCell>

                      {allowanceTypes.map((type) => (
                        <TableCell
                          key={`allowance-value-${entry.run.id}-${type.id || type.name}`}
                          align='right'
                        >
                          {fmt(sumAllowanceByType(entry.run, type))}
                        </TableCell>
                      ))}

                      <TableCell align='right'>
                        {fmt(entry.computed.grossSalary)}
                      </TableCell>

                      {preTaxDeductionTypes.map((type) => (
                        <TableCell
                          key={`pre-tax-deduction-value-${entry.run.id}-${type.id || type.name}`}
                          align='right'
                        >
                          {fmt(sumDeductionByType(entry.run, type))}
                        </TableCell>
                      ))}

                      <TableCell align='right'>
                        {fmt(entry.computed.taxableIncome)}
                      </TableCell>
                      <TableCell align='right'>
                        {fmt(entry.computed.paye)}
                      </TableCell>

                      {postTaxDeductionTypes.map((type) => (
                        <TableCell
                          key={`post-tax-deduction-value-${entry.run.id}-${type.id || type.name}`}
                          align='right'
                        >
                          {fmt(sumDeductionByType(entry.run, type))}
                        </TableCell>
                      ))}

                      <TableCell align='right'>
                        {fmt(entry.computed.totalDeductions)}
                      </TableCell>
                      <TableCell align='right'>
                        {fmt(entry.computed.netSalary)}
                      </TableCell>

                      {contributionTypes.map((type) => (
                        <TableCell
                          key={`contribution-value-${entry.run.id}-${type.id || type.name}`}
                          align='right'
                        >
                          {fmt(sumContributionByType(entry.run, type))}
                        </TableCell>
                      ))}

                      <TableCell align='right'>
                        {fmt(entry.computed.totalEmployerContributions)}
                      </TableCell>
                      <TableCell align='right'>
                        {fmt(entry.computed.totalEmployerCost)}
                      </TableCell>
                    </TableRow>
                  );
                })}

                <TableRow>
                  <TableCell
                    colSpan={4}
                    sx={{
                      fontWeight: 700,
                      borderTop: '2px solid',
                      borderColor: 'divider',
                    }}
                  >
                    TOTALS
                  </TableCell>
                  <TableCell
                    align='right'
                    sx={{
                      fontWeight: 700,
                      borderTop: '2px solid',
                      borderColor: 'divider',
                    }}
                  >
                    {fmt(totals.basicSalary)}
                  </TableCell>

                  {totals.allowanceByType.map((amount, index) => (
                    <TableCell
                      key={`allowance-total-${index}`}
                      align='right'
                      sx={{
                        fontWeight: 700,
                        borderTop: '2px solid',
                        borderColor: 'divider',
                      }}
                    >
                      {fmt(amount)}
                    </TableCell>
                  ))}

                  <TableCell
                    align='right'
                    sx={{
                      fontWeight: 700,
                      borderTop: '2px solid',
                      borderColor: 'divider',
                    }}
                  >
                    {fmt(totals.grossSalary)}
                  </TableCell>

                  {totals.preTaxDeductionByType.map((amount, index) => (
                    <TableCell
                      key={`pre-tax-deduction-total-${index}`}
                      align='right'
                      sx={{
                        fontWeight: 700,
                        borderTop: '2px solid',
                        borderColor: 'divider',
                      }}
                    >
                      {fmt(amount)}
                    </TableCell>
                  ))}

                  <TableCell
                    align='right'
                    sx={{
                      fontWeight: 700,
                      borderTop: '2px solid',
                      borderColor: 'divider',
                    }}
                  >
                    {fmt(totals.taxableSalary)}
                  </TableCell>
                  <TableCell
                    align='right'
                    sx={{
                      fontWeight: 700,
                      borderTop: '2px solid',
                      borderColor: 'divider',
                    }}
                  >
                    {fmt(totals.paye)}
                  </TableCell>

                  {totals.postTaxDeductionByType.map((amount, index) => (
                    <TableCell
                      key={`post-tax-deduction-total-${index}`}
                      align='right'
                      sx={{
                        fontWeight: 700,
                        borderTop: '2px solid',
                        borderColor: 'divider',
                      }}
                    >
                      {fmt(amount)}
                    </TableCell>
                  ))}

                  <TableCell
                    align='right'
                    sx={{
                      fontWeight: 700,
                      borderTop: '2px solid',
                      borderColor: 'divider',
                    }}
                  >
                    {fmt(totals.totalDeductions)}
                  </TableCell>
                  <TableCell
                    align='right'
                    sx={{
                      fontWeight: 700,
                      borderTop: '2px solid',
                      borderColor: 'divider',
                    }}
                  >
                    {fmt(totals.netSalary)}
                  </TableCell>

                  {totals.contributionByType.map((amount, index) => (
                    <TableCell
                      key={`contribution-total-${index}`}
                      align='right'
                      sx={{
                        fontWeight: 700,
                        borderTop: '2px solid',
                        borderColor: 'divider',
                      }}
                    >
                      {fmt(amount)}
                    </TableCell>
                  ))}

                  <TableCell
                    align='right'
                    sx={{
                      fontWeight: 700,
                      borderTop: '2px solid',
                      borderColor: 'divider',
                    }}
                  >
                    {fmt(totals.totalEmployerContributions)}
                  </TableCell>
                  <TableCell
                    align='right'
                    sx={{
                      fontWeight: 700,
                      borderTop: '2px solid',
                      borderColor: 'divider',
                    }}
                  >
                    {fmt(totals.totalEmployerCost)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>

        <DialogActions>
          <Button variant='outlined' onClick={() => setOpenPdfDialog(true)}>
            Print
          </Button>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openPdfDialog}
        onClose={() => setOpenPdfDialog(false)}
        fullWidth
        maxWidth='xl'
      >
        <DialogContent>
          <PDFContent
            document={
              <SalarySheetPDF
                organization={authObject?.authOrganization?.organization}
                periodLabel={periodLabel}
                rows={rows}
                allowanceTypes={allowanceTypes}
                deductionTypes={deductionTypes}
                contributionTypes={contributionTypes}
              />
            }
            fileName={`Salary-Sheet-${periodLabel}`}
          />
        </DialogContent>
        <DialogActions>
          <LoadingButton
            size='small'
            onClick={() => handleExcelExport(exportedData)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
              gap: 1,
            }}
            color='success'
            variant='contained'
            disabled={isExporting}
            loading={isExporting}
          >
            <FontAwesomeIcon icon={faFileExcel} color='green' /> Excel
          </LoadingButton>
          <Button onClick={() => setOpenPdfDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SalarySheetDialog;
