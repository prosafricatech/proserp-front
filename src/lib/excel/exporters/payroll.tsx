import { applyCellStyle, CELL_STYLES, getAlternatingRowFill } from '../styles';
import { getExcelColumnName } from '../uitls';
import { createWorkbook } from '../workBook';

// ---- Helper functions (mirrors SalarySheetPDF logic) ----

function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function slug(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function sumAllowanceByType(run: any, type: any): number {
  const targetId = type.id;
  const targetName = slug(type.name || '');
  return (run.allowances || []).reduce((sum: number, item: any) => {
    const byId = targetId != null && item.allowance_type_id === targetId;
    const byName =
      targetName &&
      slug(item.allowance_type?.name || item.label || '') === targetName;
    if (!byId && !byName) return sum;
    return sum + toNumber(item.amount ?? item.value);
  }, 0);
}

function sumDeductionByType(run: any, type: any): number {
  const targetId = type.id;
  const targetName = slug(type.name || '');
  return (run.deductions || []).reduce((sum: number, item: any) => {
    const byId = targetId != null && item.deduction_type_id === targetId;
    const byName =
      targetName &&
      slug(item.deduction_type?.name || item.label || '') === targetName;
    if (!byId && !byName) return sum;
    return sum + toNumber(item.amount ?? item.value);
  }, 0);
}

function sumContributionByType(run: any, type: any): number {
  const targetId = type.id;
  const targetName = slug(type.name || '');
  return (run.employer_contributions || []).reduce((sum: number, item: any) => {
    const byId =
      targetId != null && item.employer_contribution_type_id === targetId;
    const byName =
      targetName &&
      slug(item.contribution_type?.name || item.label || '') === targetName;
    if (!byId && !byName) return sum;
    return sum + toNumber(item.amount ?? item.value);
  }, 0);
}

function fmtTypeLabel(type: any, fallback: string): string {
  const name = type.name || fallback;
  const raw = Number(type.default_value ?? 0);
  if (!Number.isFinite(raw) || raw <= 0) return name;
  const isPercentage = String(type.computation_method || '').startsWith(
    'percentage'
  );
  const valueText = isPercentage
    ? `${raw.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`
    : raw.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
  return `${name} (${valueText})`;
}

const NUM_FMT = '#,##0.00';

export async function ExportPayrollToExcel(exportedData: any) {
  try {
    const {
      organization,
      periodLabel,
      rows = [],
      allowanceTypes = [],
      deductionTypes = [],
      contributionTypes = [],
    } = exportedData;

    const preTaxDeductionTypes = deductionTypes.filter((t: any) =>
      Boolean(t.is_pre_tax)
    );
    const postTaxDeductionTypes = deductionTypes.filter(
      (t: any) => !t.is_pre_tax
    );

    // Column index layout (1-based)
    const n = allowanceTypes.length; // allowance columns
    const m = preTaxDeductionTypes.length; // pre-tax deduction columns
    const p = postTaxDeductionTypes.length; // post-tax deduction columns
    const q = contributionTypes.length; // employer contribution columns

    const COL_SN = 1;
    const COL_NAME = 2;
    const COL_DESIGNATION = 3;
    const COL_BASIC = 4;
    // allowances → cols 5..4+n
    const COL_GROSS = 5 + n;
    // pre-tax deductions → cols 6+n..5+n+m
    const COL_TAXABLE = 6 + n + m;
    const COL_PAYE = 7 + n + m;
    // post-tax deductions → cols 8+n+m..7+n+m+p
    const COL_TOTAL_DED = 8 + n + m + p;
    const COL_NET = 9 + n + m + p;
    // contributions → cols 10+n+m+p..9+n+m+p+q
    const COL_TOTAL_CONTRIB = 10 + n + m + p + q;
    const COL_EMPLOYER_COST = 11 + n + m + p + q;
    const TOTAL_COLS = COL_EMPLOYER_COST;

    // ---- Totals (mirrors SalarySheetPDF reduce logic) ----
    const totals = rows.reduce(
      (sum: any, entry: any) => {
        const abt = allowanceTypes.map((t: any) =>
          sumAllowanceByType(entry.run, t)
        );
        const pdbt = preTaxDeductionTypes.map((t: any) =>
          sumDeductionByType(entry.run, t)
        );
        const odbt = postTaxDeductionTypes.map((t: any) =>
          sumDeductionByType(entry.run, t)
        );
        const cbt = contributionTypes.map((t: any) =>
          sumContributionByType(entry.run, t)
        );
        return {
          basicSalary: sum.basicSalary + entry.computed.basicSalary,
          grossSalary: sum.grossSalary + entry.computed.grossSalary,
          taxableSalary: sum.taxableSalary + entry.computed.taxableIncome,
          paye: sum.paye + entry.computed.paye,
          totalDeductions: sum.totalDeductions + entry.computed.totalDeductions,
          netSalary: sum.netSalary + entry.computed.netSalary,
          totalEmployerContributions:
            sum.totalEmployerContributions +
            entry.computed.totalEmployerContributions,
          totalEmployerCost:
            sum.totalEmployerCost + entry.computed.totalEmployerCost,
          allowanceByType: sum.allowanceByType.map(
            (v: number, i: number) => v + abt[i]
          ),
          preTaxDeductionByType: sum.preTaxDeductionByType.map(
            (v: number, i: number) => v + pdbt[i]
          ),
          postTaxDeductionByType: sum.postTaxDeductionByType.map(
            (v: number, i: number) => v + odbt[i]
          ),
          contributionByType: sum.contributionByType.map(
            (v: number, i: number) => v + cbt[i]
          ),
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
    const payrollTaxesBenefits =
      totals.paye + totals.totalEmployerContributions;
    const summaryTotal =
      grossByEmployer + netEmployeePayment + payrollTaxesBenefits;
    // const pctOf = (part: number, total: number) =>
    //   total ? `${Math.round((part / total) * 100)}%` : '0%';
    const pctOf = (part: number, total: number) =>
      total ? Math.round((part / total) * 100) : 0;

    // ---- Workbook ----
    const wb = createWorkbook();
    const ws = wb.addWorksheet('Salary Sheet');

    // ---- Column widths ----
    ws.getColumn(getExcelColumnName(COL_SN)).width = 6;
    ws.getColumn(getExcelColumnName(COL_NAME)).width = 26;
    ws.getColumn(getExcelColumnName(COL_DESIGNATION)).width = 20;
    for (let c = COL_BASIC; c <= TOTAL_COLS; c++) {
      ws.getColumn(getExcelColumnName(c)).width = 18;
    }

    // ---- Row 1: Organisation name ----
    ws.mergeCells(`A1:${getExcelColumnName(TOTAL_COLS)}1`);
    const titleCell = ws.getCell('A1');
    titleCell.value = organization?.name || '';
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 25;
    // ---- Row 2: Period label ----
    ws.mergeCells(`A2:${getExcelColumnName(TOTAL_COLS)}2`);
    const subtitleCell = ws.getCell('A2');
    subtitleCell.value = `SALARY PAYROLL — ${periodLabel}`;
    subtitleCell.font = { bold: true, size: 11 };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(2).height = 20;

    // ---- Row 3: Group headers ----
    const COL_EMPLOYER_START = COL_NET + 1;
    const applyGroupHeader = (col: number, endCol: number, label: string) => {
      ws.mergeCells(
        `${getExcelColumnName(col)}3:${getExcelColumnName(endCol)}3`
      );
      const cell = ws.getCell(`${getExcelColumnName(col)}3`);
      cell.value = label;
      applyCellStyle(cell, CELL_STYLES.tableHeader);
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    };
    applyGroupHeader(COL_SN, COL_DESIGNATION, 'RECRUITMENT');
    applyGroupHeader(COL_BASIC, COL_NET, 'EMPLOYEE');
    applyGroupHeader(COL_EMPLOYER_START, COL_EMPLOYER_COST, 'EMPLOYER');
    ws.getRow(3).height = 18;

    // ---- Row 4: Column headers ----
    const setHdr = (col: number, label: string) => {
      const cell = ws.getCell(`${getExcelColumnName(col)}4`);
      cell.value = label;
      applyCellStyle(cell, CELL_STYLES.tableHeader);
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    };
    setHdr(COL_SN, 'S/N');
    setHdr(COL_NAME, 'Name');
    setHdr(COL_DESIGNATION, 'Designation');
    setHdr(COL_BASIC, 'Basic Salary');
    allowanceTypes.forEach((t: any, i: number) =>
      setHdr(5 + i, t.name || 'Allowance')
    );
    setHdr(COL_GROSS, 'Gross');
    preTaxDeductionTypes.forEach((t: any, i: number) =>
      setHdr(6 + n + i, fmtTypeLabel(t, 'Pre-Tax Ded.'))
    );
    setHdr(COL_TAXABLE, 'Taxable Salary');
    setHdr(COL_PAYE, 'PAYE');
    postTaxDeductionTypes.forEach((t: any, i: number) =>
      setHdr(8 + n + m + i, fmtTypeLabel(t, 'Post-Tax Ded.'))
    );
    setHdr(COL_TOTAL_DED, 'Total Ded.');
    setHdr(COL_NET, 'Net Payable');
    contributionTypes.forEach((t: any, i: number) =>
      setHdr(10 + n + m + p + i, fmtTypeLabel(t, 'Contribution'))
    );
    setHdr(COL_TOTAL_CONTRIB, 'Total Empr. Contrib.');
    setHdr(COL_EMPLOYER_COST, 'Employer Cost');
    ws.getRow(4).height = 18;

    // ---- Data rows ----
    rows.forEach((entry: any, index: number) => {
      const ROW = 5 + index;
      const name = [
        entry.run.employee?.first_name,
        entry.run.employee?.last_name,
      ]
        .filter(Boolean)
        .join(' ');
      const fill = getAlternatingRowFill(index);

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

      setTxt(COL_SN, String(index + 1));
      setTxt(COL_NAME, name || '-');
      setTxt(COL_DESIGNATION, entry.run.contract?.designation?.title || '-');
      setNum(COL_BASIC, entry.computed.basicSalary);
      allowanceTypes.forEach((t: any, i: number) =>
        setNum(5 + i, sumAllowanceByType(entry.run, t))
      );
      setNum(COL_GROSS, entry.computed.grossSalary);
      preTaxDeductionTypes.forEach((t: any, i: number) =>
        setNum(6 + n + i, sumDeductionByType(entry.run, t))
      );
      setNum(COL_TAXABLE, entry.computed.taxableIncome);
      setNum(COL_PAYE, entry.computed.paye);
      postTaxDeductionTypes.forEach((t: any, i: number) =>
        setNum(8 + n + m + i, sumDeductionByType(entry.run, t))
      );
      setNum(COL_TOTAL_DED, entry.computed.totalDeductions);
      setNum(COL_NET, entry.computed.netSalary);
      contributionTypes.forEach((t: any, i: number) =>
        setNum(10 + n + m + p + i, sumContributionByType(entry.run, t))
      );
      setNum(COL_TOTAL_CONTRIB, entry.computed.totalEmployerContributions);
      setNum(COL_EMPLOYER_COST, entry.computed.totalEmployerCost);
      ws.getRow(ROW).height = 16;
    });

    // ---- Totals row ----
    const TOTALS_ROW = 5 + rows.length;
    ws.mergeCells(
      `${getExcelColumnName(COL_SN)}${TOTALS_ROW}:${getExcelColumnName(COL_DESIGNATION)}${TOTALS_ROW}`
    );
    const setTotalTxt = (col: number, value: string) => {
      const cell = ws.getCell(`${getExcelColumnName(col)}${TOTALS_ROW}`);
      cell.value = value;
      applyCellStyle(cell, CELL_STYLES.totalRowText);
    };
    const setTotalNum = (col: number, value: number) => {
      const cell = ws.getCell(`${getExcelColumnName(col)}${TOTALS_ROW}`);
      cell.value = value;
      cell.numFmt = NUM_FMT;
      applyCellStyle(cell, CELL_STYLES.totalRowNumeric);
    };
    setTotalTxt(COL_SN, ' ');
    setTotalNum(COL_BASIC, totals.basicSalary);
    totals.allowanceByType.forEach((amount: number, i: number) =>
      setTotalNum(5 + i, amount)
    );
    setTotalNum(COL_GROSS, totals.grossSalary);
    totals.preTaxDeductionByType.forEach((amount: number, i: number) =>
      setTotalNum(6 + n + i, amount)
    );
    setTotalNum(COL_TAXABLE, totals.taxableSalary);
    setTotalNum(COL_PAYE, totals.paye);
    totals.postTaxDeductionByType.forEach((amount: number, i: number) =>
      setTotalNum(8 + n + m + i, amount)
    );
    setTotalNum(COL_TOTAL_DED, totals.totalDeductions);
    setTotalNum(COL_NET, totals.netSalary);
    totals.contributionByType.forEach((amount: number, i: number) =>
      setTotalNum(10 + n + m + p + i, amount)
    );
    setTotalNum(COL_TOTAL_CONTRIB, totals.totalEmployerContributions);
    setTotalNum(COL_EMPLOYER_COST, totals.totalEmployerCost);
    ws.getRow(TOTALS_ROW).height = 20;
    // ---- Summary section ----
    let summaryRow = TOTALS_ROW + 2;

    // thin grey border reused across all summary cells
    const smBorder = { style: 'thin' as const, color: { argb: 'FFB8B8B8' } };
    const allSides = {
      top: smBorder,
      bottom: smBorder,
      left: smBorder,
      right: smBorder,
    };

    const addSummaryRow = (
      label: string,
      amount: number,
      pct: number,
      bold: boolean
    ) => {
      ws.mergeCells(`A${summaryRow}:C${summaryRow}`);
      const labelCell = ws.getCell(`A${summaryRow}`);
      const cellD = ws.getCell(`D${summaryRow}`);
      const cellE = ws.getCell(`E${summaryRow}`);
      const pctCell = ws.getCell(`F${summaryRow}`);

      labelCell.value = label;
      labelCell.font = bold
        ? { bold: true, size: 10 }
        : { italic: true, size: 10 };
      labelCell.alignment = { vertical: 'middle' };
      labelCell.border = allSides;

      if (bold) {
        // main rows: blank D, amount in E
        cellD.border = allSides;
        cellE.value = amount;
        cellE.numFmt = NUM_FMT;
        cellE.font = { bold: true, size: 10 };
        cellE.alignment = { horizontal: 'right', vertical: 'middle' };
        cellE.border = allSides;
      } else {
        // sub-rows: amount in D, blank E
        cellD.value = amount;
        cellD.numFmt = NUM_FMT;
        cellD.font = { italic: true, size: 10 };
        cellD.alignment = { horizontal: 'right', vertical: 'middle' };
        cellD.border = allSides;
        cellE.border = allSides;
      }

      pctCell.value = pct;
      pctCell.numFmt = '0.00%';
      pctCell.font = { italic: true, size: 10 };
      pctCell.alignment = { horizontal: 'right', vertical: 'middle' };
      pctCell.border = allSides;

      ws.getRow(summaryRow).height = 18;
      summaryRow++;
    };

    addSummaryRow(
      'Gross Pay by Employer',
      grossByEmployer,
      pctOf(grossByEmployer, grossByEmployer) / 100,
      true
    );
    addSummaryRow(
      'Net Employee Payment',
      netEmployeePayment,
      pctOf(netEmployeePayment, grossByEmployer) / 100,
      true
    );
    addSummaryRow(
      'Payroll Taxes & Benefits',
      payrollTaxesBenefits,
      pctOf(payrollTaxesBenefits, grossByEmployer) / 100,
      true
    );
    addSummaryRow(
      '  P.A.Y.E',
      totals.paye,
      pctOf(totals.paye, grossByEmployer) / 100,
      false
    );
    contributionTypes.forEach((t: any, i: number) => {
      addSummaryRow(
        `  ${t.name || 'Contribution'}`,
        totals.contributionByType[i] || 0,
        pctOf(totals.contributionByType[i] || 0, grossByEmployer) / 100,
        false
      );
    });

    // Grand total line — label spans A:D, amount in E (aligns with bold rows)
    const topBlack = { style: 'thin' as const, color: { argb: 'FF000000' } };
    ws.mergeCells(`A${summaryRow}:D${summaryRow}`);
    ws.getCell(`A${summaryRow}`).border = {
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
    console.error('Error exporting payroll Excel:', error);
    throw new Error(
      error?.message || 'Excel export failed during workbook generation'
    );
  }
}
