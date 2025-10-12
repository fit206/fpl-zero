// Premier League 25 badges mapping
// URL format: https://resources.premierleague.com/premierleague25/badges/{id}.svg

export const PL25_BADGE_MAPPING: Record<number, string> = {
  // Arsenal (id: 1)
  1: 'https://resources.premierleague.com/premierleague25/badges/3.svg',
  // Aston Villa (id: 2)
  2: 'https://resources.premierleague.com/premierleague25/badges/7.svg',
  // Burnley (id: 3)
  3: 'https://resources.premierleague.com/premierleague25/badges/90.svg',
  // Bournemouth (id: 4)
  4: 'https://resources.premierleague.com/premierleague25/badges/91.svg',
  // Brentford (id: 5)
  5: 'https://resources.premierleague.com/premierleague25/badges/94.svg',
  // Brighton (id: 6)
  6: 'https://resources.premierleague.com/premierleague25/badges/36.svg',
  // Chelsea (id: 7)
  7: 'https://resources.premierleague.com/premierleague25/badges/8.svg',
  // Crystal Palace (id: 8)
  8: 'https://resources.premierleague.com/premierleague25/badges/31.svg',
  // Everton (id: 9)
  9: 'https://resources.premierleague.com/premierleague25/badges/11.svg',
  // Fulham (id: 10)
  10: 'https://resources.premierleague.com/premierleague25/badges/54.svg',
  // Leeds (id: 11)
  11: 'https://resources.premierleague.com/premierleague25/badges/2.svg',
  // Liverpool (id: 12)
  12: 'https://resources.premierleague.com/premierleague25/badges/14.svg',
  // Man City (id: 13)
  13: 'https://resources.premierleague.com/premierleague25/badges/43.svg',
  // Man Utd (id: 14)
  14: 'https://resources.premierleague.com/premierleague25/badges/1.svg',
  // Newcastle (id: 15)
  15: 'https://resources.premierleague.com/premierleague25/badges/4.svg',
  // Nott'm Forest (id: 16)
  16: 'https://resources.premierleague.com/premierleague25/badges/17.svg',
  // Sunderland (id: 17)
  17: 'https://resources.premierleague.com/premierleague25/badges/56.svg',
  // Spurs (id: 18)
  18: 'https://resources.premierleague.com/premierleague25/badges/6.svg',
  // West Ham (id: 19)
  19: 'https://resources.premierleague.com/premierleague25/badges/21.svg',
  // Wolves (id: 20)
  20: 'https://resources.premierleague.com/premierleague25/badges/39.svg',
};

// Fallback untuk team yang tidak ada dalam mapping
export const FALLBACK_BADGE = '/crests/fallback.svg';
