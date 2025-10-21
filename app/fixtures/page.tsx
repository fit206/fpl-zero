// app/fixtures/page.tsx
'use client';

import React from 'react';
import FixtureRow, { MatchItem } from '@/components/FixtureRow';

type TeamSide = { id: number; code?: number; name: string; short: string; crest?: string };
type Group = { day: string; matches: MatchItem[] };
type MWResponse = {
  eventId: number;
  eventName: string;
  dateRange: { start: string | null; end: string | null };
  groups: Group[];
  prevEventId: number | null;
  nextEventId: number | null;
};

export default function FixturesPage() {
  const [data, setData] = React.useState<MWResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const load = async (event: 'current' | 'next' | number = 'current') => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/matchweek?event=${event}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Ralat');
      setData(json as MWResponse);
    } catch (e: any) {
      setErr(e?.message || 'Gagal memuat jadual');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load('current');
  }, []);

  const goPrev = () => data?.prevEventId && load(data.prevEventId);
  const goNext = () => data?.nextEventId && load(data.nextEventId);

  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Header matchweek (light) */}
        <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white text-slate-900 p-3 sm:p-4 mb-4 shadow-sm flex items-center justify-between">
          <button
            onClick={goPrev}
            disabled={!data?.prevEventId}
            className="rounded-full p-1.5 sm:p-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition-colors"
            title="Matchweek sebelumnya"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" className="sm:w-[18px] sm:h-[18px]" fill="currentColor">
              <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path>
            </svg>
          </button>

          <div className="text-center px-2">
            <div className="text-base sm:text-lg font-extrabold">{data?.eventName || 'Matchweek'}</div>
            <div className="text-[10px] sm:text-xs text-slate-600">
              {data?.dateRange?.start && data?.dateRange?.end
                ? `${data.dateRange.start} - ${data.dateRange.end}`
                : '—'}
            </div>
          </div>

          <button
            onClick={goNext}
            disabled={!data?.nextEventId}
            className="rounded-full p-1.5 sm:p-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition-colors"
            title="Matchweek seterusnya"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" className="sm:w-[18px] sm:h-[18px]" fill="currentColor">
              <path d="M8.59 16.59 10 18l6-6-6-6-1.41 1.41L12.17 12z"></path>
            </svg>
          </button>
        </div>

        {err && (
          <div className="rounded-xl sm:rounded-2xl border border-red-200 bg-white text-red-700 p-3 sm:p-4 shadow-sm mb-4">
            {err}
          </div>
        )}

        {/* Kumpulan per hari (light card) */}
        {loading ? (
          <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white text-slate-900 p-4 sm:p-6 text-center shadow-sm">
            Memuat jadual…
          </div>
        ) : data ? (
          <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white text-slate-900 overflow-hidden shadow-sm">
            {data.groups.map((g, idx) => (
              <div key={g.day} className="px-3 sm:px-4 py-3 sm:py-4">
                <div className="text-xs sm:text-sm font-extrabold text-slate-700 mb-2">{g.day}</div>
                <div className="divide-y divide-gray-100">
                  {g.matches.map((m, i) => (
                    <FixtureRow key={`${m.home.id}-${m.away.id}-${i}`} item={m} />
                  ))}
                </div>
                {idx < data.groups.length - 1 && <div className="h-px bg-gray-100 mt-3 sm:mt-4" />}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}