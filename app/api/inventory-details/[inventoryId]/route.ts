import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const segments = url.pathname.split('/');
  const inventoryId = segments[segments.length - 1];

  const resp = await fetch(`https://goodlife.myhelm.app/public-api/inventory/${inventoryId}`);
  const data = await resp.json();

  // TEMP: Return the entire object for debugging
  return NextResponse.json(data);
}
