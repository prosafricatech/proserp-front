// app/api/auth/status/route.ts  (or app/api/me/route.ts)

import { NextRequest } from 'next/server';
import { getAuthHeaders } from '@/lib/utils/apiUtils';

const API_BASE = process.env.API_BASE_URL;

export async function GET(req: NextRequest) {
  const { headers, response: authResponse } = await getAuthHeaders(req);
  if (authResponse) return authResponse;

  try {
    const res = await fetch(`${API_BASE}/getuser`, {
      method: 'GET',
      headers,
      credentials: 'include',
      cache: 'no-store',
    });

    if (!res.ok) {
      return Response.json(
        { authenticated: false, verified: false },
        { status: 401 }
      );
    }

    const data = await res.json();

    const isVerified = !!data?.authUser?.user?.email_verified_at;

    return Response.json({
      authenticated: true,
      verified: isVerified,
      user: data?.authUser?.user || null,
    });
  } catch (error) {
    console.error('Auth status check failed:', error);
    return Response.json(
      { authenticated: false, verified: false },
      { status: 500 }
    );
  }
}