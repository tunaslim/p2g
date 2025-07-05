import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { url, token } = await req.json();

  if (!url || !token) {
    return NextResponse.json({ error: "Missing url or token" }, { status: 400 });
  }

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  const data = await resp.json();

  // You can pass through whatever Parcel2Go sends, or just the success
  return NextResponse.json(data);
}
