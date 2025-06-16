import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  context: { params: { orderId: string } }
) {
  const { orderId } = context.params;

  // Get the auth token from query parameters or headers as you prefer
  const tokenFromQuery = new URL(request.url).searchParams.get('token');
  const authHeader = request.headers.get('authorization');
  const token = tokenFromQuery || (authHeader?.replace(/^Bearer\s/, '') ?? '');

  if (!token) {
    return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
  }

  const url = `https://goodlife.myhelm.app/public-api/order/${orderId}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to fetch order detail' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
