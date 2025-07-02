import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { order } = await req.json();

    // Place your order handling logic here...
    // For now, just echo it back.
    return NextResponse.json({
      success: true,
      received: order,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
