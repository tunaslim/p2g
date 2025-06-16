import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get('page') || '1';
  const sort = searchParams.get('sort') || 'name_az';
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ message: 'Missing token' }, { status: 400 });
  }

  try {
    const response = await axios.get(`https://goodlife.myhelm.app/public-api/orders?page=${page}&sort=${sort}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return NextResponse.json(response.data);
  } catch (err) {
    console.error('Proxy get orders error:', err);
    return NextResponse.json({ message: 'Proxy get orders failed', error: err }, { status: 500 });
  }
}
