import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { applyCellStyle, CELL_STYLES, COLORS } from '../styles';
import { createWorkbook } from '../workBook';

const AMT_FMT = '#,###.00';
const QTY_FMT = '#,###.###';

function styleHeaderRow(ws: any, rowNum: number, lastColCode: number) {
  for (let c = 65; c <= lastColCode; c++) {
    applyCellStyle(
      ws.getCell(`${String.fromCharCode(c)}${rowNum}`),
      CELL_STYLES.tableHeader
    );
  }
}

function styleBorderRow(ws: any, rowNum: number, lastColCode: number) {
  for (let c = 65; c <= lastColCode; c++) {
    applyCellStyle(
      ws.getCell(`${String.fromCharCode(c)}${rowNum}`),
      CELL_STYLES.dataRowText
    );
  }
}

function setNum(cell: any, value: any, fmt: string) {
  cell.value = value ?? null;
  if (value != null) {
    cell.numFmt = fmt;
    cell.alignment = { horizontal: 'right', vertical: 'middle' };
  }
}

export async function exportPurchaseRequisitionExcel(exportedData: any) {
  try {
    const { requisition, organization } = exportedData;

    const orgName = organization?.name || '';

    const isLeaveRequest =
      requisition?.approval_chain?.process_type?.toLowerCase() ===
      'leave_request';
    const isPurchase =
      requisition?.approval_chain?.process_type?.toLowerCase() === 'purchase';

    const requisitionItems: any[] =
      'items' in requisition ? requisition.items || [] : [];
    const additionalCosts: any[] = isPurchase
      ? ((requisition?.additional_costs || []) as any[])
      : [];

    const leaveSource =
      (requisition?.leave_items && requisition.leave_items.length
        ? requisition.leave_items
        : requisitionItems) || [];

    const leaveItems = (leaveSource as any[]).map((item: any) => ({
      ...item,
      days_requested: Number(item?.days_requested || 0),
      employee:
        item?.employee ||
        (item?.employee_number || item?.first_name || item?.last_name
          ? {
              employee_number: item?.employee_number,
              first_name: item?.first_name,
              last_name: item?.last_name,
            }
          : undefined),
      leave_type:
        item?.leave_type ||
        (item?.leave_type_name ? { name: item.leave_type_name } : undefined),
    }));

    const totalVAT =
      requisitionItems
        ?.filter((item: any) => (item.vat_percentage || 0) > 0)
        .reduce(
          (total: number, item: any) =>
            total +
            item.rate * item.quantity * (item.vat_percentage || 0) * 0.01,
          0
        ) || 0;

    const grandTotal =
      requisitionItems?.reduce(
        (total: number, item: any) =>
          total +
          item.quantity * item.rate * (1 + (item.vat_percentage || 0) * 0.01),
        0
      ) || 0;

    const totalLeaveDays = leaveItems.reduce(
      (sum: number, item: any) => sum + Number(item.days_requested || 0),
      0
    );

    const subtotal = requisitionItems.reduce(
      (total: number, item: any) =>
        total + (item.quantity || 0) * (item.rate || 0),
      0
    );

    const showVATCol = isPurchase && requisition.vat_amount > 0;

    const reportTitle = isLeaveRequest
      ? 'Leave Request'
      : isPurchase
        ? 'Purchase Requisition'
        : 'Payment Requisition';

    const LAST_COL_CODE =
      isLeaveRequest || (isPurchase && showVATCol) ? 70 : 69;
    const amtCol = String.fromCharCode(LAST_COL_CODE);
    const labelEndCol = String.fromCharCode(LAST_COL_CODE - 1);
    const colCount = LAST_COL_CODE - 64;

    const wb = createWorkbook();
    const ws = wb.addWorksheet(reportTitle);

    if (isLeaveRequest) {
      ws.columns = [
        { width: 20 },
        { width: 30 },
        { width: 22 },
        { width: 18 },
        { width: 18 },
        { width: 12 },
      ];
    } else if (isPurchase && showVATCol) {
      ws.columns = [
        { width: 20 },
        { width: 38 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
        { width: 22 },
      ];
    } else {
      ws.columns = [
        { width: 20 },
        { width: 38 },
        { width: 18 },
        { width: 18 },
        { width: 22 },
      ];
    }

    ws.addRow([orgName, ' ', ' ', ' ', ' ', reportTitle]);
    ws.getCell('A1').font = { bold: true, size: 12 };
    ws.getCell(`${amtCol}1`).font = { bold: true, size: 12 };
    ws.getCell(`${amtCol}1`).alignment = { horizontal: 'right' };

    ws.addRow([' ', ' ', ' ', ' ', ' ', requisition?.requisitionNo || '']);
    ws.getCell(`${amtCol}2`).font = { bold: true, size: 11 };
    ws.getCell(`${amtCol}2`).alignment = { horizontal: 'right' };

    ws.addRow([]);

    ws.addRow(['Requisition Date', ' ', 'Cost Center', ' ', ' ', ' ']);
    ws.getCell('A4').font = {
      bold: true,
      size: 9,
      color: { argb: COLORS.GRAY },
    };
    ws.getCell('C4').font = {
      bold: true,
      size: 9,
      color: { argb: COLORS.GRAY },
    };

    ws.addRow([
      readableDate(requisition?.requisition_date),
      ' ',
      requisition?.cost_center?.name || '',
      ' ',
      ' ',
      ' ',
    ]);
    ws.getRow(5).height = 16;

    ws.addRow([]);

    const headerRowNum = (ws.lastRow?.number ?? 0) + 1;

    if (isLeaveRequest) {
      ws.addRow(['S/N', 'Employee', 'Leave Type', 'Start', 'End', 'Days']);
      styleHeaderRow(ws, headerRowNum, LAST_COL_CODE);
      ws.getCell(`F${headerRowNum}`).alignment = {
        horizontal: 'right',
        vertical: 'middle',
      };
    } else {
      const productOrLedgerLabel = isPurchase ? 'Product' : 'Ledger';
      if (showVATCol) {
        ws.addRow([
          'S/N',
          productOrLedgerLabel,
          'Quantity',
          'Rate',
          'VAT',
          'Amount',
        ]);
      } else {
        ws.addRow([
          'S/N',
          productOrLedgerLabel,
          'Quantity',
          'Rate',
          'Amount',
          ' ',
        ]);
      }
      styleHeaderRow(ws, headerRowNum, LAST_COL_CODE);
      ['C', 'D', ...(showVATCol ? ['E', 'F'] : ['E'])].forEach((col) => {
        ws.getCell(`${col}${headerRowNum}`).alignment = {
          horizontal: 'right',
          vertical: 'middle',
        };
      });
    }
    ws.getRow(headerRowNum).height = 20;

    if (isLeaveRequest) {
      leaveItems.forEach((item: any, index: number) => {
        const rowNum = (ws.lastRow?.number ?? 0) + 1;
        const employeeName = [
          item.employee?.first_name,
          item.employee?.last_name,
          item.employee?.employee_number,
        ]
          .filter(Boolean)
          .join(' ');

        ws.addRow([
          index + 1,
          employeeName,
          item.leave_type?.name || '-',
          readableDate(item.start_date, false),
          readableDate(item.end_date, false),
          null,
        ]);
        styleBorderRow(ws, rowNum, LAST_COL_CODE);
        ws.getCell(`A${rowNum}`).alignment = {
          horizontal: 'left',
          vertical: 'middle',
        };
        setNum(
          ws.getCell(`F${rowNum}`),
          Number(item.days_requested || 0),
          QTY_FMT
        );
      });
    } else {
      requisitionItems.forEach((item: any, index: number) => {
        const rowNum = (ws.lastRow?.number ?? 0) + 1;

        const productOrLedgerName = isPurchase
          ? (item as any).product?.name || ''
          : (item as any).ledger?.name || '';

        const nameParts = [
          productOrLedgerName,
          item.relatableNo ? `${item.relatableNo}` : null,
          item.remarks ? `(${item.remarks})` : null,
        ]
          .filter(Boolean)
          .join('\n');

        const itemAmount =
          item.quantity * item.rate * (1 + (item.vat_percentage || 0) * 0.01);
        const itemVAT = item.rate * (item.vat_percentage || 0) * 0.01;

        ws.addRow([index + 1, nameParts, null, null, null, null]);
        styleBorderRow(ws, rowNum, LAST_COL_CODE);
        ws.getCell(`A${rowNum}`).alignment = {
          horizontal: 'left',
          vertical: 'middle',
        };

        if (nameParts.includes('\n')) {
          ws.getCell(`B${rowNum}`).alignment = {
            wrapText: true,
            vertical: 'top',
          };
        }

        const qtyDisplay = item.measurement_unit?.symbol
          ? `${(item.quantity || 0).toLocaleString('en-US', { maximumFractionDigits: 5 })} ${item.measurement_unit.symbol}`
          : null;
        if (qtyDisplay) {
          ws.getCell(`C${rowNum}`).value = qtyDisplay;
          ws.getCell(`C${rowNum}`).alignment = {
            horizontal: 'right',
            vertical: 'middle',
          };
        } else {
          setNum(ws.getCell(`C${rowNum}`), item.quantity, QTY_FMT);
        }

        setNum(ws.getCell(`D${rowNum}`), item.rate, AMT_FMT);

        if (showVATCol) {
          setNum(ws.getCell(`E${rowNum}`), itemVAT, AMT_FMT);
          setNum(ws.getCell(`F${rowNum}`), itemAmount, AMT_FMT);
        } else {
          setNum(ws.getCell(`E${rowNum}`), itemAmount, AMT_FMT);
        }

        if (Array.isArray(item?.vendors) && item.vendors.length > 0) {
          const vHeaderRow = (ws.lastRow?.number ?? 0) + 1;
          ws.addRow([' ', 'Vendors', ' ', ' ', ' ', ' ']);
          ws.getCell(`A${vHeaderRow}`).border = {
            bottom: { style: 'thin', color: { argb: COLORS.BLACK } },
          };
          for (let c = 66; c <= LAST_COL_CODE; c++) {
            applyCellStyle(
              ws.getCell(`${String.fromCharCode(c)}${vHeaderRow}`),
              CELL_STYLES.tableHeader
            );
          }
          ws.getRow(vHeaderRow).height = 16;

          item.vendors.forEach((vendor: any) => {
            const vRowNum = (ws.lastRow?.number ?? 0) + 1;
            ws.addRow([
              ' ',
              vendor.name || '',
              vendor.remarks || '',
              ' ',
              ' ',
              ' ',
            ]);
            ws.getCell(`A${vRowNum}`).border = {
              bottom: { style: 'thin', color: { argb: COLORS.BLACK } },
            };
            for (let c = 66; c <= LAST_COL_CODE; c++) {
              applyCellStyle(
                ws.getCell(`${String.fromCharCode(c)}${vRowNum}`),
                CELL_STYLES.dataRowText
              );
            }
          });

          ws.addRow([]);
        }
      });
    }

    if (isLeaveRequest) {
      const tlRow = (ws.lastRow?.number ?? 0) + 1;
      ws.addRow([]);
      ws.mergeCells(`A${tlRow}:${labelEndCol}${tlRow}`);
      ws.getCell(`A${tlRow}`).value = 'Total Leave Days';
      styleHeaderRow(ws, tlRow, LAST_COL_CODE);
      ws.getCell(`A${tlRow}`).alignment = {
        horizontal: 'right',
        vertical: 'middle',
      };
      ws.getCell(`${amtCol}${tlRow}`).value =
        `${totalLeaveDays.toLocaleString()} day(s)`;
      ws.getCell(`${amtCol}${tlRow}`).alignment = {
        horizontal: 'right',
        vertical: 'middle',
      };
      ws.getRow(tlRow).height = 18;
    } else {
      const totalRow = (ws.lastRow?.number ?? 0) + 1;
      ws.addRow([]);
      ws.mergeCells(`A${totalRow}:${labelEndCol}${totalRow}`);
      ws.getCell(`A${totalRow}`).value = 'Total';
      styleHeaderRow(ws, totalRow, LAST_COL_CODE);
      ws.getCell(`A${totalRow}`).alignment = {
        horizontal: 'right',
        vertical: 'middle',
      };
      setNum(ws.getCell(`${amtCol}${totalRow}`), subtotal, AMT_FMT);
      ws.getRow(totalRow).height = 18;

      if (isPurchase && totalVAT > 0) {
        const vatRow = (ws.lastRow?.number ?? 0) + 1;
        ws.addRow([]);
        ws.mergeCells(`A${vatRow}:${labelEndCol}${vatRow}`);
        ws.getCell(`A${vatRow}`).value = 'VAT';
        styleHeaderRow(ws, vatRow, LAST_COL_CODE);
        ws.getCell(`A${vatRow}`).alignment = {
          horizontal: 'right',
          vertical: 'middle',
        };
        setNum(ws.getCell(`${amtCol}${vatRow}`), totalVAT, AMT_FMT);
        ws.getRow(vatRow).height = 18;

        const gtRow = (ws.lastRow?.number ?? 0) + 1;
        ws.addRow([]);
        ws.mergeCells(`A${gtRow}:${labelEndCol}${gtRow}`);
        ws.getCell(`A${gtRow}`).value = 'Grand Total (VAT Incl.)';
        styleHeaderRow(ws, gtRow, LAST_COL_CODE);
        ws.getCell(`A${gtRow}`).alignment = {
          horizontal: 'right',
          vertical: 'middle',
        };
        setNum(ws.getCell(`${amtCol}${gtRow}`), grandTotal, AMT_FMT);
        ws.getRow(gtRow).height = 18;
      }
    }

    if (!isLeaveRequest && isPurchase && additionalCosts.length > 0) {
      ws.addRow([]);

      const acLabelRow = (ws.lastRow?.number ?? 0) + 1;
      ws.addRow(['Additional Costs', ' ', ' ', ' ', ' ', ' ']);
      ws.getCell(`A${acLabelRow}`).font = {
        bold: true,
        size: 9,
        color: { argb: COLORS.GRAY },
      };

      const acHeaderRow = (ws.lastRow?.number ?? 0) + 1;
      ws.addRow([
        'S/N',
        'Cost Name',
        ...Array(colCount - 3).fill(' '),
        'Amount',
      ]);
      styleHeaderRow(ws, acHeaderRow, LAST_COL_CODE);
      ws.mergeCells(`B${acHeaderRow}:${labelEndCol}${acHeaderRow}`);
      ws.getCell(`B${acHeaderRow}`).value = 'Cost Name';
      ws.getCell(`${amtCol}${acHeaderRow}`).alignment = {
        horizontal: 'right',
        vertical: 'middle',
      };
      ws.getRow(acHeaderRow).height = 18;

      additionalCosts.forEach((cost: any, index: number) => {
        const acRowNum = (ws.lastRow?.number ?? 0) + 1;
        const costCurrencyCode =
          cost.currency?.code ||
          cost.currency_name ||
          requisition.currency?.code ||
          '';
        const costLabel =
          cost.credit_ledger_name || cost.ledger?.name || cost.name || '-';
        const costAmountDisplay =
          `${costCurrencyCode} ${Number(cost.amount || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`.trim();

        ws.addRow([
          index + 1,
          costLabel,
          ...Array(colCount - 3).fill(' '),
          costAmountDisplay,
        ]);
        styleBorderRow(ws, acRowNum, LAST_COL_CODE);
        ws.mergeCells(`B${acRowNum}:${labelEndCol}${acRowNum}`);
        ws.getCell(`A${acRowNum}`).alignment = {
          horizontal: 'left',
          vertical: 'middle',
        };
        ws.getCell(`${amtCol}${acRowNum}`).alignment = {
          horizontal: 'right',
          vertical: 'middle',
        };
      });
    }

    ws.addRow([]);

    if (requisition?.remarks) {
      const footerLabelRow = (ws.lastRow?.number ?? 0) + 1;
      ws.addRow(['Remarks', ' ', ' ', 'Requested By', ' ', ' ']);
      ws.getCell(`A${footerLabelRow}`).font = {
        bold: true,
        size: 9,
        color: { argb: COLORS.GRAY },
      };
      ws.getCell(`D${footerLabelRow}`).font = {
        bold: true,
        size: 9,
        color: { argb: COLORS.GRAY },
      };

      const footerValRow = (ws.lastRow?.number ?? 0) + 1;
      ws.addRow([
        requisition.remarks,
        ' ',
        ' ',
        requisition?.creator?.name || '',
        ' ',
        ' ',
      ]);
      ws.getRow(footerValRow).height = 16;
    } else {
      const footerLabelRow = (ws.lastRow?.number ?? 0) + 1;
      ws.addRow(['Requested By', ' ', ' ', ' ', ' ', ' ']);
      ws.getCell(`A${footerLabelRow}`).font = {
        bold: true,
        size: 9,
        color: { argb: COLORS.GRAY },
      };

      const footerValRow = (ws.lastRow?.number ?? 0) + 1;
      ws.addRow([requisition?.creator?.name || '', ' ', ' ', ' ', ' ', ' ']);
      ws.getRow(footerValRow).height = 16;
    }

    return await wb.xlsx.writeBuffer();
  } catch (e: any) {
    console.error('Error exporting Excel:', e);
    throw new Error(
      e?.message || 'Excel export failed during workbook generation'
    );
  }
}
