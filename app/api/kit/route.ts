// app/api/kit/route.ts
import { NextRequest } from 'next/server';

const UA = { 'User-Agent': 'Mozilla/5.0' };

function buildCandidates(
  teamCode: number,
  teamId: number,
  size: 110 | 66,
  role: 'gk' | 'outfield' | 'crest'
): string[] {
  const urls: string[] = [];
  const base = 'https://fantasy.premierleague.com/dist/img/shirts/standard';
  const crest = `https://resources.premierleague.com/premierleague/badges/70/t${teamId}.png`;

  if (role === 'gk') {
    // 1) GK kit (varian _1). Cuba size diminta, kemudian 66
    if (teamCode > 0) {
      urls.push(
        `${base}/shirt_${teamCode}_1-${size}.png`,
        `${base}/shirt_${teamCode}_1-66.png`,
      );
    }
    // 2) Outfield fallback
    if (teamCode > 0) {
      urls.push(
        `${base}/shirt_${teamCode}-${size}.png`,
        `${base}/shirt_${teamCode}-66.png`,
      );
    }
    // 3) Crest fallback
    if (teamId > 0) urls.push(crest);
    return urls;
  }

  if (role === 'outfield') {
    if (teamCode > 0) {
      urls.push(
        `${base}/shirt_${teamCode}-${size}.png`,
        `${base}/shirt_${teamCode}-66.png`
      );
    }
    if (teamId > 0) urls.push(crest);
    return urls;
  }

  // role === 'crest'
  if (teamCode > 0) {
    // cuba beberapa varian FPL badges (ada musim guna - dan ada juga _)
    urls.push(
      `https://fantasy.premierleague.com/dist/img/badges/badge_${teamCode}-70.png`,
      `https://fantasy.premierleague.com/dist/img/badges/badge_${teamCode}_70.png`,
      `https://fantasy.premierleague.com/dist/img/badges/${teamCode}.png`,
      // cuba varian lain yang mungkin
      `https://fantasy.premierleague.com/dist/img/badges/badge_${teamCode}-110.png`,
      `https://fantasy.premierleague.com/dist/img/badges/badge_${teamCode}_110.png`
    );
  }
  if (teamId > 0) {
    // crest Premier League (fallback)
    urls.push(crest);
    // cuba varian lain Premier League
    urls.push(`https://resources.premierleague.com/premierleague/badges/110/t${teamId}.png`);
  }
  
  // JANGAN guna shirt sebagai fallback untuk crest - biarkan kosong jika tiada logo
  return urls;
}

export async function GET(req: NextRequest) {
  try {
    console.log('Kit API route called');
    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const teamCode = Number(searchParams.get('teamCode') || '0');
    const teamId = Number(searchParams.get('teamId') || '0');
    const roleParam = String(searchParams.get('role') || 'outfield').toLowerCase();
    const role = (roleParam === 'gk' ? 'gk' : roleParam === 'crest' ? 'crest' : 'outfield') as
      | 'gk'
      | 'outfield'
      | 'crest';
    const size = (Number(searchParams.get('size')) === 66 ? 66 : 110) as 110 | 66;

    console.log(`Kit API called: teamCode=${teamCode}, teamId=${teamId}, role=${role}, size=${size}`);

    const candidates = buildCandidates(teamCode, teamId, size, role);
    console.log(`Candidates:`, candidates);

  for (const url of candidates) {
    try {
      const res = await fetch(url, { 
        headers: UA, 
        next: { revalidate: 60 * 60 * 24 },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const buf = await res.arrayBuffer();
        const ct = res.headers.get('content-type') || 'image/png';
        return new Response(buf, {
          status: 200,
          headers: {
            'Content-Type': ct,
            'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        });
      }
    } catch (error) {
      console.log(`Failed to fetch ${url}:`, error);
      // cuba yang seterusnya
    }
  }

  // Tiada calon berjaya - return a transparent 1x1 pixel
  const transparentPixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  return new Response(transparentPixel, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
  } catch (error) {
    console.error('Kit API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

// Export all HTTP methods
export { GET as POST, GET as PUT, GET as DELETE, GET as PATCH };