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
      { width: 15 }, // Voucher No
      { width: 12 }, // Date
      { width: 15 }, // Reference
      { width: 15 }, // Product
      { width: 25 }, // Narration
      { width: 12 }, // LTS
      { width: 10 }, // @
      { width: 15 }, // Total
    ];

    // === FILTER SECTION (Level 1 - Top Level) ===
    // Filter labels row
    ws.mergeCells(`A1:B1`);
    ws.getCell(`A1`).value = 'Station Name';
    ws.getCell(`A1`).font = { bold: true, size: 11 };
    ws.getCell(`A1`).alignment = { horizontal: 'left', vertical: 'middle' };
    ws.getCell(`A1`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8E8E8' }, // Light gray background
    };
    ws.getCell(`A1`).border = {
      bottom: { style: 'thin', color: { argb: 'FF999999' } },
    };

    ws.mergeCells(`C1:D1`);
    ws.getCell(`C1`).value = 'Stakeholder Name';
    ws.getCell(`C1`).font = { bold: true, size: 11 };
    ws.getCell(`C1`).alignment = { horizontal: 'left', vertical: 'middle' };
    ws.getCell(`C1`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8E8E8' },
    };
    ws.getCell(`C1`).border = {
      bottom: { style: 'thin', color: { argb: 'FF999999' } },
    };

    ws.mergeCells(`E1:G1`);
    ws.getCell(`E1`).value = 'Date Range';
    ws.getCell(`E1`).font = { bold: true, size: 11 };
    ws.getCell(`E1`).alignment = { horizontal: 'left', vertical: 'middle' };
    ws.getCell(`E1`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8E8E8' },
    };
    ws.getCell(`E1`).border = {
      bottom: { style: 'thin', color: { argb: 'FF999999' } },
    };

    // Filter values row
    ws.mergeCells(`A2:B2`);
    ws.getCell(`A2`).value = exportedData.filters.stationName;
    ws.getCell(`A2`).alignment = { horizontal: 'left', vertical: 'middle' };
    ws.getCell(`A2`).font = { size: 10 };

    ws.mergeCells(`C2:D2`);
    ws.getCell(`C2`).value = exportedData.filters.stakeholder_name;
    ws.getCell(`C2`).alignment = { horizontal: 'left', vertical: 'middle' };
    ws.getCell(`C2`).font = { size: 10 };

    ws.mergeCells(`E2:G2`);
    ws.getCell(`E2`).value =
      `${exportedData.filters.from} - ${exportedData.filters.to}`;
    ws.getCell(`E2`).alignment = { horizontal: 'left', vertical: 'middle' };
    ws.getCell(`E2`).font = { size: 10 };

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
    headingRow.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    headingRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headingRow.height = 20;
    headingRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF404040' }, // Dark gray for header
    };
    headingRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF666666' } },
        right: { style: 'thin', color: { argb: 'FF666666' } },
      };
    });

    // === DATA ROWS (Level 3 - Content) ===
    if (exportedData.fuelVouchers.length) {
      exportedData.fuelVouchers.forEach((fv: any, index: number) => {
        const dataRow = ws.addRow([
          fv.voucherNo,
          dayjs(fv.transaction_date).format('DD-MM-YYYY'),
          fv.reference,
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
            bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            left: { style: 'thin', color: { argb: 'FFF0F0F0' } },
            right: { style: 'thin', color: { argb: 'FFF0F0F0' } },
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

      totalRow.font = { bold: true, size: 11 };
      totalRow.height = 22;
      totalRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' }, // Light gray for total row
      };

      totalRow.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'medium', color: { argb: 'FF000000' } },
          bottom: { style: 'medium', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF666666' } },
          right: { style: 'thin', color: { argb: 'FF666666' } },
        };

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
