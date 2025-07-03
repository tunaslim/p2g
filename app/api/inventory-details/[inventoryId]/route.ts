import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, context: any) {
  const inventoryId = context.params.inventoryId;
  const resp = await fetch(`https://goodlife.myhelm.app/public-api/inventory/${inventoryId}`);
  const data = await resp.json();
  return NextResponse.json({
    hs_code: data.hs_code ?? "",
    customs_description: data.customs_description ?? "",
  });
}
