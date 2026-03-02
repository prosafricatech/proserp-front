// import dayjs from 'dayjs';
// import { applyCellStyle, CELL_STYLES, ROW_HEIGHTS } from '../styles';
// import { createWorkbook } from '../workBook';

export async function exportDippingReportToExcel(exportedData: any) {
  try {
    return {
      messaage: exportedData,
    };
  } catch (error: any) {
    console.error('Error exporting sample Excel:', error);
    throw new Error(
      error?.message || 'Excel export failed during workbook generation'
    );
  }
}
