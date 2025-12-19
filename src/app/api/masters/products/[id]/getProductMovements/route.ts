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

  const incomingUrl = new URL(req.url);
  const apiUrl = new URL(`${API_BASE}/products/${id}/movements`);

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