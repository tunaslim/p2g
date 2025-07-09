// app/api/helm-login/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  let body: { email: string; password: string; "2fa_code"?: string } = { email: '', password: '' };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const res = await fetch('https://goodlife.myhelm.app/public-api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    // Attempt to parse the response as JSON
    const data = await res.json();

    if (!res.ok || !data.token) {
      return NextResponse.json(
        { error: data.error || data.message || 'Login failed' },
        { status: res.status }
      );
    }

    // Success: return only the token
    return NextResponse.json({ token: data.token });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unexpected error occurred' },
      { status: 500 }
    );
  }
}
