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

    // ---- Column layout (1-based) ----
    const COL_SN = 1;
    const COL_ORDER_NO = 2;
    const COL_REFERENCE = 3;
    const COL_ORDER_DATE = 4;
    const COL_DATE_REQUIRED = 5;
    const COL_SKU = 6;
    const COL_BRAND = 7;
    const COL_ITEM_NAME = 8;
    const COL_MODEL = 9;
    const COL_SPECIFICATIONS = 10;
    const COL_DESCRIPTION = 11;
    const COL_STATUS = 12;
    const COL_VENDOR = 13;
    const COL_QTY_ORDERED = 14;
    const COL_QTY_RECEIVED = 15;
    const COL_QTY_PENDING = 16;
    const COL_RATE = 17;
    const COL_ORDERED_AMOUNT = 18;
    const COL_RECEIVED_AMOUNT = 19;
    const COL_PENDING_AMOUNT = 20;
    const TOTAL_COLS = COL_PENDING_AMOUNT;

    // ---- Per-currency summary totals ----
    const currencySummary: Record<
      string,
      { symbol: string; ordered: number; received: number; pending: number }
    > = items.reduce((acc: any, item: any) => {
      const code = item.currency?.code || 'TZS';
      const symbol = item.currency?.symbol || code;
      const orderedAmt = (item.quantity_ordered || 0) * (item.rate || 0);
      const receivedAmt = (item.quantity_received || 0) * (item.rate || 0);
      const pendingAmt = orderedAmt - receivedAmt;
      if (!acc[code])
        acc[code] = { symbol, ordered: 0, received: 0, pending: 0 };
      acc[code].ordered += orderedAmt;
      acc[code].received += receivedAmt;
      acc[code].pending += pendingAmt;
      return acc;
    }, {});

    // ---- Workbook ----
    const wb = createWorkbook();
    const ws = wb.addWorksheet('Purchase Manifest');

    // ---- Column widths ----
    ws.getColumn(getExcelColumnName(COL_SN)).width = 6;
    ws.getColumn(getExcelColumnName(COL_ORDER_NO)).width = 16;
    ws.getColumn(getExcelColumnName(COL_REFERENCE)).width = 18;
    ws.getColumn(getExcelColumnName(COL_ORDER_DATE)).width = 16;
    ws.getColumn(getExcelColumnName(COL_DATE_REQUIRED)).width = 16;
    ws.getColumn(getExcelColumnName(COL_SKU)).width = 14;
    ws.getColumn(getExcelColumnName(COL_BRAND)).width = 14;
    ws.getColumn(getExcelColumnName(COL_ITEM_NAME)).width = 26;
    ws.getColumn(getExcelColumnName(COL_MODEL)).width = 14;
    ws.getColumn(getExcelColumnName(COL_SPECIFICATIONS)).width = 16;
    ws.getColumn(getExcelColumnName(COL_DESCRIPTION)).width = 20;
    ws.getColumn(getExcelColumnName(COL_STATUS)).width = 18;
    ws.getColumn(getExcelColumnName(COL_VENDOR)).width = 26;
    ws.getColumn(getExcelColumnName(COL_QTY_ORDERED)).width = 14;
    ws.getColumn(getExcelColumnName(COL_QTY_RECEIVED)).width = 14;
    ws.getColumn(getExcelColumnName(COL_QTY_PENDING)).width = 14;
    ws.getColumn(getExcelColumnName(COL_RATE)).width = 16;
    ws.getColumn(getExcelColumnName(COL_ORDERED_AMOUNT)).width = 20;
    ws.getColumn(getExcelColumnName(COL_RECEIVED_AMOUNT)).width = 20;
    ws.getColumn(getExcelColumnName(COL_PENDING_AMOUNT)).width = 20;

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
    currentRow++; // blank spacer

    // ---- Group header row: product sub-group label ----
    // Merge a "PRODUCT DETAILS" label spanning all product columns
    ws.mergeCells(
      `${getExcelColumnName(COL_SKU)}${currentRow}:${getExcelColumnName(COL_DESCRIPTION)}${currentRow}`
    );
    const productGroupCell = ws.getCell(
      `${getExcelColumnName(COL_SKU)}${currentRow}`
    );
    productGroupCell.value = 'PRODUCT DETAILS';
    applyCellStyle(productGroupCell, CELL_STYLES.tableHeader);
    productGroupCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Merge a "AMOUNTS" label spanning the three amount columns
    ws.mergeCells(
      `${getExcelColumnName(COL_ORDERED_AMOUNT)}${currentRow}:${getExcelColumnName(COL_PENDING_AMOUNT)}${currentRow}`
    );
    const amountsGroupCell = ws.getCell(
      `${getExcelColumnName(COL_ORDERED_AMOUNT)}${currentRow}`
    );
    amountsGroupCell.value = 'AMOUNTS';
    applyCellStyle(amountsGroupCell, CELL_STYLES.tableHeader);
    amountsGroupCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Fill remaining group-header cells with same header style (blank)
    [
      COL_SN,
      COL_ORDER_NO,
      COL_REFERENCE,
      COL_ORDER_DATE,
      COL_DATE_REQUIRED,
      COL_STATUS,
      COL_VENDOR,
      COL_QTY_ORDERED,
      COL_QTY_RECEIVED,
      COL_QTY_PENDING,
      COL_RATE,
    ].forEach((col) => {
      const cell = ws.getCell(`${getExcelColumnName(col)}${currentRow}`);
      applyCellStyle(cell, CELL_STYLES.tableHeader);
    });
    ws.getRow(currentRow).height = 16;
    currentRow++;

    // ---- Column headers ----
    const setHdr = (col: number, label: string, alignRight = false) => {
      const cell = ws.getCell(`${getExcelColumnName(col)}${currentRow}`);
      cell.value = label;
      applyCellStyle(cell, CELL_STYLES.tableHeader);
      cell.alignment = {
        horizontal: alignRight ? 'right' : 'center',
        vertical: 'middle',
        wrapText: true,
      };
    };

    setHdr(COL_SN, 'S/N');
    setHdr(COL_ORDER_NO, 'Order No.');
    setHdr(COL_REFERENCE, 'Reference');
    setHdr(COL_ORDER_DATE, 'Order Date');
    setHdr(COL_DATE_REQUIRED, 'Date Required');
    setHdr(COL_SKU, 'SKU');
    setHdr(COL_BRAND, 'Brand');
    setHdr(COL_ITEM_NAME, 'Item Name');
    setHdr(COL_MODEL, 'Model');
    setHdr(COL_SPECIFICATIONS, 'Specifications');
    setHdr(COL_DESCRIPTION, 'Description');
    setHdr(COL_STATUS, 'Status');
    setHdr(COL_VENDOR, 'Supplier / Vendor');
    setHdr(COL_QTY_ORDERED, 'Qty Ordered', true);
    setHdr(COL_QTY_RECEIVED, 'Qty Received', true);
    setHdr(COL_QTY_PENDING, 'Qty Pending', true);
    setHdr(COL_RATE, 'Rate', true);
    setHdr(COL_ORDERED_AMOUNT, 'Ordered Amount', true);
    setHdr(COL_RECEIVED_AMOUNT, 'Received Amount', true);
    setHdr(COL_PENDING_AMOUNT, 'Pending Amount', true);
    ws.getRow(currentRow).height = 20;
    currentRow++;

    // ---- Data rows ----
    items.forEach((item: any, index: number) => {
      const ROW = currentRow;
      const fill = getAlternatingRowFill(index);
      const unitSymbol = item.measurement_unit?.symbol || '';
      const currencyFmt = `"${item.currency?.symbol || item.currency?.code || ''} "#,##0.00`;
      const orderedAmt = (item.quantity_ordered || 0) * (item.rate || 0);
      const receivedAmt = (item.quantity_received || 0) * (item.rate || 0);
      const pendingAmt = orderedAmt - receivedAmt;

      const setTxt = (col: number, value: string) => {
        const cell = ws.getCell(`${getExcelColumnName(col)}${ROW}`);
        cell.value = value;
        applyCellStyle(cell, { ...CELL_STYLES.dataRowText, fill });
      };

      const setNum = (col: number, value: number, fmt = NUM_FMT) => {
        const cell = ws.getCell(`${getExcelColumnName(col)}${ROW}`);
        cell.value = value;
        cell.numFmt = fmt;
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
      setTxt(COL_REFERENCE, item.reference || '-');
      setDate(COL_ORDER_DATE, item.order_date);
      setDate(COL_DATE_REQUIRED, item.date_required);
      setTxt(COL_SKU, item.product?.sku || '-');
      setTxt(COL_BRAND, item.product?.brand || '-');
      setTxt(
        COL_ITEM_NAME,
        item.product?.item_name || item.product?.name || '-'
      );
      setTxt(COL_MODEL, item.product?.model || '-');
      setTxt(COL_SPECIFICATIONS, item.product?.specifications || '-');
      setTxt(COL_DESCRIPTION, item.product?.description || '-');
      setTxt(COL_STATUS, item.status || '-');
      setTxt(COL_VENDOR, item.vendor?.name || '-');
      setTxt(COL_QTY_ORDERED, formatQty(item.quantity_ordered, unitSymbol));
      setTxt(COL_QTY_RECEIVED, formatQty(item.quantity_received, unitSymbol));
      setTxt(
        COL_QTY_PENDING,
        formatQty(
          (item.quantity_ordered || 0) - (item.quantity_received || 0),
          unitSymbol
        )
      );
      setNum(COL_RATE, item.rate || 0);
      setNum(COL_ORDERED_AMOUNT, orderedAmt, currencyFmt);
      setNum(COL_RECEIVED_AMOUNT, receivedAmt, currencyFmt);
      setNum(COL_PENDING_AMOUNT, pendingAmt, currencyFmt);

      ws.getRow(ROW).height = 16;
      currentRow++;
    });

    currentRow++; // blank spacer before totals

    // ---- Currency totals (3 rows per currency: ordered, received, pending) ----
    const labelSpanEnd = getExcelColumnName(COL_PENDING_AMOUNT - 14);

    Object.entries(currencySummary).forEach(
      ([code, { symbol, ordered, received, pending }]) => {
        const currencyFmt = `"${symbol} "#,##0.00`;

        const addTotalRow = (label: string, value: number) => {
          ws.mergeCells(
            `${getExcelColumnName(COL_SN)}${currentRow}:${labelSpanEnd}${currentRow}`
          );
          const lCell = ws.getCell(
            `${getExcelColumnName(COL_SN)}${currentRow}`
          );
          lCell.value = `${label} (${code})`;
          applyCellStyle(lCell, CELL_STYLES.totalRowText);
          lCell.alignment = { horizontal: 'right', vertical: 'middle' };

          ws.mergeCells(
            `${getExcelColumnName(COL_PENDING_AMOUNT - 13)}${currentRow}:${getExcelColumnName(COL_PENDING_AMOUNT - 12)}${currentRow}`
          );
          const tCell = ws.getCell(
            `${getExcelColumnName(COL_PENDING_AMOUNT - 13)}${currentRow}`
          );
          tCell.value = value;
          tCell.numFmt = currencyFmt;
          applyCellStyle(tCell, CELL_STYLES.totalRowNumeric);
          tCell.alignment = { horizontal: 'right', vertical: 'middle' };

          ws.getRow(currentRow).height = 20;
          currentRow++;
        };

        addTotalRow('Total Ordered Amount', ordered);
        addTotalRow('Total Received Amount', received);
        addTotalRow('Total Pending Amount', pending);
        currentRow++; // gap between currency groups
      }
    );

    return await wb.xlsx.writeBuffer();
  } catch (e: any) {
    console.error('Error exporting purchase manifest to Excel:', e);
    throw new Error(
      e?.message || 'Excel export failed during workbook generation'
    );
  }
}
