// app/api/news/expand/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBootstrap, getFixtures } from '@/lib/fpl/api';
import type { Bootstrap, PlayerElement, Team } from '@/lib/fpl/types';
import { predictSmart } from '@/lib/advisor/predict-smart';
import { translateToMs, msChance, severityFrom } from '@/lib/news/translate';

const UA = { 'User-Agent': 'Mozilla/5.0' };

function activeEventId(boot: Bootstrap, pref?: 'current'|'next'|number) {
  if (typeof pref === 'number') return pref;
  if (pref === 'next') return boot.events.find(e=>e.is_next)?.id ?? boot.events.find(e=>e.is_current)?.id ?? boot.events[0].id;
  return boot.events.find(e=>e.is_current)?.id ?? boot.events.find(e=>e.is_next)?.id ?? boot.events[0].id;
}

function posShort(element_type: number, element_types: { id:number; singular_name_short:string }[]): 'GK'|'DEF'|'MID'|'FWD' {
  const et = element_types.find(e=>e.id===element_type)?.singular_name_short || '';
  const v = et.toUpperCase();
  if (v==='GK'||v==='DEF'||v==='MID'||v==='FWD') return v as any;
  return (element_type===1?'GK':element_type===2?'DEF':element_type===3?'MID':'FWD');
}

type PlayerSummary = {
  minutes: number; apps: number;
  goals: number; assists: number;
  xg: number; xa: number; xgi: number;
};

async function getPlayerSummary(playerId: number): Promise<PlayerSummary | null> {
  const url = `https://fantasy.premierleague.com/api/element-summary/${playerId}/`;
  try {
    const res = await fetch(url, { headers: UA, next: { revalidate: 600 } });
    if (!res.ok) return null;
    const json = await res.json() as any;
    const hist: any[] = Array.isArray(json?.history) ? json.history.slice(-5) : [];
    if (!hist.length) return null;

    let minutes = 0, goals = 0, assists = 0, xg = 0, xa = 0;
    for (const h of hist) {
      minutes += Number(h.minutes || 0);
      goals += Number(h.goals_scored || 0);
      assists += Number(h.assists || 0);
      xg += parseFloat(String(h.expected_goals || 0));
      xa += parseFloat(String(h.expected_assists || 0));
    }
    const apps = hist.length;
    return { minutes, apps, goals, assists, xg, xa, xgi: xg + xa };
  } catch {
    return null;
  }
}

function listNames(arr: string[], max = 6): string {
  const a = arr.slice(0, max);
  if (arr.length > max) return a.join(', ') + ` dan ${arr.length - max} lagi`;
  return a.join(', ');
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const playerId = Number(searchParams.get('playerId') || '0');
    const teamId = Number(searchParams.get('teamId') || '0');
    const eventParam = searchParams.get('event') as ('current'|'next'|string|number)|null;

    const boot = await getBootstrap();
    const eventId = activeEventId(boot, eventParam === 'next' ? 'next' : eventParam === 'current' ? 'current' : undefined);
    const fixtures = await getFixtures(eventId);

    const teamsIdx = new Map<number, Team>();
    boot.teams.forEach(t => teamsIdx.set(t.id, t));

    // CASE A: player-based explanation
    if (playerId > 0) {
      const p = boot.elements.find(e => e.id === playerId);
      if (!p) return NextResponse.json({ paragraphs: ['Pemain tidak ditemui.'] }, { status: 200 });

      const team = teamsIdx.get(p.team);
      const teamShort = team?.short_name || team?.name || 'Team';
      const chanceText = msChance(p.chance_of_playing_next_round);
      const sev = severityFrom(p.chance_of_playing_next_round, p.status);
      const pos = posShort(p.element_type, boot.element_types);

      // opponent (fixture terawal)
      const f = fixtures.find(x => x.team_h === p.team || x.team_a === p.team) || null;
      let oppShort = 'OPP', home = true, lamTeam = 1.25, lamOpp = 1.15, csPct = 0;
      if (f) {
        const homeTeam = teamsIdx.get(f.team_h);
        const awayTeam = teamsIdx.get(f.team_a);
        oppShort = f.team_h === p.team ? (teamsIdx.get(f.team_a)?.short_name || 'OPP') : (teamsIdx.get(f.team_h)?.short_name || 'OPP');
        home = f.team_h === p.team;
        if (homeTeam && awayTeam) {
          try {
            const smart = await predictSmart({ home: homeTeam, away: awayTeam, boot });
            lamTeam = home ? smart.lambdas.home : smart.lambdas.away;
            lamOpp  = home ? smart.lambdas.away : smart.lambdas.home;
            csPct = Math.exp(-lamOpp) * 100;
          } catch {}
        }
      }

      // Form terakhir (5 game)
      const sum = await getPlayerSummary(playerId);

      // News FPL BM (jika ada)
      const news = p.news ? translateToMs(p.news).text : null;

      // Discipline ringkas
      const yc = Number(p.yellow_cards || 0);
      const rc = Number(p.red_cards || 0);
      const discExtra = yc === 4 ? 'Satu lagi kad kuning → gantung 1 perlawanan (ambang 5).' :
                         yc === 9 ? 'Satu lagi kad kuning → gantung 2 perlawanan (ambang 10).' : null;

      // Check suspension status for next gameweek
      let suspensionStatus = '';
      if (rc > 0) {
        suspensionStatus = ' — DIGANTUNG untuk gameweek akan datang kerana kad merah.';
      } else if (yc >= 5 && yc < 10) {
        suspensionStatus = ' — DIGANTUNG untuk gameweek akan datang kerana 5+ kad kuning.';
      } else if (yc >= 10) {
        suspensionStatus = ' — DIGANTUNG untuk gameweek akan datang kerana 10+ kad kuning.';
      } else if (yc === 4) {
        suspensionStatus = ' — RISIKO GANTUNG: satu lagi kad kuning akan menyebabkan gantungan 1 gameweek.';
      } else if (yc === 9) {
        suspensionStatus = ' — RISIKO GANTUNG: satu lagi kad kuning akan menyebabkan gantungan 2 gameweek.';
      }

      const paras: string[] = [];

      if (news) paras.push(`Kemas kini FPL: ${news}${chanceText ? ` — ${chanceText}.` : ''}`);
      else if (chanceText) paras.push(chanceText + '.');

      if (sum) {
        const mpg = sum.apps ? (sum.minutes / sum.apps) : 0;
        const xgi90 = sum.minutes ? (sum.xgi / sum.minutes) * 90 : 0;
        paras.push(
          `Prestasi ${sum.apps} perlawanan terakhir: purata ${mpg.toFixed(0)} minit/pertandingan, ` +
          `${sum.goals} gol, ${sum.assists} bantuan gol; xGI ${sum.xgi.toFixed(2)} (xG ${sum.xg.toFixed(2)}, xA ${sum.xa.toFixed(2)}), ` +
          `xGI/90 ${xgi90.toFixed(2)}.`
        );
      } else {
        paras.push('Data prestasi terhad untuk pemain ini pada 5 perlawanan terakhir.');
      }

      paras.push(
        `Perlawanan seterusnya: ${teamShort} menentang ${oppShort} (${home ? 'H' : 'A'}). ` +
        `Model menjangka gol jangkaan pasukan ${teamShort} ≈ ${lamTeam.toFixed(2)} dan lawan ≈ ${lamOpp.toFixed(2)}; ` +
        `peluang clean sheet ≈ ${csPct.toFixed(1)}%.`
      );

      // Enhanced discipline information with suspension status
      if (rc > 0) {
        paras.push(`Disiplin: ${yc} kad kuning, ${rc} kad merah — berpotensi digantung mengikut keputusan FA.${suspensionStatus}`);
      } else {
        paras.push(`Disiplin: ${yc} kad kuning.${discExtra ? ' ' + discExtra : ''}${suspensionStatus}`);
      }

      paras.push(`Kedudukan: ${pos}.`);
      if (sev === 'tinggi') paras.push('Amaran: risiko ketersediaan tinggi — pantau perkembangan sehingga dekat tarikh perlawanan.');

      return NextResponse.json({ paragraphs: paras }, { status: 200 });
    }

    // CASE B: team-based explanation
    if (teamId > 0) {
      const team = teamsIdx.get(teamId);
      if (!team) return NextResponse.json({ paragraphs: ['Kelab tidak ditemui.'] }, { status: 200 });

      const teamShort = team.short_name || team.name;

      // Senarai pemain injured/diragui/suspended
      const injured: string[] = [];
      const doubtful: string[] = [];
      const suspended: string[] = [];
      const atRisk: string[] = [];
      
      for (const el of boot.elements) {
        if (el.team !== teamId) continue;
        const yc = Number(el.yellow_cards || 0);
        const rc = Number(el.red_cards || 0);
        const playerName = el.web_name || `${el.first_name} ${el.second_name}`.trim();
        
        if (el.status === 'i') {
          injured.push(playerName);
        } else if (el.chance_of_playing_next_round !== null && el.chance_of_playing_next_round < 75) {
          doubtful.push(playerName);
        }
        
        // Check suspension status
        if (rc > 0) {
          suspended.push(`${playerName} (${rc} kad merah)`);
        } else if (yc >= 5 && yc < 10) {
          suspended.push(`${playerName} (${yc} kad kuning)`);
        } else if (yc >= 10) {
          suspended.push(`${playerName} (${yc} kad kuning)`);
        } else if (yc === 4) {
          atRisk.push(`${playerName} (${yc} kad kuning - 1 lagi = gantung)`);
        } else if (yc === 9) {
          atRisk.push(`${playerName} (${yc} kad kuning - 1 lagi = gantung 2 GW)`);
        }
      }

      // Opponent coming
      const f = fixtures.find(x => x.team_h === teamId || x.team_a === teamId) || null;
      let oppShort = 'OPP', home = true, lamTeam = 1.25, lamOpp = 1.15, csPct = 0;
      if (f) {
        const homeTeam = teamsIdx.get(f.team_h);
        const awayTeam = teamsIdx.get(f.team_a);
        oppShort = f.team_h === teamId ? (teamsIdx.get(f.team_a)?.short_name || 'OPP') : (teamsIdx.get(f.team_h)?.short_name || 'OPP');
        home = f.team_h === teamId;
        if (homeTeam && awayTeam) {
          try {
            const smart = await predictSmart({ home: homeTeam, away: awayTeam, boot });
            lamTeam = home ? smart.lambdas.home : smart.lambdas.away;
            lamOpp  = home ? smart.lambdas.away : smart.lambdas.home;
            csPct   = Math.exp(-lamOpp) * 100;
          } catch {}
        }
      }

      const paras: string[] = [];
      
      // Squad status summary
      const totalIssues = injured.length + doubtful.length + suspended.length;
      if (totalIssues > 0) {
        const statusParts = [];
        if (injured.length) statusParts.push(`${injured.length} injured`);
        if (doubtful.length) statusParts.push(`${doubtful.length} diragui`);
        if (suspended.length) statusParts.push(`${suspended.length} digantung`);
        
        paras.push(`Keadaan skuad ${teamShort}: ${statusParts.join(', ')}.`);
        
        if (injured.length) paras.push(`Injured: ${listNames(injured)}.`);
        if (doubtful.length) paras.push(`Diragui: ${listNames(doubtful)}.`);
        if (suspended.length) paras.push(`Digantung: ${listNames(suspended)}.`);
        if (atRisk.length) paras.push(`Risiko gantung: ${listNames(atRisk)}.`);
      } else {
        paras.push(`Tiada kecederaan atau masalah disiplin besar dilaporkan untuk ${teamShort} setakat ini.`);
      }

      paras.push(
        `Perlawanan seterusnya: ${teamShort} menentang ${oppShort} (${home ? 'H' : 'A'}). ` +
        `Jangkaan gol: ${lamTeam.toFixed(2)} untuk ${teamShort}, ${lamOpp.toFixed(2)} untuk lawan; ` +
        `peluang clean sheet ≈ ${csPct.toFixed(1)}%.`
      );

      return NextResponse.json({ paragraphs: paras }, { status: 200 });
    }

    return NextResponse.json({ paragraphs: ['Tiada konteks yang dihantar.'] }, { status: 200 });
  } catch (e) {
    console.error('API /news/expand error', e);
    return NextResponse.json({ paragraphs: ['Gagal memuat penerangan lanjut.'] }, { status: 200 });
  }
}
