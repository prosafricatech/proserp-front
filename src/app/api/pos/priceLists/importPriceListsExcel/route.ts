import { getAuthHeaders, handleJsonResponse } from "@/lib/utils/apiUtils";
import { NextRequest } from "next/server";

const API_BASE = process.env.API_BASE_URL!;

export async function POST(req: NextRequest) {
  const { headers: authHeaders, response } = await getAuthHeaders(req);
  if (response) return response;

  const form = await req.formData();
  if (authHeaders["Content-Type"]) {
    delete authHeaders["Content-Type"];
  }

  const res = await fetch(`${API_BASE}/pricelist-excel-upload`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...authHeaders,
    },
    body: form,
  });

  return handleJsonResponse(res);
}
