import { NextRequest, NextResponse } from 'next/server';

const FPL_BASE = 'https://fantasy.premierleague.com/api';

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

    // 1. Get bootstrap data for current GW and player info
    const bootstrapRes = await fetch(`${FPL_BASE}/bootstrap-static/`, {
      cache: 'no-store'
    });
    const bootstrap = await bootstrapRes.json();

    const currentEvent = bootstrap.events.find((e: any) => e.is_current);
    if (!currentEvent) {
      return NextResponse.json(
        { error: 'No active gameweek' },
        { status: 404 }
      );
    }

    const currentGW = currentEvent.id;

    // 2. Get live data for current GW
    const liveRes = await fetch(`${FPL_BASE}/event/${currentGW}/live/`, {
      cache: 'no-store'
    });
    const liveData = await liveRes.json();

    // 3. Get user's team for current GW
    const picksRes = await fetch(`${FPL_BASE}/entry/${entryId}/event/${currentGW}/picks/`, {
      cache: 'no-store'
    });
    const picksData = await picksRes.json();

    // 4. Get entry info
    const entryRes = await fetch(`${FPL_BASE}/entry/${entryId}/`, {
      cache: 'no-store'
    });
    const entryData = await entryRes.json();

    // 5. Get fixtures for current GW
    const fixturesRes = await fetch(`${FPL_BASE}/fixtures/?event=${currentGW}`, {
      cache: 'no-store'
    });
    const fixtures = await fixturesRes.json();

    // Calculate live points for user's team
    const picks = picksData.entry_history.event_transfers === 0 
      ? picksData.picks 
      : picksData.picks;

    let totalLivePoints = 0;
    let captainPoints = 0;
    
    const playerDetails = picks.map((pick: any) => {
      const player = bootstrap.elements.find((p: any) => p.id === pick.element);
      const liveStats = liveData.elements.find((e: any) => e.id === pick.element);
      
      const points = liveStats?.stats?.total_points || 0;
      const multiplier = pick.multiplier;
      const playerPoints = points * multiplier;
      
      totalLivePoints += playerPoints;
      
      if (pick.is_captain) {
        captainPoints = playerPoints;
      }

      return {
        id: player?.id,
        name: player?.web_name,
        position: pick.position,
        teamId: player?.team,
        points: points,
        multiplier: multiplier,
        totalPoints: playerPoints,
        isCaptain: pick.is_captain,
        isViceCaptain: pick.is_vice_captain,
        stats: liveStats?.stats || {},
        fixture: liveStats?.explain?.[0]?.fixture || null,
      };
    });

    // Get top performers this GW
    const topPerformers = liveData.elements
      .filter((e: any) => e.stats.total_points > 0)
      .sort((a: any, b: any) => b.stats.total_points - a.stats.total_points)
      .slice(0, 10)
      .map((e: any) => {
        const player = bootstrap.elements.find((p: any) => p.id === e.id);
        return {
          id: player?.id,
          name: player?.web_name,
          teamId: player?.team,
          position: player?.element_type,
          points: e.stats.total_points,
          stats: e.stats,
        };
      });

    // Process fixtures
    const processedFixtures = fixtures.map((fixture: any) => {
      const homeTeam = bootstrap.teams.find((t: any) => t.id === fixture.team_h);
      const awayTeam = bootstrap.teams.find((t: any) => t.id === fixture.team_a);
      
      return {
        id: fixture.id,
        kickoffTime: fixture.kickoff_time,
        started: fixture.started,
        finished: fixture.finished,
        finishedProvisional: fixture.finished_provisional,
        homeTeam: {
          id: homeTeam?.id,
          name: homeTeam?.name,
          shortName: homeTeam?.short_name,
          score: fixture.team_h_score,
        },
        awayTeam: {
          id: awayTeam?.id,
          name: awayTeam?.name,
          shortName: awayTeam?.short_name,
          score: fixture.team_a_score,
        },
      };
    });

    // Calculate bonus points being applied
    const bonusInfo = fixtures
      .filter((f: any) => f.started && !f.finished)
      .map((fixture: any) => {
        const homeTeam = bootstrap.teams.find((t: any) => t.id === fixture.team_h);
        const awayTeam = bootstrap.teams.find((t: any) => t.id === fixture.team_a);
        
        return {
          fixture: `${homeTeam?.short_name} vs ${awayTeam?.short_name}`,
          status: fixture.finished ? 'Final' : 'Live',
        };
      });

    const response = {
      gameweek: {
        id: currentGW,
        name: currentEvent.name,
        deadlineTime: currentEvent.deadline_time,
        averageScore: currentEvent.average_entry_score,
        highestScore: currentEvent.highest_score,
        finished: currentEvent.finished,
        dataChecked: currentEvent.data_checked,
      },
      team: {
        managerName: `${entryData.player_first_name} ${entryData.player_last_name}`,
        teamName: entryData.name,
        livePoints: totalLivePoints,
        captainPoints: captainPoints,
        transfers: picksData.entry_history.event_transfers,
        transfersCost: picksData.entry_history.event_transfers_cost,
        netPoints: totalLivePoints - picksData.entry_history.event_transfers_cost,
        chipUsed: picksData.active_chip || null,
        overallPoints: entryData.summary_overall_points,
        overallRank: entryData.summary_overall_rank,
        lastRank: entryData.last_deadline_rank,
      },
      players: playerDetails,
      topPerformers,
      fixtures: processedFixtures,
      bonusInfo,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching live gameweek data:', error);
    return NextResponse.json(
      { error: 'Ralat mengambil data live gameweek' },
      { status: 500 }
    );
  }
}

