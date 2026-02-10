import { addHeader, createWorkbook } from '../workBook';

export async function exportSalesShiftsToExcel(exportedData: any) {
  try {
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
      'Fuel Station Shift',
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

    // Return Excel buffer
    return await wb.xlsx.writeBuffer();
  } catch (error) {
    console.error('Error exporting sample Excel:', error);
    throw error;
  }
}
