import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { headers, response } = await getAuthHeaders(req);
    if (response) return response;

    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();

    const url = `${API_BASE}/purchase-manifest-report?${queryString}`;

    const res = await fetch(url, {
      headers,
      credentials: 'include',
    });

    return handleJsonResponse(res);
  } catch (error: any) {
    console.log('error: ', error);
    return handleJsonResponse(error);
  }
}
