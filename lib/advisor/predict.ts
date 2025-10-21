// lib/advisor/predict.ts
import { Bootstrap, Fixture, Team } from '@/lib/fpl/types';

const BASE_XG_HOME = 1.8;  // Increased for more realistic predictions
const BASE_XG_AWAY = 1.4;  // Increased for more realistic predictions

// Team-specific multipliers based on historical performance
const TEAM_MULTIPLIERS: Record<string, { home: number; away: number }> = {
  'Arsenal': { home: 1.15, away: 1.05 },
  'Liverpool': { home: 1.2, away: 1.1 },
  'Manchester City': { home: 1.25, away: 1.15 },
  'Chelsea': { home: 1.1, away: 1.0 },
  'Tottenham': { home: 1.1, away: 1.05 },
  'Manchester United': { home: 1.05, away: 0.95 },
  'Newcastle': { home: 1.1, away: 0.9 },
  'Brighton': { home: 1.0, away: 0.95 },
  'Aston Villa': { home: 1.05, away: 0.9 },
  'West Ham': { home: 1.0, away: 0.9 },
  'Fulham': { home: 0.95, away: 0.85 },
  'Brentford': { home: 0.95, away: 0.85 },
  'Crystal Palace': { home: 0.9, away: 0.8 },
  'Everton': { home: 0.9, away: 0.8 },
  'Wolves': { home: 0.9, away: 0.8 },
  'Nottingham Forest': { home: 0.85, away: 0.75 },
  'Bournemouth': { home: 0.85, away: 0.75 },
  'Burnley': { home: 0.8, away: 0.7 },
  'Sheffield United': { home: 0.8, away: 0.7 },
  'Luton': { home: 0.8, away: 0.7 },
};

type Ratings = {
  avgAttH: number; avgAttA: number; avgDefH: number; avgDefA: number;
};

function ratings(teams: Team[]): Ratings {
  const safe = (n: number | undefined, d: number) => (typeof n === 'number' ? n : d);
  const A = teams.map(t => safe(t.strength_attack_home, 100));
  const B = teams.map(t => safe(t.strength_attack_away, 100));
  const C = teams.map(t => safe(t.strength_defence_home, 100));
  const D = teams.map(t => safe(t.strength_defence_away, 100));
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
  return { avgAttH: avg(A), avgAttA: avg(B), avgDefH: avg(C), avgDefA: avg(D) };
}

export function estimateXGForFixture(f: Fixture, boot: Bootstrap): { xgHome: number; xgAway: number } {
  const teams = boot.teams;
  const R = ratings(teams);
  const th = teams.find(t => t.id === f.team_h);
  const ta = teams.find(t => t.id === f.team_a);

  if (!th || !ta) {
    return { xgHome: 1.5, xgAway: 1.2 };
  }

  const attH = th.strength_attack_home ?? 100;
  const defA = ta.strength_defence_away ?? 100;
  const attA = ta.strength_attack_away ?? 100;
  const defH = th.strength_defence_home ?? 100;

  // Analisa kekuatan yang lebih mendalam
  const homeAttackStrength = attH / 100;
  const awayDefenseWeakness = (100 - defA) / 100;
  const awayAttackStrength = attA / 100;
  const homeDefenseWeakness = (100 - defH) / 100;

  // FDR dengan impact yang lebih besar
  const fdrH = f.team_a_difficulty ?? 3;
  const fdrA = f.team_h_difficulty ?? 3;
  
  // FDR multiplier yang lebih dramatic
  const fdrMultiplierH = fdrH <= 2 ? 1.3 : fdrH >= 4 ? 0.7 : 1.0;
  const fdrMultiplierA = fdrA <= 2 ? 1.25 : fdrA >= 4 ? 0.75 : 1.0;

  // Home advantage yang lebih realistic
  const homeAdvantage = 1.2;

  // Team quality differential
  const homeQuality = (attH + (100 - defH)) / 2;
  const awayQuality = (attA + (100 - defA)) / 2;
  const qualityDiff = (homeQuality - awayQuality) / 100;

  // Base xG dengan variasi yang lebih besar
  let xgHome = BASE_XG_HOME * homeAttackStrength * (1 + awayDefenseWeakness) * fdrMultiplierH * homeAdvantage;
  let xgAway = BASE_XG_AWAY * awayAttackStrength * (1 + homeDefenseWeakness) * fdrMultiplierA;

  // Quality differential impact
  xgHome += qualityDiff * 0.5;
  xgAway -= qualityDiff * 0.3;

  // Team-specific multipliers
  const homeMultiplier = TEAM_MULTIPLIERS[th.name]?.home ?? 1.0;
  const awayMultiplier = TEAM_MULTIPLIERS[ta.name]?.away ?? 1.0;
  
  xgHome *= homeMultiplier;
  xgAway *= awayMultiplier;

  // Add some randomness for more realistic variation (±10%)
  const randomFactorH = 0.9 + Math.random() * 0.2;
  const randomFactorA = 0.9 + Math.random() * 0.2;
  
  xgHome *= randomFactorH;
  xgAway *= randomFactorA;

  // Realistic clamping dengan range yang lebih luas
  xgHome = Math.max(0.3, Math.min(4.5, xgHome));
  xgAway = Math.max(0.3, Math.min(4.0, xgAway));

  return { xgHome: Number(xgHome.toFixed(2)), xgAway: Number(xgAway.toFixed(2)) };
}

const FACT: number[] = (() => {
  const f = [1];
  for (let i = 1; i <= 10; i++) f[i] = f[i - 1] * i;
  return f;
})();

function poissonPMF(lambda: number, k: number): number {
  return Math.exp(-lambda) * Math.pow(lambda, k) / FACT[k];
}

export function predictScoreFromXG(xgHome: number, xgAway: number): { home: number; away: number; conf: number } {
  const MAX = 7;
  let best = { h: 0, a: 0, p: 0 };
  for (let i = 0; i <= MAX; i++) {
    const ph = poissonPMF(xgHome, i);
    for (let j = 0; j <= MAX; j++) {
      const pa = poissonPMF(xgAway, j);
      const p = ph * pa;
      if (p > best.p) best = { h: i, a: j, p };
    }
  }
  return { home: best.h, away: best.a, conf: Number((best.p * 100).toFixed(1)) };
}
