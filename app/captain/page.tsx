// app/captain/page.tsx
'use client';

import React from 'react';

type Candidate = {
  id: number;
  name: string;
  pos: 'GK'|'DEF'|'MID'|'FWD';
  teamId: number;
  teamShort: string;
  opponent: string;
  minutesP: number;
  baseEpts: number;
  smartEpts: number;
  captainPts: number;
  confidence: number;
  reasons: string[];
};

type CaptainResp = {
  gw: number;
  suggestions: Candidate[];
};

function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={`px-2 py-1 rounded-full text-xs ring-1 ${className}`}>{children}</span>;
}

export default function CaptainPage() {
  const [entryId, setEntryId] = React.useState('');
  const [data, setData] = React.useState<CaptainResp | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [hasData, setHasData] = React.useState(false);

  // Load saved data on component mount
  React.useEffect(() => {
    const savedData = localStorage.getItem('transferData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (parsedData.entryId) {
          setEntryId(parsedData.entryId.toString());
          setHasData(true);
          // Auto-load captain suggestions
          loadCaptainSuggestions(parsedData.entryId);
        }
      } catch (err) {
        console.error('Error loading saved data:', err);
      }
    }
  }, []);

  const loadCaptainSuggestions = async (id: number) => {
    setErr(null);
    setData(null);
    setLoading(true);
    
    // Check cache first
    const cacheKey = `captain_${id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const now = Date.now();
        // Cache valid for 15 minutes untuk speed
        if (now - parsed.timestamp < 15 * 60 * 1000) {
          setData(parsed.data);
          setLoading(false);
          return;
        }
      } catch (e) {
        // Invalid cache, continue with fetch
      }
    }
    
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const res = await fetch(`/api/captain?entryId=${id}`, { 
        signal: controller.signal,
        cache: 'force-cache',
        headers: {
          'Cache-Control': 'max-age=900' // 15 minutes
        }
      });
      
      clearTimeout(timeoutId);
      
      const json = await res.json();
      if (!res.ok) setErr(json?.error || 'Ralat');
      else {
        setData(json as CaptainResp);
        // Cache the result
        localStorage.setItem(cacheKey, JSON.stringify({
          data: json,
          timestamp: Date.now()
        }));
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setErr('Masa tunggu tamat. Cuba lagi.');
      } else {
        setErr('Ralat rangkaian');
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = Number(entryId);
    if (!Number.isFinite(id) || id<=0) { setErr('Masukkan Team ID yang sah'); return; }
    await loadCaptainSuggestions(id);
  };

  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Header */}
        <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white text-slate-900 p-3 sm:p-4 mb-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-base sm:text-lg font-extrabold">Captain Advisor</div>
              <div className="text-xs text-slate-600">Analisis form, minutes, xGI share, CS prob, disiplin</div>
            </div>
            {!hasData && (
              <form onSubmit={onSubmit} className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="Team ID"
                  value={entryId}
                  onChange={(e)=>setEntryId(e.target.value)}
                  className="h-8 sm:h-9 rounded-lg border border-gray-300 px-2 sm:px-3 text-xs sm:text-sm"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="h-8 sm:h-9 rounded-lg bg-black px-2 sm:px-3 text-xs sm:text-sm font-semibold text-white"
                >
                  {loading ? 'Memuat...' : 'Dapatkan'}
                </button>
              </form>
            )}
          </div>
                 {data && (
                   <div className="mt-2 text-xs text-slate-600">
                     Gameweek: <span className="font-semibold">{data.gw}</span>
                     { (data as any).source && <span className="ml-2 text-slate-500">({(data as any).source})</span> }
                   </div>
                 )}
        </div>

        {err && <div className="rounded-xl sm:rounded-2xl border border-red-200 bg-white text-red-700 p-3 sm:p-4 shadow-sm mb-4">{err}</div>}

        {loading && (
          <>
            <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white text-slate-900 p-6 text-center shadow-sm mb-4">
              <div className="flex items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
                <span>Memuat cadangan kapten...</span>
              </div>
              <div className="mt-3 text-sm text-slate-600">
                Menganalisis form, minutes, xGI share, dan clean sheet probability
              </div>
            </div>
            
            {/* Loading Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white text-slate-900 p-3 sm:p-4 shadow-sm animate-pulse">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-5 bg-gray-200 rounded w-32"></div>
                    <div className="h-6 bg-gray-200 rounded-full w-24"></div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                    <div className="h-5 bg-gray-200 rounded-full w-12"></div>
                    <div className="h-5 bg-gray-200 rounded-full w-16"></div>
                    <div className="h-5 bg-gray-200 rounded-full w-16"></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!hasData && !loading && !data && !err && (
          <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white text-slate-900 p-8 text-center shadow-sm">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">Tiada data pasukan</h3>
            <p className="text-slate-600">Masukkan Team ID di halaman utama terlebih dahulu untuk mendapatkan cadangan kapten</p>
          </div>
        )}

        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {data.suggestions.map((c) => (
              <div key={c.id} className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white text-slate-900 p-3 sm:p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm sm:text-base font-bold">{c.name} <span className="text-slate-500 font-medium">({c.pos})</span></div>
                  <Chip className="bg-emerald-50 text-emerald-700 ring-emerald-200">
                    CaptainPts: {c.captainPts.toFixed(2)}
                  </Chip>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm mb-2">
                  <Chip className="bg-slate-100 text-slate-800 ring-slate-200">{c.teamShort}</Chip>
                  <Chip className="bg-slate-100 text-slate-800 ring-slate-200">{c.opponent}</Chip>
                  <Chip className="bg-sky-50 text-sky-700 ring-sky-200">Conf {c.confidence}%</Chip>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm">
                  <div>
                    <div className="text-[10px] sm:text-xs text-slate-500">Minutes</div>
                    <div className="font-semibold">{(c.minutesP*100).toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] sm:text-xs text-slate-500">Base ePts</div>
                    <div className="font-semibold">{c.baseEpts.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] sm:text-xs text-slate-500">Smart ePts</div>
                    <div className="font-semibold">{c.smartEpts.toFixed(2)}</div>
                  </div>
                </div>
                <ul className="mt-3 text-xs sm:text-sm list-disc pl-4 sm:pl-5 text-slate-700 space-y-0.5 sm:space-y-1">
                  {c.reasons.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}