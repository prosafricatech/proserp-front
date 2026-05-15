import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const res = await fetch(`${API_BASE}/products/${id}/photos`, {
    headers,
  });

  return handleJsonResponse(res);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { headers: authHeaders, response } = await getAuthHeaders(req);
  if (response) return response;

  const form = await req.formData();
  if (authHeaders['Content-Type']) {
    delete authHeaders['Content-Type'];
  }

  const res = await fetch(`${API_BASE}/products/${id}/photos`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...authHeaders,
    },
    body: form,
  });

  return handleJsonResponse(res);
}
