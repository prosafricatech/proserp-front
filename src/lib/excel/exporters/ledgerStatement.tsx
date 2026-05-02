import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { applyCellStyle, CELL_STYLES, COLORS } from '../styles';
import { createWorkbook } from '../workBook';

export async function exportLedgerStatement(exportedData: any) {
  try {
    const {
      authOrganization,
      transactionsData,
      user,
      ledger,
      ledgerName,
      increasesWith,
    } = exportedData;

    const organization = authOrganization.organization;
    const costCenters = transactionsData.filters.cost_centers;
    const reportFrom = readableDate(transactionsData.filters.from, true);
    const reportTo = readableDate(transactionsData.filters.to, true);
    const reportPeriod = `${reportFrom} - ${reportTo}`;
    const effectiveLedgerName = ledger?.name || ledgerName || '';

    // ── Replicate the same tableRows logic from the PDF component ──────────────
    const [openingBalanceTx, ...restTransactions] =
      transactionsData.transactions;

    const openingBalance = openingBalanceTx
      ? increasesWith === 'DR'
        ? openingBalanceTx.debit - openingBalanceTx.credit
        : openingBalanceTx.credit - openingBalanceTx.debit
      : 0;

    const totalCredits = restTransactions.reduce(
      (total: number, t: any) => total + t.credit,
      0
    );
    const totalDebits = restTransactions.reduce(
      (total: number, t: any) => total + t.debit,
      0
    );

    let runningBalance = openingBalance;

    const tableRows = [
      ...(openingBalanceTx
        ? [
            {
              transactionDate: openingBalanceTx.transactionDate,
              reference: '',
              description: openingBalanceTx.description,
              debit: null as number | null,
              credit: null as number | null,
              balance: openingBalance,
            },
          ]
        : []),
      ...restTransactions.map((transaction: any) => {
        runningBalance +=
          increasesWith === 'DR'
            ? transaction.debit - transaction.credit
            : transaction.credit - transaction.debit;

        return {
          transactionDate: transaction.transactionDate,
          reference:
            `${transaction.voucherNo ? transaction.voucherNo : ''} ${transaction.reference ? transaction.reference : ''}`.trim(),
          description: transaction.description,
          debit: transaction.debit,
          credit: transaction.credit,
          balance: runningBalance,
        };
      }),
    ];

    // ── Workbook & worksheet ───────────────────────────────────────────────────
    const wb = createWorkbook();
    const ws = wb.addWorksheet('Ledger Statement');

    // Column widths — mirrors PDF flex values:
    // A=Date(flex 1.5), B=Reference(flex 1), C=Description(flex 2), D=Debit(flex 1), E=Credit(flex 1), F=Balance(flex 1.5)
    ws.columns = [
      { width: 22 }, // A — Date
      { width: 22 }, // B — Reference
      { width: 40 }, // C — Description
      { width: 20 }, // D — Debit
      { width: 20 }, // E — Credit
      { width: 22 }, // F — Balance
    ];

    // ── ROW 1: Org name (A) + Report title (F) ────────────────────────────────
    ws.addRow([organization.name, ' ', ' ', ' ', ' ', 'Ledger Statement']);
    ws.getCell('A1').font = { bold: true, size: 12 };
    ws.getCell('F1').font = { bold: true, size: 12 };

    // ── ROW 2: Ledger name (F) ─────────────────────────────────────────────────
    ws.addRow([' ', ' ', ' ', ' ', ' ', effectiveLedgerName]);
    ws.getCell('F2').font = { bold: true, size: 11 };

    // ── ROW 3: Report period (F) ───────────────────────────────────────────────
    ws.addRow([' ', ' ', ' ', ' ', ' ', reportPeriod]);
    ws.getCell('F3').font = { bold: true, size: 10 };

    // ── ROW 4: Spacer ──────────────────────────────────────────────────────────
    ws.addRow([]);

    // ── ROW 5: Info labels — Total Credits | Total Debits | Printed By | Printed On
    // Mirrors the PDF's 4-column info row (each flex: 1)
    // Mapped to: A=Total Credits, B=Total Debits, C= (gap), D=Printed By, E= (gap), F=Printed On (condensed to 6 cols)
    ws.addRow([
      'Total Credits',
      'Total Debits',
      ' ',
      'Printed By',
      ' ',
      'Printed On',
    ]);
    for (let col = 65; col <= 70; col++) {
      applyCellStyle(
        ws.getCell(`${String.fromCharCode(col)}5`),
        CELL_STYLES.tableHeader
      );
    }
    ws.getRow(5).height = 20;

    // ── ROW 6: Info values ─────────────────────────────────────────────────────
    ws.addRow([
      totalCredits,
      totalDebits,
      ' ',
      user?.name,
      ' ',
      readableDate(undefined, true),
    ]);
    ws.getCell('A6').numFmt = '#,###.00';
    ws.getCell('B6').numFmt = '#,###.00';
    for (let col = 65; col <= 70; col++) {
      ws.getCell(`${String.fromCharCode(col)}6`).border = {
        top: { style: 'thin', color: { argb: COLORS.BLACK } },
        bottom: { style: 'thin', color: { argb: COLORS.BLACK } },
        left: { style: 'thin', color: { argb: COLORS.BLACK } },
        right: { style: 'thin', color: { argb: COLORS.BLACK } },
      };
    }
    ws.getRow(6).height = 18;

    // ── ROWS 7–8: Cost Centers (conditional) ──────────────────────────────────
    if (Array.isArray(costCenters) && costCenters.length > 0) {
      ws.addRow(['Cost Centers', ' ', ' ', ' ', ' ', ' ']);
      applyCellStyle(ws.getCell('A7'), CELL_STYLES.tableHeader);
      ws.getRow(7).height = 20;

      ws.addRow([costCenters.map((cc: any) => cc.name).join(', ')]);
      ws.getCell('A8').border = {
        top: { style: 'thin', color: { argb: COLORS.BLACK } },
        bottom: { style: 'thin', color: { argb: COLORS.BLACK } },
        left: { style: 'thin', color: { argb: COLORS.BLACK } },
        right: { style: 'thin', color: { argb: COLORS.BLACK } },
      };
      ws.getRow(8).height = 18;
    }

    // ── Spacer before table ────────────────────────────────────────────────────
    ws.addRow([]);

    // ── TABLE HEADER ROW ───────────────────────────────────────────────────────
    // Columns mirror PDF: Date | Reference | Description | Debit | Credit | Balance
    const headerRowNum = (ws.lastRow?.number ?? 0) + 1;
    ws.addRow([
      'Date',
      'Reference',
      'Description',
      'Debit',
      'Credit',
      'Balance',
    ]);
    ws.getRow(headerRowNum).height = 25;
    for (let col = 65; col <= 70; col++) {
      applyCellStyle(
        ws.getCell(`${String.fromCharCode(col)}${headerRowNum}`),
        CELL_STYLES.tableHeader
      );
    }
    // Numeric headers right-aligned
    ws.getCell(`D${headerRowNum}`).alignment = {
      horizontal: 'right',
      vertical: 'middle',
    };
    ws.getCell(`E${headerRowNum}`).alignment = {
      horizontal: 'right',
      vertical: 'middle',
    };
    ws.getCell(`F${headerRowNum}`).alignment = {
      horizontal: 'right',
      vertical: 'middle',
    };

    // ── DATA ROWS ──────────────────────────────────────────────────────────────
    tableRows.forEach((row: any) => {
      const rowNum = (ws.lastRow?.number ?? 0) + 1;

      ws.getCell(`A${rowNum}`).value = readableDate(row.transactionDate);
      ws.getCell(`B${rowNum}`).value = row.reference ?? '';
      // Split \n into separate richText segments — ExcelJS requires the literal
      // '\n' character inside a richText text value to produce an XML line break.
      // A single richText block with \n embedded does NOT render as a line break;
      // it must be a real newline character (\n) inside the text string.
      const descriptionLines = `${row.description}`.split('\n');
      ws.getCell(`C${rowNum}`).value = {
        richText: descriptionLines.flatMap((line, i) =>
          i < descriptionLines.length - 1
            ? [{ text: line }, { text: '\n' }]
            : [{ text: line }]
        ),
      };

      // Debit — show null/0 as blank (matching PDF logic)
      ws.getCell(`D${rowNum}`).value =
        row.debit && row.debit !== 0 ? row.debit : null;
      if (row.debit && row.debit !== 0)
        ws.getCell(`D${rowNum}`).numFmt = '#,###.00';

      // Credit — show null/0 as blank
      ws.getCell(`E${rowNum}`).value =
        row.credit && row.credit !== 0 ? row.credit : null;
      if (row.credit && row.credit !== 0)
        ws.getCell(`E${rowNum}`).numFmt = '#,###.00';

      // Balance — handle '-0.00' edge case exactly like the PDF
      const balanceDisplay =
        row.balance.toLocaleString('en-US', {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        }) === '-0.00'
          ? 0
          : row.balance;
      ws.getCell(`F${rowNum}`).value = balanceDisplay;
      ws.getCell(`F${rowNum}`).numFmt = '#,###.00';

      // Apply borders/style to all cells FIRST
      for (let col = 65; col <= 70; col++) {
        applyCellStyle(
          ws.getCell(`${String.fromCharCode(col)}${rowNum}`),
          CELL_STYLES.dataRowText
        );
      }

      // Set alignment AFTER applyCellStyle so it is not overwritten.
      // wrapText: true is required for the \n line breaks to actually render in Excel.
      ws.getCell(`C${rowNum}`).alignment = {
        wrapText: true,
        vertical: 'top',
      };
      ws.getCell(`D${rowNum}`).alignment = {
        horizontal: 'right',
        vertical: 'middle',
      };
      ws.getCell(`E${rowNum}`).alignment = {
        horizontal: 'right',
        vertical: 'middle',
      };
      ws.getCell(`F${rowNum}`).alignment = {
        horizontal: 'right',
        vertical: 'middle',
      };
    });

    // ── TOTAL ROW ──────────────────────────────────────────────────────────────
    // PDF: merged label (flex 4.7) | totalDebits | totalCredits | blank balance cell
    // Excel: A:C merged = TOTAL, D = totalDebits, E = totalCredits, F = blank
    const totalRowNum = (ws.lastRow?.number ?? 0) + 1;
    ws.getRow(totalRowNum).height = 20;

    ws.mergeCells(`A${totalRowNum}:C${totalRowNum}`);
    ws.getCell(`A${totalRowNum}`).value = 'TOTAL';
    ws.getCell(`A${totalRowNum}`).alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };

    ws.getCell(`D${totalRowNum}`).value = totalDebits;
    ws.getCell(`D${totalRowNum}`).numFmt = '#,###.00';
    ws.getCell(`D${totalRowNum}`).alignment = {
      horizontal: 'right',
      vertical: 'middle',
    };

    ws.getCell(`E${totalRowNum}`).value = totalCredits;
    ws.getCell(`E${totalRowNum}`).numFmt = '#,###.00';
    ws.getCell(`E${totalRowNum}`).alignment = {
      horizontal: 'right',
      vertical: 'middle',
    };

    ws.getCell(`F${totalRowNum}`).value = '';

    // Apply tableHeader style to all cells in total row
    for (let col = 65; col <= 70; col++) {
      applyCellStyle(
        ws.getCell(`${String.fromCharCode(col)}${totalRowNum}`),
        CELL_STYLES.tableHeader
      );
    }

    // Return Excel buffer
    return await wb.xlsx.writeBuffer();
    // return tableRows;
  } catch (e: any) {
    console.error('Error exporting Ledger Statement Excel:', e);
    throw new Error(
      e?.message || 'Excel export failed during workbook generation'
    );
  }
}
