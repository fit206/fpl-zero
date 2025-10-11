// app/api/recommendations/pro/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { suggestSingleTransfersPro } from '@/lib/advisor/logic_pro_suggest';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const entryIdStr = searchParams.get('entryId');
    const eventParam = searchParams.get('event');

    if (!entryIdStr) return NextResponse.json({ error: 'entryId diperlukan' }, { status: 400 });
    const entryId = Number.parseInt(entryIdStr, 10);
    if (!Number.isFinite(entryId) || entryId <= 0) {
      return NextResponse.json({ error: 'entryId tidak sah' }, { status: 400 });
    }

    const eventId = eventParam && Number.isFinite(+eventParam) ? Number(eventParam) : undefined;
    const data = await suggestSingleTransfersPro(entryId, eventId);
    return NextResponse.json(data);
  } catch (e) {
    console.error('PRO route error', e);
    return NextResponse.json({ error: 'Ralat pelayan.' }, { status: 500 });
  }
}
