import { getMenus } from '@/utilities/constants/menu-items';
import { NextResponse } from 'next/server';

// To handle a GET request to /api/menus
export async function GET(req: Request, props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const menus = await getMenus(params?.locale ?? "en-US");
  // Here you can place logic to deliver user's role specific menus
  return NextResponse.json(menus, { status: 200 });
}
