import { NextRequest, NextResponse } from 'next/server';

const FPL_BASE = 'https://fantasy.premierleague.com/api';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const maxOwnership = parseFloat(searchParams.get('maxOwnership') || '10');
    const minForm = parseFloat(searchParams.get('minForm') || '0');
    const position = searchParams.get('position') || 'all';
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '999');

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

    // Get current gameweek
    const currentEvent = bootstrap.events.find((e: any) => e.is_current);
    const currentGW = currentEvent ? currentEvent.id : 1;

    // Calculate fixture difficulty for each team for next 5 GWs
    const teamFixtures: any = {};
    bootstrap.teams.forEach((team: any) => {
      teamFixtures[team.id] = {
        team: team.name,
        shortName: team.short_name,
        upcoming: []
      };
    });

    fixtures.forEach((fixture: any) => {
      if (fixture.event && fixture.event > currentGW && fixture.event <= currentGW + 5) {
        // Home team
        if (teamFixtures[fixture.team_h]) {
          teamFixtures[fixture.team_h].upcoming.push({
            gw: fixture.event,
            opponent: fixture.team_a,
            isHome: true,
            difficulty: fixture.team_h_difficulty
          });
        }
        // Away team
        if (teamFixtures[fixture.team_a]) {
          teamFixtures[fixture.team_a].upcoming.push({
            gw: fixture.event,
            opponent: fixture.team_h,
            isHome: false,
            difficulty: fixture.team_a_difficulty
          });
        }
      }
    });

    // Calculate average fixture difficulty for next 5 GWs
    Object.keys(teamFixtures).forEach(teamId => {
      const upcoming = teamFixtures[teamId].upcoming;
      if (upcoming.length > 0) {
        const avgDifficulty = upcoming.reduce((sum: number, f: any) => sum + f.difficulty, 0) / upcoming.length;
        teamFixtures[teamId].avgDifficulty = avgDifficulty;
      } else {
        teamFixtures[teamId].avgDifficulty = 3;
      }
    });

    // Filter players based on criteria
    let players = bootstrap.elements.filter((player: any) => {
      const ownership = parseFloat(player.selected_by_percent);
      const form = parseFloat(player.form);
      const price = player.now_cost / 10;

      // Basic filters
      if (ownership > maxOwnership) return false;
      if (form < minForm) return false;
      if (price > maxPrice) return false;
      if (player.chance_of_playing_next_round !== null && player.chance_of_playing_next_round < 50) return false;

      // Position filter
      if (position !== 'all' && player.element_type.toString() !== position) return false;

      return true;
    });

    // Enrich players with additional data
    const enrichedPlayers = players.map((player: any) => {
      const team = bootstrap.teams.find((t: any) => t.id === player.team);
      const playerType = bootstrap.element_types.find((et: any) => et.id === player.element_type);
      const fixtures = teamFixtures[player.team] || { upcoming: [], avgDifficulty: 3 };

      // Calculate differential score
      // Higher score = better differential
      const form = parseFloat(player.form) || 0;
      const ppg = parseFloat(player.points_per_game) || 0;
      const ownership = parseFloat(player.selected_by_percent) || 0.1;
      const price = player.now_cost / 10;
      const fixtureScore = 6 - fixtures.avgDifficulty; // Lower difficulty = higher score

      // Score formula: (form + ppg) * fixture_bonus / (ownership + price_penalty)
      const differentialScore = ((form * 2 + ppg) * (1 + fixtureScore * 0.2)) / (ownership + price * 0.1 + 1);

      return {
        id: player.id,
        name: `${player.first_name} ${player.second_name}`,
        webName: player.web_name,
        team: team ? team.short_name : '',
        teamId: player.team,
        position: playerType ? playerType.singular_name_short : '',
        positionId: player.element_type,
        price: price,
        ownership: ownership,
        form: form,
        pointsPerGame: ppg,
        totalPoints: player.total_points,
        minutes: player.minutes,
        goalsScored: player.goals_scored,
        assists: player.assists,
        cleanSheets: player.clean_sheets,
        bonus: player.bonus,
        selectedBy: player.selected_by_percent,
        chanceOfPlaying: player.chance_of_playing_next_round,
        news: player.news || '',
        upcomingFixtures: fixtures.upcoming.slice(0, 5),
        avgFixtureDifficulty: fixtures.avgDifficulty,
        differentialScore: differentialScore,
        transfersIn: player.transfers_in_event || 0,
        transfersOut: player.transfers_out_event || 0,
      };
    });

    // Sort by differential score (highest first)
    enrichedPlayers.sort((a: any, b: any) => b.differentialScore - a.differentialScore);

    // Group by position
    const byPosition = {
      GKP: enrichedPlayers.filter((p: any) => p.positionId === 1).slice(0, 20),
      DEF: enrichedPlayers.filter((p: any) => p.positionId === 2).slice(0, 20),
      MID: enrichedPlayers.filter((p: any) => p.positionId === 3).slice(0, 20),
      FWD: enrichedPlayers.filter((p: any) => p.positionId === 4).slice(0, 20),
    };

    return NextResponse.json({
      currentGW,
      filters: {
        maxOwnership,
        minForm,
        position,
        maxPrice,
      },
      players: enrichedPlayers.slice(0, 50), // Top 50 overall
      byPosition,
      teams: bootstrap.teams.map((t: any) => ({
        id: t.id,
        name: t.name,
        shortName: t.short_name,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching differential finder data:', error);
    return NextResponse.json(
      { error: 'Ralat mengambil data differentials' },
      { status: 500 }
    );
  }
}

