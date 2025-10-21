// components/BrandMark.tsx
import React from 'react';

export default function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      role="img"
    >
      <defs>
        <linearGradient id="fplzero-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3DE0FF" />
          <stop offset="50%" stopColor="#7B61FF" />
          <stop offset="100%" stopColor="#9B25FF" />
        </linearGradient>
      </defs>
      {/* Badge */}
      <rect x="1.5" y="1.5" width="21" height="21" rx="6" fill="url(#fplzero-g)" />
      <rect x="1.5" y="1.5" width="21" height="21" rx="6" fill="none" stroke="rgba(255,255,255,0.6)" />
      {/* Bola ringkas */}
      <circle cx="12" cy="12" r="5.4" fill="white" opacity="0.95" />
      <path
        d="M12 8.3l1.55 1.03 1.8.05-.67 1.64.55 1.72-1.72.55-1.51 1.08-1.51-1.08-1.72-.55.55-1.72-.67-1.64 1.8-.05L12 8.3z"
        fill="#221F1F"
        opacity="0.9"
      />
      {/* highlight kecil */}
      <circle cx="10.4" cy="10.2" r="0.7" fill="white" opacity="0.9" />
    </svg>
  );
}
