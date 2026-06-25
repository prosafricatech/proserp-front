// payrollPeriods/SalarySheetDialog.tsx
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
  Alert,
  CircularProgress,
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
  isLoading?: boolean;
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

// ✅ Fixed: Safely get employee name
function getEmployeeName(run: PayrollRunType) {
  if (!run.employee) return 'Unknown Employee';
  
  // Use type assertion to safely access name if it exists
  const employee = run.employee as any;
  if (employee.name) return employee.name;
  
  const firstName = run.employee.first_name || '';
  const lastName = run.employee.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || 'Unknown Employee';
}

// ✅ Fixed: Safely get employee number
function getEmployeeNumber(run: PayrollRunType) {
  return run.employee?.employee_number || '-';
}

// ✅ Fixed: Safely get designation
function getDesignation(run: PayrollRunType) {
  // Check contract designation first
  if (run.contract?.designation?.title) {
    return run.contract.designation.title;
  }
  // Check if there's a direct designation property (some preview data might have it)
  if ((run as any).designation) {
    return (run as any).designation;
  }
  return '-';
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
  isLoading = false,
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
      const run = entry.run;
      const computed = entry.computed;

      const allowanceByType = allowanceTypes.map((type) =>
        sumAllowanceByType(run, type)
      );
      const preTaxDeductionByType = preTaxDeductionTypes.map((type) =>
        sumDeductionByType(run, type)
      );
      const postTaxDeductionByType = postTaxDeductionTypes.map((type) =>
        sumDeductionByType(run, type)
      );
      const contributionByType = contributionTypes.map((type) =>
        sumContributionByType(run, type)
      );

      return {
        basicSalary: sum.basicSalary + computed.basicSalary,
        grossSalary: sum.grossSalary + computed.grossSalary,
        taxableSalary: sum.taxableSalary + computed.taxableIncome,
        paye: sum.paye + computed.paye,
        totalDeductions: sum.totalDeductions + computed.totalDeductions,
        netSalary: sum.netSalary + computed.netSalary,
        totalEmployerContributions:
          sum.totalEmployerContributions +
          computed.totalEmployerContributions,
        totalEmployerCost:
          sum.totalEmployerCost + computed.totalEmployerCost,
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

  const exportedRows = rows.map((entry) => ({
    run: entry.run,
    computed: entry.computed,
  }));

  const exportedData = {
    organization: authObject?.authOrganization?.organization,
    periodLabel: periodLabel,
    rows: exportedRows,
    allowanceTypes: allowanceTypes,
    deductionTypes: deductionTypes,
    contributionTypes: contributionTypes,
  };

  const handleExcelExport = async (exportedData: any) => {
    try {
      setIsExporting(true);
      const blob =
        await humanResourcesServices.ExportPayrollToExcel(exportedData);

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
          {isLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={8}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                Generating salary sheet...
              </Typography>
            </Box>
          ) : rows.length === 0 ? (
            <Alert severity="info">
              No employees found for this payroll run.
            </Alert>
          ) : (
            <TableContainer>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>S/N</TableCell>
                    <TableCell>Employee</TableCell>
                    <TableCell>Employee No.</TableCell>
                    <TableCell>Designation</TableCell>
                    <TableCell align='right'>Basic</TableCell>
                    {allowanceTypes.map((type, idx) => (
                      <TableCell
                        key={`allowance-header-${type.id || type.name}-${idx}`}
                        align='right'
                      >
                        {type.name || 'Allowance'}
                      </TableCell>
                    ))}
                    <TableCell align='right'>Gross</TableCell>
                    {preTaxDeductionTypes.map((type, idx) => (
                      <TableCell
                        key={`pre-tax-header-${type.id || type.name}-${idx}`}
                        align='right'
                      >
                        {fmtTypeLabel(type, 'Pre-Tax Deduction')}
                      </TableCell>
                    ))}
                    <TableCell align='right'>Taxable Salary</TableCell>
                    <TableCell align='right'>PAYE</TableCell>
                    {postTaxDeductionTypes.map((type, idx) => (
                      <TableCell
                        key={`post-tax-header-${type.id || type.name}-${idx}`}
                        align='right'
                      >
                        {fmtTypeLabel(type, 'Post-Tax Deduction')}
                      </TableCell>
                    ))}
                    <TableCell align='right'>Total Deductions</TableCell>
                    <TableCell align='right'>Net Payable</TableCell>
                    {contributionTypes.map((type, idx) => (
                      <TableCell
                        key={`contribution-header-${type.id || type.name}-${idx}`}
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
                    const run = entry.run;
                    const computed = entry.computed;
                    const name = getEmployeeName(run);
                    const employeeNumber = getEmployeeNumber(run);
                    const designation = getDesignation(run);

                    return (
                      <TableRow key={`salary-row-${run.id || index}-${index}`}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{name}</TableCell>
                        <TableCell>{employeeNumber}</TableCell>
                        <TableCell>{designation}</TableCell>
                        <TableCell align='right'>
                          {fmt(computed.basicSalary)}
                        </TableCell>

                        {allowanceTypes.map((type, typeIdx) => (
                          <TableCell
                            key={`allowance-value-${run.id || index}-${type.id || type.name}-${typeIdx}`}
                            align='right'
                          >
                            {fmt(sumAllowanceByType(run, type))}
                          </TableCell>
                        ))}

                        <TableCell align='right'>
                          {fmt(computed.grossSalary)}
                        </TableCell>

                        {preTaxDeductionTypes.map((type, typeIdx) => (
                          <TableCell
                            key={`pre-tax-value-${run.id || index}-${type.id || type.name}-${typeIdx}`}
                            align='right'
                          >
                            {fmt(sumDeductionByType(run, type))}
                          </TableCell>
                        ))}

                        <TableCell align='right'>
                          {fmt(computed.taxableIncome)}
                        </TableCell>
                        <TableCell align='right'>
                          {fmt(computed.paye)}
                        </TableCell>

                        {postTaxDeductionTypes.map((type, typeIdx) => (
                          <TableCell
                            key={`post-tax-value-${run.id || index}-${type.id || type.name}-${typeIdx}`}
                            align='right'
                          >
                            {fmt(sumDeductionByType(run, type))}
                          </TableCell>
                        ))}

                        <TableCell align='right'>
                          {fmt(computed.totalDeductions)}
                        </TableCell>
                        <TableCell align='right'>
                          {fmt(computed.netSalary)}
                        </TableCell>

                        {contributionTypes.map((type, typeIdx) => (
                          <TableCell
                            key={`contribution-value-${run.id || index}-${type.id || type.name}-${typeIdx}`}
                            align='right'
                          >
                            {fmt(sumContributionByType(run, type))}
                          </TableCell>
                        ))}

                        <TableCell align='right'>
                          {fmt(computed.totalEmployerContributions)}
                        </TableCell>
                        <TableCell align='right'>
                          {fmt(computed.totalEmployerCost)}
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

                    {totals.allowanceByType.map((amount, idx) => (
                      <TableCell
                        key={`allowance-total-${idx}`}
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

                    {totals.preTaxDeductionByType.map((amount, idx) => (
                      <TableCell
                        key={`pre-tax-total-${idx}`}
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

                    {totals.postTaxDeductionByType.map((amount, idx) => (
                      <TableCell
                        key={`post-tax-total-${idx}`}
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

                    {totals.contributionByType.map((amount, idx) => (
                      <TableCell
                        key={`contribution-total-${idx}`}
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
          )}
        </DialogContent>

        <DialogActions>
          <Button 
            variant='outlined' 
            onClick={() => setOpenPdfDialog(true)} 
            disabled={rows.length === 0 || isLoading}
          >
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
                rows={exportedRows}
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
            disabled={isExporting || rows.length === 0 || isLoading}
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