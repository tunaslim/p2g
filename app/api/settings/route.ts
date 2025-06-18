import { NextRequest, NextResponse } from 'next/server';

// For demo purposes, we're just logging. You should securely store credentials.
export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  // Example: You can save this to a database, or a secure environment variable store.
  console.log('Received credentials:', { username, password });

  return NextResponse.json({ message: 'Credentials saved successfully!' });
}
