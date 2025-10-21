// components/SuggestionCard.tsx
import React from 'react';

type Props = {
  pos: string;
  outName: string;
  inName: string;
  priceOut: number;
  priceIn: number;
  ePtsOut: number;
  ePtsIn: number;
  delta: number;
};

function posClasses(pos: string) {
  switch (pos) {
    case 'GK':
    case 'GKP':
      return 'bg-sky-100 text-sky-700 ring-sky-200';
    case 'DEF':
      return 'bg-indigo-100 text-indigo-700 ring-indigo-200';
    case 'MID':
      return 'bg-emerald-100 text-emerald-700 ring-emerald-200';
    case 'FWD':
      return 'bg-rose-100 text-rose-700 ring-rose-200';
    default:
      return 'bg-gray-100 text-gray-700 ring-gray-200';
  }
}

export default function SuggestionCard({
  pos,
  outName,
  inName,
  priceOut,
  priceIn,
  ePtsOut,
  ePtsIn,
  delta,
}: Props) {
  const deltaStr = `${delta > 0 ? '+' : ''}${delta.toFixed(2)}`;

  return (
    <div className="bg-white rounded-xl p-3 sm:p-4 w-full shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <span
          className={`px-2 py-1 rounded-full text-[10px] sm:text-[11px] font-bold ring ${posClasses(pos)}`}
        >
          {pos === 'GK' ? 'GKP' : pos}
        </span>
        <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] sm:text-[11px]">
          <svg width="10" height="10" viewBox="0 0 24 24" className="fill-emerald-700">
            <path d="M13 5l7 7-1.41 1.41L14 9.83V20h-2V9.83l-4.59 4.58L6 12l7-7z" />
          </svg>
          Δ ePts: {deltaStr}
        </span>
      </div>

      <div className="space-y-1 sm:space-y-2">
        <div className="text-[11px] sm:text-[12px] text-gray-500 tracking-wide">OUT</div>
        <div className="font-semibold text-gray-900 text-sm sm:text-base truncate">{outName}</div>

        <div className="text-[11px] sm:text-[12px] text-gray-500 tracking-wide">IN</div>
        <div className="font-semibold text-emerald-600 text-sm sm:text-base truncate">{inName}</div>

        <div className="mt-2 sm:mt-3 grid grid-cols-2 gap-2 text-xs sm:text-sm">
          <div>
            <div className="text-[10px] sm:text-[12px] text-gray-500">Harga</div>
            <div className="font-medium text-gray-700 text-[11px] sm:text-sm">
              £{priceOut.toFixed(1)}m → £{priceIn.toFixed(1)}m
            </div>
          </div>
          <div>
            <div className="text-[10px] sm:text-[12px] text-gray-500">ePts</div>
            <div className="font-medium text-gray-700 text-[11px] sm:text-sm">
              {ePtsOut.toFixed(2)} → {ePtsIn.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
