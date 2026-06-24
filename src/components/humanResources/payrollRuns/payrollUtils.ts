// components/humanResources/payrollRuns/payrollUtils.ts

export const formatMoney = (value: number) =>
  Number(value || 0).toLocaleString();

export const getEmployeeName = (employee: any) => {
  if (!employee) return 'Unknown Employee';
  return employee.name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Unknown Employee';
};

export const calculateTotalAllowances = (allowances: any[]) => {
  if (!allowances || !Array.isArray(allowances)) return 0;
  return allowances.reduce((sum, item) => sum + (item.amount || 0), 0);
};

export const calculateTotalDeductions = (deductions: any[]) => {
  if (!deductions || !Array.isArray(deductions)) return 0;
  return deductions.reduce((sum, item) => sum + (item.amount || 0), 0);
};

export const calculateGrossSalary = (basicSalary: number, allowances: any[]) => {
  return (basicSalary || 0) + calculateTotalAllowances(allowances);
};

export const calculateNetSalary = (basicSalary: number, allowances: any[], deductions: any[], paye: number) => {
  const gross = calculateGrossSalary(basicSalary, allowances);
  const totalDeductions = calculateTotalDeductions(deductions);
  return gross - totalDeductions - (paye || 0);
};

export const statusColor = (status: string): 'success' | 'warning' | 'error' | 'default' | 'info' => {
  switch (status?.toLowerCase()) {
    case 'finalized':
    case 'approved':
    case 'paid':
      return 'success';
    case 'submitted':
      return 'warning';
    case 'processing':
      return 'warning';
    case 'rejected':
    case 'cancelled':
      return 'error';
    case 'draft':
      return 'default';
    default:
      return 'default';
  }
};

export const processPayslips = (payslips: any[]) => {
  return payslips.map((payslip: any) => {
    const allowances = payslip.allowances || [];
    const deductions = payslip.deductions || [];
    const basicSalary = payslip.basic_salary || 0;
    const paye = payslip.paye || 0;
    
    const totalAllowances = calculateTotalAllowances(allowances);
    const totalDeductions = calculateTotalDeductions(deductions);
    const grossSalary = calculateGrossSalary(basicSalary, allowances);
    const netSalary = calculateNetSalary(basicSalary, allowances, deductions, paye);

    return {
      ...payslip,
      total_allowances: totalAllowances,
      total_deductions: totalDeductions,
      gross_salary: grossSalary,
      net_salary: netSalary,
    };
  });
};