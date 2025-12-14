import { NextRequest } from 'next/server';
import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';

const API_BASE = process.env.API_BASE_URL!;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const searchParams = req.nextUrl.searchParams;
  const isDormant = searchParams.get('dormant') === 'true';
  const type = isDormant ? 'dormant_stock' : 'stock_movement';

  const url = new URL(`${API_BASE}/stores/${id}/${type}`);

  Object.entries(Object.fromEntries(searchParams)).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const res = await fetch(url.toString(), {
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}