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

        
        // ULTRA STRICT FILTERING: Only show injuries, cards, and transfers
        const filteredItems = items.filter((item: any) => {
          const title = (item.title || "").toLowerCase();
          const description = (item.description || "").toLowerCase();
          
          console.log(`🔍 Checking: "${title.substring(0, 50)}..."`);
          
          // ONLY show if it contains FPL-relevant keywords
          const hasInjury = ['injury', 'injured', 'hamstring', 'knee', 'ankle', 'muscle', 'strain', 'fracture', 'concussion', 'ruled out', 'doubtful', 'fitness', 'recovery', 'medical', 'treatment', 'surgery', 'knocked out', 'knock', 'blow', 'broken', 'sprain', 'tear', 'pull', 'twist'].some(keyword => title.includes(keyword) || description.includes(keyword));
          
          const hasCard = ['suspension', 'suspended', 'card', 'yellow', 'red', 'ban', 'disciplinary', 'booking', 'sent off', 'dismissal', 'red card', 'yellow card', 'straight red', 'second yellow', 'expelled', 'ejected', 'banned'].some(keyword => title.includes(keyword) || description.includes(keyword));
          
          const hasTransfer = ['transfer', 'signing', 'loan', 'contract', 'deal', 'agreement', 'move', 'switch', 'join', 'leave', 'departure', 'arrival', 'signed', 'joins', 'leaves', 'departs', 'arrives'].some(keyword => title.includes(keyword) || description.includes(keyword));
          
          const isFPLRelevant = hasInjury || hasCard || hasTransfer;
          
          if (isFPLRelevant) {
            console.log(`✅ FPL-relevant news found: ${title.substring(0, 50)}...`);
            console.log(`   Injury: ${hasInjury}, Card: ${hasCard}, Transfer: ${hasTransfer}`);
          } else {
            console.log(`❌ Not FPL-relevant: ${title.substring(0, 50)}...`);
          }
          
          return isFPLRelevant;
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