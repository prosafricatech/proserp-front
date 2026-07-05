// stockMovement.tsx
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { applyCellStyle, CELL_STYLES, getAlternatingRowFill } from '../styles';
import { getExcelColumnName } from '../uitls';
import { createWorkbook } from '../workBook';

const AMT_FMT = '#,##0.00';
const QTY_FMT = '#,##0.##';

function styleHeaderRow(ws: any, rowNum: number, totalCols: number) {
  for (let i = 1; i <= totalCols; i++) {
    applyCellStyle(
      ws.getCell(`${getExcelColumnName(i)}${rowNum}`),
      CELL_STYLES.tableHeader
    );
  }
}

function setNum(cell: any, value: any, fmt: string) {
  cell.value = value ?? null;
  if (value != null && !isNaN(value)) {
    cell.numFmt = fmt;
    cell.alignment = { horizontal: 'right', vertical: 'middle' };
  }
}

function setText(cell: any, value: any) {
  cell.value = value ?? '';
  cell.alignment = { horizontal: 'left', vertical: 'middle' };
}

export async function exportStockMovementReportToExcel(exportedData: any) {
  try {
    const {
      movementsData,
      authOrganization,
      user,
      store,
      productCategories,
      checkOrganizationPermission,
      organizationHasSubscribed,
      reportTitle,
      withDetails = false,
    } = exportedData;

    const orgName = authOrganization?.organization?.name || '';
    const costCenters = movementsData?.filters?.cost_centers || [];
    const from = movementsData?.filters?.from;
    const to = movementsData?.filters?.to;
    const reportPeriod = `${readableDate(from, true)} - ${readableDate(to, true)}`;
    const hasAccountsPermission = checkOrganizationPermission;
    const hasManufacturingModule = organizationHasSubscribed;

    // Calculate total estimated closing value
    const totalEstimatedValue = (movementsData?.movements || []).reduce(
      (total: number, movement: any) => {
        const closingBalance =
          parseFloat(movement.opening_balance || 0) +
          parseFloat(movement.quantity_received || 0) +
          parseFloat(movement.quantity_produced || 0) -
          parseFloat(movement.quantity_sold || 0) -
          parseFloat(movement.quantity_consumed || 0) -
          parseFloat(movement.quantity_transferred_out || 0) +
          parseFloat(movement.quantity_transferred_in || 0) +
          parseFloat(movement.stock_gain || 0) -
          parseFloat(movement.stock_loss || 0);

        return total + (movement.latest_rate || 0) * closingBalance;
      },
      0
    );

    // Determine column structure based on withDetails flag
    let columnDefinitions;

    if (withDetails) {
      // WITH DETAILS: Latest Rate moves after Unit, then Quantity & Amount sub-columns for each column
      const baseColumns = [
        { key: 'sn', label: 'S/N', width: 6, isNumeric: false, hasSub: false },
        {
          key: 'product',
          label: 'Product',
          width: 25,
          isNumeric: false,
          hasSub: false,
        },
        {
          key: 'unit',
          label: 'Unit',
          width: 10,
          isNumeric: false,
          hasSub: false,
        },
        {
          key: 'latestRate',
          label: 'Latest Rate',
          width: 16,
          isNumeric: true,
          hasSub: false,
        },
        {
          key: 'openingBalance',
          label: 'Opening Balance',
          width: 16,
          isNumeric: true,
          hasSub: true,
        },
        {
          key: 'purchaseReceived',
          label: 'Purchase Received',
          width: 16,
          isNumeric: true,
          hasSub: true,
        },
      ];

      // Add Produced Quantity column if manufacturing module is enabled
      const producedColumn = hasManufacturingModule
        ? [
            {
              key: 'produced',
              label: 'Produced Quantity',
              width: 16,
              isNumeric: true,
              hasSub: true,
            },
          ]
        : [];

      const remainingColumns = [
        {
          key: 'transferIn',
          label: 'Transfer In',
          width: 16,
          isNumeric: true,
          hasSub: true,
        },
        {
          key: 'transferOut',
          label: 'Transfer Out',
          width: 16,
          isNumeric: true,
          hasSub: true,
        },
        {
          key: 'stockGain',
          label: 'Stock Gain',
          width: 16,
          isNumeric: true,
          hasSub: true,
        },
        {
          key: 'stockLoss',
          label: 'Stock Loss',
          width: 16,
          isNumeric: true,
          hasSub: true,
        },
        {
          key: 'consumed',
          label: 'Consumed',
          width: 16,
          isNumeric: true,
          hasSub: true,
        },
        {
          key: 'sold',
          label: 'Sold',
          width: 16,
          isNumeric: true,
          hasSub: true,
        },
        {
          key: 'closingBalance',
          label: 'Closing Balance',
          width: 16,
          isNumeric: true,
          hasSub: true,
        },
      ];

      const accountsColumns = hasAccountsPermission
        ? [
            {
              key: 'estimatedValue',
              label: 'Est. Closing Value',
              width: 18,
              isNumeric: true,
              hasSub: false,
            },
          ]
        : [];

      columnDefinitions = [
        ...baseColumns,
        ...producedColumn,
        ...remainingColumns,
        ...accountsColumns,
      ];
    } else {
      // WITHOUT DETAILS: Original format
      const baseColumns = [
        { key: 'sn', label: 'S/N', width: 6, isNumeric: false, hasSub: false },
        {
          key: 'product',
          label: 'Product',
          width: 30,
          isNumeric: false,
          hasSub: false,
        },
        {
          key: 'unit',
          label: 'Unit',
          width: 10,
          isNumeric: false,
          hasSub: false,
        },
        {
          key: 'openingBalance',
          label: 'Opening Balance',
          width: 16,
          isNumeric: true,
          hasSub: false,
        },
        {
          key: 'purchaseReceived',
          label: 'Purchase Received',
          width: 16,
          isNumeric: true,
          hasSub: false,
        },
      ];

      const producedColumn = hasManufacturingModule
        ? [
            {
              key: 'produced',
              label: 'Produced Quantity',
              width: 16,
              isNumeric: true,
              hasSub: false,
            },
          ]
        : [];

      const remainingColumns = [
        {
          key: 'transferIn',
          label: 'Transfer In',
          width: 16,
          isNumeric: true,
          hasSub: false,
        },
        {
          key: 'transferOut',
          label: 'Transfer Out',
          width: 16,
          isNumeric: true,
          hasSub: false,
        },
        {
          key: 'stockGain',
          label: 'Stock Gain',
          width: 16,
          isNumeric: true,
          hasSub: false,
        },
        {
          key: 'stockLoss',
          label: 'Stock Loss',
          width: 16,
          isNumeric: true,
          hasSub: false,
        },
        {
          key: 'consumed',
          label: 'Consumed',
          width: 16,
          isNumeric: true,
          hasSub: false,
        },
        {
          key: 'sold',
          label: 'Sold',
          width: 16,
          isNumeric: true,
          hasSub: false,
        },
        {
          key: 'closingBalance',
          label: 'Closing Balance',
          width: 16,
          isNumeric: true,
          hasSub: false,
        },
      ];

      const accountsColumns = hasAccountsPermission
        ? [
            {
              key: 'latestRate',
              label: 'Latest Rate',
              width: 16,
              isNumeric: true,
              hasSub: false,
            },
            {
              key: 'estimatedValue',
              label: 'Est. Closing Value',
              width: 18,
              isNumeric: true,
              hasSub: false,
            },
          ]
        : [];

      columnDefinitions = [
        ...baseColumns,
        ...producedColumn,
        ...remainingColumns,
        ...accountsColumns,
      ];
    }

    // Calculate actual total columns (accounting for sub-columns)
    let totalCols = 0;
    columnDefinitions.forEach((col) => {
      if (withDetails && col.hasSub) {
        totalCols += 2; // Each hasSub column takes 2 columns (Quantity + Amount)
      } else {
        totalCols += 1;
      }
    });

    const lastCol = getExcelColumnName(totalCols);

    // Workbook
    const wb = createWorkbook();
    const ws = wb.addWorksheet(reportTitle || 'Stock Movement');

    // Set column widths based on actual column positions
    let colPos = 1;
    columnDefinitions.forEach((col) => {
      if (withDetails && col.hasSub) {
        ws.getColumn(getExcelColumnName(colPos)).width = col.width;
        ws.getColumn(getExcelColumnName(colPos + 1)).width = col.width;
        colPos += 2;
      } else {
        ws.getColumn(getExcelColumnName(colPos)).width = col.width;
        colPos += 1;
      }
    });

    // ---- HEADER SECTION ----
    // Row 1: Org name (left) + Report title (right)
    const r1 = Array(totalCols).fill('');
    r1[0] = orgName;
    r1[totalCols - 1] = reportTitle || 'Stock Movement';
    ws.addRow(r1);
    ws.getCell('A1').font = { bold: true, size: 14 };
    ws.getCell(`${lastCol}1`).font = { bold: true, size: 14 };
    ws.getCell(`${lastCol}1`).alignment = {
      horizontal: 'right',
      vertical: 'middle',
    };
    ws.getRow(1).height = 25;

    // Row 2: Store name (right)
    const r2 = Array(totalCols).fill('');
    r2[totalCols - 1] = store?.name || '';
    ws.addRow(r2);
    ws.getCell(`${lastCol}2`).font = { bold: true, size: 12 };
    ws.getCell(`${lastCol}2`).alignment = {
      horizontal: 'right',
      vertical: 'middle',
    };
    ws.getRow(2).height = 20;

    // Row 3: Period (right)
    const r3 = Array(totalCols).fill('');
    r3[totalCols - 1] = reportPeriod;
    ws.addRow(r3);
    ws.getCell(`${lastCol}3`).font = { size: 11 };
    ws.getCell(`${lastCol}3`).alignment = {
      horizontal: 'right',
      vertical: 'middle',
    };
    ws.getRow(3).height = 18;

    // Row 4: Spacer
    ws.addRow([]);

    // ---- META INFO SECTION ----
    const addMetaRow = (label: string, value: string, rowNum: number) => {
      ws.getCell(`A${rowNum}`).value = label;
      ws.getCell(`A${rowNum}`).font = {
        bold: true,
        size: 9,
        color: { argb: 'FF666666' },
      };
      ws.getCell(`B${rowNum}`).value = value;
      ws.getCell(`B${rowNum}`).font = { size: 10 };

      // Apply borders to meta row cells
      for (let i = 1; i <= 2; i++) {
        applyCellStyle(
          ws.getCell(`${getExcelColumnName(i)}${rowNum}`),
          CELL_STYLES.dataRowText
        );
      }
      ws.getRow(rowNum).height = 18;
    };

    let metaRow = (ws.lastRow?.number ?? 0) + 1;

    // Cost Centers
    if (costCenters.length > 0) {
      costCenters.forEach((cc: any, index: number) => {
        addMetaRow(index === 0 ? 'Cost Centers' : '', cc.name, metaRow);
        metaRow++;
      });
    } else {
      addMetaRow('Cost Centers', 'All', metaRow);
      metaRow++;
    }

    // Product Categories
    if (productCategories?.length > 0) {
      addMetaRow(
        'Categories',
        productCategories.map((cat: any) => cat.name).join(', '),
        metaRow
      );
      metaRow++;
    } else {
      addMetaRow('Categories', 'All', metaRow);
      metaRow++;
    }

    // Estimated Closing Value (if permission)
    if (hasAccountsPermission) {
      addMetaRow(
        'Estimated Closing Value',
        totalEstimatedValue.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        metaRow
      );
      metaRow++;
    }

    // Printed By & On
    addMetaRow('Printed By', user?.name || '', metaRow);
    metaRow++;
    addMetaRow('Printed On', readableDate(undefined, true), metaRow);
    metaRow++;

    // Spacer before table
    ws.addRow([]);
    const tableStartRow = (ws.lastRow?.number ?? 0) + 1;

    // ---- TABLE HEADERS ----
    let headerRow = tableStartRow;

    if (withDetails) {
      // WITH DETAILS: Two header rows - main headers + sub-headers (Quantity/Amount)

      // Row 1: Main headers with merges for columns with sub-columns
      let currentCol = 1;

      // First pass: Set header values and merges
      columnDefinitions.forEach((col) => {
        if (col.hasSub) {
          // This column needs a merged header for Quantity/Amount
          const startCol = getExcelColumnName(currentCol);
          const endCol = getExcelColumnName(currentCol + 1);
          ws.mergeCells(`${startCol}${headerRow}:${endCol}${headerRow}`);
          const cell = ws.getCell(`${startCol}${headerRow}`);
          cell.value = col.label;
          applyCellStyle(cell, CELL_STYLES.tableHeader);
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          currentCol += 2;
        } else {
          const cell = ws.getCell(
            `${getExcelColumnName(currentCol)}${headerRow}`
          );
          cell.value = col.label;
          applyCellStyle(cell, CELL_STYLES.tableHeader);
          if (col.isNumeric) {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          } else {
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
          }
          currentCol++;
        }
      });

      ws.getRow(headerRow).height = 22;
      headerRow++;

      // Row 2: Sub-headers (Quantity/Amount for columns with sub-columns)
      currentCol = 1;
      columnDefinitions.forEach((col) => {
        if (col.hasSub) {
          // Quantity sub-header
          const qtyCell = ws.getCell(
            `${getExcelColumnName(currentCol)}${headerRow}`
          );
          qtyCell.value = 'Quantity';
          applyCellStyle(qtyCell, CELL_STYLES.tableHeader);
          qtyCell.alignment = { horizontal: 'center', vertical: 'middle' };
          qtyCell.font = { bold: true, size: 9 };

          // Amount sub-header
          const amtCell = ws.getCell(
            `${getExcelColumnName(currentCol + 1)}${headerRow}`
          );
          amtCell.value = 'Amount';
          applyCellStyle(amtCell, CELL_STYLES.tableHeader);
          amtCell.alignment = { horizontal: 'center', vertical: 'middle' };
          amtCell.font = { bold: true, size: 9 };

          currentCol += 2;
        } else {
          // Regular column (no sub-header) - empty
          const cell = ws.getCell(
            `${getExcelColumnName(currentCol)}${headerRow}`
          );
          applyCellStyle(cell, CELL_STYLES.tableHeader);
          cell.value = '';
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          currentCol++;
        }
      });

      ws.getRow(headerRow).height = 18;
    } else {
      // WITHOUT DETAILS: Single header row
      let currentCol = 1;
      columnDefinitions.forEach((col) => {
        const cell = ws.getCell(
          `${getExcelColumnName(currentCol)}${headerRow}`
        );
        cell.value = col.label;
        applyCellStyle(cell, CELL_STYLES.tableHeader);
        if (col.isNumeric) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }
        currentCol++;
      });
      ws.getRow(headerRow).height = 22;
    }

    const dataStartRow = headerRow + 1;

    // ---- DATA ROWS ----
    (movementsData?.movements || []).forEach((movement: any, index: number) => {
      const rowNum = dataStartRow + index;
      const fill = getAlternatingRowFill(index);

      const openingBalance = parseFloat(movement.opening_balance || 0);
      const quantityReceived = parseFloat(movement.quantity_received || 0);
      const quantityProduced = parseFloat(movement.quantity_produced || 0);
      const quantitySold = parseFloat(movement.quantity_sold || 0);
      const quantityConsumed = parseFloat(movement.quantity_consumed || 0);
      const quantityTransferredIn = parseFloat(
        movement.quantity_transferred_in || 0
      );
      const quantityTransferredOut = parseFloat(
        movement.quantity_transferred_out || 0
      );
      const stockGain = parseFloat(movement.stock_gain || 0);
      const stockLoss = parseFloat(movement.stock_loss || 0);
      const latestRate = movement.latest_rate || 0;

      const closingBalance =
        openingBalance +
        quantityReceived +
        quantityProduced -
        quantitySold -
        quantityConsumed -
        quantityTransferredOut +
        quantityTransferredIn +
        stockGain -
        stockLoss;

      const getValue = (key: string) => {
        switch (key) {
          case 'sn':
            return index + 1;
          case 'product':
            return movement.name || '';
          case 'unit':
            return movement.unit_symbol || '';
          case 'latestRate':
            return latestRate;
          case 'openingBalance':
            return openingBalance;
          case 'purchaseReceived':
            return quantityReceived;
          case 'produced':
            return quantityProduced;
          case 'transferIn':
            return quantityTransferredIn;
          case 'transferOut':
            return quantityTransferredOut;
          case 'stockGain':
            return stockGain;
          case 'stockLoss':
            return stockLoss;
          case 'consumed':
            return quantityConsumed;
          case 'sold':
            return quantitySold;
          case 'closingBalance':
            return closingBalance;
          case 'estimatedValue':
            return latestRate * closingBalance;
          default:
            return null;
        }
      };

      const getAmount = (quantity: number) => {
        return latestRate * quantity;
      };

      let currentCol = 1;

      columnDefinitions.forEach((col) => {
        if (withDetails && col.hasSub) {
          // With Details: This column has Quantity and Amount sub-columns
          const qtyValue = getValue(col.key);
          const qtyNum = typeof qtyValue === 'number' ? qtyValue : 0;
          const amtValue = getAmount(qtyNum);

          // Quantity column
          const qtyCell = ws.getCell(
            `${getExcelColumnName(currentCol)}${rowNum}`
          );
          setNum(qtyCell, qtyValue, QTY_FMT);
          applyCellStyle(qtyCell, { ...CELL_STYLES.dataRowNumeric, fill });

          // Amount column (next column)
          const amtCell = ws.getCell(
            `${getExcelColumnName(currentCol + 1)}${rowNum}`
          );
          setNum(amtCell, amtValue, AMT_FMT);
          applyCellStyle(amtCell, { ...CELL_STYLES.dataRowNumeric, fill });

          currentCol += 2;
        } else {
          // Without Details: Regular column
          const cell = ws.getCell(`${getExcelColumnName(currentCol)}${rowNum}`);
          const value = getValue(col.key);
          if (col.isNumeric || typeof value === 'number') {
            setNum(
              cell,
              value,
              col.key === 'sn'
                ? '0'
                : col.key === 'latestRate'
                  ? AMT_FMT
                  : QTY_FMT
            );
            applyCellStyle(cell, { ...CELL_STYLES.dataRowNumeric, fill });
          } else {
            setText(cell, value);
            applyCellStyle(cell, { ...CELL_STYLES.dataRowText, fill });
          }
          currentCol++;
        }
      });

      ws.getRow(rowNum).height = 16;
    });

    // ---- TOTALS ROW ----
    const totalRowNum = dataStartRow + (movementsData?.movements?.length || 0);
    const movements = movementsData?.movements || [];

    if (withDetails) {
      // With Details: Total row with merged cells
      let currentCol = 1;

      columnDefinitions.forEach((col) => {
        if (col.hasSub) {
          // Calculate totals for quantity and amount
          let totalQty = 0;
          movements.forEach((movement: any) => {
            const qty = parseFloat(movement[col.key] || 0);
            totalQty += qty;
          });

          // Quantity total
          const qtyCell = ws.getCell(
            `${getExcelColumnName(currentCol)}${totalRowNum}`
          );
          setNum(qtyCell, totalQty, QTY_FMT);
          applyCellStyle(qtyCell, CELL_STYLES.totalRowNumeric);

          // Amount total
          const totalAmt = movements.reduce((sum: number, movement: any) => {
            const qty = parseFloat(movement[col.key] || 0);
            return sum + (movement.latest_rate || 0) * qty;
          }, 0);

          const amtCell = ws.getCell(
            `${getExcelColumnName(currentCol + 1)}${totalRowNum}`
          );
          setNum(amtCell, totalAmt, AMT_FMT);
          applyCellStyle(amtCell, CELL_STYLES.totalRowNumeric);

          currentCol += 2;
        } else if (col.key === 'sn') {
          const cell = ws.getCell(
            `${getExcelColumnName(currentCol)}${totalRowNum}`
          );
          cell.value = '';
          applyCellStyle(cell, CELL_STYLES.totalRowText);
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          currentCol++;
        } else if (col.key === 'product' || col.key === 'unit') {
          const cell = ws.getCell(
            `${getExcelColumnName(currentCol)}${totalRowNum}`
          );
          if (col.key === 'product') {
            cell.value = 'TOTAL';
            applyCellStyle(cell, CELL_STYLES.totalRowText);
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
          } else {
            cell.value = '';
            applyCellStyle(cell, CELL_STYLES.totalRowText);
          }
          currentCol++;
        } else if (col.key === 'latestRate') {
          // Skip Latest Rate in totals
          const cell = ws.getCell(
            `${getExcelColumnName(currentCol)}${totalRowNum}`
          );
          cell.value = '';
          applyCellStyle(cell, CELL_STYLES.totalRowText);
          currentCol++;
        } else {
          // For regular columns, calculate total
          let total = 0;
          movements.forEach((movement: any) => {
            const val = parseFloat(movement[col.key] || 0);
            total += val;
          });
          const cell = ws.getCell(
            `${getExcelColumnName(currentCol)}${totalRowNum}`
          );
          setNum(cell, total, AMT_FMT);
          applyCellStyle(cell, CELL_STYLES.totalRowNumeric);
          currentCol++;
        }
      });
    } else {
      // Without Details: Original total row
      let currentCol = 1;

      // S/N (empty)
      let cell = ws.getCell(`${getExcelColumnName(currentCol)}${totalRowNum}`);
      cell.value = '';
      applyCellStyle(cell, CELL_STYLES.totalRowText);
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      currentCol++;

      // Product (TOTAL)
      cell = ws.getCell(`${getExcelColumnName(currentCol)}${totalRowNum}`);
      cell.value = 'TOTAL';
      applyCellStyle(cell, CELL_STYLES.totalRowText);
      cell.alignment = { horizontal: 'left', vertical: 'middle' };
      currentCol++;

      // Unit (empty)
      cell = ws.getCell(`${getExcelColumnName(currentCol)}${totalRowNum}`);
      cell.value = '';
      applyCellStyle(cell, CELL_STYLES.totalRowText);
      currentCol++;

      // Calculate totals for remaining columns
      columnDefinitions.forEach((col) => {
        if (col.key === 'sn' || col.key === 'product' || col.key === 'unit') {
          return; // Already handled
        }
        if (col.key === 'latestRate') {
          // Skip Latest Rate in totals (non-finance view)
          const cell = ws.getCell(
            `${getExcelColumnName(currentCol)}${totalRowNum}`
          );
          cell.value = '';
          applyCellStyle(cell, CELL_STYLES.totalRowText);
          currentCol++;
          return;
        }

        let total = 0;
        movements.forEach((movement: any) => {
          const val = parseFloat(movement[col.key] || 0);
          total += val;
        });
        const cell = ws.getCell(
          `${getExcelColumnName(currentCol)}${totalRowNum}`
        );
        setNum(cell, total, AMT_FMT);
        applyCellStyle(cell, CELL_STYLES.totalRowNumeric);
        currentCol++;
      });

      // Estimated Closing Value total (if permission)
      if (hasAccountsPermission) {
        const cell = ws.getCell(
          `${getExcelColumnName(currentCol)}${totalRowNum}`
        );
        setNum(cell, totalEstimatedValue, AMT_FMT);
        applyCellStyle(cell, CELL_STYLES.totalRowNumeric);
      }
    }

    ws.getRow(totalRowNum).height = 20;

    return await wb.xlsx.writeBuffer();
  } catch (error: any) {
    console.error('Error exporting stock movement Excel:', error);
    throw new Error(
      error?.message || 'Excel export failed during workbook generation'
    );
  }
}
