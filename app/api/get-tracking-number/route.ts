import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // You can do validation here if needed
    if (!body.orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    // Forward the request to your Express backend
    const apiResp = await fetch('https://p2g-api.up.railway.app/get-tracking-number', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: body.orderId }),
    });

    const data = await apiResp.json();

    if (!apiResp.ok) {
      return NextResponse.json({ error: data.error || 'Failed to get tracking number' }, { status: apiResp.status });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
