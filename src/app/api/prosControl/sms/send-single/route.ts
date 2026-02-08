import { getSmsHeaders, handleSmsJsonResponse } from '@/lib/utils/smsUtils';
import { NextRequest } from 'next/server';

const API = `${process.env.SMS_BASE_URL}/text/single`;

export async function POST(req: NextRequest) {
  const { headers, response } = await getSmsHeaders();
  if (response) return response;

  const body = await req.json();
  const payload = {
    from: process.env.NEXTSMS_SENDER_ID,
    to: body.to,
    text: body.text,
    reference: `ref-${Date.now()}`
  };

  const res = await fetch(API, { method: "POST", headers, body: JSON.stringify(payload) });
  return handleSmsJsonResponse(res);
}
