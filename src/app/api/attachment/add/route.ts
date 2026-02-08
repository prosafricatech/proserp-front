import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;

export async function POST(req: NextRequest) {
  const { headers, response } = await getAuthHeaders(req);

  if (response) return response;

  // ❗ Remove Content-Type for FormData
  if (headers) {
    delete headers['Content-Type'];
  }

  const formData = await req.formData();

  const res = await fetch(`${API_BASE}/attachments`, {
    method: 'POST',
    headers: headers!,
    body: formData,
  });

  return handleJsonResponse(res);
}
