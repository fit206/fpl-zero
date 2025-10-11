// app/api/news/expand/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  console.log('News expand API: START - API called');
  console.log('News expand API: URL=', req.url);
  
  // Always return success response for testing
  const paragraphs = [
    'API berfungsi dengan baik!',
    'Ini adalah test response dari Netlify.',
    'Deployment berjaya!'
  ];
  
  console.log('News expand API: returning test paragraphs:', paragraphs);
  return NextResponse.json({ paragraphs }, { status: 200 });
}