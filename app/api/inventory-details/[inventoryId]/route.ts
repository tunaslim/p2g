import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { inventoryId: string } }
) {
  const { inventoryId } = params;

  const resp = await fetch(`https://goodlife.myhelm.app/public-api/inventory/${inventoryId}`);
  const data = await resp.json();

  // Log to debug
  // console.log("Fetched inventory data:", data);

  return NextResponse.json({
    hs_code: data.hs_code ?? "",
    customs_description: data.customs_description ?? "",
  });
}
