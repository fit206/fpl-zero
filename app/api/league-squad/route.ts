import { NextRequest, NextResponse } from 'next/server';

const FPL_BASE = 'https://fantasy.premierleague.com/api';

// Cache untuk 5 minit
let cache: {
  [key: string]: {
    data: any;
    timestamp: number;
  };
} = {};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minit

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const entryId = searchParams.get('entryId');

    if (!entryId) {
      return NextResponse.json(
        { error: 'Entry ID diperlukan' },
        { status: 400 }
      );
    }

    const cacheKey = `entry-${entryId}`;
    const now = Date.now();

    // Check cache
    if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_DURATION) {
      return NextResponse.json(cache[cacheKey].data);
    }

    // Fetch entry data
    const entryUrl = `${FPL_BASE}/entry/${entryId}/`;
    const entryRes = await fetch(entryUrl);

    if (!entryRes.ok) {
      return NextResponse.json(
        { error: 'Entry tidak dijumpai' },
        { status: 404 }
      );
    }

    const entryData = await entryRes.json();

    // Fetch current event (gameweek)
    const bootstrapUrl = `${FPL_BASE}/bootstrap-static/`;
    const bootstrapRes = await fetch(bootstrapUrl);
    const bootstrapData = await bootstrapRes.json();
    
    const currentEvent = bootstrapData.events.find((e: any) => e.is_current);
    const eventId = currentEvent ? currentEvent.id : bootstrapData.events.find((e: any) => e.is_next)?.id || 1;

    // Fetch current picks
    const picksUrl = `${FPL_BASE}/entry/${entryId}/event/${eventId}/picks/`;
    const picksRes = await fetch(picksUrl);
    
    let picks = null;
    if (picksRes.ok) {
      picks = await picksRes.json();
    }

    const response = {
      entry: {
        id: entryData.id,
        player_first_name: entryData.player_first_name,
        player_last_name: entryData.player_last_name,
        name: entryData.name,
        summary_overall_points: entryData.summary_overall_points,
        summary_overall_rank: entryData.summary_overall_rank,
        summary_event_points: entryData.summary_event_points,
        summary_event_rank: entryData.summary_event_rank,
        current_event: entryData.current_event,
        favourite_team: entryData.favourite_team,
      },
      picks: picks ? {
        active_chip: picks.active_chip,
        automatic_subs: picks.automatic_subs,
        entry_history: picks.entry_history,
        picks: picks.picks.map((p: any) => ({
          element: p.element,
          position: p.position,
          is_captain: p.is_captain,
          is_vice_captain: p.is_vice_captain,
          multiplier: p.multiplier,
        })),
      } : null,
    };

    // Cache result
    cache[cacheKey] = {
      data: response,
      timestamp: now,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching league squad:', error);
    return NextResponse.json(
      { error: 'Ralat mengambil data squad' },
      { status: 500 }
    );
  }
}

