export interface PayslipAllowance {
  amount?: number | string;
  value?: number | string;
  label: string;
  name?: string;
  taxable?: boolean;
  is_taxable?: boolean;
  allowance_type?: {
    name?: string;
    taxable?: boolean;
    is_taxable?: boolean;
  };
}

export interface PayslipDeduction {
  amount?: number | string;
  value?: number | string;
  label: string;
  name?: string;
  category?: string;
  is_pre_tax?: boolean;
  deduction_type?: {
    name?: string;
    category?: string;
    is_pre_tax?: boolean;
  };
}

export interface PayslipEmployerContribution {
  amount?: number | string;
  value?: number | string;
  label?: string;
  name?: string;
  category?: string;
  contribution_type?: {
    name?: string;
    category?: string;
  };
}

export interface PayrollRunLike {
  basic_salary?: number | string;
  paye?: number | string;
  allowances?: PayslipAllowance[];
  employee_allowances?: PayslipAllowance[];
  deductions?: PayslipDeduction[];
  employee_deductions?: PayslipDeduction[];
  employer_contributions?: PayslipEmployerContribution[];
  employee_employer_contributions?: PayslipEmployerContribution[];
}

export interface PayslipEarningRow {
  label: string;
  amount: number;
  taxable: boolean;
}

export interface PayslipDeductionRow {
  label: string;
  category: string;
  amount: number;
  isPreTax: boolean;
}

export interface PayslipEmployerContributionRow {
  label: string;
  category: string;
  amount: number;
}

export interface PayslipComputed {
  basicSalary: number;
  paye: number;
  earningsRows: PayslipEarningRow[];
  deductionRows: PayslipDeductionRow[];
  employerContributionRows: PayslipEmployerContributionRow[];
  totalAllowances: number;
  taxableAllowances: number;
  grossSalary: number;
  preTaxDeductions: number;
  taxableIncome: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  totalEmployerContributions: number;
  totalEmployerCost: number;
}

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const isTaxCategory = (category?: string) => (category || '').toLowerCase() === 'tax';

export const getPayslipCalculations = (run?: PayrollRunLike | null): PayslipComputed => {
  const basicSalary = toNumber(run?.basic_salary);
  const paye = toNumber(run?.paye);

  const rawAllowances = [
    ...asArray<PayslipAllowance>(run?.allowances),
    ...asArray<PayslipAllowance>(run?.employee_allowances),
  ];

  const earningsRows: PayslipEarningRow[] = [
    {
      label: 'Basic Salary',
      amount: basicSalary,
      taxable: true,
    },
  ];

  rawAllowances.forEach((allowance, index) => {
    const amount = toNumber(allowance.amount ?? allowance.value);
    if (amount <= 0) return;

    const taxableFromType = allowance.allowance_type?.is_taxable ?? allowance.allowance_type?.taxable;
    const taxable =
      typeof allowance.is_taxable === 'boolean'
        ? allowance.is_taxable
        : typeof allowance.taxable === 'boolean'
          ? allowance.taxable
          : typeof taxableFromType === 'boolean'
            ? taxableFromType
            : true;

    earningsRows.push({
      label: allowance.label,
      amount,
      taxable,
    });
  });

  const totalAllowances = earningsRows
    .slice(1)
    .reduce((sum, row) => sum + row.amount, 0);

  const taxableAllowances = earningsRows
    .slice(1)
    .filter((row) => row.taxable)
    .reduce((sum, row) => sum + row.amount, 0);

  const grossSalary = basicSalary + totalAllowances;

  const rawDeductions = [
    ...asArray<PayslipDeduction>(run?.deductions),
    ...asArray<PayslipDeduction>(run?.employee_deductions),
  ];

  const deductionRows: PayslipDeductionRow[] = [];

  rawDeductions.forEach((deduction) => {
    const amount = toNumber(deduction.amount ?? deduction.value);
    if (amount <= 0) return;

    const category = (deduction.category || deduction.deduction_type?.category || 'other').toLowerCase();

    if (isTaxCategory(category)) {
      return;
    }

    const isPreTax = Boolean(deduction.is_pre_tax ?? deduction.deduction_type?.is_pre_tax);

    deductionRows.push({
      label: deduction.label,
      category,
      amount,
      isPreTax,
    });
  });

  const preTaxDeductions = deductionRows
    .filter((row) => row.isPreTax)
    .reduce((sum, row) => sum + row.amount, 0);

  const taxableIncome = Math.max(0, basicSalary + taxableAllowances - preTaxDeductions);

  const otherDeductions = deductionRows.reduce((sum, row) => sum + row.amount, 0);
  const totalDeductions = paye + otherDeductions;
  const netSalary = grossSalary - paye - otherDeductions;

  const rawEmployerContributions = [
    ...asArray<PayslipEmployerContribution>(run?.employer_contributions),
    ...asArray<PayslipEmployerContribution>(run?.employee_employer_contributions),
  ];

  const employerContributionRows: PayslipEmployerContributionRow[] = [];

  rawEmployerContributions.forEach((contribution, index) => {
    const amount = toNumber(contribution.amount ?? contribution.value);
    if (amount <= 0) return;

    employerContributionRows.push({
      label:
        contribution.label ||
        contribution.contribution_type?.name ||
        contribution.name ||
        `Employer Contribution ${index + 1}`,
      category: (contribution.category || contribution.contribution_type?.category || 'other').toLowerCase(),
      amount,
    });
  });

  const totalEmployerContributions = employerContributionRows.reduce(
    (sum, row) => sum + row.amount,
    0
  );
  const totalEmployerCost = grossSalary + totalEmployerContributions;

  return {
    basicSalary,
    paye,
    earningsRows,
    deductionRows,
    employerContributionRows,
    totalAllowances,
    taxableAllowances,
    grossSalary,
    preTaxDeductions,
    taxableIncome,
    otherDeductions,
    totalDeductions,
    netSalary,
    totalEmployerContributions,
    totalEmployerCost,
  };
};
