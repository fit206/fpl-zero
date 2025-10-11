// app/api/news/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBootstrap } from '@/lib/fpl/api';
import { buildNews } from '@/lib/news/build';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sinceHours = Number(searchParams.get('sinceHours') || '1'); // default 1 jam untuk berita terkini
    const teamId = searchParams.get('teamId');
    const category = searchParams.get('category'); // Filter by category
    const boot = await getBootstrap();
    let news = await buildNews(boot, Number.isFinite(sinceHours) ? sinceHours : 1, teamId ? Number(teamId) : undefined);
    
    // Filter by category if specified
    if (category) {
      news = news.filter(item => item.category === category);
    }
    
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      sinceHours: Number.isFinite(sinceHours) ? sinceHours : 1,
      category: category || 'all',
      count: news.length,
      items: news,
    });
  } catch (e) {
    console.error('API /news error', e);
    return NextResponse.json({ error: 'Gagal memuat news.' }, { status: 500 });
  }
}
