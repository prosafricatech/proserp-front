<<<<<<< HEAD
=======
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
>>>>>>> origin/junior-development
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
<<<<<<< HEAD
      'Fuel Station Shift',
=======
      'Fuel Sales Shift',
>>>>>>> origin/junior-development
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

<<<<<<< HEAD
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

=======
    // fuel prices
    const fuelPrices: any[] = [];

    if (exportedData.shiftData.fuel_prices.length) {
      for (const fp of exportedData.shiftData.fuel_prices) {
        const product = exportedData.productOptions?.find(
          (p: any) => p.id === fp.product_id
        );
        const name = product?.name || `Product ${fp.product_id}`;
        const price = fp.price;
        fuelPrices.push({ name, price });
      }
    }

    // Add rows
    ws.addRow([
      'Sales Outlet Shift',
      'Shift Start',
      'Shift End',
      'Recorded By',
      ...fuelPrices.map((p) => p.name),
    ]);

    ws.addRow([
      exportedData.shiftData.shift?.name,
      readableDate(exportedData.shiftData.shift_start, true),
      readableDate(exportedData.shiftData.shift_end, true),
      exportedData.shiftData.creator?.name,
      ...fuelPrices.map((p) => p.price),
    ]);

    // CASHIERS SUMMARY
    ws.mergeCells('A7:D7');
    ws.getCell('A7').value = 'Cashiers Summary';
    ws.getCell('A7').alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getCell('A7').font = { bold: true };

>>>>>>> origin/junior-development
    // Return Excel buffer
    return await wb.xlsx.writeBuffer();
  } catch (error) {
    console.error('Error exporting sample Excel:', error);
    throw error;
  }
}
