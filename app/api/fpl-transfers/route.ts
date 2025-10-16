import { NextResponse } from 'next/server';

interface FPLPlayer {
  id: number;
  first_name: string;
  second_name: string;
  web_name: string;
  team: number;
  element_type: number;
  transfers_in: number;
  transfers_out: number;
  transfers_in_event: number;
  transfers_out_event: number;
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

interface TransferPlayer {
  id: number;
  name: string;
  webName: string;
  teamId: number;
  teamName: string;
  teamShortName: string;
  position: number;
  positionName: string;
  transfersIn: number;
  transfersOut: number;
  transfersInEvent: number;
  transfersOutEvent: number;
}

export async function GET() {
  try {
    // Fetch data from FPL API
    const response = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`FPL API error: ${response.status}`);
    }

    const data: FPLBootstrapData = await response.json();

    // Position mapping
    const POSITION_MAP = {
      1: 'GK',
      2: 'DEF', 
      3: 'MID',
      4: 'FWD'
    };

    // Process all players
    const allPlayers = data.elements.map(player => {
      const team = data.teams.find(t => t.id === player.team);
      
      return {
        id: player.id,
        name: `${player.first_name} ${player.second_name}`,
        webName: player.web_name,
        teamId: player.team,
        teamName: team?.name || 'Unknown',
        teamShortName: team?.short_name || 'UNK',
        position: player.element_type,
        positionName: POSITION_MAP[player.element_type as keyof typeof POSITION_MAP],
        transfersIn: player.transfers_in,
        transfersOut: player.transfers_out,
        transfersInEvent: player.transfers_in_event,
        transfersOutEvent: player.transfers_out_event
      };
    });

    // Get top 5 most transferred IN players
    const topTransferredIn = allPlayers
      .filter(player => player.transfersInEvent > 0)
      .sort((a, b) => b.transfersInEvent - a.transfersInEvent)
      .slice(0, 5);

    // Get top 5 most transferred OUT players
    const topTransferredOut = allPlayers
      .filter(player => player.transfersOutEvent > 0)
      .sort((a, b) => b.transfersOutEvent - a.transfersOutEvent)
      .slice(0, 5);

    return NextResponse.json({
      transferredIn: topTransferredIn,
      transferredOut: topTransferredOut
    });
  } catch (error) {
    console.error('Error fetching transfer data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transfer data' },
      { status: 500 }
    );
  }
}
