import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;

export async function GET(request: NextRequest) {
  const { headers, response } = await getAuthHeaders(request);
  if (response) return response;

  const { searchParams } = new URL(request.url);

  // Just forward all incoming query parameters exactly as they are
  const queryString = searchParams.toString();

  // If storeId is present, use /stores/{id}/inventory-consumptions
  const storeId = searchParams.get('storeId');
  let url;
  if (storeId) {
    url = `${API_BASE}/stores/${storeId}/inventory-consumptions?${queryString}`;
    console.log('Constructed URL for store-specific inventory consumptions:', url);
  } else {
    url = `${API_BASE}/inventory-consumptions?${queryString}`;
  }

  const res = await fetch(url, {
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}
