import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  // Get JSON from request body
  let body: any;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    // POST to Helm login API
    const response = await axios.post(
      'https://goodlife.myhelm.app/auth/login',
      body,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    // Log response for debugging
    console.log('Helm login response:', response.data);

    // Return token to frontend
    return NextResponse.json({ token: response.data.token });
  } catch (error: any) {
    // Print more error details
    console.error('Helm login error:', error.response?.status, error.response?.data);
    return NextResponse.json(
      { error: error.response?.data?.message || 'Login failed' },
      { status: error.response?.status || 500 }
    );
  }
}
