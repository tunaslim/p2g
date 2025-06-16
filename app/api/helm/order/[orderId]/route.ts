import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { orderId: string } }) {
  const { orderId } = params;
  const url = `https://goodlife.myhelm.app/public-api/order/${orderId}`;

  const token = new URL(request.url).searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.message || 'Failed to fetch order detail' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
