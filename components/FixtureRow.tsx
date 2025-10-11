// components/FixtureRow.tsx
'use client';
import React from 'react';

type TeamSide = {
  id: number;
  code?: number;
  name: string;
  short: string;
  crest?: string; // jika API sudah beri URL crest; jika tidak, tetap ok
};

export type MatchItem = {
  status: 'FINISHED' | 'UPCOMING' | 'LIVE';
  home: TeamSide;
  away: TeamSide;
  timeLocal: string;
  score: { home: number; away: number } | null;
};

function Crest({ src, alt, teamId }: { src: string; alt: string; teamId?: number }) {
  const [currentSrc, setCurrentSrc] = React.useState(src);
  const [hasError, setHasError] = React.useState(false);

  // Build fallback URLs
  const fallbackUrls = React.useMemo(() => {
    if (!teamId) return [src];
    return [
      src,
      `https://resources.premierleague.com/premierleague/badges/50/t${teamId}.png`,
      `https://resources.premierleague.com/premierleague/badges/110/t${teamId}.png`,
      '/crests/fallback.svg'
    ];
  }, [src, teamId]);

  const [urlIndex, setUrlIndex] = React.useState(0);

  React.useEffect(() => {
    setCurrentSrc(src);
    setHasError(false);
    setUrlIndex(0);
  }, [src]);

  const handleError = () => {
    console.log(`Crest error for ${alt}: ${currentSrc}`);
    if (urlIndex < fallbackUrls.length - 1) {
      setUrlIndex(urlIndex + 1);
      setCurrentSrc(fallbackUrls[urlIndex + 1]);
    } else {
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-gray-200 border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
        <span className="text-xs font-bold text-gray-600">{alt.charAt(0)}</span>
      </div>
    );
  }

  return (
    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={currentSrc}
        alt={alt}
        className="w-4 h-4 sm:w-5 sm:h-5 object-contain"
        onError={handleError}
        onLoad={() => setHasError(false)}
      />
    </div>
  );
}

export default function FixtureRow({ item }: { item: MatchItem }) {
  const middle =
    item.status === 'FINISHED' && item.score ? (
      <div className="flex flex-col items-center gap-0.5 sm:gap-1">
        <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-slate-100 ring-1 ring-slate-200 text-[10px] sm:text-xs font-semibold text-slate-700">
          {item.score.home}-{item.score.away}
        </span>
        <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-slate-100 ring-1 ring-slate-200 text-[9px] sm:text-xs text-slate-700">Selesai</span>
      </div>
    ) : item.status === 'UPCOMING' ? (
      <div className="flex flex-col items-center gap-0.5 sm:gap-1">
        <span className="text-xs sm:text-sm font-semibold text-slate-800">{item.timeLocal}</span>
        <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-slate-50 ring-1 ring-slate-200 text-[9px] sm:text-xs text-slate-700">Akan datang</span>
      </div>
    ) : item.status === 'LIVE' ? (
      <div className="flex flex-col items-center gap-0.5 sm:gap-1">
        <span className="text-xs sm:text-sm font-semibold text-slate-800">{item.timeLocal}</span>
        <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-rose-50 ring-1 ring-rose-200 text-[9px] sm:text-xs text-rose-700">
          Live
        </span>
      </div>
    ) : (
      <span className="text-xs sm:text-sm font-semibold text-slate-800">{item.timeLocal}</span>
    );

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4 py-2 sm:py-3">
      {/* Home */}
      <div className="flex items-center gap-1.5 sm:gap-2 justify-end min-w-0">
        <div className="text-right font-medium truncate text-slate-900 text-xs sm:text-sm">
          <span className="sm:hidden">{item.home.short}</span>
          <span className="hidden sm:inline">{item.home.name}</span>
        </div>
        <Crest src={item.home.crest || `/crests/fallback.svg`} alt={item.home.short} teamId={item.home.id} />
      </div>

      {/* Middle */}
      <div className="flex items-center justify-center w-32 sm:w-44">{middle}</div>

      {/* Away */}
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
        <Crest src={item.away.crest || `/crests/fallback.svg`} alt={item.away.short} teamId={item.away.id} />
        <div className="font-medium truncate text-slate-900 text-xs sm:text-sm">
          <span className="sm:hidden">{item.away.short}</span>
          <span className="hidden sm:inline">{item.away.name}</span>
        </div>
      </div>
    </div>
  );
}