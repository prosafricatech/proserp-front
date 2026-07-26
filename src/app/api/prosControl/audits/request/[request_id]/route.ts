import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ request_id: string }> }
) {
  const { request_id } = await params;
  const { headers, response } = await getAuthHeaders(request);
  if (response) return response;

  const res = await fetch(`${API_BASE}/pros-audits/request/${request_id}`, {
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}
