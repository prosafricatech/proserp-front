import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { addHeader, createWorkbook } from '../workBook';

export async function exportSalesShiftsToExcel(exportedData: any) {
  try {
    // Calculate totals for each cashier
    const calculateCashierTotals = (cashier: any) => {
      // Calculate total products amount for this cashier
      const totalProductsAmount =
        cashier.pump_readings?.reduce((total: number, pump: any) => {
          const productPrice =
            exportedData.shiftData.fuel_prices.find(
              (fp: any) => fp.product_id === pump.product_id
            )?.price || 0;
          const quantity = (pump.closing || 0) - (pump.opening || 0);
          return total + quantity * productPrice;
        }, 0) || 0;

      // Calculate adjustments amount for this cashier
      const adjustmentsAmount =
        cashier.tank_adjustments?.reduce((total: number, adj: any) => {
          const productPrice =
            exportedData.shiftData.fuel_prices.find(
              (fp: any) => fp.product_id === adj.product_id
            )?.price || 0;
          if (adj.operator === '-') {
            return total + adj.quantity * productPrice;
          } else if (adj.operator === '+') {
            return total - adj.quantity * productPrice;
          }
          return total;
        }, 0) || 0;

      // Calculate total fuel vouchers amount for this cashier
      const totalFuelVouchersAmount =
        cashier.fuel_vouchers?.reduce((total: number, fv: any) => {
          const productPrice =
            exportedData.shiftData.fuel_prices.find(
              (fp: any) => fp.product_id === fv.product_id
            )?.price || 0;
          return total + fv.quantity * productPrice;
        }, 0) || 0;

      // Calculate other transactions total for this cashier
      const otherTransactionsTotal =
        cashier.other_transactions?.reduce(
          (total: number, ot: any) => total + (ot.amount || 0),
          0
        ) || 0;

      // Calculate cash remaining for this cashier
      const cashRemaining =
        totalProductsAmount + adjustmentsAmount - totalFuelVouchersAmount;

      return {
        totalProductsAmount,
        adjustmentsAmount,
        totalFuelVouchersAmount,
        otherTransactionsTotal,
        cashRemaining,
        netSales: totalProductsAmount + adjustmentsAmount,
      };
    };

    // total expected amount
    const totalExpectedAmount =
      exportedData.shiftData.cashiers?.reduce((sum: any, c: any) => {
        const {
          totalProductsAmount,
          adjustmentsAmount,
          totalFuelVouchersAmount,
          otherTransactionsTotal,
        } = calculateCashierTotals(c);

        return (
          sum +
          totalProductsAmount +
          adjustmentsAmount -
          totalFuelVouchersAmount -
          otherTransactionsTotal
        );
      }, 0) || 0;

    // total collected amount
    const totalCollectedAmount =
      exportedData.shiftData.cashiers?.reduce(
        (sum: any, c: any) => sum + c.collected_amount,
        0
      ) || 0.0;

    const totalShortOrOver = totalCollectedAmount - totalExpectedAmount;

    // transactions summary
    const totalTransactionsSummary = Object.values(
      exportedData.shiftData.cashiers
        ?.flatMap((c: any) => c.other_transactions)
        .reduce((acc: any, tx: any) => {
          const type = tx.debit_ledger.name;

          if (!acc[type]) {
            acc[type] = { type, count: 0, totalAmount: 0 };
          }

          acc[type].count++;
          acc[type].totalAmount += tx.amount;

          return acc;
        }, {})
    );

    const pumpSummary: any = Object.values(
      exportedData.shiftData.cashiers
        ?.flatMap((c: any) => c.pump_readings)
        .reduce((acc: any, pump: any) => {
          const product = exportedData.productOptions?.find(
            (p: any) => p.id === pump.product_id
          );
          const type = product?.name || `Product ${pump.product_id}`;
          const difference = (pump.closing || 0) - (pump.opening || 0);
          const fuelPrice = exportedData.shiftData.fuel_prices.find(
            (fp: any) => fp.product_id === pump.product_id
          );

          const amount = difference * fuelPrice.price;

          if (!acc[type]) {
            acc[type] = { type, count: 0, totalDifference: 0 };
          }

          acc[type].count++;
          acc[type].totalDifference += amount;

          return acc;
        }, {})
    );

    // calculate grand total
    const totalFvAmount = exportedData.shiftData.cashiers?.reduce(
      (sum: any, c: any) => {
        const vouchersTotal =
          c.fuel_vouchers?.reduce((total: any, fv: any) => {
            const productPrice =
              exportedData.shiftData.fuel_prices?.find(
                (fp: any) => fp.product_id === fv.product_id
              )?.price || 0;

            return total + fv.quantity * productPrice;
          }, 0) || 0;

        return sum + vouchersTotal;
      },
      0
    );

    const totalOtherTransactions = totalTransactionsSummary.reduce(
      (sum, tx: any) => sum + tx.totalAmount,
      0
    );

    const totalMainLedger = exportedData.shiftData.cashiers?.reduce(
      (sum: any, c: any) => sum + c.main_ledger?.amount,
      0
    );

    const mainLedgerTotalsObject = {
      type: 'Main Ledger',
      count: exportedData.shiftData.cashiers?.length ?? 0,
      totalAmount: totalMainLedger,
    };

    // fuel voucher totals object
    const fuelVoucherTotalsObject = {
      type: 'Fuel Vouchers',
      count:
        exportedData.shiftData.cashiers?.reduce(
          (sum: any, c: any) => sum + c.fuel_vouchers?.length,
          0
        ) ?? 0,
      totalAmount: totalFvAmount,
    };

    totalTransactionsSummary.unshift(mainLedgerTotalsObject);
    totalTransactionsSummary.push(fuelVoucherTotalsObject);

    const grandTotal = totalFvAmount + totalOtherTransactions + totalMainLedger;

    // hide dipping summary table if openeing or closing reading is less than 1
    const hideDippingTable = exportedData.shiftData.shift_tanks.some(
      (st: any) => {
        return st.opening_reading < 1 || st.closing_reading < 1;
      }
    );

    // Merge pump readings by product for a specific cashier
    const mergeCashierPumpReadings = (pumpReadings: any) => {
      const merged = pumpReadings.reduce((acc: any, pump: any) => {
        if (!acc[pump.product_id]) {
          acc[pump.product_id] = {
            ...pump,
            quantity: (pump.closing || 0) - (pump.opening || 0),
            opening: pump.opening || 0,
            closing: pump.closing || 0,
          };
        } else {
          acc[pump.product_id].quantity +=
            (pump.closing || 0) - (pump.opening || 0);
          acc[pump.product_id].opening += pump.opening || 0;
          acc[pump.product_id].closing += pump.closing || 0;
        }
        return acc;
      }, {});
      return Object.values(merged);
    };

    const wb = createWorkbook();
    const ws = wb.addWorksheet('Sales Shifts');

    // Set column widths for better readability
    ws.columns = [
      { width: 18 },
      { width: 12 },
      { width: 15 },
      { width: 15 },
      { width: 25 },
      { width: 12 },
      { width: 35 },
      { width: 35 },
      { width: 35 },
      { width: 35 },
    ];

    // Add header row using shared function
    addHeader(ws, [
      exportedData.organization.name,
      ' ',
      ' ',
      ' ',
      ' ',
      'Fuel Sales Shift',
      ' ',
      ' ',
      ' ',
      ' ',
    ]);
    addHeader(ws, [' ', ' ', ' ', ' ', ' ', exportedData.shiftData.shiftNo]);
    addHeader(ws, [' ', ' ', ' ', ' ', ' ', exportedData.stationName]);

    // fuel prices
    const fuelPrices: any[] = [];

    if (exportedData.shiftData.fuel_prices.length) {
      for (const fp of exportedData.shiftData.fuel_prices) {
        const product = exportedData.productOptions?.find(
          (p: any) => p.id === fp.product_id
        );
        const name = product?.name || `Product ${fp.product_id}`;
        const price = fp.price;
        fuelPrices.push({ name, price });
      }
    }

    // construct cashier summary data
    const cashierSummary: any[] = [];

    if (exportedData.shiftData.cashiers.length) {
      for (const c of exportedData.shiftData.cashiers) {
        const cashier: any = {
          name: c.name,
          pumpDetails: [],
          cashDistributions: [],
          cashCollection: {
            expected: 0,
            collected: 0,
            shortOver: 0,
          },
          pump_readings: c.pump_readings,
        };

        // pump details
        if (c.pump_readings.length) {
          for (const pd of c.pump_readings) {
            const product = exportedData.productOptions?.find(
              (p: any) => p.id === pd.product_id
            );
            const pumpInfo = exportedData.fuel_pumps?.find(
              (p: any) => p.id === pd.fuel_pump_id
            );

            const difference = (pd.closing || 0) - (pd.opening || 0);

            const fuelPrice = fuelPrices.find(
              (fp) => fp.name === product?.name
            );

            const amount = difference * fuelPrice.price;
            const name = product?.name || `Product ${pd.product_id}`;
            const quantity = pd.closing - pd.opening;

            cashier.pumpDetails.push({ name, quantity, amount, pumpInfo });
          }
        }

        const cashDistributionSummary = Object.values(
          c.other_transactions?.reduce((acc: any, tx: any) => {
            const type = tx.debit_ledger.name;

            if (!acc[type]) {
              acc[type] = { type, count: 0, totalAmount: 0 };
            }

            acc[type].count++;
            acc[type].totalAmount += tx.amount;

            return acc;
          }, {})
        );

        // main ledger object
        const mainLedgerObj = {
          type: c.main_ledger?.name,
          count: 1,
          totalAmount: c.main_ledger?.amount,
        };

        // fuel vouchers object
        const voucherObj = {
          type: 'Fuel Vouchers',
          count: c.fuel_vouchers?.length,
          totalAmount: calculateCashierTotals(c).totalFuelVouchersAmount,
        };

        cashDistributionSummary.unshift(mainLedgerObj);
        cashDistributionSummary.push(voucherObj);

        const cashDistributionsTotalSummary = cashDistributionSummary.reduce(
          (acc: number, cd: any) => acc + cd.totalAmount,
          0
        );

        // cash distributions
        cashier.cashDistributions = cashDistributionSummary;

        // Calculate total products amount for this cashier
        const totalProductsAmount =
          c?.pump_readings?.reduce((total: number, pump: any) => {
            const productPrice =
              exportedData.shiftData.fuel_prices.find(
                (fp: any) => fp.product_id === pump.product_id
              )?.price || 0;
            const quantity = (pump.closing || 0) - (pump.opening || 0);
            return total + quantity * productPrice;
          }, 0) || 0;

        // Calculate adjustments amount for this cashier
        const adjustmentsAmount =
          c?.tank_adjustments?.reduce((total: number, adj: any) => {
            const productPrice =
              exportedData.shiftData.fuel_prices.find(
                (fp: any) => fp.product_id === adj.product_id
              )?.price || 0;
            if (adj.operator === '-') {
              return total + adj.quantity * productPrice;
            } else if (adj.operator === '+') {
              return total - adj.quantity * productPrice;
            }
            return total;
          }, 0) || 0;

        // Calculate total fuel vouchers amount for this cashier
        const totalFuelVouchersAmount =
          c?.fuel_vouchers?.reduce((total: number, fv: any) => {
            const productPrice =
              exportedData.shiftData.fuel_prices.find(
                (fp: any) => fp.product_id === fv.product_id
              )?.price || 0;
            return total + fv.quantity * productPrice;
          }, 0) || 0;

        // Calculate other transactions total for this cashier
        const otherTransactionsTotal =
          c.other_transactions?.reduce(
            (total: number, ot: any) => total + (ot.amount || 0),
            0
          ) || 0;

        // calculate short/over amount
        const expectedAmount =
          totalProductsAmount +
          adjustmentsAmount -
          totalFuelVouchersAmount -
          otherTransactionsTotal;

        const collectedAmount = c.collected_amount;

        const shortOrOver = collectedAmount - expectedAmount;
        // cash collection
        cashier.cashCollection.expected = expectedAmount;
        cashier.cashCollection.collected = c.collected_amount;
        cashier.cashCollection.shortOver =
          shortOrOver > 0
            ? `+${shortOrOver.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`
            : `${shortOrOver.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`;

        cashierSummary.push(cashier);
      }
    }

    // Add rows
    const row = ws.addRow([
      'Sales Outlet Shift',
      'Shift Start',
      'Shift End',
      'Recorded By',
      ...fuelPrices.map((p) => p.name),
    ]);
    row.height = 20;
    row.font = { size: 11, bold: true };
    row.alignment = { horizontal: 'left', vertical: 'middle' };

    // Apply header styling with borders and background
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' },
      };
    });

    const dataRow = ws.addRow([
      exportedData.shiftData.shift?.name,
      readableDate(exportedData.shiftData.shift_start, true),
      readableDate(exportedData.shiftData.shift_end, true),
      exportedData.shiftData.creator?.name || '',
      ...fuelPrices.map((p) => p.price),
    ]);

    dataRow.font = { size: 10 };
    dataRow.alignment = { horizontal: 'left', vertical: 'middle' };
    dataRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFFFF' },
    };

    dataRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };
    });

    if (!exportedData.withDetails) {
      // CASHIERS SUMMARY
      ws.mergeCells('A7:J7');
      ws.getCell('A7').value = 'Cashiers Summary';
      ws.getCell('A7').alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getCell('A7').font = { bold: true, size: 14 };

      ws.getCell('A8').value = 'Name';
      ws.getCell('A8').alignment = { horizontal: 'left', vertical: 'middle' };
      ws.getCell('A8').font = { bold: true, size: 11 };
      ws.getCell('A8').border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };
      ws.getCell('A8').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' },
      };

      ws.mergeCells('B8:D8');
      ws.getCell('B8').value = 'Pump Details';
      ws.getCell('B8').alignment = { horizontal: 'left', vertical: 'middle' };
      ws.getCell('B8').font = { bold: true, size: 11 };
      ws.getCell('B8').border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };
      ws.getCell('B8').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' },
      };
      ws.getCell('C8').border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };
      ws.getCell('C8').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' },
      };
      ws.getCell('D8').border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };
      ws.getCell('D8').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' },
      };

      ws.mergeCells('E8:G8');
      ws.getCell('E8').value = 'Cash Distributions';
      ws.getCell('E8').alignment = { horizontal: 'left', vertical: 'middle' };
      ws.getCell('E8').font = { bold: true, size: 11 };
      ws.getCell('E8').border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };
      ws.getCell('E8').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' },
      };
      ws.getCell('F8').border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };
      ws.getCell('F8').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' },
      };
      ws.getCell('G8').border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };
      ws.getCell('G8').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' },
      };

      ws.mergeCells('H8:J8');
      ws.getCell('H8').value = 'Cash Collection';
      ws.getCell('H8').alignment = { horizontal: 'left', vertical: 'middle' };
      ws.getCell('H8').font = { bold: true, size: 11 };
      ws.getCell('H8').border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };
      ws.getCell('H8').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' },
      };
      ws.getCell('I8').border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };
      ws.getCell('I8').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' },
      };
      ws.getCell('J8').border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };
      ws.getCell('J8').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' },
      };

      // SUB-TITLES ROW
      const subtitlesRow = ws.addRow([
        '',
        'Name',
        'Fuel',
        'Amount',
        'Description',
        'Count',
        'Amount',
        'Expected',
        'Collected',
        'Short/Over',
      ]);
      subtitlesRow.height = 20;
      subtitlesRow.font = { bold: true, size: 11 };
      subtitlesRow.alignment = { horizontal: 'left', vertical: 'middle' };

      subtitlesRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } },
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD9D9D9' },
        };
      });

      //     ACTUAL DATA    //
      // map the data to excel
      if (cashierSummary.length) {
        let currentRow = ws.lastRow?.number ?? 0;
        let rowIndex = 0;

        cashierSummary.forEach((cashier) => {
          const pumpLen = cashier.pumpDetails.length;
          const cashLen = cashier.cashDistributions.length;
          const maxLen = Math.max(pumpLen, cashLen) + 1;

          if (maxLen === 0) return;

          const startRow = currentRow + 1;
          const rowColor = rowIndex % 2 === 0 ? 'FFFFFFFF' : 'FFF8F8F8';

          // ====== CASHIER'S NAME
          ws.mergeCells(`A${startRow}:A${startRow + maxLen - 1}`);
          ws.getCell(`A${startRow}`).value = cashier.name;
          ws.getCell(`A${startRow}`).alignment = {
            horizontal: 'left',
            vertical: 'middle',
          };
          ws.getCell(`A${startRow}`).font = { size: 10 };
          ws.getCell(`A${startRow}`).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: rowColor },
          };
          ws.getCell(`A${startRow}`).border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } },
          };

          const totalPumoAmount = cashier.pump_readings.reduce(
            (acc: any, pump: any) => {
              const difference = (pump.closing || 0) - (pump.opening || 0);

              const fuelPrice = exportedData.shiftData.fuel_prices.find(
                (fp: any) => fp.product_id === pump.product_id
              );

              const amount = difference * fuelPrice.price;

              return acc + amount;
            },
            0
          );

          // PUMP DETAILS
          cashier.pumpDetails.forEach((pump: any, i: any) => {
            const row = startRow + i;
            ws.getCell(`B${row}`).value = pump.pumpInfo.name;
            ws.getCell(`B${row}`).alignment = {
              horizontal: 'left',
              vertical: 'middle',
            };
            ws.getCell(`B${row}`).font = { size: 10 };
            ws.getCell(`B${row}`).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: rowColor },
            };
            ws.getCell(`B${row}`).border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } },
            };

            ws.getCell(`C${row}`).value = pump.name;
            ws.getCell(`C${row}`).alignment = {
              horizontal: 'left',
              vertical: 'middle',
            };
            ws.getCell(`C${row}`).font = { size: 10 };
            ws.getCell(`C${row}`).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: rowColor },
            };
            ws.getCell(`C${row}`).border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } },
            };

            ws.getCell(`D${row}`).value = pump.amount.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
            ws.getCell(`D${row}`).alignment = {
              horizontal: 'right',
              vertical: 'middle',
            };
            ws.getCell(`D${row}`).font = { size: 10 };
            ws.getCell(`D${row}`).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: rowColor },
            };
            ws.getCell(`D${row}`).border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } },
            };
          });

          const pumptotalRow = startRow + cashier.pumpDetails.length;
          ws.mergeCells(`B${pumptotalRow}:C${pumptotalRow}`);
          ws.getCell(`B${pumptotalRow}`).value = 'TOTAL';
          ws.getCell(`B${pumptotalRow}`).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFC2C2C2' },
          };
          ws.getCell(`B${pumptotalRow}`).border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } },
          };

          ws.getCell(`D${pumptotalRow}`).value = totalPumoAmount.toLocaleString(
            'en-US',
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          );
          ws.getCell(`D${pumptotalRow}`).alignment = { horizontal: 'right' };
          ws.getCell(`D${pumptotalRow}`).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFC2C2C2' },
          };
          ws.getCell(`D${pumptotalRow}`).border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } },
          };

          const cashDistributionsTotalSummary =
            cashier.cashDistributions.reduce(
              (acc: any, cd: any) => acc + cd.totalAmount,
              0
            );

          // CASH DISTRIBUTIONS
          cashier.cashDistributions.forEach((cd: any, i: any) => {
            const row = startRow + i;
            ws.getCell(`E${row}`).value = cd.type;
            ws.getCell(`E${row}`).alignment = {
              horizontal: 'left',
              vertical: 'middle',
            };
            ws.getCell(`E${row}`).font = { size: 10 };
            ws.getCell(`E${row}`).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: rowColor },
            };
            ws.getCell(`E${row}`).border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } },
            };

            ws.getCell(`F${row}`).value = cd.count;
            ws.getCell(`F${row}`).alignment = {
              horizontal: 'right',
              vertical: 'middle',
            };
            ws.getCell(`F${row}`).font = { size: 10 };
            ws.getCell(`F${row}`).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: rowColor },
            };
            ws.getCell(`F${row}`).border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } },
            };

            ws.getCell(`G${row}`).value = cd.totalAmount.toLocaleString(
              'en-US',
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            );
            ws.getCell(`G${row}`).alignment = {
              horizontal: 'right',
              vertical: 'middle',
            };
            ws.getCell(`G${row}`).font = { size: 10 };
            ws.getCell(`G${row}`).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: rowColor },
            };
            ws.getCell(`G${row}`).border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } },
            };
          });

          const distributionstotalRow =
            startRow + cashier.cashDistributions.length;
          ws.mergeCells(`E${distributionstotalRow}:F${distributionstotalRow}`);
          ws.getCell(`E${distributionstotalRow}`).value = 'TOTAL';
          ws.getCell(`E${distributionstotalRow}`).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFC2C2C2' },
          };
          ws.getCell(`E${distributionstotalRow}`).border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } },
          };

          ws.getCell(`G${distributionstotalRow}`).value =
            cashDistributionsTotalSummary.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
          ws.getCell(`G${distributionstotalRow}`).alignment = {
            horizontal: 'right',
          };
          ws.getCell(`G${distributionstotalRow}`).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFC2C2C2' },
          };
          ws.getCell(`G${distributionstotalRow}`).border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } },
          };

          // CASH COLLECTIONS
          ws.mergeCells(`H${startRow}:H${startRow + maxLen - 1}`);
          ws.mergeCells(`I${startRow}:I${startRow + maxLen - 1}`);
          ws.mergeCells(`J${startRow}:J${startRow + maxLen - 1}`);

          ws.getCell(`H${startRow}:H${startRow + maxLen - 1}`).alignment = {
            horizontal: 'right',
            vertical: 'middle',
          };
          ws.getCell(`H${startRow}:H${startRow + maxLen - 1}`).font = {
            size: 10,
          };
          ws.getCell(`H${startRow}:H${startRow + maxLen - 1}`).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: rowColor },
          };
          ws.getCell(`H${startRow}:H${startRow + maxLen - 1}`).border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } },
          };

          ws.getCell(`I${startRow}:I${startRow + maxLen - 1}`).alignment = {
            horizontal: 'right',
            vertical: 'middle',
          };
          ws.getCell(`I${startRow}:I${startRow + maxLen - 1}`).font = {
            size: 10,
          };
          ws.getCell(`I${startRow}:I${startRow + maxLen - 1}`).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: rowColor },
          };
          ws.getCell(`I${startRow}:I${startRow + maxLen - 1}`).border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } },
          };

          ws.getCell(`J${startRow}:J${startRow + maxLen - 1}`).alignment = {
            horizontal: 'right',
            vertical: 'middle',
          };
          ws.getCell(`J${startRow}:J${startRow + maxLen - 1}`).font = {
            size: 10,
          };
          ws.getCell(`J${startRow}:J${startRow + maxLen - 1}`).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: rowColor },
          };
          ws.getCell(`J${startRow}:J${startRow + maxLen - 1}`).border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } },
          };

          ws.getCell(`H${startRow}`).value =
            cashier.cashCollection.expected.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
          ws.getCell(`I${startRow}`).value =
            cashier.cashCollection.collected.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
          ws.getCell(`J${startRow}`).value =
            cashier.cashCollection.shortOver.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });

          currentRow = startRow + maxLen - 1;
          rowIndex++;
        });

        // TOTALS
        let totalsRow = (ws.lastRow?.number ?? 0) - 1;
        ws.getCell(`A${totalsRow + 2}`).value = 'Totals';
        ws.getCell(`A${totalsRow + 2}`).font = { bold: true, size: 11 };
        ws.getCell(`A${totalsRow + 2}`).alignment = {
          horizontal: 'left',
          vertical: 'middle',
        };
        ws.getCell(`A${totalsRow + 2}`).border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } },
        };

        // pump details total
        ws.getCell(`B${totalsRow + 2}`).value = '';
        ws.getCell(`B${totalsRow + 2}`).border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } },
        };

        {
          pumpSummary.map((pump: any, index: number) => {
            const row = totalsRow + 2 + index;
            ws.getCell(`C${row}`).value = pump.type;
            ws.getCell(`C${row}`).font = { bold: true, size: 11 };
            ws.getCell(`C${row}`).alignment = {
              horizontal: 'left',
              vertical: 'middle',
            };
            ws.getCell(`C${row}`).border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } },
            };

            ws.getCell(`D${row}`).value = pump.totalDifference.toLocaleString(
              'en-US',
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            );
            ws.getCell(`D${row}`).font = { bold: true, size: 11 };
            ws.getCell(`D${row}`).alignment = {
              horizontal: 'right',
              vertical: 'middle',
            };
            ws.getCell(`D${row}`).border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } },
            };
          });
        }

        const pumpGrandTotals = totalsRow + 2 + pumpSummary.length;
        ws.getCell(`C${pumpGrandTotals}`).value = 'TOTAL';
        ws.getCell(`C${pumpGrandTotals}`).font = { bold: true, size: 11 };
        ws.getCell(`C${pumpGrandTotals}`).alignment = {
          horizontal: 'left',
          vertical: 'middle',
        };
        ws.getCell(`C${pumpGrandTotals}`).border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } },
        };

        ws.getCell(`D${pumpGrandTotals}`).value = pumpSummary
          ?.reduce((acc: any, pump: any) => acc + pump.totalDifference, 0)
          .toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        ws.getCell(`D${pumpGrandTotals}`).font = { bold: true, size: 11 };
        ws.getCell(`D${pumpGrandTotals}`).alignment = {
          horizontal: 'right',
          vertical: 'middle',
        };
        ws.getCell(`D${pumpGrandTotals}`).border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } },
        };

        {
          totalTransactionsSummary?.map((t: any, index) => {
            const row = totalsRow + 2 + index;
            ws.getCell(`E${row}`).value = t.type;
            ws.getCell(`E${row}`).font = { bold: true, size: 11 };
            ws.getCell(`E${row}`).alignment = {
              horizontal: 'left',
              vertical: 'middle',
            };
            ws.getCell(`E${row}`).border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } },
            };

            ws.getCell(`F${row}`).value = t.count;
            ws.getCell(`F${row}`).font = { bold: true, size: 11 };
            ws.getCell(`F${row}`).alignment = {
              horizontal: 'right',
              vertical: 'middle',
            };
            ws.getCell(`F${row}`).border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } },
            };

            ws.getCell(`G${row}`).value =
              t.totalAmount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }) || 0.0;
            ws.getCell(`G${row}`).font = { bold: true, size: 11 };
            ws.getCell(`G${row}`).alignment = {
              horizontal: 'right',
              vertical: 'middle',
            };
            ws.getCell(`G${row}`).border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } },
            };
          });
        }

        ws.getCell(`H${totalsRow + 2}`).value =
          totalExpectedAmount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        ws.getCell(`H${totalsRow + 2}`).font = { bold: true, size: 14 };
        ws.getCell(`H${totalsRow + 2}`).alignment = {
          horizontal: 'right',
          vertical: 'middle',
        };
        ws.getCell(`H${totalsRow + 2}`).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD9D9D9' },
        };
        ws.getCell(`H${totalsRow + 2}`).border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } },
        };

        ws.getCell(`I${totalsRow + 2}`).value =
          totalCollectedAmount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        ws.getCell(`I${totalsRow + 2}`).font = { bold: true, size: 14 };
        ws.getCell(`I${totalsRow + 2}`).alignment = {
          horizontal: 'right',
          vertical: 'middle',
        };
        ws.getCell(`I${totalsRow + 2}`).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD9D9D9' },
        };
        ws.getCell(`I${totalsRow + 2}`).border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } },
        };

        ws.getCell(`J${totalsRow + 2}`).value =
          totalShortOrOver > 0
            ? `+${totalShortOrOver.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`
            : `${totalShortOrOver.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`;
        ws.getCell(`J${totalsRow + 2}`).font = { bold: true, size: 14 };
        ws.getCell(`J${totalsRow + 2}`).alignment = {
          horizontal: 'right',
          vertical: 'middle',
        };
        ws.getCell(`J${totalsRow + 2}`).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD9D9D9' },
        };
        ws.getCell(`J${totalsRow + 2}`).border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } },
        };

        //   grand total
        const grandTotalRow = ws.addRow([
          '',
          '',
          '',
          '',
          'Grand Total',
          '',
          grandTotal,
          '',
          '',
          '',
        ]);
        grandTotalRow.height = 22;
        grandTotalRow.font = { bold: true, size: 11 };
        grandTotalRow.alignment = { horizontal: 'left', vertical: 'middle' };

        grandTotalRow.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } },
          };
          // cell.fill = {
          //   type: 'pattern',
          //   pattern: 'solid',
          //   fgColor: { argb: 'FFD9D9D9' },
          // };

          // Right-align numeric columns
          if (colNumber >= 6) {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          } else {
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
          }
        });
      }
    } else {
      if (exportedData.shiftData.cashiers.length) {
        exportedData.shiftData.cashiers?.forEach(
          (cashier: any, cashierIndex: number) => {
            const cashierTotals = calculateCashierTotals(cashier);
            const mergedReadings = mergeCashierPumpReadings(
              cashier.pump_readings || []
            );
            const totalPumoAmount = cashier.pump_readings.reduce(
              (acc: any, pump: any) => {
                const difference = (pump.closing || 0) - (pump.opening || 0);

                const fuelPrice = exportedData.shiftData.fuel_prices.find(
                  (fp: any) => fp.product_id === pump.product_id
                );

                const amount = difference * fuelPrice.price;

                return acc + amount;
              },
              0
            );

            // Calculate total products amount for this cashier
            const totalProductsAmount =
              cashier?.pump_readings?.reduce((total: any, pump: any) => {
                const productPrice =
                  exportedData.shiftData.fuel_prices.find(
                    (fp: any) => fp.product_id === pump.product_id
                  )?.price || 0;
                const quantity = (pump.closing || 0) - (pump.opening || 0);
                return total + quantity * productPrice;
              }, 0) || 0;

            // Calculate adjustments amount for this cashier
            const adjustmentsAmount =
              cashier?.tank_adjustments?.reduce((total: any, adj: any) => {
                const productPrice =
                  exportedData.shiftData.fuel_prices.find(
                    (fp: any) => fp.product_id === adj.product_id
                  )?.price || 0;
                if (adj.operator === '-') {
                  return total + adj.quantity * productPrice;
                } else if (adj.operator === '+') {
                  return total - adj.quantity * productPrice;
                }
                return total;
              }, 0) || 0;

            // Calculate total fuel vouchers amount for this cashier
            const totalFuelVouchersAmount =
              cashier?.fuel_vouchers?.reduce((total: any, fv: any) => {
                const productPrice =
                  exportedData.shiftData.fuel_prices.find(
                    (fp: any) => fp.product_id === fv.product_id
                  )?.price || 0;
                return total + fv.quantity * productPrice;
              }, 0) || 0;

            // Calculate other transactions total for this cashier
            const otherTransactionsTotal =
              cashier.other_transactions?.reduce(
                (total: any, ot: any) => total + (ot.amount || 0),
                0
              ) || 0;

            // calculate short/over amount
            const expectedAmount =
              totalProductsAmount +
              adjustmentsAmount -
              totalFuelVouchersAmount -
              otherTransactionsTotal;

            const collectedAmount = cashier.collected_amount;

            const shortOrOver = collectedAmount - expectedAmount;

            const cashierRow = (ws.lastRow?.number ?? 0) + cashierIndex;
            const row = ws.getRow(cashierRow);
            row.height = 20;
            // ws.mergeCells(`A${cashierRow + 2}:J${cashierRow + 2}`);
            // ws.getCell(`A${cashierRow + 2}`).value =
            //   cashier.name + ' - Summary';
            // ws.getCell(`A${cashierRow + 2}`).alignment = {
            //   horizontal: 'center',
            //   vertical: 'middle',
            // };
            // ws.getCell(`A${cashierRow + 2}`).font = { bold: true, size: 16 };
            // ws.getCell(`A${cashierRow + 2}`).fill = {
            //   type: 'pattern',
            //   pattern: 'solid',
            //   fgColor: { argb: 'FFD9D9D9' },
            // };
            // ws.getCell(`A${cashierRow + 2}`).border = {
            //   top: { style: 'thin', color: { argb: 'FF000000' } },
            //   bottom: { style: 'thin', color: { argb: 'FF000000' } },
            //   left: { style: 'thin', color: { argb: 'FF000000' } },
            //   right: { style: 'thin', color: { argb: 'FF000000' } },
            // };

            // ws.mergeCells(`A${cashierRow + 3}:G${cashierRow + 3}`);
            // ws.getCell(`A${cashierRow + 3}`).value = 'Item';
            // ws.getCell(`A${cashierRow + 3}`).alignment = {
            //   horizontal: 'left',
            //   vertical: 'middle',
            // };
            // ws.getCell(`A${cashierRow + 3}`).font = { bold: true, size: 11 };
            // ws.getCell(`A${cashierRow + 3}`).fill = {
            //   type: 'pattern',
            //   pattern: 'solid',
            //   fgColor: { argb: 'FFD9D9D9' },
            // };
            // ws.getCell(`A${cashierRow + 3}`).border = {
            //   top: { style: 'thin', color: { argb: 'FF000000' } },
            //   bottom: { style: 'thin', color: { argb: 'FF000000' } },
            //   left: { style: 'thin', color: { argb: 'FF000000' } },
            //   right: { style: 'thin', color: { argb: 'FF000000' } },
            // };

            // ws.mergeCells(`H${cashierRow + 3}:J${cashierRow + 3}`);
            // ws.getCell(`H${cashierRow + 3}`).value = 'Amount';
            // ws.getCell(`H${cashierRow + 3}`).alignment = {
            //   horizontal: 'left',
            //   vertical: 'middle',
            // };
            // ws.getCell(`H${cashierRow + 3}`).font = { bold: true, size: 11 };
            // ws.getCell(`H${cashierRow + 3}`).fill = {
            //   type: 'pattern',
            //   pattern: 'solid',
            //   fgColor: { argb: 'FFD9D9D9' },
            // };
            // ws.getCell(`H${cashierRow + 3}`).border = {
            //   top: { style: 'thin', color: { argb: 'FF000000' } },
            //   bottom: { style: 'thin', color: { argb: 'FF000000' } },
            //   left: { style: 'thin', color: { argb: 'FF000000' } },
            //   right: { style: 'thin', color: { argb: 'FF000000' } },
            // };

            // ws.mergeCells(`A${cashierRow + 4}:G${cashierRow + 4}`);
            // ws.getCell(`A${cashierRow + 4}`).value = 'Total Sales Amount';
            // ws.getCell(`A${cashierRow + 4}`).alignment = {
            //   horizontal: 'left',
            //   vertical: 'middle',
            // };
            // ws.getCell(`A${cashierRow + 4}`).font = { size: 10 };
            // ws.getCell(`A${cashierRow + 4}`).fill = {
            //   type: 'pattern',
            //   pattern: 'solid',
            //   fgColor: { argb: 'FFFFFFFF' },
            // };
            // ws.getCell(`A${cashierRow + 4}`).border = {
            //   top: { style: 'thin', color: { argb: 'FF000000' } },
            //   bottom: { style: 'thin', color: { argb: 'FF000000' } },
            //   left: { style: 'thin', color: { argb: 'FF000000' } },
            //   right: { style: 'thin', color: { argb: 'FF000000' } },
            // };

            // ws.mergeCells(`H${cashierRow + 4}:J${cashierRow + 4}`);
            // ws.getCell(`H${cashierRow + 4}`).value =
            //   cashierTotals.netSales.toLocaleString('en-US', {
            //     minimumFractionDigits: 2,
            //     maximumFractionDigits: 2,
            //   });
            // ws.getCell(`H${cashierRow + 4}`).alignment = {
            //   horizontal: 'right',
            //   vertical: 'middle',
            // };
            // ws.getCell(`H${cashierRow + 4}`).font = { size: 10 };
            // ws.getCell(`H${cashierRow + 4}`).fill = {
            //   type: 'pattern',
            //   pattern: 'solid',
            //   fgColor: { argb: 'FFFFFFFF' },
            // };
            // ws.getCell(`H${cashierRow + 4}`).border = {
            //   top: { style: 'thin', color: { argb: 'FF000000' } },
            //   bottom: { style: 'thin', color: { argb: 'FF000000' } },
            //   left: { style: 'thin', color: { argb: 'FF000000' } },
            //   right: { style: 'thin', color: { argb: 'FF000000' } },
            // };

            // ws.mergeCells(`A${cashierRow + 5}:G${cashierRow + 5}`);
            // ws.getCell(`A${cashierRow + 5}`).value = 'Fuel Vouchers Total';
            // ws.getCell(`A${cashierRow + 5}`).alignment = {
            //   horizontal: 'left',
            //   vertical: 'middle',
            // };
            // ws.getCell(`A${cashierRow + 5}`).font = { size: 10 };
            // ws.getCell(`A${cashierRow + 5}`).fill = {
            //   type: 'pattern',
            //   pattern: 'solid',
            //   fgColor: { argb: 'FFF8F8F8' },
            // };
            // ws.getCell(`A${cashierRow + 5}`).border = {
            //   top: { style: 'thin', color: { argb: 'FF000000' } },
            //   bottom: { style: 'thin', color: { argb: 'FF000000' } },
            //   left: { style: 'thin', color: { argb: 'FF000000' } },
            //   right: { style: 'thin', color: { argb: 'FF000000' } },
            // };

            // ws.mergeCells(`H${cashierRow + 5}:J${cashierRow + 5}`);
            // ws.getCell(`H${cashierRow + 5}`).value =
            //   cashierTotals.totalFuelVouchersAmount.toLocaleString('en-US', {
            //     minimumFractionDigits: 2,
            //     maximumFractionDigits: 2,
            //   });
            // ws.getCell(`H${cashierRow + 5}`).alignment = {
            //   horizontal: 'right',
            //   vertical: 'middle',
            // };
            // ws.getCell(`H${cashierRow + 5}`).font = { size: 10 };
            // ws.getCell(`H${cashierRow + 5}`).fill = {
            //   type: 'pattern',
            //   pattern: 'solid',
            //   fgColor: { argb: 'FFF8F8F8' },
            // };
            // ws.getCell(`H${cashierRow + 5}`).border = {
            //   top: { style: 'thin', color: { argb: 'FF000000' } },
            //   bottom: { style: 'thin', color: { argb: 'FF000000' } },
            //   left: { style: 'thin', color: { argb: 'FF000000' } },
            //   right: { style: 'thin', color: { argb: 'FF000000' } },
            // };

            // ws.mergeCells(`A${cashierRow + 6}:G${cashierRow + 6}`);
            // ws.getCell(`A${cashierRow + 6}`).value = 'Cash Remaining';
            // ws.getCell(`A${cashierRow + 6}`).alignment = {
            //   horizontal: 'left',
            //   vertical: 'middle',
            // };
            // ws.getCell(`A${cashierRow + 6}`).font = { size: 10 };
            // ws.getCell(`A${cashierRow + 6}`).fill = {
            //   type: 'pattern',
            //   pattern: 'solid',
            //   fgColor: { argb: 'FFFFFFFF' },
            // };
            // ws.getCell(`A${cashierRow + 6}`).border = {
            //   top: { style: 'thin', color: { argb: 'FF000000' } },
            //   bottom: { style: 'thin', color: { argb: 'FF000000' } },
            //   left: { style: 'thin', color: { argb: 'FF000000' } },
            //   right: { style: 'thin', color: { argb: 'FF000000' } },
            // };

            // ws.mergeCells(`H${cashierRow + 6}:J${cashierRow + 6}`);
            // ws.getCell(`H${cashierRow + 6}`).value =
            //   cashierTotals.cashRemaining.toLocaleString('en-US', {
            //     minimumFractionDigits: 2,
            //     maximumFractionDigits: 2,
            //   });
            // ws.getCell(`H${cashierRow + 6}`).alignment = {
            //   horizontal: 'right',
            //   vertical: 'middle',
            // };
            // ws.getCell(`H${cashierRow + 6}`).font = { size: 10 };
            // ws.getCell(`H${cashierRow + 6}`).fill = {
            //   type: 'pattern',
            //   pattern: 'solid',
            //   fgColor: { argb: 'FFFFFFFF' },
            // };
            // ws.getCell(`H${cashierRow + 6}`).border = {
            //   top: { style: 'thin', color: { argb: 'FF000000' } },
            //   bottom: { style: 'thin', color: { argb: 'FF000000' } },
            //   left: { style: 'thin', color: { argb: 'FF000000' } },
            //   right: { style: 'thin', color: { argb: 'FF000000' } },
            // };

            //   PUMP READINGS
            const pumpReadingsRow = ws.lastRow?.number ?? 0;
            ws.mergeCells(`A${pumpReadingsRow + 2}:G${pumpReadingsRow + 2}`);
            ws.getCell(`A${pumpReadingsRow + 2}`).value =
              cashier.name + ' - pump readings';
            ws.getCell(`A${pumpReadingsRow + 2}`).alignment = {
              horizontal: 'center',
              vertical: 'middle',
            };
            ws.getCell(`A${pumpReadingsRow + 2}`).font = {
              bold: true,
              size: 16,
            };
            ws.getCell(`A${pumpReadingsRow + 2}`).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFD9D9D9' },
            };
            ws.getCell(`A${pumpReadingsRow + 2}`).border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } },
            };

            // ws.mergeCells(`A${pumpReadingsRow + 3}:B${pumpReadingsRow + 3}`);
            ws.getCell(`A${pumpReadingsRow + 3}`).value = 'Pump';
            ws.getCell(`A${pumpReadingsRow + 3}`).alignment = {
              horizontal: 'left',
              vertical: 'middle',
            };
            ws.getCell(`A${pumpReadingsRow + 3}`).font = {
              bold: true,
              size: 11,
            };
            ws.getCell(`A${pumpReadingsRow + 3}`).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFD9D9D9' },
            };
            ws.getCell(`A${pumpReadingsRow + 3}`).border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } },
            };

            // ws.mergeCells(`B${pumpReadingsRow + 3}:C${pumpReadingsRow + 3}`);
            ws.getCell(`B${pumpReadingsRow + 3}`).value = 'Product';
            ws.getCell(`B${pumpReadingsRow + 3}`).alignment = {
              horizontal: 'left',
              vertical: 'middle',
            };
            ws.getCell(`B${pumpReadingsRow + 3}`).font = {
              bold: true,
              size: 11,
            };
            ws.getCell(`B${pumpReadingsRow + 3}`).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFD9D9D9' },
            };
            ws.getCell(`B${pumpReadingsRow + 3}`).border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } },
            };

            // ws.mergeCells(`D${pumpReadingsRow + 3}:E${pumpReadingsRow + 3}`);
            ws.getCell(`C${pumpReadingsRow + 3}`).value = 'Opening';
            ws.getCell(`C${pumpReadingsRow + 3}`).alignment = {
              horizontal: 'left',
              vertical: 'middle',
            };
            ws.getCell(`C${pumpReadingsRow + 3}`).font = {
              bold: true,
              size: 11,
            };
            ws.getCell(`C${pumpReadingsRow + 3}`).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFD9D9D9' },
            };
            ws.getCell(`C${pumpReadingsRow + 3}`).border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } },
            };

            // ws.mergeCells(`F${pumpReadingsRow + 3}:G${pumpReadingsRow + 3}`);
            ws.getCell(`D${pumpReadingsRow + 3}`).value = 'Closing';
            ws.getCell(`D${pumpReadingsRow + 3}`).alignment = {
              horizontal: 'left',
              vertical: 'middle',
            };
            ws.getCell(`D${pumpReadingsRow + 3}`).font = {
              bold: true,
              size: 11,
            };
            ws.getCell(`D${pumpReadingsRow + 3}`).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFD9D9D9' },
            };
            ws.getCell(`D${pumpReadingsRow + 3}`).border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } },
            };

            // ws.mergeCells(`I${pumpReadingsRow + 3}:J${pumpReadingsRow + 3}`);
            ws.getCell(`E${pumpReadingsRow + 3}`).value = 'Difference';
            ws.getCell(`E${pumpReadingsRow + 3}`).alignment = {
              horizontal: 'left',
              vertical: 'middle',
            };
            ws.getCell(`E${pumpReadingsRow + 3}`).font = {
              bold: true,
              size: 11,
            };
            ws.getCell(`E${pumpReadingsRow + 3}`).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFD9D9D9' },
            };
            ws.getCell(`E${pumpReadingsRow + 3}`).border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } },
            };

            // ws.mergeCells(`I${pumpReadingsRow + 3}:J${pumpReadingsRow + 3}`);
            ws.getCell(`F${pumpReadingsRow + 3}`).value = 'Price';
            ws.getCell(`F${pumpReadingsRow + 3}`).alignment = {
              horizontal: 'left',
              vertical: 'middle',
            };
            ws.getCell(`F${pumpReadingsRow + 3}`).font = {
              bold: true,
              size: 11,
            };
            ws.getCell(`F${pumpReadingsRow + 3}`).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFD9D9D9' },
            };
            ws.getCell(`F${pumpReadingsRow + 3}`).border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } },
            };

            // ws.mergeCells(`I${pumpReadingsRow + 3}:J${pumpReadingsRow + 3}`);
            ws.getCell(`G${pumpReadingsRow + 3}`).value = 'Amount';
            ws.getCell(`G${pumpReadingsRow + 3}`).alignment = {
              horizontal: 'left',
              vertical: 'middle',
            };
            ws.getCell(`G${pumpReadingsRow + 3}`).font = {
              bold: true,
              size: 11,
            };
            ws.getCell(`G${pumpReadingsRow + 3}`).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFD9D9D9' },
            };
            ws.getCell(`G${pumpReadingsRow + 3}`).border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } },
            };
            {
              cashier.pump_readings.forEach((pump: any, index: number) => {
                const pumpInfo = exportedData.fuel_pumps?.find(
                  (p: any) => p.id === pump.fuel_pump_id
                );
                const product = exportedData.productOptions?.find(
                  (p: any) => p.id === pump.product_id
                );
                const difference = (pump.closing || 0) - (pump.opening || 0);

                const price =
                  exportedData.shiftData.fuel_prices.find(
                    (p: any) => p.product_id === pump.product.id
                  )?.price || 0;

                const adjustmentsQty = (cashier.tank_adjustments || [])
                  .filter((adj: any) => adj.product_id === pump.product.id)
                  .reduce((sum: any, adj: any) => {
                    if (adj.operator === '+') {
                      return sum - adj.quantity;
                    } else if (adj.operator === '-') {
                      return sum + adj.quantity;
                    }
                    return sum;
                  }, 0);

                const totalQty = difference + adjustmentsQty;
                const totalAmount = totalQty * price;

                const pumpRow = (ws.lastRow?.number ?? 0) + 1;
                // ws.mergeCells(`A${pumpRow}:B${pumpRow}`);
                ws.getCell(`A${pumpRow}`).value =
                  pumpInfo?.name || `Pump ${pump.fuel_pump_id}`;
                ws.getCell(`A${pumpRow}`).alignment = {
                  horizontal: 'left',
                  vertical: 'middle',
                };
                ws.getCell(`A${pumpRow}`).border = {
                  top: { style: 'thin', color: { argb: 'FF000000' } },
                  bottom: { style: 'thin', color: { argb: 'FF000000' } },
                  left: { style: 'thin', color: { argb: 'FF000000' } },
                  right: { style: 'thin', color: { argb: 'FF000000' } },
                };

                // ws.mergeCells(`B${pumpRow}:C${pumpRow}`);
                ws.getCell(`B${pumpRow}`).value =
                  product?.name || `Product ${pump.product_id}`;
                ws.getCell(`B${pumpRow}`).alignment = {
                  horizontal: 'left',
                  vertical: 'middle',
                };
                ws.getCell(`B${pumpRow}`).border = {
                  top: { style: 'thin', color: { argb: 'FF000000' } },
                  bottom: { style: 'thin', color: { argb: 'FF000000' } },
                  left: { style: 'thin', color: { argb: 'FF000000' } },
                  right: { style: 'thin', color: { argb: 'FF000000' } },
                };

                // ws.mergeCells(`D${pumpRow}:E${pumpRow}`);
                ws.getCell(`C${pumpRow}`).value = (
                  pump.opening || 0
                ).toLocaleString('en-US', {
                  minimumFractionDigits: 3,
                  maximumFractionDigits: 3,
                });
                ws.getCell(`C${pumpRow}`).alignment = {
                  horizontal: 'right',
                  vertical: 'middle',
                };
                ws.getCell(`C${pumpRow}`).border = {
                  top: { style: 'thin', color: { argb: 'FF000000' } },
                  bottom: { style: 'thin', color: { argb: 'FF000000' } },
                  left: { style: 'thin', color: { argb: 'FF000000' } },
                  right: { style: 'thin', color: { argb: 'FF000000' } },
                };

                // ws.mergeCells(`F${pumpRow}:G${pumpRow}`);
                ws.getCell(`D${pumpRow}`).value = (
                  pump.closing || 0
                ).toLocaleString('en-US', {
                  minimumFractionDigits: 3,
                  maximumFractionDigits: 3,
                });
                ws.getCell(`D${pumpRow}`).alignment = {
                  horizontal: 'right',
                  vertical: 'middle',
                };
                ws.getCell(`D${pumpRow}`).border = {
                  top: { style: 'thin', color: { argb: 'FF000000' } },
                  bottom: { style: 'thin', color: { argb: 'FF000000' } },
                  left: { style: 'thin', color: { argb: 'FF000000' } },
                  right: { style: 'thin', color: { argb: 'FF000000' } },
                };

                // ws.mergeCells(`I${pumpRow}:J${pumpRow}`);
                ws.getCell(`E${pumpRow}`).value = difference.toLocaleString(
                  'en-US',
                  {
                    minimumFractionDigits: 3,
                    maximumFractionDigits: 3,
                  }
                );
                ws.getCell(`E${pumpRow}`).alignment = {
                  horizontal: 'right',
                  vertical: 'middle',
                };
                ws.getCell(`E${pumpRow}`).border = {
                  top: { style: 'thin', color: { argb: 'FF000000' } },
                  bottom: { style: 'thin', color: { argb: 'FF000000' } },
                  left: { style: 'thin', color: { argb: 'FF000000' } },
                  right: { style: 'thin', color: { argb: 'FF000000' } },
                };

                // ws.mergeCells(`I${pumpRow}:J${pumpRow}`);
                ws.getCell(`F${pumpRow}`).value = price.toLocaleString(
                  'en-US',
                  {
                    minimumFractionDigits: 3,
                    maximumFractionDigits: 3,
                  }
                );
                ws.getCell(`F${pumpRow}`).alignment = {
                  horizontal: 'right',
                  vertical: 'middle',
                };
                ws.getCell(`F${pumpRow}`).border = {
                  top: { style: 'thin', color: { argb: 'FF000000' } },
                  bottom: { style: 'thin', color: { argb: 'FF000000' } },
                  left: { style: 'thin', color: { argb: 'FF000000' } },
                  right: { style: 'thin', color: { argb: 'FF000000' } },
                };

                // ws.mergeCells(`I${pumpRow}:J${pumpRow}`);
                ws.getCell(`G${pumpRow}`).value = totalAmount.toLocaleString(
                  'en-US',
                  {
                    minimumFractionDigits: 3,
                    maximumFractionDigits: 3,
                  }
                );
                ws.getCell(`G${pumpRow}`).alignment = {
                  horizontal: 'right',
                  vertical: 'middle',
                };
                ws.getCell(`G${pumpRow}`).border = {
                  top: { style: 'thin', color: { argb: 'FF000000' } },
                  bottom: { style: 'thin', color: { argb: 'FF000000' } },
                  left: { style: 'thin', color: { argb: 'FF000000' } },
                  right: { style: 'thin', color: { argb: 'FF000000' } },
                };
              });
            }
            const pumpTotalsRow = (ws.lastRow?.number ?? 0) + 1;
            ws.mergeCells(`A${pumpTotalsRow}:F${pumpTotalsRow}`);
            ws.getCell(`A${pumpTotalsRow}`).value = 'Tatoal Amount';
            ws.getCell(`A${pumpTotalsRow}`).alignment = {
              horizontal: 'left',
              vertical: 'middle',
            };
            ws.getCell(`A${pumpTotalsRow}`).font = {
              bold: true,
              size: 11,
            };
            ws.getCell(`A${pumpTotalsRow}`).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFD9D9D9' },
            };
            ws.getCell(`A${pumpTotalsRow}`).border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } },
            };

            ws.getCell(`G${pumpTotalsRow}`).value =
              totalPumoAmount.toLocaleString('en-US', {
                minimumFractionDigits: 3,
                maximumFractionDigits: 3,
              });
            ws.getCell(`G${pumpTotalsRow}`).alignment = {
              horizontal: 'right',
              vertical: 'middle',
            };
            ws.getCell(`G${pumpTotalsRow}`).font = {
              bold: true,
              size: 11,
            };
            ws.getCell(`G${pumpTotalsRow}`).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFD9D9D9' },
            };
            ws.getCell(`G${pumpTotalsRow}`).border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } },
            };

            //   CASH DISTRIBUTIONS
            if (cashier.main_ledger || cashier.other_transactions?.length > 0) {
              const cashDistributionsRow = (ws.lastRow?.number ?? 0) + 1;
              ws.mergeCells(
                `A${cashDistributionsRow + 1}:G${cashDistributionsRow + 1}`
              );
              ws.getCell(`A${cashDistributionsRow + 1}`).value =
                cashier.name + ' - Cash Distributions';
              ws.getCell(`A${cashDistributionsRow + 1}`).alignment = {
                horizontal: 'center',
                vertical: 'middle',
              };
              ws.getCell(`A${cashDistributionsRow + 1}`).font = {
                bold: true,
                size: 14,
              };

              ws.mergeCells(
                `A${cashDistributionsRow + 2}:B${cashDistributionsRow + 2}`
              );
              ws.getCell(`A${cashDistributionsRow + 2}`).value = 'Account';
              ws.getCell(`A${cashDistributionsRow + 2}`).alignment = {
                horizontal: 'left',
                vertical: 'middle',
              };
              ws.getCell(`A${cashDistributionsRow + 2}`).font = {
                bold: true,
                size: 11,
              };
              ws.getCell(`A${cashDistributionsRow + 2}`).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD9D9D9' },
              };
              ws.getCell(`A${cashDistributionsRow + 2}`).border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } },
              };

              ws.mergeCells(
                `C${cashDistributionsRow + 2}:E${cashDistributionsRow + 2}`
              );
              ws.getCell(`C${cashDistributionsRow + 2}`).value = 'Narrration';
              ws.getCell(`C${cashDistributionsRow + 2}`).alignment = {
                horizontal: 'left',
                vertical: 'middle',
              };
              ws.getCell(`C${cashDistributionsRow + 2}`).font = {
                bold: true,
                size: 11,
              };
              ws.getCell(`C${cashDistributionsRow + 2}`).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD9D9D9' },
              };
              ws.getCell(`C${cashDistributionsRow + 2}`).border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } },
              };

              ws.mergeCells(
                `F${cashDistributionsRow + 2}:G${cashDistributionsRow + 2}`
              );
              ws.getCell(`F${cashDistributionsRow + 2}`).value = 'Amount';
              ws.getCell(`F${cashDistributionsRow + 2}`).alignment = {
                horizontal: 'left',
                vertical: 'middle',
              };
              ws.getCell(`F${cashDistributionsRow + 2}`).font = {
                bold: true,
                size: 11,
              };
              ws.getCell(`F${cashDistributionsRow + 2}`).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD9D9D9' },
              };
              ws.getCell(`F${cashDistributionsRow + 2}`).border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } },
              };

              if (cashier.main_ledger) {
                ws.mergeCells(
                  `A${cashDistributionsRow + 3}:B${cashDistributionsRow + 3}`
                );
                ws.getCell(`A${cashDistributionsRow + 3}`).value =
                  cashier.main_ledger.name ||
                  `Ledger ${cashier.main_ledger.id}`;
                ws.getCell(`A${cashDistributionsRow + 3}`).alignment = {
                  horizontal: 'left',
                  vertical: 'middle',
                };
                ws.getCell(`A${cashDistributionsRow + 3}`).border = {
                  top: { style: 'thin', color: { argb: 'FF000000' } },
                  bottom: { style: 'thin', color: { argb: 'FF000000' } },
                  left: { style: 'thin', color: { argb: 'FF000000' } },
                  right: { style: 'thin', color: { argb: 'FF000000' } },
                };

                ws.mergeCells(
                  `C${cashDistributionsRow + 3}:E${cashDistributionsRow + 3}`
                );
                ws.getCell(`C${cashDistributionsRow + 3}`).value =
                  cashier.narration || '';
                ws.getCell(`C${cashDistributionsRow + 3}`).alignment = {
                  horizontal: 'left',
                  vertical: 'middle',
                };
                ws.getCell(`C${cashDistributionsRow + 3}`).border = {
                  top: { style: 'thin', color: { argb: 'FF000000' } },
                  bottom: { style: 'thin', color: { argb: 'FF000000' } },
                  left: { style: 'thin', color: { argb: 'FF000000' } },
                  right: { style: 'thin', color: { argb: 'FF000000' } },
                };

                ws.mergeCells(
                  `F${cashDistributionsRow + 3}:G${cashDistributionsRow + 3}`
                );
                ws.getCell(`G${cashDistributionsRow + 3}`).value = (
                  cashier.main_ledger.amount || 0
                ).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                });
                ws.getCell(`G${cashDistributionsRow + 3}`).alignment = {
                  horizontal: 'right',
                  vertical: 'middle',
                };
                ws.getCell(`G${cashDistributionsRow + 3}`).border = {
                  top: { style: 'thin', color: { argb: 'FF000000' } },
                  bottom: { style: 'thin', color: { argb: 'FF000000' } },
                  left: { style: 'thin', color: { argb: 'FF000000' } },
                  right: { style: 'thin', color: { argb: 'FF000000' } },
                };
              }

              cashier.other_transactions?.forEach(
                (transaction: any, index: any) => {
                  const ledger =
                    cashier.ledgers?.find(
                      (l: any) => l.id === transaction.id
                    ) ||
                    (transaction?.debit_ledger
                      ? { name: transaction.debit_ledger.name }
                      : { name: `Transaction ${index + 1}` });

                  const otherTransctionsRow = (ws.lastRow?.number ?? 0) + 1;
                  ws.mergeCells(
                    `A${otherTransctionsRow}:B${otherTransctionsRow}`
                  );
                  ws.getCell(`A${otherTransctionsRow}`).value = ledger.name;
                  ws.getCell(`A${otherTransctionsRow}`).alignment = {
                    horizontal: 'left',
                    vertical: 'middle',
                  };
                  ws.getCell(`A${otherTransctionsRow}`).border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } },
                  };

                  ws.mergeCells(
                    `C${otherTransctionsRow}:E${otherTransctionsRow}`
                  );
                  ws.getCell(`C${otherTransctionsRow}`).value =
                    transaction.narration || '';
                  ws.getCell(`C${otherTransctionsRow}`).alignment = {
                    horizontal: 'left',
                    vertical: 'middle',
                  };
                  ws.getCell(`C${otherTransctionsRow}`).border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } },
                  };

                  ws.mergeCells(
                    `F${otherTransctionsRow}:G${otherTransctionsRow}`
                  );
                  ws.getCell(`F${otherTransctionsRow}`).value = (
                    transaction.amount || 0
                  ).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  });
                  ws.getCell(`F${otherTransctionsRow}`).alignment = {
                    horizontal: 'right',
                    vertical: 'middle',
                  };
                  ws.getCell(`F${otherTransctionsRow}`).border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } },
                  };
                }
              );

              const distributionTotalsRow = (ws.lastRow?.number ?? 0) + 1;
              ws.mergeCells(
                `A${distributionTotalsRow}:E${distributionTotalsRow}`
              );
              ws.getCell(`A${distributionTotalsRow}`).value =
                'Total Distrinuted';
              ws.getCell(`A${distributionTotalsRow}`).alignment = {
                horizontal: 'left',
                vertical: 'middle',
              };
              ws.getCell(`A${distributionTotalsRow}`).font = {
                bold: true,
                size: 11,
              };
              ws.getCell(`A${distributionTotalsRow}`).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD9D9D9' },
              };
              ws.getCell(`A${distributionTotalsRow}`).border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } },
              };

              ws.mergeCells(
                `F${distributionTotalsRow}:G${distributionTotalsRow}`
              );
              ws.getCell(`F${distributionTotalsRow}`).value = (
                cashierTotals.otherTransactionsTotal +
                (cashier.main_ledger?.amount || 0)
              ).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
              ws.getCell(`F${distributionTotalsRow}`).alignment = {
                horizontal: 'right',
                vertical: 'middle',
              };
              ws.getCell(`F${distributionTotalsRow}`).font = {
                bold: true,
                size: 11,
              };
              ws.getCell(`F${distributionTotalsRow}`).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD9D9D9' },
              };
              ws.getCell(`F${distributionTotalsRow}`).border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } },
              };

              // Cash Collected
              ws.mergeCells(
                `A${distributionTotalsRow + 1}:E${distributionTotalsRow + 1}`
              );
              ws.getCell(`A${distributionTotalsRow + 1}`).value =
                'Cash Collected';
              ws.getCell(`A${distributionTotalsRow + 1}`).alignment = {
                horizontal: 'left',
                vertical: 'middle',
              };
              ws.getCell(`A${distributionTotalsRow + 1}`).font = {
                bold: true,
                size: 11,
              };
              ws.getCell(`A${distributionTotalsRow + 1}`).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD9D9D9' },
              };
              ws.getCell(`A${distributionTotalsRow + 1}`).border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } },
              };

              ws.mergeCells(
                `F${distributionTotalsRow + 1}:G${distributionTotalsRow + 1}`
              );
              ws.getCell(`F${distributionTotalsRow + 1}`).value =
                cashier.collected_amount.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) +
                ' ' +
                (shortOrOver > 0 ? '(over)' : '(short)');
              ws.getCell(`F${distributionTotalsRow + 1}`).alignment = {
                horizontal: 'right',
                vertical: 'middle',
              };
              ws.getCell(`F${distributionTotalsRow + 1}`).font = {
                bold: true,
                size: 11,
              };
              ws.getCell(`F${distributionTotalsRow + 1}`).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD9D9D9' },
              };
              ws.getCell(`F${distributionTotalsRow + 1}`).border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } },
              };
            }

            //   FUEL VOUCHERS
            if (cashier.fuel_vouchers.length > 0) {
              const FvRow = ws.lastRow?.number ?? 0;
              ws.mergeCells(`A${FvRow + 2}:G${FvRow + 2}`);
              ws.getCell(`A${FvRow + 2}`).value =
                cashier.name + ' - Fuel Vouchers';
              ws.getCell(`A${FvRow + 2}`).alignment = {
                horizontal: 'center',
                vertical: 'middle',
              };
              ws.getCell(`A${FvRow + 2}`).font = { bold: true, size: 14 };

              // ws.mergeCells(`A${FvRow + 3}:C${FvRow + 3}`);
              ws.getCell(`A${FvRow + 3}`).value = 'Voucher No';
              ws.getCell(`A${FvRow + 3}`).alignment = {
                horizontal: 'left',
                vertical: 'middle',
              };
              ws.getCell(`A${FvRow + 3}`).font = { bold: true, size: 11 };
              ws.getCell(`A${FvRow + 3}`).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD9D9D9' },
              };
              ws.getCell(`A${FvRow + 3}`).border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } },
              };

              ws.mergeCells(`B${FvRow + 3}:C${FvRow + 3}`);
              ws.getCell(`B${FvRow + 3}`).value = 'Client';
              ws.getCell(`B${FvRow + 3}`).alignment = {
                horizontal: 'left',
                vertical: 'middle',
              };
              ws.getCell(`B${FvRow + 3}`).font = { bold: true, size: 11 };
              ws.getCell(`B${FvRow + 3}`).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD9D9D9' },
              };
              ws.getCell(`B${FvRow + 3}`).border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } },
              };

              ws.getCell(`D${FvRow + 3}`).value = 'Narration';
              ws.getCell(`D${FvRow + 3}`).alignment = {
                horizontal: 'left',
                vertical: 'middle',
              };
              ws.getCell(`D${FvRow + 3}`).font = { bold: true, size: 11 };
              ws.getCell(`D${FvRow + 3}`).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD9D9D9' },
              };
              ws.getCell(`D${FvRow + 3}`).border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } },
              };

              ws.getCell(`E${FvRow + 3}`).value = 'Product';
              ws.getCell(`E${FvRow + 3}`).alignment = {
                horizontal: 'left',
                vertical: 'middle',
              };
              ws.getCell(`E${FvRow + 3}`).font = { bold: true, size: 11 };
              ws.getCell(`E${FvRow + 3}`).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD9D9D9' },
              };
              ws.getCell(`E${FvRow + 3}`).border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } },
              };

              ws.getCell(`F${FvRow + 3}`).value = 'Quantity';
              ws.getCell(`F${FvRow + 3}`).alignment = {
                horizontal: 'left',
                vertical: 'middle',
              };
              ws.getCell(`F${FvRow + 3}`).font = { bold: true, size: 11 };
              ws.getCell(`F${FvRow + 3}`).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD9D9D9' },
              };
              ws.getCell(`F${FvRow + 3}`).border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } },
              };

              ws.getCell(`G${FvRow + 3}`).value = 'Amount';
              ws.getCell(`G${FvRow + 3}`).alignment = {
                horizontal: 'left',
                vertical: 'middle',
              };
              ws.getCell(`G${FvRow + 3}`).font = { bold: true, size: 11 };
              ws.getCell(`G${FvRow + 3}`).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD9D9D9' },
              };
              ws.getCell(`G${FvRow + 3}`).border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } },
              };

              {
                cashier.fuel_vouchers.forEach((fv: any, index: number) => {
                  const product = exportedData.productOptions?.find(
                    (p: any) => p.id === fv.product_id
                  );
                  const price =
                    exportedData.shiftData.fuel_prices.find(
                      (p: any) => p.product_id === fv.product_id
                    )?.price || 0;
                  const amount = fv.quantity * price;

                  let fvLastRow = (ws.lastRow?.number ?? 0) + 1;
                  // ws.mergeCells(`A${fvLastRow}:C${fvLastRow}`);
                  ws.getCell(`A${fvLastRow}`).value =
                    fv.voucherNo || `FV-${index + 1}`;
                  ws.getCell(`A${fvLastRow}`).alignment = {
                    horizontal: 'left',
                    vertical: 'middle',
                  };
                  ws.getCell(`A${fvLastRow}`).border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } },
                  };

                  ws.mergeCells(`B${fvLastRow}:C${fvLastRow}`);
                  ws.getCell(`B${fvLastRow}`).value =
                    fv.stakeholder?.name || 'Internal Expense';
                  ws.getCell(`B${fvLastRow}`).alignment = {
                    horizontal: 'left',
                    vertical: 'middle',
                  };
                  ws.getCell(`B${fvLastRow}`).border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } },
                  };

                  ws.getCell(`D${fvLastRow}`).value = fv.narration || '-';
                  ws.getCell(`D${fvLastRow}`).alignment = {
                    horizontal: 'left',
                    vertical: 'middle',
                  };
                  ws.getCell(`D${fvLastRow}`).border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } },
                  };

                  ws.getCell(`E${fvLastRow}`).value =
                    product?.name || `Product ${fv.product_id}`;
                  ws.getCell(`E${fvLastRow}`).alignment = {
                    horizontal: 'left',
                    vertical: 'middle',
                  };
                  ws.getCell(`E${fvLastRow}`).border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } },
                  };

                  ws.getCell(`F${fvLastRow}`).value =
                    fv.quantity.toLocaleString('en-US', {
                      minimumFractionDigits: 3,
                      maximumFractionDigits: 3,
                    });
                  ws.getCell(`F${fvLastRow}`).alignment = {
                    horizontal: 'right',
                    vertical: 'middle',
                  };
                  ws.getCell(`F${fvLastRow}`).border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } },
                  };

                  ws.getCell(`G${fvLastRow}`).value = amount.toLocaleString(
                    'en-US',
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  );
                  ws.getCell(`G${fvLastRow}`).alignment = {
                    horizontal: 'right',
                    vertical: 'middle',
                  };
                  ws.getCell(`G${fvLastRow}`).border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } },
                  };
                });
              }
              let fvLastRow = (ws.lastRow?.number ?? 0) + 1;
              ws.mergeCells(`A${fvLastRow}:F${fvLastRow}`);
              ws.getCell(`A${fvLastRow}`).value = 'Cash Total Fuel Vouchers';
              ws.getCell(`A${fvLastRow}`).alignment = {
                horizontal: 'left',
                vertical: 'middle',
              };
              ws.getCell(`A${fvLastRow}`).font = { bold: true, size: 11 };
              ws.getCell(`A${fvLastRow}`).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD9D9D9' },
              };
              ws.getCell(`A${fvLastRow}`).border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } },
              };

              ws.getCell(`G${fvLastRow}`).value =
                cashierTotals.totalFuelVouchersAmount.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                });
              ws.getCell(`G${fvLastRow}`).alignment = {
                horizontal: 'right',
                vertical: 'middle',
              };
              ws.getCell(`G${fvLastRow}`).font = { bold: true, size: 11 };
              ws.getCell(`G${fvLastRow}`).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD9D9D9' },
              };
              ws.getCell(`G${fvLastRow}`).border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } },
              };
            }
          }
        );
      }
    }

    // DIPPING SUMMARY
    if (!hideDippingTable) {
      let dippingsRow = ws.lastRow?.number ?? 0;
      ws.mergeCells(`A${dippingsRow + 2}:J${dippingsRow + 2}`);
      ws.getCell(`A${dippingsRow + 2}`).value = 'Dipping Records';
      ws.getCell(`A${dippingsRow + 2}`).font = { bold: true, size: 14 };
      ws.getCell(`A${dippingsRow + 2}`).alignment = {
        horizontal: 'center',
        vertical: 'middle',
      };
      // columns
      ws.mergeCells(`A${dippingsRow + 3}:C${dippingsRow + 3}`);
      ws.getCell(`A${dippingsRow + 3}`).value = 'Tank';
      ws.getCell(`A${dippingsRow + 3}`).font = { bold: true, size: 11 };
      ws.getCell(`A${dippingsRow + 3}`).alignment = {
        horizontal: 'left',
        vertical: 'middle',
      };
      ws.getCell(`A${dippingsRow + 3}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' },
      };
      ws.getCell(`A${dippingsRow + 3}`).border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };

      ws.getCell(`D${dippingsRow + 3}`).value = 'Opening';
      ws.getCell(`D${dippingsRow + 3}`).font = { bold: true, size: 11 };
      ws.getCell(`D${dippingsRow + 3}`).alignment = {
        horizontal: 'left',
        vertical: 'middle',
      };
      ws.getCell(`D${dippingsRow + 3}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' },
      };
      ws.getCell(`D${dippingsRow + 3}`).border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };

      ws.getCell(`E${dippingsRow + 3}`).value = 'Purchase';
      ws.getCell(`E${dippingsRow + 3}`).font = { bold: true, size: 11 };
      ws.getCell(`E${dippingsRow + 3}`).alignment = {
        horizontal: 'left',
        vertical: 'middle',
      };
      ws.getCell(`E${dippingsRow + 3}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' },
      };
      ws.getCell(`E${dippingsRow + 3}`).border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };

      ws.getCell(`F${dippingsRow + 3}`).value = 'Total';
      ws.getCell(`F${dippingsRow + 3}`).font = { bold: true, size: 11 };
      ws.getCell(`F${dippingsRow + 3}`).alignment = {
        horizontal: 'left',
        vertical: 'middle',
      };
      ws.getCell(`F${dippingsRow + 3}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' },
      };
      ws.getCell(`F${dippingsRow + 3}`).border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };

      ws.getCell(`G${dippingsRow + 3}`).value = 'Closing';
      ws.getCell(`G${dippingsRow + 3}`).font = { bold: true, size: 11 };
      ws.getCell(`G${dippingsRow + 3}`).alignment = {
        horizontal: 'left',
        vertical: 'middle',
      };
      ws.getCell(`G${dippingsRow + 3}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' },
      };
      ws.getCell(`G${dippingsRow + 3}`).border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };

      ws.getCell(`H${dippingsRow + 3}`).value = 'Tank Difference';
      ws.getCell(`H${dippingsRow + 3}`).font = { bold: true, size: 11 };
      ws.getCell(`H${dippingsRow + 3}`).alignment = {
        horizontal: 'left',
        vertical: 'middle',
      };
      ws.getCell(`H${dippingsRow + 3}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' },
      };
      ws.getCell(`H${dippingsRow + 3}`).border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };

      ws.getCell(`I${dippingsRow + 3}`).value = 'Actual Sold';
      ws.getCell(`I${dippingsRow + 3}`).font = { bold: true, size: 11 };
      ws.getCell(`I${dippingsRow + 3}`).alignment = {
        horizontal: 'left',
        vertical: 'middle',
      };
      ws.getCell(`I${dippingsRow + 3}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' },
      };
      ws.getCell(`I${dippingsRow + 3}`).border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };

      ws.getCell(`J${dippingsRow + 3}`).value = 'Pos/Neg';
      ws.getCell(`J${dippingsRow + 3}`).font = { bold: true, size: 11 };
      ws.getCell(`J${dippingsRow + 3}`).alignment = {
        horizontal: 'left',
        vertical: 'middle',
      };
      ws.getCell(`J${dippingsRow + 3}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' },
      };
      ws.getCell(`J${dippingsRow + 3}`).border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };

      // dipping data
      {
        exportedData.shiftData.shift_tanks.forEach((st: any, index: any) => {
          const row = dippingsRow + 4 + index;
          const rowColor = index % 2 === 0 ? 'FFFFFFFF' : 'FFF8F8F8';

          ws.mergeCells(`A${row}:C${row}`);
          ws.getCell(`A${row}`).value = st.name || `Tank ${st.id}`;
          ws.getCell(`A${row}`).alignment = {
            horizontal: 'left',
            vertical: 'middle',
          };
          ws.getCell(`A${row}`).font = { size: 10 };
          ws.getCell(`A${row}`).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: rowColor },
          };
          ws.getCell(`A${row}`).border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } },
          };

          ws.getCell(`D${row}`).value = st.opening_reading || 0;
          ws.getCell(`E${row}`).value = st.incoming || 0;
          ws.getCell(`F${row}`).value =
            (st.opening_reading || 0) + (st.incoming || 0);
          ws.getCell(`G${row}`).value = st.closing_reading || 0;
          ws.getCell(`H${row}`).value = st.tank_difference || 0;
          ws.getCell(`I${row}`).value = st.actual_sold || 0;
          ws.getCell(`J${row}`).value = st.deviation || 0;

          ['D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach((col) => {
            ws.getCell(`${col}${row}`).numFmt = '#,##0.00';
            ws.getCell(`${col}${row}`).alignment = {
              horizontal: 'right',
              vertical: 'middle',
            };
            ws.getCell(`${col}${row}`).font = { size: 10 };
            ws.getCell(`${col}${row}`).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: rowColor },
            };
            ws.getCell(`${col}${row}`).border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } },
            };
          });
        });
      }
    }

    // Return Excel buffer
    return await wb.xlsx.writeBuffer();
    // return { cashierSummary: cashierSummary };
  } catch (error: any) {
    console.error('Error exporting sample Excel:', error);
    throw new Error(
      error?.message || 'Excel export failed during workbook generation'
    );
  }
}
