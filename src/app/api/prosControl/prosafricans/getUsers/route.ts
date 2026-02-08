import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;

export async function GET(request: NextRequest) {
  const { headers, response } = await getAuthHeaders(request);
  if (response) return response;

  const { searchParams } = new URL(request.url);

  // Just forward all incoming query parameters exactly as they are
  const queryString = searchParams.toString();

  const res = await fetch(`${API_BASE}/prosafricans?${queryString}`, {
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}
