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

type HeaderCarrier = {
  headers: Headers;
  geo?: GeoData;
};

export function getForwardedRequestHeaders(req: HeaderCarrier) {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const reqTimezone = req.headers.get('x-timezone') || '';

  const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';

  const geo: GeoData =
    req.geo && typeof req.geo === 'object'
      ? req.geo
      : {};

  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Timezone': reqTimezone,
    'User-Agent': userAgent,
    'X-User-Agent': userAgent,
    'X-Forwarded-For': forwardedFor || ipAddress,
    'X-Real-IP': realIp || ipAddress,
    'X-Device-IP': ipAddress,
    'X-Country': geo.country ?? '',
    'X-Region': geo.region ?? '',
    'X-City': geo.city ?? '',
    'X-Latitude': geo.latitude ?? '',
    'X-Longitude': geo.longitude ?? '',
  };
}

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
  
  const headers: Record<string, string> = getForwardedRequestHeaders({
    headers: req.headers,
    geo: 'geo' in req && typeof (req as any).geo === 'object' ? (req as any).geo : undefined,
  });

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
