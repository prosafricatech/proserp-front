import { NextRequest } from 'next/server';
import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';

const API_BASE = process.env.API_BASE_URL!;

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; unitId: string }> }
) {
  const { id, unitId } = await params;

  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const res = await fetch(`${API_BASE}/products/${id}/secondary-units/${unitId}`, {
    method: 'DELETE',
    headers,
  });

  return handleJsonResponse(res);
}