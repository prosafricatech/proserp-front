import { NextRequest } from 'next/server';
import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';

const API_BASE = process.env.API_BASE_URL!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { headers, response } = await getAuthHeaders(request);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword') || '';

  const queryParams = new URLSearchParams();
  if (keyword) {
    queryParams.set('keyword', keyword);
  }

  const res = await fetch(`${API_BASE}/organizations/${id}/users`, {
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}