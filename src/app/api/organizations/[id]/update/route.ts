import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const API_BASE = process.env.API_BASE_URL!;

const getTimezoneOffset = (): string => {
  const date = new Date();
  const timezoneOffsetMinutes = date.getTimezoneOffset();
  const sign = timezoneOffsetMinutes < 0 ? '+' : '-';
  const hours = Math.abs(Math.floor(timezoneOffsetMinutes / 60)).toString().padStart(2, '0');
  const minutes = Math.abs(timezoneOffsetMinutes % 60).toString().padStart(2, '0');
  return `${sign}${hours}:${minutes}`;
};

export async function POST(request: NextRequest, context: any) {
  const { params } = context;
  try {
    const token = await getToken({ req: request });

    if (!token?.accessToken) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const formData = await request.formData();

    const headers = new Headers();
    headers.append('Authorization', `Bearer ${token.accessToken}`);
    headers.append('X-Timezone', getTimezoneOffset());
    headers.append('X-OrganizationId', token.organizationId as string);

    const res = await fetch(`${API_BASE}/organizations/update/${params.id}`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      return new Response(JSON.stringify({ message: text }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Organization update failed:', error);
    return new Response(
      JSON.stringify({
        message: error instanceof Error ? error.message : 'Failed to update organization',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}