import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;

export async function GET(request: NextRequest) {
  try {
    const { headers, response } = await getAuthHeaders(request);
    if (response) return response;

    // Get userId from query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get other query parameters
    const keyword = searchParams.get('keyword') || '';
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const query = new URLSearchParams({ keyword, page, limit }).toString();


    const res = await fetch(`${API_BASE}/fuel-stations/user-stations/${userId}?${query}`, {
      headers,
      credentials: 'include',
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Backend responded with ${res.status}: ${errorText}`);
    }

    return handleJsonResponse(res);
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch user stations',
        details: typeof error === 'object' && error !== null && 'message' in error ? (error as { message: string }).message : String(error)
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}