// app/api/news/expand/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  console.log('News expand API: START - API called');
  console.log('News expand API: URL=', req.url);
  
  try {
    const url = new URL(req.url);
    const playerId = Number(url.searchParams.get('playerId') || '0');
    const teamId = Number(url.searchParams.get('teamId') || '0');
    
    console.log('News expand API: playerId=', playerId, 'teamId=', teamId);

    // Import FPL API functions
    const { getBootstrap, getFixtures } = await import('@/lib/fpl/api');
    const boot = await getBootstrap();
    const eventId = boot.events.find(e => e.is_current)?.id ?? boot.events.find(e => e.is_next)?.id ?? boot.events[0].id;
    const fixtures = await getFixtures(eventId);

    const teamsIdx = new Map();
    boot.teams.forEach(t => teamsIdx.set(t.id, t));

    // CASE A: player-based explanation
    if (playerId > 0) {
      const p = boot.elements.find(e => e.id === playerId);
      if (!p) return NextResponse.json({ paragraphs: ['Pemain tidak ditemui.'] }, { status: 200 });

      const team = teamsIdx.get(p.team);
      const teamShort = team?.short_name || team?.name || 'Team';
      const pos = boot.element_types.find(et => et.id === p.element_type)?.singular_name_short || 'Player';

      // Find next fixture
      const f = fixtures.find(x => x.team_h === p.team || x.team_a === p.team) || null;
      let oppShort = 'OPP', home = true;
      if (f) {
        oppShort = f.team_h === p.team ? (teamsIdx.get(f.team_a)?.short_name || 'OPP') : (teamsIdx.get(f.team_h)?.short_name || 'OPP');
        home = f.team_h === p.team;
      }

      // Build paragraphs
      const paragraphs: string[] = [];
      
      // Basic player info
      paragraphs.push(`${p.web_name} (${pos}) dari ${teamShort}.`);
      
      // Status info
      if (p.status !== 'a') {
        paragraphs.push(`Status: ${p.status === 'i' ? 'Cedera' : p.status === 'd' ? 'Diragui' : 'Tidak tersedia'}.`);
      }
      
      // News info
      if (p.news && p.news.trim()) {
        paragraphs.push(`Berita terkini: ${p.news}`);
      }
      
      // Next fixture
      if (f) {
        paragraphs.push(`Perlawanan seterusnya: ${teamShort} menentang ${oppShort} (${home ? 'H' : 'A'}).`);
      }
      
      // Discipline info
      const yc = Number(p.yellow_cards || 0);
      const rc = Number(p.red_cards || 0);
      if (yc > 0 || rc > 0) {
        const discInfo = [];
        if (rc > 0) discInfo.push(`${rc} kad merah`);
        if (yc > 0) discInfo.push(`${yc} kad kuning`);
        paragraphs.push(`Disiplin: ${discInfo.join(', ')}.`);
      }

      console.log('News expand API: returning player paragraphs:', paragraphs);
      return NextResponse.json({ paragraphs }, { status: 200 });
    }

    // CASE B: team-based explanation
    if (teamId > 0) {
      const team = teamsIdx.get(teamId);
      if (!team) return NextResponse.json({ paragraphs: ['Pasukan tidak ditemui.'] }, { status: 200 });

      const teamShort = team.short_name || team.name;
      const paragraphs: string[] = [];
      
      // Basic team info
      paragraphs.push(`Maklumat pasukan: ${teamShort}.`);

      // Find next fixture
      const f = fixtures.find(x => x.team_h === teamId || x.team_a === teamId);
      if (f) {
        const oppShort = f.team_h === teamId ? (teamsIdx.get(f.team_a)?.short_name || 'OPP') : (teamsIdx.get(f.team_h)?.short_name || 'OPP');
        const home = f.team_h === teamId;
        paragraphs.push(`Perlawanan seterusnya: ${teamShort} menentang ${oppShort} (${home ? 'H' : 'A'}).`);
      }

      console.log('News expand API: returning team paragraphs:', paragraphs);
      return NextResponse.json({ paragraphs }, { status: 200 });
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