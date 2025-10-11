// app/news/page.tsx
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { NewsItem } from '@/lib/news/build';

const NewsModal = dynamic(() => import('@/components/NewsModal'), { ssr: false });
type Resp = { generatedAt:string; sinceHours:number; count:number; items:NewsItem[] };

// Bina URL headshot pemain (FPL code)
const headshot = (code?: number) =>
  code ? `https://resources.premierleague.com/premierleague/photos/players/250x250/p${code}.png` : '/crests/fallback.svg';

// Crest pasukan (proxy crest) — gunakan teamCode bila ada (paling tepat)
const crest = (teamShort: string, teamCode?: number) =>
  `/api/crest?short=${encodeURIComponent(teamShort)}&teamCode=${teamCode ?? 0}&size=70`;

function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={`px-2 py-1 rounded-full text-[11px] ring-1 ${className}`}>{children}</span>;
}

// Satu kad berita gaya gambar
function NewsCard({ it }: { it: NewsItem }) {
  const isPlayer = it.kind === 'player' || it.kind === 'discipline';
  const teamShort = it.teamShort;
  const teamCode = it.teamCode;

  // 1) pilih gambar utama berdasarkan jenis berita
  let imgPrimary: string;
  if (it.kind === 'team') {
    // Team news - gunakan crest
    imgPrimary = crest(teamShort, teamCode);
  } else if (it.kind === 'player' || it.kind === 'discipline') {
    // Player news (kecederaan, form, disiplin) - gunakan headshot pemain dengan fallback
    const playerCode = it.playerCode;
    const teamCode = it.teamCode;
    
    // Try headshot first, then crest, then placeholder
    if (playerCode && playerCode > 0) {
      imgPrimary = headshot(playerCode);
    } else if (teamCode && teamCode > 0) {
      imgPrimary = crest(teamShort, teamCode);
    } else {
      imgPrimary = '/player-placeholder.svg';
    }
  } else {
    // Fallback
    imgPrimary = crest(teamShort, teamCode);
  }

  const tagClass =
    it.tag === 'kecederaan' ? 'bg-amber-50 text-amber-800 ring-amber-200'
    : it.tag === 'penggantungan' ? 'bg-rose-50 text-rose-800 ring-rose-200'
    : 'bg-sky-50 text-sky-800 ring-sky-200';

  const title =
    it.kind === 'player' ? it.name :
    it.kind === 'discipline' ? it.name :
    it.headline;

  const subtitle =
    it.kind === 'player' ? it.headline :
    it.kind === 'discipline' ? it.headline :
    it.detail || '';

  // 2) Kad
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition">
      {/* FRAME GAMBAR — tak potong, sentiasa muat */}
      <div className="relative h-44 md:h-48 bg-slate-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgPrimary}
          alt={title}
          className="absolute inset-0 h-full w-full object-contain p-2 md:max-w-[85%] md:mx-auto transition-transform duration-300 group-hover:scale-[1.02]"
          onError={(e) => {
            // Fallback: jika headshot gagal, cuba crest team
            if (isPlayer) {
              console.log('Headshot failed, falling back to crest for:', it.name);
              (e.currentTarget as HTMLImageElement).src = crest(teamShort, teamCode);
            } else {
              (e.currentTarget as HTMLImageElement).src = '/player-placeholder.svg';
            }
          }}
        />
        {/* overlay nipis supaya teks jelas tapi gambar masih hidup */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/90 via-white/70 to-transparent" />

        {/* Pills kiri atas + masa kanan atas */}
        <div className="absolute top-2 left-2 flex items-center gap-2">
          <Pill className="bg-slate-100 text-slate-800 ring-slate-200">{it.kind}</Pill>
          <Pill className={tagClass}>{it.tag}</Pill>
          {(it as any).source === 'twitter' && (
            <Pill className="bg-blue-100 text-blue-800 ring-blue-200">🐦 Twitter</Pill>
          )}
        </div>
        <div className="absolute top-2 right-2">
          <Pill className="bg-slate-100 text-slate-800 ring-slate-200">
            {new Date(it.ts).toLocaleString()}
          </Pill>
        </div>
      </div>

      {/* KANDUNGAN */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <div className="text-[15px] font-extrabold text-slate-900 truncate">{title}</div>
          <div className="text-[11px] font-extrabold text-slate-600 ml-2">{teamShort}</div>
        </div>

        <div className="text-[13px] text-slate-800 line-clamp-2">{subtitle}</div>

        {/* Butiran tambahan */}
        {it.kind === 'discipline' && it.detail && (
          <div className="text-[12px] text-slate-700 mt-1">{it.detail}</div>
        )}
        {it.kind === 'team' && it.detail && (
          <div className="text-[12px] text-slate-700 mt-1">{it.detail}</div>
        )}
      </div>
    </div>
  );
}

export default function NewsPage() {
  const [data, setData] = React.useState<Resp | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<NewsItem | null>(null);
  const [open, setOpen] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');

  const openModal = (it: NewsItem) => { setSelected(it); setOpen(true); };
  const closeModal = () => { setOpen(false); setSelected(null); };

  const load = async (category = selectedCategory) => {
    setLoading(true); setErr(null);
    try {
      const url = category === 'all' 
        ? '/api/news?sinceHours=1' 
        : `/api/news?sinceHours=1&category=${category}`;
      const res = await fetch(url, { cache: 'no-store' }); // Hanya berita 1 jam terkini
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Gagal memuat news');
      setData(json as Resp);
    } catch (e:any) {
      setErr(e?.message || 'Gagal memuat news');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load();
  }, []);

  return (
    <main className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="rounded-2xl border border-gray-200 bg-white text-slate-900 p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-lg font-extrabold">News FPL Terkini (1 jam)</div>
              <div className="text-xs text-slate-600">Kecederaan, form, harga, ownership, dan status terkini — dalam Bahasa Melayu</div>
            </div>
            <button
              onClick={() => load()}
              disabled={loading}
              className="h-9 rounded-full bg-black px-4 text-sm font-semibold text-white"
            >
              {loading ? 'Memuat...' : 'Refresh'}
            </button>
          </div>
          
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Semua', color: 'bg-gray-100 text-gray-700' },
              { key: 'kecederaan', label: 'Kecederaan', color: 'bg-red-100 text-red-700' },
              { key: 'disiplin', label: 'Disiplin', color: 'bg-yellow-100 text-yellow-700' },
              { key: 'form', label: 'Form', color: 'bg-green-100 text-green-700' },
              { key: 'ownership', label: 'Ownership', color: 'bg-purple-100 text-purple-700' },
            ].map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() => {
                  setSelectedCategory(key);
                  load(key);
                }}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === key 
                    ? 'bg-black text-white' 
                    : `${color} hover:opacity-80`
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {err && <div className="rounded-2xl border border-red-200 bg-white text-red-700 p-4 shadow-sm">{err}</div>}

        {data && (
          <>
            {data.items.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white text-slate-700 p-4 shadow-sm">
              Tiada berita terkini dalam {data.sinceHours} jam lepas. Berita akan muncul untuk pemain yang baru injured, suspended, doubtful, mendapat kad merah/kuning kritikal, form cemerlang/lemah, kenaikan/penurunan harga, atau ownership yang ekstrem.
            </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.items.slice(0, 9).map((it, i) => (
                          <button
                            key={i}
                            onClick={() => openModal(it)}
                            className="text-left"
                          >
                      <NewsCard it={it} />
                    </button>
                  ))}
                </div>
                
                {/* Show "Load More" button if there are more than 9 items */}
                {data.items.length > 9 && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => {
                        setSelectedCategory(selectedCategory);
                        load(selectedCategory);
                      }}
                      className="px-6 py-2 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
                    >
                      Lihat semua berita ({data.items.length} total)
                    </button>
                  </div>
                )}
                
              </>
            )}
          </>
        )}

        {/* Modal */}
        <NewsModal open={open} item={selected} onClose={closeModal} />
      </div>
    </main>
  );
}
