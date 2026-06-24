// components/humanResources/payrollRuns/PayrollRunTabs.tsx
'use client';

import {
  Box,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  Stack,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  CircularProgress,
  Chip,
  Alert,
} from '@mui/material';
import {
  SearchOutlined,
  CloseOutlined,
  VisibilityOutlined,
  Visibility,
} from '@mui/icons-material';
import { formatMoney, getEmployeeName, calculateTotalAllowances, calculateTotalDeductions, calculateGrossSalary, calculateNetSalary } from './payrollUtils';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

export const TabPanel = ({ children, value, index }: TabPanelProps) => (
  <div hidden={value !== index} role="tabpanel">
    {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
  </div>
);

interface EmployeesTabProps {
  rows: any[];
  search: string;
  onSearchChange: (value: string) => void;
  onSimulate: (employeeId: number) => void;
  isSimulating: boolean;
}

export const EmployeesTab = ({ rows, search, onSearchChange, onSimulate, isSimulating }: EmployeesTabProps) => {
  const filteredRows = rows.filter((row: any) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase().trim();
    const employee = row.employee || row;
    const name = getEmployeeName(employee).toLowerCase();
    const number = (employee?.employee_number || '').toLowerCase();
    return name.includes(term) || number.includes(term);
  });

  return (
    <>
      <Stack direction="row" spacing={1} mb={2} alignItems="center" flexWrap="wrap" useFlexGap>
        <TextField
          size="small"
          placeholder="Search employee..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ minWidth: 260 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: search && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => onSearchChange('')}>
                  <CloseOutlined fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Typography variant="caption" color="text.secondary">
          {filteredRows.length} of {rows.length} employees
        </Typography>
      </Stack>

      {filteredRows.length === 0 ? (
        <Typography variant="body2" color="text.secondary" py={2}>
          {search ? 'No employees match your search.' : 'No employees found for this run.'}
        </Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell align="right">Basic Salary</TableCell>
                <TableCell align="right">Allowances</TableCell>
                <TableCell align="right">Gross Pay</TableCell>
                <TableCell align="right">Deductions</TableCell>
                <TableCell align="right">PAYE</TableCell>
                <TableCell align="right">Net Pay</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows.slice(0, 10).map((row: any, index: number) => {
                const allowances = row.allowances || [];
                const deductions = row.deductions || [];
                const basicSalary = row.basic_salary || 0;
                const paye = row.paye || 0;
                const totalAllowances = calculateTotalAllowances(allowances);
                const totalDeductions = calculateTotalDeductions(deductions);
                const grossSalary = row.gross_salary || calculateGrossSalary(basicSalary, allowances);
                const netSalary = row.net_salary || calculateNetSalary(basicSalary, allowances, deductions, paye);

                return (
                  <TableRow key={index}>
                    <TableCell>
                      <Typography variant="body2">{getEmployeeName(row.employee)}</Typography>
                    </TableCell>
                    <TableCell align="right">{formatMoney(basicSalary)}</TableCell>
                    <TableCell align="right">{formatMoney(totalAllowances)}</TableCell>
                    <TableCell align="right">{formatMoney(grossSalary)}</TableCell>
                    <TableCell align="right">{formatMoney(totalDeductions)}</TableCell>
                    <TableCell align="right" sx={{ color: 'error.main' }}>{formatMoney(paye)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: 'success.main' }}>{formatMoney(netSalary)}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Simulate Employee">
                        <IconButton
                          size="small"
                          onClick={() => onSimulate(row.employee?.id)}
                          disabled={isSimulating}
                          color="primary"
                        >
                          {isSimulating ? <CircularProgress size={16} /> : <VisibilityOutlined fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredRows.length > 10 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="caption" color="text.secondary">
                      Showing 10 of {filteredRows.length} employees
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {filteredRows.length > 1 && (
                <TableRow sx={{ fontWeight: 'bold', bgcolor: 'action.hover' }}>
                  <TableCell>Totals</TableCell>
                  <TableCell align="right">
                    {formatMoney(filteredRows.reduce((s: number, r: any) => s + (r.basic_salary || 0), 0))}
                  </TableCell>
                  <TableCell align="right">
                    {formatMoney(filteredRows.reduce((s: number, r: any) => s + calculateTotalAllowances(r.allowances || []), 0))}
                  </TableCell>
                  <TableCell align="right">
                    {formatMoney(filteredRows.reduce((s: number, r: any) => s + (r.gross_salary || calculateGrossSalary(r.basic_salary || 0, r.allowances || [])), 0))}
                  </TableCell>
                  <TableCell align="right">
                    {formatMoney(filteredRows.reduce((s: number, r: any) => s + calculateTotalDeductions(r.deductions || []), 0))}
                  </TableCell>
                  <TableCell align="right">
                    {formatMoney(filteredRows.reduce((s: number, r: any) => s + (r.paye || 0), 0))}
                  </TableCell>
                  <TableCell align="right">
                    {formatMoney(filteredRows.reduce((s: number, r: any) => s + (r.net_salary || calculateNetSalary(r.basic_salary || 0, r.allowances || [], r.deductions || [], r.paye || 0)), 0))}
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

export const PayslipsTab = ({ payslips, search, onSearchChange, onViewPayslip, runStatus, isPaid, isPosted }: PayslipsTabProps) => {
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
      <Stack direction="row" spacing={1} mb={2} alignItems="center" flexWrap="wrap" useFlexGap>
        <TextField
          size="small"
          placeholder="Search payslip..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ minWidth: 260 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: search && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => onSearchChange('')}>
                  <CloseOutlined fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Typography variant="caption" color="text.secondary">
          {filteredPayslips.length} of {payslips.length} payslips
        </Typography>
      </Stack>

      {filteredPayslips.length === 0 ? (
        <Typography variant="body2" color="text.secondary" py={2}>
          {search ? 'No payslips match your search.' : 'No payslips found for this run.'}
        </Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell align="right">Basic Salary</TableCell>
                <TableCell align="right">Allowances</TableCell>
                <TableCell align="right">Gross Pay</TableCell>
                <TableCell align="right">Deductions</TableCell>
                <TableCell align="right">PAYE</TableCell>
                <TableCell align="right">Net Pay</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPayslips.slice(0, 10).map((payslip: any, index: number) => {
                const employee = payslip.employee || payslip;
                return (
                  <TableRow key={index}>
                    <TableCell>
                      <Typography variant="body2">{getEmployeeName(employee)}</Typography>
                    </TableCell>
                    <TableCell align="right">{formatMoney(payslip.basic_salary || 0)}</TableCell>
                    <TableCell align="right">{formatMoney(payslip.total_allowances || 0)}</TableCell>
                    <TableCell align="right">{formatMoney(payslip.gross_salary || 0)}</TableCell>
                    <TableCell align="right">{formatMoney(payslip.total_deductions || 0)}</TableCell>
                    <TableCell align="right" sx={{ color: 'error.main' }}>{formatMoney(payslip.paye || 0)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: 'success.main' }}>{formatMoney(payslip.net_salary || 0)}</TableCell>
                    <TableCell align="center">
                      <Chip label={runStatus || 'approved'} size="small" color={isPaid ? 'success' : isPosted ? 'primary' : 'info'} />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Payslip">
                        <IconButton size="small" onClick={() => onViewPayslip(payslip)} color="primary">
                          <VisibilityOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredPayslips.length > 10 && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography variant="caption" color="text.secondary">
                      Showing 10 of {filteredPayslips.length} payslips
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {filteredPayslips.length > 1 && (
                <TableRow sx={{ fontWeight: 'bold', bgcolor: 'action.hover' }}>
                  <TableCell>Totals</TableCell>
                  <TableCell align="right">
                    {formatMoney(filteredPayslips.reduce((s: number, p: any) => s + (p.basic_salary || 0), 0))}
                  </TableCell>
                  <TableCell align="right">
                    {formatMoney(filteredPayslips.reduce((s: number, p: any) => s + (p.total_allowances || 0), 0))}
                  </TableCell>
                  <TableCell align="right">
                    {formatMoney(filteredPayslips.reduce((s: number, p: any) => s + (p.gross_salary || 0), 0))}
                  </TableCell>
                  <TableCell align="right">
                    {formatMoney(filteredPayslips.reduce((s: number, p: any) => s + (p.total_deductions || 0), 0))}
                  </TableCell>
                  <TableCell align="right">
                    {formatMoney(filteredPayslips.reduce((s: number, p: any) => s + (p.paye || 0), 0))}
                  </TableCell>
                  <TableCell align="right">
                    {formatMoney(filteredPayslips.reduce((s: number, p: any) => s + (p.net_salary || 0), 0))}
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

export const ApprovalsTab = ({ hasChain, approvalChain, approvals }: ApprovalsTabProps) => {
  if (!hasChain || !approvalChain?.levels) {
    return (
      <Typography variant="body2" color="text.secondary" py={2}>
        This run uses direct approval (no approval chain).
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>Approval Chain</Typography>
      {approvalChain.levels.map((level: any, index: number) => {
        const approval = approvals?.find((a: any) => a.chain_level_id === level.id);
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
              bgcolor: isApproved ? 'success.light' : isRejected ? 'error.light' : isPending ? 'warning.light' : 'transparent',
              borderRadius: 1,
            }}
          >
            <Box>
              <Typography variant="body2" fontWeight={500}>
                Level {index + 1}: {level.name || level.level_name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {level.role?.name || 'Approver'}
              </Typography>
              {approval?.remarks && (
                <Typography variant="caption" display="block" color="text.secondary">
                  Remark: {approval.remarks}
                </Typography>
              )}
            </Box>
            <Chip
              label={isApproved ? 'Approved' : isRejected ? 'Rejected' : isPending ? 'Pending' : 'Unknown'}
              color={isApproved ? 'success' : isRejected ? 'error' : isPending ? 'warning' : 'default'}
              size="small"
            />
          </Paper>
        );
      })}
    </Box>
  );
};