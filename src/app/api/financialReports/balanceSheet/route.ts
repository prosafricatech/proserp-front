import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL

export async function GET(req: NextRequest) {
  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const url = new URL(`${API_BASE}/balance-sheet`);

  Array.from(searchParams.entries()).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const res = await fetch(url.toString(), {
    headers,
    credentials: 'include',
  });

  const contentType = res.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return handleJsonResponse(res);
  } else {
    // forward blob (Excel file)
    const buffer = await res.arrayBuffer();
    return new Response(buffer, {
      status: res.status,
      headers: {
        "Content-Type": contentType || "application/octet-stream",
        "Content-Disposition": res.headers.get("content-disposition") || "",
      },
    });
  }
}
