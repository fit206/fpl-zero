// app/api/news/expand/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBootstrap, getFixtures } from '@/lib/fpl/api';
import type { Bootstrap, PlayerElement, Team } from '@/lib/fpl/types';

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const playerId = Number(searchParams.get('playerId') || '0');
    const teamId = Number(searchParams.get('teamId') || '0');
    
    console.log('News expand API: playerId=', playerId, 'teamId=', teamId);

    const boot = await getBootstrap();
    const eventId = activeEventId(boot);
    const fixtures = await getFixtures(eventId);

    const teamsIdx = new Map<number, Team>();
    boot.teams.forEach(t => teamsIdx.set(t.id, t));

    // CASE A: player-based explanation
    if (playerId > 0) {
      const p = boot.elements.find(e => e.id === playerId);
      if (!p) return NextResponse.json({ paragraphs: ['Pemain tidak ditemui.'] }, { status: 200 });

      const team = teamsIdx.get(p.team);
      const teamShort = team?.short_name || team?.name || 'Team';
      const pos = posShort(p.element_type, boot.element_types);

      // Find next fixture
      const f = fixtures.find(x => x.team_h === p.team || x.team_a === p.team) || null;
      let oppShort = 'OPP', home = true;
      if (f) {
        const homeTeam = teamsIdx.get(f.team_h);
        const awayTeam = teamsIdx.get(f.team_a);
        oppShort = f.team_h === p.team ? (teamsIdx.get(f.team_a)?.short_name || 'OPP') : (teamsIdx.get(f.team_h)?.short_name || 'OPP');
        home = f.team_h === p.team;
      }

      // Build paragraphs
      const paras: string[] = [];
      
      // Basic player info
      paras.push(`${p.web_name} (${pos}) dari ${teamShort}.`);
      
      // Status info
      if (p.status !== 'a') {
        paras.push(`Status: ${p.status === 'i' ? 'Cedera' : p.status === 'd' ? 'Diragui' : 'Tidak tersedia'}.`);
      }
      
      // News info
      if (p.news && p.news.trim()) {
        paras.push(`Berita terkini: ${p.news}`);
      }
      
      // Next fixture
      if (f) {
        paras.push(`Perlawanan seterusnya: ${teamShort} menentang ${oppShort} (${home ? 'H' : 'A'}).`);
      }
      
      // Discipline info
      const yc = Number(p.yellow_cards || 0);
      const rc = Number(p.red_cards || 0);
      if (yc > 0 || rc > 0) {
        const discInfo = [];
        if (rc > 0) discInfo.push(`${rc} kad merah`);
        if (yc > 0) discInfo.push(`${yc} kad kuning`);
        paras.push(`Disiplin: ${discInfo.join(', ')}.`);
      }

      return NextResponse.json({ paragraphs: paras }, { status: 200 });
    }

    // CASE B: team-based explanation
    if (teamId > 0) {
      const team = teamsIdx.get(teamId);
      if (!team) return NextResponse.json({ paragraphs: ['Pasukan tidak ditemui.'] }, { status: 200 });

      const teamShort = team.short_name || team.name;
      const paras: string[] = [];
      
      paras.push(`Maklumat pasukan: ${teamShort}.`);
      
      // Find next fixture
      const f = fixtures.find(x => x.team_h === teamId || x.team_a === teamId);
      if (f) {
        const homeTeam = teamsIdx.get(f.team_h);
        const awayTeam = teamsIdx.get(f.team_a);
        const oppShort = f.team_h === teamId ? (teamsIdx.get(f.team_a)?.short_name || 'OPP') : (teamsIdx.get(f.team_h)?.short_name || 'OPP');
        const home = f.team_h === teamId;
        paras.push(`Perlawanan seterusnya: ${teamShort} menentang ${oppShort} (${home ? 'H' : 'A'}).`);
      }

      return NextResponse.json({ paragraphs: paras }, { status: 200 });
    }

    return NextResponse.json({ paragraphs: ['Tiada konteks yang dihantar.'] }, { status: 200 });
  } catch (e) {
    console.error('API /news/expand error', e);
    return NextResponse.json({ 
      paragraphs: [
        'Gagal memuat penerangan lanjut.',
        'Sila cuba lagi dalam beberapa minit.',
        'Jika masalah berterusan, sila hubungi support.'
      ] 
    }, { status: 200 });
  }
}