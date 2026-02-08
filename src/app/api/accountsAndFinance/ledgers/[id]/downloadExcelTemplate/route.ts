import { NextRequest } from 'next/server';
import { getAuthHeaders } from '@/lib/utils/apiUtils';

const API_BASE = process.env.API_BASE_URL!;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const body = await req.json();
  const res = await fetch(`${API_BASE}/accounts/ledger/${id}/statement`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const arrayBuffer = await res.arrayBuffer();

  return new Response(arrayBuffer, {
    status: res.status,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="ledger_statement.xlsx"',
    },
  });
}