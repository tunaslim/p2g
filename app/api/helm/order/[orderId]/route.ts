import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest, { params }: { params: { orderId: string } }) {
  const { orderId } = params;
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ message: 'Missing token' }, { status: 400 });
  }

  try {
    const response = await axios.get(`https://goodlife.myhelm.app/public-api/order/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return NextResponse.json(response.data);
  } catch (err) {
    console.error('Proxy get order detail error:', err);
    return NextResponse.json({ message: 'Proxy get order detail failed', error: err }, { status: 500 });
  }
}
