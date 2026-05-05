import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = await context.params;
  const storeId = resolvedParams?.id;
  const { headers, response } = await getAuthHeaders(request);
  if (response) return response;

  if (!storeId) {
    return Response.json({ message: 'Store id is required' }, { status: 400 });
  }
  
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword') || '';
  const page = searchParams.get('page') || '1';
  const limit = searchParams.get('limit') || '10';

  const query = new URLSearchParams({
    page,
    limit,
    store_id: storeId,
    keyword,
  });
  const apiUrl = `${API_BASE}/low_stock_thresholds/${storeId}${query.toString() ? `?${query.toString()}` : ''}`;

  const res = await fetch(apiUrl, {
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}
