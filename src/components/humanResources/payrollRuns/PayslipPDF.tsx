'use client';

import { Document, Page, Text, View } from '@react-pdf/renderer';
import React from 'react';
import pdfStyles from '@/components/pdf/pdf-styles';
import PageFooter from '@/components/pdf/PageFooter';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Organization } from '@/types/auth-types';

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

  const gross = payrollRun?.basic_salary ?? 0;
  const paye = payrollRun?.paye ?? 0;
  const net = gross - paye;

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

          <View style={pdfStyles.tableRow}>
            <Text style={{ ...pdfStyles.tableCell, flex: 2 }}>Basic Salary</Text>
            <Text style={{ ...pdfStyles.tableCell, flex: 1, textAlign: 'right' }}>{fmt(gross)}</Text>
          </View>

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
              Total Earnings
            </Text>
            <Text
              style={{
                ...pdfStyles.tableCell,
                flex: 1,
                textAlign: 'right',
                fontWeight: 'bold',
              }}
            >
              {fmt(gross)}
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
              Amount
            </Text>
          </View>

          <View style={pdfStyles.tableRow}>
            <Text style={{ ...pdfStyles.tableCell, flex: 2 }}>PAYE Tax</Text>
            <Text style={{ ...pdfStyles.tableCell, flex: 1, textAlign: 'right' }}>{fmt(paye)}</Text>
          </View>

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
                textAlign: 'right',
                fontWeight: 'bold',
              }}
            >
              {fmt(paye)}
            </Text>
          </View>
        </View>

        {/* Net Pay Section */}
        <View style={{ marginTop: 15 }}>
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
              NET PAY
            </Text>
            <Text
              style={{
                ...pdfStyles.majorInfo,
                color: contrastText,
                flex: 1,
                textAlign: 'right',
              }}
            >
              {fmt(net)}
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
