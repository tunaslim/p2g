export async function GET(request: Request, { params }: { params: { inventoryId: string } }) {
  const { inventoryId } = params;
  const resp = await fetch(`https://goodlife.myhelm.app/public-api/inventory/${inventoryId}`);
  const data = await resp.json();
  return Response.json({
    hs_code: data.hs_code ?? "",
    customs_description: data.customs_description ?? "",
  });
}
