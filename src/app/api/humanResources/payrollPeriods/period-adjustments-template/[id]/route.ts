import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const query = searchParams.toString();

  const res = await fetch(
    `${API_BASE}/payroll-periods/${id}/adjustments?${query}`,
    {
      headers,
      credentials: 'include',
    }
  );

  return handleJsonResponse(res);
}
