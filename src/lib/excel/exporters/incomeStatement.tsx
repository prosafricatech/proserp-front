import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { applyCellStyle, CELL_STYLES, COLORS } from '../styles';
import { createWorkbook } from '../workBook';

export async function exportIncomeStatementToExcel(exportedData: any) {
  try {
    const { authOrganization, reportData, user } = exportedData;

    const incomes = reportData?.incomes || [];
    const directExpenses =
      reportData?.directExpenses || reportData?.direct_expenses || [];
    const indirectExpenses =
      reportData?.indirectExpenses || reportData?.indirect_expenses || [];

    const getLedgerTotal = (ledger: any) => {
      if (!Array.isArray(ledger?.amounts)) return 0;
      return ledger.amounts.reduce(
        (acc: any, item: any) => acc + (Number(item?.amount) || 0),
        0
      );
    };

    const formatDateTime = (value: any) => {
      if (!value) return '-';
      const parsedDate = new Date(value);
      if (Number.isNaN(parsedDate.getTime())) return value;
      return parsedDate.toLocaleString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const allLedgers = [...incomes, ...directExpenses, ...indirectExpenses];

    const periodMeta = allLedgers
      .flatMap((ledger: any) =>
        Array.isArray(ledger.amounts) ? ledger.amounts : []
      )
      .reduce((acc, item) => {
        if (!item?.period) return acc;
        if (!acc[item.period]) {
          acc[item.period] = {
            period: item.period,
            start_datetime: item.start_datetime,
            end_datetime: item.end_datetime,
          };
        }
        return acc;
      }, {});

    const periods: any = Object.values(periodMeta).sort((a: any, b: any) => {
      const aTime = a.start_datetime ? new Date(a.start_datetime).getTime() : 0;
      const bTime = b.start_datetime ? new Date(b.start_datetime).getTime() : 0;
      return aTime - bTime;
    });

    const MAX_COLUMNS = 26;

    const mergePeriods = (periods: any) => {
      if (periods.length <= MAX_COLUMNS) return periods.map((p: any) => [p]);

      const groupSize = Math.ceil(periods.length / MAX_COLUMNS);

      const groups = [];

      for (let i = 0; i < periods.length; i += groupSize) {
        groups.push(periods.slice(i, i + groupSize));
      }

      return groups;
    };

    const mergedPeriods = mergePeriods(periods);

    const getAmountByPeriodGroup = (ledger: any, group: any) => {
      return group.reduce((total: any, period: any) => {
        return total + getAmountByPeriod(ledger, period.period);
      }, 0);
    };

    const getAmountItemByPeriod = (ledger: any, period: any) => {
      if (!Array.isArray(ledger?.amounts)) return null;
      return ledger.amounts.find((item: any) => item.period === period) || null;
    };

    const getAmountByPeriod = (ledger: any, period: any) => {
      const matched = getAmountItemByPeriod(ledger, period);
      return Number(matched?.amount) || 0;
    };

    const getSectionPeriodTotal = (items: any, period: any) => {
      if (!Array.isArray(items)) return 0;
      return items.reduce(
        (acc, ledger) => acc + getAmountByPeriod(ledger, period),
        0
      );
    };

    const totalRevenue = incomes.reduce(
      (acc: any, curr: any) => acc + getLedgerTotal(curr),
      0
    );
    const totalCostOfRevenue = directExpenses.reduce(
      (acc: any, curr: any) => acc + getLedgerTotal(curr),
      0
    );
    const totalOperatingExpenses = indirectExpenses.reduce(
      (acc: any, curr: any) => acc + getLedgerTotal(curr),
      0
    );

    const reportPeriod = `${readableDate(reportData.filters.from, true)} - ${readableDate(reportData.filters.to, true)}`;
    const costCenters = reportData.filters.cost_centers;
    const organization = authOrganization.organization;

    // create workbook and worksheet
    const wb = createWorkbook();
    const ws = wb.addWorksheet('Income Statement');

    // column widths
    const baseColumns = [
      { width: 30 },
      { width: 25 },
      { width: 25 },
      { width: 25 },
      { width: 25 },
      { width: 25 },
      { width: 25 },
      { width: 25 },
      { width: 25 },
      { width: 25 },
      { width: 25 },
    ];

    ws.columns = baseColumns;

    // header section
    ws.addRow([organization.name, ' ', ' ', 'INCOME STATEMENT']);
    ws.addRow([' ', ' ', ' ', reportPeriod]);

    ws.getCell('A1').font = {
      bold: true,
      size: 12,
    };
    ws.getCell('D1').font = {
      bold: true,
      size: 12,
    };

    ws.addRow([]);

    ws.addRow(['Cost Center', ' ', 'Prepared By', 'Printed On']);
    for (let c = 0; c < 4; c++) {
      ws.getCell(`${String.fromCharCode(65 + c)}4`).font = {
        bold: true,
        size: 12,
      };
      applyCellStyle(
        ws.getCell(`${String.fromCharCode(65 + c)}4`),
        CELL_STYLES.tableHeader
      );
    }

    // DISPLAY COST CENTERS /////////
    let row = 5;
    let col = 65;

    if (costCenters?.length > 0) {
      for (let c = 0; c < costCenters.length; c++) {
        ws.getCell(`${String.fromCharCode(col)}${row}`).value =
          costCenters[c].name;
        ws.getCell(`${String.fromCharCode(col)}${row}`).border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } },
        };
        ws.getRow(row).height = 20;
        // col++;

        // if (col > 69) {
        //   col = 65;
        row++;
        // }
      }
    }

    // DISPLAY USER AND PRINT DATA
    ws.getCell('C5').value = user.name;
    ws.getCell('D5').value = readableDate(undefined, true);

    /////// TABLE HEADER ///////
    ws.addRow([]);

    const headerRow = (ws.lastRow?.number ?? 0) + 1;
    ws.getCell(`A${headerRow}`).value = 'Category';

    ws.getRow(headerRow).height = 20;
    ws.getCell(`A${headerRow}`).font = {
      bold: true,
      size: 12,
    };
    applyCellStyle(ws.getCell(`A${headerRow}`), CELL_STYLES.tableHeader);

    let headerCol = 66;

    if (mergedPeriods.length > 1) {
      for (let c = 0; c < mergedPeriods.length; c++) {
        const start = mergedPeriods[c][0];
        const end = mergedPeriods[c][mergedPeriods[c].length - 1];

        const label =
          mergedPeriods[c].length === 1
            ? start.period
            : `${start.period} - ${end.period}`;
        ws.getCell(`${String.fromCharCode(headerCol)}${headerRow}`).value =
          label;

        ws.getColumn(`${String.fromCharCode(headerCol)}`).width = 25;

        ws.getCell(`${String.fromCharCode(headerCol)}${headerRow}`).font = {
          bold: true,
          size: 12,
        };
        applyCellStyle(
          ws.getCell(`${String.fromCharCode(headerCol)}${headerRow}`),
          CELL_STYLES.tableHeader
        );

        headerCol++;
      }

      // Add total column if the periods are more than 1
      const usedColumns = ws.getRow(headerRow).cellCount;
      ws.getCell(`${String.fromCharCode(65 + usedColumns)}${headerRow}`).value =
        'Total';

      ws.getColumn(`${String.fromCharCode(65 + usedColumns)}`).width = 25;

      ws.getCell(`${String.fromCharCode(65 + usedColumns)}${headerRow}`).font =
        {
          bold: true,
          size: 12,
        };
      applyCellStyle(
        ws.getCell(`${String.fromCharCode(65 + usedColumns)}${headerRow}`),
        CELL_STYLES.tableHeader
      );
    } else {
      for (let c = 0; c < periods.length; c++) {
        ws.getCell(`${String.fromCharCode(headerCol)}${headerRow}`).value =
          periods[c].period;

        ws.getCell(`${String.fromCharCode(headerCol)}${headerRow}`).font = {
          bold: true,
          size: 12,
        };
        applyCellStyle(
          ws.getCell(`${String.fromCharCode(headerCol)}${headerRow}`),
          CELL_STYLES.tableHeader
        );
        headerCol++;
      }
    }

    /////// REVENUE ///////
    const revenuesRow = (ws.lastRow?.number ?? 0) + 1;
    ws.getCell(`A${revenuesRow}`).value = 'Revenue';
    applyCellStyle(ws.getCell(`A${revenuesRow}`), {
      ...CELL_STYLES.tableHeader,
    });
    if (mergedPeriods.length > 1) {
      ws.mergeCells(
        `A${revenuesRow}:${String.fromCharCode(66 + mergedPeriods.length)}${revenuesRow}`
      );
    } else {
      ws.mergeCells(`A${revenuesRow}:B${revenuesRow}`);
    }

    // revenue data rows
    let revenueDataRow = (ws.lastRow?.number ?? 0) + 1;
    incomes.forEach((income: any, index: number) => {
      ws.getCell(`A${revenueDataRow}`).value = income.ledger_name;
      ws.getCell(`A${revenueDataRow}`).border = {
        top: { style: 'thin', color: { argb: COLORS.BLACK } },
        bottom: { style: 'thin', color: { argb: COLORS.BLACK } },
        left: { style: 'thin', color: { argb: COLORS.BLACK } },
        right: { style: 'thin', color: { argb: COLORS.BLACK } },
      };
      let periodCol = 66;
      mergedPeriods.forEach((period: any, index: number) => {
        ws.getCell(`${String.fromCharCode(periodCol)}${revenueDataRow}`).value =
          getAmountByPeriodGroup(income, period);
        ws.getCell(
          `${String.fromCharCode(periodCol)}${revenueDataRow}`
        ).numFmt = '#,###.00';
        ws.getCell(
          `${String.fromCharCode(periodCol)}${revenueDataRow}`
        ).border = {
          top: { style: 'thin', color: { argb: COLORS.BLACK } },
          bottom: { style: 'thin', color: { argb: COLORS.BLACK } },
          left: { style: 'thin', color: { argb: COLORS.BLACK } },
          right: { style: 'thin', color: { argb: COLORS.BLACK } },
        };
        periodCol++;
      });

      if (mergedPeriods.length > 1) {
        let usedColumns = ws.getRow(revenueDataRow).cellCount;
        ws.getCell(
          `${String.fromCharCode(65 + usedColumns)}${revenueDataRow}`
        ).value = getLedgerTotal(income);
        ws.getCell(
          `${String.fromCharCode(65 + usedColumns)}${revenueDataRow}`
        ).numFmt = '#,###.00';
        ws.getCell(
          `${String.fromCharCode(65 + usedColumns)}${revenueDataRow}`
        ).border = {
          top: { style: 'thin', color: { argb: COLORS.BLACK } },
          bottom: { style: 'thin', color: { argb: COLORS.BLACK } },
          left: { style: 'thin', color: { argb: COLORS.BLACK } },
          right: { style: 'thin', color: { argb: COLORS.BLACK } },
        };
      }

      revenueDataRow++;
    });

    // revenue totals row
    const revenueTotalsRow = (ws.lastRow?.number ?? 0) + 1;
    ws.getCell(`A${revenueTotalsRow}`).value = 'Total';
    ws.getCell(`A${revenueTotalsRow}`).font = {
      bold: true,
    };
    let periodCol = 66;
    mergedPeriods.forEach((period: any, index: number) => {
      ws.getCell(`${String.fromCharCode(periodCol)}${revenueTotalsRow}`).value =
        period.reduce(
          (sum: any, p: any) => sum + getSectionPeriodTotal(incomes, p.period),
          0
        );
      ws.getCell(
        `${String.fromCharCode(periodCol)}${revenueTotalsRow}`
      ).numFmt = '#,###.00';
      ws.getCell(`${String.fromCharCode(periodCol)}${revenueTotalsRow}`).font =
        {
          bold: true,
        };
      ws.getCell(
        `${String.fromCharCode(periodCol)}${revenueTotalsRow}`
      ).border = {
        top: { style: 'thin', color: { argb: COLORS.BLACK } },
        bottom: { style: 'thin', color: { argb: COLORS.BLACK } },
        left: { style: 'thin', color: { argb: COLORS.BLACK } },
        right: { style: 'thin', color: { argb: COLORS.BLACK } },
      };
      periodCol++;
    });
    if (mergedPeriods.length > 1) {
      let usedColumns = ws.getRow(revenueTotalsRow).cellCount;
      ws.getCell(
        `${String.fromCharCode(65 + usedColumns)}${revenueTotalsRow}`
      ).value = totalRevenue;
      ws.getCell(
        `${String.fromCharCode(65 + usedColumns)}${revenueTotalsRow}`
      ).numFmt = '#,###.00';
      ws.getCell(
        `${String.fromCharCode(65 + usedColumns)}${revenueTotalsRow}`
      ).font = {
        bold: true,
      };
      ws.getCell(
        `${String.fromCharCode(65 + usedColumns)}${revenueTotalsRow}`
      ).border = {
        top: { style: 'thin', color: { argb: COLORS.BLACK } },
        bottom: { style: 'thin', color: { argb: COLORS.BLACK } },
        left: { style: 'thin', color: { argb: COLORS.BLACK } },
        right: { style: 'thin', color: { argb: COLORS.BLACK } },
      };
    }

    /////// COST OF REVENUE ///////
    const constOfRevenueRow = (ws.lastRow?.number ?? 0) + 1;
    ws.getCell(`A${constOfRevenueRow}`).value = 'Cost Of Revenue';
    applyCellStyle(ws.getCell(`A${constOfRevenueRow}`), {
      ...CELL_STYLES.tableHeader,
    });
    if (mergedPeriods.length > 1) {
      ws.mergeCells(
        `A${constOfRevenueRow}:${String.fromCharCode(66 + mergedPeriods.length)}${constOfRevenueRow}`
      );
    } else {
      ws.mergeCells(`A${constOfRevenueRow}:B${constOfRevenueRow}`);
    }

    // const of revenue data rows
    let constOfRevenueDataRow = (ws.lastRow?.number ?? 0) + 1;
    directExpenses.forEach((exp: any, index: number) => {
      ws.getCell(`A${constOfRevenueDataRow}`).value = exp.ledger_name;
      ws.getCell(`A${constOfRevenueDataRow}`).border = {
        top: { style: 'thin', color: { argb: COLORS.BLACK } },
        bottom: { style: 'thin', color: { argb: COLORS.BLACK } },
        left: { style: 'thin', color: { argb: COLORS.BLACK } },
        right: { style: 'thin', color: { argb: COLORS.BLACK } },
      };
      let periodCol = 66;
      mergedPeriods.forEach((period: any, index: number) => {
        ws.getCell(
          `${String.fromCharCode(periodCol)}${constOfRevenueDataRow}`
        ).value = getAmountByPeriodGroup(exp, period);
        ws.getCell(
          `${String.fromCharCode(periodCol)}${constOfRevenueDataRow}`
        ).numFmt = '#,###.00';
        ws.getCell(
          `${String.fromCharCode(periodCol)}${constOfRevenueDataRow}`
        ).border = {
          top: { style: 'thin', color: { argb: COLORS.BLACK } },
          bottom: { style: 'thin', color: { argb: COLORS.BLACK } },
          left: { style: 'thin', color: { argb: COLORS.BLACK } },
          right: { style: 'thin', color: { argb: COLORS.BLACK } },
        };
        periodCol++;
      });

      if (mergedPeriods.length > 1) {
        let usedColumns = ws.getRow(constOfRevenueDataRow).cellCount;
        ws.getCell(
          `${String.fromCharCode(65 + usedColumns)}${constOfRevenueDataRow}`
        ).value = getLedgerTotal(exp);
        ws.getCell(
          `${String.fromCharCode(65 + usedColumns)}${constOfRevenueDataRow}`
        ).numFmt = '#,###.00';
        ws.getCell(
          `${String.fromCharCode(65 + usedColumns)}${constOfRevenueDataRow}`
        ).border = {
          top: { style: 'thin', color: { argb: COLORS.BLACK } },
          bottom: { style: 'thin', color: { argb: COLORS.BLACK } },
          left: { style: 'thin', color: { argb: COLORS.BLACK } },
          right: { style: 'thin', color: { argb: COLORS.BLACK } },
        };
      }

      constOfRevenueDataRow++;
    });

    // cost of revenue totals row
    const constOfRevenueTotalsRow = (ws.lastRow?.number ?? 0) + 1;
    ws.getCell(`A${constOfRevenueTotalsRow}`).value = 'Total';
    ws.getCell(`A${constOfRevenueTotalsRow}`).font = {
      bold: true,
    };
    let costOfRevenueTotalCol = 66;
    mergedPeriods.forEach((period: any, index: number) => {
      ws.getCell(
        `${String.fromCharCode(costOfRevenueTotalCol)}${constOfRevenueTotalsRow}`
      ).value = period.reduce(
        (sum: any, p: any) =>
          sum + getSectionPeriodTotal(directExpenses, p.period),
        0
      );
      ws.getCell(
        `${String.fromCharCode(costOfRevenueTotalCol)}${constOfRevenueTotalsRow}`
      ).numFmt = '#,###.00';
      ws.getCell(
        `${String.fromCharCode(costOfRevenueTotalCol)}${constOfRevenueTotalsRow}`
      ).font = {
        bold: true,
      };
      ws.getCell(
        `${String.fromCharCode(costOfRevenueTotalCol)}${constOfRevenueTotalsRow}`
      ).border = {
        top: { style: 'thin', color: { argb: COLORS.BLACK } },
        bottom: { style: 'thin', color: { argb: COLORS.BLACK } },
        left: { style: 'thin', color: { argb: COLORS.BLACK } },
        right: { style: 'thin', color: { argb: COLORS.BLACK } },
      };

      costOfRevenueTotalCol++;
    });
    if (mergedPeriods.length > 1) {
      let usedColumns = ws.getRow(constOfRevenueTotalsRow).cellCount;
      ws.getCell(
        `${String.fromCharCode(65 + usedColumns)}${constOfRevenueTotalsRow}`
      ).value = totalCostOfRevenue;
      ws.getCell(
        `${String.fromCharCode(65 + usedColumns)}${constOfRevenueTotalsRow}`
      ).numFmt = '#,###.00';
      ws.getCell(
        `${String.fromCharCode(65 + usedColumns)}${constOfRevenueTotalsRow}`
      ).font = {
        bold: true,
      };
      ws.getCell(
        `${String.fromCharCode(65 + usedColumns)}${constOfRevenueTotalsRow}`
      ).border = {
        top: { style: 'thin', color: { argb: COLORS.BLACK } },
        bottom: { style: 'thin', color: { argb: COLORS.BLACK } },
        left: { style: 'thin', color: { argb: COLORS.BLACK } },
        right: { style: 'thin', color: { argb: COLORS.BLACK } },
      };
    }

    /////// GROSS PROFIT ///////
    const grossProfitRow = (ws.lastRow?.number ?? 0) + 1;
    ws.getCell(`A${grossProfitRow}`).value = 'Gross Profit';
    applyCellStyle(ws.getCell(`A${grossProfitRow}`), CELL_STYLES.tableHeader);

    let grossProfitCol = 66;
    mergedPeriods.forEach((period: any, index: number) => {
      ws.getCell(
        `${String.fromCharCode(grossProfitCol)}${grossProfitRow}`
      ).value =
        period.reduce(
          (sum: any, p: any) => sum + getSectionPeriodTotal(incomes, p.period),
          0
        ) -
        period.reduce(
          (sum: any, p: any) =>
            sum + getSectionPeriodTotal(directExpenses, p.period),
          0
        );
      ws.getCell(
        `${String.fromCharCode(grossProfitCol)}${grossProfitRow}`
      ).numFmt = '#,###.00';
      applyCellStyle(
        ws.getCell(`${String.fromCharCode(grossProfitCol)}${grossProfitRow}`),
        CELL_STYLES.tableHeader
      );
      ws.getCell(
        `${String.fromCharCode(grossProfitCol)}${grossProfitRow}`
      ).alignment = {
        horizontal: 'right',
      };

      grossProfitCol++;
    });
    if (mergedPeriods.length > 1) {
      let usedColumns = ws.getRow(grossProfitRow).cellCount;
      ws.getCell(
        `${String.fromCharCode(65 + usedColumns)}${grossProfitRow}`
      ).value = totalRevenue - totalCostOfRevenue;
      ws.getCell(
        `${String.fromCharCode(65 + usedColumns)}${grossProfitRow}`
      ).numFmt = '#,###.00';
      applyCellStyle(
        ws.getCell(`${String.fromCharCode(65 + usedColumns)}${grossProfitRow}`),
        CELL_STYLES.tableHeader
      );
      ws.getCell(
        `${String.fromCharCode(65 + usedColumns)}${grossProfitRow}`
      ).alignment = {
        horizontal: 'right',
      };
    }

    /////// OPERATING EXPENSES ///////
    const operatingExpsRow = (ws.lastRow?.number ?? 0) + 1;
    ws.getCell(`A${operatingExpsRow}`).value = 'Operating Expenses';
    applyCellStyle(ws.getCell(`A${operatingExpsRow}`), {
      ...CELL_STYLES.tableHeader,
    });
    if (mergedPeriods.length > 1) {
      ws.mergeCells(
        `A${operatingExpsRow}:${String.fromCharCode(66 + mergedPeriods.length)}${operatingExpsRow}`
      );
    } else {
      ws.mergeCells(`A${operatingExpsRow}:B${operatingExpsRow}`);
    }

    // operating expenses data rows
    let operatingExpsDataRow = (ws.lastRow?.number ?? 0) + 1;
    indirectExpenses.forEach((exp: any, index: number) => {
      ws.getCell(`A${operatingExpsDataRow}`).value = exp.ledger_name;
      ws.getCell(`A${operatingExpsDataRow}`).border = {
        top: { style: 'thin', color: { argb: COLORS.BLACK } },
        bottom: { style: 'thin', color: { argb: COLORS.BLACK } },
        left: { style: 'thin', color: { argb: COLORS.BLACK } },
        right: { style: 'thin', color: { argb: COLORS.BLACK } },
      };
      let periodCol = 66;
      mergedPeriods.forEach((period: any, index: number) => {
        ws.getCell(
          `${String.fromCharCode(periodCol)}${operatingExpsDataRow}`
        ).value = getAmountByPeriodGroup(exp, period);
        ws.getCell(
          `${String.fromCharCode(periodCol)}${operatingExpsDataRow}`
        ).numFmt = '#,###.00';
        ws.getCell(
          `${String.fromCharCode(periodCol)}${operatingExpsDataRow}`
        ).border = {
          top: { style: 'thin', color: { argb: COLORS.BLACK } },
          bottom: { style: 'thin', color: { argb: COLORS.BLACK } },
          left: { style: 'thin', color: { argb: COLORS.BLACK } },
          right: { style: 'thin', color: { argb: COLORS.BLACK } },
        };
        periodCol++;
      });

      if (mergedPeriods.length > 1) {
        let usedColumns = ws.getRow(operatingExpsDataRow).cellCount;
        ws.getCell(
          `${String.fromCharCode(65 + usedColumns)}${operatingExpsDataRow}`
        ).value = getLedgerTotal(exp);
        ws.getCell(
          `${String.fromCharCode(65 + usedColumns)}${operatingExpsDataRow}`
        ).numFmt = '#,###.00';
        ws.getCell(
          `${String.fromCharCode(65 + usedColumns)}${operatingExpsDataRow}`
        ).border = {
          top: { style: 'thin', color: { argb: COLORS.BLACK } },
          bottom: { style: 'thin', color: { argb: COLORS.BLACK } },
          left: { style: 'thin', color: { argb: COLORS.BLACK } },
          right: { style: 'thin', color: { argb: COLORS.BLACK } },
        };
      }

      operatingExpsDataRow++;
    });

    // operating expenses totals row
    const operatingExpsTotalsRow = (ws.lastRow?.number ?? 0) + 1;
    ws.getCell(`A${operatingExpsTotalsRow}`).value = 'Total';
    ws.getCell(`A${operatingExpsTotalsRow}`).font = {
      bold: true,
    };
    let openingExpsTotalCol = 66;
    mergedPeriods.forEach((period: any, index: number) => {
      ws.getCell(
        `${String.fromCharCode(openingExpsTotalCol)}${operatingExpsTotalsRow}`
      ).value = period.reduce(
        (sum: any, p: any) =>
          sum + getSectionPeriodTotal(indirectExpenses, p.period),
        0
      );
      ws.getCell(
        `${String.fromCharCode(openingExpsTotalCol)}${operatingExpsTotalsRow}`
      ).numFmt = '#,###.00';
      ws.getCell(
        `${String.fromCharCode(openingExpsTotalCol)}${operatingExpsTotalsRow}`
      ).font = {
        bold: true,
      };
      ws.getCell(
        `${String.fromCharCode(openingExpsTotalCol)}${operatingExpsTotalsRow}`
      ).border = {
        top: { style: 'thin', color: { argb: COLORS.BLACK } },
        bottom: { style: 'thin', color: { argb: COLORS.BLACK } },
        left: { style: 'thin', color: { argb: COLORS.BLACK } },
        right: { style: 'thin', color: { argb: COLORS.BLACK } },
      };

      openingExpsTotalCol++;
    });
    if (mergedPeriods.length > 1) {
      let usedColumns = ws.getRow(operatingExpsTotalsRow).cellCount;
      ws.getCell(
        `${String.fromCharCode(65 + usedColumns)}${operatingExpsTotalsRow}`
      ).value = totalOperatingExpenses;
      ws.getCell(
        `${String.fromCharCode(65 + usedColumns)}${operatingExpsTotalsRow}`
      ).numFmt = '#,###.00';
      ws.getCell(
        `${String.fromCharCode(65 + usedColumns)}${operatingExpsTotalsRow}`
      ).font = {
        bold: true,
      };
      ws.getCell(
        `${String.fromCharCode(65 + usedColumns)}${operatingExpsTotalsRow}`
      ).border = {
        top: { style: 'thin', color: { argb: COLORS.BLACK } },
        bottom: { style: 'thin', color: { argb: COLORS.BLACK } },
        left: { style: 'thin', color: { argb: COLORS.BLACK } },
        right: { style: 'thin', color: { argb: COLORS.BLACK } },
      };
    }

    /////// NET INCOME ///////
    const netIncomeRow = (ws.lastRow?.number ?? 0) + 1;
    ws.getCell(`A${netIncomeRow}`).value = 'Net Income';
    applyCellStyle(ws.getCell(`A${netIncomeRow}`), CELL_STYLES.tableHeader);

    let netIncomeCol = 66;
    mergedPeriods.forEach((period: any, index: number) => {
      ws.getCell(`${String.fromCharCode(netIncomeCol)}${netIncomeRow}`).value =
        period.reduce(
          (sum: any, p: any) => sum + getSectionPeriodTotal(incomes, p.period),
          0
        ) -
        period.reduce(
          (sum: any, p: any) =>
            sum + getSectionPeriodTotal(directExpenses, p.period),
          0
        ) -
        period.reduce(
          (sum: any, p: any) =>
            sum + getSectionPeriodTotal(indirectExpenses, p.period),
          0
        );
      ws.getCell(`${String.fromCharCode(netIncomeCol)}${netIncomeRow}`).numFmt =
        '#,###.00';
      applyCellStyle(
        ws.getCell(`${String.fromCharCode(netIncomeCol)}${netIncomeRow}`),
        CELL_STYLES.tableHeader
      );
      ws.getCell(
        `${String.fromCharCode(netIncomeCol)}${netIncomeRow}`
      ).alignment = {
        horizontal: 'right',
      };

      netIncomeCol++;
    });
    if (mergedPeriods.length > 1) {
      let usedColumns = ws.getRow(netIncomeRow).cellCount;
      ws.getCell(
        `${String.fromCharCode(65 + usedColumns)}${netIncomeRow}`
      ).value = totalRevenue - totalCostOfRevenue - totalOperatingExpenses;
      ws.getCell(
        `${String.fromCharCode(65 + usedColumns)}${netIncomeRow}`
      ).numFmt = '#,###.00';
      applyCellStyle(
        ws.getCell(`${String.fromCharCode(65 + usedColumns)}${netIncomeRow}`),
        CELL_STYLES.tableHeader
      );
      ws.getCell(
        `${String.fromCharCode(65 + usedColumns)}${netIncomeRow}`
      ).alignment = {
        horizontal: 'right',
      };
    }

    // Return Excel buffer
    return await wb.xlsx.writeBuffer();
    // return exportedData;
  } catch (error: any) {
    console.error('Error exporting sample Excel:', error);
    throw new Error(
      error?.message || 'Excel export failed during workbook generation'
    );
  }
}
