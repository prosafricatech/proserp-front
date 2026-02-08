import { getSmsHeaders, handleSmsJsonResponse } from '@/lib/utils/smsUtils';
import { NextRequest } from 'next/server';

const API = `${process.env.SMS_BASE_URL}/logs`;

export async function GET(req: NextRequest) {
  const { headers } = await getSmsHeaders();
  const { searchParams } = new URL(req.url);
  const query = searchParams.toString();

  const res = await fetch(`${API}?${query}`, { method: "GET", headers });
  return handleSmsJsonResponse(res);
}
