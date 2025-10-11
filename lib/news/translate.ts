// lib/news/translate.ts
export type NewsTag = 'kecederaan' | 'penggantungan' | 'umum';

const DICT: Array<{ rx: RegExp; ms: string; tag?: NewsTag }> = [
  { rx: /hamstring/i, ms: 'kecederaan hamstring', tag: 'kecederaan' },
  { rx: /ankle/i, ms: 'kecederaan buku lali', tag: 'kecederaan' },
  { rx: /thigh/i, ms: 'kecederaan paha', tag: 'kecederaan' },
  { rx: /calf/i, ms: 'kecederaan betis', tag: 'kecederaan' },
  { rx: /groin/i, ms: 'kecederaan pangkal paha', tag: 'kecederaan' },
  { rx: /knee/i, ms: 'kecederaan lutut', tag: 'kecederaan' },
  { rx: /back/i, ms: 'sakit belakang', tag: 'kecederaan' },
  { rx: /shoulder/i, ms: 'kecederaan bahu', tag: 'kecederaan' },
  { rx: /hip/i, ms: 'kecederaan pinggul', tag: 'kecederaan' },
  { rx: /illness/i, ms: 'sakit (illness)', tag: 'kecederaan' },
  { rx: /virus|flu/i, ms: 'jangkitan/flu', tag: 'kecederaan' },
  { rx: /knock/i, ms: 'kecederaan ringan (knock)', tag: 'kecederaan' },
  { rx: /suspend/i, ms: 'digantung', tag: 'penggantungan' },
  { rx: /concussion/i, ms: 'gegaran', tag: 'kecederaan' },
  { rx: /personal/i, ms: 'sebab peribadi', tag: 'umum' },
  { rx: /international duty/i, ms: 'tugas antarabangsa', tag: 'umum' },
  { rx: /available/i, ms: 'boleh diturunkan', tag: 'umum' },
  { rx: /doubtful|doubt/i, ms: 'diragui', tag: 'umum' },
  { rx: /expected back|return/i, ms: 'dijangka kembali', tag: 'umum' },
];

export function translateToMs(raw: string): { text: string; tag: NewsTag } {
  let tag: NewsTag = 'umum';
  let replaced = raw;

  for (const d of DICT) {
    if (d.rx.test(raw)) {
      replaced = replaced.replace(d.rx, d.ms);
      if (d.tag) tag = d.tag;
    }
  }
  // kecilkan ayat-ayat teknikal Inggeris yang tertinggal
  replaced = replaced
    .replace(/Unavailable/i, 'tidak tersedia')
    .replace(/No return date/i, 'tarikh kembali tidak diketahui')
    .replace(/\s+/g, ' ')
    .trim();

  return { text: replaced, tag };
}

export function msChance(chance: number | null | undefined): string | null {
  if (chance === null || chance === undefined) return null;
  if (chance >= 95) return 'Peluang bermain sangat tinggi';
  if (chance >= 75) return 'Peluang bermain tinggi';
  if (chance >= 50) return 'Peluang bermain 50-50';
  if (chance >= 25) return 'Peluang bermain rendah';
  return 'Peluang bermain sangat rendah';
}

export function severityFrom(chance: number | null | undefined, status: string): 'tinggi'|'sederhana'|'rendah' {
  if (status === 'i') return 'tinggi';
  if (chance !== null && chance !== undefined) {
    if (chance <= 25) return 'tinggi';
    if (chance <= 50) return 'sederhana';
  }
  return 'rendah';
}
