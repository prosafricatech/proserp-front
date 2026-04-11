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
  name?: string;
  category?: string;
  is_pre_tax?: boolean;
  deduction_type?: {
    name?: string;
    category?: string;
    is_pre_tax?: boolean;
  };
}

export interface PayrollRunLike {
  basic_salary?: number | string;
  paye?: number | string;
  allowances?: PayslipAllowance[];
  employee_allowances?: PayslipAllowance[];
  deductions?: PayslipDeduction[];
  employee_deductions?: PayslipDeduction[];
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

export interface PayslipComputed {
  basicSalary: number;
  paye: number;
  earningsRows: PayslipEarningRow[];
  deductionRows: PayslipDeductionRow[];
  totalAllowances: number;
  taxableAllowances: number;
  grossSalary: number;
  preTaxDeductions: number;
  taxableIncome: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
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

  rawDeductions.forEach((deduction, index) => {
    const amount = toNumber(deduction.amount ?? deduction.value);
    if (amount <= 0) return;

    const category = (deduction.category || deduction.deduction_type?.category || 'other').toLowerCase();

    if (isTaxCategory(category)) {
      return;
    }

    const isPreTax = Boolean(deduction.is_pre_tax ?? deduction.deduction_type?.is_pre_tax);

    deductionRows.push({
      label:
        deduction.deduction_type?.name ||
        deduction.name ||
        `Deduction ${index + 1}`,
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

  return {
    basicSalary,
    paye,
    earningsRows,
    deductionRows,
    totalAllowances,
    taxableAllowances,
    grossSalary,
    preTaxDeductions,
    taxableIncome,
    otherDeductions,
    totalDeductions,
    netSalary,
  };
};
