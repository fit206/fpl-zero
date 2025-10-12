import { NextRequest } from 'next/server';
import { PL25_BADGE_ID, ALIASES } from '@/lib/crests/pl25-map';

const UA = { 'User-Agent': 'Mozilla/5.0' };

function fplByCode(teamCode: number, size: 70 | 50) {
  const base = 'https://fantasy.premierleague.com/dist/img/badges';
  return [
    `${base}/badge_${teamCode}-${size}.png`,
    `${base}/badge_${teamCode}_${size}.png`,
    `${base}/${teamCode}.png`,
  ];
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const searchParams = url.searchParams;
  const short = (searchParams.get('short') || '').toUpperCase(); // e.g. 'ARS'
  const teamCode = Number(searchParams.get('teamCode') || '0');  // FPL code
  const size = (Number(searchParams.get('size')) === 50 ? 50 : 70) as 70 | 50;

  const candidates: string[] = [];
  
  // Normalize short name using aliases
  const normalizedShort = ALIASES[short] || short;
  const pl25Id = PL25_BADGE_ID[normalizedShort];

  // 1) PL25 SVG badge (priority)
  if (pl25Id && pl25Id > 0) {
    candidates.push(`https://resources.premierleague.com/premierleague25/badges/${pl25Id}.svg`);
  }
  
  // 2) FPL badge by teamCode (fallback)
  if (teamCode > 0) {
    candidates.push(...fplByCode(teamCode, size));
  }

  for (const url of candidates) {
    try {
      const res = await fetch(url, { headers: UA, next: { revalidate: 86400 } });
      if (res.ok) {
        const buf = await res.arrayBuffer();
        const ct = res.headers.get('content-type') || (url.endsWith('.svg') ? 'image/svg+xml' : 'image/png');
        return new Response(buf, {
          status: 200,
          headers: {
            'Content-Type': ct,
            'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
          },
        });
      }
    } catch {}
  }

  return new Response(null, { status: 204 });
}