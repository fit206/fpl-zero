import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    message: 'Test API working',
    timestamp: new Date().toISOString(),
    url: req.url 
  });
}
