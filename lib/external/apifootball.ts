// lib/external/apifootball.ts
const APIFOOTBALL_KEY = process.env.APIFOOTBALL_KEY;
const UA = { 'User-Agent': 'Mozilla/5.0' };

// Cache for team ID mapping
const teamIdCache = new Map<string, number>();
const teamSignalsCache = new Map<number, TeamSignals>();

export type TeamSignals = {
  gfAvgHome: number;
  gfAvgAway: number;
  gaAvgHome: number;
  gaAvgAway: number;
  formScore: number; // 0..1 from last 6 matches
  yellowPerMatch: number;
  redPerMatch: number;
  missing: {
    att: number;
    mid: number;
    def: number;
    gk: number;
    suspendedAtt: number;
    suspendedMid: number;
    suspendedDef: number;
  };
};

export async function getTeamIdByName(name: string): Promise<number | null> {
  if (!APIFOOTBALL_KEY) return null;
  
  // Check cache first
  if (teamIdCache.has(name)) {
    return teamIdCache.get(name) || null;
  }

  try {
    const url = `https://v3.football.api-sports.io/teams?search=${encodeURIComponent(name)}&league=39&season=2024`;
    const res = await fetch(url, {
      headers: { ...UA, 'X-RapidAPI-Key': APIFOOTBALL_KEY },
      next: { revalidate: 3600 } // 1 hour cache
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    const team = data.response?.[0]?.team;
    if (team?.id) {
      teamIdCache.set(name, team.id);
      return team.id;
    }
  } catch (error) {
    console.error('API-Football team search error:', error);
  }
  
  return null;
}

export async function getTeamSignals(teamId: number): Promise<TeamSignals | null> {
  if (!APIFOOTBALL_KEY) return null;
  
  // Check cache first
  if (teamSignalsCache.has(teamId)) {
    return teamSignalsCache.get(teamId) || null;
  }

  try {
    // Get team statistics
    const statsUrl = `https://v3.football.api-sports.io/teams/statistics?team=${teamId}&league=39&season=2024`;
    const statsRes = await fetch(statsUrl, {
      headers: { ...UA, 'X-RapidAPI-Key': APIFOOTBALL_KEY },
      next: { revalidate: 1800 } // 30 min cache
    });
    
    // Get injuries/suspensions
    const injuriesUrl = `https://v3.football.api-sports.io/injuries?team=${teamId}&league=39&season=2024`;
    const injuriesRes = await fetch(injuriesUrl, {
      headers: { ...UA, 'X-RapidAPI-Key': APIFOOTBALL_KEY },
      next: { revalidate: 600 } // 10 min cache
    });

    if (!statsRes.ok) return null;

    const statsData = await statsRes.json();
    const stats = statsData.response?.[0]?.statistics;
    
    if (!stats) return null;

    // Calculate averages
    const matches = stats.fixtures?.played?.total || 1;
    const gfAvgHome = (stats.goals?.for?.average?.home || 0);
    const gfAvgAway = (stats.goals?.for?.average?.away || 0);
    const gaAvgHome = (stats.goals?.against?.average?.home || 0);
    const gaAvgAway = (stats.goals?.against?.average?.away || 0);

    // Form calculation from last 6 matches
    const form = stats.form || '';
    const formScore = calculateFormScore(form);

    // Discipline stats
    const yellowPerMatch = (stats.cards?.yellow?.total || 0) / matches;
    const redPerMatch = (stats.cards?.red?.total || 0) / matches;

    // Injuries/suspensions
    let missing = {
      att: 0, mid: 0, def: 0, gk: 0,
      suspendedAtt: 0, suspendedMid: 0, suspendedDef: 0
    };

    if (injuriesRes.ok) {
      const injuriesData = await injuriesRes.json();
      const injuries = injuriesData.response || [];
      
      for (const injury of injuries) {
        const player = injury.player;
        const type = injury.type;
        const position = getPlayerPosition(player?.position);
        
        if (type === 'Injury') {
          if (position === 'att') missing.att++;
          else if (position === 'mid') missing.mid++;
          else if (position === 'def') missing.def++;
          else if (position === 'gk') missing.gk++;
        } else if (type === 'Suspension') {
          if (position === 'att') missing.suspendedAtt++;
          else if (position === 'mid') missing.suspendedMid++;
          else if (position === 'def') missing.suspendedDef++;
        }
      }
    }

    const signals: TeamSignals = {
      gfAvgHome,
      gfAvgAway,
      gaAvgHome,
      gaAvgAway,
      formScore,
      yellowPerMatch,
      redPerMatch,
      missing
    };

    teamSignalsCache.set(teamId, signals);
    return signals;
    
  } catch (error) {
    console.error('API-Football signals error:', error);
    return null;
  }
}

function calculateFormScore(form: string): number {
  if (!form) return 0.5;
  
  const last6 = form.slice(-6);
  let score = 0;
  
  for (const result of last6) {
    if (result === 'W') score += 3;
    else if (result === 'D') score += 1;
    // L = 0 points
  }
  
  return Math.min(1, Math.max(0, score / 18)); // Normalize to 0..1
}

function getPlayerPosition(position: string): 'att' | 'mid' | 'def' | 'gk' {
  if (!position) return 'mid';
  
  const pos = position.toLowerCase();
  if (pos.includes('goalkeeper') || pos.includes('gk')) return 'gk';
  if (pos.includes('defender') || pos.includes('def')) return 'def';
  if (pos.includes('forward') || pos.includes('attacker') || pos.includes('att')) return 'att';
  return 'mid';
}