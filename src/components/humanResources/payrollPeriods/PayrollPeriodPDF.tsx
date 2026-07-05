'use client';

import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Organization } from '@/types/auth-types';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { Employee } from '../employees/EmployeesType';
import { ContractType } from '../employees/profile/employeesContracts/ContractType';

type EmployeeType = Employee & {
  basic_salary: number;
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

type RunType = {
  cost_center: CostCenter;
  cost_center_id: number;
  id: number;
  payslips: Array<PayslipType>;
  status: string;
  [key: string]: any;
};

export interface PayrollPeriodPDFProp {
  organization: Organization;
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

const styles = StyleSheet.create({
  page: {
    padding: 16,
    fontSize: 7,
    fontFamily: 'Helvetica',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 8,
  },
  table: {
    display: 'table' as any,
    width: '100%',
  },
  tableRow: {
    flexDirection: 'row',
  },
  groupHeaderCell: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontSize: 7,
    fontWeight: 'bold',
    textAlign: 'center',
    borderWidth: 1,
    borderStyle: 'solid',
  },
  headerCell: {
    padding: 3,
    fontSize: 6.5,
    fontWeight: 'bold',
    borderWidth: 0.5,
    borderStyle: 'solid',
  },
  cell: {
    padding: 3,
    fontSize: 6.2,
    borderWidth: 0.5,
    borderStyle: 'solid',
  },
  empNumberText: {
    fontSize: 5.5,
    color: '#777777',
  },
  summaryWrap: {
    marginTop: 10,
    width: '56%',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 16,
    borderBottomWidth: 0.5,
    borderBottomStyle: 'solid',
    borderBottomColor: '#B8B8B8',
  },
  summaryLabel: {
    flex: 5,
    fontSize: 8,
    fontWeight: 'bold',
    paddingRight: 6,
  },
  summarySubLabel: {
    flex: 5,
    fontSize: 8,
    fontStyle: 'italic',
    paddingLeft: 10,
    paddingRight: 6,
  },
  summaryAmount: {
    flex: 2,
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  summarySubAmount: {
    flex: 2,
    fontSize: 8,
    fontStyle: 'italic',
    textAlign: 'right',
  },
  summaryBlank: {
    flex: 2,
  },
  summaryPercent: {
    flex: 1,
    fontSize: 8,
    fontStyle: 'italic',
    textAlign: 'right',
  },
  signaturesWrap: {
    marginTop: 14,
    width: '100%',
  },
  signatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 20,
    borderBottomWidth: 0.5,
    borderBottomStyle: 'solid',
    borderBottomColor: '#B8B8B8',
  },
  signatureLabel: {
    flex: 7,
    fontSize: 10,
    fontWeight: 'bold',
  },
  signatureText: {
    flex: 3,
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'left',
  },
});

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

const fmt = (value: number) =>
  value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const percentOf = (part: number, total: number) => {
  if (!total) return '0%';
  return `${Math.round((part / total) * 100)}%`;
};

function employeeComputedTotals(employee: EmployeeType) {
  const basicSalary = employee.basic_salary;
  const totalAllowances = (employee.allwances ?? []).reduce(
    (sum: number, a: any) => sum + (a.amount ?? 0),
    0
  );
  const totalDeductions = (employee.deductions ?? []).reduce(
    (sum: number, d: any) => sum + (d.amount ?? 0),
    0
  );
  const totalContributions = (employee.employer_contributions ?? []).reduce(
    (sum: number, c: any) => sum + (c.amount ?? 0),
    0
  );
  const grossSalary = basicSalary + totalAllowances;
  const netPay = grossSalary - totalDeductions;
  const totalEmpCost = grossSalary + totalContributions;
  return { grossSalary, netPay, totalEmpCost };
}

function getEmployeeName(employee: Employee) {
  const firstName = employee?.first_name || '';
  const lastName = employee?.last_name || '';
  return `${firstName} ${lastName}`.trim() || '-';
}

const PayrollPeriodPDF = ({
  organization,
  period,
  runs = [],
  hasTypes,
  employeeTypes,
  uniqueTypes,
}: PayrollPeriodPDFProp) => {
  const mainColor = (organization as any)?.settings?.main_color || '#2113AD';
  const lightColor = (organization as any)?.settings?.light_color || '#d9dfef';
  const contrastText =
    (organization as any)?.settings?.contrast_text || '#FFFFFF';

  const periodLabel = `${monthNames[(period?.month ?? 1) - 1]} ${period?.year} - ${runs[0]?.cost_center?.name || 'Company-wide Run'}`;

  const hasAllowances = hasTypes?.hasAllowances;
  const hasDeductions = hasTypes?.hasDeductions;
  const hasContributions = hasTypes?.hasContributions;

  const allowanceTypes = employeeTypes?.employeeAllowances ?? [];
  const deductionTypes = employeeTypes?.employeeDeductions ?? [];
  const contributionTypes = employeeTypes?.employeecontributions ?? [];

  const unique_allowances_types = uniqueTypes?.unique_allowances_types ?? [];
  const unique_deductions_types = (
    uniqueTypes?.unique_deductions_types ?? []
  ).filter((t: any) => t.deduction_type_id !== null);
  const unique_contributions_types =
    uniqueTypes?.unique_contributions_types ?? [];

  const calculateTotalAmtByType = (
    typeObj: any,
    type_id: number,
    type: 'deduction' | 'allowance' | 'contribution'
  ) => {
    if (type === 'allowance') {
      return allowanceTypes.reduce(
        (sum: number, item: any) =>
          item.allowance_type_id === type_id || item.label === typeObj.label
            ? sum + (item?.amount ?? 0)
            : sum,
        0
      );
    }
    if (type === 'deduction') {
      return deductionTypes.reduce(
        (sum: number, item: any) =>
          item.deduction_type_id === type_id || item.label === typeObj.label
            ? sum + (item?.amount ?? 0)
            : sum,
        0
      );
    }
    if (type === 'contribution') {
      return contributionTypes.reduce(
        (sum: number, item: any) =>
          item.employer_contribution_type_id === type_id
            ? sum + (item?.amount ?? 0)
            : sum,
        0
      );
    }
    return 0;
  };

  const allEmployees: EmployeeType[] = runs.flatMap((run) =>
    run.payslips.map((slip, idx) => ({
      ...slip.employee,
      basic_salary: slip.contract?.basic_salary ?? 0,
      allwances: slip.allowances ?? [],
      deductions: slip.deductions ?? [],
      employer_contributions: slip.employer_contributions ?? [],
      paye: slip.paye ?? 0,
      slipIndex: idx,
    }))
  );

  const payrollTotals = allEmployees.reduce(
    (sum, employee) => ({
      totalBasicSalary: sum.totalBasicSalary + employee.basic_salary,
      totalGross: sum.totalGross + employeeComputedTotals(employee).grossSalary,
      totalNetPay: sum.totalNetPay + employeeComputedTotals(employee).netPay,
      totalEmpCost:
        sum.totalEmpCost + employeeComputedTotals(employee).totalEmpCost,
      totalPaye: sum.totalPaye + employee.paye,
    }),
    {
      totalBasicSalary: 0,
      totalGross: 0,
      totalNetPay: 0,
      totalEmpCost: 0,
      totalPaye: 0,
    }
  );

  const totalContributions = unique_contributions_types.reduce(
    (sum: number, type: any) =>
      sum +
      (calculateTotalAmtByType(
        type,
        type.employer_contribution_type_id,
        'contribution'
      ) ?? 0),
    0
  );
  const grossByEmployer = payrollTotals.totalEmpCost;
  const netEmployeePayment = payrollTotals.totalNetPay;
  const payrollTaxesAndBenefits = payrollTotals.totalPaye + totalContributions;
  const summaryTotal =
    grossByEmployer + netEmployeePayment + payrollTaxesAndBenefits;

  const costCenterFlex = 2;
  const serialFlex = 0.5;
  const nameFlex = 2.5;
  const designationFlex = 1.8;
  const colFlex = 1.5;

  const recruitmentFlex = serialFlex + nameFlex + designationFlex;
  const employeeFlex =
    colFlex *
    (2 +
      (hasAllowances ? unique_allowances_types.length : 0) +
      (hasDeductions ? unique_deductions_types.length : 1));
  const employerFlex =
    colFlex * (2 + (hasContributions ? unique_contributions_types.length : 0));
  const identifierFlex = costCenterFlex + recruitmentFlex;

  return (
    <Document
      title={`Salary Payroll ${periodLabel}`}
      author={(organization as any)?.name}
      subject='Payroll Period'
    >
      <Page size='A3' orientation='landscape' style={styles.page}>
        <View style={styles.headerRow}>
          <View style={{ width: 110 }}>
            <PdfLogo organization={organization} />
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ ...styles.title, color: mainColor }}>
              SALARY PAYROLL
            </Text>
            <Text style={styles.subtitle}>{periodLabel}</Text>
          </View>
        </View>

        <View style={styles.table}>
          {/* Group Header Row */}
          <View style={styles.tableRow}>
            <Text
              style={{
                ...styles.groupHeaderCell,
                flex: costCenterFlex,
                backgroundColor: '#FFFFFF',
                color: mainColor,
                borderColor: mainColor,
              }}
            >
              COST CENTER
            </Text>
            <Text
              style={{
                ...styles.groupHeaderCell,
                flex: recruitmentFlex,
                backgroundColor: '#FFFFFF',
                color: mainColor,
                borderColor: mainColor,
              }}
            >
              RECRUITMENT
            </Text>
            <Text
              style={{
                ...styles.groupHeaderCell,
                flex: employeeFlex,
                backgroundColor: lightColor,
                color: mainColor,
                borderColor: mainColor,
              }}
            >
              EMPLOYEE
            </Text>
            <Text
              style={{
                ...styles.groupHeaderCell,
                flex: employerFlex,
                backgroundColor: '#FFFFFF',
                color: mainColor,
                borderColor: mainColor,
              }}
            >
              EMPLOYER
            </Text>
          </View>

          {/* Column Header Row */}
          <View style={{ ...styles.tableRow, backgroundColor: mainColor }}>
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: mainColor,
                flex: costCenterFlex,
              }}
            >
              Cost Center
            </Text>
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: mainColor,
                flex: serialFlex,
              }}
            >
              S/N
            </Text>
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: mainColor,
                flex: nameFlex,
              }}
            >
              Employee
            </Text>
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: mainColor,
                flex: designationFlex,
              }}
            >
              Designation
            </Text>
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: mainColor,
                flex: colFlex,
              }}
            >
              Basic Salary
            </Text>

            {hasAllowances &&
              unique_allowances_types.map((type: any, idx: number) => (
                <Text
                  key={`pdf-pp-allowance-header-${type.allowance_type_id || type.label}-${idx}`}
                  style={{
                    ...styles.headerCell,
                    color: contrastText,
                    borderColor: mainColor,
                    flex: colFlex,
                  }}
                >
                  {type.label || 'Allowance'}
                </Text>
              ))}

            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: mainColor,
                flex: colFlex,
              }}
            >
              Gross
            </Text>

            {hasDeductions &&
              unique_deductions_types.map((type: any, idx: number) => (
                <Text
                  key={`pdf-pp-deduction-header-${type.deduction_type_id || type.label}-${idx}`}
                  style={{
                    ...styles.headerCell,
                    color: contrastText,
                    borderColor: mainColor,
                    flex: colFlex,
                  }}
                >
                  {type.label || 'Deduction'}
                </Text>
              ))}

            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: mainColor,
                flex: colFlex,
              }}
            >
              PAYE
            </Text>
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: mainColor,
                flex: colFlex,
              }}
            >
              Net Payable
            </Text>

            {hasContributions &&
              unique_contributions_types.map((type: any, idx: number) => (
                <Text
                  key={`pdf-pp-contribution-header-${type.employer_contribution_type_id || type.label}-${idx}`}
                  style={{
                    ...styles.headerCell,
                    color: contrastText,
                    borderColor: mainColor,
                    flex: colFlex,
                  }}
                >
                  {type.label || 'Contribution'}
                </Text>
              ))}

            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: mainColor,
                flex: colFlex,
              }}
            >
              Total Empr. Cost
            </Text>
          </View>

          {/* Data Rows — grouped by cost center (run) */}
          {runs.map((run, groupIndex) => {
            const groupIsEven = groupIndex % 2 === 0;
            const employees: EmployeeType[] = run.payslips.map((slip, idx) => ({
              ...slip.employee,
              basic_salary: slip.contract?.basic_salary ?? 0,
              allwances: slip.allowances ?? [],
              deductions: slip.deductions ?? [],
              employer_contributions: slip.employer_contributions ?? [],
              paye: slip.paye ?? 0,
              slipIndex: idx,
            }));

            return employees.map((entry, empIndex) => {
              const backgroundColor = groupIsEven ? '#FFFFFF' : lightColor;
              const isFirst = empIndex === 0;
              const computed = employeeComputedTotals(entry);
              const contractId = run.payslips[entry.slipIndex]?.contract?.id;
              const designation =
                run.payslips[entry.slipIndex]?.contract?.designation?.title ||
                '-';

              return (
                <View
                  key={`pdf-pp-row-${run.id}-${entry.id ?? empIndex}`}
                  style={{ ...styles.tableRow, backgroundColor }}
                  wrap={false}
                >
                  <Text
                    style={{
                      ...styles.cell,
                      borderColor: '#C5C5C5',
                      flex: costCenterFlex,
                    }}
                  >
                    {isFirst ? run.cost_center?.name || '-' : ''}
                  </Text>
                  <Text
                    style={{
                      ...styles.cell,
                      borderColor: '#C5C5C5',
                      flex: serialFlex,
                    }}
                  >
                    {empIndex + 1}
                  </Text>
                  <View
                    style={{
                      ...styles.cell,
                      borderColor: '#C5C5C5',
                      flex: nameFlex,
                    }}
                  >
                    <Text>{getEmployeeName(entry)}</Text>
                    {entry.employee_number ? (
                      <Text style={styles.empNumberText}>
                        ({entry.employee_number})
                      </Text>
                    ) : null}
                  </View>
                  <Text
                    style={{
                      ...styles.cell,
                      borderColor: '#C5C5C5',
                      flex: designationFlex,
                    }}
                  >
                    {designation}
                  </Text>
                  <Text
                    style={{
                      ...styles.cell,
                      borderColor: '#C5C5C5',
                      flex: colFlex,
                      textAlign: 'right',
                    }}
                  >
                    {fmt(entry.basic_salary)}
                  </Text>

                  {hasAllowances &&
                    unique_allowances_types.map(
                      (type: any, typeIdx: number) => (
                        <Text
                          key={`pdf-pp-allowance-val-${run.id}-${entry.id ?? empIndex}-${type.allowance_type_id || type.label}-${typeIdx}`}
                          style={{
                            ...styles.cell,
                            borderColor: '#C5C5C5',
                            flex: colFlex,
                            textAlign: 'right',
                          }}
                        >
                          {fmt(
                            allowanceTypes.find(
                              (itm: any) =>
                                itm.employee_contract_id === contractId &&
                                (itm.label === type.label ||
                                  itm.allowance_type_id ===
                                    type.allowance_type_id)
                            )?.amount ?? 0
                          )}
                        </Text>
                      )
                    )}

                  <Text
                    style={{
                      ...styles.cell,
                      borderColor: '#C5C5C5',
                      flex: colFlex,
                      textAlign: 'right',
                    }}
                  >
                    {fmt(computed.grossSalary)}
                  </Text>

                  {hasDeductions &&
                    unique_deductions_types.map(
                      (type: any, typeIdx: number) => (
                        <Text
                          key={`pdf-pp-deduction-val-${run.id}-${entry.id ?? empIndex}-${type.deduction_type_id || type.label}-${typeIdx}`}
                          style={{
                            ...styles.cell,
                            borderColor: '#C5C5C5',
                            flex: colFlex,
                            textAlign: 'right',
                          }}
                        >
                          {fmt(
                            deductionTypes.find(
                              (itm: any) =>
                                itm.employee_contract_id === contractId &&
                                (itm.label === type.label ||
                                  itm.deduction_type_id ===
                                    type.deduction_type_id)
                            )?.amount ?? 0
                          )}
                        </Text>
                      )
                    )}

                  <Text
                    style={{
                      ...styles.cell,
                      borderColor: '#C5C5C5',
                      flex: colFlex,
                      textAlign: 'right',
                    }}
                  >
                    {fmt(entry.paye ?? 0)}
                  </Text>
                  <Text
                    style={{
                      ...styles.cell,
                      borderColor: '#C5C5C5',
                      flex: colFlex,
                      textAlign: 'right',
                    }}
                  >
                    {fmt(computed.netPay)}
                  </Text>

                  {hasContributions &&
                    unique_contributions_types.map(
                      (type: any, typeIdx: number) => (
                        <Text
                          key={`pdf-pp-contribution-val-${run.id}-${entry.id ?? empIndex}-${type.employer_contribution_type_id || type.label}-${typeIdx}`}
                          style={{
                            ...styles.cell,
                            borderColor: '#C5C5C5',
                            flex: colFlex,
                            textAlign: 'right',
                          }}
                        >
                          {fmt(
                            contributionTypes.find(
                              (itm: any) =>
                                itm.employee_contract_id === contractId &&
                                (itm.label === type.label ||
                                  itm.employer_contribution_type_id ===
                                    type.employer_contribution_type_id)
                            )?.amount ?? 0
                          )}
                        </Text>
                      )
                    )}

                  <Text
                    style={{
                      ...styles.cell,
                      borderColor: '#C5C5C5',
                      flex: colFlex,
                      textAlign: 'right',
                    }}
                  >
                    {fmt(computed.totalEmpCost)}
                  </Text>
                </View>
              );
            });
          })}

          {/* Totals Row */}
          <View
            style={{ ...styles.tableRow, backgroundColor: mainColor }}
            wrap={false}
          >
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: mainColor,
                flex: identifierFlex,
              }}
            ></Text>
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: mainColor,
                flex: colFlex,
                textAlign: 'right',
              }}
            >
              {fmt(payrollTotals.totalBasicSalary)}
            </Text>

            {hasAllowances &&
              unique_allowances_types.map((type: any, idx: number) => (
                <Text
                  key={`pdf-pp-allowance-total-${type.allowance_type_id || type.label}-${idx}`}
                  style={{
                    ...styles.headerCell,
                    color: contrastText,
                    borderColor: mainColor,
                    flex: colFlex,
                    textAlign: 'right',
                  }}
                >
                  {fmt(
                    calculateTotalAmtByType(
                      type,
                      type.allowance_type_id,
                      'allowance'
                    ) ?? 0
                  )}
                </Text>
              ))}

            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: mainColor,
                flex: colFlex,
                textAlign: 'right',
              }}
            >
              {fmt(payrollTotals.totalGross)}
            </Text>

            {hasDeductions &&
              unique_deductions_types.map((type: any, idx: number) => (
                <Text
                  key={`pdf-pp-deduction-total-${type.deduction_type_id || type.label}-${idx}`}
                  style={{
                    ...styles.headerCell,
                    color: contrastText,
                    borderColor: mainColor,
                    flex: colFlex,
                    textAlign: 'right',
                  }}
                >
                  {fmt(
                    calculateTotalAmtByType(
                      type,
                      type.deduction_type_id,
                      'deduction'
                    ) ?? 0
                  )}
                </Text>
              ))}

            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: mainColor,
                flex: colFlex,
                textAlign: 'right',
              }}
            >
              {fmt(payrollTotals.totalPaye)}
            </Text>
            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: mainColor,
                flex: colFlex,
                textAlign: 'right',
              }}
            >
              {fmt(payrollTotals.totalNetPay)}
            </Text>

            {hasContributions &&
              unique_contributions_types.map((type: any, idx: number) => (
                <Text
                  key={`pdf-pp-contribution-total-${type.employer_contribution_type_id || type.label}-${idx}`}
                  style={{
                    ...styles.headerCell,
                    color: contrastText,
                    borderColor: mainColor,
                    flex: colFlex,
                    textAlign: 'right',
                  }}
                >
                  {fmt(
                    calculateTotalAmtByType(
                      type,
                      type.employer_contribution_type_id,
                      'contribution'
                    ) ?? 0
                  )}
                </Text>
              ))}

            <Text
              style={{
                ...styles.headerCell,
                color: contrastText,
                borderColor: mainColor,
                flex: colFlex,
                textAlign: 'right',
              }}
            >
              {fmt(payrollTotals.totalEmpCost)}
            </Text>
          </View>
        </View>

        <View style={styles.summaryWrap}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Gross Pay by Employer</Text>
            <Text style={styles.summaryBlank}></Text>
            <Text style={styles.summaryAmount}>{fmt(grossByEmployer)}</Text>
            <Text style={styles.summaryPercent}>
              {percentOf(grossByEmployer, grossByEmployer)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Net Employee Payment</Text>
            <Text style={styles.summaryBlank}></Text>
            <Text style={styles.summaryAmount}>{fmt(netEmployeePayment)}</Text>
            <Text style={styles.summaryPercent}>
              {percentOf(netEmployeePayment, grossByEmployer)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Payroll Taxes & Benefits</Text>
            <Text style={styles.summaryBlank}></Text>
            <Text style={styles.summaryAmount}>
              {fmt(payrollTaxesAndBenefits)}
            </Text>
            <Text style={styles.summaryPercent}>
              {percentOf(payrollTaxesAndBenefits, grossByEmployer)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summarySubLabel}>P.A.Y.E</Text>
            <Text style={styles.summarySubAmount}>
              {fmt(payrollTotals.totalPaye)}
            </Text>
            <Text style={styles.summaryBlank}></Text>
            <Text style={styles.summaryPercent}>
              {percentOf(payrollTotals.totalPaye, grossByEmployer)}
            </Text>
          </View>
          {unique_contributions_types.map((type: any, index: number) => (
            <View
              key={`pdf-pp-contribution-summary-${type.employer_contribution_type_id || type.label}-${index}`}
              style={styles.summaryRow}
            >
              <Text style={styles.summarySubLabel}>{type.label}</Text>
              <Text style={styles.summarySubAmount}>
                {fmt(
                  calculateTotalAmtByType(
                    type,
                    type.employer_contribution_type_id,
                    'contribution'
                  ) ?? 0
                )}
              </Text>
              <Text style={styles.summaryBlank}></Text>
              <Text style={styles.summaryPercent}>
                {percentOf(
                  calculateTotalAmtByType(
                    type,
                    type.employer_contribution_type_id,
                    'contribution'
                  ) ?? 0,
                  grossByEmployer
                )}
              </Text>
            </View>
          ))}
          <View
            style={[
              styles.summaryRow,
              { borderTopWidth: 1, borderTopColor: '#000' },
            ]}
          >
            <Text style={styles.summaryLabel}></Text>
            <Text style={styles.summaryBlank}></Text>
            <Text style={styles.summaryAmount}>{fmt(summaryTotal)}</Text>
            <Text style={styles.summaryPercent}></Text>
          </View>
        </View>

        <View style={styles.signaturesWrap}>
          <View style={styles.signatureRow}>
            <Text style={styles.signatureLabel}>
              Prepared
              by.............................................................................................................
            </Text>
            <Text style={styles.signatureText}>
              Signature..................................
            </Text>
          </View>
          <View style={styles.signatureRow}>
            <Text style={styles.signatureLabel}>
              Verified
              by................................................................................................................
            </Text>
            <Text style={styles.signatureText}>
              Signature..................................
            </Text>
          </View>
          <View style={styles.signatureRow}>
            <Text style={styles.signatureLabel}>
              Approved
              by..............................................................................................................
            </Text>
            <Text style={styles.signatureText}>
              Signature..................................
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default PayrollPeriodPDF;
