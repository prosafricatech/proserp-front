import dayjs from 'dayjs';
import { applyCellStyle, CELL_STYLES } from '../styles';
import { createWorkbook } from '../workBook';

const AMT_FMT = '#,###.00';

export async function exportProjectInventoryValuesReportExcel(
  exportedData: any
) {
  try {
    const { organization, project, currencyCode, rows, total } = exportedData;

    const orgName = organization?.name || 'Organization';
    const projectName =
      project?.name || project?.project_name || project?.title || 'Project';
    const asAt = dayjs().format('DD MMM YYYY, HH:mm');

    // ── Workbook & worksheet ───────────────────────────────────────────────────
    const wb = createWorkbook();
    const ws = wb.addWorksheet('Project Inventory Values');

    // Column widths — mirrors PDF's flex 2 | flex 1 ratio
    ws.columns = [
      { width: 45 }, // A — Category
      { width: 25 }, // B — Amount
    ];

    // ── ROW 1: Org name (A) + Report title (B) ─────────────────────────────
    ws.addRow([orgName, 'Project Inventory Value Summary']);
    ws.getCell('A1').font = { bold: true, size: 12 };
    ws.getCell('B1').font = { bold: true, size: 12 };
    ws.getCell('B1').alignment = { horizontal: 'right' };

    // ── ROW 2: Project name (B) ─────────────────────────────────────────────
    ws.addRow([' ', projectName]);
    ws.getCell('B2').font = { bold: true, size: 11 };
    ws.getCell('B2').alignment = { horizontal: 'right' };

    // ── ROW 3: Spacer ───────────────────────────────────────────────────────
    ws.addRow([]);

    // ── ROW 4: As At label ──────────────────────────────────────────────────
    ws.addRow(['As At', ' ']);
    ws.getCell('A4').font = { bold: true, size: 10 };

    // ── ROW 5: As At value ──────────────────────────────────────────────────
    ws.addRow([asAt, ' ']);
    ws.getCell('A5').font = { size: 10 };

    // ── ROW 6: Spacer ───────────────────────────────────────────────────────
    ws.addRow([]);

    // ── TABLE HEADER ROW ────────────────────────────────────────────────────
    // PDF: Category (flex 2) | Amount/currencyCode (flex 1, right-aligned)
    const headerRowNum = (ws.lastRow?.number ?? 0) + 1;
    ws.addRow(['Category', currencyCode || 'Amount']);
    applyCellStyle(ws.getCell(`A${headerRowNum}`), CELL_STYLES.tableHeader);
    applyCellStyle(ws.getCell(`B${headerRowNum}`), CELL_STYLES.tableHeader);
    ws.getCell(`B${headerRowNum}`).alignment = {
      horizontal: 'right',
      vertical: 'middle',
    };
    ws.getRow(headerRowNum).height = 22;

    // ── DATA ROWS ───────────────────────────────────────────────────────────
    if (rows.length) {
      rows.forEach((row: any) => {
        const rowNum = (ws.lastRow?.number ?? 0) + 1;
        ws.addRow([row.label, row.value ?? null]);
        applyCellStyle(ws.getCell(`A${rowNum}`), CELL_STYLES.dataRowText);
        applyCellStyle(ws.getCell(`B${rowNum}`), CELL_STYLES.dataRowText);
        if (row.value != null) {
          ws.getCell(`B${rowNum}`).numFmt = AMT_FMT;
          ws.getCell(`B${rowNum}`).alignment = {
            horizontal: 'right',
            vertical: 'middle',
          };
        }
      });
    } else {
      // Empty state — mirrors PDF's "No inventory values available" fallback
      const rowNum = (ws.lastRow?.number ?? 0) + 1;
      ws.addRow(['No inventory values available', ' ']);
      ws.mergeCells(`A${rowNum}:B${rowNum}`);
      applyCellStyle(ws.getCell(`A${rowNum}`), CELL_STYLES.dataRowText);
      ws.getCell(`A${rowNum}`).alignment = {
        horizontal: 'center',
        vertical: 'middle',
      };
    }

    // ── TOTAL ROW ───────────────────────────────────────────────────────────
    const totalRowNum = (ws.lastRow?.number ?? 0) + 1;
    ws.addRow(['Total', total ?? null]);
    applyCellStyle(ws.getCell(`A${totalRowNum}`), CELL_STYLES.tableHeader);
    applyCellStyle(ws.getCell(`B${totalRowNum}`), CELL_STYLES.tableHeader);
    if (total != null) {
      ws.getCell(`B${totalRowNum}`).numFmt = AMT_FMT;
      ws.getCell(`B${totalRowNum}`).alignment = {
        horizontal: 'right',
        vertical: 'middle',
      };
    }
    ws.getRow(totalRowNum).height = 20;

    // Return Excel buffer
    return await wb.xlsx.writeBuffer();
  } catch (error: any) {
    console.error('Error exporting Project Inventory Values Excel:', error);
    throw new Error(
      error?.message || 'Excel export failed during workbook generation'
    );
  }
}
