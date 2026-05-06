import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { applyCellStyle, CELL_STYLES, COLORS, FILLS } from '../styles';
import { createWorkbook } from '../workBook';

// ─── Number formats ────────────────────────────────────────────────────────────
const AMT_FMT = '#,###.00';
const QTY_FMT = '#,###.00';

// ─── Column layout (A–F, 6 cols used throughout) ──────────────────────────────
// Mirrors the PDF's uniform 6-column grid (widths: 20%, 16%, 16%, 16%, 16%, 16%)
const LAST_COL_CODE = 70; // 'F'
const COL_COUNT = 6;

// ─── Local helpers ─────────────────────────────────────────────────────────────

/** Apply tableHeader style across all 6 columns of a given row number */
function styleFullHeaderRow(ws: any, rowNum: number) {
  for (let c = 65; c <= LAST_COL_CODE; c++) {
    applyCellStyle(
      ws.getCell(`${String.fromCharCode(c)}${rowNum}`),
      CELL_STYLES.tableHeader
    );
  }
}

/** Apply allThinBlack border to all 6 columns of a given row */
function borderFullRow(ws: any, rowNum: number) {
  for (let c = 65; c <= LAST_COL_CODE; c++) {
    applyCellStyle(
      ws.getCell(`${String.fromCharCode(c)}${rowNum}`),
      CELL_STYLES.dataRowText
    );
  }
}

/** Write a numeric cell: style first, then value + format + right-align after */
function setNumCell(
  cell: any,
  value: any,
  fmt: string,
  style = CELL_STYLES.dataRowText
) {
  applyCellStyle(cell, style);
  cell.value = value ?? null;
  if (value != null) {
    cell.numFmt = fmt;
    cell.alignment = { horizontal: 'right', vertical: 'middle' };
  }
}

/** Write a full-width section banner row (A:F merged, tableHeader style) */
function writeSectionBanner(ws: any, label: string) {
  const rowNum = (ws.lastRow?.number ?? 0) + 1;
  ws.addRow([label, ' ', ' ', ' ', ' ', ' ']);
  ws.mergeCells(`A${rowNum}:F${rowNum}`);
  styleFullHeaderRow(ws, rowNum);
  ws.getCell(`A${rowNum}`).alignment = {
    horizontal: 'left',
    vertical: 'middle',
  };
  ws.getRow(rowNum).height = 18;
  return rowNum;
}

/** Write a sub-section label row (A:F merged, gray fill, smaller bold) */
function writeSubSectionBanner(ws: any, label: string) {
  const rowNum = (ws.lastRow?.number ?? 0) + 1;
  ws.addRow([label, ' ', ' ', ' ', ' ', ' ']);
  ws.mergeCells(`A${rowNum}:F${rowNum}`);
  for (let c = 65; c <= LAST_COL_CODE; c++) {
    const cell = ws.getCell(`${String.fromCharCode(c)}${rowNum}`);
    cell.fill = FILLS.alternateRow;
    cell.border = {
      top: { style: 'thin', color: { argb: COLORS.BLACK } },
      bottom: { style: 'thin', color: { argb: COLORS.BLACK } },
      left: { style: 'thin', color: { argb: COLORS.BLACK } },
      right: { style: 'thin', color: { argb: COLORS.BLACK } },
    };
  }
  ws.getCell(`A${rowNum}`).font = { bold: true, size: 9, italic: true };
  ws.getCell(`A${rowNum}`).alignment = {
    horizontal: 'left',
    vertical: 'middle',
  };
  ws.getRow(rowNum).height = 16;
}

// ─── Main exporter ─────────────────────────────────────────────────────────────

export async function ExportProductionOutputReportToExcel(exportedData: any) {
  try {
    const { reportData, authOrganization, user } = exportedData;

    const orgName = authOrganization?.organization?.name ?? '';
    const mainColor = authOrganization?.mainColor || '#1E3A5F';
    const userName = user?.name || '';

    const { period, summary, batches } = reportData;

    const periodLabel = `${readableDate(period?.from, true)} – ${readableDate(period?.to, true)}`;
    const printedOn = readableDate(new Date().toISOString(), true);

    // ── Workbook & worksheet ─────────────────────────────────────────────────
    const wb = createWorkbook();
    const ws = wb.addWorksheet('Production Output Report');

    // Column widths — mirrors PDF's 20% | 16% | 16% | 16% | 16% | 16%
    ws.columns = [
      { width: 32 }, // A — Product / Batch# / label
      { width: 27 }, // B — Unit / Start Date
      { width: 22 }, // C — Qty / Work Center
      { width: 22 }, // D — Avg Unit Cost / Cost Center
      { width: 22 }, // E — Total Value / Output Value
      { width: 22 }, // F — Batches / By-Product Value
    ];

    // ── ROW 1: Org name (A) + Report title (F) ───────────────────────────────
    ws.addRow([orgName, ' ', ' ', ' ', ' ', 'Production Output Report']);
    ws.getCell('A1').font = { bold: true, size: 12 };
    ws.getCell('F1').font = { bold: true, size: 12 };

    // ── ROW 2: Period (F) ────────────────────────────────────────────────────
    ws.addRow([' ', ' ', ' ', ' ', ' ', `Period: ${periodLabel}`]);
    ws.getCell('F2').font = { bold: true, size: 10 };

    // ── ROW 3: Spacer ────────────────────────────────────────────────────────
    ws.addRow([]);

    // ── ROW 4: Meta strip labels — Report Period | Printed By | Printed On ───
    // PDF: 3 flex:1 blocks. Mapped to A (label), B+C (gap), D (label), E (gap), F (label)
    ws.addRow(['Report Period', ' ', ' ', 'Printed By', ' ', 'Printed On']);
    styleFullHeaderRow(ws, 4);
    ws.getRow(4).height = 20;

    // ── ROW 5: Meta strip values ─────────────────────────────────────────────
    ws.addRow([periodLabel, ' ', ' ', userName, ' ', printedOn]);
    for (let c = 65; c <= LAST_COL_CODE; c++) {
      ws.getCell(`${String.fromCharCode(c)}5`).border = {
        top: { style: 'thin', color: { argb: COLORS.BLACK } },
        bottom: { style: 'thin', color: { argb: COLORS.BLACK } },
        left: { style: 'thin', color: { argb: COLORS.BLACK } },
        right: { style: 'thin', color: { argb: COLORS.BLACK } },
      };
    }
    ws.getRow(5).height = 18;

    // ── ROW 6: Spacer ────────────────────────────────────────────────────────
    ws.addRow([]);

    // ── KPI ROW — 3 cards: Total Batches | Total Output Value | By-Product Value
    // Each card = label row + value row, using 2 cols per card (A:B | C:D | E:F)
    const kpiLabelRow = (ws.lastRow?.number ?? 0) + 1;
    ws.addRow([
      'Total Batches',
      ' ',
      'Total Output Value',
      ' ',
      'By-Product Value',
      ' ',
    ]);
    ws.mergeCells(`A${kpiLabelRow}:B${kpiLabelRow}`);
    ws.mergeCells(`C${kpiLabelRow}:D${kpiLabelRow}`);
    ws.mergeCells(`E${kpiLabelRow}:F${kpiLabelRow}`);
    ['A', 'C', 'E'].forEach((col) => {
      ws.getCell(`${col}${kpiLabelRow}`).font = { bold: true, size: 9 };
      ws.getCell(`${col}${kpiLabelRow}`).alignment = {
        horizontal: 'left',
        vertical: 'middle',
      };
      ws.getCell(`${col}${kpiLabelRow}`).border = {
        top: { style: 'thin', color: { argb: COLORS.BLACK } },
        left: { style: 'thin', color: { argb: COLORS.BLACK } },
        right: { style: 'thin', color: { argb: COLORS.BLACK } },
      };
    });
    ws.getRow(kpiLabelRow).height = 16;

    const kpiValueRow = (ws.lastRow?.number ?? 0) + 1;
    ws.addRow([
      summary?.total_batches ?? 0,
      ' ',
      summary?.total_output_value ?? 0,
      ' ',
      summary?.total_by_product_value ?? 0,
      ' ',
    ]);
    ws.mergeCells(`A${kpiValueRow}:B${kpiValueRow}`);
    ws.mergeCells(`C${kpiValueRow}:D${kpiValueRow}`);
    ws.mergeCells(`E${kpiValueRow}:F${kpiValueRow}`);

    ws.getCell(`A${kpiValueRow}`).font = { bold: true, size: 14 };
    ws.getCell(`A${kpiValueRow}`).alignment = {
      horizontal: 'left',
      vertical: 'middle',
    };

    ws.getCell(`C${kpiValueRow}`).numFmt = AMT_FMT;
    ws.getCell(`C${kpiValueRow}`).font = { bold: true, size: 14 };
    ws.getCell(`C${kpiValueRow}`).alignment = {
      horizontal: 'left',
      vertical: 'middle',
    };

    ws.getCell(`E${kpiValueRow}`).numFmt = AMT_FMT;
    ws.getCell(`E${kpiValueRow}`).font = { bold: true, size: 14 };
    ws.getCell(`E${kpiValueRow}`).alignment = {
      horizontal: 'left',
      vertical: 'middle',
    };

    ['A', 'C', 'E'].forEach((col) => {
      ws.getCell(`${col}${kpiValueRow}`).border = {
        bottom: { style: 'thin', color: { argb: COLORS.BLACK } },
        left: { style: 'thin', color: { argb: COLORS.BLACK } },
        right: { style: 'thin', color: { argb: COLORS.BLACK } },
      };
    });
    ws.getRow(kpiValueRow).height = 28;

    // ── ROW: Spacer ──────────────────────────────────────────────────────────
    ws.addRow([]);

    // ── PRODUCT SUMMARY SECTION ──────────────────────────────────────────────
    writeSectionBanner(ws, 'PRODUCT SUMMARY');

    // Product Summary table header
    // Cols: Finished Product | Unit | Qty Produced | Avg Unit Cost | Total Value | Batches
    const pSumHeaderRow = (ws.lastRow?.number ?? 0) + 1;
    ws.addRow([
      'Finished Product',
      'Unit',
      'Qty Produced',
      'Avg Unit Cost',
      'Total Value',
      'Batches',
    ]);
    styleFullHeaderRow(ws, pSumHeaderRow);
    ws.getRow(pSumHeaderRow).height = 20;
    // Right-align numeric headers
    ['C', 'D', 'E', 'F'].forEach((col) => {
      ws.getCell(`${col}${pSumHeaderRow}`).alignment = {
        horizontal: 'left',
        vertical: 'middle',
      };
    });

    // Product Summary data rows
    (summary?.products || []).forEach((item: any) => {
      const rowNum = (ws.lastRow?.number ?? 0) + 1;
      ws.addRow([
        item.product?.name ?? '',
        item.measurement_unit?.symbol || item.measurement_unit?.name || '',
        item.total_quantity ?? null,
        item.average_unit_cost ?? null,
        item.total_value ?? null,
        item.batch_count ?? null,
      ]);
      borderFullRow(ws, rowNum);
      // Right-align + format numeric cols — after borderFullRow (which sets leftMiddle)
      setNumCell(ws.getCell(`C${rowNum}`), item.total_quantity, QTY_FMT);
      setNumCell(ws.getCell(`D${rowNum}`), item.average_unit_cost, QTY_FMT);
      setNumCell(ws.getCell(`E${rowNum}`), item.total_value, AMT_FMT);
      setNumCell(ws.getCell(`F${rowNum}`), item.batch_count, '#,###');
    });

    // ── ROW: Spacer ──────────────────────────────────────────────────────────
    ws.addRow([]);

    // ── BATCH DETAIL SECTION ─────────────────────────────────────────────────
    writeSectionBanner(ws, 'BATCH DETAIL');

    // Batch header column labels (written once above each batch's data row)
    // PDF cols: Batch # | Start Date | Work Center | Cost Center | Output Value | By-Product Val
    const BATCH_HEADER_LABELS = [
      'Batch #',
      'Start Date',
      'Work Center',
      'Cost Center',
      'Output Value',
      'By-Product Val',
    ];

    // Output sub-table cols: Product | Unit | Qty | Unit Cost | Total Value | Value %
    const OUTPUT_HEADER_LABELS = [
      'Product',
      'Unit',
      'Qty',
      'Unit Cost',
      'Total Value',
      'Value %',
    ];

    // By-product sub-table cols: Product | Unit | Qty | Market Value / Unit | Total Market Value
    // 5 cols — last col left blank to fill the 6-col grid
    const BY_PRODUCT_HEADER_LABELS = [
      'Product',
      'Unit',
      'Qty',
      'Market Value / Unit',
      'Total Market Value',
      '',
    ];

    (batches || []).forEach((batch: any, batchIndex: number) => {
      // ── Batch column-label header row ──────────────────────────────────────
      const batchColLabelRow = (ws.lastRow?.number ?? 0) + 1;
      ws.addRow(BATCH_HEADER_LABELS);
      styleFullHeaderRow(ws, batchColLabelRow);
      ws.getRow(batchColLabelRow).height = 20;
      ['E', 'F'].forEach((col) => {
        ws.getCell(`${col}${batchColLabelRow}`).alignment = {
          horizontal: 'right',
          vertical: 'middle',
        };
      });

      // ── Batch data row ─────────────────────────────────────────────────────
      const batchDataRow = (ws.lastRow?.number ?? 0) + 1;
      const batchDateRange = `${readableDate(batch.start_date, true)} – ${readableDate(batch.end_date, true)}`;
      ws.addRow([
        batch.batchNo ?? '',
        batchDateRange,
        batch.work_center?.name ?? '',
        batch.work_center?.cost_center?.name ?? '',
        batch.total_output_value ?? null,
        batch.total_by_product_value ?? null,
      ]);
      borderFullRow(ws, batchDataRow);
      setNumCell(
        ws.getCell(`E${batchDataRow}`),
        batch.total_output_value,
        AMT_FMT
      );
      setNumCell(
        ws.getCell(`F${batchDataRow}`),
        batch.total_by_product_value,
        AMT_FMT
      );
      ws.getRow(batchDataRow).height = 16;

      // ── Outputs sub-section ────────────────────────────────────────────────
      writeSubSectionBanner(ws, 'OUTPUTS');

      const outputHeaderRow = (ws.lastRow?.number ?? 0) + 1;
      ws.addRow(OUTPUT_HEADER_LABELS);
      styleFullHeaderRow(ws, outputHeaderRow);
      ws.getRow(outputHeaderRow).height = 18;
      ['C', 'D', 'E', 'F'].forEach((col) => {
        ws.getCell(`${col}${outputHeaderRow}`).alignment = {
          horizontal: 'left',
          vertical: 'middle',
        };
      });

      (batch.outputs || []).forEach((output: any) => {
        const rowNum = (ws.lastRow?.number ?? 0) + 1;
        ws.addRow([
          output.product?.name ?? '',
          output.measurement_unit?.symbol ?? '',
          null,
          null,
          null,
          null,
        ]);
        borderFullRow(ws, rowNum);
        setNumCell(ws.getCell(`C${rowNum}`), output.quantity, QTY_FMT);
        setNumCell(ws.getCell(`D${rowNum}`), output.unit_cost, QTY_FMT);
        setNumCell(ws.getCell(`E${rowNum}`), output.total_value, AMT_FMT);
        // value_percentage — shown as number (e.g. 83.333%) with % suffix in PDF
        if (output.value_percentage != null) {
          ws.getCell(`F${rowNum}`).value = output.value_percentage / 100;
          ws.getCell(`F${rowNum}`).numFmt = '0.000%';
          ws.getCell(`F${rowNum}`).alignment = {
            horizontal: 'right',
            vertical: 'middle',
          };
        }
      });

      // ── By-Products sub-section (conditional) ─────────────────────────────
      if ((batch.by_products || []).length > 0) {
        writeSubSectionBanner(ws, 'BY-PRODUCTS');

        const byProdHeaderRow = (ws.lastRow?.number ?? 0) + 1;
        ws.addRow(BY_PRODUCT_HEADER_LABELS);
        styleFullHeaderRow(ws, byProdHeaderRow);
        ws.getRow(byProdHeaderRow).height = 18;
        ['C', 'D', 'E'].forEach((col) => {
          ws.getCell(`${col}${byProdHeaderRow}`).alignment = {
            horizontal: 'right',
            vertical: 'middle',
          };
        });

        (batch.by_products || []).forEach((byProduct: any) => {
          const rowNum = (ws.lastRow?.number ?? 0) + 1;
          ws.addRow([
            byProduct.product?.name ?? '',
            byProduct.measurement_unit?.symbol ?? '',
            null,
            null,
            null,
            '',
          ]);
          borderFullRow(ws, rowNum);
          setNumCell(ws.getCell(`C${rowNum}`), byProduct.quantity, QTY_FMT);
          setNumCell(
            ws.getCell(`D${rowNum}`),
            byProduct.market_value_per_unit,
            AMT_FMT
          );
          setNumCell(
            ws.getCell(`E${rowNum}`),
            byProduct.total_market_value,
            AMT_FMT
          );
        });
      }

      // Small spacer between batches
      ws.addRow([]);
    });

    // Return Excel buffer
    return await wb.xlsx.writeBuffer();
  } catch (e: any) {
    console.error('Error exporting Excel:', e);
    throw new Error(
      e?.message || 'Excel export failed during workbook generation'
    );
  }
}
