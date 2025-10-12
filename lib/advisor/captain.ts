// lib/advisor/captain.ts
import { getBootstrap, getFixtures, getPicks } from '@/lib/fpl/api';
import type { Bootstrap, Fixture, Pick, PlayerElement, Team } from '@/lib/fpl/types';
import { expectedPointsForGw, minutesProb, posShort } from '@/lib/advisor/logic';

type CaptainCandidate = {
  id: number;
  name: string;
  pos: 'GK'|'DEF'|'MID'|'FWD';
  teamId: number;
  teamShort: string;
  opponent: string;
  minutesP: number;
  baseEpts: number;
  smartEpts: number;
  captainPts: number;
  confidence: number;
  reasons: string[];
};

function activeEventId(boot: Bootstrap, pref?: 'current'|'next'|number): number {
  console.log('activeEventId: pref:', pref);
  console.log('activeEventId: events:', boot.events.map(e => ({ id: e.id, is_current: e.is_current, is_next: e.is_next })));
  
  if (typeof pref === 'number') return pref;
  if (pref === 'next') return boot.events.find(e=>e.is_next)?.id ?? boot.events.find(e=>e.is_current)?.id ?? boot.events[0].id;
  const currentId = boot.events.find(e=>e.is_current)?.id
      ?? boot.events.find(e=>e.is_next)?.id
      ?? boot.events[0].id;
  console.log('activeEventId: selected current ID:', currentId);
  return currentId;
}

function buildOppMap(fixtures: Fixture[], teams: Team[]) {
  const short = new Map<number,string>();
  teams.forEach(t=>short.set(t.id, t.short_name || t.name));
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
  return map;
}

const toNum = (v: unknown, def = 0) => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? n : def;
};

function xgi90Of(p: PlayerElement): number {
  const xgi = toNum(p.expected_goal_involvements_per_90);
  if (xgi) return xgi;
  const xg = toNum(p.expected_goals_per_90);
  const xa = toNum(p.expected_assists_per_90);
  if (xg || xa) return xg + xa;
  const ppg = toNum(p.points_per_game);
  return ppg / 6; // fallback kasar bila data xGI tiada
}

function teamXgiSum(boot: Bootstrap, teamId: number): number {
  let sum = 0;
  for (const el of boot.elements) if (el.team === teamId) sum += xgi90Of(el);
  return sum || 1;
}

function goalWeight(p: PlayerElement): number {
  const xg = toNum(p.expected_goals_per_90);
  const xa = toNum(p.expected_assists_per_90);
  if (xg + xa > 0) return xg / (xg + xa);
  return p.element_type === 4 ? 0.7 : p.element_type === 3 ? 0.55 : 0.35;
}

function goalPts(pos: 'GK'|'DEF'|'MID'|'FWD'): number {
  if (pos === 'FWD') return 4;
  if (pos === 'MID') return 5;
  if (pos === 'DEF') return 6;
  return 6;
}
function csPtsPer(pos: 'GK'|'DEF'|'MID'|'FWD'): number {
  if (pos === 'GK' || pos === 'DEF') return 4;
  if (pos === 'MID') return 1;
  return 0;
}

function disciplineMultiplier(p: PlayerElement): number {
  const mins = toNum(p.minutes);
  if (!mins) return 1;
  const yc = toNum(p.yellow_cards);
  const rc = toNum(p.red_cards);
  const yc90 = (yc / mins) * 90;
  const rc90 = (rc / mins) * 90;
  const drop = Math.min(0.08, yc90 * 0.03 + rc90 * 0.4);
  return 1 - drop;
}

async function tryGetPicks(entryId: number, eventId: number) {
  try {
    return await getPicks(entryId, eventId);
  } catch (e: any) {
    if ((e as any)?.code === 'NOT_FOUND' || /404/.test(String(e?.message))) return null;
    throw e; // error lain biar meletup untuk ditangani route
  }
}

async function getPicksWithFallback(entryId: number, boot: Bootstrap, pref?: 'current'|'next'|number) {
  const current = boot.events.find(e => e.is_current) || null;
  const next = boot.events.find(e => e.is_next) || null;

  // susunan keutamaan
  const order: number[] = [];
  if (typeof pref === 'number') order.push(pref);
  else if (pref === 'next' && next) order.push(next.id);
  else if (current) order.push(current.id);

  if (next && !order.includes(next.id)) order.push(next.id);

  // kemudian cuba sejarah (GW besar → kecil)
  const desc = [...boot.events].sort((a, b) => b.id - a.id).map(e => e.id);
  for (const id of desc) if (!order.includes(id)) order.push(id);

  for (const id of order) {
    const resp = await tryGetPicks(entryId, id);
    if (resp) {
      let source: 'current'|'next'|'history'|'requested' = 'history';
      if (typeof pref === 'number' && id === pref) source = 'requested';
      else if (current && id === current.id) source = 'current';
      else if (next && id === next.id) source = 'next';
      return { eventId: id, picks: resp, source };
    }
  }
  return null;
}

export async function suggestCaptain(entryId: number, opts?: { event?: 'current'|'next'|number }) {
  const boot = await getBootstrap();
  const picked = await getPicksWithFallback(entryId, boot, opts?.event ?? 'current');
  if (!picked) {
    // tiada langsung picks untuk mana-mana GW
    throw Object.assign(new Error('Tiada data picks untuk mana-mana GW bagi Team ID ini.'), { code: 'NOT_FOUND' });
  }
  const eventId = picked.eventId;
  const picksResp = picked.picks;

  // Parallel fetch fixtures untuk speed
  const fixtures = await getFixtures(eventId);
  console.log('Captain advisor: Data loaded');

  if (!fixtures || !Array.isArray(fixtures)) {
    throw new Error('Tiada data fixtures untuk gameweek ini.');
  }

  if (!picksResp || !picksResp.picks || !Array.isArray(picksResp.picks)) {
    throw new Error('Tiada data picks untuk team ini. Pastikan team ID betul dan ada data untuk gameweek ini.');
  }

  const starters: Pick[] = picksResp.picks
    .filter(pk => (pk.position !== undefined ? pk.position <= 11 : (pk.multiplier ?? 0) > 0))
    .sort((a,b) => (a.position ?? 99) - (b.position ?? 99));

  if (starters.length === 0) {
    throw new Error('Tiada starting XI untuk team ini. Pastikan team ada picks untuk gameweek ini.');
  }

  const byId = new Map<number, PlayerElement>();
  boot.elements.forEach(e => byId.set(e.id, e));

  const teams = new Map<number, Team>();
  boot.teams.forEach(t => teams.set(t.id, t));

  const oppMap = buildOppMap(fixtures, boot.teams);

  const candidates: CaptainCandidate[] = [];

  for (const pk of starters) {
    const p = byId.get(pk.element);
    if (!p) continue;

    const team = teams.get(p.team);
    if (!team) continue;

    const pos = posShort(p.element_type, boot.element_types);
    const minP = minutesProb(p);

    const opps = oppMap.get(p.team) || [];
    const first = opps[0]; // guna fixture terawal untuk label/λ
    const oppShort = first ? first.oppShort : 'OPP';
    const home = first ? first.home : true;
    const oppId = first ? first.oppId : -1;

    // Cari fixture lengkap (homeId, awayId)
    let fForTeam: Fixture | undefined;
    if (first) {
      fForTeam = fixtures.find(f =>
        (first.home && f.team_h === p.team && f.team_a === oppId) ||
        (!first.home && f.team_a === p.team && f.team_h === oppId)
      );
    }
    if (!fForTeam) {
      // fallback: apa sahaja fixture pasukan ini dalam GW
      fForTeam = fixtures.find(f => f.team_h === p.team || f.team_a === p.team);
    }

    // Ambil lambdas dengan fallback neutral (skip smart predict untuk speed)
    let lamTeam = 1.25;
    let lamOpp = 1.15;
    let conf = 55;

    // Skip smart predictions untuk speed - guna fallback values
    // Smart predictions terlalu lambat untuk captain advisor

    const csProbTeam = Math.exp(-lamOpp);

    const base = expectedPointsForGw(p, fixtures, boot);

    const teamSum = teamXgiSum(boot, p.team);
    const share = Math.min(0.5, xgi90Of(p) / teamSum);
    const wG = goalWeight(p);

    const invPts = (lamTeam * share) * (wG * goalPts(pos as 'GK' | 'DEF' | 'MID' | 'FWD') + (1 - wG) * 3);
    const cleanSheetPts = csPtsPer(pos as 'GK' | 'DEF' | 'MID' | 'FWD') * csProbTeam;

    const penDisc = disciplineMultiplier(p);

    const smartE = (0.5 * base + 0.45 * invPts + 0.05 * cleanSheetPts) * penDisc * minP;
    const capPts = 2 * smartE;
    const label = `${oppShort} (${home ? 'H' : 'A'})`;

    const reasons: string[] = [];
    reasons.push(`vs ${label}`);
    reasons.push(`Team λ: ${lamTeam.toFixed(2)}, Opp λ: ${lamOpp.toFixed(2)}, CS ${(csProbTeam*100).toFixed(1)}%`);
    reasons.push(`xGI/90 share ${(share*100).toFixed(1)}% (goal bias ${(wG*100).toFixed(0)}%)`);
    reasons.push(`Minutes ${(minP*100).toFixed(0)}%`);
    if (penDisc < 0.98) reasons.push(`Disiplin −${(100 - penDisc*100).toFixed(0)}%`);

    candidates.push({
      id: p.id,
      name: p.web_name || `${p.first_name} ${p.second_name}`.trim(),
      pos: pos as 'GK' | 'DEF' | 'MID' | 'FWD',
      teamId: p.team,
      teamShort: team.short_name || team.name,
      opponent: label,
      minutesP: Number(minP.toFixed(2)),
      baseEpts: Number(base.toFixed(2)),
      smartEpts: Number(smartE.toFixed(2)),
      captainPts: Number(capPts.toFixed(2)),
      confidence: Number((Math.min(95, Math.max(40, conf * (0.6 + 0.4 * minP)))).toFixed(1)),
      reasons,
    });
  }

  candidates.sort((a,b)=> b.captainPts - a.captainPts);
  return { gw: eventId, source: picked.source, suggestions: candidates.slice(0, 4) };
}