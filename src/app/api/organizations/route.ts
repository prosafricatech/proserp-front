import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;

export async function GET(request: NextRequest) {
  const { headers, response } = await getAuthHeaders(request);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword') || '';
  const page = searchParams.get('page') || '1';
  const limit = searchParams.get('limit') || '10';
  const query = new URLSearchParams({ keyword, page, limit }).toString();

  const res = await fetch(`${API_BASE}/organizations?${query}`, {
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}

export async function POST(req: NextRequest) {
  const body = await req.formData();

  const res = await fetch(`${API_BASE}/organizations`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body,
  });

  return handleJsonResponse(res);
}
