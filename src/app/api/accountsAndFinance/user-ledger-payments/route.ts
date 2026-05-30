import { NextRequest } from 'next/server';
import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';

const API_BASE = process.env.API_BASE_URL!;

export async function GET(req: NextRequest) {
  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const queryString = req.nextUrl.searchParams.toString();
  const res = await fetch(`${API_BASE}/user-ledger-payments?${queryString}`, {
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}
