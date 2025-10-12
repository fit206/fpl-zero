import { getBootstrap, getFixtures, getPicks, getEntry } from '../fpl/api';
import { 
  Bootstrap, 
  PlayerElement, 
  Fixture, 
  Team,
  PicksResponse, 
  TransferSuggestion, 
  RecommendationsResponse,
  LineupPlayer,
  Lineup,
  Pick
} from '../fpl/types';

// Helper functions
export const toPrice = (tenths: number): number => tenths / 10;

export const fdrMultiplier = (fdr: number): number => {
  const multipliers: { [key: number]: number } = {
    1: 1.15,
    2: 1.08,
    3: 1.00,
    4: 0.92,
    5: 0.85
  };
  return multipliers[fdr] || 1.00;
};

export const minutesProb = (player: PlayerElement): number => {
  if (player.status === 'a' && !player.chance_of_playing_next_round) {
    return 0.95;
  }
  if (player.chance_of_playing_next_round) {
    return player.chance_of_playing_next_round / 100;
  }
  return 0.35;
};

export const posShort = (elementType: number, elementTypes: Bootstrap['element_types']): string => {
  const type = elementTypes.find(et => et.id === elementType);
  let pos = type?.singular_name_short || 'UNK';
  
  // Fix common FPL position mapping issues
  if (pos === 'GKP' || pos === 'Goalkeeper') pos = 'GK';
  if (pos === 'Defender') pos = 'DEF';
  if (pos === 'Midfielder') pos = 'MID';
  if (pos === 'Forward') pos = 'FWD';
  
  console.log(`posShort: elementType=${elementType}, original=${type?.singular_name_short}, mapped=${pos}, type=`, type);
  return pos;
};

export const nextGwFdrs = (fixtures: Fixture[], teamId: number): number[] => {
  const teamFixtures = fixtures.filter(f => f.team_h === teamId || f.team_a === teamId);
  if (teamFixtures.length === 0) return [3];
  
  return teamFixtures.map(f => {
    if (f.team_h === teamId) return f.team_h_difficulty;
    return f.team_a_difficulty;
  });
};

export const expectedPointsForGw = (
  player: PlayerElement, 
  fixtures: Fixture[], 
  bootstrap: Bootstrap
): number => {
  const form = parseFloat(player.form);
  const pointsPerGame = parseFloat(player.points_per_game);
  
  const base = 0.55 * form + 0.45 * pointsPerGame;
  const minutesProbability = minutesProb(player);
  const fdrs = nextGwFdrs(fixtures, player.team);
  const avgFdrMultiplier = fdrs.reduce((sum, fdr) => sum + fdrMultiplier(fdr), 0) / fdrs.length;
  
  const posMult: { [key: string]: number } = {
    'GK': 1.0,
    'DEF': 1.0,
    'MID': 1.05,
    'FWD': 1.07
  };
  
  const position = posShort(player.element_type, bootstrap.element_types);
  const positionMultiplier = posMult[position] || 1.0;
  
  return base * minutesProbability * avgFdrMultiplier * positionMultiplier;
};

// Helper functions for lineup
const fullName = (player: PlayerElement): string => {
  return `${player.first_name} ${player.second_name}`;
};

// Pilih event aktif (default 'current')
function activeEventId(boot: Bootstrap, pref?: 'current' | 'next' | number): number {
  if (typeof pref === 'number') return pref;
  if (pref === 'next') return boot.events.find(e => e.is_next)?.id ?? boot.events.find(e => e.is_current)?.id ?? boot.events[0].id;
  // default 'current'
  return boot.events.find(e => e.is_current)?.id
      ?? boot.events.find(e => e.is_next)?.id
      ?? boot.events[0].id;
}

// Build opponent map dari fixtures event terpilih
function buildOppMap(fixtures: Fixture[], teams: Team[]) {
  const short = new Map<number,string>();
  const teamById = new Map<number, Team>();
  teams.forEach(t=>{
    short.set(t.id, t.short_name || t.name);
    teamById.set(t.id, t);
  });
  const map = new Map<number,{oppId:number; oppShort:string; home:boolean}[]>();
  for (const f of fixtures) {
    const hs = short.get(f.team_h) ?? 'H';
    const as = short.get(f.team_a) ?? 'A';
    const H = map.get(f.team_h) || [];
    H.push({ oppId: f.team_a, oppShort: as, home: true });
    map.set(f.team_h, H);
    const A = map.get(f.team_a) || [];
    A.push({ oppId: f.team_h, oppShort: hs, home: false });
    map.set(f.team_a, A);
  }
  return { map, teamById };
}

function opponentMapForEvent(fixtures: Fixture[], teams: Team[]): Map<number, { oppShort: string; home: boolean }[]> {
  const short = new Map<number, string>();
  teams.forEach(t => short.set(t.id, t.short_name || t.name));

  const out = new Map<number, { oppShort: string; home: boolean }[]>();
  
  // Process each fixture and assign opponents correctly
  for (const f of fixtures) {
    const homeTeamId = f.team_h;
    const awayTeamId = f.team_a;
    
    // Home team plays vs away team (home: true)
    const homeOpponents = out.get(homeTeamId) || [];
    homeOpponents.push({ 
      oppShort: short.get(awayTeamId) ?? 'OPP', 
      home: true 
    });
    out.set(homeTeamId, homeOpponents);
    
    // Away team plays vs home team (home: false)
    const awayOpponents = out.get(awayTeamId) || [];
    awayOpponents.push({ 
      oppShort: short.get(homeTeamId) ?? 'OPP', 
      home: false 
    });
    out.set(awayTeamId, awayOpponents);
  }

  return out;
}

function toLineupPlayers(
  picks: Pick[],
  elements: PlayerElement[],
  fixtures: Fixture[],
  boot: Bootstrap
): { starters: LineupPlayer[]; bench: LineupPlayer[] } {
  const byId = new Map<number, PlayerElement>();
  elements.forEach((e) => byId.set(e.id, e));

  const { map: oppMap, teamById } = buildOppMap(fixtures, boot.teams);

  const toLP = (pk: Pick): LineupPlayer | null => {
    const pl = byId.get(pk.element);
    if (!pl) return null;
    const team = teamById.get(pl.team);
    const pos = posShort(pl.element_type, boot.element_types);
    const fixturesForTeam = oppMap.get(pl.team) || [];
    const display = pl.web_name || `${pl.first_name} ${pl.second_name}`.trim();
    return {
      id: pl.id,
      name: display,
      pos: pos as 'GK' | 'DEF' | 'MID' | 'FWD',
      teamId: pl.team,
      teamCode: team?.code || pl.team, // Fallback to teamId if code is missing
      teamShort: team?.short_name || team?.name || 'T',
      position: pk.position ?? 99,
      isCaptain: Boolean(pk.is_captain),
      isVice: Boolean(pk.is_vice_captain),
      fixtures: fixturesForTeam,
    };
  };

  const startersPicks = picks
    .filter((pk) => (pk.position !== undefined ? pk.position <= 11 : (pk.multiplier ?? 0) > 0))
    .sort((a, b) => (a.position ?? 99) - (b.position ?? 99));
  const benchPicks = picks
    .filter((pk) => !(pk.position !== undefined ? pk.position <= 11 : (pk.multiplier ?? 0) > 0))
    .sort((a, b) => (a.position ?? 99) - (b.position ?? 99));

  const starters = startersPicks.map(toLP).filter(Boolean) as LineupPlayer[];
  const bench = benchPicks.map(toLP).filter(Boolean) as LineupPlayer[];

  // TIADA auto-promote GK di sini. Jika Dubravka memang starter (position<=11), dia akan keluar di XI.
  return { starters, bench };
}

export async function suggestSingleTransfers(entryId: number, opts?: { event?: 'current' | 'next' | number }): Promise<RecommendationsResponse> {
  try {
    const boot = await getBootstrap();
    
    // Untuk suggestions, guna current GW picks
    const currentEventId = boot.events.find(e => e.is_current)?.id ?? boot.events[0].id;
    
    // Untuk fixtures/lineup, guna next GW (yang akan datang)
    const fixturesEventId = opts?.event === 'next' 
      ? (boot.events.find(e => e.is_next)?.id ?? currentEventId)
      : currentEventId;

    const [fixtures, picksResp] = await Promise.all([
      getFixtures(fixturesEventId),
      getPicks(entryId, currentEventId), // Picks guna current GW
    ]);

    let entryInfo;
    try {
      entryInfo = await getEntry(entryId);
      console.log('Entry info:', entryInfo);
    } catch (error) {
      console.error('Error fetching entry info:', error);
      entryInfo = { player_name: 'Unknown', name: 'Unknown Team' };
    }

    const oppMap = opponentMapForEvent(fixtures, boot.teams);
    const bankFloat = toPrice(picksResp.entry_history.bank);

    // 3. Calculate expected points for current squad
    const squadPlayers = picksResp.picks.map(pick => 
      boot.elements.find(el => el.id === pick.element)
    ).filter((player): player is PlayerElement => player !== undefined);

    const squadEPts = new Map<number, number>();
    squadPlayers.forEach(player => {
      const ePts = expectedPointsForGw(player, fixtures, boot);
      squadEPts.set(player.id, ePts);
    });

    // 4. Get all available players (not injured)
    const availablePlayers = boot.elements.filter(player => player.status !== 'i');
    const availableEPts = new Map<number, number>();
    availablePlayers.forEach(player => {
      const ePts = expectedPointsForGw(player, fixtures, boot);
      availableEPts.set(player.id, ePts);
    });

    // 5. Calculate squad composition for 3-per-club rule
    const squadComposition = new Map<number, number>();
    squadPlayers.forEach(player => {
      const count = squadComposition.get(player.team) || 0;
      squadComposition.set(player.team, count + 1);
    });

    // 6. Generate transfer suggestions
    const suggestions: TransferSuggestion[] = [];

    squadPlayers.forEach(outPlayer => {
      const outEPts = squadEPts.get(outPlayer.id) || 0;
      const outPrice = toPrice(outPlayer.now_cost);
      const outPosition = posShort(outPlayer.element_type, boot.element_types);

      availablePlayers
        .filter(inPlayer => {
          // Same position
          if (inPlayer.element_type !== outPlayer.element_type) return false;
          
          // Not already in squad
          if (squadPlayers.some(p => p.id === inPlayer.id)) return false;
          
          // Budget constraint
          const inPrice = toPrice(inPlayer.now_cost);
          if (inPrice > bankFloat + outPrice + 0.01) return false;
          
          // 3-per-club rule (except for same-club swaps)
          if (inPlayer.team !== outPlayer.team) {
            const currentClubCount = squadComposition.get(inPlayer.team) || 0;
            if (currentClubCount >= 3) return false;
          }
          
          return true;
        })
        .forEach(inPlayer => {
          const inEPts = availableEPts.get(inPlayer.id) || 0;
          const inPrice = toPrice(inPlayer.now_cost);
          const delta = inEPts - outEPts;

          if (delta > 0) {
            suggestions.push({
              pos: outPosition,
              outId: outPlayer.id,
              outName: `${outPlayer.first_name} ${outPlayer.second_name}`,
              priceOut: outPrice,
              ePtsOut: outEPts,
              inId: inPlayer.id,
              inName: `${inPlayer.first_name} ${inPlayer.second_name}`,
              priceIn: inPrice,
              ePtsIn: inEPts,
              delta: delta
            });
          }
        });
    });

    // 7. Sort by delta and take top 3
    suggestions.sort((a, b) => b.delta - a.delta);
    const finalSuggestions = suggestions.slice(0, 3);

    // If no positive suggestions, return the best one anyway for feedback
    if (finalSuggestions.length === 0 && suggestions.length > 0) {
      suggestions.sort((a, b) => b.delta - a.delta);
      finalSuggestions.push(suggestions[0]);
    }

    // Build lineup yang guna oppMap
    const byId = new Map<number, PlayerElement>();
    boot.elements.forEach(el => byId.set(el.id, el));

    const startersPicks = picksResp.picks
      .filter(pk => (pk.position !== undefined ? pk.position <= 11 : (pk.multiplier ?? 0) > 0))
      .sort((a, b) => (a.position ?? 99) - (b.position ?? 99));

    const benchPicks = picksResp.picks
      .filter(pk => !(pk.position !== undefined ? pk.position <= 11 : (pk.multiplier ?? 0) > 0))
      .sort((a, b) => (a.position ?? 99) - (b.position ?? 99));

    const toLP = (pk: Pick): LineupPlayer | null => {
      const pl = byId.get(pk.element);
      if (!pl) return null;
      const team = boot.teams.find(t => t.id === pl.team);
      const pos = posShort(pl.element_type, boot.element_types);
      const fixturesForTeam = oppMap.get(pl.team) || [];
      const display = (pl as any).web_name || `${pl.first_name} ${pl.second_name}`.trim();
      return {
        id: pl.id,
        name: display,
        pos: pos as 'GK' | 'DEF' | 'MID' | 'FWD',
        teamId: pl.team,
        teamCode: team?.code || pl.team, // Fallback to teamId if code is missing
        teamShort: team?.short_name || team?.name || 'T',
        position: pk.position ?? 99,
        isCaptain: Boolean((pk as any).is_captain),
        isVice: Boolean((pk as any).is_vice_captain),
        fixtures: fixturesForTeam,
      };
    };

    const lineup = {
      starters: startersPicks.map(toLP).filter(Boolean) as LineupPlayer[],
      bench: benchPicks.map(toLP).filter(Boolean) as LineupPlayer[],
    };


    return {
      gw: currentEventId,
      bank: Number(bankFloat.toFixed(1)),
      suggestions: finalSuggestions,
      lineup,
      managerName: entryInfo ? entryInfo.player_name : 'Unknown Manager',
      teamName: entryInfo?.name || 'Unknown Team',
      entryId: entryId,
    };
  } catch (error) {
    console.error('Error in suggestSingleTransfers:', error);
    throw error;
  }
}
