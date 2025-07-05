import { NextRequest, NextResponse } from 'next/server';

async function getParcel2GoToken() {
  const tokenUrl = 'https://www.parcel2go.com/auth/connect/token';
  const payload = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: 'payment',
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
    const { payWithPrePayUrl } = await req.json();
    if (!payWithPrePayUrl) {
      return NextResponse.json({ error: "Missing payWithPrePayUrl" }, { status: 400 });
    }

    const token = await getParcel2GoToken();
    const resp = await fetch(payWithPrePayUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      redirect: 'manual', // prevent following the redirect
    });

    // The payment API will respond with a 302 and a Location header
    const redirectUrl =
      resp.headers.get('location') ||
      resp.headers.get('Location');

    if (redirectUrl) {
      return NextResponse.json({ redirectUrl });
    } else {
      // Some integrations may respond with the link in the body
      let data;
      try {
        data = await resp.json();
      } catch {
        data = {};
      }
      return NextResponse.json({ error: 'No redirect URL returned', data });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
