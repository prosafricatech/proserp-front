'use client';

import PdfLogo from '@/components/pdf/PdfLogo';
import { Organization } from '@/types/auth-types';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

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

export interface PayrollPeriodPDFProp {
  organization: Organization;
  allowanceTypes?: Array<any>;
  contributionTypes?: Array<any>;
  created_at?: String;
  created_by?: Number;
  deductionTypes?: Array<any>;
  deleted_at?: String;
  id?: Number;
  month?: Number;
  periodLabel?: String;
  remarks?: String;
  rows?: Array<any>;
  runs?: Array<any>;
  runs_count?: Number;
  updated_at?: String;
  year?: Number;
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

const fmt = (value: number) =>
  value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const percentOf = (part: number, total: number) => {
  if (!total) return '0%';
  return `${Math.round((part / total) * 100)}%`;
};

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

function getEmployeeName(run: any) {
  if (!run?.employee) return '';
  const employee = run.employee as any;
  if (employee.name) return employee.name;
  const firstName = run.employee.first_name || '';
  const lastName = run.employee.last_name || '';
  return `${firstName} ${lastName}`.trim();
}

function getEmployeeNumber(run: any) {
  return run?.employee?.employee_number || '-';
}

function getDesignation(run: any) {
  if (run?.contract?.designation?.title) return run.contract.designation.title;
  if ((run as any)?.designation) return (run as any).designation;
  return '-';
}

function sumAllowanceByType(run: any, type: SalaryTypeItem) {
  const targetId = type.id;
  const targetName = slug(type.name || '');
  return (run?.allowances || []).reduce((sum: number, item: any) => {
    const byId = targetId != null && item.allowance_type_id === targetId;
    const byName =
      targetName &&
      slug(item.allowance_type?.name || item.label || '') === targetName;
    if (!byId && !byName) return sum;
    return sum + toNumber(item.amount ?? item.value);
  }, 0);
}

function sumDeductionByType(run: any, type: SalaryTypeItem) {
  const targetId = type.id;
  const targetName = slug(type.name || '');
  return (run?.deductions || []).reduce((sum: number, item: any) => {
    const byId = targetId != null && item.deduction_type_id === targetId;
    const byName =
      targetName &&
      slug(item.deduction_type?.name || item.label || '') === targetName;
    if (!byId && !byName) return sum;
    return sum + toNumber(item.amount ?? item.value);
  }, 0);
}

function sumContributionByType(run: any, type: SalaryTypeItem) {
  const targetId = type.id;
  const targetName = slug(type.name || '');
  return (run?.employer_contributions || []).reduce(
    (sum: number, item: any) => {
      const byId =
        targetId != null && item.employer_contribution_type_id === targetId;
      const byName =
        targetName &&
        slug(item.contribution_type?.name || item.label || '') === targetName;
      if (!byId && !byName) return sum;
      return sum + toNumber(item.amount ?? item.value);
    },
    0
  );
}

const PayrollPeriodPDF = ({
  organization,
  allowanceTypes = [],
  contributionTypes = [],
  deductionTypes = [],
  periodLabel,
  rows = [],
  runs = [],
}: PayrollPeriodPDFProp) => {
  const mainColor = (organization as any)?.settings?.main_color || '#2113AD';
  const lightColor = (organization as any)?.settings?.light_color || '#d9dfef';
  const contrastText =
    (organization as any)?.settings?.contrast_text || '#FFFFFF';

  const mappedRows = runs.map((run: any) => {
    const matchingRows = rows.filter(
      (row: any) => row.run?.cost_center_id === run?.cost_center_id
    );
    return {
      ...run,
      cost_center: run.cost_center,
      employees: [...(run.run || []), ...matchingRows],
    };
  });

  const costCenterFlex = 2;
  const serialFlex = 0.5;
  const nameFlex = 2.5;
  const empNoFlex = 1.2;
  const designationFlex = 1.8;
  const colFlex = 1.5;

  const recruitmentFlex = serialFlex + nameFlex + empNoFlex + designationFlex;
  const employeeFlex =
    colFlex * (4 + allowanceTypes.length + deductionTypes.length);
  const employerFlex = colFlex * (contributionTypes.length + 1);
  const identifierFlex = costCenterFlex + recruitmentFlex;

  const totals = rows.reduce(
    (sum: any, entry: any) => {
      const run = entry.run;
      const computed = entry.computed;
      return {
        basicSalary: sum.basicSalary + toNumber(computed?.basicSalary),
        grossSalary: sum.grossSalary + toNumber(computed?.grossSalary),
        paye: sum.paye + toNumber(computed?.paye),
        netSalary: sum.netSalary + toNumber(computed?.netSalary),
        totalEmployerContributions:
          sum.totalEmployerContributions +
          toNumber(computed?.totalEmployerContributions),
        totalEmployerCost:
          sum.totalEmployerCost + toNumber(computed?.totalEmployerCost),
        allowanceByType: sum.allowanceByType.map(
          (v: number, i: number) =>
            v + sumAllowanceByType(run, allowanceTypes[i])
        ),
        deductionByType: sum.deductionByType.map(
          (v: number, i: number) =>
            v + sumDeductionByType(run, deductionTypes[i])
        ),
        contributionByType: sum.contributionByType.map(
          (v: number, i: number) =>
            v + sumContributionByType(run, contributionTypes[i])
        ),
      };
    },
    {
      basicSalary: 0,
      grossSalary: 0,
      paye: 0,
      netSalary: 0,
      totalEmployerContributions: 0,
      totalEmployerCost: 0,
      allowanceByType: allowanceTypes.map(() => 0),
      deductionByType: deductionTypes.map(() => 0),
      contributionByType: contributionTypes.map(() => 0),
    }
  );

  const grossByEmployer = totals.totalEmployerCost;
  const netEmployeePayment = totals.netSalary;
  const payrollTaxesAndBenefits =
    totals.paye + totals.totalEmployerContributions;
  const summaryTotal =
    grossByEmployer + netEmployeePayment + payrollTaxesAndBenefits;

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
            <Text style={styles.subtitle}>{String(periodLabel || '')}</Text>
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
                flex: empNoFlex,
              }}
            >
              Emp. No.
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

            {allowanceTypes.map((type: any, idx: number) => (
              <Text
                key={`pdf-pp-allowance-header-${type.id || type.name}-${idx}`}
                style={{
                  ...styles.headerCell,
                  color: contrastText,
                  borderColor: mainColor,
                  flex: colFlex,
                }}
              >
                {type.name || 'Allowance'}
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

            {deductionTypes.map((type: any, idx: number) => (
              <Text
                key={`pdf-pp-deduction-header-${type.id || type.name}-${idx}`}
                style={{
                  ...styles.headerCell,
                  color: contrastText,
                  borderColor: mainColor,
                  flex: colFlex,
                }}
              >
                {type.name || 'Deduction'}
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

            {contributionTypes.map((type: any, idx: number) => (
              <Text
                key={`pdf-pp-contribution-header-${type.id || type.name}-${idx}`}
                style={{
                  ...styles.headerCell,
                  color: contrastText,
                  borderColor: mainColor,
                  flex: colFlex,
                }}
              >
                {type.name || 'Contribution'}
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

          {/* Data Rows — grouped by cost center */}
          {mappedRows.map((row: any, groupIndex: number) => {
            const employees = row.employees || [];
            const groupIsEven = groupIndex % 2 === 0;

            return employees.map((entry: any, empIndex: number) => {
              const run = entry.run;
              const computed = entry.computed;
              const backgroundColor = groupIsEven ? '#FFFFFF' : lightColor;
              const isFirst = empIndex === 0;

              return (
                <View
                  key={`pdf-pp-row-${run?.id || groupIndex}-${empIndex}`}
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
                    {isFirst ? row.cost_center?.name || '-' : ''}
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
                  <Text
                    style={{
                      ...styles.cell,
                      borderColor: '#C5C5C5',
                      flex: nameFlex,
                    }}
                  >
                    {getEmployeeName(run) || '-'}
                  </Text>
                  <Text
                    style={{
                      ...styles.cell,
                      borderColor: '#C5C5C5',
                      flex: empNoFlex,
                    }}
                  >
                    {getEmployeeNumber(run)}
                  </Text>
                  <Text
                    style={{
                      ...styles.cell,
                      borderColor: '#C5C5C5',
                      flex: designationFlex,
                    }}
                  >
                    {getDesignation(run)}
                  </Text>
                  <Text
                    style={{
                      ...styles.cell,
                      borderColor: '#C5C5C5',
                      flex: colFlex,
                      textAlign: 'right',
                    }}
                  >
                    {fmt(toNumber(computed?.basicSalary))}
                  </Text>

                  {allowanceTypes.map((type: any, typeIdx: number) => (
                    <Text
                      key={`pdf-pp-allowance-val-${run?.id || groupIndex}-${type.id || type.name}-${typeIdx}`}
                      style={{
                        ...styles.cell,
                        borderColor: '#C5C5C5',
                        flex: colFlex,
                        textAlign: 'right',
                      }}
                    >
                      {fmt(sumAllowanceByType(run, type))}
                    </Text>
                  ))}

                  <Text
                    style={{
                      ...styles.cell,
                      borderColor: '#C5C5C5',
                      flex: colFlex,
                      textAlign: 'right',
                    }}
                  >
                    {fmt(toNumber(computed?.grossSalary))}
                  </Text>

                  {deductionTypes.map((type: any, typeIdx: number) => (
                    <Text
                      key={`pdf-pp-deduction-val-${run?.id || groupIndex}-${type.id || type.name}-${typeIdx}`}
                      style={{
                        ...styles.cell,
                        borderColor: '#C5C5C5',
                        flex: colFlex,
                        textAlign: 'right',
                      }}
                    >
                      {fmt(sumDeductionByType(run, type))}
                    </Text>
                  ))}

                  <Text
                    style={{
                      ...styles.cell,
                      borderColor: '#C5C5C5',
                      flex: colFlex,
                      textAlign: 'right',
                    }}
                  >
                    {fmt(toNumber(computed?.paye))}
                  </Text>
                  <Text
                    style={{
                      ...styles.cell,
                      borderColor: '#C5C5C5',
                      flex: colFlex,
                      textAlign: 'right',
                    }}
                  >
                    {fmt(toNumber(computed?.netSalary))}
                  </Text>

                  {contributionTypes.map((type: any, typeIdx: number) => (
                    <Text
                      key={`pdf-pp-contribution-val-${run?.id || groupIndex}-${type.id || type.name}-${typeIdx}`}
                      style={{
                        ...styles.cell,
                        borderColor: '#C5C5C5',
                        flex: colFlex,
                        textAlign: 'right',
                      }}
                    >
                      {fmt(sumContributionByType(run, type))}
                    </Text>
                  ))}

                  <Text
                    style={{
                      ...styles.cell,
                      borderColor: '#C5C5C5',
                      flex: colFlex,
                      textAlign: 'right',
                    }}
                  >
                    {fmt(toNumber(computed?.totalEmployerCost))}
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
              {fmt(totals.basicSalary)}
            </Text>

            {totals.allowanceByType.map((amount: number, idx: number) => (
              <Text
                key={`pdf-pp-allowance-total-${idx}`}
                style={{
                  ...styles.headerCell,
                  color: contrastText,
                  borderColor: mainColor,
                  flex: colFlex,
                  textAlign: 'right',
                }}
              >
                {fmt(amount)}
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
              {fmt(totals.grossSalary)}
            </Text>

            {totals.deductionByType.map((amount: number, idx: number) => (
              <Text
                key={`pdf-pp-deduction-total-${idx}`}
                style={{
                  ...styles.headerCell,
                  color: contrastText,
                  borderColor: mainColor,
                  flex: colFlex,
                  textAlign: 'right',
                }}
              >
                {fmt(amount)}
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
              {fmt(totals.paye)}
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
              {fmt(totals.netSalary)}
            </Text>

            {totals.contributionByType.map((amount: number, idx: number) => (
              <Text
                key={`pdf-pp-contribution-total-${idx}`}
                style={{
                  ...styles.headerCell,
                  color: contrastText,
                  borderColor: mainColor,
                  flex: colFlex,
                  textAlign: 'right',
                }}
              >
                {fmt(amount)}
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
              {fmt(totals.totalEmployerCost)}
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
            <Text style={styles.summarySubAmount}>{fmt(totals.paye)}</Text>
            <Text style={styles.summaryBlank}></Text>
            <Text style={styles.summaryPercent}>
              {percentOf(totals.paye, grossByEmployer)}
            </Text>
          </View>
          {contributionTypes.map((type: any, index: number) => (
            <View
              key={`pdf-pp-contribution-summary-${type.id || type.name}-${index}`}
              style={styles.summaryRow}
            >
              <Text style={styles.summarySubLabel}>{type.name}</Text>
              <Text style={styles.summarySubAmount}>
                {fmt(totals.contributionByType[index] || 0)}
              </Text>
              <Text style={styles.summaryBlank}></Text>
              <Text style={styles.summaryPercent}>
                {percentOf(
                  totals.contributionByType[index] || 0,
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
