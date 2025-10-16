import { NextResponse } from 'next/server';

interface FPLPlayer {
  id: number;
  first_name: string;
  second_name: string;
  web_name: string;
  team: number;
  element_type: number;
  status: string;
  news: string;
  news_added: string;
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

interface InjuryPlayer {
  id: number;
  name: string;
  webName: string;
  teamId: number;
  teamName: string;
  teamShortName: string;
  position: number;
  positionName: string;
  status: string;
  statusLabel: string;
  news: string;
  newsAdded: string;
  statusColor: string;
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

    // Filter players with status != 'a' (not available)
    const injuredPlayers = data.elements
      .filter(player => player.status !== 'a' && player.news && player.news.trim() !== '')
      .map(player => {
        const team = data.teams.find(t => t.id === player.team);
        
        // Determine status label and color
        let statusLabel = '';
        let statusColor = '';
        
        switch (player.status) {
          case 'i':
            statusLabel = 'Injured';
            statusColor = 'bg-red-500/20 text-red-400 border-red-500/30';
            break;
          case 'd':
            statusLabel = 'Doubtful';
            statusColor = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            break;
          case 's':
            statusLabel = 'Suspended';
            statusColor = 'bg-gray-500/20 text-gray-400 border-gray-500/30';
            break;
          case 'u':
            statusLabel = 'Unavailable';
            statusColor = 'bg-gray-500/20 text-gray-400 border-gray-500/30';
            break;
          default:
            statusLabel = 'Unknown';
            statusColor = 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }

        return {
          id: player.id,
          name: `${player.first_name} ${player.second_name}`,
          webName: player.web_name,
          teamId: player.team,
          teamName: team?.name || 'Unknown',
          teamShortName: team?.short_name || 'UNK',
          position: player.element_type,
          positionName: POSITION_MAP[player.element_type as keyof typeof POSITION_MAP],
          status: player.status,
          statusLabel,
          news: player.news,
          newsAdded: player.news_added,
          statusColor
        };
      })
      .sort((a, b) => new Date(b.newsAdded).getTime() - new Date(a.newsAdded).getTime())
      .slice(0, 10); // Top 10 most recent

    return NextResponse.json(injuredPlayers);
  } catch (error) {
    console.error('Error fetching injury data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch injury data' },
      { status: 500 }
    );
  }
}
