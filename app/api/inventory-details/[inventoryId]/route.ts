import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Get the inventoryId from the URL path
  const url = new URL(req.url);
  const segments = url.pathname.split('/');
  const inventoryId = segments[segments.length - 1];

  // Read token from the Authorization header
  const token = req.headers.get('authorization');
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 401 });
  }

  // Fetch the inventory details with the token
  const resp = await fetch(`https://goodlife.myhelm.app/public-api/inventory/${inventoryId}`, {
    headers: {
      Authorization: token
    }
  });

  // Handle permission error from the upstream API
  if (!resp.ok) {
    const err = await resp.json();
    return NextResponse.json({ error: err.error || 'Failed to fetch inventory details' }, { status: resp.status });
  }

  const data = await resp.json();

  return NextResponse.json({
    hs_code: data.hs_code ?? "",
    customs_description: data.customs_description ?? "",
  });
}
