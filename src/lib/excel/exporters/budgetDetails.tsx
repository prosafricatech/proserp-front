import { applyCellStyle, CELL_STYLES } from '../styles';
import { createWorkbook } from '../workBook';

interface Task {
  id: number;
  label?: string;
  name?: string;
}

export async function exportbudgetItemsDetailsExcel(exportedData: any) {
  try {
    const { allTasks, budgetDetails, baseCurrency, withDetails, organization } =
      exportedData;
    const expenses_budgeted = budgetDetails?.expenses_budgeted;
    const ledger_items = budgetDetails.ledger_items;
    const product_items = budgetDetails.product_items;
    const subcontract_task_items = budgetDetails.subcontract_task_items;

    // ========== HELPER FUNCTIONS ========== //
    const formatCurrency = (
      amount: number,
      currencyCode: string = 'USD'
    ): string => {
      if (isNaN(amount)) return '0.00';
      return amount.toLocaleString('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    const formatPercentage = (budgeted: number, spent: number): any => {
      if (budgeted === 0) return 'unbudgeted';
      const percentage = (spent / budgeted) * 100;
      //   return `${percentage.toFixed(2)}%`;
      return percentage;
    };

    const getTaskLabel = (task: Task | undefined): string => {
      if (!task) return '';
      return task.label || task.name || '';
    };

    const totalBudgetedAmount =
      budgetDetails?.expenses_budgeted?.reduce(
        (total: any, item: any) => total + (item?.budgeted || 0),
        0
      ) || 0;

    const totalSpentAmount =
      budgetDetails?.expenses_budgeted?.reduce(
        (total: any, item: any) => total + (item?.spent || 0),
        0
      ) || 0;

    const percentageSpent = totalBudgetedAmount
      ? (totalSpentAmount / totalBudgetedAmount) * 100
      : 0;

    // create workbook and worksheet
    const wb = createWorkbook();
    const ws = wb.addWorksheet('Budget Details');

    // column widths
    const baseColumns = [
      { width: 25 },
      { width: 45 },
      { width: 25 },
      { width: 25 },
      { width: 25 },
      { width: 25 },
      { width: 25 },
    ];

    ws.columns = baseColumns;

    // header section
    ws.addRow([organization.name, ' ', 'Budget Details']);
    ws.addRow([' ', ' ', budgetDetails.name || 'Unnamed Budget']);

    ws.getCell('A1').font = {
      bold: true,
      size: 12,
    };
    ws.getCell('C1').font = {
      bold: true,
      size: 12,
    };

    ws.addRow([]);

    // info section
    const infoHeaderRow = ws.addRow([
      'Total Budgeted',
      'Total Spent',
      'Percentage Spent',
    ]);
    const infoDataRow = ws.addRow([
      formatCurrency(totalBudgetedAmount, baseCurrency?.code),
      formatCurrency(totalSpentAmount, baseCurrency?.code),
      percentageSpent / 100,
    ]);
    ws.getCell(`C5`).numFmt = '0.00%';
    ws.getCell(`C5`).alignment = {
      horizontal: 'left',
    };

    for (let c = 0; c < 3; c++) {
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

    // ========== SUMMARY TABLE ========== //
    if (!withDetails && expenses_budgeted.length) {
      let summaryTableRow = (ws.lastRow?.number ?? 0) + 1;
      ws.getRow(summaryTableRow).values = [
        'S/N',
        'Expense Name',
        'Budgeted',
        'Spent',
        'Percent',
      ];
      ws.getRow(summaryTableRow).height = 20;
      for (let headerCell = 0; headerCell < 5; headerCell++) {
        ws.getCell(
          `${String.fromCharCode(65 + headerCell)}${summaryTableRow}`
        ).font = {
          bold: true,
          size: 12,
        };
        applyCellStyle(
          ws.getCell(
            `${String.fromCharCode(65 + headerCell)}${summaryTableRow}`
          ),
          CELL_STYLES.tableHeader
        );
        ws.getCell(
          `${String.fromCharCode(65 + headerCell)}${summaryTableRow}`
        ).border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } },
        };
      }

      summaryTableRow += 1;

      expenses_budgeted.forEach((exp: any, index: any) => {
        ws.getRow(summaryTableRow + index).values = [
          index + 1,
          exp.name,
          formatCurrency(exp.budgeted, baseCurrency?.code),
          formatCurrency(exp.spent, baseCurrency?.code),
          typeof formatPercentage(exp.budgeted, exp.spent) !== 'string'
            ? formatPercentage(exp.budgeted, exp.spent) / 100
            : formatPercentage(exp.budgeted, exp.spent),
        ];

        ws.getCell(`E${summaryTableRow + index}`).numFmt = '0.00%';

        for (let itemCell = 0; itemCell < 5; itemCell++) {
          if (itemCell === 0) {
            ws.getCell(
              `${String.fromCharCode(65 + itemCell)}${summaryTableRow + index}`
            ).alignment = {
              horizontal: 'left',
            };
          } else if (itemCell > 1) {
            ws.getCell(
              `${String.fromCharCode(65 + itemCell)}${summaryTableRow + index}`
            ).alignment = {
              horizontal: 'right',
            };
          }
          ws.getCell(
            `${String.fromCharCode(65 + itemCell)}${summaryTableRow + index}`
          ).border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } },
          };
        }
      });
    }

    if (withDetails) {
      // ========== LEDGER ITEMS TABLE ========== //
      if (budgetDetails.ledger_items) {
        let ledgerItemsTableRow = (ws.lastRow?.number ?? 0) + 1;
        ws.getRow(ledgerItemsTableRow).values = ['Ledger Items'];
        ws.getCell(`A${ledgerItemsTableRow}`).font = {
          bold: true,
          size: 14,
        };
        ws.getRow(ledgerItemsTableRow + 1).values = [
          'S/N',
          'Expense',
          'Quantity',
          'Rate',
          'Amount',
        ];
        ws.getRow(ledgerItemsTableRow + 1).height = 20;
        for (let headerCell = 0; headerCell < 5; headerCell++) {
          ws.getCell(
            `${String.fromCharCode(65 + headerCell)}${ledgerItemsTableRow + 1}`
          ).font = {
            bold: true,
            size: 12,
          };
          applyCellStyle(
            ws.getCell(
              `${String.fromCharCode(65 + headerCell)}${ledgerItemsTableRow + 1}`
            ),
            CELL_STYLES.tableHeader
          );
          ws.getCell(
            `${String.fromCharCode(65 + headerCell)}${ledgerItemsTableRow + 1}`
          ).border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } },
          };
        }

        ledgerItemsTableRow += 2;
        ledger_items.forEach((item: any, index: any) => {
          const ledgerName = item.ledger?.name || String(item.ledger_id);
          const boundToTask = allTasks?.find(
            (task: any) => task.id === item?.budget_itemable_id
          );
          const taskLabel = boundToTask ? getTaskLabel(boundToTask) : null;

          const quantity = Number(item.quantity || 0);
          const unitSymbol = item.measurement_unit?.symbol || '';

          const rate = Number(item.rate || 0);
          const currencyCode =
            item.currency?.code || baseCurrency?.code || 'USD';

          const amount = rate * quantity;

          ws.getRow(ledgerItemsTableRow + index).values = [
            index + 1,
            ' ',
            `${quantity} ${unitSymbol}`,
            `${formatCurrency(rate, currencyCode)}`,
            `${formatCurrency(amount, currencyCode)}`,
          ];

          if (taskLabel && item.description) {
            ws.getRow(ledgerItemsTableRow + index).height = 80;
            ws.getCell(`B${ledgerItemsTableRow + index}`).value =
              `${ledgerName}\n${`bound to\n${taskLabel}`}\n${item.description ?? ` `}`;
            ws.getCell(`B${ledgerItemsTableRow + index}`).alignment = {
              wrapText: true,
              vertical: 'middle',
              horizontal: 'left',
            };
          } else if (taskLabel || item.description) {
            if (taskLabel) {
              ws.getCell(`B${ledgerItemsTableRow + index}`).value =
                `${ledgerName}\n${`bound to\n${taskLabel}`}`;
            }
            if (item.description) {
              ws.getCell(`B${ledgerItemsTableRow + index}`).value =
                `${ledgerName}\n${item.description ?? ` `}`;
            }
            ws.getRow(ledgerItemsTableRow + index).height = 50;
            ws.getCell(`B${ledgerItemsTableRow + index}`).alignment = {
              wrapText: true,
              vertical: 'middle',
              horizontal: 'left',
            };
          } else {
            ws.getCell(`B${ledgerItemsTableRow + index}`).value =
              `${ledgerName}`;
          }

          for (let itemCell = 0; itemCell < 5; itemCell++) {
            if (itemCell === 0) {
              ws.getCell(
                `${String.fromCharCode(65 + itemCell)}${ledgerItemsTableRow + index}`
              ).alignment = {
                horizontal: 'left',
              };
            } else if (itemCell > 1) {
              ws.getCell(
                `${String.fromCharCode(65 + itemCell)}${ledgerItemsTableRow + index}`
              ).alignment = {
                horizontal: 'right',
              };
            }
            ws.getCell(
              `${String.fromCharCode(65 + itemCell)}${ledgerItemsTableRow + index}`
            ).border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } },
            };
          }
        });
      }

      // ========== PRODUCTS TABLE ========== //
      if (budgetDetails.product_items) {
        let productsTableRow = (ws.lastRow?.number ?? 0) + 2;
        ws.getRow(productsTableRow).values = ['Products'];
        ws.getCell(`A${productsTableRow}`).font = {
          bold: true,
          size: 14,
        };
        ws.getRow(productsTableRow + 1).values = [
          'S/N',
          'Product',
          'Quantity',
          'Rate',
          'Amount',
        ];
        ws.getRow(productsTableRow + 1).height = 20;
        for (let headerCell = 0; headerCell < 5; headerCell++) {
          ws.getCell(
            `${String.fromCharCode(65 + headerCell)}${productsTableRow + 1}`
          ).font = {
            bold: true,
            size: 12,
          };
          applyCellStyle(
            ws.getCell(
              `${String.fromCharCode(65 + headerCell)}${productsTableRow + 1}`
            ),
            CELL_STYLES.tableHeader
          );
          ws.getCell(
            `${String.fromCharCode(65 + headerCell)}${productsTableRow + 1}`
          ).border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } },
          };
        }

        productsTableRow += 2;
        product_items.forEach((item: any, index: any) => {
          const productName =
            item.product_name || item.product?.name || String(item.id);
          const boundToTask = allTasks?.find(
            (task: any) => task.id === item?.budget_itemable_id
          );
          const taskLabel = boundToTask ? getTaskLabel(boundToTask) : null;

          const quantity = Number(item.quantity || 0);
          const unitSymbol =
            item.unit_symbol || item.measurement_unit?.symbol || '';

          const rate = Number(item.rate || 0);
          const currencyCode =
            item.currency?.code || baseCurrency?.code || 'USD';

          const amount = rate * quantity;

          ws.getRow(productsTableRow + index).values = [
            index + 1,
            ' ',
            `${quantity} ${unitSymbol}`,
            `${formatCurrency(rate, currencyCode)}`,
            `${formatCurrency(amount, currencyCode)}`,
          ];

          if (taskLabel && item.description) {
            ws.getRow(productsTableRow + index).height = 80;
            ws.getCell(`B${productsTableRow + index}`).value =
              `${productName}\n${`bound to\n${taskLabel}`}\n${item.description ?? ` `}`;
            ws.getCell(`B${productsTableRow + index}`).alignment = {
              wrapText: true,
              vertical: 'middle',
              horizontal: 'left',
            };
          } else if (taskLabel || item.description) {
            if (taskLabel) {
              ws.getCell(`B${productsTableRow + index}`).value =
                `${productName}\n${`bound to\n${taskLabel}`}`;
            }
            if (item.description) {
              ws.getCell(`B${productsTableRow + index}`).value =
                `${productName}\n${item.description ?? ` `}`;
            }
            ws.getRow(productsTableRow + index).height = 50;
            ws.getCell(`B${productsTableRow + index}`).alignment = {
              wrapText: true,
              vertical: 'middle',
              horizontal: 'left',
            };
          } else {
            ws.getCell(`B${productsTableRow + index}`).value = `${productName}`;
          }

          for (let itemCell = 0; itemCell < 5; itemCell++) {
            if (itemCell === 0) {
              ws.getCell(
                `${String.fromCharCode(65 + itemCell)}${productsTableRow + index}`
              ).alignment = {
                horizontal: 'left',
              };
            } else if (itemCell > 1) {
              ws.getCell(
                `${String.fromCharCode(65 + itemCell)}${productsTableRow + index}`
              ).alignment = {
                horizontal: 'right',
              };
            }
            ws.getCell(
              `${String.fromCharCode(65 + itemCell)}${productsTableRow + index}`
            ).border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } },
            };
          }
        });
      }

      // ========== SUBCONTRACT TASKS TABLE ========== //
      if (budgetDetails.subcontract_task_items) {
        let subcontractsTableRow = (ws.lastRow?.number ?? 0) + 2;
        ws.getRow(subcontractsTableRow).values = ['Subcontract Tasks'];
        ws.getCell(`A${subcontractsTableRow}`).font = {
          bold: true,
          size: 14,
        };
        ws.getRow(subcontractsTableRow + 1).values = [
          'S/N',
          'Task Name',
          'Description',
          'Expense Name',
          'Quantity',
          'Rate',
          'Amount',
        ];
        ws.getRow(subcontractsTableRow + 1).height = 20;
        for (let headerCell = 0; headerCell < 7; headerCell++) {
          ws.getCell(
            `${String.fromCharCode(65 + headerCell)}${subcontractsTableRow + 1}`
          ).font = {
            bold: true,
            size: 12,
          };
          applyCellStyle(
            ws.getCell(
              `${String.fromCharCode(65 + headerCell)}${subcontractsTableRow + 1}`
            ),
            CELL_STYLES.tableHeader
          );
          ws.getCell(
            `${String.fromCharCode(65 + headerCell)}${subcontractsTableRow + 1}`
          ).border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } },
          };
        }

        subcontractsTableRow += 2;
        subcontract_task_items.forEach((item: any, index: any) => {
          const productName =
            item.product_name || item.product?.name || String(item.id);
          const boundToTask = allTasks?.find(
            (task: any) => task.id === item?.budget_itemable_id
          );
          const taskLabel = boundToTask ? getTaskLabel(boundToTask) : null;

          const quantity = Number(item.quantity || 0);
          const unitSymbol = item.project_task?.measurement_unit?.symbol || '';

          const rate = Number(item.rate || 0);
          const currencyCode =
            item.currency?.code || baseCurrency?.code || 'USD';

          const amount = rate * quantity;

          ws.getRow(subcontractsTableRow + index).values = [
            index + 1,
            item.project_task?.name || item.project_task?.label || '',
            item.description || '',
            item.expense_ledger?.name || '',
            `${quantity} ${unitSymbol}`,
            `${formatCurrency(rate, currencyCode)}`,
            `${formatCurrency(amount, currencyCode)}`,
          ];

          for (let itemCell = 0; itemCell < 7; itemCell++) {
            if (itemCell === 0) {
              ws.getCell(
                `${String.fromCharCode(65 + itemCell)}${subcontractsTableRow + index}`
              ).alignment = {
                horizontal: 'left',
              };
            } else if (itemCell > 3) {
              ws.getCell(
                `${String.fromCharCode(65 + itemCell)}${subcontractsTableRow + index}`
              ).alignment = {
                horizontal: 'right',
              };
            }
            ws.getCell(
              `${String.fromCharCode(65 + itemCell)}${subcontractsTableRow + index}`
            ).border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } },
            };
          }
        });
      }
    }

    return await wb.xlsx.writeBuffer();
    // return exportedData;
  } catch (e: any) {
    console.error('Error exporting budget details Excel:', e);
    throw new Error(
      e?.message || 'Excel export failed during workbook generation'
    );
  }
}
