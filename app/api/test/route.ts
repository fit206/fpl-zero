import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  console.log('Test API: START - API called');
  console.log('Test API: URL=', req.url);
  
  try {
    const url = new URL(req.url);
    const testParam = url.searchParams.get('test');
    
    console.log('Test API: testParam=', testParam);
    
    return NextResponse.json({ 
      message: 'Test API berfungsi!',
      timestamp: new Date().toISOString(),
      testParam: testParam,
      url: req.url
    }, { status: 200 });
  } catch (e) {
    console.error('Test API error:', e);
    return NextResponse.json({ 
      error: 'Test API error',
      details: e instanceof Error ? e.message : 'Unknown error'
    }, { status: 500 });
  }
}