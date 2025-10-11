// components/KitImage.tsx
'use client';
import React from 'react';

type Props = {
  teamCode?: number;
  teamId?: number;
  size?: 110 | 66;
  role?: 'gk' | 'outfield' | 'crest';
  className?: string;
  alt?: string;
};

export default function KitImage({
  teamCode,
  teamId,
  size = 110,
  role = 'outfield',
  className,
  alt,
}: Props) {
  const base = `/api/kit?teamCode=${teamCode ?? 0}&teamId=${teamId ?? 0}&size=${size}`;
  const paths = [
    `${base}&role=${role}`,           // contoh: gk
    `${base}&role=outfield`,          // fallback
    `${base}&role=crest`,             // fallback crest
  ];

  const [idx, setIdx] = React.useState(0);

  React.useEffect(() => {
    setIdx(0);
  }, [teamCode, teamId, size, role]);

  const src = paths[Math.min(idx, paths.length - 1)];

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt || 'kit'}
      className={className}
      onError={() => {
        if (idx < paths.length - 1) setIdx(idx + 1);
      }}
    />
  );
}