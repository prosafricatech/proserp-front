import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const lang = req.nextUrl.searchParams.get('lang') || 'en-US';
  return NextResponse.json({
    name: "ProsERP Beta",
    short_name: "ProsERP Beta",
    theme_color: "#2196f3",
    background_color: "#ffffff",
    description: "Robust ERP for accounting, project management, payroll, inventory, and requisitions.",
    display: "standalone",
    orientation: "portrait",
    scope: "/",
    start_url: `/${lang}/dashboard`,
    icons: [
      { src: "/assets/images/icons/logo192N-nw.png", type: "image/png", sizes: "192x192" },
      { src: "/assets/images/icons/logo256n-nw.png", type: "image/png", sizes: "256x256" },
      { src: "/assets/images/icons/logo512n-nw.png", type: "image/png", sizes: "512x512" },
    ],
  });
}