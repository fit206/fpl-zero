// components/NewsModal.tsx
'use client';
import React from 'react';
import type { NewsItem } from '@/lib/news/build';

const headshot = (code?: number) =>
  code ? `https://resources.premierleague.com/premierleague/photos/players/250x250/p${code}.png` : '/crests/fallback.svg';

const crest = (teamShort: string, teamCode?: number) =>
  `/api/crest?short=${encodeURIComponent(teamShort)}&teamCode=${teamCode ?? 0}&size=70`;

function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={`px-2 py-1 rounded-full text-[11px] ring-1 ${className}`}>{children}</span>;
}

type Props = { open: boolean; item: NewsItem | null; onClose: () => void; };

export default function NewsModal({ open, item, onClose }: Props) {
  const [paras, setParas] = React.useState<string[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  
  console.log('NewsModal render: open=', open, 'item=', item, 'paras=', paras, 'loading=', loading);
  
  // Debug state changes
  React.useEffect(() => {
    console.log('NewsModal: paras state changed to:', paras);
  }, [paras]);
  
  React.useEffect(() => {
    console.log('NewsModal: loading state changed to:', loading);
  }, [loading]);

  React.useEffect(() => {
    if (!open || !item) return;
    const controller = new AbortController();

    const load = async () => {
      setLoading(true); setParas(null);
      try {
        let qs = '';
        if (item.kind === 'player' || item.kind === 'discipline') qs = `playerId=${item.playerId}`;
        else if (item.kind === 'team') qs = `teamId=${item.teamId}`;
        
        console.log('NewsModal: Fetching expand API with:', qs);
        const apiUrl = `/api/news/expand?${qs}`;
        console.log('NewsModal: Full API URL:', apiUrl);
        const res = await fetch(apiUrl, { signal: controller.signal, cache: 'no-store' });
        console.log('NewsModal: API response status:', res.status);
        console.log('NewsModal: API response ok:', res.ok);
        const json = await res.json();
        console.log('NewsModal: API response data:', json);
        console.log('NewsModal: paragraphs:', json?.paragraphs);
        console.log('NewsModal: paragraphs content:', json?.paragraphs?.map((p: string, i: number) => `${i}: ${p}`));
        console.log('NewsModal: paragraphs content details:', json?.paragraphs);
        const paragraphs = Array.isArray(json?.paragraphs) ? json.paragraphs : null;
        console.log('NewsModal: setting paragraphs to:', paragraphs);
        setParas(paragraphs);
      } catch (error) {
        console.error('NewsModal: API error:', error);
        setParas(null);
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [open, item]);

  React.useEffect(() => {
    if (!open) return;
    console.log('NewsModal: Setting up keyboard listener and scroll lock');
    const onKey = (e: KeyboardEvent) => {
      console.log('NewsModal: Key pressed:', e.key);
      if (e.key === 'Escape') {
        console.log('NewsModal: Escape key pressed, closing modal');
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { 
      console.log('NewsModal: Cleaning up keyboard listener and scroll lock');
      document.removeEventListener('keydown', onKey); 
      document.body.style.overflow = prev; 
    };
  }, [open, onClose]);

  if (!open || !item) return null;

  const isPlayer = item.kind === 'player' || item.kind === 'discipline';
  const teamShort =
    item.kind === 'team' ? item.teamShort :
    item.kind === 'player' ? item.teamShort :
    item.teamShort;

  const teamCode =
    item.kind === 'team' ? item.teamCode :
    item.kind === 'player' ? item.teamCode :
    item.teamCode;

  const imgPrimary = isPlayer
    ? headshot((item as any).playerCode as number | undefined)
    : crest(teamShort, teamCode);

  const title =
    item.kind === 'player' ? (item as any).name :
    item.kind === 'discipline' ? (item as any).name :
    (item as any).headline;

  const tagClass =
    item.tag === 'kecederaan' ? 'bg-amber-50 text-amber-800 ring-amber-200'
    : item.tag === 'penggantungan' ? 'bg-rose-50 text-rose-800 ring-rose-200'
    : 'bg-sky-50 text-sky-800 ring-sky-200';

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white text-slate-900 shadow-xl border border-gray-200 overflow-hidden">
        <div className="relative h-56 md:h-64 bg-slate-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgPrimary}
            alt={title}
            className="absolute inset-0 h-full w-full object-contain p-3"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = crest(teamShort, teamCode); }}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/90 via-white/70 to-transparent" />
          <div className="absolute top-2 left-2 flex items-center gap-2">
            <Pill className="bg-slate-100 text-slate-800 ring-slate-200">{item.kind}</Pill>
            <Pill className={tagClass}>{item.tag}</Pill>
          </div>
          <div className="absolute top-2 right-2">
            <Pill className="bg-slate-100 text-slate-800 ring-slate-200">
              {new Date(item.ts).toLocaleString()}
            </Pill>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-lg md:text-xl font-extrabold leading-tight truncate">{title}</h3>
              <div className="mt-1 text-[12px] font-semibold text-slate-600">{teamShort}</div>
            </div>
            <button onClick={onClose} className="shrink-0 rounded-full bg-black text-white h-9 px-3 text-sm font-semibold hover:bg-black/90">
              Tutup
            </button>
          </div>

          {/* Penerangan panjang */}
          <div className="mt-3 space-y-3 text-[14px] leading-relaxed text-slate-800">
            {loading && <div className="text-slate-500">Memuat penerangan lanjut…</div>}
            {!loading && paras && (
              <>
                <div className="text-xs text-gray-500">Debug: {paras.length} paragraphs loaded</div>
                <div className="text-xs text-gray-500">Content: {paras.join(' | ')}</div>
                <div className="text-xs text-gray-500">Rendering condition: !loading={!loading} && paras={!!paras}</div>
                {paras.map((p, i) => (<p key={i}>{p}</p>))}
              </>
            )}
            {!loading && !paras && (
              <>
                <p>Butiran penuh tidak tersedia buat masa ini.</p>
                {/* fallback ringkas kalau perlu: headline/detail */}
                {item.kind !== 'team' && (item as any).headline && <p>{(item as any).headline}</p>}
                {(item as any).detail && <p>{(item as any).detail}</p>}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
