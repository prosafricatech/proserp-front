import { NextRequest } from 'next/server';
import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';

const API_BASE = process.env.API_BASE_URL!;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { headers, response } = await getAuthHeaders(req);

    if (response) return response;

    if (headers) {
      delete headers['Content-Type'];
    }

    const formData = await req.formData();

    const res = await fetch(`${API_BASE}/organizations/update/${id}`, {
      method: 'POST',
      headers: headers!,
      body: formData,
    });

    return handleJsonResponse(res);
  } catch (error) {
    console.error('Organization update failed:', error);

    return new Response(
      JSON.stringify({
        message:
          error instanceof Error
            ? error.message
            : 'Failed to update organization',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
