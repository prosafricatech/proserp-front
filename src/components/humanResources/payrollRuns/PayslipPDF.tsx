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

const PayslipPDF: React.FC<PayslipPDFProps> = ({ payrollRun, organization }) => {
  const mainColor = organization.settings?.main_color || '#2113AD';
  const lightColor = organization.settings?.light_color || '#bec5da';
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';

  const name = payrollRun
    ? [payrollRun.employee?.first_name, payrollRun.employee?.last_name]
        .filter(Boolean)
        .join(' ')
    : 'Unknown Employee';

  const {
    paye,
    earningsRows,
    deductionRows,
    grossSalary,
    preTaxDeductions,
    taxableIncome,
    otherDeductions,
    totalDeductions,
    netSalary,
  } = getPayslipCalculations(payrollRun);

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

        <View style={{ height: 1, backgroundColor: lightColor, marginBottom: 15 }} />

        {/* Earnings Section */}
        <Text style={{ ...pdfStyles.majorInfo, color: mainColor, marginBottom: 8 }}>
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

          {earningsRows.map((row) => (
            <View style={pdfStyles.tableRow} key={row.label}>
              <Text style={{ ...pdfStyles.tableCell, flex: 2 }}>
                {row.label}
                {!row.taxable ? ' (non-taxable)' : ''}
              </Text>
              <Text style={{ ...pdfStyles.tableCell, flex: 1, textAlign: 'right' }}>
                {fmt(row.amount)}
              </Text>
            </View>
          ))}

          <View
            style={{
              ...pdfStyles.tableRow,
              backgroundColor: lightColor,
            }}
          >
            <Text
              style={{
                ...pdfStyles.tableCell,
                flex: 2,
                fontWeight: 'bold',
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
              }}
            >
              {fmt(grossSalary)}
            </Text>
          </View>
        </View>

        {/* Deductions Section */}
        <Text style={{ ...pdfStyles.majorInfo, color: mainColor, marginTop: 15, marginBottom: 8 }}>
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

          <View style={pdfStyles.tableRow}>
            <Text style={{ ...pdfStyles.tableCell, flex: 2 }}>PAYE</Text>
            <Text style={{ ...pdfStyles.tableCell, flex: 1 }}>Tax</Text>
            <Text style={{ ...pdfStyles.tableCell, flex: 1, textAlign: 'right' }}>{fmt(paye)}</Text>
          </View>

          {deductionRows.map((row) => (
            <View style={pdfStyles.tableRow} key={`${row.label}-${row.category}`}>
              <Text style={{ ...pdfStyles.tableCell, flex: 2 }}>{row.label}</Text>
              <Text style={{ ...pdfStyles.tableCell, flex: 1 }}>{row.category}</Text>
              <Text style={{ ...pdfStyles.tableCell, flex: 1, textAlign: 'right' }}>
                {fmt(row.amount)}
              </Text>
            </View>
          ))}

          <View
            style={{
              ...pdfStyles.tableRow,
              backgroundColor: lightColor,
            }}
          >
            <Text
              style={{
                ...pdfStyles.tableCell,
                flex: 2,
                fontWeight: 'bold',
              }}
            >
              Total Deductions
            </Text>
            <Text
              style={{
                ...pdfStyles.tableCell,
                flex: 1,
              }}
            >
              
            </Text>
            <Text
              style={{
                ...pdfStyles.tableCell,
                flex: 1,
                textAlign: 'right',
                fontWeight: 'bold',
              }}
            >
              {fmt(totalDeductions)}
            </Text>
          </View>
        </View>

        {/* Net Pay Summary */}
        <View style={{ marginTop: 15 }}>
          <View style={pdfStyles.tableRow}>
            <Text style={{ ...pdfStyles.tableCell, flex: 2 }}>Gross Salary</Text>
            <Text style={{ ...pdfStyles.tableCell, flex: 1, textAlign: 'right' }}>{fmt(grossSalary)}</Text>
          </View>
          <View style={pdfStyles.tableRow}>
            <Text style={{ ...pdfStyles.tableCell, flex: 2 }}>Pre-Tax Deductions</Text>
            <Text style={{ ...pdfStyles.tableCell, flex: 1, textAlign: 'right' }}>- {fmt(preTaxDeductions)}</Text>
          </View>
          <View style={pdfStyles.tableRow}>
            <Text style={{ ...pdfStyles.tableCell, flex: 2 }}>Taxable Income</Text>
            <Text style={{ ...pdfStyles.tableCell, flex: 1, textAlign: 'right' }}>{fmt(taxableIncome)}</Text>
          </View>
          <View style={pdfStyles.tableRow}>
            <Text style={{ ...pdfStyles.tableCell, flex: 2 }}>PAYE</Text>
            <Text style={{ ...pdfStyles.tableCell, flex: 1, textAlign: 'right' }}>- {fmt(paye)}</Text>
          </View>
          <View style={pdfStyles.tableRow}>
            <Text style={{ ...pdfStyles.tableCell, flex: 2 }}>Other Deductions</Text>
            <Text style={{ ...pdfStyles.tableCell, flex: 1, textAlign: 'right' }}>- {fmt(otherDeductions)}</Text>
          </View>
          <View
            style={{
              ...pdfStyles.tableRow,
              backgroundColor: mainColor,
              padding: 8,
            }}
          >
            <Text
              style={{
                ...pdfStyles.majorInfo,
                color: contrastText,
                flex: 1,
              }}
            >
              NET SALARY
            </Text>
            <Text
              style={{
                ...pdfStyles.majorInfo,
                color: contrastText,
                flex: 1,
                textAlign: 'right',
              }}
            >
              {fmt(netSalary)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <PageFooter />
      </Page>
    </Document>
  );
};

export default PayslipPDF;
