import { NextRequest } from 'next/server';
import { getAuthHeaders } from '@/lib/utils/apiUtils';

const API_BASE = process.env.API_BASE_URL!;

export async function POST(req: NextRequest) {
  try {
    const { headers, response } = await getAuthHeaders(req);
    if (response) return response;

    let body: any = {};

    // Determine how body should be read
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      body = await req.json();
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      formData.forEach((val, key) => (body[key] = val));
    } else {
      // fallback to text for safety
      const text = await req.text();
      body = text ? JSON.parse(text) : {};
    }

    // Forward to backend
    const backendRes = await fetch(`${API_BASE}/pos/sales-manifest-excel`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!backendRes.ok) {
      return new Response(JSON.stringify({ error: true }), { status: backendRes.status });
    }

    const arrayBuffer = await backendRes.arrayBuffer();

    return new Response(arrayBuffer, {
      status: backendRes.status,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="PriceListTemplate.xlsx"',
      },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ message: "Failed to generate Excel template." }),
      { status: 500 }
    );
  }
}
