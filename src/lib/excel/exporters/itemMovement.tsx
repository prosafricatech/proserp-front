import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { applyCellStyle, CELL_STYLES, COLORS } from '../styles';
import { createWorkbook } from '../workBook';

export async function exporItemMovement(exportedData: any) {
  try {
    const { movementsData, authObject, store, baseCurrency, financePersonnel } =
      exportedData;

    const {
      authOrganization,
      authUser: { user },
    } = authObject;

    const { from, to, cost_centers, product } = movementsData.filters;
    const reportPeriod = `${readableDate(from, true)} - ${readableDate(to, true)}`;

    // ── Replicate tableRows logic from the PDF component ───────────────────────
    const { movements } = movementsData;
    const [openingBalanceTx, ...restTransactions] = movements;

    const openingQty = openingBalanceTx?.quantity_in ?? 0;
    const openingAvgCost = openingBalanceTx?.average_cost ?? 0;
    const openingAmount = openingQty * openingAvgCost;

    let cumulativeQty = openingQty;
    let cumulativeAmount = openingAmount;

    const tableRows = [
      ...(openingBalanceTx
        ? [
            {
              date: openingBalanceTx.movement_date,
              description: openingBalanceTx.description,
              inQty: null,
              inRate: null,
              inAmount: null,
              outQty: null,
              outRate: null,
              outAmount: null,
              balanceQty: openingQty,
              avgCost: openingAvgCost || null,
              balanceAmount: openingAmount,
              isOpeningBalance: true,
            },
          ]
        : []),
      ...restTransactions.map((tx: any) => {
        const inAmt = tx.quantity_in * (tx.average_cost || 0);
        const outAmt = tx.quantity_out * (tx.average_cost || 0);
        cumulativeQty += tx.quantity_in - tx.quantity_out;
        cumulativeAmount += inAmt - outAmt;
        return {
          date: tx.movement_date,
          description: tx.description,
          inQty: tx.quantity_in || null,
          inRate: tx.quantity_in ? tx.average_cost : null,
          inAmount: tx.quantity_in ? inAmt : null,
          outQty: tx.quantity_out || null,
          outRate: tx.quantity_out ? tx.average_cost : null,
          outAmount: tx.quantity_out ? outAmt : null,
          balanceQty: cumulativeQty,
          avgCost: tx.average_cost || null,
          balanceAmount: cumulativeAmount,
          isOpeningBalance: false,
        };
      }),
    ];

    const totalInQty = restTransactions.reduce(
      (s: number, tx: any) => s + tx.quantity_in,
      0
    );
    const totalInAmount = restTransactions.reduce(
      (s: number, tx: any) => s + tx.quantity_in * (tx.average_cost || 0),
      0
    );
    const totalOutQty = restTransactions.reduce(
      (s: number, tx: any) => s + tx.quantity_out,
      0
    );
    const totalOutAmount = restTransactions.reduce(
      (s: number, tx: any) => s + tx.quantity_out * (tx.average_cost || 0),
      0
    );

    // ── Formatter helpers (mirrored from PDF) ──────────────────────────────────
    // Returns null for empty cells so Excel shows blank (not the string '-')
    const fmtQtyVal = (v: any) => (v == null || v === 0 ? null : v);
    const fmtAmtVal = (v: any) => (v == null || v === 0 ? null : v);
    const QTY_FMT = '#,###.00';
    const AMT_FMT = '#,###.00';

    // ── Workbook & worksheet ───────────────────────────────────────────────────
    const wb = createWorkbook();
    const ws = wb.addWorksheet('Item Movement');

    // ── Column definitions — two layouts depending on financePersonnel ─────────
    //
    // NON-FINANCE (5 data cols):  A=Date | B=Details | C=Qty In | D=Qty Out | E=Balance Qty
    //
    // FINANCE (11 data cols):
    //   A=Date | B=Details
    //   INWARD:  C=Qty | D=Rate | E=Amount
    //   OUTWARD: F=Qty | G=Rate | H=Amount
    //   BALANCE: I=Qty | J=Avg Cost | K=Amount
    if (financePersonnel) {
      ws.columns = [
        { width: 20 }, // A — Date
        { width: 55 }, // B — Details
        { width: 16 }, // C — In Qty
        { width: 16 }, // D — In Rate
        { width: 18 }, // E — In Amount
        { width: 16 }, // F — Out Qty
        { width: 16 }, // G — Out Rate
        { width: 18 }, // H — Out Amount
        { width: 16 }, // I — Bal Qty
        { width: 16 }, // J — Avg Cost
        { width: 18 }, // K — Bal Amount
      ];
    } else {
      ws.columns = [
        { width: 20 }, // A — Date
        { width: 40 }, // B — Details
        { width: 18 }, // C — Qty In
        { width: 18 }, // D — Qty Out
        { width: 20 }, // E — Balance Qty
      ];
    }

    const lastCol = financePersonnel ? 'K' : 'E';
    const lastColCode = financePersonnel ? 75 : 69; // K=75, E=69

    // helper: apply tableHeader style across all columns of a row
    const styleHeaderRow = (rowNum: number) => {
      for (let c = 65; c <= lastColCode; c++) {
        applyCellStyle(
          ws.getCell(`${String.fromCharCode(c)}${rowNum}`),
          CELL_STYLES.tableHeader
        );
      }
    };

    // helper: apply allThinBlack border + right-align to a numeric cell
    const setNumericCell = (
      cell: any,
      value: any,
      fmt: string,
      isBlank = false
    ) => {
      cell.value = isBlank ? null : value;
      if (!isBlank && value != null) cell.numFmt = fmt;
      applyCellStyle(cell, CELL_STYLES.dataRowText);
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
    };

    // ── ROW 1: Org name (A) + Report title (last col) ─────────────────────────
    ws.addRow([
      authOrganization.organization.name,
      ...Array(lastColCode - 66).fill(' '),
      'Inventory Item Movement',
    ]);
    ws.getCell('A1').font = { bold: true, size: 12 };
    ws.getCell(`${lastCol}1`).font = { bold: true, size: 12 };

    // ── ROW 2: Product name ────────────────────────────────────────────────────
    ws.addRow([' ', ...Array(lastColCode - 66).fill(' '), product.name]);
    ws.getCell(`${lastCol}2`).font = { bold: true, size: 11 };

    // ── ROW 3: Store name ──────────────────────────────────────────────────────
    ws.addRow([' ', ...Array(lastColCode - 66).fill(' '), store?.name ?? '']);
    ws.getCell(`${lastCol}3`).font = { bold: true, size: 11 };

    // ── ROW 4: Period ──────────────────────────────────────────────────────────
    ws.addRow([' ', ...Array(lastColCode - 66).fill(' '), reportPeriod]);
    ws.getCell(`${lastCol}4`).font = { bold: true, size: 10 };

    // ── ROW 5: Spacer ──────────────────────────────────────────────────────────
    ws.addRow([]);

    // ── ROW 6: Info labels ─────────────────────────────────────────────────────
    // PDF info section: Cost Centers (flex 2, conditional) | Printed By | Currency (finance only) | Printed On
    // Mapped across available columns
    if (financePersonnel) {
      // 11 cols: A=Cost Centers(cond)/blank, C=Printed By, E=Currency, G=Printed On
      ws.addRow([
        cost_centers.length > 0 ? 'Cost Centers' : ' ',
        ' ',
        ' ',
        'Printed By',
        ' ',
        'Currency',
        ' ',
        'Printed On',
        ' ',
        ' ',
        ' ',
      ]);
    } else {
      // 5 cols: A=Cost Centers(cond)/blank, C=Printed By, D=Printed On
      ws.addRow([
        cost_centers.length > 0 ? 'Cost Centers' : ' ',
        ' ',
        'Printed By',
        'Printed On',
        ' ',
      ]);
    }
    styleHeaderRow(6);
    ws.getRow(6).height = 20;

    // ── ROW 7: Info values ─────────────────────────────────────────────────────
    if (financePersonnel) {
      ws.addRow([
        cost_centers.length > 0
          ? cost_centers.map((cc: any) => cc.name).join(', ')
          : ' ',
        ' ',
        ' ',
        user.name,
        ' ',
        baseCurrency?.code ?? ' ',
        ' ',
        readableDate(undefined, true),
        ' ',
        ' ',
        ' ',
      ]);
    } else {
      ws.addRow([
        cost_centers.length > 0
          ? cost_centers.map((cc: any) => cc.name).join(', ')
          : ' ',
        ' ',
        user.name,
        readableDate(undefined, true),
        ' ',
      ]);
    }
    for (let c = 65; c <= lastColCode; c++) {
      ws.getCell(`${String.fromCharCode(c)}7`).border = {
        top: { style: 'thin', color: { argb: COLORS.BLACK } },
        bottom: { style: 'thin', color: { argb: COLORS.BLACK } },
        left: { style: 'thin', color: { argb: COLORS.BLACK } },
        right: { style: 'thin', color: { argb: COLORS.BLACK } },
      };
    }
    ws.getRow(7).height = 18;

    // ── ROW 8: Spacer ──────────────────────────────────────────────────────────
    ws.addRow([]);

    // ── TABLE HEADER ROW(S) ────────────────────────────────────────────────────
    if (financePersonnel) {
      // ── Header row 1: Group labels with merges ─────────────────────────────
      // A:B = Date+Details (individual), C:E = INWARD, F:H = OUTWARD, I:K = BALANCE
      const h1 = (ws.lastRow?.number ?? 0) + 1;
      ws.addRow([
        'Date',
        'Details',
        'INWARD',
        ' ',
        ' ',
        'OUTWARD',
        ' ',
        ' ',
        'BALANCE',
        ' ',
        ' ',
      ]);
      ws.getRow(h1).height = 22;

      // Merge group label cells
      ws.mergeCells(`C${h1}:E${h1}`);
      ws.mergeCells(`F${h1}:H${h1}`);
      ws.mergeCells(`I${h1}:K${h1}`);

      // Style all cells
      styleHeaderRow(h1);

      // Center-align group labels
      ['C', 'F', 'I'].forEach((col) => {
        ws.getCell(`${col}${h1}`).alignment = {
          horizontal: 'center',
          vertical: 'middle',
        };
      });

      // ── Header row 2: Sub-column labels ───────────────────────────────────
      const h2 = (ws.lastRow?.number ?? 0) + 1;
      ws.addRow([
        ' ',
        ' ',
        'QNTY',
        'RATE',
        'AMOUNT',
        'QNTY',
        'RATE',
        'AMOUNT',
        'QNTY',
        'Avg Cost',
        'AMOUNT',
      ]);
      ws.getRow(h2).height = 20;
      styleHeaderRow(h2);
      // Right-align all sub-labels except A and B
      for (let c = 67; c <= lastColCode; c++) {
        ws.getCell(`${String.fromCharCode(c)}${h2}`).alignment = {
          horizontal: 'right',
          vertical: 'middle',
        };
      }
    } else {
      // ── Single header row for non-finance ─────────────────────────────────
      const h1 = (ws.lastRow?.number ?? 0) + 1;
      ws.addRow(['Date', 'Details', 'Qty In', 'Qty Out', 'Balance']);
      ws.getRow(h1).height = 22;
      styleHeaderRow(h1);
      // Right-align numeric headers
      ['C', 'D', 'E'].forEach((col) => {
        ws.getCell(`${col}${h1}`).alignment = {
          horizontal: 'right',
          vertical: 'middle',
        };
      });
    }

    // ── DATA ROWS ──────────────────────────────────────────────────────────────
    tableRows.forEach((row: any) => {
      const rowNum = (ws.lastRow?.number ?? 0) + 1;

      // Date & Description — text cells
      applyCellStyle(ws.getCell(`A${rowNum}`), CELL_STYLES.dataRowText);
      ws.getCell(`A${rowNum}`).value = readableDate(row.date);

      applyCellStyle(ws.getCell(`B${rowNum}`), CELL_STYLES.dataRowText);
      ws.getCell(`B${rowNum}`).value = row.description;

      if (financePersonnel) {
        // INWARD
        setNumericCell(
          ws.getCell(`C${rowNum}`),
          fmtQtyVal(row.isOpeningBalance ? null : row.inQty),
          QTY_FMT
        );
        setNumericCell(
          ws.getCell(`D${rowNum}`),
          fmtAmtVal(row.isOpeningBalance ? null : row.inRate),
          AMT_FMT
        );
        setNumericCell(
          ws.getCell(`E${rowNum}`),
          fmtAmtVal(row.isOpeningBalance ? null : row.inAmount),
          AMT_FMT
        );
        // OUTWARD
        setNumericCell(
          ws.getCell(`F${rowNum}`),
          fmtQtyVal(row.isOpeningBalance ? null : row.outQty),
          QTY_FMT
        );
        setNumericCell(
          ws.getCell(`G${rowNum}`),
          fmtAmtVal(row.isOpeningBalance ? null : row.outRate),
          AMT_FMT
        );
        setNumericCell(
          ws.getCell(`H${rowNum}`),
          fmtAmtVal(row.isOpeningBalance ? null : row.outAmount),
          AMT_FMT
        );
        // BALANCE
        setNumericCell(
          ws.getCell(`I${rowNum}`),
          fmtQtyVal(row.balanceQty),
          QTY_FMT
        );
        setNumericCell(
          ws.getCell(`J${rowNum}`),
          fmtAmtVal(row.avgCost),
          AMT_FMT
        );
        setNumericCell(
          ws.getCell(`K${rowNum}`),
          fmtAmtVal(row.balanceAmount),
          AMT_FMT
        );
      } else {
        setNumericCell(
          ws.getCell(`C${rowNum}`),
          fmtQtyVal(row.isOpeningBalance ? null : row.inQty),
          QTY_FMT
        );
        setNumericCell(
          ws.getCell(`D${rowNum}`),
          fmtQtyVal(row.isOpeningBalance ? null : row.outQty),
          QTY_FMT
        );
        setNumericCell(
          ws.getCell(`E${rowNum}`),
          fmtQtyVal(row.balanceQty),
          QTY_FMT
        );
        // Balance is always shown (even opening)
        ws.getCell(`E${rowNum}`).font = { bold: true, size: 10 };
      }
    });

    // ── TOTAL ROW ──────────────────────────────────────────────────────────────
    // PDF: merged label "TOTAL" (flex 4.15) then totals for the qty/amount columns
    const totalRowNum = (ws.lastRow?.number ?? 0) + 1;
    ws.getRow(totalRowNum).height = 20;

    if (financePersonnel) {
      // A:B merged = TOTAL label
      ws.mergeCells(`A${totalRowNum}:B${totalRowNum}`);
      ws.getCell(`A${totalRowNum}`).value = 'TOTAL';
      ws.getCell(`A${totalRowNum}`).alignment = {
        horizontal: 'left',
        vertical: 'middle',
      };

      // C = totalInQty, D = blank, E = totalInAmount
      // F = totalOutQty, G = blank, H = totalOutAmount
      // I = blank, J = blank, K = blank
      const totalCells: { col: string; val: any; fmt: string }[] = [
        { col: 'C', val: fmtQtyVal(totalInQty), fmt: QTY_FMT },
        { col: 'D', val: null, fmt: AMT_FMT },
        { col: 'E', val: fmtAmtVal(totalInAmount), fmt: AMT_FMT },
        { col: 'F', val: fmtQtyVal(totalOutQty), fmt: QTY_FMT },
        { col: 'G', val: null, fmt: AMT_FMT },
        { col: 'H', val: fmtAmtVal(totalOutAmount), fmt: AMT_FMT },
        { col: 'I', val: null, fmt: QTY_FMT },
        { col: 'J', val: null, fmt: AMT_FMT },
        { col: 'K', val: null, fmt: AMT_FMT },
      ];
      totalCells.forEach(({ col, val, fmt }) => {
        const cell = ws.getCell(`${col}${totalRowNum}`);
        cell.value = val;
        applyCellStyle(cell, CELL_STYLES.tableHeader);
        if (val != null) {
          cell.numFmt = fmt;
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
      });
    } else {
      // A:B merged = TOTAL label
      ws.mergeCells(`A${totalRowNum}:B${totalRowNum}`);
      ws.getCell(`A${totalRowNum}`).value = 'TOTAL';
      ws.getCell(`A${totalRowNum}`).alignment = {
        horizontal: 'left',
        vertical: 'middle',
      };

      // C = totalInQty, D = totalOutQty, E = blank
      const cell_C = ws.getCell(`C${totalRowNum}`);
      cell_C.value = fmtQtyVal(totalInQty);

      const cell_D = ws.getCell(`D${totalRowNum}`);
      cell_D.value = fmtQtyVal(totalOutQty);

      ws.getCell(`E${totalRowNum}`).value = null;

      [cell_C, cell_D, ws.getCell(`E${totalRowNum}`)].forEach((cell) =>
        applyCellStyle(cell, CELL_STYLES.tableHeader)
      );

      // Set alignment after applyCellStyle so it isn't overwritten
      if (totalInQty) {
        cell_C.numFmt = QTY_FMT;
        cell_C.alignment = { horizontal: 'right', vertical: 'middle' };
      }
      if (totalOutQty) {
        cell_D.numFmt = QTY_FMT;
        cell_D.alignment = { horizontal: 'right', vertical: 'middle' };
      }
    }

    // Apply tableHeader style to the label cell (always) then re-apply left alignment
    applyCellStyle(ws.getCell(`A${totalRowNum}`), CELL_STYLES.tableHeader);
    ws.getCell(`A${totalRowNum}`).alignment = {
      horizontal: 'left',
      vertical: 'middle',
    };

    // Return Excel buffer
    return await wb.xlsx.writeBuffer();
  } catch (e: any) {
    console.error('Error exporting Excel:', e);
    throw new Error(
      e?.message || 'Excel export failed during workbook generation'
    );
  }
}
