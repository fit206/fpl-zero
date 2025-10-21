import { NextRequest, NextResponse } from 'next/server';

const FPL_BASE = 'https://fantasy.premierleague.com/api';

// Cache untuk 1 jam
let cache: {
  data: any;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 60 * 60 * 1000; // 1 jam

export async function GET(req: NextRequest) {
  try {
    const now = Date.now();

    // Check cache
    if (cache && now - cache.timestamp < CACHE_DURATION) {
      return NextResponse.json(cache.data);
    }

    // Fetch bootstrap data untuk teams dan events
    const bootstrapRes = await fetch(`${FPL_BASE}/bootstrap-static/`);
    if (!bootstrapRes.ok) {
      throw new Error('Failed to fetch bootstrap data');
    }
    const bootstrap = await bootstrapRes.json();

    // Fetch fixtures
    const fixturesRes = await fetch(`${FPL_BASE}/fixtures/`);
    if (!fixturesRes.ok) {
      throw new Error('Failed to fetch fixtures');
    }
    const fixtures = await fixturesRes.json();

    // Get current and next 8 gameweeks
    const currentEvent = bootstrap.events.find((e: any) => e.is_current);
    const currentGW = currentEvent ? currentEvent.id : 1;
    const nextGWs = 8;

    // Filter fixtures untuk next 8 GW
    const relevantFixtures = fixtures.filter((f: any) => 
      f.event >= currentGW && f.event <= currentGW + nextGWs
    );

    // Sort teams by strength untuk create difficulty tiers
    const sortedTeams = [...bootstrap.teams].sort((a: any, b: any) => b.strength - a.strength);
    
    // Create team difficulty ratings (based on league position)
    // Top 4 = difficulty 5 (hardest), Bottom 4 = difficulty 1 (easiest)
    const teams = bootstrap.teams.map((team: any) => {
      const position = sortedTeams.findIndex((t: any) => t.id === team.id);
      let difficulty: number;
      
      if (position < 4) difficulty = 5; // Top 4: Very hard
      else if (position < 8) difficulty = 4; // 5-8: Hard
      else if (position < 14) difficulty = 3; // 9-14: Medium
      else if (position < 17) difficulty = 2; // 15-17: Easy
      else difficulty = 1; // Bottom 3: Very easy
      
      return {
        id: team.id,
        name: team.name,
        shortName: team.short_name,
        strength: team.strength,
        strengthOverallHome: team.strength_overall_home,
        strengthOverallAway: team.strength_overall_away,
        position: position + 1,
        difficulty
      };
    });

    // Process fixtures dengan difficulty
    const processedFixtures = relevantFixtures.map((fixture: any) => {
      const homeTeam = teams.find((t: any) => t.id === fixture.team_h);
      const awayTeam = teams.find((t: any) => t.id === fixture.team_a);

      return {
        id: fixture.id,
        event: fixture.event,
        kickoffTime: fixture.kickoff_time,
        homeTeam: {
          id: fixture.team_h,
          name: homeTeam?.name,
          shortName: homeTeam?.shortName,
          difficulty: awayTeam?.difficulty || 3, // Home team faces away team's difficulty
        },
        awayTeam: {
          id: fixture.team_a,
          name: awayTeam?.name,
          shortName: awayTeam?.shortName,
          difficulty: homeTeam?.difficulty || 3, // Away team faces home team's difficulty
        },
        finished: fixture.finished,
        started: fixture.started,
      };
    });

    // Group fixtures by gameweek
    const fixturesByGW: any = {};
    for (let gw = currentGW; gw <= currentGW + nextGWs; gw++) {
      fixturesByGW[gw] = processedFixtures.filter((f: any) => f.event === gw);
    }

    // Team fixture runs (difficulty untuk next 5-8 fixtures)
    const teamFixtureRuns = teams.map((team: any) => {
      const teamFixtures = processedFixtures
        .filter((f: any) => 
          f.homeTeam.id === team.id || f.awayTeam.id === team.id
        )
        .slice(0, 8)
        .map((f: any) => ({
          event: f.event,
          opponent: f.homeTeam.id === team.id ? f.awayTeam : f.homeTeam,
          isHome: f.homeTeam.id === team.id,
          difficulty: f.homeTeam.id === team.id ? f.homeTeam.difficulty : f.awayTeam.difficulty,
        }));

      // Calculate average difficulty untuk next 5 fixtures
      const next5Fixtures = teamFixtures.slice(0, 5);
      const avgDifficulty = next5Fixtures.length > 0
        ? next5Fixtures.reduce((sum, f) => sum + f.difficulty, 0) / next5Fixtures.length
        : 3;

      return {
        teamId: team.id,
        teamName: team.name,
        shortName: team.shortName,
        fixtures: teamFixtures,
        avgDifficulty: parseFloat(avgDifficulty.toFixed(2)),
        // Rating: easy/medium/hard run
        rating: avgDifficulty <= 2.5 ? 'easy' : avgDifficulty <= 3.5 ? 'medium' : 'hard',
      };
    });

    // Sort teams by avg difficulty (easiest first)
    teamFixtureRuns.sort((a, b) => a.avgDifficulty - b.avgDifficulty);

    const response = {
      currentGW,
      gameweeks: bootstrap.events
        .filter((e: any) => e.id >= currentGW && e.id <= currentGW + nextGWs)
        .map((e: any) => ({
          id: e.id,
          name: e.name,
          deadlineTime: e.deadline_time,
          finished: e.finished,
        })),
      fixturesByGW,
      teamFixtureRuns,
      teams,
    };

    // Cache result
    cache = {
      data: response,
      timestamp: now,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching fixture planner data:', error);
    return NextResponse.json(
      { error: 'Ralat mengambil data fixtures' },
      { status: 500 }
    );
  }
}

