// ✅ app/api/helm/order/[orderId]/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string } }
) {
  const { orderId } = params; // Extract the dynamic route parameter
  const token = new URL(request.url).searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 401 });
  }

  try {
    const helmResponse = await fetch(
      `https://goodlife.myhelm.app/public-api/order/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!helmResponse.ok) {
      const errorData = await helmResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to fetch order' },
        { status: helmResponse.status }
      );
    }

    const data = await helmResponse.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
