import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { inventoryId: string } }
) {
  const { inventoryId } = params;
  // Replace with your backend/api URL
  const apiUrl = `https://goodlife.myhelm.app/public-api/inventory/${inventoryId}`;

  try {
    const resp = await fetch(apiUrl, { next: { revalidate: 60 } });
    if (!resp.ok) {
      return NextResponse.json(
        { error: 'Not found', hs_code: '', customs_description: '' },
        { status: 404 }
      );
    }
    const data = await resp.json();
    return NextResponse.json({
      hs_code: data.hs_code || '',
      customs_description: data.customs_description || '',
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch', hs_code: '', customs_description: '' },
      { status: 500 }
    );
  }
}
