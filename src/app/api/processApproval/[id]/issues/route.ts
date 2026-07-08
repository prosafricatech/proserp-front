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

  const url = new URL(`${API_BASE}/approved-requisitions/${id}/issues`);
  req.nextUrl.searchParams.forEach((value, key) =>
    url.searchParams.set(key, value)
  );

  const res = await fetch(url.toString(), {
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { headers, response } = await getAuthHeaders(req);
    if (response) return response;

    const body = await req.json();
    const res = await fetch(`${API_BASE}/approved-requisitions/${id}/issues`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    return handleJsonResponse(res);
  } catch (error: any) {
    console.error('Error issuing materials:', error);
    return new Response(
      JSON.stringify({
        message: error.message ?? error,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
