'use client';

import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Organization } from '@/types/auth-types';
import { PayrollRunType } from '../payrollRuns/PayrollRunType';
import { PayslipComputed } from '../payrollRuns/payslipCalculations';

type SalarySheetRow = {
  run: PayrollRunType;
  computed: PayslipComputed;
};

type SalarySheetPDFProps = {
  organization: Organization;
  periodLabel: string;
  rows: SalarySheetRow[];
};

const styles = StyleSheet.create({
  page: {
    padding: 18,
    fontSize: 8,
    fontFamily: 'Helvetica',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 9,
  },
  table: {
    display: 'table' as any,
    width: '100%',
  },
  tableRow: {
    flexDirection: 'row',
  },
  headerCell: {
    padding: 4,
    fontSize: 7,
    fontWeight: 'bold',
  },
  cell: {
    padding: 3,
    fontSize: 7,
  },
  footer: {
    marginTop: 18,
    fontSize: 8,
  },
});

const fmt = (value: number) =>
  value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const findContribution = (computed: PayslipComputed, label: string) => {
  const row = computed.employerContributionRows.find(
    (entry) => entry.label.toLowerCase() === label.toLowerCase()
  );
  return row?.amount || 0;
};

const widths = {
  index: '4%',
  employee: '13%',
  employeeNo: '8%',
  designation: '10%',
  totalLabel: '35%',
  basic: '8%',
  allowances: '8%',
  gross: '8%',
  paye: '7%',
  otherDeductions: '8%',
  totalDeductions: '8%',
  net: '8%',
  nssfEmployer: '6%',
  sdl: '5%',
  employerCost: '9%',
};

const SalarySheetPDF = ({ organization, periodLabel, rows }: SalarySheetPDFProps) => {
  const mainColor = organization.settings?.main_color || '#2113AD';
  const lightColor = organization.settings?.light_color || '#d9dfef';
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';

  const totals = rows.reduce(
    (sum, entry) => {
      const nssfEmployer = findContribution(entry.computed, 'NSSF Employer');
      const sdl = findContribution(entry.computed, 'SDL');

      return {
        basicSalary: sum.basicSalary + entry.computed.basicSalary,
        allowances: sum.allowances + entry.computed.totalAllowances,
        grossSalary: sum.grossSalary + entry.computed.grossSalary,
        paye: sum.paye + entry.computed.paye,
        otherDeductions: sum.otherDeductions + entry.computed.otherDeductions,
        totalDeductions: sum.totalDeductions + entry.computed.totalDeductions,
        netSalary: sum.netSalary + entry.computed.netSalary,
        nssfEmployer: sum.nssfEmployer + nssfEmployer,
        sdl: sum.sdl + sdl,
        totalEmployerCost: sum.totalEmployerCost + entry.computed.totalEmployerCost,
      };
    },
    {
      basicSalary: 0,
      allowances: 0,
      grossSalary: 0,
      paye: 0,
      otherDeductions: 0,
      totalDeductions: 0,
      netSalary: 0,
      nssfEmployer: 0,
      sdl: 0,
      totalEmployerCost: 0,
    }
  );

  return (
    <Document title={`Salary Sheet ${periodLabel}`} author={organization.name} subject='Salary Sheet'>
      <Page size='A4' orientation='landscape' style={styles.page}>
        <View style={styles.headerRow}>
          <View style={{ width: 120 }}>
            <PdfLogo organization={organization} />
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ ...styles.title, color: mainColor }}>SALARY PAYROLL</Text>
            <Text style={styles.subtitle}>{periodLabel}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={{ ...styles.tableRow, backgroundColor: mainColor }}>
            <Text style={{ ...styles.headerCell, width: widths.index, color: contrastText }}>S/N</Text>
            <Text style={{ ...styles.headerCell, width: widths.employee, color: contrastText }}>Employee</Text>
            <Text style={{ ...styles.headerCell, width: widths.employeeNo, color: contrastText }}>Emp No.</Text>
            <Text style={{ ...styles.headerCell, width: widths.designation, color: contrastText }}>Designation</Text>
            <Text style={{ ...styles.headerCell, width: widths.basic, color: contrastText }}>Basic</Text>
            <Text style={{ ...styles.headerCell, width: widths.allowances, color: contrastText }}>Allowan.</Text>
            <Text style={{ ...styles.headerCell, width: widths.gross, color: contrastText }}>Gross</Text>
            <Text style={{ ...styles.headerCell, width: widths.paye, color: contrastText }}>PAYE</Text>
            <Text style={{ ...styles.headerCell, width: widths.otherDeductions, color: contrastText }}>Other Ded.</Text>
            <Text style={{ ...styles.headerCell, width: widths.totalDeductions, color: contrastText }}>Total Ded.</Text>
            <Text style={{ ...styles.headerCell, width: widths.net, color: contrastText }}>Net Pay</Text>
            <Text style={{ ...styles.headerCell, width: widths.nssfEmployer, color: contrastText }}>NSSF Emp</Text>
            <Text style={{ ...styles.headerCell, width: widths.sdl, color: contrastText }}>SDL</Text>
            <Text style={{ ...styles.headerCell, width: widths.employerCost, color: contrastText }}>Employer Cost</Text>
          </View>

          {rows.map((entry, index) => {
            const name = [entry.run.employee?.first_name, entry.run.employee?.last_name]
              .filter(Boolean)
              .join(' ');
            const backgroundColor = index % 2 === 0 ? '#FFFFFF' : lightColor;

            return (
              <View key={entry.run.id} style={{ ...styles.tableRow, backgroundColor }} wrap={false}>
                <Text style={{ ...styles.cell, width: widths.index }}>{index + 1}</Text>
                <Text style={{ ...styles.cell, width: widths.employee }}>{name || '-'}</Text>
                <Text style={{ ...styles.cell, width: widths.employeeNo }}>{entry.run.employee?.employee_number || '-'}</Text>
                <Text style={{ ...styles.cell, width: widths.designation }}>{entry.run.contract?.designation?.title || '-'}</Text>
                <Text style={{ ...styles.cell, width: widths.basic, textAlign: 'right' }}>{fmt(entry.computed.basicSalary)}</Text>
                <Text style={{ ...styles.cell, width: widths.allowances, textAlign: 'right' }}>{fmt(entry.computed.totalAllowances)}</Text>
                <Text style={{ ...styles.cell, width: widths.gross, textAlign: 'right' }}>{fmt(entry.computed.grossSalary)}</Text>
                <Text style={{ ...styles.cell, width: widths.paye, textAlign: 'right' }}>{fmt(entry.computed.paye)}</Text>
                <Text style={{ ...styles.cell, width: widths.otherDeductions, textAlign: 'right' }}>{fmt(entry.computed.otherDeductions)}</Text>
                <Text style={{ ...styles.cell, width: widths.totalDeductions, textAlign: 'right' }}>{fmt(entry.computed.totalDeductions)}</Text>
                <Text style={{ ...styles.cell, width: widths.net, textAlign: 'right' }}>{fmt(entry.computed.netSalary)}</Text>
                <Text style={{ ...styles.cell, width: widths.nssfEmployer, textAlign: 'right' }}>{fmt(findContribution(entry.computed, 'NSSF Employer'))}</Text>
                <Text style={{ ...styles.cell, width: widths.sdl, textAlign: 'right' }}>{fmt(findContribution(entry.computed, 'SDL'))}</Text>
                <Text style={{ ...styles.cell, width: widths.employerCost, textAlign: 'right' }}>{fmt(entry.computed.totalEmployerCost)}</Text>
              </View>
            );
          })}

          <View style={{ ...styles.tableRow, backgroundColor: mainColor }} wrap={false}>
            <Text style={{ ...styles.headerCell, width: widths.totalLabel, color: contrastText }}>
              TOTALS
            </Text>
            <Text style={{ ...styles.headerCell, width: widths.basic, color: contrastText, textAlign: 'right' }}>{fmt(totals.basicSalary)}</Text>
            <Text style={{ ...styles.headerCell, width: widths.allowances, color: contrastText, textAlign: 'right' }}>{fmt(totals.allowances)}</Text>
            <Text style={{ ...styles.headerCell, width: widths.gross, color: contrastText, textAlign: 'right' }}>{fmt(totals.grossSalary)}</Text>
            <Text style={{ ...styles.headerCell, width: widths.paye, color: contrastText, textAlign: 'right' }}>{fmt(totals.paye)}</Text>
            <Text style={{ ...styles.headerCell, width: widths.otherDeductions, color: contrastText, textAlign: 'right' }}>{fmt(totals.otherDeductions)}</Text>
            <Text style={{ ...styles.headerCell, width: widths.totalDeductions, color: contrastText, textAlign: 'right' }}>{fmt(totals.totalDeductions)}</Text>
            <Text style={{ ...styles.headerCell, width: widths.net, color: contrastText, textAlign: 'right' }}>{fmt(totals.netSalary)}</Text>
            <Text style={{ ...styles.headerCell, width: widths.nssfEmployer, color: contrastText, textAlign: 'right' }}>{fmt(totals.nssfEmployer)}</Text>
            <Text style={{ ...styles.headerCell, width: widths.sdl, color: contrastText, textAlign: 'right' }}>{fmt(totals.sdl)}</Text>
            <Text style={{ ...styles.headerCell, width: widths.employerCost, color: contrastText, textAlign: 'right' }}>{fmt(totals.totalEmployerCost)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Prepared by: _______________________    Approved by: _______________________    Date: ___________</Text>
        </View>
      </Page>
    </Document>
  );
};

export default SalarySheetPDF;