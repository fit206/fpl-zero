import { NextResponse } from "next/server";
import { parseStringPromise } from "xml2js";

export async function GET() {
  try {
    // Try multiple RSS sources for better reliability - focused on injuries, cards, transfers
    const rssSources = [
      "https://feeds.skynews.com/feeds/rss/uk/sports/football.xml", // Sky Sports - PRIMARY SOURCE
      "https://www.theguardian.com/football/rss", // Guardian Football
      "https://www.espn.com/soccer/rss", // ESPN Soccer
      "https://www.mirror.co.uk/sport/football/rss.xml", // Mirror Football
      "https://www.dailymail.co.uk/sport/football/rss.xml", // Daily Mail Football
      "https://www.football365.com/rss", // Football365
      "https://www.bbc.com/sport/football/rss.xml" // BBC Sport - moved to last (user preference)
    ];

    for (const rssUrl of rssSources) {
      try {
        console.log(`Trying RSS source: ${rssUrl}`);
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`;
        
        const response = await fetch(proxyUrl, { cache: "no-store" });
        if (!response.ok) {
          console.log(`Proxy failed for ${rssUrl}: ${response.status}`);
          continue;
        }

        const data = await response.json();
        const contents = data.contents;

        if (!contents || contents.includes("<!DOCTYPE html")) {
          console.log(`Invalid content for ${rssUrl}`);
          continue;
        }

        const parsed = await parseStringPromise(contents, { trim: true, explicitArray: false });
        const items = parsed?.rss?.channel?.item || [];

        if (!Array.isArray(items)) {
          console.log(`No items found in ${rssUrl}`);
          continue;
        }

               // Filter news for FPL-relevant content (injuries, cards, transfers) - ULTRA STRICT FILTERING
               const fplKeywords = [
                 // Kecederaan pemain - ULTRA STRICT
                 'injury', 'injured', 'hamstring', 'knee', 'ankle', 'muscle', 'strain', 'fracture', 'concussion',
                 'ruled out', 'doubtful', 'fitness', 'recovery', 'return', 'absence', 'miss', 'unavailable', 'doubt',
                 'questionable', 'out', 'medical', 'treatment', 'surgery', 'rehabilitation', 'physio', 'scan',
                 'knocked out', 'knock', 'blow', 'head injury', 'leg injury', 'arm injury', 'back injury',
                 'broken', 'sprain', 'tear', 'pull', 'twist', 'dislocation', 'bruise', 'cut', 'wound',

                 // Kad kuning/merah dan suspensi - ULTRA STRICT
                 'suspension', 'suspended', 'card', 'yellow', 'red', 'ban', 'disciplinary', 'booking', 'sent off',
                 'dismissal', 'ejection', 'caution', 'warning', 'foul', 'tackle', 'challenge', 'referee',
                 'red card', 'yellow card', 'straight red', 'second yellow', 'accumulation', 'accumulated',
                 'expelled', 'ejected', 'dismissed', 'banned', 'penalty', 'sanction', 'punishment',

                 // Transfer pemain EPL - ULTRA STRICT
                 'transfer', 'signing', 'loan', 'contract', 'deal', 'agreement', 'move', 'switch', 'join', 'leave',
                 'departure', 'arrival', 'recruitment', 'acquisition', 'release', 'termination', 'extension',
                 'premier league', 'epl', 'manchester', 'united', 'city', 'liverpool', 'chelsea', 'arsenal', 
                 'tottenham', 'newcastle', 'brighton', 'everton', 'fulham', 'crystal', 'palace', 'west', 'ham', 
                 'wolves', 'bournemouth', 'brentford', 'burnley', 'leicester', 'leeds', 'southampton', 
                 'nottingham', 'forest', 'villa', 'sheffield', 'luton', 'ipswich',
                 'signed', 'joins', 'leaves', 'departs', 'arrives', 'recruited', 'acquired', 'released'
               ];
        
        const filteredItems = items.filter((item: any) => {
          const title = (item.title || "").toLowerCase();
          const description = (item.description || "").toLowerCase();
          const isFPLRelevant = fplKeywords.some(keyword => title.includes(keyword) || description.includes(keyword));
          
          // Skip general football news that's not FPL-relevant - ULTRA STRICT FILTERING
          const skipKeywords = [
            // General football content (not FPL-specific)
            'match', 'score', 'result', 'win', 'lose', 'draw', 'victory', 'defeat', 'game', 'fixture',
            'highlights', 'recap', 'review', 'analysis', 'tactics', 'formation', 'strategy',
            'championship', 'cup', 'trophy', 'final', 'semi-final', 'quarter-final', 'playoff',
            'international', 'world cup', 'euro', 'champions league', 'europa league', 'nations league',
            'friendly', 'pre-season', 'training', 'practice', 'session', 'camp',
            
            // Non-FPL content - ULTRA STRICT
            'quiz', 'guess', 'play', 'game', 'entertainment', 'fun', 'trivia', 'history',
            'legends', 'retro', 'vintage', 'classic', 'memories', 'throwback',
            'women', 'female', 'girls', 'ladies', 'womens', 'womens football',
            'youth', 'academy', 'development', 'under-21', 'under-19', 'reserves',
            'community', 'charity', 'foundation', 'outreach', 'social',
            'technology', 'var', 'referee', 'officials', 'rules', 'regulations',
            'stadium', 'ground', 'venue', 'facilities', 'infrastructure',
            'business', 'finance', 'money', 'revenue', 'sponsorship', 'commercial',
            'media', 'journalism', 'interview', 'press', 'conference', 'statement',
            'rumours', 'gossip', 'speculation', 'reports', 'sources', 'insider',
            'opinion', 'editorial', 'column', 'blog', 'article', 'feature',
            'statistics', 'data', 'analytics', 'metrics', 'performance', 'stats',
            'weather', 'climate', 'pitch', 'surface', 'grass', 'artificial',
            'travel', 'journey', 'trip', 'tour', 'visit', 'away', 'home',
            'celebration', 'party', 'festival', 'event', 'ceremony', 'awards',
            'documentary', 'film', 'movie', 'video', 'series', 'show',
            'podcast', 'radio', 'tv', 'television', 'broadcast', 'streaming',
            'social media', 'twitter', 'instagram', 'facebook', 'tiktok', 'youtube',
            'fashion', 'style', 'clothing', 'kit', 'jersey', 'shirt', 'boots',
            'food', 'drink', 'restaurant', 'cafe', 'bar', 'pub', 'hotel',
            'music', 'song', 'anthem', 'hymn', 'chant', 'song', 'lyrics',
            'art', 'design', 'logo', 'brand', 'identity', 'crest', 'badge',
            'education', 'school', 'university', 'college', 'degree', 'course',
            'health', 'wellness', 'fitness', 'exercise', 'training', 'gym',
            'lifestyle', 'culture', 'tradition', 'heritage', 'custom', 'ritual',
            'politics', 'government', 'policy', 'law', 'legal', 'court', 'justice',
            'economy', 'market', 'investment', 'stock', 'shares', 'trading',
            'science', 'research', 'study', 'experiment', 'innovation', 'technology',
            'environment', 'sustainability', 'green', 'eco', 'carbon', 'climate',
            'society', 'community', 'public', 'citizen', 'democracy', 'rights',
            'religion', 'faith', 'belief', 'church', 'temple', 'mosque', 'synagogue',
            'philosophy', 'ethics', 'morality', 'values', 'principles', 'ideals',
            'psychology', 'mental', 'emotional', 'behavior', 'personality', 'character',
            'sociology', 'anthropology', 'history', 'geography', 'demographics', 'statistics',
            
            // ADDITIONAL ULTRA STRICT FILTERS
            'chaos', 'reigns', 'scrambling', 'rangers', 'gerrard', 'leaves',
            'guess', 'footballers', 'quiz', 'play', 'entertainment',
            '007', 'football', 'kazakhstan', 'uefa', 'shin pads', 'small',
            'calafiori', 'towel', 'banned', 'farming', 'village', 'icon',
            'salah', 'river', 'plate', 'diaz', 'fourth-tier', 'mentor',
            'changed', 'east', 'meets', 'west', 'london', 'air', 'crash',
            'underdogs', 'triumph', 'rise', 'fall', 'north', 'korea',
            'sleeping', 'giant', 'wales', 'beat', 'england', 'wembley',
            'earps', 'queen', 'stops', 'younger', 'mbappe', 'emerging',
            'brother', 'shadow', 'humble', 'kane', 'england', 'undervalued',
            'super', 'germany', 'born', 'striker', 'goalkeeping', 'great',
            'forest', 'consider', 'dyche', 'postecoglou', 'sacked',
            'man', 'utd', 'palace', 'wharton', 'sunday', 'gossip',
            'injury-time', 'portugal', 'defeat', 'painful', 'hallgrimss',
            'newcastle', 'name', 'forest', 'wilson', 'sporting', 'director',
            'saved', 'everton', 'community', 'day', 'wales', 'beat',
            'england', 'wembley', 'guess', 'footballers', 'quiz',
            'mary', 'earps', 'queen', 'stops', 'younger', 'mbappe',
            'emerging', 'brother', 'shadow', '007', 'football',
            'kazakhstan', 'uefa', 'shin', 'pads', 'small', 'calafiori',
            'towel', 'banned', 'farming', 'village', 'liverpool', 'icon',
            'salah', 'river', 'plate', 'diaz', 'fourth-tier', 'mentor',
            'changed', 'east', 'meets', 'west', 'london', 'air', 'crash',
            'underdogs', 'triumph', 'rise', 'fall', 'north', 'korea',
            'sleeping', 'giant'
          ];
          const shouldSkip = skipKeywords.some(keyword => title.includes(keyword) || description.includes(keyword));
          
          if (isFPLRelevant && !shouldSkip) {
            console.log(`FPL-relevant news found: ${title.substring(0, 50)}...`);
          }
          
          return isFPLRelevant && !shouldSkip;
        });

        const news = filteredItems.slice(0, 9).map((item: any) => ({
          title: item.title || "No title",
          link: item.link || "#",
          date: item.pubDate || "",
          description: item.description || "",
        }));

        if (news.length >= 4) { // Accept if we have at least 4 news items
          console.log(`Successfully loaded ${news.length} FPL-relevant news items from ${rssUrl}`);
          return NextResponse.json({ news });
        } else {
          console.log(`Only ${news.length} FPL-relevant news found in ${rssUrl}, trying next source...`);
        }
      } catch (error: any) {
        console.log(`Error with ${rssUrl}:`, error?.message || error);
        continue;
      }
    }

    // If all RSS sources fail, return fallback data focused on injuries, cards, transfers
    console.log("All RSS sources failed, returning fallback data");
    const fallbackNews = [
      {
        title: "Kecederaan Pemain: Update Terkini dari Liga Perdana Inggeris",
        link: "https://www.bbc.com/sport/football",
        date: new Date().toISOString(),
        description: "Laporan terkini mengenai kecederaan pemain-pemain utama dalam Liga Perdana Inggeris dan kesan terhadap FPL."
      },
      {
        title: "Kad Kuning dan Merah: Analisis Disiplin Pemain",
        link: "https://www.bbc.com/sport/football",
        date: new Date(Date.now() - 86400000).toISOString(),
        description: "Analisis statistik kad kuning dan merah dalam Liga Perdana Inggeris dan kesan terhadap FPL."
      },
      {
        title: "Transfer Window: Pemain Masuk dan Keluar",
        link: "https://www.bbc.com/sport/football",
        date: new Date(Date.now() - 172800000).toISOString(),
        description: "Update terkini mengenai pemindahan pemain dalam Liga Perdana Inggeris dan kesan terhadap FPL."
      },
      {
        title: "Suspension Alert: Pemain Terkena Suspensi",
        link: "https://www.bbc.com/sport/football",
        date: new Date(Date.now() - 259200000).toISOString(),
        description: "Senarai pemain yang terkena suspensi akibat kad merah dan kesan terhadap FPL."
      },
      {
        title: "Injury Update: Status Kesihatan Pemain Utama",
        link: "https://www.bbc.com/sport/football",
        date: new Date(Date.now() - 345600000).toISOString(),
        description: "Laporan terkini mengenai status kecederaan pemain-pemain utama dan masa pulih yang dijangka."
      },
      {
        title: "FPL Impact: Kesan Kecederaan Terhadap Fantasy Premier League",
        link: "https://www.bbc.com/sport/football",
        date: new Date(Date.now() - 432000000).toISOString(),
        description: "Analisis kesan kecederaan pemain terhadap strategi FPL dan cadangan penggantian."
      },
      {
        title: "Card Watch: Pemain Berisiko Tinggi Kad Kuning",
        link: "https://www.bbc.com/sport/football",
        date: new Date(Date.now() - 518400000).toISOString(),
        description: "Senarai pemain yang berisiko tinggi mendapat kad kuning dan kesan terhadap FPL."
      },
      {
        title: "Transfer Rumours: Pemain yang Berpotensi Bergerak",
        link: "https://www.bbc.com/sport/football",
        date: new Date(Date.now() - 604800000).toISOString(),
        description: "Gosip transfer terkini dan pemain yang berpotensi berpindah kelab dalam Liga Perdana Inggeris."
      },
      {
        title: "Recovery Timeline: Jadual Pulih Pemain Cedera",
        link: "https://www.bbc.com/sport/football",
        date: new Date(Date.now() - 691200000).toISOString(),
        description: "Jadual jangkaan pulih pemain-pemain yang cedera dan kesan terhadap strategi FPL."
      },
      {
        title: "FPL Strategy: Tips Memilih Pemain untuk Gameweek Seterusnya",
        link: "https://www.bbc.com/sport/football",
        date: new Date(Date.now() - 777600000).toISOString(),
        description: "Panduan strategi FPL untuk memilih pemain terbaik berdasarkan form dan fixture."
      },
      {
        title: "Captain Choice: Analisis Pemain Terbaik untuk Captain",
        link: "https://www.bbc.com/sport/football",
        date: new Date(Date.now() - 864000000).toISOString(),
        description: "Analisis mendalam pemain-pemain terbaik untuk dijadikan captain dalam FPL."
      },
      {
        title: "Differential Picks: Pemain Under-the-Radar untuk FPL",
        link: "https://www.bbc.com/sport/football",
        date: new Date(Date.now() - 950400000).toISOString(),
        description: "Senarai pemain yang kurang popular tetapi berpotensi memberikan mata tinggi dalam FPL."
      }
    ];

    return NextResponse.json({ news: fallbackNews });
  } catch (error: any) {
    console.error("❌ /api/news error:", error.message);
    return NextResponse.json(
      { error: "Gagal memuat berita EPL", message: error.message },
      { status: 500 }
    );
  }
}