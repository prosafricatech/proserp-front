import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { applyCellStyle, CELL_STYLES } from '../styles';
import { createWorkbook } from '../workBook';

export async function exportDippingReportToExcel(exportedData: any) {
  try {
    const { activeStation, filters, organization, reportData } = exportedData;

    const allReadings = reportData.flatMap((data: any) => data.readings); // Collect all readings in the same array

    // Step 1: Create a Map to aggregate tanks by product id
    const productMap = new Map();

    // Populate the Map with tanks grouped by checking product id
    allReadings.forEach((product: any) => {
      if (!productMap.has(product.id)) {
        productMap.set(product.id, {
          id: product.id,
          name: product.name,
          tanks: new Map(),
        });
      }
      const productData = productMap.get(product.id);

      // Aggregate tanks by their names
      product.tanks.forEach((tank: any) => {
        if (!productData.tanks.has(tank.tank)) {
          productData.tanks.set(tank.tank, {
            tank: tank.tank,
            opening: tank.opening,
            stock_in: 0,
            stock_out: 0,
            reading: tank.reading,
            calculated_stock: tank.calculated_stock,
            deviation: 0,
            cummulative_deviation: tank.cummulative_deviation,
            tank_difference: 0,
          });
        }
        const tankData = productData.tanks.get(tank.tank);

        // Only update opening if it hasn't been set before
        if (tankData.opening === undefined) {
          tankData.opening = tank?.opening || 0;
        }

        tankData.stock_in += tank.stock_in || 0;
        tankData.stock_out += tank.stock_out || 0;
        tankData.reading = tank.reading || 0;
        tankData.calculated_stock = tank.calculated_stock || 0;
        tankData.deviation += tank.deviation || 0;
        tankData.cummulative_deviation = tank.cummulative_deviation || 0;
        tankData.tank_difference = tank.tank_difference || 0;
      });
    });

    const productArray = Array.from(productMap.values()).map((product) => ({
      ...product,
      tanks: Array.from(product.tanks.values()),
    }));

    // add commulative deviation for each tank
    const processedReports = (reportData: any) => {
      if (!reportData) return [];

      const cumulativeMap: any = {};

      return [...reportData].map((report) => ({
        ...report,
        readings: report.readings.map((reading: any) => ({
          ...reading,
          tanks: reading.tanks.map((tank: any) => {
            const key = tank.tank;

            cumulativeMap[key] = (cumulativeMap[key] || 0) + tank.deviation;

            return {
              ...tank,
              accumulated_deviation: cumulativeMap[key],
            };
          }),
        })),
      }));
    };

    const finalReport = processedReports(reportData);

    // create workbook and worksheet
    const wb = createWorkbook();
    const ws = wb.addWorksheet('Dipping Report');

    // column widths
    const baseColumns = [
      { width: 12 }, // Period
      { width: 15 }, // details
      { width: 15 }, // details
      { width: 15 }, // opening
      { width: 15 }, // stock in
      { width: 15 }, // stock out
      { width: 15 }, // closing
      { width: 15 }, // tank differecnce
      { width: 15 }, // deviation
      { width: 25 }, // cummulative deviation
      { width: 15 }, // calculated stock
      { width: 15 }, // stock deviation
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
      ' ',
      ' ',
      ' ',
      ' ',
      activeStation.name,
    ]);
    ws.addRow([
      ' ',
      ' ',
      ' ',
      ' ',
      ' ',
      ' ',
      ' ',
      ' ',
      ' ',
      ' ',
      ' ',
      'Dipping Report',
    ]);
    ws.addRow([
      ' ',
      ' ',
      ' ',
      ' ',
      ' ',
      ' ',
      ' ',
      ' ',
      ' ',
      ' ',
      ' ',
      readableDate(filters.from, true) + '-' + readableDate(filters.to, true),
    ]);

    // let row = 1;

    // ====== HEADER STYILING ===== //
    for (let r = 1; r <= 3; r++) {
      for (let c = 65; c <= 77; c++) {
        ws.getCell(`${String.fromCharCode(c)}${r}`).font = {
          bold: true,
          size: 12,
        };
        if (c > 77) {
          r++;
        }
        if (r > 3) {
          break;
        }
      }
    }

    ws.addRow([]);

    let dippingRow = (ws.lastRow?.number ?? 0) + 1;

    // ===== REPORT DATA ===== //
    // processedReports.forEach((dipping: any, index: number) => {
    finalReport.forEach((dipping: any, index: number) => {
      // length of tanks for each reding
      const tanksLength =
        dipping.readings.reduce((acc: number, reading: any) => {
          return acc + reading.tanks.length;
        }, 0) + 3;

      // ===== SUB-HEADINGS ===== //
      ws.getCell(`A${dippingRow}`).value = 'Period';

      ws.mergeCells(`B${dippingRow}:C${dippingRow}`);
      ws.getCell(`B${dippingRow}`).value = 'Details';

      ws.getCell(`D${dippingRow}`).value = 'Opening';
      ws.getCell(`E${dippingRow}`).value = 'Stock In';
      ws.getCell(`F${dippingRow}`).value = 'Stock Out';
      ws.getCell(`G${dippingRow}`).value = 'Closing';
      ws.getCell(`H${dippingRow}`).value = 'Tank Difference';
      ws.getCell(`I${dippingRow}`).value = 'Deviation';
      ws.getCell(`J${dippingRow}`).value = 'Commulative Deviation';
      ws.getCell(`K${dippingRow}`).value = 'Calculated Stock';
      ws.getCell(`L${dippingRow}`).value = 'Stock Deviation';

      //   SUBHEADING STYLING
      ws.getRow(dippingRow).height = 20;
      for (let c = 65; c <= 76; c++) {
        applyCellStyle(
          ws.getCell(`${String.fromCharCode(c)}${dippingRow}`),
          CELL_STYLES.tableHeader
        );
      }

      // period cell
      ws.mergeCells(`A${dippingRow + 1}:A${dippingRow + tanksLength}`);
      ws.getCell(`A${dippingRow + 1}`).value =
        `${readableDate(dipping.from, true)}\nTo\n${readableDate(dipping.to, true)}\n\n${dipping.dippingNo}`;
      ws.getCell(`A${dippingRow + 1}`).alignment = {
        wrapText: true,
        vertical: 'middle',
        horizontal: 'center',
      };
      ws.getCell(`A${dippingRow + 1}`).border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };

      //   tank data
      let currentRow = dippingRow + 1;
      dipping.readings.forEach((reading: any) => {
        const innerTanksLength = reading.tanks.length + 1;

        // fuel name
        ws.mergeCells(`B${currentRow}:B${currentRow + innerTanksLength - 1}`);
        ws.getCell(`B${currentRow}`).value = reading.name;
        ws.getCell(`B${currentRow}`).alignment = {
          wrapText: true,
          vertical: 'middle',
          horizontal: 'left',
        };
        ws.getCell(`B${currentRow}`).border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } },
        };

        const tanks = reading.tanks;
        //   Calculate totals for the current reading
        const readingTotals = tanks.reduce(
          (acc: any, tank: any) => {
            acc.opening += tank.opening || 0;
            acc.stockIn += tank.stock_in || 0;
            acc.stockOut += tank.stock_out || 0;
            acc.reading += tank.reading || 0;
            acc.tankDifference += tank.tank_difference || 0;
            acc.deviation += tank.deviation || 0;
            acc.calculatedStock += tank.calculated_stock || 0;
            acc.cumulativeDeviation += tank.cummulative_deviation || 0;
            return acc;
          },
          {
            opening: 0,
            stockIn: 0,
            stockOut: 0,
            reading: 0,
            tankDifference: 0,
            deviation: 0,
            calculatedStock: 0,
            cumulativeDeviation: 0,
          }
        );

        let commulativeDeviation = 0;
        reading.tanks.forEach((tank: any) => {
          commulativeDeviation += tank.deviation;

          ws.getCell(`C${currentRow}`).value = tank.tank;
          ws.getCell(`D${currentRow}`).value = tank.opening;
          ws.getCell(`D${currentRow}`).numFmt = '#,###.00';
          ws.getCell(`E${currentRow}`).value = tank.stock_in;
          ws.getCell(`E${currentRow}`).numFmt = '#,###.00';
          ws.getCell(`F${currentRow}`).value = tank.stock_out;
          ws.getCell(`F${currentRow}`).numFmt = '#,###.00';
          ws.getCell(`G${currentRow}`).value = tank.reading;
          ws.getCell(`G${currentRow}`).numFmt = '#,###.00';
          ws.getCell(`H${currentRow}`).value = tank.tank_difference;
          ws.getCell(`H${currentRow}`).numFmt = '#,###.00';
          ws.getCell(`I${currentRow}`).value = tank.deviation;
          ws.getCell(`I${currentRow}`).numFmt = '#,###.00';
          ws.getCell(`J${currentRow}`).value = tank.accumulated_deviation;
          ws.getCell(`J${currentRow}`).numFmt = '#,###.00';
          ws.getCell(`K${currentRow}`).value = tank.calculated_stock;
          ws.getCell(`K${currentRow}`).numFmt = '#,###.00';
          ws.getCell(`L${currentRow}`).value = tank.cummulative_deviation;
          ws.getCell(`L${currentRow}`).numFmt = '#,###.00';

          for (let col = 67; col <= 76; col++) {
            ws.getCell(`${String.fromCharCode(col)}${currentRow}`).border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } },
            };
            if (col > 67) {
              ws.getCell(`${String.fromCharCode(col)}${currentRow}`).alignment =
                {
                  horizontal: 'right',
                  vertical: 'middle',
                };
            }
          }

          // ===== TOTALS ROW ===== //
          {
            const totalRow = currentRow + 1;
            ws.getCell(`C${totalRow}`).value = 'TOTAL';
            ws.getCell(`D${totalRow}`).value = readingTotals.opening || 0;
            ws.getCell(`E${totalRow}`).value = readingTotals.stockIn || 0;
            ws.getCell(`F${totalRow}`).value = readingTotals.stockOut || 0;
            ws.getCell(`G${totalRow}`).value = readingTotals.reading || 0;
            ws.getCell(`H${totalRow}`).value =
              readingTotals.tankDifference || 0;
            ws.getCell(`I${totalRow}`).value = readingTotals.deviation || 0;
            ws.getCell(`J${totalRow}`).value = ' ';
            ws.getCell(`K${totalRow}`).value =
              readingTotals.calculatedStock || 0;
            ws.getCell(`L${totalRow}`).value =
              readingTotals.cumulativeDeviation || 0;

            for (let col = 67; col <= 76; col++) {
              ws.getCell(`${String.fromCharCode(col)}${totalRow}`).border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } },
              };
              if (col > 67) {
                ws.getCell(`${String.fromCharCode(col)}${totalRow}`).alignment =
                  {
                    horizontal: 'right',
                    vertical: 'middle',
                  };
                ws.getCell(`${String.fromCharCode(col)}${totalRow}`).numFmt =
                  '#,###.00';
              }
            }
          }

          currentRow++;
        });
        for (let col = 67; col <= 76; col++) {
          applyCellStyle(
            ws.getCell(`${String.fromCharCode(col)}${currentRow}`),
            CELL_STYLES.tableHeader
          );
          if (col > 67) {
            ws.getCell(`${String.fromCharCode(col)}${currentRow}`).alignment = {
              horizontal: 'right',
              vertical: 'middle',
            };
          }
        }

        currentRow += 2;
      });

      dippingRow += tanksLength + 2;
    });

    ws.addRow([]);

    // ===== SUMAMARY ===== //
    const summaryRow = (ws.lastRow?.number ?? 0) + 1;
    ws.mergeCells(`A${summaryRow}:L${summaryRow}`);
    ws.getCell(`A${summaryRow}`).value = 'Summary';
    applyCellStyle(ws.getCell(`A${summaryRow}`), CELL_STYLES.tableHeader);
    ws.getRow(summaryRow).height = 20;
    ws.getCell(`A${summaryRow}`).border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } },
    };
    ws.getCell(`A${summaryRow}`).alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };

    // ===== SUMMARY SUB-HEADINGS ===== //
    ws.getCell(`A${summaryRow + 1}`).value = 'Period';

    ws.mergeCells(`B${summaryRow + 1}:C${summaryRow + 1}`);
    ws.getCell(`B${summaryRow + 1}`).value = 'Details';

    ws.getCell(`D${summaryRow + 1}`).value = 'Opening';
    ws.getCell(`E${summaryRow + 1}`).value = 'Stock In';
    ws.getCell(`F${summaryRow + 1}`).value = 'Stock Out';
    ws.getCell(`G${summaryRow + 1}`).value = 'Closing';
    ws.getCell(`H${summaryRow + 1}`).value = 'Tank Difference';
    ws.getCell(`I${summaryRow + 1}`).value = 'Deviation';
    ws.getCell(`J${summaryRow + 1}`).value = 'Commulative Deviation';
    ws.getCell(`K${summaryRow + 1}`).value = 'Calculated Stock';
    ws.getCell(`L${summaryRow + 1}`).value = 'Stock Deviation';

    //   SUMMARY SUBHEADING STYLING
    ws.getRow(summaryRow + 1).height = 20;
    for (let c = 65; c <= 76; c++) {
      applyCellStyle(
        ws.getCell(`${String.fromCharCode(c)}${summaryRow + 1}`),
        CELL_STYLES.tableHeader
      );
    }

    // length of tanks for each reding
    const tanksLength =
      reportData.reduce((acc: number, dipping: any) => {
        return dipping.readings.reduce((acc: number, reading: any) => {
          return acc + reading.tanks.length;
        }, 0);
      }, 0) + 3;

    // period cell
    ws.mergeCells(`A${summaryRow + 2}:A${summaryRow + tanksLength + 1}`);
    ws.getCell(`A${summaryRow + 2}`).value =
      `${readableDate(filters.from, true)}\nTo\n${readableDate(filters.to, true)}\n\nSUMMARY`;
    ws.getCell(`A${summaryRow + 2}`).alignment = {
      wrapText: true,
      vertical: 'middle',
      horizontal: 'center',
    };
    ws.getCell(`A${summaryRow + 2}`).border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } },
    };

    // products summary data
    let currentRow = summaryRow + 2;

    productArray.forEach((product: any) => {
      // Calculate totals for the current product
      const productTotals = product.tanks.reduce(
        (acc: any, tank: any) => {
          acc.opening += tank.opening || 0;
          acc.stockIn += tank.stock_in || 0;
          acc.stockOut += tank.stock_out || 0;
          acc.reading += tank.reading || 0;
          acc.tankDifference += tank.tank_difference || 0;
          acc.deviation += tank.deviation || 0;
          acc.calculatedStock += tank.calculated_stock || 0;
          acc.cumulativeDeviation += tank.cummulative_deviation || 0;
          return acc;
        },
        {
          opening: 0,
          stockIn: 0,
          stockOut: 0,
          reading: 0,
          tankDifference: 0,
          deviation: 0,
          calculatedStock: 0,
          cumulativeDeviation: 0,
        }
      );

      let commulativeTotal = 0;

      const innerTanksLength = product.tanks.length + 1;

      // =====   FUEL NAME ===== //
      ws.mergeCells(`B${currentRow}:B${currentRow + innerTanksLength - 1}`);
      const cell = ws.getCell(`B${currentRow}`);
      cell.value = product.name;
      cell.alignment = {
        wrapText: true,
        vertical: 'middle',
        horizontal: 'left',
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };

      product.tanks.forEach((tank: any, tankIndex: any) => {
        commulativeTotal += tank.deviation;

        ws.getCell(`C${currentRow + tankIndex}`).value = tank.tank;
        ws.getCell(`D${currentRow + tankIndex}`).value = tank.opening;
        ws.getCell(`E${currentRow + tankIndex}`).value = tank.stock_in || 0;
        ws.getCell(`F${currentRow + tankIndex}`).value = tank.stock_out || 0;
        ws.getCell(`G${currentRow + tankIndex}`).value = tank.reading || 0;
        ws.getCell(`H${currentRow + tankIndex}`).value =
          tank.tank_difference || 0;
        ws.getCell(`I${currentRow + tankIndex}`).value = tank.deviation || 0;
        ws.getCell(`J${currentRow + tankIndex}`).value = commulativeTotal || 0;
        ws.getCell(`K${currentRow + tankIndex}`).value =
          tank.calculated_stock || 0;
        ws.getCell(`L${currentRow + tankIndex}`).value =
          tank.cummulative_deviation || 0;

        for (let col = 67; col <= 76; col++) {
          ws.getCell(
            `${String.fromCharCode(col)}${currentRow + tankIndex}`
          ).border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } },
          };
          if (col > 67) {
            ws.getCell(
              `${String.fromCharCode(col)}${currentRow + tankIndex}`
            ).alignment = {
              horizontal: 'right',
              vertical: 'middle',
            };
            ws.getCell(
              `${String.fromCharCode(col)}${currentRow + tankIndex}`
            ).numFmt = '#,###.00';
          }
        }
      });

      // ===== TOTALS ROW ===== //
      {
        const totalRow = currentRow + product.tanks.length;
        ws.getCell(`C${totalRow}`).value = 'TOTAL';
        ws.getCell(`D${totalRow}`).value = productTotals.opening || 0;
        ws.getCell(`E${totalRow}`).value = productTotals.stockIn || 0;
        ws.getCell(`F${totalRow}`).value = productTotals.stockOut || 0;
        ws.getCell(`G${totalRow}`).value = productTotals.reading || 0;
        ws.getCell(`H${totalRow}`).value = productTotals.tankDifference || 0;
        ws.getCell(`I${totalRow}`).value = productTotals.deviation || 0;
        ws.getCell(`J${totalRow}`).value = ' ';
        ws.getCell(`K${totalRow}`).value = productTotals.calculatedStock || 0;
        ws.getCell(`L${totalRow}`).value =
          productTotals.cumulativeDeviation || 0;

        for (let col = 67; col <= 76; col++) {
          ws.getCell(`${String.fromCharCode(col)}${totalRow}`).border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } },
          };
          applyCellStyle(
            ws.getCell(`${String.fromCharCode(col)}${totalRow}`),
            CELL_STYLES.tableHeader
          );
          if (col > 67) {
            ws.getCell(`${String.fromCharCode(col)}${totalRow}`).alignment = {
              horizontal: 'right',
              vertical: 'middle',
            };
            ws.getCell(`${String.fromCharCode(col)}${totalRow}`).numFmt =
              '#,###.00';
          }
        }
      }

      currentRow += innerTanksLength + 1;
    });

    // Return Excel buffer
    return await wb.xlsx.writeBuffer();
    // return {
    //   messaage: processedReports,
    // };
  } catch (error: any) {
    console.error('Error exporting sample Excel:', error);
    throw new Error(
      error?.message || 'Excel export failed during workbook generation'
    );
  }
}
