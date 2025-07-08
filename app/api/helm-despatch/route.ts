// app/api/helm-despatch/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  // 1. Get token from headers (from frontend)
  const token = req.headers.get('authorization');
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 401 });
  }

  // 2. Get payload
  let payload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    // 3. Forward to Helm backend
    const response = await axios.post(
      'https://goodlife.myhelm.app/orders/despatch_with_tracking_code',
      payload,
      {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
      }
    );

    // 4. Return Helm response
    return NextResponse.json(response.data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.response?.data?.message || 'Failed to despatch with tracking code', details: err.response?.data },
      { status: err.response?.status || 500 }
    );
  }
}
