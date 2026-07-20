import { NextRequest } from 'next/server';
import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';

const API_BASE = process.env.API_BASE_URL!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { headers, response } = await getAuthHeaders(request);
  if (response) return response;

  const res = await fetch(`${API_BASE}/rfq-responses/${id}`, {
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { headers, response } = await getAuthHeaders(request);
  if (response) return response;

  const body = await request.json();
  const res = await fetch(`${API_BASE}/rfqs/${id}/responses`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
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
  const res = await fetch(`${API_BASE}/rfq-responses/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });

  return handleJsonResponse(res);
}