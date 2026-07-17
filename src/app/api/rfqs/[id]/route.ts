import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { headers, response } = await getAuthHeaders(request);
  if (response) return response;

  const res = await fetch(`${API_BASE}/rfqs/${id}`, {
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { headers, response } = await getAuthHeaders(request);
  if (response) return response;

  const body = await request.json();
  const res = await fetch(`${API_BASE}/rfqs/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });

  return handleJsonResponse(res);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { headers, response } = await getAuthHeaders(request);
  if (response) return response;

  const res = await fetch(`${API_BASE}/rfqs/${id}`, {
    method: 'DELETE',
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}
