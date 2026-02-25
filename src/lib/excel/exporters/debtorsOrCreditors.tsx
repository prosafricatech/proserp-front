import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { applyCellStyle, CELL_STYLES } from '../styles';
import { createWorkbook } from '../workBook';

export async function exportDebtorsOrCreditorsToExcel(exportedData: any) {
  try {
    const { authOrganization, reportData, user } = exportedData;
    const reportPeriod = `As at: ${readableDate(reportData.filters.as_at, true)}`;

    // create workbook and worksheet
    const wb = createWorkbook();
    const ws = wb.addWorksheet('Debtors or Creditors Report');

    // column widths
    const baseColumns = [
      { width: reportData.filters?.cost_centers?.length ? 30 : 10 },
      { width: 25 },
      { width: 25 },
      { width: 25 },
      { width: 25 },
      { width: 25 },
      { width: 25 },
    ];

    ws.columns = baseColumns;

    // header section
    ws.addRow([
      authOrganization.organization.name,
      ' ',
      ' ',
      ' ',
      ' ',
      reportData.debtors ? `Debtors Report` : `Creditors Report`,
    ]);
    ws.addRow([' ', ' ', ' ', ' ', ' ', reportPeriod]);

    ws.getCell('A1').font = {
      bold: true,
      size: 12,
    };
    ws.getCell('F1').font = {
      bold: true,
      size: 12,
    };
    ws.getCell('F2').font = {
      bold: true,
      size: 12,
    };

    ws.addRow([]);

    // info section
    if (reportData.filters?.cost_centers?.length > 0) {
      ws.mergeCells('A4:C4');
      ws.getCell('A4').value = 'Cost Centers ';
      ws.getCell('D4').value = 'Printed By';
      ws.getCell('F4').value = 'Printed On';
      let row = 5;
      let col = 65;
      for (let c = 0; c < reportData.filters.cost_centers.length; c++) {
        ws.getCell(`${String.fromCharCode(col)}${row}`).value =
          reportData.filters.cost_centers[c].name;

        ws.getCell(`${String.fromCharCode(col)}${row}`).border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } },
        };
        col++;

        if (col > 67) {
          col = 65;
          row++;
        }
      }

      ws.getCell('D5').value = user?.name;
      ws.getCell('F5').value = readableDate(undefined, true);
    } else {
      ws.addRow([
        'Cost Centers',
        ' ',
        ' ',
        'Printed By',
        ' ',
        'Printed On',
        ' ',
      ]);
      ws.getCell('A5').value = 'All';
      ws.getCell('D5').value = user?.name;
      ws.getCell('F5').value = readableDate(undefined, true);
    }

    for (let c = 65; c < 71; c++) {
      for (let r = 4; r < 6; r++) {
        ws.getCell(`${String.fromCharCode(c)}${r}`).border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } },
        };
      }
      applyCellStyle(
        ws.getCell(`${String.fromCharCode(c)}4`),
        CELL_STYLES.tableHeader
      );
    }

    ws.addRow([]);

    // HEADER ROW AND DATA ROWS
    const dataRow = (ws.lastRow?.number ?? 0) + 1;
    const headerRow = ws.getRow(dataRow);
    headerRow.height = 25;
    ws.getCell(`A${dataRow}`).value = 'S/N';

    ws.mergeCells(`B${dataRow}:E${dataRow}`);
    ws.getCell(`B${dataRow}`).value = 'Name';
    ws.getCell(`F${dataRow}`).value = 'Amount';
    let total = 0;
    Object.values(reportData.debtors || reportData.creditors).forEach(
      (d: any, index: number) => {
        total += d.amount;
        const row = (ws.lastRow?.number ?? 0) + 1;
        ws.getCell(`A${row}`).value = index + 1;

        ws.mergeCells(`B${row}:E${row}`);
        ws.getCell(`B${row}`).value = d.name;

        ws.getCell(`F${row}`).value = d.amount.toLocaleString('en-US', {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        });
        ws.getCell(`F${row}`).alignment = {
          horizontal: 'right',
          vertical: 'middle',
        };

        ws.getCell(`A${row}`).border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } },
        };
        ws.getCell(`B${row}`).border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } },
        };
        ws.getCell(`F${row}`).border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } },
        };
      }
    );

    const totalRow = (ws.lastRow?.number ?? 0) + 1;

    // TOTAL ROW STYLING
    for (let c = 65; c < 71; c++) {
      ws.getCell(`${String.fromCharCode(c)}${totalRow}`).border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };
      applyCellStyle(
        ws.getCell(`${String.fromCharCode(c)}${totalRow}`),
        CELL_STYLES.tableHeader
      );
    }

    // TOTAL ROW
    ws.getRow(totalRow).height = 20;
    ws.mergeCells(`A${totalRow}:E${totalRow}`);
    ws.getCell(`A${totalRow}`).value = 'Total';
    ws.getCell(`A${totalRow}`).font = { bold: true, size: 11 };

    ws.getCell(`F${totalRow}`).value = total.toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });
    ws.getCell(`F${totalRow}`).alignment = {
      horizontal: 'right',
      vertical: 'middle',
    };

    // DATA HEADER ROWS STYLING
    for (let c = 65; c < 71; c++) {
      ws.getCell(`${String.fromCharCode(c)}${dataRow}`).border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };
      applyCellStyle(
        ws.getCell(`${String.fromCharCode(c)}${dataRow}`),
        CELL_STYLES.tableHeader
      );
    }

    // Return Excel buffer
    return await wb.xlsx.writeBuffer();
  } catch (e: any) {
    console.error('Error exporting sample Excel:', e);
    throw new Error(
      e?.message || 'Excel export failed during workbook generation'
    );
  }
}
