// app/api/helm-despatch/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  // 1. Get the Authorization header from the request (client must send it)
  const token = req.headers.get("authorization");
  if (!token) {
    return NextResponse.json({ error: "Missing authorization token" }, { status: 401 });
  }

  // 2. Parse the incoming JSON payload
  let payload: any;
  try {
    payload = await req.json();
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // 3. POST to Helm API with Bearer token
  try {
    const resp = await axios.post(
      "https://goodlife.myhelm.app/orders/despatch_with_tracking_code",
      payload,
      {
        headers: {
          Authorization: token,
        },
      }
    );
    return NextResponse.json(resp.data);
  } catch (err: any) {
    // If the API returns an HTML login page, handle as auth error
    if (
      err.response &&
      typeof err.response.data === "string" &&
      err.response.data.includes("<html")
    ) {
      return NextResponse.json(
        { error: "Authentication failed or session expired. Please log in again." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: err.response?.data?.message || "Failed to despatch order" },
      { status: err.response?.status || 500 }
    );
  }
}
