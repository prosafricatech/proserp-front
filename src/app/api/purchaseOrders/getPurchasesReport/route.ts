import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL;

export async function GET(req: NextRequest) {
  try {
    const { headers, response } = await getAuthHeaders(req);
    if (response) return response;

    const searchParams = req.nextUrl.searchParams;
    const url = new URL(`${API_BASE}/purchase-orders-report`);

    searchParams.forEach((value, key) => {
        if (key.endsWith('[]')) {
            url.searchParams.append(key, value);
        } else {
            url.searchParams.set(key, value);
        }
    });

    const res = await fetch(url.toString(), {
      headers,
      credentials: 'include',
    });

    return handleJsonResponse(res);
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}