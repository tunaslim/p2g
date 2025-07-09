// app/api/helm-orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization');

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 401 });
  }

  try {
    const response = await axios.get(
      'https://goodlife.myhelm.app/orders?filters[status][]=3&filters[status][]=82&filters[status][]=8',
      {
        headers: {
          Authorization: token,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.response?.data?.message || 'Failed to fetch orders' },
      { status: err.response?.status || 500 }
    );
  }
}
