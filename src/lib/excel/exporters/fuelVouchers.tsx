import dayjs from 'dayjs';
import { applyCellStyle, CELL_STYLES, ROW_HEIGHTS } from '../styles';
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

    // Set column widths for better readability - dynamic based on with_receipts
    const baseColumns = [
      { width: 12 }, // Date
      { width: 15 }, // Voucher No
      { width: 25 }, // Stakeholder/Expense Ledger
      { width: 15 }, // Reference
      { width: 15 }, // Product
      { width: 25 }, // Narration
      { width: 12 }, // LTS
      { width: 10 }, // Price
      { width: 15 }, // Amount/Debit
    ];

    // Add conditional columns if with_receipts is enabled
    if (exportedData.filters.with_receipts == 1) {
      baseColumns.push(
        { width: 15 }, // Credit
        { width: 18 } // Running Balance
      );
    }

    ws.columns = baseColumns;

    // === FILTER SECTION (Level 1 - Top Level) ===
    // Station name row
    if (exportedData.filters.stationName) {
      ws.getCell(`A1`).value = 'Station Name';
      applyCellStyle(ws.getCell(`A1`), CELL_STYLES.filterLabel);

      ws.mergeCells(`B1:C1`);
      ws.getCell(`B1`).value = exportedData.filters.stationName;
      applyCellStyle(ws.getCell(`B1`), CELL_STYLES.filterValue);
    }

    // Stakeholder name row
    if (exportedData.filters.stakeholder_name) {
      ws.getCell(`A2`).value = 'Stakeholder Name';
      applyCellStyle(ws.getCell(`A2`), CELL_STYLES.filterLabel);

      ws.mergeCells(`B2:C2`);
      ws.getCell(`B2`).value = exportedData.filters.stakeholder_name;
      applyCellStyle(ws.getCell(`B2`), CELL_STYLES.filterValue);
    }

    // Date range row
    if (exportedData.filters.from && exportedData.filters.to) {
      ws.getCell(`A3`).value = 'Date Range';
      applyCellStyle(ws.getCell(`A3`), CELL_STYLES.filterLabel);

      ws.mergeCells(`B3:C3`);
      ws.getCell(`B3`).value =
        `${exportedData.filters.from} - ${exportedData.filters.to}`;
      applyCellStyle(ws.getCell(`B3`), CELL_STYLES.filterValue);
    }

    // Add spacing row
    ws.addRow([]);
    let stakeholderexpense = '';
    if (
      exportedData.filters.expense_ledger_ids &&
      exportedData.filters.expense_ledger_ids?.length === 1
    ) {
      stakeholderexpense =
        exportedData.fuelVouchers[0]?.expense_ledger.name + ' Expense';
    }
    if (
      exportedData.filters.expense_ledger_ids &&
      exportedData.filters.expense_ledger_ids?.length > 1
    ) {
      stakeholderexpense = ' Expenses';
    }
    if (exportedData.filters.stakeholder_name) {
      stakeholderexpense = 'Stakeholder';
    }
    if (
      !exportedData.filters.stakeholder_name &&
      (exportedData.filters.expense_ledger_ids?.length < 1 ||
        !exportedData.filters.expense_ledger_ids)
    ) {
      stakeholderexpense = 'Stakeholder/Expense';
    }

    // === TABLE HEADER (Level 2 - Section Header) ===
    const headerColumns = [
      'DATE',
      'VOUCHER NO.',
      stakeholderexpense,
      'REFERENCE',
      'PRODUCT',
      'NARRATION',
      'LTS',
      'PRICE',
      exportedData.filters.with_receipts == 1 ? 'DEBIT' : 'AMOUNT',
    ];

    // Add conditional headers if with_receipts is enabled
    if (exportedData.filters.with_receipts == 1) {
      headerColumns.push('CREDIT', 'RUNNING BALANCE');
    }

    const headingRow = ws.addRow(headerColumns);
    headingRow.height = ROW_HEIGHTS.header;

    // Apply header styles to all columns
    for (let c = 0; c < headerColumns.length; c++) {
      applyCellStyle(
        ws.getCell(`${String.fromCharCode(65 + c)}5`),
        CELL_STYLES.tableHeader
      );
    }

    // === DATA ROWS (Level 3 - Content) ===
    let runningBalance = 0;
    if (exportedData.fuelVouchers.length) {
      exportedData.fuelVouchers.forEach((fv: any) => {
        // Calculate running balance
        runningBalance += fv.debit - fv.credit;

        const rowData = [
          dayjs(fv.transaction_date).format('DD-MM-YYYY'),
          fv.voucherNo,
          fv.expense_ledger?.name || fv.stakeholder?.name || '',
          fv.reference || '',
          fv.product?.name || '',
          fv.narration || '',
          fv.quantity.toLocaleString('en-US', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2,
          }),
          fv.price.toLocaleString('en-US', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2,
          }),
          exportedData.filters.with_receipts == 0
            ? fv.amount.toLocaleString('en-US', {
                maximumFractionDigits: 2,
                minimumFractionDigits: 2,
              })
            : fv.debit.toLocaleString('en-US', {
                maximumFractionDigits: 2,
                minimumFractionDigits: 2,
              }),
        ];

        // Add conditional columns if with_receipts is enabled
        if (exportedData.filters.with_receipts == 1) {
          rowData.push(
            fv.credit.toLocaleString('en-US', {
              maximumFractionDigits: 2,
              minimumFractionDigits: 2,
            }),
            runningBalance.toLocaleString('en-US', {
              maximumFractionDigits: 2,
              minimumFractionDigits: 2,
            })
          );
        }

        const dataRow = ws.addRow(rowData);

        dataRow.eachCell((cell, colNumber) => {
          // Right-align numeric columns (LTS, Price, Amount/Debit, Credit, Running Balance)
          if (colNumber >= 7) {
            applyCellStyle(cell, CELL_STYLES.dataRowNumeric);
          } else {
            applyCellStyle(cell, CELL_STYLES.dataRowText);
          }
        });
      });

      // === TOTAL ROW (Level 2 - Summary) ===
      // Note: Totals are commented out in PDF, keeping them in Excel for now
      // If you want to remove totals, comment out this section
      const totalRowData = [
        'TOTAL',
        ' ',
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
      ];

      // Add empty cells for conditional columns if with_receipts is enabled
      if (exportedData.filters.with_receipts == 1) {
        totalRowData.push(' ', ' ');
      }

      const totalRow = ws.addRow(totalRowData);

      totalRow.height = ROW_HEIGHTS.total;

      totalRow.eachCell((cell, colNumber) => {
        // Right-align numeric columns
        if (colNumber >= 7) {
          applyCellStyle(cell, CELL_STYLES.totalRowNumeric);
        } else {
          applyCellStyle(cell, CELL_STYLES.totalRowText);
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
