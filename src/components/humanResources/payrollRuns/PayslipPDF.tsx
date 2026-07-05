'use client';

import { Document, Page, Text, View } from '@react-pdf/renderer';
import React from 'react';
import pdfStyles from '@/components/pdf/pdf-styles';
import PageFooter from '@/components/pdf/PageFooter';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Organization } from '@/types/auth-types';
import { getPayslipCalculations } from './payslipCalculations';

interface PayrollRun {
  id: string;
  employee?: {
    first_name: string;
    last_name: string;
    employee_number: string;
  };
  contract?: {
    designation?: {
      title: string;
    };
  };
  basic_salary?: number;
  paye?: number;
  status?: string;
  payroll_period?: {
    period_name?: string;
    start_date?: string;
    end_date?: string;
  };
}

interface PayslipPDFProps {
  payrollRun: PayrollRun;
  organization: Organization;
}

function fmt(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtStatus(value?: string) {
  if (!value) return '-';
  return value
    .split('_')
    .join(' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const PayslipPDF: React.FC<PayslipPDFProps> = ({ payrollRun, organization }) => {
  const mainColor = organization.settings?.main_color || '#2113AD';
  const lightColor = organization.settings?.light_color || '#bec5da';
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';

  const name = payrollRun
    ? [payrollRun.employee?.first_name, payrollRun.employee?.last_name]
        .filter(Boolean)
        .join(' ')
    : '';

  const {
    paye,
    earningsRows,
    deductionRows,
    employerContributionRows,
    grossSalary,
    preTaxDeductions,
    taxableIncome,
    otherDeductions,
    totalDeductions,
    netSalary,
    totalEmployerContributions,
    totalEmployerCost,
  } = getPayslipCalculations(payrollRun);

  const netPaySummaryRows = [
    { label: 'Gross Salary', amount: fmt(grossSalary) },
    { label: 'Pre-Tax Deductions', amount: `- ${fmt(preTaxDeductions)}` },
    { label: 'Taxable Income', amount: fmt(taxableIncome) },
    { label: 'PAYE', amount: `- ${fmt(paye)}` },
    { label: 'Other Deductions', amount: `- ${fmt(otherDeductions)}` },
    { label: 'Net Salary', amount: fmt(netSalary), isTotal: true },
  ];

  const deductionTableRows = [
    { label: 'PAYE', category: 'Tax', amount: fmt(paye) },
    ...deductionRows.map((row) => ({
      label: row.label,
      category: row.category,
      amount: fmt(row.amount),
    })),
  ];

  const getRowColors = (index: number) => ({
    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
    color: '#111111',
  });

  return (
    <Document
      title={`Payslip ${name}`}
      author={organization.name}
      subject="Employee Payslip"
      creator="ProsERP"
      producer="ProsERP"
    >
      <Page size="A4" style={pdfStyles.page}>
        {/* Header with Logo */}
        <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
          <View style={{ flex: 1, maxWidth: organization?.logo_path ? 130 : 250 }}>
            <PdfLogo organization={organization} />
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>PAYSLIP</Text>
            <Text style={{ ...pdfStyles.midInfo }}>{name}</Text>
            {payrollRun?.employee?.employee_number && (
              <Text style={{ ...pdfStyles.minInfo }}>{payrollRun.employee.employee_number}</Text>
            )}
          </View>
        </View>

        {/* Employee & Period Info */}
        <View style={{ ...pdfStyles.tableRow, marginBottom: 15 }}>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Employee</Text>
            <Text style={{ ...pdfStyles.minInfo }}>{name}</Text>
          </View>
          {payrollRun?.contract?.designation?.title && (
            <View style={{ flex: 1, padding: 2 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Designation</Text>
              <Text style={{ ...pdfStyles.minInfo }}>{payrollRun.contract.designation.title}</Text>
            </View>
          )}
          {payrollRun?.payroll_period?.period_name && (
            <View style={{ flex: 1, padding: 2 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Period</Text>
              <Text style={{ ...pdfStyles.minInfo }}>{payrollRun.payroll_period.period_name}</Text>
            </View>
          )}
        </View>

        {/* Earnings Section */}
        <Text style={{ ...pdfStyles.majorInfo, color: mainColor, marginBottom: 0, textAlign: 'center' }}>
          EARNINGS
        </Text>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 2,
              }}
            >
              Description
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1,
              }}
            >
              Amount
            </Text>
          </View>

          {earningsRows.map((row, index) => {
            const { backgroundColor, color } = getRowColors(index);
            return (
            <View style={pdfStyles.tableRow} key={row.label}>
              <Text style={{ ...pdfStyles.tableCell, flex: 2, backgroundColor, color }}>
                {row.label}
                {!row.taxable ? ' (non-taxable)' : ''}
              </Text>
              <Text style={{ ...pdfStyles.tableCell, flex: 1, textAlign: 'right', backgroundColor, color }}>
                {fmt(row.amount)}
              </Text>
            </View>
          )})}

          <View
            style={{
              ...pdfStyles.tableRow,
              backgroundColor: mainColor,
            }}
          >
            <Text
              style={{
                ...pdfStyles.tableCell,
                flex: 2,
                fontWeight: 'bold',
                color: contrastText,
              }}
            >
              Gross Salary
            </Text>
            <Text
              style={{
                ...pdfStyles.tableCell,
                flex: 1,
                textAlign: 'right',
                fontWeight: 'bold',
                color: contrastText,
              }}
            >
              {fmt(grossSalary)}
            </Text>
          </View>
        </View>

        {/* Deductions Section */}
        <Text style={{ ...pdfStyles.majorInfo, color: mainColor, marginTop: 15, marginBottom: 0, textAlign: 'center' }}>
          DEDUCTIONS
        </Text>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 2,
              }}
            >
              Description
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1,
              }}
            >
              Category
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1,
              }}
            >
              Amount
            </Text>
          </View>

          {deductionTableRows.map((row, index) => {
            const { backgroundColor, color } = getRowColors(index);
            return (
              <View style={pdfStyles.tableRow} key={`${row.label}-${row.category}-${index}`}>
                <Text style={{ ...pdfStyles.tableCell, flex: 2, backgroundColor, color }}>{row.label}</Text>
                <Text style={{ ...pdfStyles.tableCell, flex: 1, backgroundColor, color }}>{row.category}</Text>
                <Text style={{ ...pdfStyles.tableCell, flex: 1, textAlign: 'right', backgroundColor, color }}>
                  {row.amount}
                </Text>
              </View>
            );
          })}

          <View
            style={{
              ...pdfStyles.tableRow,
              backgroundColor: mainColor,
            }}
          >
            <Text
              style={{
                ...pdfStyles.tableCell,
                flex: 2,
                fontWeight: 'bold',
                color: contrastText,
              }}
            >
              Total Deductions
            </Text>
            <Text
              style={{
                ...pdfStyles.tableCell,
                flex: 1,
                color: contrastText,
              }}
            >
              
            </Text>
            <Text
              style={{
                ...pdfStyles.tableCell,
                flex: 1,
                textAlign: 'right',
                fontWeight: 'bold',
                color: contrastText,
              }}
            >
              {fmt(totalDeductions)}
            </Text>
          </View>
        </View>

        {/* Net Pay Summary */}
        <Text style={{ ...pdfStyles.majorInfo, color: mainColor, marginTop: 15, marginBottom: 0, textAlign: 'center' }}>
          NET PAY SUMMARY
        </Text>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 2,
              }}
            >
              Description
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1,
              }}
            >
              Amount
            </Text>
          </View>

          {netPaySummaryRows.map((row, index) => (
            <View
              key={`${row.label}-${index}`}
              style={{
                ...pdfStyles.tableRow,
                ...(row.isTotal ? { backgroundColor: mainColor } : getRowColors(index)),
              }}
            >
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  flex: 2,
                  ...(!row.isTotal ? getRowColors(index) : {}),
                  ...(row.isTotal ? { fontWeight: 'bold', color: contrastText } : {}),
                }}
              >
                {row.label}
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  flex: 1,
                  textAlign: 'right',
                  ...(!row.isTotal ? getRowColors(index) : {}),
                  ...(row.isTotal ? { fontWeight: 'bold', color: contrastText } : {}),
                }}
              >
                {row.amount}
              </Text>
            </View>
          ))}
        </View>

        <Text style={{ ...pdfStyles.majorInfo, color: mainColor, marginTop: 15, marginBottom: 0, textAlign: 'center' }}>
          EMPLOYER CONTRIBUTIONS
        </Text>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 2,
              }}
            >
              Description
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1,
              }}
            >
              Category
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1,
              }}
            >
              Amount
            </Text>
          </View>

          {employerContributionRows.length === 0 ? (
            <View style={pdfStyles.tableRow}>
              <Text style={{ ...pdfStyles.tableCell, flex: 4 }}>No employer contributions</Text>
            </View>
          ) : (
            employerContributionRows.map((row, index) => {
              const { backgroundColor, color } = getRowColors(index);
              return (
                <View style={pdfStyles.tableRow} key={`${row.label}-${row.category}-${index}`}>
                  <Text style={{ ...pdfStyles.tableCell, flex: 2, backgroundColor, color }}>{row.label}</Text>
                  <Text style={{ ...pdfStyles.tableCell, flex: 1, backgroundColor, color }}>{row.category}</Text>
                  <Text style={{ ...pdfStyles.tableCell, flex: 1, textAlign: 'right', backgroundColor, color }}>
                    {fmt(row.amount)}
                  </Text>
                </View>
              );
            })
          )}

          <View style={{ ...pdfStyles.tableRow, backgroundColor: mainColor }}>
            <Text style={{ ...pdfStyles.tableCell, flex: 2, fontWeight: 'bold', color: contrastText }}>
              Total Employer Contributions
            </Text>
            <Text style={{ ...pdfStyles.tableCell, flex: 1, color: contrastText }}>
              
            </Text>
            <Text style={{ ...pdfStyles.tableCell, flex: 1, textAlign: 'right', fontWeight: 'bold', color: contrastText }}>
              {fmt(totalEmployerContributions)}
            </Text>
          </View>

          <View style={{ ...pdfStyles.tableRow, backgroundColor: mainColor }}>
            <Text style={{ ...pdfStyles.tableCell, flex: 2, fontWeight: 'bold', color: contrastText }}>
              Total Employer Cost
            </Text>
            <Text style={{ ...pdfStyles.tableCell, flex: 1, color: contrastText }}>
              
            </Text>
            <Text style={{ ...pdfStyles.tableCell, flex: 1, textAlign: 'right', fontWeight: 'bold', color: contrastText }}>
              {fmt(totalEmployerCost)}
            </Text>
          </View>
        </View>

        <View style={{ ...pdfStyles.tableRow, marginTop: 40 }}>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Status</Text>
            <Text style={{ ...pdfStyles.minInfo }}>{fmtStatus(payrollRun?.status)}</Text>
          </View>
        </View>

        {/* Footer */}
        <PageFooter />
      </Page>
    </Document>
  );
};

export default PayslipPDF;
