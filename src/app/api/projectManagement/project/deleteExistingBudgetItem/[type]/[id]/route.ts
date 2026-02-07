import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';

const API_BASE = process.env.API_BASE_URL!;

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { type, id } = await params;

  const { headers, response } = await getAuthHeaders(req, true);

  if (response) return response;

  try {
    const res = await fetch(
      `${API_BASE}/budget-items/${type}/${id}`,
      {
        method: 'DELETE',
        headers: headers!,
      }
    );

    return handleJsonResponse(res);
  } catch (error) {
    console.error('Delete budget item failed:', error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : 'Failed to delete budget item',
      },
      { status: 500 }
    );
  }
}
