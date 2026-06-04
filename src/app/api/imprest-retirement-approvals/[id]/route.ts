import { NextRequest } from 'next/server';
import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';

const API_BASE = process.env.API_BASE_URL!;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const res = await fetch(`${API_BASE}/imprest-retirement-approvals/${id}`, {
    method: 'GET',
    headers,
  });

  return handleJsonResponse(res);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const res = await fetch(`${API_BASE}/imprest-retirement-approvals/${id}`, {
    method: 'DELETE',
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  return handleJsonResponse(res);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const body = await req.json();

  const res = await fetch(`${API_BASE}/imprest-retirement-approvals/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });

  return handleJsonResponse(res);
}
