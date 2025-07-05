import { NextRequest, NextResponse } from 'next/server';

async function getParcel2GoToken() {
  const tokenUrl = 'https://www.parcel2go.com/auth/connect/token';
  const payload = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: 'public-api',
    client_id: process.env.PARCEL2GO_CLIENT_ID!,
    client_secret: process.env.PARCEL2GO_CLIENT_SECRET!,
  });
  const resp = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': '*/*',
    },
    body: payload.toString(),
  });
  if (!resp.ok) throw new Error('Failed to get Parcel2Go token');
  const data = await resp.json();
  return data.access_token;
}

export async function POST(req: NextRequest) {
  try {
    const { orderId, hash } = await req.json();

    if (!orderId || !hash) {
      return NextResponse.json({ error: 'Missing orderId or hash' }, { status: 400 });
    }

    const token = await getParcel2GoToken();

    const payUrl = `https://www.parcel2go.com/api/orders/${orderId}/paywithprepay?hash=${encodeURIComponent(hash)}`;

    const resp = await fetch(payUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    const data = await resp.json();
    if (!resp.ok) {
      return NextResponse.json({ error: data.Message || 'Failed to pay with prepay' }, { status: resp.status });
    }
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
