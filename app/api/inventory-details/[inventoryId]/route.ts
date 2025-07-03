// app/api/inventory-details/[inventoryId]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Extract inventoryId from the URL pathname
  const url = new URL(req.url);
  // Example: /api/inventory-details/2297
  const segments = url.pathname.split('/');
  const inventoryId = segments[segments.length - 1];

  const resp = await fetch(`https://goodlife.myhelm.app/public-api/inventory/${inventoryId}`);
  const data = await resp.json();

  return NextResponse.json({
    hs_code: data.hs_code ?? "",
    customs_description: data.customs_description ?? "",
  });
}
