import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // 1. Parse the incoming payload from the frontend
    const { payWithPrePayUrl } = await req.json();

    // 2. Forward the URL to your backend integration API
    const apiResp = await fetch('https://p2g-api.up.railway.app/paywithprepay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payWithPrePayUrl }),
    });

    // 3. Get the response from backend and relay it back
    const data = await apiResp.json();

    // 4. Return success or error
    if (!apiResp.ok) {
      return NextResponse.json({ error: data.error || 'Parcel2Go API error' }, { status: apiResp.status });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
