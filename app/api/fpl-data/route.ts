import { NextResponse } from 'next/server';

interface FPLPlayer {
  id: number;
  first_name: string;
  second_name: string;
  web_name: string;
  team: number;
  element_type: number;
  total_points: number;
  now_cost: number;
  selected_by_percent: string;
  form: string;
  value_form: string;
  transfers_in: number;
  transfers_out: number;
  points_per_game: string;
}

interface FPLTeam {
  id: number;
  name: string;
  short_name: string;
  code: number;
}

interface FPLBootstrapData {
  elements: FPLPlayer[];
  teams: FPLTeam[];
}

export async function GET() {
  try {
    // Fetch data from FPL API without cache (data too large for Next.js cache)
    const response = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
      cache: 'no-store' // Disable Next.js cache due to large data size
    });

    if (!response.ok) {
      throw new Error(`FPL API error: ${response.status}`);
    }

    const data: FPLBootstrapData = await response.json();

    // Process and filter data
    const processedData = {
      players: data.elements.map(player => ({
        id: player.id,
        name: `${player.first_name} ${player.second_name}`,
        webName: player.web_name,
        teamId: player.team,
        position: player.element_type,
        totalPoints: player.total_points,
        cost: player.now_cost,
        selectedByPercent: parseFloat(player.selected_by_percent),
        form: parseFloat(player.form),
        valueForm: parseFloat(player.value_form),
        transfersIn: player.transfers_in,
        transfersOut: player.transfers_out,
        pointsPerGame: parseFloat(player.points_per_game)
      })),
      teams: data.teams.map(team => ({
        id: team.id,
        name: team.name,
        shortName: team.short_name,
        code: team.code
      }))
    };

    return NextResponse.json(processedData);
  } catch (error) {
    console.error('Error fetching FPL data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch FPL data' },
      { status: 500 }
    );
  }
}
