import { getSmsHeaders, handleSmsJsonResponse } from '@/lib/utils/smsUtils';
import { NextRequest } from 'next/server';

const API = `${process.env.SMS_BASE_URL}/text/multi`;

export async function POST(req: NextRequest) {
  const { headers, response } = await getSmsHeaders(req);
  if (response) return response;

  const body = await req.json();
  const payload = { messages: body.messages };

  const res = await fetch(API, { method: "POST", headers, body: JSON.stringify(payload) });
  return handleSmsJsonResponse(res);
}
