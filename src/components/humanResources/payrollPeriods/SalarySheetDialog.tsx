// payrollPeriods/SalarySheetDialog.tsx
'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import PDFContent from '@/components/pdf/PDFContent';
import { faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
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
  useTheme,
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

function getEmployeeName(run: PayrollRunType) {
  if (!run.employee) return '';
  const employee = run.employee as any;
  if (employee.name) return employee.name;
  const firstName = run.employee.first_name || '';
  const lastName = run.employee.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName;
}

function getEmployeeNumber(run: PayrollRunType) {
  return run.employee?.employee_number;
}

function getDesignation(run: PayrollRunType) {
  if (run.contract?.designation?.title) {
    return run.contract.designation.title;
  }
  if ((run as any).designation) {
    return (run as any).designation;
  }
  if ((run as any).employee?.designation) {
    return (run as any).employee?.designation;
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
  const theme = useTheme();
  const [openPdfDialog, setOpenPdfDialog] = useState(false);
  const { theme: jumboTheme } = useJumboTheme();
  const smallScreen = useMediaQuery(jumboTheme.breakpoints.down('md'));

  console.log('rows: ', rows);

  const [isExporting, setIsExporting] = useState(false);

  const organization = authObject?.authOrganization?.organization;

  const preTaxDeductionTypes = deductionTypes.filter((type) =>
    Boolean(type.is_pre_tax)
  );
  const postTaxDeductionTypes = deductionTypes.filter(
    (type) => !type.is_pre_tax
  );

  const hasAllowances = allowanceTypes.length > 0;
  const hasDeductions = deductionTypes.length > 0;
  const hasContributions = contributionTypes.length > 0;

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
          sum.totalEmployerContributions + computed.totalEmployerContributions,
        totalEmployerCost: sum.totalEmployerCost + computed.totalEmployerCost,
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
    organization: organization,
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

  // Border style helper
  const borderStyle = {
    borderRight: '1px solid',
    borderRightColor: 'divider',
    borderLeft: '1px solid',
    borderLeftColor: 'divider',
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth='xl'
        fullScreen={smallScreen}
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
          },
        }}
      >
        <DialogTitle>
          <Stack
            direction='row'
            justifyContent='space-between'
            alignItems='center'
          >
            <Box>
              <Typography variant='h6'>
                {organization?.name || 'Company'}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Salary Payroll - {periodLabel}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {isLoading ? (
            <Box
              display='flex'
              justifyContent='center'
              alignItems='center'
              py={8}
            >
              <CircularProgress />
              <Typography variant='body2' color='text.secondary' sx={{ ml: 2 }}>
                Generating salary sheet...
              </Typography>
            </Box>
          ) : rows.length === 0 ? (
            <Alert severity='info'>
              No employees found for this payroll run.
            </Alert>
          ) : (
            <TableContainer>
              <Table size='small'>
                <TableHead>
                  {/* Group Headers - RECRUITMENT, EMPLOYEE, EMPLOYER */}
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      sx={{
                        textAlign: 'center',
                        fontWeight: 700,
                        border: '1px solid',
                        borderColor: 'divider',
                        fontSize: '0.9rem',
                      }}
                    >
                      RECRUITMENT
                    </TableCell>
                    <TableCell
                      colSpan={
                        2 +
                        (hasAllowances ? allowanceTypes.length : 0) +
                        (hasDeductions ? deductionTypes.length + 1 : 0)
                      }
                      sx={{
                        textAlign: 'center',
                        fontWeight: 700,
                        border: '1px solid',
                        borderColor: 'divider',
                        fontSize: '0.9rem',
                      }}
                    >
                      EMPLOYEE
                    </TableCell>
                    <TableCell
                      colSpan={
                        2 + (hasContributions ? contributionTypes.length : 0)
                      }
                      sx={{
                        textAlign: 'center',
                        fontWeight: 700,
                        border: '1px solid',
                        borderColor: 'divider',
                        fontSize: '0.9rem',
                      }}
                    >
                      EMPLOYER
                    </TableCell>
                  </TableRow>

                  {/* Sub-headers - Allowances, Deductions, Contributions */}
                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: 500,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      S/N
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 500,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      Employee
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 500,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      Designation
                    </TableCell>
                    <TableCell
                      align='right'
                      sx={{
                        fontWeight: 500,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      Basic
                    </TableCell>

                    {hasAllowances && (
                      <TableCell
                        colSpan={allowanceTypes.length}
                        align='center'
                        sx={{
                          fontWeight: 500,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        Allowances
                      </TableCell>
                    )}

                    <TableCell
                      align='right'
                      sx={{
                        fontWeight: 500,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      Gross
                    </TableCell>

                    {hasDeductions && (
                      <TableCell
                        colSpan={deductionTypes.length + 1}
                        align='center'
                        sx={{
                          fontWeight: 500,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        Deductions
                      </TableCell>
                    )}

                    <TableCell
                      align='right'
                      sx={{
                        fontWeight: 500,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      Net Payable
                    </TableCell>

                    {hasContributions && (
                      <TableCell
                        colSpan={contributionTypes.length + 1}
                        align='center'
                        sx={{
                          fontWeight: 500,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        Employer Contributions
                      </TableCell>
                    )}
                  </TableRow>

                  {/* Column Headers */}
                  <TableRow>
                    <TableCell
                      sx={{ border: '1px solid', borderColor: 'divider' }}
                    />
                    <TableCell
                      sx={{ border: '1px solid', borderColor: 'divider' }}
                    />
                    <TableCell
                      sx={{ border: '1px solid', borderColor: 'divider' }}
                    />
                    <TableCell
                      align='right'
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    />

                    {allowanceTypes.map((type, idx) => (
                      <TableCell
                        key={`allowance-header-${type.id || type.name}-${idx}`}
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          fontWeight: 450,
                        }}
                      >
                        {type.name || 'Allowance'}
                      </TableCell>
                    ))}

                    <TableCell
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    />

                    {deductionTypes.map((type, idx) => (
                      <TableCell
                        key={`deduction-header-${type.id || type.name}-${idx}`}
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          fontWeight: 450,
                        }}
                      >
                        {type.name || 'Deduction'}
                      </TableCell>
                    ))}

                    <TableCell
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        fontWeight: 450,
                      }}
                    >
                      PAYE
                    </TableCell>

                    <TableCell
                      sx={{
                        fontWeight: 400,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    />

                    {contributionTypes.map((type, idx) => (
                      <TableCell
                        key={`contribution-header-${type.id || type.name}-${idx}`}
                        sx={{
                          fontWeight: 450,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        {type.name || 'Contribution'}
                      </TableCell>
                    ))}

                    <TableCell
                      sx={{
                        fontWeight: 450,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      Total Empr. Cost
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {rows.map((entry, index) => {
                    const run = entry.run;
                    const computed = entry.computed;
                    const name = getEmployeeName(run);
                    const employeeNumber = getEmployeeNumber(run);
                    const designation = getDesignation(run);
                    const isEven = index % 2 === 0;

                    return (
                      <TableRow
                        key={`salary-row-${run.id || index}-${index}`}
                        sx={{
                          backgroundColor: isEven
                            ? theme.palette.background.paper
                            : theme.palette.action.hover,
                          '&:hover': {
                            backgroundColor: theme.palette.action.selected,
                          },
                        }}
                      >
                        <TableCell
                          sx={{ border: '1px solid', borderColor: 'divider' }}
                        >
                          {index + 1}
                        </TableCell>
                        <TableCell
                          sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            textWrap: 'nowrap',
                          }}
                        >
                          {name}
                          <Typography
                            variant='body2'
                            fontSize={10}
                            color='textSecondary'
                          >
                            {employeeNumber && `(${employeeNumber})`}
                          </Typography>
                        </TableCell>

                        <TableCell
                          sx={{
                            color: 'text.secondary',
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          {designation}
                        </TableCell>
                        <TableCell
                          align='right'
                          sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          {fmt(computed.basicSalary)}
                        </TableCell>

                        {allowanceTypes.map((type, typeIdx) => (
                          <TableCell
                            key={`allowance-value-${run.id || index}-${type.id || type.name}-${typeIdx}`}
                            align='right'
                            sx={{
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                          >
                            {fmt(sumAllowanceByType(run, type))}
                          </TableCell>
                        ))}

                        <TableCell
                          align='right'
                          sx={{
                            fontWeight: 400,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          {fmt(computed.grossSalary)}
                        </TableCell>

                        {deductionTypes.map((type, typeIdx) => (
                          <TableCell
                            key={`deduction-value-${run.id || index}-${type.id || type.name}-${typeIdx}`}
                            align='right'
                            sx={{
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                          >
                            {fmt(sumDeductionByType(run, type))}
                          </TableCell>
                        ))}

                        <TableCell
                          align='right'
                          sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            fontWeight: 400,
                          }}
                        >
                          {fmt(computed.paye)}
                        </TableCell>

                        <TableCell
                          align='right'
                          sx={{
                            fontWeight: 400,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          {fmt(computed.netSalary)}
                        </TableCell>

                        {contributionTypes.map((type, typeIdx) => (
                          <TableCell
                            key={`contribution-value-${run.id || index}-${type.id || type.name}-${typeIdx}`}
                            align='right'
                            sx={{
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                          >
                            {fmt(sumContributionByType(run, type))}
                          </TableCell>
                        ))}

                        <TableCell
                          align='right'
                          sx={{
                            fontWeight: 400,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          {fmt(computed.totalEmployerCost)}
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {/* Totals Row */}
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      sx={{
                        fontWeight: 700,
                        textAlign: 'center',
                        borderTop: '2px solid',
                        borderLeft: '2px solid',
                        borderRight: '2px solid',
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
                        borderRight: '0.001px solid white',
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
                          borderRight: '0.001px solid white',
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
                        borderRight: '0.001px solid white',
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
                          borderRight: '0.001px solid white',
                        }}
                      >
                        {fmt(amount)}
                      </TableCell>
                    ))}
                    {totals.postTaxDeductionByType.map((amount, idx) => (
                      <TableCell
                        key={`pre-tax-total-${idx}`}
                        align='right'
                        sx={{
                          fontWeight: 700,
                          borderTop: '2px solid',
                          borderColor: 'divider',
                          borderRight: '0.001px solid white',
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
                        borderRight: '0.001px solid white',
                      }}
                    >
                      {fmt(totals.paye)}
                    </TableCell>

                    <TableCell
                      align='right'
                      sx={{
                        fontWeight: 700,
                        borderTop: '2px solid',
                        borderColor: 'divider',
                        borderRight: '0.001px solid white',
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
                          borderRight: '0.001px solid white',
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
                        borderRight: '0.001px solid white',
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

      {/* PDF Dialog */}
      <Dialog
        open={openPdfDialog}
        onClose={() => setOpenPdfDialog(false)}
        fullWidth
        maxWidth='xl'
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
          },
        }}
      >
        <DialogContent>
          <PDFContent
            document={
              <SalarySheetPDF
                organization={organization}
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
