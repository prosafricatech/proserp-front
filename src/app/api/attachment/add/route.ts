import { handleJsonResponse } from '@/lib/utils/apiUtils';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL;

const getTimezoneOffset = (): string => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  const sign = offset < 0 ? '+' : '-';
  const hours = Math.abs(Math.floor(offset / 60)).toString().padStart(2, '0');
  const minutes = Math.abs(offset % 60).toString().padStart(2, '0');
  return `${sign}${hours}:${minutes}`;
};

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token?.accessToken}`,
    Accept: 'application/json',
    'X-Timezone': getTimezoneOffset(),
    'X-OrganizationId': String(token?.organization_id),
  };

  const formData = await req.formData();

  const res = await fetch(`${API_BASE}/attachments`, {
    method: 'POST',
    headers,
    body: formData,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}
