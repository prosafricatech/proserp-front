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

  const queryString = new URL(request.url).searchParams.toString();
  const endpoint = queryString
    ? `${API_BASE}/audits/request/${request_id}?${queryString}`
    : `${API_BASE}/audits/request/${request_id}`;

  const res = await fetch(endpoint, {
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}
