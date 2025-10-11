// Premier League 25 badges mapping
// URL format: https://resources.premierleague.com/premierleague25/badges/{id}.svg

export const PL25_BADGE_MAPPING: Record<number, string> = {
  // Arsenal
  1: 'https://resources.premierleague.com/premierleague25/badges/3.svg',
  // Aston Villa  
  2: 'https://resources.premierleague.com/premierleague25/badges/7.svg',
  // Bournemouth
  3: 'https://resources.premierleague.com/premierleague25/badges/91.svg',
  // Brentford
  4: 'https://resources.premierleague.com/premierleague25/badges/94.svg',
  // Brighton
  5: 'https://resources.premierleague.com/premierleague25/badges/36.svg',
  // Chelsea
  6: 'https://resources.premierleague.com/premierleague25/badges/8.svg',
  // Crystal Palace
  7: 'https://resources.premierleague.com/premierleague25/badges/31.svg',
  // Everton
  8: 'https://resources.premierleague.com/premierleague25/badges/11.svg',
  // Fulham
  9: 'https://resources.premierleague.com/premierleague25/badges/54.svg',
  // Liverpool
  10: 'https://resources.premierleague.com/premierleague25/badges/14.svg',
  // Luton
  11: 'https://resources.premierleague.com/premierleague25/badges/17.svg', // Using Nott'm Forest as placeholder
  // Man City
  12: 'https://resources.premierleague.com/premierleague25/badges/43.svg',
  // Man Utd
  13: 'https://resources.premierleague.com/premierleague25/badges/1.svg',
  // Newcastle
  14: 'https://resources.premierleague.com/premierleague25/badges/4.svg',
  // Nott'm Forest
  15: 'https://resources.premierleague.com/premierleague25/badges/17.svg',
  // Sheffield Utd
  16: 'https://resources.premierleague.com/premierleague25/badges/17.svg', // Using Nott'm Forest as placeholder
  // Spurs
  17: 'https://resources.premierleague.com/premierleague25/badges/6.svg',
  // West Ham
  18: 'https://resources.premierleague.com/premierleague25/badges/21.svg',
  // Wolves
  19: 'https://resources.premierleague.com/premierleague25/badges/39.svg',
  // Burnley
  20: 'https://resources.premierleague.com/premierleague25/badges/90.svg',
};

// Fallback untuk team yang tidak ada dalam mapping
export const FALLBACK_BADGE = '/crests/fallback.svg';
