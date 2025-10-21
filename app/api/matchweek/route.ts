import { NextRequest, NextResponse } from 'next/server';
import { getBootstrap, getFixtures } from '@/lib/fpl/api';
// Prediction functions removed
import type { Bootstrap, Fixture, Team } from '@/lib/fpl/types';
import { PL25_BADGE_MAPPING, FALLBACK_BADGE } from '@/lib/crests/pl25-mapping';

function activeEventId(boot: Bootstrap, pref?: 'current' | 'next' | number): number {
  if (typeof pref === 'number') return pref;
  if (pref === 'next') return boot.events.find(e => e.is_next)?.id ?? boot.events.find(e => e.is_current)?.id ?? boot.events[0].id;
  return boot.events.find(e => e.is_current)?.id ?? boot.events.find(e => e.is_next)?.id ?? boot.events[0].id;
}

function fmtDay(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short' });
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const eventParam = searchParams.get('event');
    const proParam = searchParams.get('pro');
    const debugParam = searchParams.get('debug');
    
    const boot = await getBootstrap();

    let pref: 'current' | 'next' | number | undefined = 'current';
    if (eventParam) {
      if (eventParam === 'current' || eventParam === 'next') pref = eventParam;
      else {
        const id = Number(eventParam);
        if (Number.isFinite(id) && id > 0) pref = id;
      }
    }
    const eventId = activeEventId(boot, pref);

    const fixtures = (await getFixtures(eventId)).filter(f => f.event === eventId);
    fixtures.sort((a, b) => {
      const ta = a.kickoff_time ? Date.parse(a.kickoff_time) : 0;
      const tb = b.kickoff_time ? Date.parse(b.kickoff_time) : 0;
      return ta - tb;
    });

    const teamIndex = new Map<number, Team>();
    boot.teams.forEach(t => teamIndex.set(t.id, t));

    const items = await Promise.all(fixtures.map(async (f) => {
      const th = teamIndex.get(f.team_h)!;
      const ta = teamIndex.get(f.team_a)!;
      const dt = f.kickoff_time ? new Date(f.kickoff_time) : null;

      const finished = Boolean(f.finished || f.finished_provisional);
      const haveScore = typeof f.team_h_score === 'number' && typeof f.team_a_score === 'number';

      let predict: { home: number; away: number; conf: number; lambdas?: { home: number; away: number }; signalsUsed?: boolean } | null = null;
      
      // No prediction - just show upcoming matches without scores
      predict = null;

      // Debug logging
      console.log(`Fixture: Home team ${th.name} (id: ${th.id}), Away team ${ta.name} (id: ${ta.id})`);

      return {
        status: finished ? 'FINISHED' : haveScore ? 'LIVE' : 'UPCOMING',
        home: {
          id: th.id,
          code: th.code,
          short: th.short_name || th.name,
          name: th.name,
          crest: PL25_BADGE_MAPPING[th.id] || FALLBACK_BADGE
        },
        away: {
          id: ta.id,
          code: ta.code,
          short: ta.short_name || ta.name,
          name: ta.name,
          crest: PL25_BADGE_MAPPING[ta.id] || FALLBACK_BADGE
        },
        kickoff_time: f.kickoff_time || null,
        dayKey: dt ? fmtDay(dt) : 'TBC',
        timeLocal: dt ? fmtTime(dt) : '—',
        score: haveScore ? { home: f.team_h_score as number, away: f.team_a_score as number } : null,
        predict,
        ...(debugParam === '1' && predict && typeof predict === 'object' && predict !== null && 'lambdas' in predict ? { 
          lambdas: (predict as any).lambdas, 
          signalsUsed: (predict as any).signalsUsed 
        } : {})
      };
    }));

    // Group by day
    const groups = new Map<string, typeof items>();
    items.forEach(it => {
      const k = it.dayKey;
      const arr = (groups.get(k) as any) || [];
      arr.push(it);
      groups.set(k, arr);
    });

    // Date range
    const times = items.map(i => (i.kickoff_time ? Date.parse(i.kickoff_time) : NaN)).filter(n => !Number.isNaN(n));
    const start = times.length ? new Date(Math.min(...times)) : null;
    const end = times.length ? new Date(Math.max(...times)) : null;

    const iEvent = boot.events.findIndex(e => e.id === eventId);
    return NextResponse.json({
      eventId,
      eventName: `Matchweek ${eventId}`,
      dateRange: {
        start: start ? start.toLocaleDateString(undefined, { day: '2-digit', month: 'short' }) : null,
        end: end ? end.toLocaleDateString(undefined, { day: '2-digit', month: 'short' }) : null,
      },
      groups: Array.from(groups.entries()).map(([day, matches]) => ({ day, matches })),
      prevEventId: iEvent > 0 ? boot.events[iEvent - 1].id : null,
      nextEventId: iEvent >= 0 && iEvent < boot.events.length - 1 ? boot.events[iEvent + 1].id : null,
    });
  } catch (e) {
    console.error('matchweek route error:', e);
    return NextResponse.json({ error: 'Gagal memuat jadual.' }, { status: 500 });
  }
}