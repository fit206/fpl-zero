'use client';
import React from 'react';
import Image from 'next/image';
import DirectKitImage from '@/components/DirectKitImage';

export type LineupPlayer = {
  id: number;
  name: string; // web_name
  pos: 'GK' | 'DEF' | 'MID' | 'FWD';
  teamId: number;
  teamCode?: number;
  teamShort: string;
  position: number;
  isCaptain: boolean;
  isVice: boolean;
  fixtures: { oppShort: string; home: boolean }[];
};

export type Lineup = {
  starters: LineupPlayer[];
  bench: LineupPlayer[];
};

// Saiz asas (desktop)
const BASE_W = 928.01;
const BASE_STAGE_H = 28 + 650; // BANNER_H + PITCH_H

// PNG pitch anda
const PITCH_IMG = process.env.NEXT_PUBLIC_PITCH_IMG || '/pitch/portrait.png';
const PITCH_H = 650;

// Jika PNG sudah ada banner, tukar kepada false
const SHOW_HEADER_BANNER = false;
const BANNER_H = SHOW_HEADER_BANNER ? 40 : 0;

// Padamkan overlay ellipse + dot kuning
const SHOW_CAPTAIN_ELLIPSE = false;
const SHOW_STATUS_DOT = false;
const SHOW_STATUS_DOT_BENCH = false;

// Posisi baris (dalam % dari tinggi PITCH_H)
const ROW_Y = { GK: 13, DEF: 36, MID: 62, FWD: 86 };

// X presets (px mengikut kanvas asas) — akan di-scale automatik
const X_PRESETS: Record<number, number[]> = {
  1: [BASE_W / 2],
  2: [BASE_W * 0.33, BASE_W * 0.67],
  3: [170, BASE_W / 2, BASE_W - 170],
  4: [150, 320, 608, BASE_W - 150],
  5: [120, 280, BASE_W / 2, 648, BASE_W - 120],
};

const CARD_W = 104;

// Hook kecil untuk skala responsif
function useScale(baseWidth: number) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);

  React.useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      const s = Math.min(1, w / baseWidth); // jangan besarkan melebihi 1
      setScale(s);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [baseWidth]);

  return { ref, scale };
}

function fixturesText(p: LineupPlayer) {
  if (!p.fixtures?.length) return '-';
  if (p.fixtures.length === 1) {
    const f = p.fixtures[0];
    return `${f.oppShort} (${f.home ? 'H' : 'A'})`;
  }
  return p.fixtures.map((f) => `${f.oppShort} (${f.home ? 'H' : 'A'})`).join(' / ');
}

function xSlots(count: number): number[] {
  if (X_PRESETS[count]) return X_PRESETS[count];
  if (count <= 0) return [];
  if (count === 1) return [BASE_W / 2];
  const usable = BASE_W - 220 - CARD_W; // SIDE_MARGIN 110 + CARD_W
  const step = usable / (count - 1);
  const start = 110 + CARD_W / 2;
  return Array.from({ length: count }, (_, i) => start + i * step);
}

function yPx(percent: number) {
  return (percent / 100) * PITCH_H;
}

function PlayerCard({ p }: { p: LineupPlayer }) {
  const ft = fixturesText(p);
  return (
    <div className="relative w-[104px]">
      <div className="relative w-[78px] h-[78px] mx-auto rounded-md bg-white/10 border border-white/30 overflow-hidden flex items-center justify-center">
        <DirectKitImage
          role={p.pos === 'GK' ? 'gk' : 'outfield'}
          teamCode={p.teamCode}
          teamId={p.teamId}
          size={110}
          alt={`${p.teamShort} kit`}
          className="w-[68px] h-[68px] object-contain"
        />
        {SHOW_STATUS_DOT && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full ring-2 ring-white/60 bg-yellow-400" />
        )}
        {p.isCaptain && (
          <span className="absolute -top-1 -left-1 text-[10px] font-extrabold inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-300 text-black border border-yellow-200">
            C
          </span>
        )}
        {!p.isCaptain && p.isVice && (
          <span className="absolute -top-1 -left-1 text-[10px] font-extrabold inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-300 text-black border border-indigo-200">
            V
          </span>
        )}
      </div>
      <div className="mt-1">
        <div className="mx-auto w-[104px] rounded-md overflow-hidden">
          <div className="bg-white text-plum-900 text-[12px] font-semibold text-center py-1 leading-tight truncate">
            {p.name}
          </div>
          <div className="bg-white text-gray-700 text-[11px] text-center py-1 border-t border-gray-200 leading-tight truncate">
            {ft}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Pitch({ lineup, managerName, teamName, entryId }: { 
  lineup: Lineup; 
  managerName?: string; 
  teamName?: string; 
  entryId?: number; 
}) {
  // Gunakan terus XI/bench dari API (tiada auto-promote GK)
  const starters = Array.isArray(lineup.starters) ? lineup.starters : [];
  const bench = Array.isArray(lineup.bench) ? lineup.bench : [];

  const gk = starters.filter((p) => p.pos === 'GK');
  const def = starters.filter((p) => p.pos === 'DEF');
  const mid = starters.filter((p) => p.pos === 'MID');
  const fwd = starters.filter((p) => p.pos === 'FWD');

  // Debug logging
  console.log('Pitch debug - starters:', starters.length);
  console.log('Pitch debug - GK:', gk.length, gk);
  console.log('Pitch debug - DEF:', def.length);
  console.log('Pitch debug - MID:', mid.length);
  console.log('Pitch debug - FWD:', fwd.length);

  const cap = starters.find((p) => p.isCaptain);

  const { ref, scale } = useScale(BASE_W);
  const stageBaseH = (SHOW_HEADER_BANNER ? BANNER_H : 0) + PITCH_H;

  const renderRow = (players: LineupPlayer[], yPercent: number) => {
    const xs = xSlots(players.length);
    const y = yPx(yPercent);
    return players.map((p, i) => (
      <div
        key={`${p.id}-${i}`}
        className="absolute"
        style={{
          left: xs[i],
          top: y - 40, // offset kecil supaya jersey/label align garis padang
          width: CARD_W,
          transform: 'translateX(-50%)',
        }}
      >
        <PlayerCard p={p} />
      </div>
    ));
  };

  return (
    <div className="card p-0 overflow-hidden w-full">
      {/* Wrapper ukur lebar parent dan scale stage */}
      <div ref={ref} className="w-full relative" style={{ height: stageBaseH * scale }}>
        <div
          className="absolute left-1/2 top-0"
          style={{
            width: BASE_W,
            height: stageBaseH,
            transform: `translateX(-50%) scale(${scale})`,
            transformOrigin: 'top center',
          }}
        >
          {/* Banner atas (pilihan) */}
          {SHOW_HEADER_BANNER && (
            <div
              className="mx-3 mt-3 rounded-t-xl overflow-hidden"
              style={{
                height: BANNER_H,
                background: 'linear-gradient(90deg,#3DE0FF 0%,#7B61FF 45%,#9B25FF 100%)',
              }}
            >
              <div className="h-full flex items-center justify-center px-4 text-white font-extrabold text-sm">
                {managerName && teamName && entryId && (
                  <div className="text-center">
                    <div className="text-xs font-semibold opacity-90">{managerName}</div>
                    <div className="text-[10px] opacity-75">{teamName} (ID: {entryId})</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Padang PNG + pemain */}
          <div className="relative mx-3" style={{ height: PITCH_H }}>
            <Image
              src={PITCH_IMG}
              alt="Pitch"
              fill
              sizes="928px"
              priority
              unoptimized
              className="absolute inset-0 object-cover select-none pointer-events-none z-0"
              onError={(e) => {
                // Fallback ke SVG jika PNG gagal
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const svgFallback = document.createElement('div');
                svgFallback.innerHTML = `
                  <svg width="100%" height="100%" viewBox="0 0 928 650" className="absolute inset-0">
                    <rect width="100%" height="100%" fill="#2a5d31"/>
                    <rect x="50" y="50" width="828" height="550" fill="none" stroke="#ffffff" stroke-width="2"/>
                    <circle cx="464" cy="325" r="50" fill="none" stroke="#ffffff" stroke-width="2"/>
                    <line x1="464" y1="50" x2="464" y2="600" stroke="#ffffff" stroke-width="2"/>
                    <rect x="50" y="200" width="100" height="250" fill="none" stroke="#ffffff" stroke-width="2"/>
                    <rect x="778" y="200" width="100" height="250" fill="none" stroke="#ffffff" stroke-width="2"/>
                  </svg>
                `;
                target.parentNode?.appendChild(svgFallback.firstChild as Node);
              }}
            />

            {SHOW_CAPTAIN_ELLIPSE && cap && (
              <div
                className="absolute border-2 border-white/70 rounded-full"
                style={{
                  width: 340,
                  height: 110,
                  left: (BASE_W - 340) / 2,
                  top: yPx(ROW_Y.FWD) - 58,
                  filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.35))',
                }}
              />
            )}

            {renderRow(gk, ROW_Y.GK)}
            {renderRow(def, ROW_Y.DEF)}
            {renderRow(mid, ROW_Y.MID)}
            {renderRow(fwd, ROW_Y.FWD)}
          </div>
        </div>
      </div>

      {/* Bench (tidak di-scale untuk kekalkan kebolehbacaan) */}
      <div
        className="mx-3 mb-3 rounded-xl overflow-hidden border border-white/15"
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))' }}
      >
        <div className="px-3 py-2 text-[11px] text-white/80">Substitutes</div>
        <div className="px-3 pb-3">
          <div className="grid grid-cols-4 gap-3">
            {bench.map((p, i) => (
              <div key={p.id} className="flex flex-col items-center">
                <div className="relative w-[56px] h-[56px] md:w-[60px] md:h-[60px] rounded-md bg-white/10 border border-white/30 overflow-hidden flex items-center justify-center">
                  <DirectKitImage
                    role={p.pos === 'GK' ? 'gk' : 'outfield'}
                    teamCode={p.teamCode}
                    teamId={p.teamId}
                    size={66}
                    alt={`${p.teamShort} kit`}
                    className="w-[48px] h-[48px] md:w-[52px] md:h-[52px] object-contain"
                  />
                  {/* Tiada status dot pada bench */}
                  {SHOW_STATUS_DOT_BENCH && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full ring-2 ring-white/60 bg-yellow-400" />
                  )}
                </div>
                <div className="mt-1 w-[96px] md:w-[104px]">
                  <div className="mx-auto w-full rounded-md overflow-hidden">
                    <div className="bg-white text-plum-900 text-[10px] md:text-[11px] font-semibold text-center py-1 truncate">
                      {p.name}
                    </div>
                    <div className="bg-white text-gray-600 text-[9px] md:text-[10px] text-center py-1 border-t border-gray-200 truncate">
                      {fixturesText(p)}
                    </div>
                  </div>
                </div>
                <div className="mt-1 text-[10px] text-white/80 font-semibold">
                  {i === 0 ? 'GKP' : `${i}. ${p.pos}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}