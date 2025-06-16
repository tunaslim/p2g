import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const response = await axios.post('https://goodlife.myhelm.app/public-api/auth/login', body, {
      headers: { 'Content-Type': 'application/json' },
    });

    return NextResponse.json(response.data);
  } catch (err) {
    console.error('Proxy login error:', err);
    return NextResponse.json({ message: 'Proxy login failed', error: err }, { status: 500 });
  }
}
