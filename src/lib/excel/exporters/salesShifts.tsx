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

    const pumpSummary = Object.values(
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

    // Add header row using shared function
    addHeader(ws, [
      exportedData.organization.name,
      ' ',
      ' ',
      ' ',
      ' ',
      ' ',
      ' ',
      ' ',
      ' ',
      'Fuel Sales Shift',
    ]);
    addHeader(ws, [
      ' ',
      ' ',
      ' ',
      ' ',
      ' ',
      ' ',
      ' ',
      ' ',
      ' ',
      exportedData.shiftData.shiftNo,
    ]);
    addHeader(ws, [
      ' ',
      ' ',
      ' ',
      ' ',
      ' ',
      ' ',
      ' ',
      ' ',
      ' ',
      exportedData.stationName,
    ]);

    // Add rows
    const shiftInfoRow = ws.addRow([
      'Sales Outlet',
      'Shift Start',
      'Shift End',
      'Recorded By',
      exportedData.shiftData.fuel_prices?.map((price: any, index: any) => {
        const product = exportedData.productOptions?.find(
          (p: any) => p.id === price.product_id
        );
        return product?.name || `Product ${price.product_id}`;
      }),
    ]);

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

        // cash distributions
        if (c.other_transactions.length) {
          for (const cd of c.other_transactions) {
            cashier.cashDistributions = cashDistributionSummary;
          }
        }

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
    row.font = { size: 12, bold: true };

    ws.addRow([
      exportedData.shiftData.shift?.name,
      readableDate(exportedData.shiftData.shift_start, true),
      readableDate(exportedData.shiftData.shift_end, true),
      exportedData.shiftData.creator?.name,
      ...fuelPrices.map((p) => p.price),
    ]);

    if (!exportedData.withDetails) {
      // CASHIERS SUMMARY
      ws.mergeCells('A7:J7');
      ws.getCell('A7').value = 'Cashiers Summary';
      ws.getCell('A7').alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getCell('A7').font = { bold: true, size: 14 };

      ws.getCell('A8').value = 'Name';
      ws.getCell('A8').alignment = { horizontal: 'left', vertical: 'middle' };
      ws.getCell('A8').font = { bold: true, size: 12 };

      ws.mergeCells('B8:D8');
      ws.getCell('B8').value = 'Pump Details';
      ws.getCell('B8').alignment = { horizontal: 'left', vertical: 'middle' };
      ws.getCell('B8').font = { bold: true, size: 12 };

      ws.mergeCells('E8:G8');
      ws.getCell('E8').value = 'Cash Distributions';
      ws.getCell('E8').alignment = { horizontal: 'left', vertical: 'middle' };
      ws.getCell('E8').font = { bold: true, size: 12 };

      ws.mergeCells('H8:J8');
      ws.getCell('H8').value = 'Cash Collection';
      ws.getCell('H8').alignment = { horizontal: 'left', vertical: 'middle' };
      ws.getCell('H8').font = { bold: true, size: 12 };

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
      subtitlesRow.font = { bold: true, size: 12 };

      //     ACTUAL DATA    //
      // map the data to excel
      if (cashierSummary.length) {
        let currentRow = ws.lastRow?.number ?? 0;

        cashierSummary.forEach((cashier) => {
          const pumpLen = cashier.pumpDetails.length;
          const cashLen = cashier.cashDistributions.length;
          const maxLen = Math.max(pumpLen, cashLen);

          if (maxLen === 0) return;

          const startRow = currentRow + 1;

          ws.mergeCells(`A${startRow}:A${startRow + maxLen - 1}`);
          ws.getCell(`A${startRow}`).value = cashier.name;
          ws.getCell(`A${startRow}`).alignment = {
            horizontal: 'left',
            vertical: 'middle',
          };

          // PUMP DETAILS
          cashier.pumpDetails.forEach((pump: any, i: any) => {
            const row = startRow + i;
            ws.getCell(`B${row}`).value = pump.pumpInfo.name;
            ws.getCell(`C${row}`).value = pump.name;
            ws.getCell(`D${row}`).value = pump.amount.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
          });

          // CASH DISTRIBUTIONS
          cashier.cashDistributions.forEach((cd: any, i: any) => {
            const row = startRow + i;
            ws.getCell(`E${row}`).value = cd.type;
            ws.getCell(`F${row}`).value = cd.count;
            ws.getCell(`G${row}`).value = cd.totalAmount.toLocaleString(
              'en-US',
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            );
          });

          // CASH COLLECTIONS
          ws.mergeCells(`H${startRow}:H${startRow + maxLen - 1}`);
          ws.mergeCells(`I${startRow}:I${startRow + maxLen - 1}`);
          ws.mergeCells(`J${startRow}:J${startRow + maxLen - 1}`);

          ws.getCell(`H${startRow}:H${startRow + maxLen - 1}`).alignment = {
            horizontal: 'center',
            vertical: 'middle',
          };
          ws.getCell(`I${startRow}:I${startRow + maxLen - 1}`).alignment = {
            horizontal: 'center',
            vertical: 'middle',
          };
          ws.getCell(`J${startRow}:J${startRow + maxLen - 1}`).alignment = {
            horizontal: 'center',
            vertical: 'middle',
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
        });

        let totalsRow = ws.lastRow?.number ?? 0;
        // TOTALS
        ws.getCell(`A${totalsRow + 2}`).value = 'Totals';
        ws.getCell(`A${totalsRow + 2}`).font = { bold: true };
        ws.getCell(`A${totalsRow + 2}`).alignment = {
          horizontal: 'center',
          vertical: 'middle',
        };
        // pump details total
        ws.getCell(`B${totalsRow + 2}`).value = '';
        {
          pumpSummary.map((pump: any, index) => {
            const row = totalsRow + 2 + index;
            ws.getCell(`C${row}`).value = pump.type;
            ws.getCell(`D${row}`).value = pump.totalDifference.toLocaleString(
              'en-US',
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            );
          });
        }
        {
          totalTransactionsSummary?.map((t: any, index) => {
            const row = totalsRow + 2 + index;
            ws.getCell(`E${row}`).value = t.type;
            ws.getCell(`F${row}`).value = t.count;
            ws.getCell(`G${row}`).value =
              t.totalAmount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }) || 0.0;
          });
        }
        ws.getCell(`H${totalsRow + 2}`).value =
          totalExpectedAmount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        ws.getCell(`I${totalsRow + 2}`).value =
          totalCollectedAmount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
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

        //   grand total
        ws.addRow(['', '', '', '', 'Grand Total', '', grandTotal, '', '', '']);
      }
    } else {
      if (exportedData.shiftData.cashiers.length) {
        exportedData.shiftData.cashiers?.forEach(
          (cashier: any, cashierIndex: number) => {
            const cashierTotals = calculateCashierTotals(cashier);
            const mergedReadings = mergeCashierPumpReadings(
              cashier.pump_readings || []
            );
            const cashierRow = (ws.lastRow?.number ?? 0) + cashierIndex;
            ws.mergeCells(`A${cashierRow + 2}:J${cashierRow + 2}`);
            ws.getCell(`A${cashierRow + 2}`).value =
              cashier.name + ' - Summary';
            ws.getCell(`A${cashierRow + 2}`).alignment = {
              horizontal: 'center',
              vertical: 'middle',
            };
            ws.getCell(`A${cashierRow + 2}`).font = { bold: true, size: 16 };

            ws.mergeCells(`A${cashierRow + 3}:G${cashierRow + 3}`);
            ws.getCell(`A${cashierRow + 3}`).value = 'Item';
            ws.getCell(`A${cashierRow + 3}`).alignment = {
              horizontal: 'left',
              vertical: 'middle',
            };
            ws.getCell(`A${cashierRow + 3}`).font = { bold: true, size: 12 };

            ws.mergeCells(`H${cashierRow + 3}:J${cashierRow + 3}`);
            ws.getCell(`H${cashierRow + 3}`).value = 'Amount';
            ws.getCell(`H${cashierRow + 3}`).alignment = {
              horizontal: 'left',
              vertical: 'middle',
            };
            ws.getCell(`H${cashierRow + 3}`).font = { bold: true, size: 12 };

            ws.mergeCells(`A${cashierRow + 4}:G${cashierRow + 4}`);
            ws.getCell(`A${cashierRow + 4}`).value = 'Total Sales Amount';
            ws.getCell(`A${cashierRow + 4}`).alignment = {
              horizontal: 'left',
              vertical: 'middle',
            };
            ws.mergeCells(`H${cashierRow + 4}:J${cashierRow + 4}`);
            ws.getCell(`H${cashierRow + 4}`).value =
              cashierTotals.netSales.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
            ws.getCell(`H${cashierRow + 4}`).alignment = {
              horizontal: 'right',
              vertical: 'middle',
            };

            ws.mergeCells(`A${cashierRow + 5}:G${cashierRow + 5}`);
            ws.getCell(`A${cashierRow + 5}`).value = 'Fuel Vouchers Total';
            ws.getCell(`A${cashierRow + 5}`).alignment = {
              horizontal: 'left',
              vertical: 'middle',
            };
            ws.mergeCells(`H${cashierRow + 5}:J${cashierRow + 5}`);
            ws.getCell(`H${cashierRow + 5}`).value =
              cashierTotals.totalFuelVouchersAmount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
            ws.getCell(`H${cashierRow + 5}`).alignment = {
              horizontal: 'right',
              vertical: 'middle',
            };

            ws.mergeCells(`A${cashierRow + 6}:G${cashierRow + 6}`);
            ws.getCell(`A${cashierRow + 6}`).value = 'Cash Remaining';
            ws.getCell(`A${cashierRow + 6}`).alignment = {
              horizontal: 'left',
              vertical: 'middle',
            };
            ws.mergeCells(`H${cashierRow + 6}:J${cashierRow + 6}`);
            ws.getCell(`H${cashierRow + 6}`).value =
              cashierTotals.cashRemaining.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
            ws.getCell('H11').alignment = {
              horizontal: 'right',
              vertical: 'middle',
            };

            //   PUMP READINGS
            const pumpReadingsRow = ws.lastRow?.number ?? 0;
            ws.mergeCells(`A${pumpReadingsRow + 2}:J${pumpReadingsRow + 2}`);
            ws.getCell(`A${pumpReadingsRow + 2}`).value =
              cashier.name + ' - pump readings';
            ws.getCell(`A${pumpReadingsRow + 2}`).alignment = {
              horizontal: 'center',
              vertical: 'middle',
            };
            ws.getCell(`A${pumpReadingsRow + 2}`).font = {
              bold: true,
              size: 14,
            };

            ws.mergeCells(`A${pumpReadingsRow + 3}:B${pumpReadingsRow + 3}`);
            ws.getCell(`A${pumpReadingsRow + 3}`).value = 'Pump';
            ws.getCell(`A${pumpReadingsRow + 3}`).alignment = {
              horizontal: 'left',
              vertical: 'middle',
            };
            ws.getCell(`A${pumpReadingsRow + 3}`).font = {
              bold: true,
              size: 12,
            };

            ws.mergeCells(`C${pumpReadingsRow + 3}:D${pumpReadingsRow + 3}`);
            ws.getCell(`C${pumpReadingsRow + 3}`).value = 'Product';
            ws.getCell(`C${pumpReadingsRow + 3}`).alignment = {
              horizontal: 'left',
              vertical: 'middle',
            };
            ws.getCell(`C${pumpReadingsRow + 3}`).font = {
              bold: true,
              size: 12,
            };

            ws.mergeCells(`E${pumpReadingsRow + 3}:F${pumpReadingsRow + 3}`);
            ws.getCell(`E${pumpReadingsRow + 3}`).value = 'Opening';
            ws.getCell(`E${pumpReadingsRow + 3}`).alignment = {
              horizontal: 'left',
              vertical: 'middle',
            };
            ws.getCell(`E${pumpReadingsRow + 3}`).font = {
              bold: true,
              size: 12,
            };

            ws.mergeCells(`G${pumpReadingsRow + 3}:H${pumpReadingsRow + 3}`);
            ws.getCell(`G${pumpReadingsRow + 3}`).value = 'Closing';
            ws.getCell(`G${pumpReadingsRow + 3}`).alignment = {
              horizontal: 'left',
              vertical: 'middle',
            };
            ws.getCell(`G${pumpReadingsRow + 3}`).font = {
              bold: true,
              size: 12,
            };

            ws.mergeCells(`I${pumpReadingsRow + 3}:J${pumpReadingsRow + 3}`);
            ws.getCell(`I${pumpReadingsRow + 3}`).value = 'Difference';
            ws.getCell(`I${pumpReadingsRow + 3}`).alignment = {
              horizontal: 'left',
              vertical: 'middle',
            };
            ws.getCell(`I${pumpReadingsRow + 3}`).font = {
              bold: true,
              size: 12,
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

                const pumpRow = (ws.lastRow?.number ?? 0) + 1;
                ws.mergeCells(`A${pumpRow}:B${pumpRow}`);
                ws.getCell(`A${pumpRow}`).value =
                  pumpInfo?.name || `Pump ${pump.fuel_pump_id}`;
                ws.getCell(`A${pumpRow}`).alignment = {
                  horizontal: 'left',
                  vertical: 'middle',
                };
                ws.mergeCells(`C${pumpRow}:D${pumpRow}`);
                ws.getCell(`C${pumpRow}`).value =
                  product?.name || `Product ${pump.product_id}`;
                ws.getCell(`C${pumpRow}`).alignment = {
                  horizontal: 'right',
                  vertical: 'middle',
                };
                ws.mergeCells(`E${pumpRow}:F${pumpRow}`);
                ws.getCell(`E${pumpRow}`).value = (
                  pump.opening || 0
                ).toLocaleString('en-US', {
                  minimumFractionDigits: 3,
                  maximumFractionDigits: 3,
                });
                ws.getCell(`E${pumpRow}`).alignment = {
                  horizontal: 'right',
                  vertical: 'middle',
                };
                ws.mergeCells(`G${pumpRow}:H${pumpRow}`);
                ws.getCell(`G${pumpRow}`).value = (
                  pump.closing || 0
                ).toLocaleString('en-US', {
                  minimumFractionDigits: 3,
                  maximumFractionDigits: 3,
                });
                ws.getCell(`G${pumpRow}`).alignment = {
                  horizontal: 'right',
                  vertical: 'middle',
                };
                ws.mergeCells(`I${pumpRow}:J${pumpRow}`);
                ws.getCell(`I${pumpRow}`).value = difference.toLocaleString(
                  'en-US',
                  {
                    minimumFractionDigits: 3,
                    maximumFractionDigits: 3,
                  }
                );
                ws.getCell(`I${pumpRow}`).alignment = {
                  horizontal: 'right',
                  vertical: 'middle',
                };
              });
            }
            //   PRODUCT SUMMARY
            const productSummaryRow = ws.lastRow?.number ?? 0;
            ws.mergeCells(
              `A${productSummaryRow + 2}:J${productSummaryRow + 2}`
            );
            ws.getCell(`A${productSummaryRow + 2}`).value =
              cashier.name + ' - Product Summary';
            ws.getCell(`A${productSummaryRow + 2}`).alignment = {
              horizontal: 'center',
              vertical: 'middle',
            };
            ws.getCell(`A${productSummaryRow + 2}`).font = {
              bold: true,
              size: 14,
            };

            ws.mergeCells(
              `A${productSummaryRow + 3}:D${productSummaryRow + 3}`
            );
            ws.getCell(`A${productSummaryRow + 3}`).value = 'Product';
            ws.getCell(`A${productSummaryRow + 3}`).alignment = {
              horizontal: 'left',
              vertical: 'middle',
            };
            ws.getCell(`A${productSummaryRow + 3}`).font = {
              bold: true,
              size: 12,
            };

            ws.mergeCells(
              `E${productSummaryRow + 3}:F${productSummaryRow + 3}`
            );
            ws.getCell(`E${productSummaryRow + 3}`).value = 'Quantity';
            ws.getCell(`E${productSummaryRow + 3}`).alignment = {
              horizontal: 'left',
              vertical: 'middle',
            };
            ws.getCell(`E${productSummaryRow + 3}`).font = {
              bold: true,
              size: 12,
            };

            ws.mergeCells(
              `G${productSummaryRow + 3}:H${productSummaryRow + 3}`
            );
            ws.getCell(`G${productSummaryRow + 3}`).value = 'Price';
            ws.getCell(`G${productSummaryRow + 3}`).alignment = {
              horizontal: 'left',
              vertical: 'middle',
            };
            ws.getCell(`G${productSummaryRow + 3}`).font = {
              bold: true,
              size: 12,
            };

            ws.mergeCells(
              `I${productSummaryRow + 3}:J${productSummaryRow + 3}`
            );
            ws.getCell(`I${productSummaryRow + 3}`).value = 'Amount';
            ws.getCell(`I${productSummaryRow + 3}`).alignment = {
              horizontal: 'left',
              vertical: 'middle',
            };
            ws.getCell(`I${productSummaryRow + 3}`).font = {
              bold: true,
              size: 12,
            };

            {
              mergedReadings.forEach((productSales: any, index: number) => {
                const product = exportedData.productOptions?.find(
                  (p: any) => p.id === productSales.product_id
                );
                const price =
                  exportedData.shiftData.fuel_prices.find(
                    (p: any) => p.product_id === productSales.product_id
                  )?.price || 0;

                // Adjustments for this product and cashier
                const adjustmentsQty = (cashier.tank_adjustments || [])
                  .filter(
                    (adj: any) => adj.product_id === productSales.product_id
                  )
                  .reduce((sum: any, adj: any) => {
                    if (adj.operator === '+') {
                      return sum - adj.quantity;
                    } else if (adj.operator === '-') {
                      return sum + adj.quantity;
                    }
                    return sum;
                  }, 0);

                const totalQty = productSales.quantity + adjustmentsQty;
                const totalAmount = totalQty * price;

                const productRow = (ws.lastRow?.number ?? 0) + index + 1;
                ws.mergeCells(`A${productRow}:D${productRow}`);
                ws.getCell(`A${productRow}`).value =
                  product?.name || `Product ${productSales.product_id}`;
                ws.getCell(`A${productRow}`).alignment = {
                  horizontal: 'left',
                  vertical: 'middle',
                };

                ws.mergeCells(`E${productRow}:F${productRow}`);
                ws.getCell(`E${productRow}`).value = totalQty.toLocaleString(
                  'en-US',
                  {
                    minimumFractionDigits: 3,
                    maximumFractionDigits: 3,
                  }
                );
                ws.getCell(`E${productRow}`).alignment = {
                  horizontal: 'right',
                  vertical: 'middle',
                };

                ws.mergeCells(`G${productRow}:H${productRow}`);
                ws.getCell(`G${productRow}`).value = price.toLocaleString(
                  'en-US',
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                );
                ws.getCell(`G${productRow}`).alignment = {
                  horizontal: 'right',
                  vertical: 'middle',
                };

                ws.mergeCells(`I${productRow}:J${productRow}`);
                ws.getCell(`I${productRow}`).value = totalAmount.toLocaleString(
                  'en-US',
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                );
                ws.getCell(`I${productRow}`).alignment = {
                  horizontal: 'right',
                  vertical: 'middle',
                };
              });
            }
            const cashierTotalRow = (ws.lastRow?.number ?? 0) + 1;
            ws.mergeCells(`A${cashierTotalRow}:G${cashierTotalRow}`);
            ws.getCell(`A${cashierTotalRow}`).value = 'Cashier Total';
            ws.getCell(`A${cashierTotalRow}`).alignment = {
              horizontal: 'left',
              vertical: 'middle',
            };
            ws.getCell(`A${cashierTotalRow}`).font = { bold: true, size: 12 };

            ws.mergeCells(`H${cashierTotalRow}:J${cashierTotalRow}`);
            ws.getCell(`H${cashierTotalRow}`).value =
              cashierTotals.netSales.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
            ws.getCell(`H${cashierTotalRow}`).alignment = {
              horizontal: 'right',
              vertical: 'middle',
            };
            ws.getCell(`H${cashierTotalRow}`).font = { bold: true, size: 12 };

            //   CASH DISTRIBUTIONS
            if (cashier.main_ledger || cashier.other_transactions?.length > 0) {
              const cashDistributionsRow = (ws.lastRow?.number ?? 0) + 1;
              ws.mergeCells(
                `A${cashDistributionsRow + 1}:J${cashDistributionsRow + 1}`
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
                `A${cashDistributionsRow + 2}:G${cashDistributionsRow + 2}`
              );
              ws.getCell(`A${cashDistributionsRow + 2}`).value = 'Account';
              ws.getCell(`A${cashDistributionsRow + 2}`).alignment = {
                horizontal: 'left',
                vertical: 'middle',
              };
              ws.getCell(`A${cashDistributionsRow + 2}`).font = {
                bold: true,
                size: 12,
              };

              ws.mergeCells(
                `H${cashDistributionsRow + 2}:J${cashDistributionsRow + 2}`
              );
              ws.getCell(`H${cashDistributionsRow + 2}`).value = 'Amount';
              ws.getCell(`H${cashDistributionsRow + 2}`).alignment = {
                horizontal: 'left',
                vertical: 'middle',
              };
              ws.getCell(`H${cashDistributionsRow + 2}`).font = {
                bold: true,
                size: 12,
              };

              if (cashier.main_ledger) {
                ws.mergeCells(
                  `A${cashDistributionsRow + 3}:G${cashDistributionsRow + 3}`
                );
                ws.getCell(`A${cashDistributionsRow + 3}`).value =
                  cashier.main_ledger.name ||
                  `Ledger ${cashier.main_ledger.id}`;
                ws.getCell(`A${cashDistributionsRow + 3}`).alignment = {
                  horizontal: 'left',
                  vertical: 'middle',
                };

                ws.mergeCells(
                  `H${cashDistributionsRow + 3}:J${cashDistributionsRow + 3}`
                );
                ws.getCell(`H${cashDistributionsRow + 3}`).value = (
                  cashier.main_ledger.amount || 0
                ).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                });
                ws.getCell(`H${cashDistributionsRow + 3}`).alignment = {
                  horizontal: 'right',
                  vertical: 'middle',
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
                    `A${otherTransctionsRow}:G${otherTransctionsRow}`
                  );
                  ws.getCell(`A${otherTransctionsRow}`).value = ledger.name;
                  ws.getCell(`A${otherTransctionsRow}`).alignment = {
                    horizontal: 'left',
                    vertical: 'middle',
                  };

                  ws.mergeCells(
                    `H${otherTransctionsRow}:J${otherTransctionsRow}`
                  );
                  ws.getCell(`H${otherTransctionsRow}`).value = (
                    transaction.amount || 0
                  ).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  });
                  ws.getCell(`H${otherTransctionsRow}`).alignment = {
                    horizontal: 'right',
                    vertical: 'middle',
                  };
                }
              );
            }

            //   FUEL VOUCHERS
            const FvRow = ws.lastRow?.number ?? 0;
            ws.mergeCells(`A${FvRow + 2}:J${FvRow + 2}`);
            ws.getCell(`A${FvRow + 2}`).value =
              cashier.name + ' - Fuel Vouchers';
            ws.getCell(`A${FvRow + 2}`).alignment = {
              horizontal: 'center',
              vertical: 'middle',
            };
            ws.getCell(`A${FvRow + 2}`).font = { bold: true, size: 14 };

            ws.mergeCells(`A${FvRow + 3}:C${FvRow + 3}`);
            ws.getCell(`A${FvRow + 3}`).value = 'Voucher No';
            ws.getCell(`A${FvRow + 3}`).alignment = {
              horizontal: 'center',
              vertical: 'middle',
            };
            ws.getCell(`A${FvRow + 3}`).font = { bold: true, size: 12 };

            ws.mergeCells(`D${FvRow + 3}:F${FvRow + 3}`);
            ws.getCell(`D${FvRow + 3}`).value = 'Client';
            ws.getCell(`D${FvRow + 3}`).alignment = {
              horizontal: 'center',
              vertical: 'middle',
            };
            ws.getCell(`D${FvRow + 3}`).font = { bold: true, size: 12 };

            ws.getCell(`G${FvRow + 3}`).value = 'Narration';
            ws.getCell(`G${FvRow + 3}`).alignment = {
              horizontal: 'center',
              vertical: 'middle',
            };
            ws.getCell(`G${FvRow + 3}`).font = { bold: true, size: 12 };

            ws.getCell(`H${FvRow + 3}`).value = 'Product';
            ws.getCell(`H${FvRow + 3}`).alignment = {
              horizontal: 'center',
              vertical: 'middle',
            };
            ws.getCell(`H${FvRow + 3}`).font = { bold: true, size: 12 };

            ws.getCell(`I${FvRow + 3}`).value = 'Quantity';
            ws.getCell(`I${FvRow + 3}`).alignment = {
              horizontal: 'center',
              vertical: 'middle',
            };
            ws.getCell(`I${FvRow + 3}`).font = { bold: true, size: 12 };

            ws.getCell(`J${FvRow + 3}`).value = 'Amount';
            ws.getCell(`J${FvRow + 3}`).alignment = {
              horizontal: 'center',
              vertical: 'middle',
            };
            ws.getCell(`J${FvRow + 3}`).font = { bold: true, size: 12 };

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
                ws.mergeCells(`A${fvLastRow}:C${fvLastRow}`);
                ws.getCell(`A${fvLastRow}`).value =
                  fv.voucherNo || `FV-${index + 1}`;
                ws.getCell(`A${fvLastRow}`).alignment = {
                  horizontal: 'left',
                  vertical: 'middle',
                };

                ws.mergeCells(`D${fvLastRow}:F${fvLastRow}`);
                ws.getCell(`D${fvLastRow}`).value =
                  fv.stakeholder?.name || 'Internal Expense';
                ws.getCell(`D${fvLastRow}`).alignment = {
                  horizontal: 'left',
                  vertical: 'middle',
                };

                ws.getCell(`G${fvLastRow}`).value = fv.narration || '-';
                ws.getCell(`G${fvLastRow}`).alignment = {
                  horizontal: 'left',
                  vertical: 'middle',
                };

                ws.getCell(`H${fvLastRow}`).value =
                  product?.name || `Product ${fv.product_id}`;
                ws.getCell(`H${fvLastRow}`).alignment = {
                  horizontal: 'left',
                  vertical: 'middle',
                };

                ws.getCell(`I${fvLastRow}`).value = fv.quantity.toLocaleString(
                  'en-US',
                  {
                    minimumFractionDigits: 3,
                    maximumFractionDigits: 3,
                  }
                );
                ws.getCell(`I${fvLastRow}`).alignment = {
                  horizontal: 'right',
                  vertical: 'middle',
                };

                ws.getCell(`J${fvLastRow}`).value = amount.toLocaleString(
                  'en-US',
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                );
                ws.getCell(`J${fvLastRow}`).alignment = {
                  horizontal: 'right',
                  vertical: 'middle',
                };
              });
            }
            let fvLastRow = (ws.lastRow?.number ?? 0) + 1;
            ws.mergeCells(`A${fvLastRow}:I${fvLastRow}`);
            ws.getCell(`A${fvLastRow}`).value = 'Cash Total Fuel Vouchers';
            ws.getCell(`A${fvLastRow}`).alignment = {
              horizontal: 'left',
              vertical: 'middle',
            };
            ws.getCell(`A${fvLastRow}`).font = { bold: true, size: 12 };

            ws.getCell(`J${fvLastRow}`).value =
              cashierTotals.totalFuelVouchersAmount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
            ws.getCell(`J${fvLastRow}`).alignment = {
              horizontal: 'right',
              vertical: 'middle',
            };
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
      ws.getCell(`A${dippingsRow + 3}`).font = { bold: true, size: 12 };
      ws.getCell(`A${dippingsRow + 3}`).alignment = {
        horizontal: 'left',
      };
      ws.getCell(`D${dippingsRow + 3}`).value = 'Opening';
      ws.getCell(`D${dippingsRow + 3}`).font = { bold: true, size: 12 };
      ws.getCell(`E${dippingsRow + 3}`).value = 'Purchase';
      ws.getCell(`E${dippingsRow + 3}`).font = { bold: true, size: 12 };
      ws.getCell(`F${dippingsRow + 3}`).value = 'Total';
      ws.getCell(`F${dippingsRow + 3}`).font = { bold: true, size: 12 };
      ws.getCell(`G${dippingsRow + 3}`).value = 'Closing';
      ws.getCell(`G${dippingsRow + 3}`).font = { bold: true, size: 12 };
      ws.getCell(`H${dippingsRow + 3}`).value = 'Tank Difference';
      ws.getCell(`H${dippingsRow + 3}`).font = { bold: true, size: 12 };
      ws.getCell(`I${dippingsRow + 3}`).value = 'Actual Sold';
      ws.getCell(`I${dippingsRow + 3}`).font = { bold: true, size: 12 };
      ws.getCell(`J${dippingsRow + 3}`).value = 'Pos/Neg';
      ws.getCell(`J${dippingsRow + 3}`).font = { bold: true, size: 12 };

      // dipping data
      {
        exportedData.shiftData.shift_tanks.forEach((st: any, index: any) => {
          const row = dippingsRow + 4 + index;

          ws.mergeCells(`A${row}:C${row}`);
          ws.getCell(`A${row}`).value = st.name || `Tank ${st.id}`;
          ws.getCell(`A${row}`).alignment = { horizontal: 'left' };

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
