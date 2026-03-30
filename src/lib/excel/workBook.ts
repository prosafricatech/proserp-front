import Exceljs from 'exceljs';

export function createWorkbook() {
  const wb = new Exceljs.Workbook();
  wb.creator = 'ProsERP';
  wb.created = new Date();
  return wb;
}

export function addHeader(ws: Exceljs.Worksheet, headers: string[]) {
  const row = ws.addRow(headers);
  row.font = { bold: true, size: 14 };
  ws.columns = headers.map(() => ({ width: 20 }));
}
