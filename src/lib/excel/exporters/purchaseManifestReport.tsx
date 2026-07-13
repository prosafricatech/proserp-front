import { applyCellStyle, CELL_STYLES, getAlternatingRowFill } from '../styles';
import { getExcelColumnName } from '../uitls';
import { createWorkbook } from '../workBook';

const NUM_FMT = '#,##0.00';
const DATE_FMT = 'mmm dd, yyyy';

function getUserName(user: any): string {
  if (user?.name) return user.name;
  if (user?.full_name) return user.full_name;
  const parts = [user?.first_name, user?.last_name].filter(Boolean);
  return parts.length ? parts.join(' ') : user?.email || '-';
}

function formatQty(qty: number, symbol: string): string {
  return `${(qty || 0).toLocaleString()} ${symbol || ''}`.trim();
}

export async function exportPurchaseManifestReportToExcel(exportedData: any) {
  try {
    const { reportData, organization, user } = exportedData;
    const { filters, items } = reportData;

    // Column layout (1-based)
    const COL_SN = 1;
    const COL_ORDER_NO = 2;
    const COL_ORDER_DATE = 3;
    const COL_DATE_REQUIRED = 4;
    const COL_PRODUCT_NAME = 5;
    const COL_PRODUCT_TYPE = 6;
    const COL_STATUS = 7;
    const COL_VENDOR = 8;
    const COL_QTY_ORDERED = 9;
    const COL_QTY_RECEIVED = 10;
    const COL_RATE = 11;
    const COL_TOTAL = 12;
    const TOTAL_COLS = COL_TOTAL;

    // Per-currency totals
    const currencyTotals: Record<string, { symbol: string; total: number }> =
      items.reduce((acc: any, item: any) => {
        const code = item.currency?.code || 'TZS';
        const symbol = code || item.currency?.symbol || 'TZS';
        const amount = (item.quantity_ordered || 0) * (item.rate || 0);
        if (!acc[code]) acc[code] = { symbol, total: 0 };
        acc[code].total += amount;
        return acc;
      }, {});

    // ---- Workbook ----
    const wb = createWorkbook();
    const ws = wb.addWorksheet('Purchase Manifest');

    // ---- Column widths ----
    ws.getColumn(getExcelColumnName(COL_SN)).width = 6;
    ws.getColumn(getExcelColumnName(COL_ORDER_NO)).width = 18;
    ws.getColumn(getExcelColumnName(COL_ORDER_DATE)).width = 16;
    ws.getColumn(getExcelColumnName(COL_DATE_REQUIRED)).width = 16;
    ws.getColumn(getExcelColumnName(COL_PRODUCT_NAME)).width = 28;
    ws.getColumn(getExcelColumnName(COL_PRODUCT_TYPE)).width = 16;
    ws.getColumn(getExcelColumnName(COL_STATUS)).width = 18;
    ws.getColumn(getExcelColumnName(COL_VENDOR)).width = 22;
    ws.getColumn(getExcelColumnName(COL_QTY_ORDERED)).width = 16;
    ws.getColumn(getExcelColumnName(COL_QTY_RECEIVED)).width = 16;
    ws.getColumn(getExcelColumnName(COL_RATE)).width = 16;
    ws.getColumn(getExcelColumnName(COL_TOTAL)).width = 20;

    const lastCol = getExcelColumnName(TOTAL_COLS);
    let currentRow = 1;

    // ---- Row 1: Organisation name ----
    ws.mergeCells(`A${currentRow}:${lastCol}${currentRow}`);
    const orgCell = ws.getCell(`A${currentRow}`);
    orgCell.value = organization?.name || '';
    orgCell.font = { bold: true, size: 14 };
    orgCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(currentRow).height = 26;
    currentRow++;

    // ---- Row 2: Report title ----
    ws.mergeCells(`A${currentRow}:${lastCol}${currentRow}`);
    const titleCell = ws.getCell(`A${currentRow}`);
    titleCell.value = 'PURCHASES MANIFEST REPORT';
    titleCell.font = { bold: true, size: 12 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(currentRow).height = 22;
    currentRow++;

    // ---- Filter info rows ----
    const smBorder = { style: 'thin' as const, color: { argb: 'FFE0E0E0' } };
    const filterBorder = {
      top: smBorder,
      bottom: smBorder,
      left: smBorder,
      right: smBorder,
    };

    const addFilterRow = (label: string, value: string) => {
      ws.mergeCells(`A${currentRow}:C${currentRow}`);
      ws.mergeCells(`D${currentRow}:${lastCol}${currentRow}`);
      const lCell = ws.getCell(`A${currentRow}`);
      const vCell = ws.getCell(`D${currentRow}`);
      lCell.value = label;
      lCell.font = { bold: true, size: 9, color: { argb: 'FF666666' } };
      lCell.alignment = { vertical: 'middle' };
      lCell.border = filterBorder;
      vCell.value = value;
      vCell.font = { size: 9 };
      vCell.alignment = { vertical: 'middle', wrapText: true };
      vCell.border = filterBorder;
      ws.getRow(currentRow).height = 16;
      currentRow++;
    };

    addFilterRow(
      'Reporting Period',
      `${filters.from ? new Date(filters.from).toDateString() : '-'} — ${filters.to ? new Date(filters.to).toDateString() : '-'}`
    );
    addFilterRow('Filter Status', filters.status || 'All');

    if (filters.cost_centers && filters.cost_centers.length > 0) {
      addFilterRow(
        'Cost Centers',
        filters.cost_centers.map((cc: any) => cc.name).join(', ')
      );
    }

    if (filters.suppliers && filters.suppliers.length > 0) {
      addFilterRow(
        'Suppliers / Vendors',
        filters.suppliers.map((s: any) => s.name).join(', ')
      );
    }

    addFilterRow('Requested By', getUserName(user));
    currentRow++; // blank spacer row

    // ---- Column headers ----
    const setHdr = (col: number, label: string, alignRight = false) => {
      const cell = ws.getCell(`${getExcelColumnName(col)}${currentRow}`);
      cell.value = label;
      applyCellStyle(cell, CELL_STYLES.tableHeader);
      cell.alignment = {
        horizontal: alignRight ? 'right' : 'center',
        vertical: 'middle',
      };
    };

    setHdr(COL_SN, 'S/N');
    setHdr(COL_ORDER_NO, 'Order No.');
    setHdr(COL_ORDER_DATE, 'Order Date');
    setHdr(COL_DATE_REQUIRED, 'Date Required');
    setHdr(COL_PRODUCT_NAME, 'Product Name');
    setHdr(COL_PRODUCT_TYPE, 'Product Type');
    setHdr(COL_STATUS, 'Status');
    setHdr(COL_VENDOR, 'Supplier / Vendor');
    setHdr(COL_QTY_ORDERED, 'Qty Ordered', true);
    setHdr(COL_QTY_RECEIVED, 'Qty Received', true);
    setHdr(COL_RATE, 'Rate', true);
    setHdr(COL_TOTAL, 'Total Amount', true);
    ws.getRow(currentRow).height = 18;
    currentRow++;

    // ---- Data rows ----
    items.forEach((item: any, index: number) => {
      const ROW = currentRow;
      const fill = getAlternatingRowFill(index);
      const itemAmount = (item.quantity_ordered || 0) * (item.rate || 0);
      const unitSymbol = item.measurement_unit?.symbol || '';

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
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      };

      const setDate = (col: number, value: string | null) => {
        const cell = ws.getCell(`${getExcelColumnName(col)}${ROW}`);
        if (value) {
          cell.value = new Date(value);
          cell.numFmt = DATE_FMT;
        } else {
          cell.value = '-';
        }
        applyCellStyle(cell, { ...CELL_STYLES.dataRowText, fill });
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      };

      setTxt(COL_SN, String(index + 1));
      setTxt(COL_ORDER_NO, item.orderNo || '-');
      setDate(COL_ORDER_DATE, item.order_date);
      setDate(COL_DATE_REQUIRED, item.date_required);
      setTxt(COL_PRODUCT_NAME, item.product?.name || '-');
      setTxt(COL_PRODUCT_TYPE, item.product?.type || '-');
      setTxt(COL_STATUS, item.status || '-');
      setTxt(COL_VENDOR, item.vendor?.name || '-');
      setTxt(COL_QTY_ORDERED, formatQty(item.quantity_ordered, unitSymbol));
      setTxt(COL_QTY_RECEIVED, formatQty(item.quantity_received, unitSymbol));
      setNum(COL_RATE, item.rate || 0);
      setNum(COL_TOTAL, itemAmount);

      // Override total cell to include currency code prefix
      const totalCell = ws.getCell(`${getExcelColumnName(COL_TOTAL)}${ROW}`);
      totalCell.value = itemAmount;
      totalCell.numFmt = `"${item.currency?.code || item.currency?.symbol || ''} "#,##0.00`;
      applyCellStyle(totalCell, { ...CELL_STYLES.dataRowNumeric, fill });
      totalCell.alignment = { horizontal: 'right', vertical: 'middle' };

      ws.getRow(ROW).height = 16;
      currentRow++;
    });

    currentRow++; // blank spacer before totals

    // ---- Currency totals ----
    const totalsLabelSpan = TOTAL_COLS - 1;

    Object.entries(currencyTotals).forEach(([code, { symbol, total }]) => {
      ws.mergeCells(
        `${getExcelColumnName(COL_SN)}${currentRow}:${getExcelColumnName(totalsLabelSpan)}${currentRow}`
      );
      const lCell = ws.getCell(`${getExcelColumnName(COL_SN)}${currentRow}`);
      lCell.value = `Manifest Grand Total (${code})`;
      applyCellStyle(lCell, CELL_STYLES.totalRowText);
      lCell.alignment = { horizontal: 'right', vertical: 'middle' };

      const tCell = ws.getCell(`${getExcelColumnName(COL_TOTAL)}${currentRow}`);
      tCell.value = total;
      tCell.numFmt = `"${symbol} "#,##0.00`;
      applyCellStyle(tCell, CELL_STYLES.totalRowNumeric);
      tCell.alignment = { horizontal: 'right', vertical: 'middle' };

      ws.getRow(currentRow).height = 20;
      currentRow++;
    });

    return await wb.xlsx.writeBuffer();
  } catch (e: any) {
    console.error('Error exporting purchase manifest to Excel:', e);
    throw new Error(
      e?.message || 'Excel export failed during workbook generation'
    );
  }
}
