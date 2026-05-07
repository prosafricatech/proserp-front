import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { applyCellStyle, CELL_STYLES, COLORS, FILLS } from '../styles';
import { createWorkbook } from '../workBook';

// ─── Number formats ────────────────────────────────────────────────────────────
const AMT_FMT = '#,###.00';
const QTY_FMT = '#,###.00';

// ─── Column layout: A–F (6 cols) used as the base grid ────────────────────────
const LAST_COL_CODE = 70; // 'F'

// ─── Shared row helpers ────────────────────────────────────────────────────────

/** Apply tableHeader style to all 6 cols of a row */
function styleHeaderRow(ws: any, rowNum: number) {
  for (let c = 65; c <= LAST_COL_CODE; c++) {
    applyCellStyle(
      ws.getCell(`${String.fromCharCode(c)}${rowNum}`),
      CELL_STYLES.tableHeader
    );
  }
}

/** Apply dataRowText style to all 6 cols of a row */
function styleBorderRow(ws: any, rowNum: number) {
  for (let c = 65; c <= LAST_COL_CODE; c++) {
    applyCellStyle(
      ws.getCell(`${String.fromCharCode(c)}${rowNum}`),
      CELL_STYLES.dataRowText
    );
  }
}

/** Write a numeric value into a cell — ALWAYS call after styleBorderRow/styleHeaderRow */
function setNum(cell: any, value: any, fmt: string) {
  cell.value = value ?? null;
  if (value != null) {
    cell.numFmt = fmt;
    cell.alignment = { horizontal: 'right', vertical: 'middle' };
  }
}

/**
 * Write a full-width section banner (A:F merged, tableHeader style, centered label).
 * Mirrors the PDF's `sectionHeading` style.
 */
function writeSectionBanner(ws: any, label: string): number {
  const rowNum = (ws.lastRow?.number ?? 0) + 1;
  ws.addRow([label, ' ', ' ', ' ', ' ', ' ']);
  ws.mergeCells(`A${rowNum}:F${rowNum}`);
  styleHeaderRow(ws, rowNum);
  ws.getCell(`A${rowNum}`).alignment = {
    horizontal: 'center',
    vertical: 'middle',
  };
  ws.getRow(rowNum).height = 20;
  return rowNum;
}

/**
 * Write a sub-section italic label (A:F merged, alternateRow fill).
 * Mirrors the PDF's `subSectionHeading` — gray italic text above nested batch tables.
 */
function writeSubLabel(ws: any, label: string) {
  const rowNum = (ws.lastRow?.number ?? 0) + 1;
  ws.addRow([label, ' ', ' ', ' ', ' ', ' ']);
  ws.mergeCells(`A${rowNum}:F${rowNum}`);
  for (let c = 65; c <= LAST_COL_CODE; c++) {
    ws.getCell(`${String.fromCharCode(c)}${rowNum}`).fill = FILLS.alternateRow;
    ws.getCell(`${String.fromCharCode(c)}${rowNum}`).border = {
      top: { style: 'thin', color: { argb: COLORS.BLACK } },
      bottom: { style: 'thin', color: { argb: COLORS.BLACK } },
      left: { style: 'thin', color: { argb: COLORS.BLACK } },
      right: { style: 'thin', color: { argb: COLORS.BLACK } },
    };
  }
  ws.getCell(`A${rowNum}`).font = {
    bold: true,
    size: 8,
    italic: true,
    color: { argb: COLORS.GRAY },
  };
  ws.getCell(`A${rowNum}`).alignment = {
    horizontal: 'left',
    vertical: 'middle',
  };
  ws.getRow(rowNum).height = 14;
}

/**
 * Write a table header row with the given labels.
 * numericCols: 0-based column indices that should be right-aligned (set after styleHeaderRow).
 */
function writeTableHeader(
  ws: any,
  labels: string[],
  numericCols: number[] = []
): number {
  const rowNum = (ws.lastRow?.number ?? 0) + 1;
  const padded = [...labels, ...Array(6 - labels.length).fill(' ')];
  ws.addRow(padded);
  styleHeaderRow(ws, rowNum);
  ws.getRow(rowNum).height = 18;
  numericCols.forEach((colIdx) => {
    ws.getCell(`${String.fromCharCode(65 + colIdx)}${rowNum}`).alignment = {
      horizontal: 'right',
      vertical: 'middle',
    };
  });
  return rowNum;
}

// ─── Main exporter ─────────────────────────────────────────────────────────────

export async function ExportProductionCostReportToExcel(exportedData: any) {
  try {
    const { reportData, authOrganization, user } = exportedData;

    const orgName = authOrganization?.organization?.name ?? '';
    const userName = user?.name || '';

    const periodLabel = `${readableDate(reportData?.period?.from, true)} - ${readableDate(reportData?.period?.to, true)}`;
    const printedOn = readableDate(new Date().toISOString(), true);

    // ── Derived summary values (mirrors PDF's costBreakdownRows logic) ─────────
    const materialCost = Number(reportData?.summary?.total_material_cost || 0);
    const expenseCost = Number(
      reportData?.summary?.total_ledger_expense_cost || 0
    );
    const byProductOffset = Number(
      reportData?.summary?.total_by_product_offset || 0
    );
    const breakdownTotal = materialCost + expenseCost + byProductOffset;
    const netCost = Number(reportData?.summary?.net_production_cost || 0);

    const pct = (val: number) =>
      breakdownTotal > 0 ? (val / breakdownTotal) * 100 : 0;

    // ── Workbook & worksheet ──────────────────────────────────────────────────
    const wb = createWorkbook();
    const ws = wb.addWorksheet('Production Cost Report');

    ws.columns = [
      { width: 28 }, // A — S/N / label / batch no
      { width: 30 }, // B — Product / Ledger / Date
      { width: 16 }, // C — Unit / Currency / Qty
      { width: 22 }, // D — Total Qty / Rate / Market Val per Unit
      { width: 22 }, // E — Avg Unit Cost / Exchange Rate / Total
      { width: 32 }, // F — Total Cost / Remarks / Total Amount
    ];

    // ── ROW 1: Org name (A) + Report title (F) ─────────────────────────────
    ws.addRow([orgName, ' ', ' ', ' ', ' ', 'Production Cost Report']);
    ws.getCell('A1').font = { bold: true, size: 12 };
    ws.getCell('F1').font = { bold: true, size: 12 };

    // ── ROW 2: Period (F) ───────────────────────────────────────────────────
    ws.addRow([' ', ' ', ' ', ' ', ' ', `Period: ${periodLabel}`]);
    ws.getCell('F2').font = { bold: true, size: 10 };

    // ── ROW 3: Spacer ───────────────────────────────────────────────────────
    ws.addRow([]);

    // ── ROW 4: Meta strip labels — Printed By | Printed On | Report Period ──
    // PDF: 3 flex:1 blocks. Mapped to merged pairs A:B | C:D | E:F
    ws.addRow(['Printed By', ' ', 'Printed On', ' ', 'Report Period', ' ']);
    ws.mergeCells('A4:B4');
    ws.mergeCells('C4:D4');
    ws.mergeCells('E4:F4');
    styleHeaderRow(ws, 4);
    ws.getRow(4).height = 20;

    // ── ROW 5: Meta strip values ────────────────────────────────────────────
    ws.addRow([userName, ' ', printedOn, ' ', periodLabel, ' ']);
    ws.mergeCells('A5:B5');
    ws.mergeCells('C5:D5');
    ws.mergeCells('E5:F5');
    for (let c = 65; c <= LAST_COL_CODE; c++) {
      ws.getCell(`${String.fromCharCode(c)}5`).border = {
        top: { style: 'thin', color: { argb: COLORS.BLACK } },
        bottom: { style: 'thin', color: { argb: COLORS.BLACK } },
        left: { style: 'thin', color: { argb: COLORS.BLACK } },
        right: { style: 'thin', color: { argb: COLORS.BLACK } },
      };
    }
    ws.getRow(5).height = 18;

    // ── ROW 6: Spacer ───────────────────────────────────────────────────────
    ws.addRow([]);

    // ── KPI CARDS ────────────────────────────────────────────────────────────
    // PDF: 4 flex:1 cards. In Excel: 3 cards on one row (A:B | C:D | E:F),
    // then Net Production Cost gets its own full-width row as the key figure.

    // KPI label row
    const kpiLabelRow = (ws.lastRow?.number ?? 0) + 1;
    ws.addRow([
      'Total Material Cost',
      ' ',
      'Total Expense Cost',
      ' ',
      'By-Product Offset',
      ' ',
    ]);
    ws.mergeCells(`A${kpiLabelRow}:B${kpiLabelRow}`);
    ws.mergeCells(`C${kpiLabelRow}:D${kpiLabelRow}`);
    ws.mergeCells(`E${kpiLabelRow}:F${kpiLabelRow}`);
    ['A', 'C', 'E'].forEach((col) => {
      const cell = ws.getCell(`${col}${kpiLabelRow}`);
      cell.font = { bold: true, size: 9 };
      cell.alignment = { horizontal: 'left', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: COLORS.BLACK } },
        left: { style: 'thin', color: { argb: COLORS.BLACK } },
        right: { style: 'thin', color: { argb: COLORS.BLACK } },
      };
    });
    ws.getRow(kpiLabelRow).height = 16;

    // KPI value row
    const kpiValueRow = (ws.lastRow?.number ?? 0) + 1;
    ws.addRow([materialCost, ' ', expenseCost, ' ', byProductOffset, ' ']);
    ws.mergeCells(`A${kpiValueRow}:B${kpiValueRow}`);
    ws.mergeCells(`C${kpiValueRow}:D${kpiValueRow}`);
    ws.mergeCells(`E${kpiValueRow}:F${kpiValueRow}`);
    ['A', 'C', 'E'].forEach((col) => {
      const cell = ws.getCell(`${col}${kpiValueRow}`);
      cell.numFmt = AMT_FMT;
      cell.font = { bold: true, size: 13 };
      cell.alignment = { horizontal: 'left', vertical: 'middle' };
      cell.border = {
        bottom: { style: 'thin', color: { argb: COLORS.BLACK } },
        left: { style: 'thin', color: { argb: COLORS.BLACK } },
        right: { style: 'thin', color: { argb: COLORS.BLACK } },
      };
    });
    ws.getRow(kpiValueRow).height = 26;

    // Net Production Cost — full-width banner (most prominent figure)
    const netLabelRow = (ws.lastRow?.number ?? 0) + 1;
    ws.addRow(['Net Production Cost', ' ', ' ', ' ', ' ', ' ']);
    ws.mergeCells(`A${netLabelRow}:F${netLabelRow}`);
    styleHeaderRow(ws, netLabelRow);
    ws.getCell(`A${netLabelRow}`).font = { bold: true, size: 10 };
    ws.getCell(`A${netLabelRow}`).alignment = {
      horizontal: 'left',
      vertical: 'middle',
    };
    ws.getRow(netLabelRow).height = 16;

    const netValueRow = (ws.lastRow?.number ?? 0) + 1;
    ws.addRow([netCost, ' ', ' ', ' ', ' ', ' ']);
    ws.mergeCells(`A${netValueRow}:F${netValueRow}`);
    ws.getCell(`A${netValueRow}`).value = netCost;
    ws.getCell(`A${netValueRow}`).numFmt = AMT_FMT;
    ws.getCell(`A${netValueRow}`).font = { bold: true, size: 16 };
    ws.getCell(`A${netValueRow}`).alignment = {
      horizontal: 'left',
      vertical: 'middle',
    };
    for (let c = 65; c <= LAST_COL_CODE; c++) {
      ws.getCell(`${String.fromCharCode(c)}${netValueRow}`).border = {
        bottom: { style: 'thin', color: { argb: COLORS.BLACK } },
        left: { style: 'thin', color: { argb: COLORS.BLACK } },
        right: { style: 'thin', color: { argb: COLORS.BLACK } },
      };
    }
    ws.getRow(netValueRow).height = 28;

    // ── ROW: Spacer ─────────────────────────────────────────────────────────
    ws.addRow([]);

    // ── COST BREAKDOWN SECTION ───────────────────────────────────────────────
    // PDF: visual bar chart card — 3 rows: label | amount | % share
    // Excel: section banner + header + 3 data rows (Category | Amount | % Share)
    writeSectionBanner(ws, 'COST BREAKDOWN');
    writeTableHeader(
      ws,
      ['Category', 'Amount', '% Share', ' ', ' ', ' '],
      [1, 2]
    );

    [
      { label: 'Materials', value: materialCost },
      { label: 'Ledger Expenses', value: expenseCost },
      { label: 'By-Product Offset', value: byProductOffset },
    ].forEach(({ label, value }) => {
      const rowNum = (ws.lastRow?.number ?? 0) + 1;
      ws.addRow([label, null, null, ' ', ' ', ' ']);
      styleBorderRow(ws, rowNum);
      setNum(ws.getCell(`B${rowNum}`), value, AMT_FMT);
      // Store as decimal so Excel renders as percentage with 0.0% format
      setNum(ws.getCell(`C${rowNum}`), pct(value) / 100, '0.0%');
    });

    // ── ROW: Spacer ─────────────────────────────────────────────────────────
    ws.addRow([]);

    // ── MATERIAL CONSUMPTIONS SECTION ────────────────────────────────────────
    // PDF cols: S/N | Product | Unit | Total Qty | Avg Unit Cost | Total Cost
    writeSectionBanner(ws, 'MATERIAL CONSUMPTIONS');
    writeTableHeader(
      ws,
      ['S/N', 'Product', 'Unit', 'Total Qty', 'Avg Unit Cost', 'Total Cost'],
      [3, 4, 5]
    );

    (reportData?.material_consumptions || []).forEach(
      (item: any, idx: number) => {
        const rowNum = (ws.lastRow?.number ?? 0) + 1;
        ws.addRow([
          `${idx + 1}.`,
          item.product?.name ?? '',
          item.measurement_unit?.symbol ?? '',
          null,
          null,
          null,
        ]);
        styleBorderRow(ws, rowNum);
        ws.getCell(`A${rowNum}`).alignment = {
          horizontal: 'center',
          vertical: 'middle',
        };
        setNum(ws.getCell(`D${rowNum}`), item.total_quantity, QTY_FMT);
        setNum(ws.getCell(`E${rowNum}`), item.average_unit_cost, AMT_FMT);
        setNum(ws.getCell(`F${rowNum}`), item.total_cost, AMT_FMT);

        // Nested: Batches that consumed this material
        // PDF nested cols: Batch | Date | Qty | Unit Cost | Total (5 cols → A–E, F blank)
        if ((item.batches || []).length > 0) {
          writeSubLabel(ws, 'Batches that consumed this material');
          writeTableHeader(
            ws,
            ['Batch', 'Date', 'Qty', 'Unit Cost', 'Total', ' '],
            [2, 3, 4]
          );

          item.batches.forEach((batch: any) => {
            const bRowNum = (ws.lastRow?.number ?? 0) + 1;
            ws.addRow([
              batch.batchNo ?? '',
              readableDate(batch.end_date, true),
              null,
              null,
              null,
              ' ',
            ]);
            styleBorderRow(ws, bRowNum);
            setNum(ws.getCell(`C${bRowNum}`), batch.quantity, QTY_FMT);
            setNum(ws.getCell(`D${bRowNum}`), batch.unit_cost, AMT_FMT);
            setNum(ws.getCell(`E${bRowNum}`), batch.total_cost, AMT_FMT);
          });
        }
      }
    );

    // ── ROW: Spacer ─────────────────────────────────────────────────────────
    ws.addRow([]);

    // ── LEDGER EXPENSES SECTION ──────────────────────────────────────────────
    // PDF cols: S/N | Ledger | Currency | Total Amount
    // Mapped: A=S/N, B=Ledger, C=Currency, D=Total Amount, E+F blank
    writeSectionBanner(ws, 'LEDGER EXPENSES');
    writeTableHeader(
      ws,
      ['S/N', 'Ledger', 'Currency', 'Total Amount', ' ', ' '],
      [3]
    );

    (reportData?.ledger_expenses || []).forEach((item: any, idx: number) => {
      const rowNum = (ws.lastRow?.number ?? 0) + 1;
      ws.addRow([
        `${idx + 1}.`,
        item.ledger?.name ?? '',
        item.currency?.name ?? '',
        null,
        ' ',
        ' ',
      ]);
      styleBorderRow(ws, rowNum);
      ws.getCell(`A${rowNum}`).alignment = {
        horizontal: 'center',
        vertical: 'middle',
      };
      setNum(ws.getCell(`D${rowNum}`), item.total_amount, AMT_FMT);

      // Nested: batches receiving this expense — conditional on showExchangeRate
      if ((item.batches || []).length > 0) {
        const showExchangeRate = (item.batches || []).some(
          (batch: any) => Number(batch.exchange_rate || 1) !== 1
        );

        writeSubLabel(
          ws,
          'Production batches receiving this expense allocation'
        );

        if (showExchangeRate) {
          // 6 cols: Batch | Date | Qty | Rate | Exch. Rate | Total
          // (PDF has 7 with Remarks — Remarks moved to a note row if needed; fits 6-col grid)
          writeTableHeader(
            ws,
            ['Batch', 'Date', 'Qty', 'Rate', 'Exch. Rate', 'Total'],
            [2, 3, 4, 5]
          );
          item.batches.forEach((batch: any) => {
            const bRowNum = (ws.lastRow?.number ?? 0) + 1;
            ws.addRow([
              batch.batchNo ?? '',
              readableDate(batch.end_date, true),
              null,
              null,
              null,
              null,
            ]);
            styleBorderRow(ws, bRowNum);
            setNum(ws.getCell(`C${bRowNum}`), batch.quantity, QTY_FMT);
            setNum(ws.getCell(`D${bRowNum}`), batch.rate, AMT_FMT);
            setNum(ws.getCell(`E${bRowNum}`), batch.exchange_rate, QTY_FMT);
            setNum(ws.getCell(`F${bRowNum}`), batch.total, AMT_FMT);
          });
        } else {
          // 6 cols: Batch | Date | Qty | Rate | Total | Remarks
          writeTableHeader(
            ws,
            ['Batch', 'Date', 'Qty', 'Rate', 'Total', 'Remarks'],
            [2, 3, 4]
          );
          item.batches.forEach((batch: any) => {
            const bRowNum = (ws.lastRow?.number ?? 0) + 1;
            ws.addRow([
              batch.batchNo ?? '',
              readableDate(batch.end_date, true),
              null,
              null,
              null,
              batch.remarks || '',
            ]);
            styleBorderRow(ws, bRowNum);
            setNum(ws.getCell(`C${bRowNum}`), batch.quantity, QTY_FMT);
            setNum(ws.getCell(`D${bRowNum}`), batch.rate, AMT_FMT);
            setNum(ws.getCell(`E${bRowNum}`), batch.total, AMT_FMT);
          });
        }
      }
    });

    // ── BY-PRODUCTS OFFSET SECTION (conditional) ─────────────────────────────
    // PDF cols: S/N | Product | Unit | Total Qty | Cost Reduction (5 cols)
    if ((reportData?.by_products || []).length > 0) {
      ws.addRow([]);

      writeSectionBanner(ws, 'BY-PRODUCTS OFFSET');
      writeTableHeader(
        ws,
        ['S/N', 'Product', 'Unit', 'Total Qty', 'Cost Reduction', ' '],
        [3, 4]
      );

      (reportData.by_products || []).forEach((item: any, idx: number) => {
        const rowNum = (ws.lastRow?.number ?? 0) + 1;
        ws.addRow([
          `${idx + 1}.`,
          item.product?.name ?? '',
          item.measurement_unit?.symbol ?? '',
          null,
          null,
          ' ',
        ]);
        styleBorderRow(ws, rowNum);
        ws.getCell(`A${rowNum}`).alignment = {
          horizontal: 'center',
          vertical: 'middle',
        };
        setNum(ws.getCell(`D${rowNum}`), item.total_quantity, QTY_FMT);
        setNum(ws.getCell(`E${rowNum}`), item.total_market_value, AMT_FMT);

        // Nested: batches producing this by-product
        // PDF nested cols: Batch | Date | Qty | Market Value / Unit | Total Market Value (5 cols)
        if ((item.batches || []).length > 0) {
          writeSubLabel(
            ws,
            'Production batches producing this by-product offset'
          );
          writeTableHeader(
            ws,
            [
              'Batch',
              'Date',
              'Qty',
              'Market Value / Unit',
              'Total Market Value',
              ' ',
            ],
            [2, 3, 4]
          );

          item.batches.forEach((batch: any) => {
            const bRowNum = (ws.lastRow?.number ?? 0) + 1;
            ws.addRow([
              batch.batchNo ?? '',
              readableDate(batch.end_date, true),
              null,
              null,
              null,
              ' ',
            ]);
            styleBorderRow(ws, bRowNum);
            setNum(ws.getCell(`C${bRowNum}`), batch.quantity, QTY_FMT);
            setNum(
              ws.getCell(`D${bRowNum}`),
              batch.market_value_per_unit,
              AMT_FMT
            );
            setNum(
              ws.getCell(`E${bRowNum}`),
              batch.total_market_value,
              AMT_FMT
            );
          });
        }
      });
    }

    // Return Excel buffer
    return await wb.xlsx.writeBuffer();
  } catch (e: any) {
    console.error('Error exporting Excel:', e);
    throw new Error(
      e?.message || 'Excel export failed during workbook generation'
    );
  }
}
