'use client';

import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import PDFContent from '@/components/pdf/PDFContent';
import { faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { LoadingButton } from '@mui/lab';
import {
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
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Employee } from '../employees/EmployeesType';
import { ContractType } from '../employees/profile/employeesContracts/ContractType';
import humanResourcesServices from '../humanResourcesServices';
import PayrollPeriodPDF from './PayrollPeriodPDF';

type EmployeeType = Employee & {
  basic_salary: number;
  grossSalary?: number;
  allwances: Array<any>;
  deductions: Array<any>;
  employer_contributions: Array<any>;
  paye: number;
  slipIndex: number;
};
type PayslipType = {
  allowances: Array<any>;
  basic_salary: number;
  contract: ContractType;
  created_at: string;
  created_by: number;
  deductions: Array<any>;
  deleted_at?: string;
  employee: Employee;
  employee_contract_id: number;
  employee_id: number;
  employer_contributions: Array<any>;
  id: number;
  paye: number;
  payroll_run_id: number;
  updated_at: string;
};

interface RunType {
  approval_chain_id?: number;
  cost_center: CostCenter;
  cost_center_id: number;
  created_at: string;
  created_by: number;
  deleted_at?: string;
  fallback_payable_ledger_id?: number;
  id: number;
  journal_voucher_id?: number;
  payroll_period_id: number;
  payslips: Array<PayslipType>;
  remarks?: string;
  status: string;
  updated_at: string;
}

export interface PayrollPeriodNewViewDialogProp {
  open?: boolean;
  onClose?: () => void;
  period?: {
    id: number;
    month: number;
    remarks?: string;
    year: number;
  };
  runs?: Array<RunType>;
  hasTypes?: {
    hasAllowances: boolean;
    hasDeductions: boolean;
    hasContributions: boolean;
  };
  employeeTypes?: {
    employeeDeductions: Array<any>;
    employeeAllowances: Array<any>;
    employeecontributions: Array<any>;
  };
  uniqueTypes?: {
    unique_deductions_types: Array<any>;
    unique_allowances_types: Array<any>;
    unique_contributions_types: Array<any>;
  };
  isLoading?: boolean;
}

function fmt(value: number) {
  if (!value) return '0.00';
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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

function getEmployeeName(employee: Employee) {
  if (!employee) return '';

  const firstName = employee.first_name || '';
  const lastName = employee.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName;
}

function getEmployeeNumber(employee: Employee) {
  return employee?.employee_number;
}

function getDesignation(run: RunType, employee: any) {
  return run.payslips[employee.slipIndex].contract.designation.title || '-';
}

function employeeComputedTotals(employee: EmployeeType) {
  const basicSalary = employee.basic_salary;
  const allowances = employee.allwances;
  const deductions = employee.deductions;
  const contributions = employee.employer_contributions;
  const totalAllowances = allowances.reduce(
    (sum: number, allowance) => sum + (allowance.amount ?? 0),
    0
  );
  const totalDeductions = deductions.reduce(
    (sum: number, deduction) => sum + (deduction.amount ?? 0),
    0
  );
  const totalContributions = contributions.reduce(
    (sum: number, contributions) => sum + (contributions.amount ?? 0),
    0
  );

  const grossSalary = basicSalary + totalAllowances;
  const netPay = grossSalary - totalDeductions;
  const totalEmpCost = grossSalary + totalContributions;

  return {
    grossSalary: grossSalary,
    netPay: netPay,
    totalEmpCost: totalEmpCost,
  };
}

const PayrollPeriodNewViewDialog = ({
  open = false,
  onClose,
  period,
  runs,
  hasTypes,
  employeeTypes,
  uniqueTypes,
  isLoading,
}: PayrollPeriodNewViewDialogProp) => {
  const router = useRouter();
  const lang = useLanguage();
  const authObject = useJumboAuth() as any;
  const theme = useTheme();
  const { theme: jumboTheme } = useJumboTheme();
  const smallScreen = useMediaQuery(jumboTheme.breakpoints.down('md'));

  const organization = authObject?.authOrganization?.organization;

  const [openPdfDialog, setOpenPdfDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  let periodLabel = runs?.[0].cost_center?.name || 'Company-wide Run';
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  periodLabel = `${monthNames?.[period?.month || 1 - 1]} ${period?.year} - ${periodLabel}`;

  const hasAllowances = hasTypes?.hasAllowances;
  const hasDeductions = hasTypes?.hasDeductions;
  const hasContributions = hasTypes?.hasContributions;

  const allowanceTypes = employeeTypes?.employeeAllowances ?? [];
  const deductionTypes = employeeTypes?.employeeDeductions ?? [];
  const contributionTypes = employeeTypes?.employeecontributions ?? [];

  const unique_deductions_types = uniqueTypes?.unique_deductions_types;
  const unique_allowances_types = uniqueTypes?.unique_allowances_types;
  const unique_contributions_types = uniqueTypes?.unique_contributions_types;

  const calculateTotalAmtByType = (
    typeObj: any,
    type_id: number,
    type: 'deduction' | 'allowance' | 'contribution'
  ) => {
    if (type === 'allowance') {
      return allowanceTypes?.reduce(
        (sum: number, item: any) =>
          item.allowance_type_id === type_id || item.label === typeObj.label
            ? sum + item?.amount
            : sum,
        0
      );
    }
    if (type === 'deduction') {
      return deductionTypes?.reduce((sum, item) => {
        return item.deduction_type_id === type_id ||
          item.label === typeObj.label
          ? sum + item?.amount
          : sum;
      }, 0);
    }
    if (type === 'contribution') {
      return contributionTypes?.reduce((sum, item) => {
        return item.employer_contribution_type_id === type_id
          ? sum + item?.amount
          : sum;
      }, 0);
    }
  };

  const allEmployees = useMemo(() => {
    return runs?.flatMap((run) => {
      return run.payslips.flatMap((slip, idx) => ({
        ...slip.employee,
        basic_salary: slip.contract?.basic_salary ?? 0,
        allwances: slip.allowances ?? [],
        deductions: slip.deductions ?? [],
        employer_contributions: slip.employer_contributions ?? [],
        paye: slip.paye ?? 0,
        slipIndex: idx,
      }));
    });
  }, [runs]);

  const payrollTotals = allEmployees?.reduce(
    (sum, employee) => {
      const basicSalary = employee.basic_salary;
      const grossSalary = employeeComputedTotals(employee).grossSalary;
      const netPay = employeeComputedTotals(employee).netPay;
      const empCost = employeeComputedTotals(employee).totalEmpCost;
      const paye = employee.paye;

      return {
        totalBasicSalrary: sum.totalBasicSalrary + basicSalary,
        totalGross: sum.totalGross + grossSalary,
        totalNetPay: sum.totalNetPay + netPay,
        totalEmpCosst: sum.totalEmpCosst + empCost,
        totalPaye: sum.totalPaye + paye,
      };
    },
    {
      totalBasicSalrary: 0,
      totalGross: 0,
      totalNetPay: 0,
      totalEmpCosst: 0,
      totalPaye: 0,
    }
  );

  const exportedData = {
    organization: organization,
    period: period,
    runs: runs,
    hasTypes: hasTypes,
    employeeTypes: employeeTypes,
    uniqueTypes: uniqueTypes,
    isLoading: isLoading,
  };

  const handleExcelExport = async (exportedData: any) => {
    try {
      setIsExporting(true);
      const blob =
        await humanResourcesServices.ExportPayrollPeriodToExcel(exportedData);

      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = `${downloadFileName}.xlsx`;
      // a.click();
      // window.URL.revokeObjectURL(url);
      // setIsExporting(false);
      console.log('blob: ', blob);
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
                Generating Preview...
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size='small'>
                <TableHead>
                  {/* Group Headers - RECRUITMENT, EMPLOYEE, EMPLOYER */}
                  <TableRow>
                    <TableCell
                      sx={{
                        width: 'fit-content',
                        textAlign: 'center',
                        fontWeight: 700,
                        border: '1px solid',
                        borderColor: 'divider',
                        fontSize: '0.9rem',
                      }}
                    ></TableCell>
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
                        (hasAllowances
                          ? (unique_allowances_types?.length ?? 0)
                          : 0) +
                        (hasDeductions
                          ? (unique_deductions_types?.length ?? 0)
                          : 0)
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
                        2 +
                        (hasContributions
                          ? (unique_contributions_types?.length ?? 0)
                          : 0)
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
                        textWrap: 'nowrap',
                      }}
                    >
                      cost center
                    </TableCell>
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
                        colSpan={unique_allowances_types?.length ?? 0}
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
                        colSpan={unique_deductions_types?.length ?? 0}
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

                    {hasContributions ? (
                      <TableCell
                        colSpan={(unique_contributions_types?.length ?? 0) + 1}
                        align='center'
                        sx={{
                          fontWeight: 500,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        Employer Contributions
                      </TableCell>
                    ) : (
                      <TableCell
                        align='center'
                        sx={{
                          fontWeight: 500,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      />
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
                      sx={{ border: '1px solid', borderColor: 'divider' }}
                    />
                    <TableCell
                      sx={{ border: '1px solid', borderColor: 'divider' }}
                    />

                    {unique_allowances_types?.map((type, idx) => (
                      <TableCell
                        key={`allowance-header-${type.allowance_type_id || type.label}-${idx}`}
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          fontWeight: 450,
                        }}
                      >
                        {type.label || 'Allowance'}
                      </TableCell>
                    ))}

                    <TableCell
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    />

                    {unique_deductions_types?.map((type, idx) => {
                      if (type.deduction_type_id !== null) {
                        return (
                          <TableCell
                            key={`deduction-header-${type.deduction_type_id || type.label}-${idx}`}
                            sx={{
                              border: '1px solid',
                              borderColor: 'divider',
                              fontWeight: 450,
                            }}
                          >
                            {type.label || 'Deduction'}
                          </TableCell>
                        );
                      }
                    })}

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

                    {unique_contributions_types?.map((type, idx) => (
                      <TableCell
                        key={`contribution-header-${type.employer_contribution_type_id || type.label}-${idx}`}
                        sx={{
                          fontWeight: 450,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        {type.label || 'Contribution'}
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
                  {runs?.map((row, index) => {
                    const isEven = index % 2 === 0;
                    const employees: Array<EmployeeType> =
                      row.payslips.flatMap((slip, idx) => ({
                        ...slip.employee,
                        basic_salary: slip.contract?.basic_salary ?? 0,
                        allwances: slip.allowances ?? [],
                        deductions: slip.deductions ?? [],
                        employer_contributions:
                          slip.employer_contributions ?? [],
                        paye: slip.paye ?? 0,
                        slipIndex: idx,
                      })) || [];

                    return employees.map((entry: any, empIndex: number) => {
                      const computed = entry.computed;
                      const name = getEmployeeName(entry);
                      const employeeNumber = getEmployeeNumber(entry);
                      const designation = getDesignation(row, entry);
                      const isFirstEmployee = empIndex === 0;
                      const totalEmployees = employees.length;

                      return (
                        <TableRow
                          key={`salary-row-${entry.id || index}-${empIndex}`}
                          sx={{
                            backgroundColor: isEven
                              ? theme.palette.background.paper
                              : theme.palette.action.hover,
                            '&:hover': {
                              backgroundColor: theme.palette.action.selected,
                            },
                          }}
                        >
                          {isFirstEmployee && (
                            <TableCell
                              rowSpan={totalEmployees}
                              sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                textWrap: 'nowrap',
                                maxWidth: 300,
                              }}
                            >
                              {row.cost_center?.name || '-'}
                            </TableCell>
                          )}

                          <TableCell
                            sx={{ border: '1px solid', borderColor: 'divider' }}
                          >
                            {empIndex + 1}
                          </TableCell>

                          {/* Employee Name */}
                          <TableCell
                            sx={{
                              border: '1px solid',
                              borderColor: 'divider',
                              textWrap: 'nowrap',
                              cursor: 'pointer',
                              '&:hover': {
                                color: 'primary.main',
                                textDecoration: 'underline',
                              },
                            }}
                            onClick={() =>
                              router.push(
                                `/${lang}/humanResources/employees/${entry?.id}`
                              )
                            }
                          >
                            {name}
                            {/* Employee Number */}
                            <Typography
                              variant='body2'
                              fontSize={10}
                              color='textSecondary'
                            >
                              {employeeNumber && `(${employeeNumber})`}
                            </Typography>
                          </TableCell>

                          {/* Designation */}
                          <TableCell
                            sx={{ border: '1px solid', borderColor: 'divider' }}
                          >
                            {designation}
                          </TableCell>

                          {/* Basic Salary */}
                          <TableCell
                            align='right'
                            sx={{ border: '1px solid', borderColor: 'divider' }}
                          >
                            {fmt(entry.basic_salary)}
                          </TableCell>

                          {/* Allowances */}
                          {unique_allowances_types?.map((type, typeIdx) => (
                            <TableCell
                              key={`allowance-value-${entry.id || index}-${type.id || type.name}-${typeIdx}`}
                              align='right'
                              sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                              }}
                            >
                              {fmt(
                                allowanceTypes.find(
                                  (itm) =>
                                    itm.employee_contract_id ===
                                      row.payslips[entry.slipIndex].contract
                                        .id &&
                                    (itm.label === type.label ||
                                      itm.allowance_type_id ===
                                        type.allowance_type_id)
                                )?.amount ?? 0
                              )}
                            </TableCell>
                          ))}

                          {/* Gross Salary */}
                          <TableCell
                            align='right'
                            sx={{ border: '1px solid', borderColor: 'divider' }}
                          >
                            {fmt(employeeComputedTotals(entry).grossSalary)}
                          </TableCell>

                          {/* Deductions */}
                          {unique_deductions_types?.map((type, typeIdx) => {
                            if (type.deduction_type_id !== null) {
                              return (
                                <TableCell
                                  key={`deduction-value-${entry.id || index}-${type.id || type.name}-${typeIdx}`}
                                  align='right'
                                  sx={{
                                    border: '1px solid',
                                    borderColor: 'divider',
                                  }}
                                >
                                  {fmt(
                                    deductionTypes.find(
                                      (itm) =>
                                        itm.employee_contract_id ===
                                          row.payslips[entry.slipIndex].contract
                                            .id &&
                                        (itm.label === type.label ||
                                          itm.deduction_type_id ===
                                            type.deduction_type_id)
                                    )?.amount ?? 0
                                  )}
                                </TableCell>
                              );
                            }
                          })}

                          {/* PAYE */}
                          <TableCell
                            align='right'
                            sx={{ border: '1px solid', borderColor: 'divider' }}
                          >
                            {fmt(entry.paye ?? 0)}
                          </TableCell>

                          {/* Net Salary */}
                          <TableCell
                            align='right'
                            sx={{ border: '1px solid', borderColor: 'divider' }}
                          >
                            {fmt(employeeComputedTotals(entry).netPay)}
                          </TableCell>

                          {/* Employer Contributions */}
                          {unique_contributions_types?.map((type, typeIdx) => (
                            <TableCell
                              key={`contribution-value-${entry.id || index}-${type.id || type.name}-${typeIdx}`}
                              align='right'
                              sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                              }}
                            >
                              {fmt(
                                deductionTypes.find(
                                  (itm) =>
                                    itm.employee_contract_id ===
                                      row.payslips[entry.slipIndex].contract
                                        .id &&
                                    (itm.label === type.label ||
                                      itm.employer_contribution_type_id ===
                                        type.employer_contribution_type_id)
                                )?.amount ?? 0
                              )}
                            </TableCell>
                          ))}

                          {/* Total Employer Cost */}
                          <TableCell
                            align='right'
                            sx={{ border: '1px solid', borderColor: 'divider' }}
                          >
                            {fmt(employeeComputedTotals(entry).totalEmpCost)}
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })}

                  {/* Totals Row */}
                  <TableRow>
                    <TableCell
                      colSpan={4}
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
                      {fmt(payrollTotals?.totalBasicSalrary ?? 0)}
                    </TableCell>

                    {unique_allowances_types?.map((type: any) => (
                      <TableCell
                        key={`allowance-total-${type.allowance_type_id}`}
                        align='right'
                        sx={{
                          fontWeight: 700,
                          borderTop: '2px solid',
                          borderColor: 'divider',
                          borderRight: '0.001px solid white',
                        }}
                      >
                        {fmt(
                          calculateTotalAmtByType(
                            type,
                            type.allowance_type_id,
                            'allowance'
                          )
                        )}
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
                      {fmt(payrollTotals?.totalGross ?? 0)}
                    </TableCell>

                    {unique_deductions_types?.map((type: any) => {
                      if (type.deduction_type_id !== null) {
                        return (
                          <TableCell
                            key={`deduction-total-${type.deduction_type_id}`}
                            align='right'
                            sx={{
                              fontWeight: 700,
                              borderTop: '2px solid',
                              borderColor: 'divider',
                              borderRight: '0.001px solid white',
                            }}
                          >
                            {fmt(
                              calculateTotalAmtByType(
                                type,
                                type.deduction_type_id,
                                'deduction'
                              )
                            )}
                          </TableCell>
                        );
                      }
                    })}

                    <TableCell
                      align='right'
                      sx={{
                        fontWeight: 700,
                        borderTop: '2px solid',
                        borderColor: 'divider',
                        borderRight: '0.001px solid white',
                      }}
                    >
                      {fmt(payrollTotals?.totalPaye ?? 0)}
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
                      {fmt(payrollTotals?.totalNetPay ?? 0)}
                    </TableCell>

                    {unique_contributions_types?.map((type: any) => (
                      <TableCell
                        key={`contribution-total-${type.employer_contribution_type_id}`}
                        align='right'
                        sx={{
                          fontWeight: 700,
                          borderTop: '2px solid',
                          borderColor: 'divider',
                          borderRight: '0.001px solid white',
                        }}
                      >
                        {fmt(
                          calculateTotalAmtByType(
                            type,
                            type.employer_contribution_type_id,
                            'contribution'
                          )
                        )}
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
                      {fmt(payrollTotals?.totalEmpCosst ?? 0)}
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
            disabled={runs?.length === 0 || isLoading}
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
              <PayrollPeriodPDF
                organization={organization}
                period={period}
                runs={runs}
                hasTypes={hasTypes}
                employeeTypes={employeeTypes}
                uniqueTypes={uniqueTypes}
                isLoading={isLoading}
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
            disabled={isExporting || runs?.length === 0 || isLoading}
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

export default PayrollPeriodNewViewDialog;
