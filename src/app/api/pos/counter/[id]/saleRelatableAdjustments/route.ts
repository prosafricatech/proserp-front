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

  const res = await fetch(`${API_BASE}/accounts/relatable-adjustment-notes/sale/${id}`, {
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}