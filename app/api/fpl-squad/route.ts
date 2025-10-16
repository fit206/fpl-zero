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

interface OptimizedPlayer {
  id: number;
  name: string;
  webName: string;
  teamId: number;
  teamName: string;
  position: number;
  positionName: string;
  cost: number;
  expectedPoints: number;
  form: number;
  pointsPerGame: number;
}

interface SquadResult {
  starting_11: OptimizedPlayer[];
  bench: OptimizedPlayer[];
  captain: OptimizedPlayer;
  vice_captain: OptimizedPlayer;
  totalCost: number;
  totalExpectedPoints: number;
  formation: string;
}

// Position mapping
const POSITION_MAP = {
  1: 'GK',
  2: 'DEF', 
  3: 'MID',
  4: 'FWD'
};

// All valid FPL formations
const FORMATIONS = {
  '3-4-3': {
    total: { GK: 2, DEF: 5, MID: 5, FWD: 3 },
    starting: { GK: 1, DEF: 3, MID: 4, FWD: 3 }
  },
  '3-5-2': {
    total: { GK: 2, DEF: 5, MID: 5, FWD: 3 },
    starting: { GK: 1, DEF: 3, MID: 5, FWD: 2 }
  },
  '4-3-3': {
    total: { GK: 2, DEF: 5, MID: 5, FWD: 3 },
    starting: { GK: 1, DEF: 4, MID: 3, FWD: 3 }
  },
  '4-4-2': {
    total: { GK: 2, DEF: 5, MID: 5, FWD: 3 },
    starting: { GK: 1, DEF: 4, MID: 4, FWD: 2 }
  },
  '4-5-1': {
    total: { GK: 2, DEF: 5, MID: 5, FWD: 3 },
    starting: { GK: 1, DEF: 4, MID: 5, FWD: 1 }
  },
  '5-3-2': {
    total: { GK: 2, DEF: 5, MID: 5, FWD: 3 },
    starting: { GK: 1, DEF: 5, MID: 3, FWD: 2 }
  },
  '5-4-1': {
    total: { GK: 2, DEF: 5, MID: 5, FWD: 3 },
    starting: { GK: 1, DEF: 5, MID: 4, FWD: 1 }
  }
};

// Default formation (3-4-3)
const DEFAULT_FORMATION = '3-4-3';

export async function GET(request: Request) {
  try {
    // Get formation parameter from URL
    const { searchParams } = new URL(request.url);
    const formation = searchParams.get('formation') || DEFAULT_FORMATION;
    
    // Validate formation
    if (!FORMATIONS[formation as keyof typeof FORMATIONS]) {
      return NextResponse.json(
        { error: `Invalid formation. Valid formations: ${Object.keys(FORMATIONS).join(', ')}` },
        { status: 400 }
      );
    }

    // Fetch data from FPL API
    const response = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`FPL API error: ${response.status}`);
    }

    const data: FPLBootstrapData = await response.json();

    // Process players
    const players = data.elements.map(player => ({
      id: player.id,
      name: `${player.first_name} ${player.second_name}`,
      webName: player.web_name,
      teamId: player.team,
      teamName: data.teams.find(t => t.id === player.team)?.name || 'Unknown',
      position: player.element_type,
      positionName: POSITION_MAP[player.element_type as keyof typeof POSITION_MAP],
      cost: player.now_cost,
      expectedPoints: parseFloat(player.form) * parseFloat(player.points_per_game),
      form: parseFloat(player.form),
      pointsPerGame: parseFloat(player.points_per_game),
      totalPoints: player.total_points,
      selectedByPercent: parseFloat(player.selected_by_percent)
    }));

    // Filter players with valid data
    const validPlayers = players.filter(p => 
      p.cost > 0 && 
      p.expectedPoints > 0 && 
      p.pointsPerGame > 0 &&
      p.form > 0
    );

    // Sort players by expected points (descending)
    const sortedPlayers = validPlayers.sort((a, b) => b.expectedPoints - a.expectedPoints);

    // Squad optimization algorithm
    const { starting_11, bench, captain, vice_captain } = optimizeSquad(sortedPlayers, formation);
    const allPlayers = [...starting_11, ...bench];

    const result: SquadResult = {
      starting_11,
      bench,
      captain,
      vice_captain,
      totalCost: allPlayers.reduce((sum, p) => sum + p.cost, 0),
      totalExpectedPoints: allPlayers.reduce((sum, p) => sum + p.expectedPoints, 0),
      formation: formation
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating squad:', error);
    return NextResponse.json(
      { error: 'Failed to generate optimal squad' },
      { status: 500 }
    );
  }
}

function optimizeSquad(players: any[], formation: string): { starting_11: OptimizedPlayer[], bench: OptimizedPlayer[], captain: OptimizedPlayer, vice_captain: OptimizedPlayer } {
  const formationConfig = FORMATIONS[formation as keyof typeof FORMATIONS];
  const squad: OptimizedPlayer[] = [];
  const teamCount: { [key: number]: number } = {};
  const positionCount: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const maxCost = 1000; // £100 million in FPL units (10 = £1m)
  let currentCost = 0;

  // Helper function to check if player can be added
  const canAddPlayer = (player: any): boolean => {
    const teamLimit = (teamCount[player.teamId] || 0) < 3;
    const positionLimit = positionCount[player.position] < formationConfig.total[player.positionName as keyof typeof formationConfig.total];
    const costLimit = currentCost + player.cost <= maxCost;
    const notAlreadySelected = !squad.some(p => p.id === player.id);
    
    return teamLimit && positionLimit && costLimit && notAlreadySelected;
  };

  // Multi-pass optimization algorithm
  // First pass: Add best players by expected points, prioritizing formation needs
  const positionPriority = [1, 2, 3, 4]; // GK, DEF, MID, FWD
  
  for (const position of positionPriority) {
    const positionName = POSITION_MAP[position as keyof typeof POSITION_MAP];
    const neededForFormation = formationConfig.total[positionName as keyof typeof formationConfig.total];
    
    // Get best players for this position
    const positionPlayers = players
      .filter(p => p.position === position)
      .sort((a, b) => b.expectedPoints - a.expectedPoints);
    
    let addedForPosition = 0;
    for (const player of positionPlayers) {
      if (canAddPlayer(player) && addedForPosition < neededForFormation) {
        squad.push(player);
        teamCount[player.teamId] = (teamCount[player.teamId] || 0) + 1;
        positionCount[player.position]++;
        currentCost += player.cost;
        addedForPosition++;
        
        if (squad.length >= 15) break;
      }
    }
    
    if (squad.length >= 15) break;
  }

  // If we still don't have 15 players, fill remaining slots
  if (squad.length < 15) {
    const cheapestPlayers = players
      .filter(p => !squad.some(s => s.id === p.id))
      .sort((a, b) => a.cost - b.cost);

    for (const player of cheapestPlayers) {
      if (canAddPlayer(player)) {
        squad.push(player);
        teamCount[player.teamId] = (teamCount[player.teamId] || 0) + 1;
        positionCount[player.position]++;
        currentCost += player.cost;
        
        if (squad.length >= 15) break;
      }
    }
  }

  // Second pass: If we have budget left, try to upgrade players within formation constraints
  if (squad.length === 15 && currentCost < maxCost) {
    const remainingBudget = maxCost - currentCost;
    
    // Try to find better players within remaining budget
    for (const player of players) {
      if (player.cost <= remainingBudget && !squad.some(p => p.id === player.id)) {
        // Find a player to replace (same position, lower expected points, within formation limits)
        const replaceIndex = squad.findIndex(s => 
          s.position === player.position && 
          s.expectedPoints < player.expectedPoints &&
          s.cost < player.cost &&
          teamCount[s.teamId] > 1 // Ensure we don't break team limits
        );
        
        if (replaceIndex !== -1) {
          const replacedPlayer = squad[replaceIndex];
          squad[replaceIndex] = player;
          teamCount[replacedPlayer.teamId]--;
          teamCount[player.teamId] = (teamCount[player.teamId] || 0) + 1;
          currentCost = currentCost - replacedPlayer.cost + player.cost;
        }
      }
    }
  }


  // Separate into starting XI and bench
  const starting_11: OptimizedPlayer[] = [];
  const bench: OptimizedPlayer[] = [];
  
  // Sort squad by expected points (descending) within each position
  const sortedSquad = squad.sort((a, b) => {
    if (a.position !== b.position) {
      return a.position - b.position;
    }
    return b.expectedPoints - a.expectedPoints;
  });

  // Select starting XI (best players by expected points)
  const startingCount: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0 };
  
  for (const player of sortedSquad) {
    const positionName = player.positionName as keyof typeof formationConfig.starting;
    if (startingCount[player.position] < formationConfig.starting[positionName]) {
      starting_11.push(player);
      startingCount[player.position]++;
    } else {
      bench.push(player);
    }
  }

  // Select Captain and Vice-Captain from starting XI
  const sortedStartingXI = starting_11.sort((a, b) => b.expectedPoints - a.expectedPoints);
  const captain = sortedStartingXI[0];
  const vice_captain = sortedStartingXI[1];

  return { starting_11, bench, captain, vice_captain };
}
