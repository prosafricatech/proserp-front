// components/humanResources/payrollRuns/PayrollRunTabs.tsx
'use client';

import {
  CloseOutlined,
  SearchOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import humanResourcesServices from '../humanResourcesServices';
import {
  calculateGrossSalary,
  calculateNetSalary,
  calculateTotalAllowances,
  calculateTotalDeductions,
  formatMoney,
  getEmployeeName,
} from './payrollUtils';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

export const TabPanel = ({ children, value, index }: TabPanelProps) => (
  <div hidden={value !== index} role='tabpanel'>
    {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
  </div>
);

// Helper to calculate total employer contributions
const calculateTotalEmployerContributions = (contributions: any[]) => {
  if (!contributions || !Array.isArray(contributions)) return 0;
  return contributions.reduce((sum, item) => sum + (item.amount || 0), 0);
};

interface EmployeesTabProps {
  rows: any[];
  search: string;
  onSearchChange: (value: string) => void;
  onSimulate: (employeeId: number) => void;
  isSimulating: boolean;
  allowanceTypes?: any[];
  deductionTypes?: any[];
  contributionTypes?: any[];
  isLoading?: boolean;
}

export const EmployeesTab = ({
  rows,
  search,
  onSearchChange,
  onSimulate,
  isSimulating,
  allowanceTypes = [],
  deductionTypes = [],
  contributionTypes = [],
  isLoading = false,
}: EmployeesTabProps) => {
  // Fetch allowance types if not provided
  const { data: fetchedAllowanceTypes, isLoading: isLoadingAllowances } =
    useQuery({
      queryKey: ['allowanceTypesForEmployeesTab'],
      queryFn: async () => {
        const response = await humanResourcesServices.getAllowanceTypesList({
          limit: 100,
        });
        return response?.data || [];
      },
      enabled: allowanceTypes.length === 0,
      staleTime: 1000 * 60 * 5,
    });

  // Fetch deduction types if not provided
  const { data: fetchedDeductionTypes, isLoading: isLoadingDeductions } =
    useQuery({
      queryKey: ['deductionTypesForEmployeesTab'],
      queryFn: async () => {
        const response = await humanResourcesServices.getDeductionTypesList({
          limit: 100,
        });
        return response?.data || [];
      },
      enabled: deductionTypes.length === 0,
      staleTime: 1000 * 60 * 5,
    });

  // Fetch employer contribution types if not provided
  const { data: fetchedContributionTypes, isLoading: isLoadingContributions } =
    useQuery({
      queryKey: ['contributionTypesForEmployeesTab'],
      queryFn: async () => {
        const response =
          await humanResourcesServices.getEmployerContributionTypesList({
            limit: 100,
          });
        return response?.data || [];
      },
      enabled: contributionTypes.length === 0,
      staleTime: 1000 * 60 * 5,
    });

  const finalAllowanceTypes =
    allowanceTypes.length > 0 ? allowanceTypes : fetchedAllowanceTypes || [];
  const finalDeductionTypes =
    deductionTypes.length > 0 ? deductionTypes : fetchedDeductionTypes || [];
  const finalContributionTypes =
    contributionTypes.length > 0
      ? contributionTypes
      : fetchedContributionTypes || [];
  const loading =
    isLoading ||
    isLoadingAllowances ||
    isLoadingDeductions ||
    isLoadingContributions;

  const filteredRows = rows.filter((row: any) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase().trim();
    const employee = row.employee || row;
    const name = getEmployeeName(employee).toLowerCase();
    const number = (employee?.employee_number || '').toLowerCase();
    return name.includes(term) || number.includes(term);
  });

  // Helper to get allowance amount for specific type
  const getAllowanceAmount = (allowances: any[], typeId: number) => {
    if (!allowances) return 0;
    const found = allowances.find((a: any) => a.allowance_type_id === typeId);
    return found?.amount || 0;
  };

  // Helper to get deduction amount for specific type
  const getDeductionAmount = (deductions: any[], typeId: number) => {
    if (!deductions) return 0;
    const found = deductions.find((d: any) => d.deduction_type_id === typeId);
    return found?.amount || 0;
  };

  // Helper to get contribution amount for specific type
  const getContributionAmount = (contributions: any[], typeId: number) => {
    if (!contributions) return 0;
    const found = contributions.find(
      (c: any) => c.employer_contribution_type_id === typeId
    );
    return found?.amount || 0;
  };

  // Helper to calculate totals for dynamic columns
  const calculateTotalByType = (
    rows: any[],
    typeId: number,
    type: 'allowance' | 'deduction' | 'contribution'
  ) => {
    return rows.reduce((sum, row) => {
      let items = [];
      if (type === 'allowance') items = row.allowances || [];
      else if (type === 'deduction') items = row.deductions || [];
      else if (type === 'contribution')
        items = row.employer_contributions || [];

      const found = items.find((item: any) => {
        if (type === 'allowance') return item.allowance_type_id === typeId;
        if (type === 'deduction') return item.deduction_type_id === typeId;
        if (type === 'contribution')
          return item.employer_contribution_type_id === typeId;
        return false;
      });
      return sum + (found?.amount || 0);
    }, 0);
  };

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' py={4}>
        <CircularProgress size={30} />
        <Typography variant='body2' color='text.secondary' sx={{ ml: 2 }}>
          Loading salary types...
        </Typography>
      </Box>
    );
  }

  const hasAllowances = finalAllowanceTypes.length > 0;
  const hasDeductions = finalDeductionTypes.length > 0;
  const hasContributions = finalContributionTypes.length > 0;

  return (
    <>
      <Stack
        direction='row'
        spacing={1}
        mb={2}
        alignItems='center'
        flexWrap='wrap'
        useFlexGap
      >
        <TextField
          size='small'
          placeholder='Search employee...'
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ minWidth: 260 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchOutlined fontSize='small' />
              </InputAdornment>
            ),
            endAdornment: search && (
              <InputAdornment position='end'>
                <IconButton size='small' onClick={() => onSearchChange('')}>
                  <CloseOutlined fontSize='small' />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Typography variant='caption' color='text.secondary'>
          {filteredRows.length} of {rows.length} employees
        </Typography>
      </Stack>

      {filteredRows.length === 0 ? (
        <Typography variant='body2' color='text.secondary' py={2}>
          {search
            ? 'No employees match your search.'
            : 'No employees found for this run.'}
        </Typography>
      ) : (
        <TableContainer component={Paper} variant='outlined'>
          <Table size='small'>
            <TableHead>
              {/* Group Headers */}
              <TableRow>
                <TableCell
                  colSpan={2}
                  sx={{
                    textAlign: 'center',
                    borderRight: '2px solid',
                    borderRightColor: 'divider',
                  }}
                />
                {hasAllowances && (
                  <TableCell
                    colSpan={finalAllowanceTypes.length}
                    sx={{
                      textAlign: 'center',
                      borderRight: '2px solid',
                      borderRightColor: 'divider',
                      backgroundColor: 'action.hover',
                    }}
                  >
                    <Typography variant='subtitle2' fontWeight={600}>
                      Allowances
                    </Typography>
                  </TableCell>
                )}
                <TableCell
                  sx={{
                    borderRight: hasAllowances ? '2px solid' : 'none',
                    borderRightColor: 'divider',
                  }}
                />
                {hasDeductions && (
                  <TableCell
                    colSpan={finalDeductionTypes.length + 1}
                    sx={{
                      textAlign: 'center',
                      borderRight: '2px solid',
                      borderRightColor: 'divider',
                      backgroundColor: 'action.hover',
                    }}
                  >
                    <Typography variant='subtitle2' fontWeight={600}>
                      Deductions
                    </Typography>
                  </TableCell>
                )}
                <TableCell />
                {hasContributions && (
                  <TableCell
                    colSpan={finalContributionTypes.length + 1}
                    sx={{
                      textAlign: 'center',
                      borderRight: '2px solid',
                      borderRightColor: 'divider',
                      backgroundColor: 'action.hover',
                    }}
                  >
                    <Typography variant='subtitle2' fontWeight={600}>
                      Employer Contributions
                    </Typography>
                  </TableCell>
                )}
                <TableCell />
              </TableRow>

              {/* Column Headers */}
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                <TableCell align='right' sx={{ fontWeight: 700 }}>
                  Basic
                </TableCell>

                {finalAllowanceTypes.map((type: any) => (
                  <TableCell
                    key={`allowance-header-${type.id}`}
                    align='right'
                    sx={{
                      fontWeight: 600,
                      borderRight: '2px solid',
                      borderRightColor: 'divider',
                    }}
                  >
                    {type.name || 'Allowance'}
                  </TableCell>
                ))}

                <TableCell align='right' sx={{ fontWeight: 700 }}>
                  Gross
                </TableCell>

                {finalDeductionTypes.map((type: any) => (
                  <TableCell
                    key={`deduction-header-${type.id}`}
                    align='right'
                    sx={{
                      fontWeight: 600,
                      borderRight: '2px solid',
                      borderRightColor: 'divider',
                    }}
                  >
                    {type.name || 'Deduction'}
                  </TableCell>
                ))}

                <TableCell
                  align='right'
                  sx={{ fontWeight: 700, color: 'error.main' }}
                >
                  PAYE
                </TableCell>
                <TableCell
                  align='right'
                  sx={{ fontWeight: 700, color: 'success.main' }}
                >
                  Net
                </TableCell>

                {finalContributionTypes.map((type: any) => (
                  <TableCell
                    key={`contribution-header-${type.id}`}
                    align='right'
                    sx={{
                      fontWeight: 600,
                      borderRight: '2px solid',
                      borderRightColor: 'divider',
                    }}
                  >
                    {type.name || 'Contribution'}
                  </TableCell>
                ))}

                <TableCell align='right' sx={{ fontWeight: 700 }}>
                  Total Empr. Cost
                </TableCell>
                <TableCell align='center' sx={{ fontWeight: 700 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows.slice(0, 10).map((row: any, index: number) => {
                const allowances = row.allowances || [];
                const deductions = row.deductions || [];
                const contributions = row.employer_contributions || [];
                const basicSalary = row.basic_salary || 0;
                const paye = row.paye || 0;
                const totalAllowances = calculateTotalAllowances(allowances);
                const totalDeductions = calculateTotalDeductions(deductions);
                const totalContributions =
                  calculateTotalEmployerContributions(contributions);
                const grossSalary =
                  row.gross_salary ||
                  calculateGrossSalary(basicSalary, allowances);
                const netSalary =
                  row.net_salary ||
                  calculateNetSalary(basicSalary, allowances, deductions, paye);
                const employerCost = grossSalary + totalContributions;

                return (
                  <TableRow key={index}>
                    <TableCell>
                      <Typography variant='body2'>
                        {getEmployeeName(row.employee)}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {row.employee?.employee_number}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>
                      {formatMoney(basicSalary)}
                    </TableCell>

                    {finalAllowanceTypes.map((type: any) => (
                      <TableCell
                        key={`allowance-value-${row.employee?.id || index}-${type.id}`}
                        align='right'
                        sx={{
                          borderRight: '2px solid',
                          borderRightColor: 'divider',
                        }}
                      >
                        {formatMoney(getAllowanceAmount(allowances, type.id))}
                      </TableCell>
                    ))}

                    <TableCell align='right' sx={{ fontWeight: 600 }}>
                      {formatMoney(grossSalary)}
                    </TableCell>

                    {finalDeductionTypes.map((type: any) => (
                      <TableCell
                        key={`deduction-value-${row.employee?.id || index}-${type.id}`}
                        align='right'
                        sx={{
                          borderRight: '2px solid',
                          borderRightColor: 'divider',
                        }}
                      >
                        {formatMoney(getDeductionAmount(deductions, type.id))}
                      </TableCell>
                    ))}

                    <TableCell align='right' sx={{ color: 'error.main' }}>
                      {formatMoney(paye)}
                    </TableCell>
                    <TableCell
                      align='right'
                      sx={{ fontWeight: 700, color: 'success.main' }}
                    >
                      {formatMoney(netSalary)}
                    </TableCell>

                    {finalContributionTypes.map((type: any) => (
                      <TableCell
                        key={`contribution-value-${row.employee?.id || index}-${type.id}`}
                        align='right'
                        sx={{
                          borderRight: '2px solid',
                          borderRightColor: 'divider',
                        }}
                      >
                        {formatMoney(
                          getContributionAmount(contributions, type.id)
                        )}
                      </TableCell>
                    ))}

                    <TableCell
                      align='right'
                      sx={{ fontWeight: 600, color: 'primary.main' }}
                    >
                      {formatMoney(employerCost)}
                    </TableCell>
                    <TableCell align='center'>
                      <Tooltip title='Simulate Employee'>
                        <IconButton
                          size='small'
                          onClick={() => onSimulate(row.employee?.id)}
                          disabled={isSimulating}
                          color='primary'
                        >
                          {isSimulating ? (
                            <CircularProgress size={16} />
                          ) : (
                            <VisibilityOutlined fontSize='small' />
                          )}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredRows.length > 10 && (
                <TableRow>
                  <TableCell
                    colSpan={
                      8 +
                      finalAllowanceTypes.length +
                      finalDeductionTypes.length +
                      finalContributionTypes.length
                    }
                    align='center'
                  >
                    <Typography variant='caption' color='text.secondary'>
                      Showing 10 of {filteredRows.length} employees
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {/* Totals Row */}
              {filteredRows.length > 1 && (
                <TableRow sx={{ fontWeight: 500, bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: 16 }}>
                    Totals
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 600, fontSize: 16 }}
                    align='right'
                  >
                    {formatMoney(
                      filteredRows.reduce(
                        (s: number, r: any) => s + (r.basic_salary || 0),
                        0
                      )
                    )}
                  </TableCell>

                  {finalAllowanceTypes.map((type: any) => (
                    <TableCell
                      key={`allowance-total-${type.id}`}
                      align='right'
                      sx={{
                        fontWeight: 500,
                        fontSize: 18,
                        borderRight: '2px solid',
                        borderRightColor: 'divider',
                      }}
                    >
                      {formatMoney(
                        calculateTotalByType(filteredRows, type.id, 'allowance')
                      )}
                    </TableCell>
                  ))}

                  <TableCell
                    sx={{ fontWeight: 600, fontSize: 16 }}
                    align='right'
                  >
                    {formatMoney(
                      filteredRows.reduce(
                        (s: number, r: any) =>
                          s +
                          (r.gross_salary ||
                            calculateGrossSalary(
                              r.basic_salary || 0,
                              r.allowances || []
                            )),
                        0
                      )
                    )}
                  </TableCell>

                  {finalDeductionTypes.map((type: any) => (
                    <TableCell
                      key={`deduction-total-${type.id}`}
                      align='right'
                      sx={{
                        fontWeight: 500,
                        fontSize: 18,
                        borderRight: '2px solid',
                        borderRightColor: 'divider',
                      }}
                    >
                      {formatMoney(
                        calculateTotalByType(filteredRows, type.id, 'deduction')
                      )}
                    </TableCell>
                  ))}

                  <TableCell
                    sx={{ fontWeight: 600, fontSize: 16 }}
                    align='right'
                  >
                    {formatMoney(
                      filteredRows.reduce(
                        (s: number, r: any) => s + (r.paye || 0),
                        0
                      )
                    )}
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 600, fontSize: 16 }}
                    align='right'
                  >
                    {formatMoney(
                      filteredRows.reduce(
                        (s: number, r: any) =>
                          s +
                          (r.net_salary ||
                            calculateNetSalary(
                              r.basic_salary || 0,
                              r.allowances || [],
                              r.deductions || [],
                              r.paye || 0
                            )),
                        0
                      )
                    )}
                  </TableCell>

                  {finalContributionTypes.map((type: any) => (
                    <TableCell
                      key={`contribution-total-${type.id}`}
                      align='right'
                      sx={{
                        fontWeight: 500,
                        fontSize: 18,
                        borderRight: '2px solid',
                        borderRightColor: 'divider',
                      }}
                    >
                      {formatMoney(
                        calculateTotalByType(
                          filteredRows,
                          type.id,
                          'contribution'
                        )
                      )}
                    </TableCell>
                  ))}

                  <TableCell
                    sx={{ fontWeight: 600, fontSize: 16 }}
                    align='right'
                  >
                    {formatMoney(
                      filteredRows.reduce((s: number, r: any) => {
                        const gross =
                          r.gross_salary ||
                          calculateGrossSalary(
                            r.basic_salary || 0,
                            r.allowances || []
                          );
                        const contribs = calculateTotalEmployerContributions(
                          r.employer_contributions || []
                        );
                        return s + gross + contribs;
                      }, 0)
                    )}
                  </TableCell>
                  <TableCell />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
};

interface PayslipsTabProps {
  payslips: any[];
  search: string;
  onSearchChange: (value: string) => void;
  onViewPayslip: (payslip: any) => void;
  runStatus: string;
  isPaid: boolean;
  isPosted: boolean;
}

export const PayslipsTab = ({
  payslips,
  search,
  onSearchChange,
  onViewPayslip,
  runStatus,
  isPaid,
  isPosted,
}: PayslipsTabProps) => {
  const filteredPayslips = payslips.filter((payslip: any) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase().trim();
    const employee = payslip.employee || payslip;
    const name = getEmployeeName(employee).toLowerCase();
    const number = (employee?.employee_number || '').toLowerCase();
    return name.includes(term) || number.includes(term);
  });

  return (
    <>
      <Stack
        direction='row'
        spacing={1}
        mb={2}
        alignItems='center'
        flexWrap='wrap'
        useFlexGap
      >
        <TextField
          size='small'
          placeholder='Search payslip...'
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ minWidth: 260 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchOutlined fontSize='small' />
              </InputAdornment>
            ),
            endAdornment: search && (
              <InputAdornment position='end'>
                <IconButton size='small' onClick={() => onSearchChange('')}>
                  <CloseOutlined fontSize='small' />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Typography variant='caption' color='text.secondary'>
          {filteredPayslips.length} of {payslips.length} payslips
        </Typography>
      </Stack>

      {filteredPayslips.length === 0 ? (
        <Typography variant='body2' color='text.secondary' py={2}>
          {search
            ? 'No payslips match your search.'
            : 'No payslips found for this run.'}
        </Typography>
      ) : (
        <TableContainer component={Paper} variant='outlined'>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                <TableCell align='right' sx={{ fontWeight: 700 }}>
                  Basic Salary
                </TableCell>
                <TableCell align='right' sx={{ fontWeight: 700 }}>
                  Allowances
                </TableCell>
                <TableCell align='right' sx={{ fontWeight: 700 }}>
                  Gross Pay
                </TableCell>
                <TableCell align='right' sx={{ fontWeight: 700 }}>
                  Deductions
                </TableCell>
                <TableCell
                  align='right'
                  sx={{ fontWeight: 700, color: 'error.main' }}
                >
                  PAYE
                </TableCell>
                <TableCell
                  align='right'
                  sx={{ fontWeight: 700, color: 'success.main' }}
                >
                  Net Pay
                </TableCell>
                <TableCell align='center' sx={{ fontWeight: 700 }}>
                  Status
                </TableCell>
                <TableCell align='center' sx={{ fontWeight: 700 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPayslips
                .slice(0, 10)
                .map((payslip: any, index: number) => {
                  const employee = payslip.employee || payslip;
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant='body2'>
                          {getEmployeeName(employee)}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {employee?.employee_number || 'No ID'}
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        {formatMoney(payslip.basic_salary || 0)}
                      </TableCell>
                      <TableCell align='right'>
                        {formatMoney(payslip.total_allowances || 0)}
                      </TableCell>
                      <TableCell align='right'>
                        {formatMoney(payslip.gross_salary || 0)}
                      </TableCell>
                      <TableCell align='right'>
                        {formatMoney(payslip.total_deductions || 0)}
                      </TableCell>
                      <TableCell align='right' sx={{ color: 'error.main' }}>
                        {formatMoney(payslip.paye || 0)}
                      </TableCell>
                      <TableCell
                        align='right'
                        sx={{ fontWeight: 600, color: 'success.main' }}
                      >
                        {formatMoney(payslip.net_salary || 0)}
                      </TableCell>
                      <TableCell align='center'>
                        <Chip
                          label={runStatus || 'approved'}
                          size='small'
                          color={
                            isPaid ? 'success' : isPosted ? 'primary' : 'info'
                          }
                        />
                      </TableCell>
                      <TableCell align='center'>
                        <Tooltip title='View Payslip'>
                          <IconButton
                            size='small'
                            onClick={() => onViewPayslip(payslip)}
                            color='primary'
                          >
                            <VisibilityOutlined fontSize='small' />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              {filteredPayslips.length > 10 && (
                <TableRow>
                  <TableCell colSpan={9} align='center'>
                    <Typography variant='caption' color='text.secondary'>
                      Showing 10 of {filteredPayslips.length} payslips
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {filteredPayslips.length > 1 && (
                <TableRow sx={{ fontWeight: 'bold', bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Totals</TableCell>
                  <TableCell align='right'>
                    {formatMoney(
                      filteredPayslips.reduce(
                        (s: number, p: any) => s + (p.basic_salary || 0),
                        0
                      )
                    )}
                  </TableCell>
                  <TableCell align='right'>
                    {formatMoney(
                      filteredPayslips.reduce(
                        (s: number, p: any) => s + (p.total_allowances || 0),
                        0
                      )
                    )}
                  </TableCell>
                  <TableCell align='right'>
                    {formatMoney(
                      filteredPayslips.reduce(
                        (s: number, p: any) => s + (p.gross_salary || 0),
                        0
                      )
                    )}
                  </TableCell>
                  <TableCell align='right'>
                    {formatMoney(
                      filteredPayslips.reduce(
                        (s: number, p: any) => s + (p.total_deductions || 0),
                        0
                      )
                    )}
                  </TableCell>
                  <TableCell align='right'>
                    {formatMoney(
                      filteredPayslips.reduce(
                        (s: number, p: any) => s + (p.paye || 0),
                        0
                      )
                    )}
                  </TableCell>
                  <TableCell align='right'>
                    {formatMoney(
                      filteredPayslips.reduce(
                        (s: number, p: any) => s + (p.net_salary || 0),
                        0
                      )
                    )}
                  </TableCell>
                  <TableCell />
                  <TableCell />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
};

interface ApprovalsTabProps {
  hasChain: boolean;
  approvalChain: any;
  approvals: any[];
}

export const ApprovalsTab = ({
  hasChain,
  approvalChain,
  approvals,
}: ApprovalsTabProps) => {
  if (!hasChain || !approvalChain?.levels) {
    return (
      <Typography variant='body2' color='text.secondary' py={2}>
        This run uses direct approval (no approval chain).
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant='subtitle2' gutterBottom>
        Approval Chain
      </Typography>
      {approvalChain.levels.map((level: any, index: number) => {
        const approval = approvals?.find(
          (a: any) => a.chain_level_id === level.id
        );
        const isApproved = approval?.status === 'approved';
        const isPending = !approval || approval.status === 'pending';
        const isRejected = approval?.status === 'rejected';

        return (
          <Paper
            key={level.id}
            sx={{
              p: 1.5,
              mb: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              bgcolor: isApproved
                ? 'success.light'
                : isRejected
                  ? 'error.light'
                  : isPending
                    ? 'warning.light'
                    : 'transparent',
              borderRadius: 1,
            }}
          >
            <Box>
              <Typography variant='body2' fontWeight={500}>
                Level {index + 1}: {level.name || level.level_name}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {level.role?.name || 'Approver'}
              </Typography>
              {approval?.remarks && (
                <Typography
                  variant='caption'
                  display='block'
                  color='text.secondary'
                >
                  Remark: {approval.remarks}
                </Typography>
              )}
            </Box>
            <Chip
              label={
                isApproved
                  ? 'Approved'
                  : isRejected
                    ? 'Rejected'
                    : isPending
                      ? 'Pending'
                      : ''
              }
              color={
                isApproved
                  ? 'success'
                  : isRejected
                    ? 'error'
                    : isPending
                      ? 'warning'
                      : 'default'
              }
              size='small'
            />
          </Paper>
        );
      })}
    </Box>
  );
};
