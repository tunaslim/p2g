import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  const { orderId } = params;

  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token is required as query parameter "token"' },
        { status: 401 }
      );
    }

    // Call Helm API order detail endpoint
    const helmRes = await fetch(
      `https://goodlife.myhelm.app/public-api/order/${orderId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!helmRes.ok) {
      const errorText = await helmRes.text();
      return NextResponse.json(
        { error: `Helm API error: ${helmRes.status} - ${errorText}` },
        { status: helmRes.status }
      );
    }

    const data = await helmRes.json();

    return NextResponse.json(data);
  } catch (error) {
    // TypeScript: error is unknown, so we do type guard
    let message = 'Unknown error';
    if (error instanceof Error) message = error.message;

    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 }
    );
  }
}
