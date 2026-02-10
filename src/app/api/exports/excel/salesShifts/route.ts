import { exportSalesShiftsToExcel } from '@/lib/excel/exporters/salesShifts';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as any;

    const buffer = await exportSalesShiftsToExcel(body);

    return new Response(buffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="sales-shifts.xlsx"',
      },
    });
  } catch (error) {
    console.error('Error in API route:', error);
    return new Response('Failed to generate Excel', { status: 500 });
  }
}
