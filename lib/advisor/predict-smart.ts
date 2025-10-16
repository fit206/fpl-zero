// lib/advisor/predict-smart.ts
import type { Bootstrap, Fixture, Team } from '@/lib/fpl/types';
import { getTeamSignals } from '@/lib/external/apifootball';

const BASE_HOME = 1.45;
const BASE_AWAY = 1.15;

const FACT: number[] = (() => { const f = [1]; for (let i = 1; i <= 10; i++) f[i] = f[i - 1] * i; return f; })();
const pmf = (lam: number, k: number) => Math.exp(-lam) * Math.pow(lam, k) / FACT[k];

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

function confFromLambdas(lh: number, la: number) {
  let best = { h: 0, a: 0, p: 0 };
  for (let i = 0; i <= 7; i++) {
    const ph = pmf(lh, i);
    for (let j = 0; j <= 7; j++) {
      const pa = pmf(la, j);
      const p = ph * pa;
      if (p > best.p) best = { h: i, a: j, p };
    }
  }
  return { score: { home: best.h, away: best.a }, conf: Number((best.p * 100).toFixed(1)) };
}

// NEW: strength fallback (bezakan pasukan jika API-Football gagal)
function leagueAvg(boot: Bootstrap, key: keyof Team, def = 100) {
  const arr = boot.teams.map(t => (typeof t[key] === 'number' ? (t[key] as number) : def));
  return arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
}
function rel(val: number | undefined, avg: number, def = 100) {
  const v = typeof val === 'number' ? val : def;
  return avg ? v / avg : 1;
}
function strengthFactors(boot: Bootstrap, t: Team) {
  const aH = leagueAvg(boot, 'strength_attack_home');
  const aA = leagueAvg(boot, 'strength_attack_away');
  const dH = leagueAvg(boot, 'strength_defence_home');
  const dA = leagueAvg(boot, 'strength_defence_away');
  return {
    attHomeR: rel(t.strength_attack_home, aH),
    attAwayR: rel(t.strength_attack_away, aA),
    defHomeR: rel(t.strength_defence_home, dH),
    defAwayR: rel(t.strength_defence_away, dA),
  };
}

type SmartInputs = { home: Team; away: Team; boot: Bootstrap };

// Berat/weights
const W = {
  homeAdv: 0.08,
  formImpact: 0.10,
  injuryAtt: 0.07,
  injuryDef: 0.07,
  disciplineMax: 0.06,
};

export async function predictSmart({ home, away, boot }: SmartInputs) {
  const [sigH, sigA] = await Promise.all([getTeamSignals(home.id), getTeamSignals(away.id)]);

  // NEW: bina base berbeza walau tanpa API menggunakan strength FPL
  const sfH = strengthFactors(boot, home);
  const sfA = strengthFactors(boot, away);

  // Jika ada API signals, guna GF/GA; kalau tiada, guna strength ratio
  const baseGFH = sigH ? sigH.gfAvgHome : BASE_HOME * sfH.attHomeR;
  const baseGFA = sigA ? sigA.gfAvgAway : BASE_AWAY * sfA.attAwayR;
  const baseGAH = sigH ? sigH.gaAvgHome : BASE_AWAY * (1 / sfH.defHomeR);
  const baseGAA = sigA ? sigA.gaAvgAway : BASE_HOME * (1 / sfA.defAwayR);

  // Mulakan lambdas
  let lamH = BASE_HOME * baseGFH * (1.2 - clamp(baseGAA / 2.0, 0.6, 1.6));
  let lamA = BASE_AWAY * baseGFA * (1.2 - clamp(baseGAH / 2.0, 0.6, 1.6));

  // Home advantage
  lamH *= 1 + W.homeAdv;

  // Form (kalau ada)
  if (sigH) lamH *= 1 + W.formImpact * (sigH.formScore - 0.5) * 2;
  if (sigA) lamA *= 1 + W.formImpact * (sigA.formScore - 0.5) * 2;

  // Injuries/susp
  if (sigH) {
    const offMiss = sigH.missing.att + sigH.missing.mid + sigH.missing.suspendedAtt + sigH.missing.suspendedMid * 1.2;
    lamH *= 1 - Math.min(0.35, offMiss * W.injuryAtt);
  }
  if (sigA) {
    const offMissA = sigA.missing.att + sigA.missing.mid + sigA.missing.suspendedAtt + sigA.missing.suspendedMid * 1.2;
    lamA *= 1 - Math.min(0.35, offMissA * W.injuryAtt);
  }
  // Def missing lawan
  if (sigA) {
    const defMissA = sigA.missing.def + sigA.missing.gk + sigA.missing.suspendedDef * 1.2;
    lamH *= 1 + Math.min(0.35, defMissA * W.injuryDef);
  }
  if (sigH) {
    const defMissH = sigH.missing.def + sigH.missing.gk + sigH.missing.suspendedDef * 1.2;
    lamA *= 1 + Math.min(0.35, defMissH * W.injuryDef);
  }
  // Disiplin
  if (sigH) {
    const d = clamp((sigH.yellowPerMatch * 0.05 + sigH.redPerMatch * 0.6), 0, 1);
    lamH *= 1 - Math.min(W.disciplineMax, d);
  }
  if (sigA) {
    const d = clamp((sigA.yellowPerMatch * 0.05 + sigA.redPerMatch * 0.6), 0, 1);
    lamA *= 1 - Math.min(W.disciplineMax, d);
  }

  // Clamp + rescale
  lamH = clamp(lamH, 0.2, 3.2);
  lamA = clamp(lamA, 0.2, 3.0);
  const target = 2.75;
  const scale = clamp(target / (lamH + lamA), 0.85, 1.15);
  lamH *= scale; lamA *= scale;

  const { score, conf } = confFromLambdas(lamH, lamA);
  return {
    lambdas: { home: Number(lamH.toFixed(2)), away: Number(lamA.toFixed(2)) },
    score,
    conf,
    signalsUsed: Boolean(sigH && sigA),
  };
}