import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { encode, getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;

export async function GET(request: NextRequest) {
  const { headers, response } = await getAuthHeaders(request);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword') || '';
  const page = searchParams.get('page') || '1';
  const limit = searchParams.get('limit') || '10';
  const query = new URLSearchParams({ keyword, page, limit }).toString();

  const res = await fetch(`${API_BASE}/organizations?${query}`, {
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}

export async function POST(req: NextRequest) {
  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const body = await req.formData();

  const { 'Content-Type': _ct, ...forwardHeaders } = headers as Record<string, string>;

  const res = await fetch(`${API_BASE}/organizations`, {
    method: 'POST',
    headers: { ...forwardHeaders, Accept: 'application/json' },
    body,
  });

  if (!res.ok) {
    return handleJsonResponse(res);
  }

  const contentType = res.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return handleJsonResponse(res);
  }

  const data = await res.json();
  const apiAccessToken = data?.token;
  const { token: _hiddenToken, ...safeData } = data ?? {};

  // Re-encode the NextAuth cookie with the new token so the middleware's
  // auth-status check uses the fresh credentials immediately after navigation.
  if (apiAccessToken) {
    try {
      const currentToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! });
      const updatedJwt = await encode({
        token: {
          ...currentToken,
          accessToken: apiAccessToken,
          organization_id: data.newOrganization?.organization?.id ?? currentToken?.organization_id,
          organization_name: data.newOrganization?.organization?.name ?? currentToken?.organization_name,
        },
        secret: process.env.NEXTAUTH_SECRET!,
        maxAge: 24 * 60 * 60,
      });

      const cookieName =
        process.env.NODE_ENV === 'production'
          ? '__Secure-next-auth.session-token'
          : 'next-auth.session-token';

      const jsonResponse = NextResponse.json(safeData, { status: res.status });
      jsonResponse.cookies.set(cookieName, updatedJwt, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60,
      });
      return jsonResponse;
    } catch {
      // fall through to normal response if re-encoding fails
    }
  }

  return NextResponse.json(safeData, { status: res.status });
}
