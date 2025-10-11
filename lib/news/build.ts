// lib/news/build.ts
import { Bootstrap, PlayerElement, Team } from '@/lib/fpl/types';
import { translateToMs, msChance, severityFrom, NewsTag } from './translate';

export type NewsItem =
  | {
      kind: 'player';
      ts: string; // ISO
      playerId: number;
      playerCode: number; // FPL player code untuk headshot
      name: string;
      teamId: number;
      teamCode?: number; // FPL team code untuk crest
      teamShort: string;
      pos: 'GK'|'DEF'|'MID'|'FWD';
      headline: string;
      detail: string | null;
      tag: NewsTag;
      severity: 'tinggi'|'sederhana'|'rendah';
      category: 'kecederaan'|'form'|'harga'|'ownership'|'disiplin';
    }
  | {
      kind: 'discipline';
      ts: string;
      playerId: number;
      playerCode: number; // FPL player code untuk headshot
      name: string;
      teamId: number;
      teamCode?: number; // FPL team code untuk crest
      teamShort: string;
      ycs: number;
      headline: string;
      detail: string | null;
      tag: 'penggantungan';
      severity: 'sederhana'|'rendah';
      category: 'disiplin';
    }
  | {
      kind: 'team';
      ts: string;
      teamId: number;
      teamCode?: number; // FPL team code untuk crest
      teamShort: string;
      injured: number;
      doubtful: number;
      headline: string;
      detail: string | null;
      tag: 'umum';
      severity: 'rendah';
      category: 'kecederaan';
    };

function posShort(element_type: number, element_types: { id:number; singular_name_short:string }[]): 'GK'|'DEF'|'MID'|'FWD' {
  const et = element_types.find(e=>e.id===element_type)?.singular_name_short || '';
  const v = et.toUpperCase();
  if (v==='GK'||v==='DEF'||v==='MID'||v==='FWD') return v as any;
  return (element_type===1?'GK':element_type===2?'DEF':element_type===3?'MID':'FWD');
}

export async function buildNews(boot: Bootstrap, sinceHours = 1, teamFilter?: number): Promise<NewsItem[]> {
  const now = Date.now();
  const cutoff = now - sinceHours * 60 * 60 * 1000;

  const teamIdx = new Map<number, Team>();
  boot.teams.forEach(t => teamIdx.set(t.id, t));

  const items: NewsItem[] = [];

  // 1) Player news dari elements[].news (FPL official) - hanya yang benar-benar terkini
  for (const p of boot.elements) {
    if (teamFilter && p.team !== teamFilter) continue;

    const t = teamIdx.get(p.team);
    const teamShort = t?.short_name || t?.name || 'TEAM';
    const ts = p.news_added ? Date.parse(p.news_added) : 0;

    // Hanya tunjukkan jika ada news yang benar-benar baru dan relevan
    if (p.news && ts && ts >= cutoff) {
      const { text, tag } = translateToMs(p.news);
      const chanceText = msChance(p.chance_of_playing_next_round);
      const sev = severityFrom(p.chance_of_playing_next_round, p.status);
      const detail = chanceText ? `${chanceText}.` : null;

      // Hanya tunjukkan jika status pemain menunjukkan masalah AKTIF (injured, doubtful, suspended)
      // DAN berita benar-benar baru (dalam 3 jam lepas)
      if ((p.status === 'i' || p.status === 'd' || p.status === 's' || 
          (p.chance_of_playing_next_round !== null && p.chance_of_playing_next_round < 75)) &&
          ts >= cutoff) {
        items.push({
          kind: 'player',
          ts: new Date(ts).toISOString(),
          playerId: p.id,
          playerCode: p.code, // FPL player code untuk headshot
          name: p.web_name || `${p.first_name} ${p.second_name}`.trim(),
          teamId: p.team,
          teamCode: t?.code,
          teamShort,
          pos: posShort(p.element_type, boot.element_types),
          headline: text,
          detail,
          tag,
          severity: sev,
          category: 'kecederaan',
        });
      }
    }
  }

  // 2) Discipline risk (kad kuning terkumpul) – hanya yang kritikal dan terkini
  for (const p of boot.elements) {
    if (teamFilter && p.team !== teamFilter) continue;
    const y = p.yellow_cards ?? 0;
    const r = p.red_cards ?? 0;
    
    // Hanya tunjukkan jika ada kad merah (sangat kritikal) DAN status suspended
    if (r > 0 && p.status === 's') {
      const t = teamIdx.get(p.team);
      const teamShort = t?.short_name || t?.name || 'TEAM';
      items.push({
        kind: 'discipline',
        ts: new Date(now).toISOString(),
        playerId: p.id,
        playerCode: p.code,
        name: p.web_name || `${p.first_name} ${p.second_name}`.trim(),
        teamId: p.team,
        teamCode: t?.code,
        teamShort,
        ycs: y,
        headline: 'Dikenakan kad merah baru-baru ini',
        detail: 'Berpotensi penggantungan mengikut peraturan liga.',
        tag: 'penggantungan',
        severity: 'sederhana',
        category: 'disiplin',
      });
    }
    // Hanya tunjukkan jika sangat hampir dengan ambang (4 atau 9 kad kuning) DAN status normal
    else if ((y === 4 || y === 9) && p.status === 'a') {
      const t = teamIdx.get(p.team);
      const teamShort = t?.short_name || t?.name || 'TEAM';
      const ambang = y === 4 ? 5 : 10;
      items.push({
        kind: 'discipline',
        ts: new Date(now).toISOString(),
        playerId: p.id,
        playerCode: p.code,
        name: p.web_name || `${p.first_name} ${p.second_name}`.trim(),
        teamId: p.team,
        teamCode: t?.code,
        teamShort,
        ycs: y,
        headline: `Amaran disiplin: ${y} kad kuning`,
        detail: `Satu lagi kad kuning → penggantungan (ambang ${ambang}).`,
        tag: 'penggantungan',
        severity: 'rendah',
        category: 'disiplin',
      });
    }
  }

  // 3) Berita pemain dengan status terkini (tanpa news_added)
  for (const p of boot.elements) {
    if (teamFilter && p.team !== teamFilter) continue;
    
    const t = teamIdx.get(p.team);
    const teamShort = t?.short_name || t?.name || 'TEAM';
    
    // Pemain yang baru injured (tanpa news_added)
    if (p.status === 'i' && !p.news) {
      items.push({
        kind: 'player',
        ts: new Date(now).toISOString(),
        playerId: p.id,
        playerCode: p.code,
        name: p.web_name || `${p.first_name} ${p.second_name}`.trim(),
        teamId: p.team,
        teamCode: t?.code,
        teamShort,
        pos: posShort(p.element_type, boot.element_types),
        headline: 'Pemain mengalami kecederaan',
        detail: p.chance_of_playing_next_round ? `Peluang bermain: ${p.chance_of_playing_next_round}%` : 'Status kecederaan tidak diketahui',
        tag: 'kecederaan',
        severity: 'tinggi',
        category: 'kecederaan',
      });
    }
    
    // Pemain yang doubtful (tanpa news_added)
    else if (p.status === 'd' && !p.news) {
      items.push({
        kind: 'player',
        ts: new Date(now).toISOString(),
        playerId: p.id,
        playerCode: p.code,
        name: p.web_name || `${p.first_name} ${p.second_name}`.trim(),
        teamId: p.team,
        teamCode: t?.code,
        teamShort,
        pos: posShort(p.element_type, boot.element_types),
        headline: 'Pemain diragui untuk perlawanan seterusnya',
        detail: p.chance_of_playing_next_round ? `Peluang bermain: ${p.chance_of_playing_next_round}%` : 'Status diragui',
        tag: 'kecederaan',
        severity: 'sederhana',
        category: 'kecederaan',
      });
    }
    
    // Pemain yang suspended (tanpa news_added)
    else if (p.status === 's' && !p.news) {
      items.push({
        kind: 'player',
        ts: new Date(now).toISOString(),
        playerId: p.id,
        playerCode: p.code,
        name: p.web_name || `${p.first_name} ${p.second_name}`.trim(),
        teamId: p.team,
        teamCode: t?.code,
        teamShort,
        pos: posShort(p.element_type, boot.element_types),
        headline: 'Pemain digantung',
        detail: 'Pemain tidak boleh bermain untuk perlawanan seterusnya',
        tag: 'penggantungan',
        severity: 'tinggi',
        category: 'disiplin',
      });
    }
  }

  // 4) Ringkasan kelab (kecederaan/diragui)
  const stateByTeam = new Map<number, { injured: number; doubtful: number }>();
  for (const p of boot.elements) {
    if (teamFilter && p.team !== teamFilter) continue;
    const s = stateByTeam.get(p.team) || { injured: 0, doubtful: 0 };
    if (p.status === 'i') s.injured += 1;
    else if (p.chance_of_playing_next_round !== null && p.chance_of_playing_next_round < 75) s.doubtful += 1;
    stateByTeam.set(p.team, s);
  }
  for (const [teamId, st] of Array.from(stateByTeam.entries())) {
    // Hanya tunjukkan jika ada kecederaan yang signifikan (3+ injured atau 5+ doubtful)
    if (st.injured < 3 && st.doubtful < 5) continue;
    const t = teamIdx.get(teamId);
    const teamShort = t?.short_name || t?.name || 'TEAM';
    items.push({
      kind: 'team',
      ts: new Date(now).toISOString(),
      teamId,
      teamCode: t?.code,
      teamShort,
      injured: st.injured,
      doubtful: st.doubtful,
      headline: `Ringkasan kecederaan ${teamShort}`,
      detail: `${st.injured} pemain injured, ${st.doubtful} diragui.`,
      tag: 'umum',
      severity: 'rendah',
      category: 'kecederaan',
    });
  }

  // 5) Berita form dan prestasi terkini
  for (const p of boot.elements) {
    if (teamFilter && p.team !== teamFilter) continue;
    
    const t = teamIdx.get(p.team);
    const teamShort = t?.short_name || t?.name || 'TEAM';
    
    // Pemain dengan form yang sangat baik (5+ points dalam 3 perlawanan terakhir)
    if (p.form && parseFloat(p.form) >= 5.0) {
      items.push({
        kind: 'player',
        ts: new Date(now).toISOString(),
        playerId: p.id,
        playerCode: p.code,
        name: p.web_name || `${p.first_name} ${p.second_name}`.trim(),
        teamId: p.team,
        teamCode: t?.code,
        teamShort,
        pos: posShort(p.element_type, boot.element_types),
        headline: 'Pemain dalam form cemerlang',
        detail: `Form terkini: ${p.form} mata dalam 3 perlawanan terakhir`,
        tag: 'umum',
        severity: 'rendah',
        category: 'form',
      });
    }
    
    // Pemain dengan form yang sangat buruk (1.0 atau kurang)
    else if (p.form && parseFloat(p.form) <= 1.0) {
      items.push({
        kind: 'player',
        ts: new Date(now).toISOString(),
        playerId: p.id,
        playerCode: p.code,
        name: p.web_name || `${p.first_name} ${p.second_name}`.trim(),
        teamId: p.team,
        teamCode: t?.code,
        teamShort,
        pos: posShort(p.element_type, boot.element_types),
        headline: 'Pemain dalam form yang lemah',
        detail: `Form terkini: ${p.form} mata dalam 3 perlawanan terakhir`,
        tag: 'umum',
        severity: 'rendah',
        category: 'form',
      });
    }
  }


  // 6) Berita ownership dan populariti
  for (const p of boot.elements) {
    if (teamFilter && p.team !== teamFilter) continue;
    
    const t = teamIdx.get(p.team);
    const teamShort = t?.short_name || t?.name || 'TEAM';
    
    // Pemain dengan ownership yang sangat tinggi (50%+)
    if (p.selected_by_percent && parseFloat(p.selected_by_percent) >= 50.0) {
      items.push({
        kind: 'player',
        ts: new Date(now).toISOString(),
        playerId: p.id,
        playerCode: p.code,
        name: p.web_name || `${p.first_name} ${p.second_name}`.trim(),
        teamId: p.team,
        teamCode: t?.code,
        teamShort,
        pos: posShort(p.element_type, boot.element_types),
        headline: 'Pemain sangat popular di FPL',
        detail: `Dimiliki oleh ${p.selected_by_percent}% manager FPL`,
        tag: 'umum',
        severity: 'rendah',
        category: 'ownership',
      });
    }
    
    // Pemain dengan ownership yang sangat rendah (1% atau kurang)
    else if (p.selected_by_percent && parseFloat(p.selected_by_percent) <= 1.0) {
      items.push({
        kind: 'player',
        ts: new Date(now).toISOString(),
        playerId: p.id,
        playerCode: p.code,
        name: p.web_name || `${p.first_name} ${p.second_name}`.trim(),
        teamId: p.team,
        teamCode: t?.code,
        teamShort,
        pos: posShort(p.element_type, boot.element_types),
        headline: 'Pemain kurang popular di FPL',
        detail: `Hanya dimiliki oleh ${p.selected_by_percent}% manager FPL`,
        tag: 'umum',
        severity: 'rendah',
        category: 'ownership',
      });
    }
  }


  // Sort terbaru dahulu
  items.sort((a,b)=> Date.parse(b.ts) - Date.parse(a.ts));
  return items;
}
