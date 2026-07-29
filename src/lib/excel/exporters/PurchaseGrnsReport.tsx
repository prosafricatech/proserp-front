import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import {
  applyCellStyle,
  CELL_STYLES,
  COLORS,
  getAlternatingRowFill,
} from '../styles';
import { getExcelColumnName } from '../uitls';
import { createWorkbook } from '../workBook';

const QTY_FMT = '#,###.000';

export async function exportPurchaseGrnsReportToExcel(exportedData: any) {
  try {
    const { purchaseGrnsReport, organization, user } = exportedData;

    // Group received_items by grnNo — same logic as PDF
    const groupedGrnsItems = purchaseGrnsReport.purchase_order_items.reduce(
      (acc: any, item: any) => {
        item.received_items.forEach((receivedItem: any) => {
          const key = receivedItem.grnNo;
          if (!acc[key]) {
            acc[key] = {
              grnNo: key,
              date_received: receivedItem.date_received,
              products: [],
            };
          }
          acc[key].products.push({
            ...receivedItem,
            productId: item.id,
            measurement_unit: item.measurement_unit,
          });
        });
        return acc;
      },
      {}
    );

    const receivedItems: any[] = Object.values(groupedGrnsItems);

    // Column layout (1-based)
    // S/N | Products | Unit | Ordered | [GRN 1..n] | Pending
    const COL_SN = 1;
    const COL_PRODUCT = 2;
    const COL_UNIT = 3;
    const COL_ORDERED = 4;
    const COL_PENDING = 5 + receivedItems.length;
    const TOTAL_COLS = COL_PENDING;
    const lastCol = getExcelColumnName(TOTAL_COLS);

    const wb = createWorkbook();
    const ws = wb.addWorksheet('GRNs Report');

    ws.getColumn(getExcelColumnName(COL_SN)).width = 8;
    ws.getColumn(getExcelColumnName(COL_PRODUCT)).width = 35;
    ws.getColumn(getExcelColumnName(COL_UNIT)).width = 12;
    ws.getColumn(getExcelColumnName(COL_ORDERED)).width = 18;
    for (let i = 0; i < receivedItems.length; i++) {
      ws.getColumn(getExcelColumnName(5 + i)).width = 18;
    }
    ws.getColumn(getExcelColumnName(COL_PENDING)).width = 18;

    // Row 1: Org name (A) + Report title (last col)
    const r1 = Array(TOTAL_COLS).fill(' ');
    r1[0] = organization?.name || '';
    r1[TOTAL_COLS - 1] = 'PURCHASE ORDER GRNS REPORT';
    ws.addRow(r1);
    ws.getCell('A1').font = { bold: true, size: 12 };
    ws.getCell(`${lastCol}1`).font = { bold: true, size: 12 };
    ws.getCell(`${lastCol}1`).alignment = { horizontal: 'right' };

    // Row 2: Order No (last col)
    const r2 = Array(TOTAL_COLS).fill(' ');
    r2[TOTAL_COLS - 1] = purchaseGrnsReport.orderNo || '';
    ws.addRow(r2);
    ws.getCell(`${lastCol}2`).font = { bold: true, size: 11 };
    ws.getCell(`${lastCol}2`).alignment = { horizontal: 'right' };

    // Row 3: As at (last col)
    const r3 = Array(TOTAL_COLS).fill(' ');
    r3[TOTAL_COLS - 1] = `As at: ${readableDate(undefined, true)}`;
    ws.addRow(r3);
    ws.getCell(`${lastCol}3`).font = { bold: true, size: 10 };
    ws.getCell(`${lastCol}3`).alignment = { horizontal: 'right' };

    // Row 4: Spacer
    ws.addRow([]);

    // Meta section — vertical list, label col A, value col B
    const addMetaRow = (label: string, value: string) => {
      const rowNum = (ws.lastRow?.number ?? 0) + 1;
      const row = Array(TOTAL_COLS).fill('');
      row[0] = label;
      row[1] = value;
      ws.addRow(row);
      if (label) {
        ws.getCell(`A${rowNum}`).font = {
          bold: true,
          size: 9,
          color: { argb: COLORS.GRAY },
        };
      }
      ws.getCell(`B${rowNum}`).font = { size: 10 };
      ws.getRow(rowNum).height = 16;
    };

    addMetaRow('Order No', purchaseGrnsReport.orderNo || '');
    addMetaRow('Stakeholder', purchaseGrnsReport.stakeholder?.name || '');
    addMetaRow(
      'Order Date',
      readableDate(purchaseGrnsReport.order_date, false)
    );
    addMetaRow('Printed By', user?.name || '');
    addMetaRow('Printed On', readableDate(undefined, true));

    // Spacer before table
    ws.addRow([]);

    // Table header row
    // PDF header cells show two lines: main label + date — replicated with richText + wrapText
    const headerRowNum = (ws.lastRow?.number ?? 0) + 1;

    const setHdr = (
      col: number,
      label: string,
      subLabel?: string,
      alignRight = false
    ) => {
      const cell = ws.getCell(`${getExcelColumnName(col)}${headerRowNum}`);
      cell.value = subLabel
        ? { richText: [{ text: label }, { text: '\n' }, { text: subLabel }] }
        : label;
      applyCellStyle(cell, CELL_STYLES.tableHeader);
      cell.alignment = {
        horizontal: alignRight ? 'right' : 'center',
        vertical: 'middle',
        wrapText: true,
      };
    };

    setHdr(COL_SN, 'S/N');
    setHdr(COL_PRODUCT, 'Products');
    setHdr(COL_UNIT, 'Unit');
    setHdr(
      COL_ORDERED,
      'Ordered',
      readableDate(purchaseGrnsReport.order_date, false),
      true
    );

    receivedItems.forEach((grn: any, i: number) => {
      setHdr(5 + i, grn.grnNo, readableDate(grn.date_received, false), true);
    });

    setHdr(COL_PENDING, 'Pending', readableDate(undefined, false), true);

    ws.getRow(headerRowNum).height = 30;

    // Data rows
    purchaseGrnsReport.purchase_order_items.forEach(
      (item: any, index: number) => {
        const rowNum = (ws.lastRow?.number ?? 0) + 1;
        const fill = getAlternatingRowFill(index);

        const totalReceivedQuantity = receivedItems.reduce(
          (total: number, grn: any) => {
            const product = grn.products.find(
              (p: any) => p.productId === item.id
            );
            return total + (product ? product.quantity : 0);
          },
          0
        );

        const unReceivedQuantity = item.quantity - totalReceivedQuantity;

        const setTxt = (col: number, value: string) => {
          const cell = ws.getCell(`${getExcelColumnName(col)}${rowNum}`);
          cell.value = value;
          applyCellStyle(cell, { ...CELL_STYLES.dataRowText, fill });
        };

        const setNum = (col: number, value: number) => {
          const cell = ws.getCell(`${getExcelColumnName(col)}${rowNum}`);
          cell.value = value;
          cell.numFmt = QTY_FMT;
          applyCellStyle(cell, { ...CELL_STYLES.dataRowNumeric, fill });
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        };

        setTxt(COL_SN, String(index + 1));
        ws.getCell(`${getExcelColumnName(COL_SN)}${rowNum}`).alignment = {
          horizontal: 'center',
          vertical: 'middle',
        };
        setTxt(COL_PRODUCT, item.product?.name || '');
        setTxt(COL_UNIT, item.measurement_unit?.symbol || '');
        setNum(COL_ORDERED, item.quantity);

        receivedItems.forEach((grn: any, i: number) => {
          const product = grn.products.find(
            (p: any) => p.productId === item.id
          );
          setNum(5 + i, product ? product.quantity : 0);
        });

        setNum(COL_PENDING, unReceivedQuantity);

        ws.getRow(rowNum).height = 16;
      }
    );

    return await wb.xlsx.writeBuffer();
  } catch (e: any) {
    console.error('Error exporting GRNs report to Excel:', e);
    throw new Error(
      e?.message || 'Excel export failed during workbook generation'
    );
  }
}
