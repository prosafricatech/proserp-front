import { getSmsHeaders, handleSmsJsonResponse } from "@/lib/utils/smsUtils";

const API = `${process.env.SMS_BASE_URL}/balance`;

export async function GET() {
  const { headers } = await getSmsHeaders();
  const res = await fetch(API, { method: "GET", headers });
  return handleSmsJsonResponse(res);
}
