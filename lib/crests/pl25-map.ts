// Peta short_name (FPL) → PL25 badge id (number)
// Isikan id PL25 (https://resources.premierleague.com/premierleague25/badges/{id}.svg)
// Jika 0, UI akan fallback ke crest FPL (badge_{team_code}.png)
export const PL25_BADGE_ID: Record<string, number> = {
  ARS: 3,   // Arsenal
  LIV: 14,  // Liverpool
  TOT: 6,   // Tottenham Hotspur
  BOU: 91,  // AFC Bournemouth
  MCI: 43,  // Manchester City
  CRY: 31,  // Crystal Palace
  CHE: 8,   // Chelsea
  EVE: 11,  // Everton
  SUN: 56,  // Sunderland
  MUN: 1,   // Manchester United
  NEW: 4,   // Newcastle United
  BHA: 36,  // Brighton & Hove Albion
  AVL: 7,   // Aston Villa
  FUL: 54,  // Fulham
  LEE: 2,   // Leeds United
  BRE: 94,  // Brentford
  NFO: 17,  // Nottingham Forest
  BUR: 90,  // Burnley
  WHU: 21,  // West Ham United
  WOL: 39,  // Wolverhampton Wanderers
  // Current season teams (2024/25)
  IPS: 0,   // Ipswich Town - fallback to FPL
  LEI: 0,   // Leicester City - fallback to FPL  
  SOU: 0,   // Southampton - fallback to FPL
};

// Sinonim UI → normalise kepada short_name FPL musim baru
export const ALIASES: Record<string, string> = {
  'MAN UTD': 'MUN',
  'MAN CITY': 'MCI',
  SPURS: 'TOT',
  "NOTT'M FOREST": 'NFO',
  'NOTTM FOREST': 'NFO',
  'WEST HAM': 'WHU',
  WOLVES: 'WOL',
  BRIGHTON: 'BHA',
  NEWCASTLE: 'NEW',
  SUNDERLAND: 'SUN',
  LEEDS: 'LEE',
  BURNLEY: 'BUR',
  IPSWICH: 'IPS',
  LEICESTER: 'LEI',
  SOUTHAMPTON: 'SOU',
};
