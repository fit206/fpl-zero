import { NextRequest, NextResponse } from 'next/server';

const FPL_BASE = 'https://fantasy.premierleague.com/api';

// Cache untuk 2 minit
let cache: {
  [key: string]: {
    data: any;
    timestamp: number;
  };
} = {};

const CACHE_DURATION = 2 * 60 * 1000; // 2 minit

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const leagueId = searchParams.get('leagueId');
    const page = searchParams.get('page') || '1';

    if (!leagueId) {
      return NextResponse.json(
        { error: 'League ID diperlukan' },
        { status: 400 }
      );
    }

    const cacheKey = `league-${leagueId}-page-${page}`;
    const now = Date.now();

    // Check cache
    if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_DURATION) {
      return NextResponse.json(cache[cacheKey].data);
    }

    // Fetch league standings
    const leagueUrl = `${FPL_BASE}/leagues-classic/${leagueId}/standings/?page_standings=${page}`;
    const leagueRes = await fetch(leagueUrl);

    if (!leagueRes.ok) {
      return NextResponse.json(
        { error: 'League tidak dijumpai atau private' },
        { status: 404 }
      );
    }

    const leagueData = await leagueRes.json();

    // Format response
    const response = {
      league: {
        id: leagueData.league.id,
        name: leagueData.league.name,
        created: leagueData.league.created,
        closed: leagueData.league.closed,
        rank: leagueData.league.rank,
        max_entries: leagueData.league.max_entries,
        league_type: leagueData.league.league_type,
        scoring: leagueData.league.scoring,
        start_event: leagueData.league.start_event,
      },
      standings: {
        has_next: leagueData.standings.has_next,
        page: leagueData.standings.page,
        results: leagueData.standings.results.map((entry: any) => ({
          id: entry.id,
          entry: entry.entry,
          entry_name: entry.entry_name,
          player_name: entry.player_name,
          rank: entry.rank,
          last_rank: entry.last_rank,
          rank_sort: entry.rank_sort,
          total: entry.total,
          event_total: entry.event_total,
          matches_played: entry.matches_played,
          matches_won: entry.matches_won,
          matches_drawn: entry.matches_drawn,
          matches_lost: entry.matches_lost,
        })),
      },
      new_entries: leagueData.new_entries,
    };

    // Cache result
    cache[cacheKey] = {
      data: response,
      timestamp: now,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching mini-league:', error);
    return NextResponse.json(
      { error: 'Ralat mengambil data league' },
      { status: 500 }
    );
  }
}

