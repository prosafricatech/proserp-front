import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';
import axios from '@/lib/services/config';

type GeoData = {
  country?: string;
  region?: string;
  city?: string;
  latitude?: string;
  longitude?: string;
};

export async function getAuthHeaders(
  req: NextRequest,
  requireAuth = true
) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (requireAuth && !token?.accessToken) {
    return {
      headers: null,
      response: NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      ),
    };
  }
  
  /** -------------------------------
   * IP Address (proxy aware)
   * ------------------------------- */
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');

  const ipAddress =
    forwardedFor?.split(',')[0]?.trim() ||
    realIp ||
    'unknown';

  /** -------------------------------
   * Device & Location (type-safe)
   * ------------------------------- */
  const userAgent = req.headers.get('user-agent') || 'unknown';

  // 👇 Type-safe access
  const geo: GeoData =
    'geo' in req && typeof (req as any).geo === 'object'
      ? (req as any).geo
      : {};

  /** -------------------------------
   * Headers
   * ------------------------------- */
  
  const reqTimezone = req.headers.get('x-timezone') || '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Timezone': reqTimezone,
    'X-User-Agent': userAgent,
    'X-Device-IP': ipAddress,
    'X-Country': geo.country ?? '',
    'X-Region': geo.region ?? '',
    'X-City': geo.city ?? '',
    'X-Latitude': geo.latitude ?? '',
    'X-Longitude': geo.longitude ?? '',
  };

  if (token?.accessToken) {
    headers.Authorization = `Bearer ${token.accessToken}`;

    if (token.organization_id) {
      headers['X-OrganizationId'] = String(token.organization_id);
    }

    if (token.user_id) {
      headers['X-UserId'] = String(token.user_id);
    }
  }

  return { headers, response: null };
}

/** -----------------------------------
 * JSON response normalizer
 * ----------------------------------- */
export async function handleJsonResponse(res: Response) {
  const contentType = res.headers.get('content-type');

  if (!contentType?.includes('application/json')) {
    const text = await res.text();
    return NextResponse.json(
      { message: text },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
