import { NextResponse } from "next/server";
import { parseStringPromise } from "xml2js";

export async function GET() {
  try {
    // Try multiple RSS sources for better reliability
    const rssSources = [
      "https://www.eyefootball.com/rss/",
      "https://www.bbc.com/sport/football/rss.xml",
      "https://feeds.skynews.com/feeds/rss/uk/sports/football.xml"
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

        const news = items.slice(0, 9).map((item: any) => ({
          title: item.title || "No title",
          link: item.link || "#",
          date: item.pubDate || "",
          description: item.description || "",
        }));

        if (news.length > 0) {
          console.log(`Successfully loaded ${news.length} news items from ${rssUrl}`);
          return NextResponse.json({ news });
        }
      } catch (error: any) {
        console.log(`Error with ${rssUrl}:`, error?.message || error);
        continue;
      }
    }

    // If all RSS sources fail, return fallback data
    console.log("All RSS sources failed, returning fallback data");
    const fallbackNews = [
      {
        title: "Analisis Mendalam: Taktik Terkini dalam Liga Perdana Inggeris",
        link: "https://www.eyefootball.com",
        date: new Date().toISOString(),
        description: "Pandangan pakar mengenai evolusi taktik dan strategi dalam Liga Perdana Inggeris musim ini."
      },
      {
        title: "Statistik Pemain: Siapa yang Menjulang Tinggi?",
        link: "https://www.eyefootball.com",
        date: new Date(Date.now() - 86400000).toISOString(),
        description: "Analisis statistik mendalam mengenai prestasi pemain terbaik dalam Liga Perdana Inggeris."
      },
      {
        title: "Perbandingan Pasukan: Analisis Head-to-Head",
        link: "https://www.eyefootball.com",
        date: new Date(Date.now() - 172800000).toISOString(),
        description: "Perbandingan mendalam antara pasukan-pasukan teratas dalam Liga Perdana Inggeris."
      },
      {
        title: "Prediksi Perlawanan: Analisis xG dan Peluang",
        link: "https://www.eyefootball.com",
        date: new Date(Date.now() - 259200000).toISOString(),
        description: "Analisis expected goals (xG) dan peluang gol untuk perlawanan akan datang."
      },
      {
        title: "Sejarah dan Rekod: Fakta Menarik Liga Perdana Inggeris",
        link: "https://www.eyefootball.com",
        date: new Date(Date.now() - 345600000).toISOString(),
        description: "Fakta menarik dan rekod sejarah dalam Liga Perdana Inggeris yang perlu anda ketahui."
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