import { NextRequest, NextResponse } from 'next/server';

const FPL_BASE = 'https://fantasy.premierleague.com/api';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const budget = parseFloat(searchParams.get('budget') || '100');
    const position = searchParams.get('position') || 'all';
    const sortBy = searchParams.get('sortBy') || 'value'; // value, points, form

    // Fetch bootstrap data
    const bootstrapRes = await fetch(`${FPL_BASE}/bootstrap-static/`, {
      cache: 'no-store'
    });
    if (!bootstrapRes.ok) {
      throw new Error('Failed to fetch bootstrap data');
    }
    const bootstrap = await bootstrapRes.json();

    // Get current gameweek
    const currentEvent = bootstrap.events.find((e: any) => e.is_current);
    const currentGW = currentEvent ? currentEvent.id : 1;

    // Filter and process players
    let players = bootstrap.elements.filter((player: any) => {
      const price = player.now_cost / 10;
      
      // Basic filters
      if (price > budget) return false;
      if (player.minutes < 90) return false; // Only players who played
      if (player.chance_of_playing_next_round !== null && player.chance_of_playing_next_round < 75) return false;
      
      // Position filter
      if (position !== 'all' && player.element_type.toString() !== position) return false;
      
      return true;
    });

    // Enrich with calculations
    const enrichedPlayers = players.map((player: any) => {
      const team = bootstrap.teams.find((t: any) => t.id === player.team);
      const playerType = bootstrap.element_types.find((et: any) => et.id === player.element_type);
      
      const price = player.now_cost / 10;
      const totalPoints = player.total_points;
      const form = parseFloat(player.form) || 0;
      const ppg = parseFloat(player.points_per_game) || 0;
      
      // Value calculations
      const pointsPerMillion = totalPoints / price;
      const formPerMillion = form / price;
      const valueScore = (pointsPerMillion * 0.6) + (formPerMillion * 0.4);
      
      return {
        id: player.id,
        name: `${player.first_name} ${player.second_name}`,
        webName: player.web_name,
        team: team ? team.short_name : '',
        teamId: player.team,
        position: playerType ? playerType.singular_name_short : '',
        positionId: player.element_type,
        price: price,
        totalPoints: totalPoints,
        form: form,
        pointsPerGame: ppg,
        minutes: player.minutes,
        goalsScored: player.goals_scored,
        assists: player.assists,
        cleanSheets: player.clean_sheets,
        ownership: parseFloat(player.selected_by_percent),
        // Value metrics
        pointsPerMillion: parseFloat(pointsPerMillion.toFixed(2)),
        formPerMillion: parseFloat(formPerMillion.toFixed(2)),
        valueScore: parseFloat(valueScore.toFixed(2)),
        transfersIn: player.transfers_in_event || 0,
        transfersOut: player.transfers_out_event || 0,
        news: player.news || '',
      };
    });

    // Sort players
    if (sortBy === 'value') {
      enrichedPlayers.sort((a: any, b: any) => b.valueScore - a.valueScore);
    } else if (sortBy === 'points') {
      enrichedPlayers.sort((a: any, b: any) => b.totalPoints - a.totalPoints);
    } else if (sortBy === 'form') {
      enrichedPlayers.sort((a: any, b: any) => b.form - a.form);
    }

    // Group by position for squad building
    const byPosition = {
      GKP: enrichedPlayers.filter((p: any) => p.positionId === 1).slice(0, 15),
      DEF: enrichedPlayers.filter((p: any) => p.positionId === 2).slice(0, 20),
      MID: enrichedPlayers.filter((p: any) => p.positionId === 3).slice(0, 20),
      FWD: enrichedPlayers.filter((p: any) => p.positionId === 4).slice(0, 15),
    };

    // Budget suggestions for full squad
    const budgetSuggestions = {
      premium: {
        GKP: { min: 4.5, max: 5.5, count: 2 },
        DEF: { min: 4.5, max: 6.0, count: 5 },
        MID: { min: 5.0, max: 13.0, count: 5 },
        FWD: { min: 6.0, max: 11.0, count: 3 },
      },
      balanced: {
        GKP: { min: 4.5, max: 5.0, count: 2 },
        DEF: { min: 4.5, max: 5.5, count: 5 },
        MID: { min: 5.0, max: 10.0, count: 5 },
        FWD: { min: 6.5, max: 9.0, count: 3 },
      },
      budget: {
        GKP: { min: 4.0, max: 4.5, count: 2 },
        DEF: { min: 4.0, max: 5.0, count: 5 },
        MID: { min: 4.5, max: 8.0, count: 5 },
        FWD: { min: 5.0, max: 7.5, count: 3 },
      },
    };

    return NextResponse.json({
      currentGW,
      budget,
      players: enrichedPlayers.slice(0, 50),
      byPosition,
      budgetSuggestions,
      stats: {
        totalPlayers: enrichedPlayers.length,
        avgPrice: parseFloat((enrichedPlayers.reduce((sum: number, p: any) => sum + p.price, 0) / enrichedPlayers.length).toFixed(1)),
        avgValue: parseFloat((enrichedPlayers.reduce((sum: number, p: any) => sum + p.valueScore, 0) / enrichedPlayers.length).toFixed(2)),
      },
      teams: bootstrap.teams.map((t: any) => ({
        id: t.id,
        name: t.name,
        shortName: t.short_name,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching budget optimizer data:', error);
    return NextResponse.json(
      { error: 'Ralat mengambil data budget optimizer' },
      { status: 500 }
    );
  }
}

