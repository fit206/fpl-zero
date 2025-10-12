"use client";
import { useEffect, useState } from "react";

export default function NewsPage() {
  const [news, setNews] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      console.log("Fetching news from API route...");
      try {
        setLoading(true);
        setError("");
        
        const res = await fetch("/api/news");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        
        if (data.error) {
          throw new Error(data.message || data.error);
        }
        
        setNews(data.news || []);
      } catch (err: any) {
        console.error("Failed to fetch news:", err);
        setError("Tidak dapat memuatkan berita EPL sekarang.");
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, []);

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
          <div className="card p-4 lg:p-5 mb-6 lg:mb-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-cyan mx-auto mb-4"></div>
                    <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white mb-2">
                      Memuatkan Berita FPL
                    </h1>
                    <p className="text-white/80">Mengambil update kecederaan, kad & transfer...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
          <div className="card p-4 lg:p-5 mb-6 lg:mb-8 border-red-500/30 bg-red-500/10">
            <div className="text-center">
              <div className="text-red-300 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-red-300 mb-2">
                Ralat Memuatkan Berita
              </h1>
              <p className="text-red-200">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Cuba Lagi
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="card p-4 lg:p-5 mb-6 lg:mb-8">
          <div className="text-center">
                  <h1 className="text-2xl lg:text-3xl font-extrabold text-white mb-2">
                    Berita FPL: Kecederaan, Kad & Transfer
                  </h1>
                  <p className="text-white/80">
                    Update terkini mengenai kecederaan pemain, kad kuning/merah, dan transfer untuk FPL
                  </p>
            {news.length > 0 && (
              <div className="mt-3 text-sm text-white/60">
                {news.length} artikel ditemui
              </div>
            )}
          </div>
        </div>

        {/* News Grid */}
        {news.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {news.map((item, index) => (
              <article 
                key={index}
                className="card p-4 lg:p-5 hover:scale-105 transition-all duration-300 cursor-pointer group animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => window.open(item.link, '_blank')}
              >
                {/* Content */}
                <div className="space-y-3">
                  {/* Date */}
                  <div className="flex items-center text-xs text-white/60">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(item.date)}
                  </div>

                  {/* Title */}
                  <h2 className="text-lg font-bold text-white line-clamp-3 group-hover:text-brand-cyan transition-colors">
                    {item.title}
                  </h2>

                  {/* Description */}
                  {item.description && (
                    <p className="text-sm text-white/80 line-clamp-3">
                      {item.description.replace(/<[^>]*>/g, '')}
                    </p>
                  )}

                  {/* Read More Button */}
                  <div className="pt-2">
                    <span className="inline-flex items-center text-sm font-semibold text-brand-cyan group-hover:text-white transition-colors">
                          Baca Selengkapnya
                          <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="card p-8 lg:p-12 text-center">
            <div className="text-white/40 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Tiada berita ditemui</h3>
            <p className="text-white/80">Tiada artikel berita tersedia pada masa ini.</p>
          </div>
        )}
      </div>
    </main>
  );
}