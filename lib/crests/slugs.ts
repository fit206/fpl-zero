// lib/crests/slugs.ts
export function crestSlug(short?: string, name?: string): string {
  const k = (short || '').toUpperCase();
  const byShort: Record<string, string> = {
    // EPL 24/25 - teams with local files (based on actual files)
    ARS: 'arsenal',
    AVL: 'aston-villa', 
    BOU: 'bournemouth',
    BRE: 'brentford',
    BHA: 'brighton',
    CHE: 'chelsea',
    CRY: 'crystal-palace',
    EVE: 'everton',
    FUL: 'fulham',
    LEI: 'leicester-city',
    LIV: 'liverpool',
    MCI: 'manchester-city',
    MUN: 'manchester-united',
    NEW: 'newcastle-united',
    NFO: 'nottingham-forest',
    SOU: 'southampton',
    TOT: 'tottenham-hotspur',
    WHU: 'west-ham-united',
    WOL: 'wolves',
    // teams with local files but different mapping
    LEE: 'leeds-united',
    BUR: 'burnley',
    // teams without local files - use API only
    IPS: 'ipswich-town',
    SHU: 'sheffield-united',
    SUN: 'sunderland',
    WBA: 'west-bromwich-albion',
    WAT: 'watford',
    NOR: 'norwich-city',
    CAR: 'cardiff-city',
    SWA: 'swansea-city',
  };
  
  if (byShort[k]) {
    return byShort[k];
  }

  // fallback dari name → slug mudah
  const n = (name || '').toLowerCase();
  return n
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}
