import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: { inventoryId: string } }
) {
  const { inventoryId } = context.params;
  // Example external fetch (you may want to handle errors and add real logic)
  const resp = await fetch(
    `https://goodlife.myhelm.app/public-api/inventory/${inventoryId}`
  );
  const data = await resp.json();

  return NextResponse.json({
    hs_code: data.hs_code ?? "",
    customs_description: data.customs_description ?? "",
  });
}
