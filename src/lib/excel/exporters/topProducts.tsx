import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { applyCellStyle, CELL_STYLES } from '../styles';
import { createWorkbook } from '../workBook';

export async function exportProductSalesExcel(exportedData: any) {
  try {
    const {
      popularProducts,
      organization,
      topProductsData,
      selectedTop,
      salesPersonsSelected,
    } = exportedData;

    const reportPeriod = `${readableDate(topProductsData.params.from, true)} - ${readableDate(topProductsData.params.to, true)}`;
    const capitalizeFirstLetter = (str: string) =>
      str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    const oderedBy =
      capitalizeFirstLetter(topProductsData.params.order_by) +
      ' ' +
      capitalizeFirstLetter(topProductsData.params.order_direction);

    // create workbook and worksheet
    const wb = createWorkbook();
    const ws = wb.addWorksheet('Fuel Vouchers');

    // column widths
    const baseColumns = [
      { width: 12 }, // s/n
      { width: 25 }, // Products
      { width: 25 }, // unit
      { width: 25 }, // quantity
      { width: 25 }, // revenue
      { width: 25 }, // Cogs
      { width: 25 }, // profit
      { width: 25 }, // margin
    ];

    ws.columns = baseColumns;

    // header section
    ws.addRow([
      organization.name,
      ' ',
      ' ',
      ' ',
      ' ',
      ' ',
      ' ',
      'TOP PRODUCTS',
    ]);
    ws.addRow([' ', ' ', ' ', ' ', ' ', ' ', ' ', reportPeriod]);

    ws.getCell('A1').font = {
      bold: true,
      size: 12,
    };
    ws.getCell('H1').font = {
      bold: true,
      size: 12,
    };

    ws.addRow([]);

    // info section
    const infoHeaderRow = ws.addRow([
      'Ordered By',
      ' ',
      'Printed By',
      ' ',
      'Printed On',
      ' ',
      ' ',
    ]);
    const infoDataRow = ws.addRow([
      oderedBy,
      ' ',
      topProductsData.user,
      ' ',
      readableDate(undefined, true),
      ' ',
      ' ',
    ]);

    if (salesPersonsSelected.length > 0) {
      infoHeaderRow.getCell('H4').value = 'Sales Person';
      infoDataRow.getCell('H5').value = salesPersonsSelected.join(', ');
    }

    for (let c = 0; c < 8; c++) {
      for (let r = 4; r < 6; r++) {
        if (r === 4) {
          ws.getCell(`${String.fromCharCode(65 + c)}${r}`).font = {
            bold: true,
            size: 12,
          };
          applyCellStyle(
            ws.getCell(`${String.fromCharCode(65 + c)}${r}`),
            CELL_STYLES.tableHeader
          );
        }
        ws.getCell(`${String.fromCharCode(65 + c)}${r}`).border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } },
        };
      }
    }

    ws.addRow([]);

    // cost centers
    ws.addRow(['Cost Center', ' ', ' ', ' ', ' ', ' ', ' ', ' ']);
    for (let c = 0; c < 8; c++) {
      ws.getCell(`${String.fromCharCode(65 + c)}7`).font = {
        bold: true,
        size: 12,
      };
      applyCellStyle(
        ws.getCell(`${String.fromCharCode(65 + c)}7`),
        CELL_STYLES.tableHeader
      );
    }

    let row = 8;
    let col = 65;
    let costCenters: any = [];

    if (topProductsData.costCenters) {
      for (let c = 0; c < topProductsData.costCenters.length; c++) {
        ws.getCell(`${String.fromCharCode(col)}${row}`).value =
          topProductsData.costCenters[c].name;
        ws.getCell(`${String.fromCharCode(col)}${row}`).border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } },
        };
        col++;

        if (col > 72) {
          col = 65;
          row++;
        }
      }
    }

    // product table
    const productsRow = (ws.lastRow?.number || 0) + 2;
    ws.getRow(productsRow).height = 20;
    ws.getRow(productsRow).font = { bold: true, size: 11 };
    ws.getRow(productsRow).alignment = {
      horizontal: 'left',
      vertical: 'middle',
    };

    ws.getCell(`A${productsRow}`).value = 'S/N';
    ws.getCell(`A${productsRow}`);
    ws.getCell(`B${productsRow}`).value = selectedTop;
    ws.getCell(`C${productsRow}`).value = 'Unit';
    ws.getCell(`D${productsRow}`).value = 'Quantity';
    ws.getCell(`E${productsRow}`).value = 'Revenue';
    ws.getCell(`F${productsRow}`).value = 'CoGs';
    ws.getCell(`G${productsRow}`).value = 'Profit';
    ws.getCell(`H${productsRow}`).value = 'Margin';

    ws.getRow(productsRow).eachCell((cell, colNumber) => {
      // Right-align numeric columns
      if (colNumber >= 9) {
        applyCellStyle(cell, CELL_STYLES.totalRowNumeric);
      } else {
        applyCellStyle(cell, CELL_STYLES.totalRowText);
      }
    });

    popularProducts.forEach((pp: any, index: number) => {
      let dataRow = ws.addRow([
        index + 1,
        pp.name,
        pp.unit_symbol,
        pp.quantity.toLocaleString('en-US', {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        }),
        pp.revenue.toLocaleString('en-US', {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        }),
        pp.cogs.toLocaleString('en-US', {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        }),
        pp.profit.toLocaleString('en-US', {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        }),
        pp.margin.toLocaleString('en-US', {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        }) + '%',
      ]);

      for (let c = 0; c < 8; c++) {
        dataRow.getCell(c + 1).border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } },
        };
        if (c >= 3) {
          dataRow.getCell(c + 1).alignment = {
            horizontal: 'right',
            vertical: 'middle',
          };
        } else {
          dataRow.getCell(c + 1).alignment = {
            horizontal: 'left',
            vertical: 'middle',
          };
        }
      }
    });

    // Return Excel buffer
    return await wb.xlsx.writeBuffer();
    // return {
    //   message: exportedData,
    // };
  } catch (e: any) {
    console.error('Error exporting sample Excel:', e);
    throw new Error(
      e?.message || 'Excel export failed during workbook generation'
    );
  }
}
