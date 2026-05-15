import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const { id, photoId } = await params;

  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const res = await fetch(`${API_BASE}/products/${id}/photos/${photoId}/set-main`, {
    method: 'PATCH',
    headers,
  });

  return handleJsonResponse(res);
}
