import { NextRequest, NextResponse } from "next/server";

export async function getSmsHeaders(req?: NextRequest) {
  // Base64 encode username:password
  const credentials = Buffer.from(
    `${process.env.SMS_USERNAME}:${process.env.SMS_PASSWORD}`
  ).toString("base64");

  const headers: Record<string, string> = {
    Authorization: `Basic ${credentials}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  return { headers, response: null };
}

export async function handleSmsJsonResponse(res: Response) {
  const contentType = res.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    const text = await res.text();
    return NextResponse.json({ message: text }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
