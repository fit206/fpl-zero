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

    // Fetch bootstrap data
    const bootstrapRes = await fetch(`${FPL_BASE}/bootstrap-static/`, {
      cache: 'no-store'
    });
    if (!bootstrapRes.ok) {
      throw new Error('Failed to fetch bootstrap data');
    }
    const bootstrap = await bootstrapRes.json();

    // Fetch fixtures
    const fixturesRes = await fetch(`${FPL_BASE}/fixtures/`, {
      cache: 'no-store'
    });
    const fixtures = fixturesRes.ok ? await fixturesRes.json() : [];

    // Fetch entry data
    const entryRes = await fetch(`${FPL_BASE}/entry/${entryId}/`);
    if (!entryRes.ok) {
      return NextResponse.json(
        { error: 'Entry tidak dijumpai' },
        { status: 404 }
      );
    }
    const entry = await entryRes.json();

    // Fetch entry history untuk check chips used
    const historyRes = await fetch(`${FPL_BASE}/entry/${entryId}/history/`);
    const history = historyRes.ok ? await historyRes.json() : null;

    // Get current gameweek
    const currentEvent = bootstrap.events.find((e: any) => e.is_current);
    const currentGW = currentEvent ? currentEvent.id : 1;
    const nextEvent = bootstrap.events.find((e: any) => e.is_next);

    // Check which chips have been used
    const chipsUsed = new Set();
    if (history?.current) {
      history.current.forEach((gw: any) => {
        if (gw.active_chip) {
          chipsUsed.add(gw.active_chip);
        }
      });
    }

    // Chips status
    const chips = [
      {
        name: 'wildcard',
        displayName: 'Wildcard',
        description: 'Unlimited free transfers untuk 1 GW',
        icon: '🃏',
        used: chipsUsed.has('wildcard') || chipsUsed.has('3xc'), // Sometimes API uses different names
        canUse: !chipsUsed.has('wildcard'),
        // Wildcard best untuk: Team rebuild, masa ada banyak injuries
      },
      {
        name: 'bboost',
        displayName: 'Bench Boost',
        description: 'Bench pemain turut dapat points',
        icon: '📊',
        used: chipsUsed.has('bboost'),
        canUse: !chipsUsed.has('bboost'),
        // Best untuk: Double Gameweek (DGW)
      },
      {
        name: '3xc',
        displayName: 'Triple Captain',
        description: 'Captain dapat 3x points (instead of 2x)',
        icon: '👑',
        used: chipsUsed.has('3xc'),
        canUse: !chipsUsed.has('3xc'),
        // Best untuk: DGW atau easy fixture untuk premium captain
      },
      {
        name: 'freehit',
        displayName: 'Free Hit',
        description: 'One-week unlimited transfers (team revert)',
        icon: '🎯',
        used: chipsUsed.has('freehit'),
        canUse: !chipsUsed.has('freehit'),
        // Best untuk: Blank Gameweek (BGW) atau unique GW
      },
    ];

    // Analyze fixtures untuk detect DGW/BGW and recommend GWs
    const fixturesByGW: any = {};
    const teamFixtureCount: any = {};
    
    fixtures.forEach((fixture: any) => {
      if (fixture.event && fixture.event > currentGW && fixture.event <= currentGW + 15) {
        if (!fixturesByGW[fixture.event]) {
          fixturesByGW[fixture.event] = [];
        }
        fixturesByGW[fixture.event].push(fixture);
        
        // Count fixtures per team per GW
        if (!teamFixtureCount[fixture.event]) {
          teamFixtureCount[fixture.event] = {};
        }
        teamFixtureCount[fixture.event][fixture.team_h] = (teamFixtureCount[fixture.event][fixture.team_h] || 0) + 1;
        teamFixtureCount[fixture.event][fixture.team_a] = (teamFixtureCount[fixture.event][fixture.team_a] || 0) + 1;
      }
    });

    // Detect potential DGWs (teams with 2+ fixtures)
    const potentialDGWs: number[] = [];
    const potentialBGWs: number[] = [];
    const normalGWFixtures = 10; // Usually 10 fixtures (20 teams / 2)
    
    Object.keys(fixturesByGW).forEach(gwStr => {
      const gw = parseInt(gwStr);
      const fixtureCount = fixturesByGW[gw].length;
      const teamCounts = teamFixtureCount[gw];
      const teamsWithMultipleFixtures = Object.values(teamCounts).filter((count: any) => count >= 2).length;
      
      // DGW: teams with 2+ fixtures or more fixtures than normal
      if (teamsWithMultipleFixtures >= 4 || fixtureCount > normalGWFixtures) {
        potentialDGWs.push(gw);
      }
      
      // BGW: fewer fixtures than normal
      if (fixtureCount < normalGWFixtures - 2) {
        potentialBGWs.push(gw);
      }
    });

    // Find best GWs for easy fixtures (for Triple Captain)
    const gwDifficulty: any = {};
    Object.keys(fixturesByGW).forEach(gwStr => {
      const gw = parseInt(gwStr);
      let totalDifficulty = 0;
      fixturesByGW[gw].forEach((fixture: any) => {
        const homeTeam = bootstrap.teams.find((t: any) => t.id === fixture.team_h);
        const awayTeam = bootstrap.teams.find((t: any) => t.id === fixture.team_a);
        if (homeTeam && awayTeam) {
          // Lower difficulty = easier fixtures
          totalDifficulty += (homeTeam.strength + awayTeam.strength) / 2;
        }
      });
      gwDifficulty[gw] = totalDifficulty / fixturesByGW[gw].length;
    });

    // Find easiest upcoming GWs
    const easiestGWs = Object.entries(gwDifficulty)
      .sort(([, a]: any, [, b]: any) => a - b)
      .slice(0, 3)
      .map(([gw]) => parseInt(gw));

    // Analyze upcoming gameweeks
    const upcomingGWs = bootstrap.events
      .filter((e: any) => e.id > currentGW && e.id <= currentGW + 10)
      .map((e: any) => ({
        id: e.id,
        name: e.name,
        deadlineTime: e.deadline_time,
        finished: e.finished,
        isDGW: potentialDGWs.includes(e.id),
        isBGW: potentialBGWs.includes(e.id),
        fixtureCount: fixturesByGW[e.id]?.length || 0,
      }));

    // Smart recommendations with specific GWs
    const firstDGW = potentialDGWs[0];
    const firstBGW = potentialBGWs[0];
    const secondDGW = potentialDGWs[1];
    
    const recommendations = {
      wildcard: {
        recommendedGW: chipsUsed.has('wildcard') 
          ? null 
          : (firstDGW ? firstDGW - 1 : currentGW + 8),
        reason: chipsUsed.has('wildcard') 
          ? 'Sudah digunakan' 
          : firstDGW 
            ? `Guna GW${firstDGW - 1} untuk prepare team sebelum DGW${firstDGW}`
            : `Cadangan guna sekitar GW${currentGW + 8} untuk refresh team`,
        priority: chipsUsed.has('wildcard') ? 0 : 3,
        tips: [
          'Tunggu hingga ada banyak pemain injured atau form drop',
          firstDGW ? `Ideal guna 1 GW sebelum DGW (GW${firstDGW - 1}) untuk build DGW team` : 'Elakkan guna terlalu awal dalam season',
          'Perfect untuk switch strategy (budget to premium atau vice versa)',
          'Plan transfers untuk maximize team value',
        ],
      },
      bboost: {
        recommendedGW: chipsUsed.has('bboost') ? null : (firstDGW || null),
        reason: chipsUsed.has('bboost')
          ? 'Sudah digunakan'
          : firstDGW
            ? `SIMPAN untuk GW${firstDGW} - Double Gameweek confirmed!`
            : 'Tunggu announcement DGW (biasanya GW24-26 & GW36-37)',
        priority: chipsUsed.has('bboost') ? 0 : (firstDGW ? 5 : 4),
        tips: [
          firstDGW ? `🎯 TARGET: GW${firstDGW} (DGW detected!)` : 'TUNGGU untuk Double Gameweek (DGW)!',
          'Pastikan full 15 pemain ada fixtures (ideally DGW)',
          'Planning perlu start 2-3 GW awal dengan transfers',
          'Maximum points potential: 15 players x 2 games = 30 appearances!',
        ],
      },
      '3xc': {
        recommendedGW: chipsUsed.has('3xc') 
          ? null 
          : (firstDGW || easiestGWs[0] || null),
        reason: chipsUsed.has('3xc')
          ? 'Sudah digunakan'
          : firstDGW
            ? `Guna GW${firstDGW} pada captain premium (Haaland/Salah) dengan DGW`
            : easiestGWs[0]
              ? `Guna GW${easiestGWs[0]} bila captain anda vs bottom teams`
              : 'Tunggu DGW atau easy fixtures untuk premium captain',
        priority: chipsUsed.has('3xc') ? 0 : (firstDGW ? 5 : 4),
        tips: [
          firstDGW ? `🎯 BEST: GW${firstDGW} DGW untuk captain` : 'Ideal untuk DGW (captain main 2 games = 6x points possible!)',
          secondDGW && !chipsUsed.has('bboost') ? `Alternative: GW${secondDGW} kalau BB dah guna` : 'Atau guna untuk Haaland/Salah vs team bottom 3',
          'Check team news & rotation risk!',
          '⚠️ HIGH RISK: Captain blank = chip wasted!',
        ],
      },
      freehit: {
        recommendedGW: chipsUsed.has('freehit') ? null : (firstBGW || null),
        reason: chipsUsed.has('freehit')
          ? 'Sudah digunakan'
          : firstBGW
            ? `Simpan untuk GW${firstBGW} - Blank Gameweek detected`
            : 'Tunggu BGW announcement (biasanya around GW29 & GW33)',
        priority: chipsUsed.has('freehit') ? 0 : (firstBGW ? 5 : 3),
        tips: [
          firstBGW ? `🎯 TARGET: GW${firstBGW} (BGW - ramai team tak main)` : 'Perfect untuk Blank Gameweek (BGW)',
          'Full squad temporary dari teams yang main sahaja',
          'Team auto-revert lepas GW - no permanent impact',
          'Alternative: Guna bila ramai pemain anda injured/suspended',
        ],
      },
    };

    // Team info
    const teamInfo = {
      managerName: `${entry.player_first_name} ${entry.player_last_name}`,
      teamName: entry.name,
      overallPoints: entry.summary_overall_points,
      overallRank: entry.summary_overall_rank,
      currentGW,
    };

    const response = {
      teamInfo,
      chips,
      recommendations,
      upcomingGWs: upcomingGWs.slice(0, 5),
      deadlineInfo: nextEvent ? {
        nextGW: nextEvent.id,
        deadlineTime: nextEvent.deadline_time,
      } : null,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching chip strategy:', error);
    return NextResponse.json(
      { error: 'Ralat mengambil data chip strategy' },
      { status: 500 }
    );
  }
}

