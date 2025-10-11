// app/api/captain/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { suggestCaptain } from '@/lib/advisor/captain';

export const revalidate = 30; // Cache 30 saat untuk speed

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const entryIdStr = url.searchParams.get('entryId');
    const eventParam = url.searchParams.get('event');

    if (!entryIdStr) {
      return NextResponse.json({ error: 'entryId diperlukan' }, { status: 400 });
    }
    const entryId = Number.parseInt(entryIdStr, 10);
    if (!Number.isFinite(entryId) || entryId <= 0) {
      return NextResponse.json({ error: 'entryId tidak sah' }, { status: 400 });
    }

    const pref =
      eventParam === 'current' || eventParam === 'next'
        ? eventParam
        : Number.isFinite(Number(eventParam))
        ? Number(eventParam)
        : 'current';

    const data = await suggestCaptain(entryId, { event: pref as any });
    return NextResponse.json(data, { 
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120'
      }
    });
  } catch (e: any) {
    // Jika getPicks 404, balas 400 yang jelas
    const msg = String(e?.message || '');
    const code = (e as any)?.code;
    if (code === 'NOT_FOUND' || /404/.test(msg)) {
      return NextResponse.json(
        { error: 'Team ID tiada data picks untuk GW ini. Cuba event=next atau pastikan pasukan wujud.' },
        { status: 400 }
      );
    }
    console.error('[API /captain] error:', e);
    return NextResponse.json({ error: 'Ralat pelayan.' }, { status: 500 });
  }
}