import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { headers, response } = await getAuthHeaders(req);
    if (response) return response;

    const searchParams = req.nextUrl.searchParams;

    const newSearchParams = new URLSearchParams();

    const groupedParams: Record<string, string[]> = {};

    searchParams.forEach((value, key) => {
      if (!groupedParams[key]) {
        groupedParams[key] = [];
      }
      groupedParams[key].push(value);
    });

    Object.keys(groupedParams).forEach((key) => {
      if (groupedParams[key].length > 1) {
        groupedParams[key].forEach((value) => {
          newSearchParams.append(`${key}[]`, value);
        });
      } else {
        newSearchParams.append(key, groupedParams[key][0]);
      }
    });

    const url = `${API_BASE}/purchase-manifest-report?${newSearchParams.toString()}`;

    const res = await fetch(url, {
      headers,
      credentials: 'include',
    });

    return handleJsonResponse(res);
  } catch (error: any) {
    return handleJsonResponse(error);
  }
}
