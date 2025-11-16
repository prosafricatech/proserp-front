import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;

export async function GET(request: NextRequest, context: any) {
  const { type } = await context.params; 

  const { headers, response } = await getAuthHeaders(request);
  if (response) return response;

  const url = new URL(request.url);
  const searchParams = url.searchParams;

  searchParams.delete('type');
  const query = searchParams.toString();

  let endpoint: string;
  if (type === 'debit' || type === 'credit') {
    endpoint = `${API_BASE}/accounts/adjustment-notes/${type}`;
  } else {
    endpoint = `${API_BASE}/accounts/${type}`;
  }

  const res = await fetch(`${endpoint}${query ? `?${query}` : ''}`, {
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}
