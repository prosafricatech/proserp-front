import { NextRequest } from 'next/server';
import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';

const API_BASE = process.env.API_BASE_URL!;

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; type: string }> }
) {
  const { id, type } = await params;

  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const res = await fetch(`${API_BASE}/budget-items/${type}/${id}`, {
    method: 'DELETE',
    headers,
  });

  return handleJsonResponse(res);
}