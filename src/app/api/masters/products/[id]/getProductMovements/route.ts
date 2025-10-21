import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL;

export async function GET(req: NextRequest, context: any) {
  const { params } = context as { params: { id: string } };
  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const incomingUrl = new URL(req.url);
  const apiUrl = new URL(`${API_BASE}/products/${params.id}/movements`);

  incomingUrl.searchParams.forEach((value, key) => {
    apiUrl.searchParams.append(key, value);
  });

  const res = await fetch(apiUrl.toString(), {
    method: 'GET',
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}
