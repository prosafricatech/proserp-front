import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const body = await req.text();

  const res = await fetch(`${API_BASE}/payroll-periods/${id}/process-employee`, {
    method: 'POST',
    headers,
    body,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}
