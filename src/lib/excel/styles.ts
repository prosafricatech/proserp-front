import { Alignment, Border, Fill, Font } from 'exceljs';

// ============================================
// COLORS
// ============================================
export const COLORS = {
  BLACK: 'FF000000',
  GRAY: 'FF666666',
  LIGHT_GRAY: 'FFD9D9D9',
  WHITE: 'FFFFFFFF',
  ALTERNATE_ROW: 'FFF8F8F8',
} as const;

// ============================================
// FONTS
// ============================================
export const FONTS = {
  filterLabel: { bold: true, size: 11 } as Partial<Font>,
  filterValue: { size: 10 } as Partial<Font>,
  tableHeader: { bold: true, size: 11 } as Partial<Font>,
  dataRow: { size: 10 } as Partial<Font>,
  totalRow: { bold: true, size: 11 } as Partial<Font>,
} as const;

// ============================================
// ALIGNMENTS
// ============================================
export const ALIGNMENTS = {
  leftMiddle: { horizontal: 'left', vertical: 'middle' } as Partial<Alignment>,
  rightMiddle: {
    horizontal: 'right',
    vertical: 'middle',
  } as Partial<Alignment>,
  centerMiddle: {
    horizontal: 'center',
    vertical: 'middle',
  } as Partial<Alignment>,
  verticalMiddle: { vertical: 'middle' } as Partial<Alignment>,
} as const;

// ============================================
// BORDERS
// ============================================
const thinBlackBorder = {
  style: 'thin',
  color: { argb: COLORS.BLACK },
} as const;
const thinGrayBorder = { style: 'thin', color: { argb: COLORS.GRAY } } as const;

export const BORDERS = {
  allThinBlack: {
    top: thinBlackBorder,
    bottom: thinBlackBorder,
    left: thinBlackBorder,
    right: thinBlackBorder,
  } as Partial<Border>,
  totalRow: {
    top: thinBlackBorder,
    bottom: thinBlackBorder,
    left: thinGrayBorder,
    right: thinGrayBorder,
  } as Partial<Border>,
} as const;

// ============================================
// FILLS
// ============================================
export const FILLS = {
  headerGray: {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.LIGHT_GRAY },
  } as Fill,
  white: {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.WHITE },
  } as Fill,
  alternateRow: {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.ALTERNATE_ROW },
  } as Fill,
} as const;

// ============================================
// ROW HEIGHTS
// ============================================
export const ROW_HEIGHTS = {
  header: 20,
  total: 22,
} as const;

// ============================================
// COMPOSITE STYLES
// ============================================
export const CELL_STYLES = {
  filterLabel: {
    font: FONTS.filterLabel,
    alignment: ALIGNMENTS.leftMiddle,
  },
  filterValue: {
    font: FONTS.filterValue,
    alignment: ALIGNMENTS.leftMiddle,
  },
  tableHeader: {
    font: FONTS.tableHeader,
    alignment: ALIGNMENTS.leftMiddle,
    border: BORDERS.allThinBlack,
    fill: FILLS.headerGray,
  },
  dataRowText: {
    font: FONTS.dataRow,
    alignment: ALIGNMENTS.leftMiddle,
    border: BORDERS.allThinBlack,
  },
  dataRowNumeric: {
    font: FONTS.dataRow,
    alignment: ALIGNMENTS.rightMiddle,
    border: BORDERS.allThinBlack,
  },
  totalRowText: {
    font: FONTS.totalRow,
    alignment: ALIGNMENTS.leftMiddle,
    border: BORDERS.totalRow,
    fill: FILLS.headerGray,
  },
  totalRowNumeric: {
    font: FONTS.totalRow,
    alignment: ALIGNMENTS.rightMiddle,
    border: BORDERS.totalRow,
    fill: FILLS.headerGray,
  },
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Apply a composite style to a cell
 */
export function applyCellStyle(
  cell: any,
  style: {
    font?: Partial<Font>;
    alignment?: Partial<Alignment>;
    border?: Partial<Border>;
    fill?: Fill;
  }
) {
  if (style.font) cell.font = style.font;
  if (style.alignment) cell.alignment = style.alignment;
  if (style.border) cell.border = style.border;
  if (style.fill) cell.fill = style.fill;
}

/**
 * Get alternating row fill based on index
 */
export function getAlternatingRowFill(index: number): Fill {
  return index % 2 === 0 ? FILLS.white : FILLS.alternateRow;
}
