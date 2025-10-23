// lib/external/odds.ts
export type TeamOdds = {
  cleanSheetProb?: number; // 0..1
  atgsProb?: Map<number, number>; // playerId -> prob (optional, jika dapat)
};

const ODDS_API = 'https://api.the-odds-api.com/v4';

export async function getTeamOddsForFixtures(params: {
  fixtureKey: string; // bebas: `${homeId}-${awayId}`
  homeName: string;   // gunakan nama pendek rasmi
  awayName: string;
}[]): Promise<Map<string, TeamOdds>> {
  const key = process.env.ODDS_API_KEY;
  const out = new Map<string, TeamOdds>();
  if (!key) {
    // tanpa key, pulangkan kosong (fallback)
    params.forEach(p => out.set(p.fixtureKey, {}));
    return out;
  }

  try {
    // Panggil The Odds API untuk Premier League
    const response = await fetch(
      `${ODDS_API}/sports/soccer_epl/odds/?apiKey=${key}&regions=uk&markets=clean_sheet&oddsFormat=decimal`,
      { 
        headers: { 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 300 } // cache 5 min
      }
    );

    if (response.ok) {
      const data = await response.json();
      
      // Process odds data untuk clean sheet probabilities
      for (const bookmaker of data) {
        for (const market of bookmaker.markets) {
          if (market.key === 'clean_sheet') {
            for (const outcome of market.outcomes) {
              // Map team names dan extract clean sheet prob
              const teamName = outcome.description;
              const prob = 1 / parseFloat(outcome.price); // convert decimal odds to probability
              
              // Find matching fixture
              for (const param of params) {
                if (param.homeName.includes(teamName) || param.awayName.includes(teamName)) {
                  const existing = out.get(param.fixtureKey) || {};
                  out.set(param.fixtureKey, {
                    ...existing,
                    cleanSheetProb: prob
                  });
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.warn('Odds API error:', error);
  }

  // Fallback untuk fixtures yang tiada odds
  params.forEach(p => {
    if (!out.has(p.fixtureKey)) {
      out.set(p.fixtureKey, {});
    }
  });

  return out;
}
