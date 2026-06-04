import { NextRequest } from 'next/server';
import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';

const API_BASE = process.env.API_BASE_URL!;

export async function GET(req: NextRequest) {
  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const queryString = req.nextUrl.searchParams.toString();
  const res = await fetch(`${API_BASE}/imprest-retirements?${queryString}`, {
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}

export async function POST(req: NextRequest) {
  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const contentType = req.headers.get('content-type') || '';
  const isMultipart = contentType.toLowerCase().includes('multipart/form-data');

  const proxyHeaders = { ...headers } as Record<string, string>;
  let body: BodyInit;

  if (isMultipart) {
    delete proxyHeaders['Content-Type'];
    body = await req.formData();
  } else {
    const jsonBody = await req.json();
    body = JSON.stringify(jsonBody);
  }

  const res = await fetch(`${API_BASE}/imprest-retirements`, {
    method: 'POST',
    headers: proxyHeaders,
    body,
  });

  return handleJsonResponse(res);
}
