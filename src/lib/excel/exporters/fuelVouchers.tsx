import dayjs from 'dayjs';
import { createWorkbook } from '../workBook';

export async function exportFuelVouchersToExcel(exportedData: any) {
  try {
    const totalLts = exportedData.fuelVouchers.reduce(
      (sum: any, fv: any) => sum + fv.quantity,
      0
    );

    const totalAmount = exportedData.fuelVouchers.reduce(
      (sum: any, fv: any) => sum + fv.quantity * fv.price,
      0
    );

    // create workbook and worksheet
    const wb = createWorkbook();
    const ws = wb.addWorksheet('Fuel Vouchers');

    // Set column widths for better readability
    ws.columns = [
      { width: 18 }, // Voucher No
      { width: 12 }, // Date
      { width: 15 }, // Reference
      { width: 15 }, // Product
      { width: 25 }, // Narration
      { width: 12 }, // LTS
      { width: 10 }, // @
      { width: 15 }, // Total
    ];

    // === FILTER SECTION (Level 1 - Top Level) ===
    // Sttion name row
    ws.getCell(`A1`).value = 'Station Name';
    ws.getCell(`A1`).font = { bold: true, size: 11 };
    ws.getCell(`A1`).alignment = { horizontal: 'left', vertical: 'middle' };

    ws.mergeCells(`B1:C1`);
    ws.getCell(`B1`).value = exportedData.filters.stationName;
    ws.getCell(`B1`).alignment = { horizontal: 'left', vertical: 'middle' };
    ws.getCell(`B1`).font = { size: 10 };

    // Stakeholder name row
    ws.getCell(`A2`).value = 'Stakeholder Name';
    ws.getCell(`A2`).font = { bold: true, size: 11 };
    ws.getCell(`A2`).alignment = { horizontal: 'left', vertical: 'middle' };

    ws.mergeCells(`B2:C2`);
    ws.getCell(`B2`).value = exportedData.filters.stakeholder_name;
    ws.getCell(`B2`).alignment = { horizontal: 'left', vertical: 'middle' };
    ws.getCell(`B2`).font = { size: 10 };

    // Stakeholder name row
    ws.getCell(`A3`).value = 'Date Range';
    ws.getCell(`A3`).font = { bold: true, size: 11 };
    ws.getCell(`A3`).alignment = { horizontal: 'left', vertical: 'middle' };

    ws.mergeCells(`B3:C3`);
    ws.getCell(`B3`).value =
      `${exportedData.filters.from} - ${exportedData.filters.to}`;
    ws.getCell(`B3`).alignment = { horizontal: 'left', vertical: 'middle' };
    ws.getCell(`B3`).font = { size: 10 };

    // Add spacing row
    ws.addRow([]);

    // === TABLE HEADER (Level 2 - Section Header) ===
    const headingRow = ws.addRow([
      'VOUCHER NO.',
      'DATE',
      'REFERENCE',
      'PRODUCT',
      'NARRATION',
      'LTS',
      '@',
      'TOTAL',
    ]);
    headingRow.height = 20;

    for (let c = 0; c < 8; c++) {
      ws.getCell(`${String.fromCharCode(65 + c)}5`).border = {
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };
      ws.getCell(`${String.fromCharCode(65 + c)}5`).font = {
        bold: true,
        size: 11,
      };
      ws.getCell(`${String.fromCharCode(65 + c)}5`).alignment = {
        horizontal: 'left',
        vertical: 'middle',
      };
      ws.getCell(`${String.fromCharCode(65 + c)}5`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' }, // Dark gray for header
      };
    }

    // === DATA ROWS (Level 3 - Content) ===
    if (exportedData.fuelVouchers.length) {
      exportedData.fuelVouchers.forEach((fv: any, index: number) => {
        const dataRow = ws.addRow([
          fv.voucherNo,
          dayjs(fv.transaction_date).format('DD-MM-YYYY'),
          fv.reference || '',
          fv.product?.name,
          fv.narration,
          fv.quantity.toLocaleString('en-US', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2,
          }),
          fv.price.toLocaleString('en-US', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2,
          }),
          (fv.quantity * fv.price).toLocaleString('en-US', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2,
          }),
        ]);

        // Alternating row colors for better readability
        const rowColor = index % 2 === 0 ? 'FFFFFFFF' : 'FFF8F8F8';
        dataRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: rowColor },
        };

        dataRow.font = { size: 10 };
        dataRow.alignment = { vertical: 'middle' };

        // Add subtle borders
        dataRow.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } },
          };

          // Right-align numeric columns (LTS, @, TOTAL)
          if (colNumber >= 6) {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          } else {
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
          }
        });
      });

      // === TOTAL ROW (Level 2 - Summary) ===
      const totalRow = ws.addRow([
        'TOTAL',
        ' ',
        ' ',
        ' ',
        ' ',
        totalLts.toLocaleString('en-US', {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        }),
        ' ',
        totalAmount.toLocaleString('en-US', {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        }),
      ]);

      totalRow.height = 22;
      const totalRowNo = totalRow.number;
      for (let c = 0; c < 8; c++) {
        ws.getCell(`${String.fromCharCode(65 + c)}${totalRowNo}`).font = {
          bold: true,
          size: 11,
        };
        ws.getCell(`${String.fromCharCode(65 + c)}${totalRowNo}`).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD9D9D9' }, // Light gray for total row
        };
        ws.getCell(`${String.fromCharCode(65 + c)}${totalRowNo}`).border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF666666' } },
          right: { style: 'thin', color: { argb: 'FF666666' } },
        };
      }

      totalRow.eachCell((cell, colNumber) => {
        // Right-align numeric columns
        if (colNumber >= 6) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }
      });
    }

    // Return Excel buffer
    return await wb.xlsx.writeBuffer();
  } catch (error: any) {
    console.error('Error exporting sample Excel:', error);
    throw new Error(
      error?.message || 'Excel export failed during workbook generation'
    );
  }
}
