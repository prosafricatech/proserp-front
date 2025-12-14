import { NextRequest, NextResponse } from 'next/server';
import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';

const API_BASE = process.env.API_BASE_URL!;

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const body = await req.json();
  const { autoload } = body;

  if (typeof autoload !== 'boolean') {
    return NextResponse.json({ message: 'Invalid autoload value' }, { status: 400 });
  }

  const res = await fetch(`${API_BASE}/organizations/${id}/toggle_autoload`, {
    method: 'PUT',
    headers,
    credentials: 'include',
    body: JSON.stringify({ autoload }),
  });

  return handleJsonResponse(res);
}