import { NextRequest, NextResponse } from 'next/server';
import { encode, JWT } from 'next-auth/jwt';
import { handleJsonResponse } from '@/lib/utils/apiUtils';

const API_BASE = process.env.API_BASE_URL;

export async function POST(req: NextRequest) {
  if (!process.env.NEXTAUTH_SECRET) {
    return NextResponse.json(
      { error: 'Server configuration error (missing NEXTAUTH_SECRET)' },
      { status: 500 },
    );
  }

  if (!API_BASE) {
    return NextResponse.json(
      { error: 'Server configuration error (missing API_BASE_URL)' },
      { status: 500 },
    );
  }

  const body = await req.json();

  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { error: data?.message || 'Failed to register user' },
      { status: res.status },
    );
  }

  // ✅ create session if backend returns auth data
  if (data?.token && data?.authUser?.user) {
    const jwtPayload: JWT = {
      user: {
        id: data.authUser.user.id,
        name: data.authUser.user.name,
        email: data.authUser.user.email,
      },
      accessToken: data.token,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24h
    };

    const sessionToken = await encode({
      token: jwtPayload,
      secret: process.env.NEXTAUTH_SECRET,
    });

    const response = NextResponse.json({
      message: 'User registered successfully',
      data: {
        authUser: data.authUser,
      },
    });

    // Clear existing session cookies
    const cookieName =
      process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token';

    response.cookies.delete(cookieName);
    for (let i = 0; i < 10; i++) {
      response.cookies.delete(`${cookieName}.${i}`);
    }

    // Set new session cookie
    response.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict',
      domain:
        process.env.NODE_ENV === 'production'
          ? '.proserp.co.tz'
          : undefined,
      maxAge: 60 * 60 * 24, // 24h
    });

    return response;
  }

  return handleJsonResponse(res);
}
