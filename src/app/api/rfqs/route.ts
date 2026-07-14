import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;

export async function GET(request: NextRequest) {
  const { headers, response } = await getAuthHeaders(request);
  if (response) return response;

  const queryString = new URL(request.url).searchParams.toString();
  const res = await fetch(`${API_BASE}/rfqs?${queryString}`, {
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}

export async function POST(request: NextRequest) {
  const { headers, response } = await getAuthHeaders(request);
  if (response) return response;

  const body = await request.json();
  const res = await fetch(`${API_BASE}/rfqs`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  return handleJsonResponse(res);
}
