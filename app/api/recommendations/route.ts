import { NextRequest, NextResponse } from 'next/server';
import { suggestSingleTransfers } from '../../../lib/advisor/logic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const entryIdStr = searchParams.get('entryId');
    const eventParam = searchParams.get('event'); // 'current' | 'next' | 'number'

    if (!entryIdStr) return NextResponse.json({ error: 'entryId diperlukan' }, { status: 400 });
    const entryId = Number.parseInt(entryIdStr, 10);
    if (!Number.isFinite(entryId) || entryId <= 0) {
      return NextResponse.json({ error: 'entryId tidak sah' }, { status: 400 });
    }

    let eventOpt: 'current' | 'next' | number | undefined = 'current';
    if (eventParam) {
      if (eventParam === 'current' || eventParam === 'next') eventOpt = eventParam;
      else {
        const num = Number(eventParam);
        if (Number.isFinite(num) && num > 0) eventOpt = num;
      }
    }

    const data = await suggestSingleTransfers(entryId, { event: eventOpt });
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    if (e?.code === 'NOT_FOUND' || /404/.test(String(e?.message))) {
      return NextResponse.json({ error: 'Team ID tidak wujud atau tiada data picks.' }, { status: 400 });
    }
    console.error('API /recommendations error:', e);
    return NextResponse.json({ error: 'Ralat pelayan. Sila cuba lagi.' }, { status: 500 });
  }
}
