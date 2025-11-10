import { NextRequest, NextResponse } from 'next/server';
import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';

const API_BASE = process.env.API_BASE_URL;

export async function DELETE(
  req: NextRequest, context: any
) {
  const { params } = context as { params: { id: string } };
  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  // Corrected URL formatting
  const res = await fetch(`${API_BASE}/budgets/${params.id}`, {
    method: 'DELETE',
    headers,
  });

  return handleJsonResponse(res);
}

