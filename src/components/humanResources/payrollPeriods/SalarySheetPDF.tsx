// payrollPeriods/SalarySheetPDF.tsx
'use client';

import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Organization } from '@/types/auth-types';
import { PayrollRunType } from '../payrollRuns/PayrollRunType';
import { PayslipComputed } from '../payrollRuns/payslipCalculations';

type SalaryTypeItem = {
  id?: number;
  name?: string;
  category?: string;
  is_pre_tax?: boolean;
  computation_method?: 'fixed' | 'percentage_of_basic' | 'percentage_of_gross' | string;
  default_value?: number;
};

type SalarySheetRow = {
  run: PayrollRunType;
  computed: PayslipComputed;
};

type SalarySheetPDFProps = {
  organization: Organization;
  periodLabel: string;
  rows: SalarySheetRow[];
  allowanceTypes: SalaryTypeItem[];
  deductionTypes: SalaryTypeItem[];
  contributionTypes: SalaryTypeItem[];
};

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

function fmtTypeLabel(type: SalaryTypeItem, fallback: string) {
  const name = type.name || fallback;
  const raw = Number(type.default_value ?? 0);
  if (!Number.isFinite(raw) || raw <= 0) return name;

  const isPercentage = String(type.computation_method || '').startsWith('percentage');
  const valueText = isPercentage
    ? `${raw.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`
    : raw.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
    const byName = targetName && slug(item.allowance_type?.name || item.label || '') === targetName;
    if (!byId && !byName) return sum;
    return sum + toNumber(item.amount ?? item.value);
  }, 0);
}

function sumDeductionByType(run: PayrollRunType, type: SalaryTypeItem) {
  const targetId = type.id;
  const targetName = slug(type.name || '');

  return (run.deductions || []).reduce((sum, item) => {
    const byId = targetId != null && item.deduction_type_id === targetId;
    const byName = targetName && slug(item.deduction_type?.name || item.label || '') === targetName;
    if (!byId && !byName) return sum;
    return sum + toNumber(item.amount ?? item.value);
  }, 0);
}

function sumContributionByType(run: PayrollRunType, type: SalaryTypeItem) {
  const targetId = type.id;
  const targetName = slug(type.name || '');

  return (run.employer_contributions || []).reduce((sum, item) => {
    const byId = targetId != null && item.employer_contribution_type_id === targetId;
    const byName = targetName && slug(item.contribution_type?.name || item.label || '') === targetName;
    if (!byId && !byName) return sum;
    return sum + toNumber(item.amount ?? item.value);
  }, 0);
}

const SalarySheetPDF = ({
  organization,
  periodLabel,
  rows,
  allowanceTypes,
  deductionTypes,
  contributionTypes,
}: SalarySheetPDFProps) => {
  const mainColor = organization.settings?.main_color || '#2113AD';
  const lightColor = organization.settings?.light_color || '#d9dfef';
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';

  const preTaxDeductionTypes = deductionTypes.filter((type) => Boolean(type.is_pre_tax));
  const postTaxDeductionTypes = deductionTypes.filter((type) => !type.is_pre_tax);

  const serialFlex = 1;
  const nameFlex = 4;
  const designationFlex = 2;
  const recruitmentNudge = 0.25;

  const recruitmentFlex = serialFlex + nameFlex + designationFlex - recruitmentNudge;
  const totalsLeadFlex = serialFlex + nameFlex + designationFlex;
  const employeeFlex =
    2 * (allowanceTypes.length + preTaxDeductionTypes.length + postTaxDeductionTypes.length + 6) +
    recruitmentNudge;
  const employerFlex = 2 * (contributionTypes.length + 2);

  const totals = rows.reduce(
    (sum, entry) => {
      const allowanceByType = allowanceTypes.map((type) => sumAllowanceByType(entry.run, type));
      const preTaxDeductionByType = preTaxDeductionTypes.map((type) => sumDeductionByType(entry.run, type));
      const postTaxDeductionByType = postTaxDeductionTypes.map((type) => sumDeductionByType(entry.run, type));
      const contributionByType = contributionTypes.map((type) => sumContributionByType(entry.run, type));

      return {
        basicSalary: sum.basicSalary + entry.computed.basicSalary,
        grossSalary: sum.grossSalary + entry.computed.grossSalary,
        taxableSalary: sum.taxableSalary + entry.computed.taxableIncome,
        paye: sum.paye + entry.computed.paye,
        totalDeductions: sum.totalDeductions + entry.computed.totalDeductions,
        netSalary: sum.netSalary + entry.computed.netSalary,
        totalEmployerContributions:
          sum.totalEmployerContributions + entry.computed.totalEmployerContributions,
        totalEmployerCost: sum.totalEmployerCost + entry.computed.totalEmployerCost,
        allowanceByType: sum.allowanceByType.map((value, index) => value + allowanceByType[index]),
        preTaxDeductionByType: sum.preTaxDeductionByType.map(
          (value, index) => value + preTaxDeductionByType[index]
        ),
        postTaxDeductionByType: sum.postTaxDeductionByType.map(
          (value, index) => value + postTaxDeductionByType[index]
        ),
        contributionByType: sum.contributionByType.map((value, index) => value + contributionByType[index]),
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

  const grossByEmployer = totals.totalEmployerCost;
  const netEmployeePayment = totals.netSalary;
  const payrollTaxesAndBenefits = totals.paye + totals.totalEmployerContributions;
  const summaryTotal = grossByEmployer + netEmployeePayment + payrollTaxesAndBenefits;

  return (
    <Document title={`Salary Sheet ${periodLabel}`} author={organization.name} subject='Salary Sheet'>
      <Page size='A3' orientation='landscape' style={styles.page}>
        <View style={styles.headerRow}>
          <View style={{ width: 110 }}>
            <PdfLogo organization={organization} />
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ ...styles.title, color: mainColor }}>SALARY PAYROLL</Text>
            <Text style={styles.subtitle}>{periodLabel}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableRow}>
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

          <View style={{ ...styles.tableRow, backgroundColor: mainColor }}>
            <Text style={{ ...styles.headerCell, color: contrastText, borderColor: mainColor, flex: serialFlex }}>S/N</Text>
            <Text style={{ ...styles.headerCell, color: contrastText, borderColor: mainColor, flex: nameFlex }}>Name</Text>
            <Text style={{ ...styles.headerCell, color: contrastText, borderColor: mainColor, flex: designationFlex }}>Designation</Text>
            <Text style={{ ...styles.headerCell, color: contrastText, borderColor: mainColor, flex: 2 }}>Basic Salary</Text>

            {allowanceTypes.map((type, idx) => (
              <Text key={`pdf-allowance-header-${type.id || type.name}-${idx}`} style={{ ...styles.headerCell, color: contrastText, borderColor: mainColor, flex: 2 }}>
                {type.name || 'Allowance'}
              </Text>
            ))}

            <Text style={{ ...styles.headerCell, color: contrastText, borderColor: mainColor, flex: 2 }}>Gross</Text>

            {preTaxDeductionTypes.map((type, idx) => (
              <Text key={`pdf-pre-tax-header-${type.id || type.name}-${idx}`} style={{ ...styles.headerCell, color: contrastText, borderColor: mainColor, flex: 2 }}>
                {fmtTypeLabel(type, 'Pre-Tax Deduction')}
              </Text>
            ))}

            <Text style={{ ...styles.headerCell, color: contrastText, borderColor: mainColor, flex: 2 }}>Taxable Salary</Text>

            <Text style={{ ...styles.headerCell, color: contrastText, borderColor: mainColor, flex: 2 }}>PAYE</Text>

            {postTaxDeductionTypes.map((type, idx) => (
              <Text key={`pdf-post-tax-header-${type.id || type.name}-${idx}`} style={{ ...styles.headerCell, color: contrastText, borderColor: mainColor, flex: 2 }}>
                {fmtTypeLabel(type, 'Post-Tax Deduction')}
              </Text>
            ))}

            <Text style={{ ...styles.headerCell, color: contrastText, borderColor: mainColor, flex: 2 }}>Total Ded.</Text>
            <Text style={{ ...styles.headerCell, color: contrastText, borderColor: mainColor, flex: 2 }}>Net Payable</Text>

            {contributionTypes.map((type, idx) => (
              <Text key={`pdf-contribution-header-${type.id || type.name}-${idx}`} style={{ ...styles.headerCell, color: contrastText, borderColor: mainColor, flex: 2 }}>
                {fmtTypeLabel(type, 'Contribution')}
              </Text>
            ))}

            <Text style={{ ...styles.headerCell, color: contrastText, borderColor: mainColor, flex: 2 }}>
              Total Empr. Contrib.
            </Text>
            <Text style={{ ...styles.headerCell, color: contrastText, borderColor: mainColor, flex: 2 }}>
              Employer Cost
            </Text>
          </View>

          {rows.map((entry, index) => {
            const name = getEmployeeName(entry.run);
            const designation = getDesignation(entry.run);
            const backgroundColor = index % 2 === 0 ? '#FFFFFF' : lightColor;

            return (
              <View key={`pdf-row-${entry.run.id || index}-${index}`} style={{ ...styles.tableRow, backgroundColor }} wrap={false}>
                <Text style={{ ...styles.cell, borderColor: '#C5C5C5', flex: serialFlex }}>{index + 1}</Text>
                <Text style={{ ...styles.cell, borderColor: '#C5C5C5', flex: nameFlex }}>{name || '-'}</Text>
                <Text style={{ ...styles.cell, borderColor: '#C5C5C5', flex: designationFlex }}>{designation}</Text>
                <Text style={{ ...styles.cell, borderColor: '#C5C5C5', flex: 2, textAlign: 'right' }}>{fmt(entry.computed.basicSalary)}</Text>

                {allowanceTypes.map((type, typeIdx) => (
                  <Text key={`pdf-allowance-value-${entry.run.id || index}-${type.id || type.name}-${typeIdx}`} style={{ ...styles.cell, borderColor: '#C5C5C5', flex: 2, textAlign: 'right' }}>
                    {fmt(sumAllowanceByType(entry.run, type))}
                  </Text>
                ))}

                <Text style={{ ...styles.cell, borderColor: '#C5C5C5', flex: 2, textAlign: 'right' }}>{fmt(entry.computed.grossSalary)}</Text>

                {preTaxDeductionTypes.map((type, typeIdx) => (
                  <Text key={`pdf-pre-tax-value-${entry.run.id || index}-${type.id || type.name}-${typeIdx}`} style={{ ...styles.cell, borderColor: '#C5C5C5', flex: 2, textAlign: 'right' }}>
                    {fmt(sumDeductionByType(entry.run, type))}
                  </Text>
                ))}

                <Text style={{ ...styles.cell, borderColor: '#C5C5C5', flex: 2, textAlign: 'right' }}>{fmt(entry.computed.taxableIncome)}</Text>

                <Text style={{ ...styles.cell, borderColor: '#C5C5C5', flex: 2, textAlign: 'right' }}>{fmt(entry.computed.paye)}</Text>

                {postTaxDeductionTypes.map((type, typeIdx) => (
                  <Text key={`pdf-post-tax-value-${entry.run.id || index}-${type.id || type.name}-${typeIdx}`} style={{ ...styles.cell, borderColor: '#C5C5C5', flex: 2, textAlign: 'right' }}>
                    {fmt(sumDeductionByType(entry.run, type))}
                  </Text>
                ))}

                <Text style={{ ...styles.cell, borderColor: '#C5C5C5', flex: 2, textAlign: 'right' }}>{fmt(entry.computed.totalDeductions)}</Text>
                <Text style={{ ...styles.cell, borderColor: '#C5C5C5', flex: 2, textAlign: 'right' }}>{fmt(entry.computed.netSalary)}</Text>

                {contributionTypes.map((type, typeIdx) => (
                  <Text key={`pdf-contribution-value-${entry.run.id || index}-${type.id || type.name}-${typeIdx}`} style={{ ...styles.cell, borderColor: '#C5C5C5', flex: 2, textAlign: 'right' }}>
                    {fmt(sumContributionByType(entry.run, type))}
                  </Text>
                ))}

                <Text style={{ ...styles.cell, borderColor: '#C5C5C5', flex: 2, textAlign: 'right' }}>
                  {fmt(entry.computed.totalEmployerContributions)}
                </Text>
                <Text style={{ ...styles.cell, borderColor: '#C5C5C5', flex: 2, textAlign: 'right' }}>
                  {fmt(entry.computed.totalEmployerCost)}
                </Text>
              </View>
            );
          })}

          <View style={{ ...styles.tableRow, backgroundColor: mainColor }} wrap={false}>
            <Text style={{ ...styles.headerCell, color: contrastText, borderColor: mainColor, flex: totalsLeadFlex }}></Text>
            <Text style={{ ...styles.headerCell, color: contrastText, borderColor: mainColor, flex: 2, textAlign: 'right' }}>
              {fmt(totals.basicSalary)}
            </Text>

            {totals.allowanceByType.map((amount, index) => (
              <Text key={`pdf-allowance-total-${index}`} style={{ ...styles.headerCell, color: contrastText, borderColor: mainColor, flex: 2, textAlign: 'right' }}>
                {fmt(amount)}
              </Text>
            ))}

            <Text style={{ ...styles.headerCell, color: contrastText, borderColor: mainColor, flex: 2, textAlign: 'right' }}>
              {fmt(totals.grossSalary)}
            </Text>

            {totals.preTaxDeductionByType.map((amount, index) => (
              <Text key={`pdf-pre-tax-total-${index}`} style={{ ...styles.headerCell, color: contrastText, borderColor: mainColor, flex: 2, textAlign: 'right' }}>
                {fmt(amount)}
              </Text>
            ))}

            <Text style={{ ...styles.headerCell, color: contrastText, borderColor: mainColor, flex: 2, textAlign: 'right' }}>
              {fmt(totals.taxableSalary)}
            </Text>

            <Text style={{ ...styles.headerCell, color: contrastText, borderColor: mainColor, flex: 2, textAlign: 'right' }}>
              {fmt(totals.paye)}
            </Text>

            {totals.postTaxDeductionByType.map((amount, index) => (
              <Text key={`pdf-post-tax-total-${index}`} style={{ ...styles.headerCell, color: contrastText, borderColor: mainColor, flex: 2, textAlign: 'right' }}>
                {fmt(amount)}
              </Text>
            ))}

            <Text style={{ ...styles.headerCell, color: contrastText, borderColor: mainColor, flex: 2, textAlign: 'right' }}>
              {fmt(totals.totalDeductions)}
            </Text>
            <Text style={{ ...styles.headerCell, color: contrastText, borderColor: mainColor, flex: 2, textAlign: 'right' }}>
              {fmt(totals.netSalary)}
            </Text>

            {totals.contributionByType.map((amount, index) => (
              <Text key={`pdf-contribution-total-${index}`} style={{ ...styles.headerCell, color: contrastText, borderColor: mainColor, flex: 2, textAlign: 'right' }}>
                {fmt(amount)}
              </Text>
            ))}

            <Text style={{ ...styles.headerCell, color: contrastText, borderColor: mainColor, flex: 2, textAlign: 'right' }}>
              {fmt(totals.totalEmployerContributions)}
            </Text>
            <Text style={{ ...styles.headerCell, color: contrastText, borderColor: mainColor, flex: 2, textAlign: 'right' }}>
              {fmt(totals.totalEmployerCost)}
            </Text>
          </View>
        </View>

        <View style={styles.summaryWrap}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Gross Pay by Employer</Text>
            <Text style={styles.summaryBlank}></Text>
            <Text style={styles.summaryAmount}>{fmt(grossByEmployer)}</Text>
            <Text style={styles.summaryPercent}>{percentOf(grossByEmployer, grossByEmployer)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Net Employee Payment</Text>
            <Text style={styles.summaryBlank}></Text>
            <Text style={styles.summaryAmount}>{fmt(netEmployeePayment)}</Text>
            <Text style={styles.summaryPercent}>{percentOf(netEmployeePayment, grossByEmployer)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Payroll Taxes & Benefits</Text>
            <Text style={styles.summaryBlank}></Text>
            <Text style={styles.summaryAmount}>{fmt(payrollTaxesAndBenefits)}</Text>
            <Text style={styles.summaryPercent}>{percentOf(payrollTaxesAndBenefits, grossByEmployer)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summarySubLabel}>P.A.Y.E</Text>
            <Text style={styles.summarySubAmount}>{fmt(totals.paye)}</Text>
            <Text style={styles.summaryBlank}></Text>
            <Text style={styles.summaryPercent}>{percentOf(totals.paye, grossByEmployer)}</Text>
          </View>
          {contributionTypes.map((type, index) => (
            <View key={`pdf-contribution-summary-${type.id || type.name}-${index}`} style={styles.summaryRow}>
              <Text style={styles.summarySubLabel}>{type.name}</Text>
              <Text style={styles.summarySubAmount}>{fmt(totals.contributionByType[index] || 0)}</Text>
              <Text style={styles.summaryBlank}></Text>
              <Text style={styles.summaryPercent}>{percentOf(totals.contributionByType[index] || 0, grossByEmployer)}</Text>
            </View>
          ))}
          <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: '#000' }]}>
            <Text style={styles.summaryLabel}></Text>
            <Text style={styles.summaryBlank}></Text>
            <Text style={styles.summaryAmount}>{fmt(summaryTotal)}</Text>
            <Text style={styles.summaryPercent}></Text>
          </View>
        </View>

        <View style={styles.signaturesWrap}>
          <View style={styles.signatureRow}>
            <Text style={styles.signatureLabel}>Prepared by.............................................................................................................</Text>
            <Text style={styles.signatureText}>Signature..................................</Text>
          </View>
          <View style={styles.signatureRow}>
            <Text style={styles.signatureLabel}>Verified by................................................................................................................</Text>
            <Text style={styles.signatureText}>Signature..................................</Text>
          </View>
          <View style={styles.signatureRow}>
            <Text style={styles.signatureLabel}>Approved by..............................................................................................................</Text>
            <Text style={styles.signatureText}>Signature..................................</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default SalarySheetPDF;