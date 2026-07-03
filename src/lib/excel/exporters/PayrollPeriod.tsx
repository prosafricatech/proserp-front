// PayrollPeriod.tsx
import { applyCellStyle, CELL_STYLES, getAlternatingRowFill } from '../styles';
import { getExcelColumnName } from '../uitls';
import { createWorkbook } from '../workBook';

// ---- Helper functions ----
const MONTHS = [
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

function fmt(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function percentOf(part: number, total: number): string {
  if (!total) return '0%';
  return `${Math.round((part / total) * 100)}%`;
}

function getEmployeeName(employee: any): string {
  if (!employee) return 'Unknown Employee';
  const firstName = employee.first_name || '';
  const lastName = employee.last_name || '';
  return `${firstName} ${lastName}`.trim() || '-';
}

function employeeComputedTotals(employee: any) {
  const basicSalary = employee.basic_salary || 0;
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
  return {
    grossSalary,
    netPay,
    totalEmpCost,
    totalAllowances,
    totalDeductions,
    totalContributions,
  };
}

function calculateTotalAmtByType(
  typeObj: any,
  type_id: number,
  type: 'deduction' | 'allowance' | 'contribution',
  allowanceTypes: any[],
  deductionTypes: any[],
  contributionTypes: any[]
): number {
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
}

const NUM_FMT = '#,##0.00';

export async function ExportPayrollPeriodToExcel(exportedData: any) {
  try {
    const {
      organization,
      period,
      runs = [],
      hasTypes,
      employeeTypes,
      uniqueTypes,
    } = exportedData;

    const hasAllowances = hasTypes?.hasAllowances ?? false;
    const hasDeductions = hasTypes?.hasDeductions ?? false;
    const hasContributions = hasTypes?.hasContributions ?? false;

    const allowanceTypes = employeeTypes?.employeeAllowances ?? [];
    const deductionTypes = employeeTypes?.employeeDeductions ?? [];
    const contributionTypes = employeeTypes?.employeecontributions ?? [];

    const unique_allowances_types = uniqueTypes?.unique_allowances_types ?? [];
    const unique_deductions_types = (
      uniqueTypes?.unique_deductions_types ?? []
    ).filter((t: any) => t.deduction_type_id !== null);
    const unique_contributions_types =
      uniqueTypes?.unique_contributions_types ?? [];

    const periodLabel = `${MONTHS[(period?.month ?? 1) - 1]} ${period?.year} - ${runs[0]?.cost_center?.name || 'Company-wide Run'}`;

    // ---- Build all employees data ----
    const allEmployees: any[] = runs.flatMap((run: any) =>
      run.payslips.map((slip: any, idx: number) => ({
        ...slip.employee,
        basic_salary: slip.contract?.basic_salary ?? 0,
        allwances: slip.allowances ?? [],
        deductions: slip.deductions ?? [],
        employer_contributions: slip.employer_contributions ?? [],
        paye: slip.paye ?? 0,
        slipIndex: idx,
        runId: run.id,
        costCenter: run.cost_center,
        contractId: slip.contract?.id,
        designation: slip.contract?.designation?.title || '-',
      }))
    );

    // ---- Calculate totals ----
    const payrollTotals = allEmployees.reduce(
      (sum: any, employee: any) => {
        const computed = employeeComputedTotals(employee);
        return {
          totalBasicSalary: sum.totalBasicSalary + employee.basic_salary,
          totalGross: sum.totalGross + computed.grossSalary,
          totalNetPay: sum.totalNetPay + computed.netPay,
          totalEmpCost: sum.totalEmpCost + computed.totalEmpCost,
          totalPaye: sum.totalPaye + employee.paye,
        };
      },
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
          'contribution',
          allowanceTypes,
          deductionTypes,
          contributionTypes
        ) ?? 0),
      0
    );

    const grossByEmployer = payrollTotals.totalEmpCost;
    const netEmployeePayment = payrollTotals.totalNetPay;
    const payrollTaxesAndBenefits =
      payrollTotals.totalPaye + totalContributions;
    const summaryTotal =
      grossByEmployer + netEmployeePayment + payrollTaxesAndBenefits;

    // ---- Column layout ----
    const n = unique_allowances_types.length;
    const m = unique_deductions_types.length;
    const p = unique_contributions_types.length;

    // Column positions (1-based)
    const COL_COST_CENTER = 1;
    const COL_SN = 2;
    const COL_NAME = 3;
    const COL_DESIGNATION = 4;
    const COL_BASIC = 5;
    // Allowances: 6 to 5+n
    const COL_GROSS = 6 + n;
    // Deductions: 7+n to 6+n+m
    const COL_PAYE = 7 + n + m;
    const COL_NET_PAYABLE = 8 + n + m;
    // Contributions: 9+n+m to 8+n+m+p
    const COL_TOTAL_EMP_COST = 9 + n + m + p;
    const TOTAL_COLS = COL_TOTAL_EMP_COST;

    // ---- Workbook ----
    const wb = createWorkbook();
    const ws = wb.addWorksheet('Payroll Period');

    // ---- Column widths ----
    ws.getColumn(getExcelColumnName(COL_COST_CENTER)).width = 22;
    ws.getColumn(getExcelColumnName(COL_SN)).width = 6;
    ws.getColumn(getExcelColumnName(COL_NAME)).width = 28;
    ws.getColumn(getExcelColumnName(COL_DESIGNATION)).width = 20;
    for (let c = COL_BASIC; c <= TOTAL_COLS; c++) {
      ws.getColumn(getExcelColumnName(c)).width = 16;
    }

    // ---- Row 1: Organization + Title ----
    ws.mergeCells(`A1:${getExcelColumnName(COL_COST_CENTER)}1`);
    const orgCell = ws.getCell('A1');
    orgCell.value = organization?.name || '';
    orgCell.font = { bold: true, size: 14 };
    orgCell.alignment = { horizontal: 'left', vertical: 'middle' };

    ws.mergeCells(
      `${getExcelColumnName(COL_TOTAL_EMP_COST - 2)}1:${getExcelColumnName(TOTAL_COLS)}1`
    );
    const titleCell = ws.getCell(
      `${getExcelColumnName(COL_TOTAL_EMP_COST - 2)}1`
    );
    titleCell.value = 'SALARY PAYROLL';
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'right', vertical: 'middle' };
    ws.getRow(1).height = 25;

    // ---- Row 2: Period label ----
    ws.mergeCells(
      `${getExcelColumnName(COL_TOTAL_EMP_COST - 2)}2:${getExcelColumnName(TOTAL_COLS)}2`
    );
    const periodCell = ws.getCell(
      `${getExcelColumnName(COL_TOTAL_EMP_COST - 2)}2`
    );
    periodCell.value = periodLabel;
    periodCell.font = { size: 11 };
    periodCell.alignment = { horizontal: 'right', vertical: 'middle' };
    ws.getRow(2).height = 18;

    // ---- Row 3: Group Headers ----
    const applyGroupHeader = (
      col: number,
      endCol: number,
      label: string,
      bgColor?: string
    ) => {
      ws.mergeCells(
        `${getExcelColumnName(col)}3:${getExcelColumnName(endCol)}3`
      );
      const cell = ws.getCell(`${getExcelColumnName(col)}3`);
      cell.value = label;
      applyCellStyle(cell, CELL_STYLES.tableHeader);
      if (bgColor) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgColor },
        };
      }
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.font = { bold: true, size: 10 };
    };

    const recruitmentEnd = COL_DESIGNATION;
    const employeeStart = COL_BASIC;
    const employeeEnd = COL_NET_PAYABLE;
    const employerStart = COL_NET_PAYABLE + 1;
    const employerEnd = TOTAL_COLS;

    applyGroupHeader(
      COL_COST_CENTER,
      recruitmentEnd,
      'COST CENTER / RECRUITMENT',
      'FFFFFFFF'
    );
    applyGroupHeader(employeeStart, employeeEnd, 'EMPLOYEE', 'FFD9DFEF');
    applyGroupHeader(employerStart, employerEnd, 'EMPLOYER', 'FFFFFFFF');
    ws.getRow(3).height = 20;

    // ---- Row 4: Column Headers ----
    const setHdr = (col: number, label: string, isNumeric: boolean = false) => {
      const cell = ws.getCell(`${getExcelColumnName(col)}4`);
      cell.value = label;
      applyCellStyle(cell, CELL_STYLES.tableHeader);
      if (isNumeric) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
    };

    setHdr(COL_COST_CENTER, 'Cost Center');
    setHdr(COL_SN, 'S/N');
    setHdr(COL_NAME, 'Employee');
    setHdr(COL_DESIGNATION, 'Designation');
    setHdr(COL_BASIC, 'Basic Salary', true);

    unique_allowances_types.forEach((t: any) => {
      setHdr(
        5 + unique_allowances_types.indexOf(t) + 1,
        t.label || 'Allowance',
        true
      );
    });

    setHdr(COL_GROSS, 'Gross', true);

    unique_deductions_types.forEach((t: any) => {
      setHdr(
        6 + n + unique_deductions_types.indexOf(t) + 1,
        t.label || 'Deduction',
        true
      );
    });

    setHdr(COL_PAYE, 'PAYE', true);
    setHdr(COL_NET_PAYABLE, 'Net Payable', true);

    unique_contributions_types.forEach((t: any) => {
      setHdr(
        8 + n + m + unique_contributions_types.indexOf(t) + 1,
        t.label || 'Contribution',
        true
      );
    });

    setHdr(COL_TOTAL_EMP_COST, 'Total Empr. Cost', true);
    ws.getRow(4).height = 18;

    // ---- Data Rows ----
    let rowIndex = 0;
    runs.forEach((run: any, groupIndex: number) => {
      const employees = run.payslips.map((slip: any, idx: number) => ({
        ...slip.employee,
        basic_salary: slip.contract?.basic_salary ?? 0,
        allwances: slip.allowances ?? [],
        deductions: slip.deductions ?? [],
        employer_contributions: slip.employer_contributions ?? [],
        paye: slip.paye ?? 0,
        slipIndex: idx,
        contractId: slip.contract?.id,
        designation: slip.contract?.designation?.title || '-',
      }));

      employees.forEach((entry: any, empIndex: number) => {
        const ROW = 5 + rowIndex;
        const isFirst = empIndex === 0;
        const fill = getAlternatingRowFill(rowIndex);

        const computed = employeeComputedTotals(entry);

        const setTxt = (col: number, value: string) => {
          const cell = ws.getCell(`${getExcelColumnName(col)}${ROW}`);
          cell.value = value;
          applyCellStyle(cell, { ...CELL_STYLES.dataRowText, fill });
        };

        const setNum = (col: number, value: number) => {
          const cell = ws.getCell(`${getExcelColumnName(col)}${ROW}`);
          cell.value = value;
          cell.numFmt = NUM_FMT;
          applyCellStyle(cell, { ...CELL_STYLES.dataRowNumeric, fill });
        };

        // Cost Center (only show for first employee in group)
        if (isFirst) {
          setTxt(COL_COST_CENTER, run.cost_center?.name || '-');
        } else {
          setTxt(COL_COST_CENTER, '');
        }

        setTxt(COL_SN, String(empIndex + 1));

        // Employee name with employee number
        const name = getEmployeeName(entry);
        const empNumber = entry.employee_number
          ? ` (${entry.employee_number})`
          : '';
        setTxt(COL_NAME, name + empNumber);

        setTxt(COL_DESIGNATION, entry.designation);
        setNum(COL_BASIC, entry.basic_salary);

        // Allowances
        unique_allowances_types.forEach((type: any, typeIdx: number) => {
          const amount =
            allowanceTypes.find(
              (itm: any) =>
                itm.employee_contract_id === entry.contractId &&
                (itm.label === type.label ||
                  itm.allowance_type_id === type.allowance_type_id)
            )?.amount ?? 0;
          setNum(5 + typeIdx + 1, amount);
        });

        setNum(COL_GROSS, computed.grossSalary);

        // Deductions
        unique_deductions_types.forEach((type: any, typeIdx: number) => {
          const amount =
            deductionTypes.find(
              (itm: any) =>
                itm.employee_contract_id === entry.contractId &&
                (itm.label === type.label ||
                  itm.deduction_type_id === type.deduction_type_id)
            )?.amount ?? 0;
          setNum(6 + n + typeIdx + 1, amount);
        });

        setNum(COL_PAYE, entry.paye ?? 0);
        setNum(COL_NET_PAYABLE, computed.netPay);

        // Contributions
        unique_contributions_types.forEach((type: any, typeIdx: number) => {
          const amount =
            contributionTypes.find(
              (itm: any) =>
                itm.employee_contract_id === entry.contractId &&
                (itm.label === type.label ||
                  itm.employer_contribution_type_id ===
                    type.employer_contribution_type_id)
            )?.amount ?? 0;
          setNum(8 + n + m + typeIdx + 1, amount);
        });

        setNum(COL_TOTAL_EMP_COST, computed.totalEmpCost);
        ws.getRow(ROW).height = 16;
        rowIndex++;
      });
    });

    // ---- Totals Row ----
    const TOTALS_ROW = 5 + rowIndex;

    const setTotalNum = (col: number, value: number) => {
      const cell = ws.getCell(`${getExcelColumnName(col)}${TOTALS_ROW}`);
      cell.value = value;
      cell.numFmt = NUM_FMT;
      applyCellStyle(cell, CELL_STYLES.totalRowNumeric);
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
    };

    // Merge cost center + recruitment columns for totals label (blank)
    ws.mergeCells(
      `${getExcelColumnName(COL_COST_CENTER)}${TOTALS_ROW}:${getExcelColumnName(COL_DESIGNATION)}${TOTALS_ROW}`
    );
    ws.getCell(`${getExcelColumnName(COL_COST_CENTER)}${TOTALS_ROW}`).value =
      '';
    applyCellStyle(
      ws.getCell(`${getExcelColumnName(COL_COST_CENTER)}${TOTALS_ROW}`),
      CELL_STYLES.totalRowText
    );
    ws.getCell(
      `${getExcelColumnName(COL_COST_CENTER)}${TOTALS_ROW}`
    ).alignment = { horizontal: 'center', vertical: 'middle' };

    setTotalNum(COL_BASIC, payrollTotals.totalBasicSalary);

    // Allowance totals
    unique_allowances_types.forEach((type: any, typeIdx: number) => {
      const total = calculateTotalAmtByType(
        type,
        type.allowance_type_id,
        'allowance',
        allowanceTypes,
        deductionTypes,
        contributionTypes
      );
      setTotalNum(5 + typeIdx + 1, total);
    });

    setTotalNum(COL_GROSS, payrollTotals.totalGross);

    // Deduction totals
    unique_deductions_types.forEach((type: any, typeIdx: number) => {
      const total = calculateTotalAmtByType(
        type,
        type.deduction_type_id,
        'deduction',
        allowanceTypes,
        deductionTypes,
        contributionTypes
      );
      setTotalNum(6 + n + typeIdx + 1, total);
    });

    setTotalNum(COL_PAYE, payrollTotals.totalPaye);
    setTotalNum(COL_NET_PAYABLE, payrollTotals.totalNetPay);

    // Contribution totals
    unique_contributions_types.forEach((type: any, typeIdx: number) => {
      const total = calculateTotalAmtByType(
        type,
        type.employer_contribution_type_id,
        'contribution',
        allowanceTypes,
        deductionTypes,
        contributionTypes
      );
      setTotalNum(8 + n + m + typeIdx + 1, total);
    });

    setTotalNum(COL_TOTAL_EMP_COST, payrollTotals.totalEmpCost);
    ws.getRow(TOTALS_ROW).height = 20;

    // ---- Summary Section ----
    let summaryRow = TOTALS_ROW + 2;

    const smBorder = { style: 'thin' as const, color: { argb: 'FFB8B8B8' } };
    const allSides = {
      top: smBorder,
      bottom: smBorder,
      left: smBorder,
      right: smBorder,
    };

    // Use columns A-F for summary
    const addSummaryRow = (
      label: string,
      amount: number,
      pct: string,
      isBold: boolean,
      isSub: boolean = false
    ) => {
      // A-C: label (merged), D: amount, E: blank, F: percentage
      ws.mergeCells(`A${summaryRow}:C${summaryRow}`);
      const labelCell = ws.getCell(`A${summaryRow}`);
      const amountCell = ws.getCell(`D${summaryRow}`);
      const pctCell = ws.getCell(`F${summaryRow}`);

      labelCell.value = label;
      labelCell.font = isBold
        ? { bold: true, size: 10 }
        : { italic: true, size: 10 };
      labelCell.alignment = isSub
        ? { vertical: 'middle', horizontal: 'left' }
        : { vertical: 'middle', horizontal: 'left' };
      if (isSub) {
        labelCell.alignment = { vertical: 'middle', horizontal: 'left' };
      }
      labelCell.border = allSides;

      if (!isSub) {
        // Main rows: amount in D, E blank
        amountCell.value = amount;
        amountCell.numFmt = NUM_FMT;
        amountCell.font = { bold: true, size: 10 };
        amountCell.alignment = { horizontal: 'right', vertical: 'middle' };
        amountCell.border = allSides;

        // E blank
        const blankCell = ws.getCell(`E${summaryRow}`);
        blankCell.border = allSides;
      } else {
        // Sub rows: amount in D (no bold)
        amountCell.value = amount;
        amountCell.numFmt = NUM_FMT;
        amountCell.font = { italic: true, size: 10 };
        amountCell.alignment = { horizontal: 'right', vertical: 'middle' };
        amountCell.border = allSides;

        // E blank
        const blankCell = ws.getCell(`E${summaryRow}`);
        blankCell.border = allSides;
      }

      pctCell.value = pct;
      pctCell.alignment = { horizontal: 'right', vertical: 'middle' };
      pctCell.font = { italic: true, size: 10 };
      pctCell.border = allSides;

      ws.getRow(summaryRow).height = 18;
      summaryRow++;
    };

    addSummaryRow(
      'Gross Pay by Employer',
      grossByEmployer,
      percentOf(grossByEmployer, grossByEmployer),
      true
    );
    addSummaryRow(
      'Net Employee Payment',
      netEmployeePayment,
      percentOf(netEmployeePayment, grossByEmployer),
      true
    );
    addSummaryRow(
      'Payroll Taxes & Benefits',
      payrollTaxesAndBenefits,
      percentOf(payrollTaxesAndBenefits, grossByEmployer),
      true
    );
    addSummaryRow(
      '  P.A.Y.E',
      payrollTotals.totalPaye,
      percentOf(payrollTotals.totalPaye, grossByEmployer),
      false,
      true
    );

    unique_contributions_types.forEach((type: any) => {
      const amount =
        calculateTotalAmtByType(
          type,
          type.employer_contribution_type_id,
          'contribution',
          allowanceTypes,
          deductionTypes,
          contributionTypes
        ) ?? 0;
      addSummaryRow(
        `  ${type.label || 'Contribution'}`,
        amount,
        percentOf(amount, grossByEmployer),
        false,
        true
      );
    });

    // Grand total line
    const topBlack = { style: 'thin' as const, color: { argb: 'FF000000' } };
    ws.mergeCells(`A${summaryRow}:D${summaryRow}`);
    const grandTotalLabelCell = ws.getCell(`A${summaryRow}`);
    grandTotalLabelCell.border = {
      top: topBlack,
      bottom: smBorder,
      left: smBorder,
      right: smBorder,
    };

    const grandTotalAmtCell = ws.getCell(`E${summaryRow}`);
    grandTotalAmtCell.value = summaryTotal;
    grandTotalAmtCell.numFmt = NUM_FMT;
    grandTotalAmtCell.font = { bold: true, size: 10 };
    grandTotalAmtCell.alignment = { horizontal: 'right', vertical: 'middle' };
    grandTotalAmtCell.border = {
      top: topBlack,
      bottom: smBorder,
      left: smBorder,
      right: smBorder,
    };

    // F blank
    const grandTotalPctCell = ws.getCell(`F${summaryRow}`);
    grandTotalPctCell.border = {
      top: topBlack,
      bottom: smBorder,
      left: smBorder,
      right: smBorder,
    };

    ws.getRow(summaryRow).height = 18;
    summaryRow += 2;

    // ---- Signatures ----
    const addSig = (label: string) => {
      ws.mergeCells(`A${summaryRow}:C${summaryRow}`);
      ws.mergeCells(`D${summaryRow}:F${summaryRow}`);
      const labelCell = ws.getCell(`A${summaryRow}`);
      const sigCell = ws.getCell(`D${summaryRow}`);
      labelCell.value = label;
      labelCell.font = { size: 10 };
      sigCell.value = 'Signature..................................';
      sigCell.font = { size: 10 };
      const borderBottom = {
        bottom: { style: 'thin' as const, color: { argb: 'FFB8B8B8' } },
      };
      labelCell.border = borderBottom;
      sigCell.border = borderBottom;
      ws.getRow(summaryRow).height = 22;
      summaryRow++;
    };

    addSig(
      'Prepared by............................................................................'
    );
    addSig(
      'Verified by................................................................................'
    );
    addSig(
      'Approved by...............................................................................'
    );

    return await wb.xlsx.writeBuffer();
  } catch (error: any) {
    console.error('Error exporting payroll period Excel:', error);
    throw new Error(
      error?.message || 'Excel export failed during workbook generation'
    );
  }
}
