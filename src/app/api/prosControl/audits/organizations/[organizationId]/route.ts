import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  const { organizationId } = await params;
  const { headers, response } = await getAuthHeaders(request);
  if (response) return response;

  const queryString = new URL(request.url).searchParams.toString();
  const endpoint = queryString
    ? `${API_BASE}/pros-audits/organizations/${organizationId}?${queryString}`
    : `${API_BASE}/pros-audits/organizations/${organizationId}`;

  const res = await fetch(endpoint, {
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}
