// app/api/helm-login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const response = await axios.post('https://goodlife.myhelm.app/auth/login', body);
    // Log the actual response for debugging
    console.log(response.data);

    return NextResponse.json({ token: response.data.token });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.response?.data?.message || 'Login failed' },
      { status: error.response?.status || 500 }
    );
  }
}
