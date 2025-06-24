// app/api/helm-orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization');
  const helmFilter = req.headers.get('x-helm-filter') ?? 'status[]=3';

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 401 });
  }

  try {
    // Build query string dynamically based on header
    const query = `filters[${helmFilter}]`;
    const url = `https://goodlife.myhelm.app/public-api/orders?${query}`;

    const response = await axios.get(url, {
      headers: { Authorization: token },
    });

    return NextResponse.json(response.data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.response?.data?.message || 'Failed to fetch orders' },
      { status: err.response?.status || 500 }
    );
  }
}
