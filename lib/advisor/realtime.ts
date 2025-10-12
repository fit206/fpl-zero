// lib/advisor/realtime.ts
import { Bootstrap, Fixture, PlayerElement } from '../fpl/types';
import { expectedPointsForGw, posShort, minutesProb, toPrice, fdrMultiplier, nextGwFdrs } from './logic';
// import { getAFPredictionsForFixtures } from '../external/apifootball';
import { getTeamOddsForFixtures } from '../external/odds';

// util kecil
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

type ProSignals = {
  teamCsProb: Map<number, number>; // teamId -> P(CS)
  teamGoalsExp: Map<number, number>; // teamId -> expected goals
};

export async function buildProSignals(fixtures: Fixture[], boot: Bootstrap): Promise<ProSignals> {
  // 1) cuba API-Football predictions
  // const afMap = await getAFPredictionsForFixtures(
  //   fixtures
  //     .filter(f => f.event !== null)
  //     .map((f, idx) => ({
  //       fixtureId: idx + 1, // placeholder jika anda tak mapkan ID ext
  //       homeName: boot.teams.find(t => t.id === f.team_h)?.short_name || '',
  //       awayName: boot.teams.find(t => t.id === f.team_a)?.short_name || '',
  //     }))
  // );
  const afMap = new Map();

  const teamCsProb = new Map<number, number>();
  const teamGoalsExp = new Map<number, number>();

  // Jika tiada API-Football, cuba odds API (placeholder)
  const oddsMap = await getTeamOddsForFixtures(
    fixtures.map(f => ({
      fixtureKey: `${f.team_h}-${f.team_a}`,
      homeName: boot.teams.find(t => t.id === f.team_h)?.short_name || '',
      awayName: boot.teams.find(t => t.id === f.team_a)?.short_name || '',
    }))
  );

  // Gabung sinyal (API-Football prioriti, kalau tak ada, guna approx dari FDR)
  for (const f of fixtures) {
    const tH = f.team_h;
    const tA = f.team_a;

    // Defaults dari FDR supaya tak kosong
    const csH_def = 1.0 - (fdrMultiplier(f.team_a_difficulty) - 0.85) / (1.15 - 0.85); // approx 0.5 tengah
    const csA_def = 1.0 - (fdrMultiplier(f.team_h_difficulty) - 0.85) / (1.15 - 0.85);

    let csH = clamp01(csH_def);
    let csA = clamp01(csA_def);
    let xgH = 1.25;
    let xgA = 1.25;

    // Guna data API-Football jika ada
    const afData = afMap.get(fixtures.indexOf(f) + 1);
    if (afData) {
      if (afData.cleanSheetProb !== undefined) csH = clamp01(afData.cleanSheetProb);
      if (afData.goalsFor !== undefined) xgH = Math.max(0.5, afData.goalsFor);
      if (afData.opp.cleanSheetProb !== undefined) csA = clamp01(afData.opp.cleanSheetProb);
      if (afData.opp.goalsFor !== undefined) xgA = Math.max(0.5, afData.opp.goalsFor);
    }

    // Override dengan odds data jika ada
    const oddsKey = `${tH}-${tA}`;
    const oddsData = oddsMap.get(oddsKey);
    if (oddsData?.cleanSheetProb !== undefined) {
      csH = clamp01(oddsData.cleanSheetProb);
    }

    teamCsProb.set(tH, csH);
    teamCsProb.set(tA, csA);
    teamGoalsExp.set(tH, xgH);
    teamGoalsExp.set(tA, xgA);
  }

  return { teamCsProb, teamGoalsExp };
}

export function expectedPointsPro(
  player: PlayerElement,
  fixtures: Fixture[],
  boot: Bootstrap,
  signals: ProSignals
): number {
  const pos = posShort(player.element_type, boot.element_types);
  const baseFormPpg = expectedPointsForGw(player, fixtures, boot); // guna baseline sedia ada

  // Minutes
  const minP = minutesProb(player);

  // Opponent factors (ambil purata jika DGW)
  const teamId = player.team;
  const fdrs = nextGwFdrs(fixtures, teamId);
  const fdrAvg = fdrs.map(fdrMultiplier).reduce((a, b) => a + b, 0) / fdrs.length;

  // Pro signals
  const csProb = signals.teamCsProb.get(teamId);
  const xg = signals.teamGoalsExp.get(teamId);

  // Tambah komponen odds
  let bonus = 0;
  if (pos === 'GK' || pos === 'DEF') {
    // CS: GK/DEF = 4 pts, MID=1, FWD=0 (kita tambah di sini untuk GK/DEF)
    if (csProb !== undefined) bonus += 4 * csProb;
  } else if (pos === 'MID') {
    // MID dapat 1pt CS
    if (csProb !== undefined) bonus += 1 * csProb;
  }

  // Attack approx dengan team xG (pembahagian sederhana ikut posisi)
  if (xg !== undefined) {
    const share =
      pos === 'FWD' ? 0.35 : pos === 'MID' ? 0.25 : pos === 'DEF' ? 0.05 : 0.02;
    // goal 4/5 pts (MID 5, FWD 4), assist ~ 3 pts (agak2 0.3x)
    const goalPts = pos === 'MID' ? 5 : pos === 'FWD' ? 4 : 6; // GK gol 6 (jarang)
    const assistPts = 3;
    const goalsExp = xg * share;
    const assistsExp = xg * (share * 0.6);
    bonus += goalsExp * goalPts + assistsExp * assistPts;
  }

  // Gabung: baseline (form+PPG+FDR+minutes) + bonus (odds)
  const pro = baseFormPpg * minP * fdrAvg + bonus * minP;
  return Number(pro.toFixed(2));
}
