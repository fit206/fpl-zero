// app/api/news/expand/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const playerId = Number(url.searchParams.get('playerId') || '0');
    const teamId = Number(url.searchParams.get('teamId') || '0');
    
    console.log('News expand API: playerId=', playerId, 'teamId=', teamId);

    // Simple test response
    if (playerId > 0) {
      const paragraphs = [
        `Pemain ID: ${playerId}`,
        `Ini adalah test response untuk player ${playerId}`,
        `API berfungsi dengan baik!`
      ];
      
      console.log('News expand API: returning test paragraphs:', paragraphs);
      return NextResponse.json({ paragraphs }, { status: 200 });
    }

    if (teamId > 0) {
      const paragraphs = [
        `Team ID: ${teamId}`,
        `Ini adalah test response untuk team ${teamId}`,
        `API berfungsi dengan baik!`
      ];
      
      console.log('News expand API: returning test paragraphs:', paragraphs);
      return NextResponse.json({ paragraphs }, { status: 200 });
    }

    return NextResponse.json({ paragraphs: ['Tiada parameter yang dihantar.'] }, { status: 200 });
  } catch (e) {
    console.error('API /news/expand error', e);
    console.error('API /news/expand error details:', e);
    console.error('API /news/expand error stack:', e instanceof Error ? e.stack : 'No stack');
    return NextResponse.json({ 
      paragraphs: [
        'Gagal memuat penerangan lanjut.',
        'Sila cuba lagi dalam beberapa minit.',
        'Jika masalah berterusan, sila hubungi support.'
      ] 
    }, { status: 200 });
  }
}