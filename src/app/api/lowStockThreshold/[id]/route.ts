import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;

export async function GET(request: NextRequest, context: any) {
const { params } = context as { params: { id: string } };
  const { headers, response } = await getAuthHeaders(request);
  if (response) return response;
  
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword') || '';
  const page = searchParams.get('page') || '1';
  const limit = searchParams.get('limit') || '10';

  const apiUrl = `${API_BASE}/low_stock_thresholds/${params.id}?` + 
                 new URLSearchParams({
                   page,
                   limit,
                   store_id: params.id, // optional but matches your original structure
                   keyword,
                 });

  const res = await fetch(apiUrl, {
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}
