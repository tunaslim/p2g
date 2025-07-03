import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { inventoryId: string } }
) {
  const { inventoryId } = params;
  if (!inventoryId) {
    return NextResponse.json({ error: "Missing inventoryId" }, { status: 400 });
  }

  try {
    // Forward the request to the HELM API
    const helmResp = await fetch(`https://goodlife.myhelm.app/public-api/inventory/${inventoryId}`);
    if (!helmResp.ok) {
      return NextResponse.json({ error: "HELM API error" }, { status: helmResp.status });
    }
    const data = await helmResp.json();
    // You may want to transform or filter the data here if needed
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
