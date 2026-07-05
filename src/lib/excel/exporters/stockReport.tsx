import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { applyCellStyle, CELL_STYLES, COLORS } from '../styles';
import { getExcelColumnName } from '../uitls';
import { createWorkbook } from '../workBook';

const AMT_FMT = '#,###.00';
const QTY_FMT = '#,###.##';

function styleHeaderRow(ws: any, rowNum: number, totalCols: number) {
  for (let i = 1; i <= totalCols; i++) {
    applyCellStyle(
      ws.getCell(`${getExcelColumnName(i)}${rowNum}`),
      CELL_STYLES.tableHeader
    );
  }
}

function styleBorderRow(ws: any, rowNum: number, totalCols: number) {
  for (let i = 1; i <= totalCols; i++) {
    applyCellStyle(
      ws.getCell(`${getExcelColumnName(i)}${rowNum}`),
      CELL_STYLES.dataRowText
    );
  }
}

function setNum(cell: any, value: any, fmt: string) {
  cell.value = value ?? null;
  if (value != null) {
    cell.numFmt = fmt;
    cell.alignment = { horizontal: 'right', vertical: 'middle' };
  }
}

export async function exportStockReportToExcel(exportedData: any) {
  try {
    const {
      stockData,
      authObject,
      store,
      productCategories,
      costCenter,
      date,
      hasPermissionToView,
      withDetails,
    } = exportedData;

    const {
      authOrganization,
      authUser: { user },
    } = authObject;
    const orgName = authOrganization.organization.name || '';
    const reportPeriod = `As at: ${readableDate(date, true)}`;

    const totalAmount = (stockData || []).reduce(
      (total: number, stock: any) => total + stock.latest_rate * stock.balance,
      0
    );

    const detailColDefs = withDetails
      ? [
          { label: 'Item Name', getValue: (s: any) => s.item_name || '' },
          { label: 'Brand', getValue: (s: any) => s.brand || '' },
          { label: 'Model', getValue: (s: any) => s.model || '' },
          {
            label: 'Specifications',
            getValue: (s: any) => s.specifications || '',
          },
          { label: 'SKU', getValue: (s: any) => s.sku || '' },
          { label: 'Category', getValue: (s: any) => s.category?.name || '' },
          { label: 'Description', getValue: (s: any) => s.description || '' },
          { label: 'Type', getValue: (s: any) => s.type || '' },
          {
            label: 'VAT Exempted',
            // getValue: (s: any) => (s.vat_exempted ? 'Yes' : 'No'),
            getValue: (s: any) => s.vat_exempted,
          },
        ]
      : [];

    const baseColCount = hasPermissionToView ? 6 : 4;
    const totalCols = baseColCount + detailColDefs.length;
    const lastCol = getExcelColumnName(totalCols);

    const wb = createWorkbook();
    const ws = wb.addWorksheet('Stock Report');

    ws.columns = [
      { width: 16 }, // A — labels
      { width: 35 }, // B — Product Name / meta values
      { width: 12 }, // C — Unit
      { width: 16 }, // D — Balance
      ...(hasPermissionToView ? [{ width: 18 }, { width: 22 }] : []),
      ...(withDetails
        ? [
            { width: 25 }, // Item Name
            { width: 18 }, // Brand
            { width: 18 }, // Model
            { width: 22 }, // Specifications
            { width: 14 }, // SKU
            { width: 20 }, // Category
            { width: 30 }, // Description
            { width: 14 }, // Type
            { width: 14 }, // VAT Exempted
          ]
        : []),
    ];

    // Row 1: Org name (A) + Report title (last col)
    const r1 = Array(totalCols).fill(' ');
    r1[0] = orgName;
    r1[totalCols - 1] = 'Stock Report';
    ws.addRow(r1);
    ws.getCell('A1').font = { bold: true, size: 12 };
    ws.getCell(`${lastCol}1`).font = { bold: true, size: 12 };
    ws.getCell(`${lastCol}1`).alignment = { horizontal: 'right' };

    // Row 2: Store name (last col)
    const r2 = Array(totalCols).fill(' ');
    r2[totalCols - 1] = store?.name || '';
    ws.addRow(r2);
    ws.getCell(`${lastCol}2`).font = { bold: true, size: 11 };
    ws.getCell(`${lastCol}2`).alignment = { horizontal: 'right' };

    // Row 3: Period (last col)
    const r3 = Array(totalCols).fill(' ');
    r3[totalCols - 1] = reportPeriod;
    ws.addRow(r3);
    ws.getCell(`${lastCol}3`).font = { bold: true, size: 10 };
    ws.getCell(`${lastCol}3`).alignment = { horizontal: 'right' };

    // Row 4: Spacer
    ws.addRow([]);

    // Meta section — vertical list, label in col A, value in col B.
    // Cost centers are listed one per row; "Cost Centers" label appears only on the first.
    const addMetaRow = (label: string, value: string) => {
      const rowNum = (ws.lastRow?.number ?? 0) + 1;
      ws.addRow([label, value, ...Array(totalCols - 2).fill('')]);
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

    if (costCenter?.length > 0) {
      costCenter.forEach((cc: any, i: number) => {
        addMetaRow(i === 0 ? 'Cost Centers' : '', cc.name);
      });
    } else {
      addMetaRow('Cost Centers', 'All');
    }

    if (productCategories?.length > 0) {
      addMetaRow(
        'Categories',
        productCategories.map((cat: any) => cat.name).join(', ')
      );
    } else {
      addMetaRow('Categories', 'All');
    }

    addMetaRow('Printed By', user.name);
    addMetaRow('Printed On', readableDate(undefined, true));

    // Spacer before table
    ws.addRow([]);

    // Table header row
    const headerRowNum = (ws.lastRow?.number ?? 0) + 1;
    ws.addRow([
      'S/N',
      'Product Name',
      'Unit',
      'Balance',
      ...(hasPermissionToView ? ['Latest Rate', 'Amount'] : []),
      ...detailColDefs.map((d) => d.label),
    ]);
    styleHeaderRow(ws, headerRowNum, totalCols);
    ws.getRow(headerRowNum).height = 20;
    [4, ...(hasPermissionToView ? [5, 6] : [])].forEach((colIdx) => {
      ws.getCell(`${getExcelColumnName(colIdx)}${headerRowNum}`).alignment = {
        horizontal: 'right',
        vertical: 'middle',
      };
    });

    // Data rows
    (stockData || []).forEach((stock: any, index: number) => {
      const rowNum = (ws.lastRow?.number ?? 0) + 1;
      ws.addRow([
        index + 1,
        stock.name,
        stock.measurement_unit?.symbol || '',
        null,
        ...(hasPermissionToView ? [null, null] : []),
        ...detailColDefs.map((d) => d.getValue(stock)),
      ]);
      styleBorderRow(ws, rowNum, totalCols);
      ws.getCell(`A${rowNum}`).alignment = {
        horizontal: 'center',
        vertical: 'middle',
      };

      setNum(ws.getCell(`D${rowNum}`), stock.balance ?? null, QTY_FMT);
      if (hasPermissionToView) {
        setNum(ws.getCell(`E${rowNum}`), stock.latest_rate ?? null, AMT_FMT);
        setNum(
          ws.getCell(`F${rowNum}`),
          stock.balance != null && stock.latest_rate != null
            ? stock.balance * stock.latest_rate
            : null,
          AMT_FMT
        );
      }
    });

    // Total row — only when hasPermissionToView (mirrors PDF)
    if (hasPermissionToView) {
      const totalRowNum = (ws.lastRow?.number ?? 0) + 1;
      ws.addRow([]);
      ws.mergeCells(`A${totalRowNum}:${getExcelColumnName(5)}${totalRowNum}`);
      ws.getCell(`A${totalRowNum}`).value = 'Total';
      styleHeaderRow(ws, totalRowNum, totalCols);
      ws.getCell(`A${totalRowNum}`).alignment = {
        horizontal: 'right',
        vertical: 'middle',
      };
      setNum(ws.getCell(`F${totalRowNum}`), totalAmount, AMT_FMT);
      ws.getRow(totalRowNum).height = 20;
    }

    return await wb.xlsx.writeBuffer();
  } catch (e: any) {
    console.error('Error exporting Excel:', e);
    throw new Error(
      e?.message || 'Excel export failed during workbook generation'
    );
  }
}
