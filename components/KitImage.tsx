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
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setIdx(0);
    setHasError(false);
  }, [teamCode, teamId, size, role]);

  const src = paths[Math.min(idx, paths.length - 1)];

  const handleError = () => {
    console.log(`KitImage error for teamCode=${teamCode}, teamId=${teamId}, role=${role}, idx=${idx}`);
    console.log(`Current URL: ${src}`);
    if (idx < paths.length - 1) {
      setIdx(idx + 1);
    } else {
      setHasError(true);
    }
  };

  // Debug logging
  React.useEffect(() => {
    console.log(`KitImage render: teamCode=${teamCode}, teamId=${teamId}, role=${role}, size=${size}`);
    console.log(`KitImage URL: ${src}`);
  }, [teamCode, teamId, role, size, src]);

  if (hasError) {
    // Fallback: show team code or a placeholder
    return (
      <div 
        className={`${className} flex items-center justify-center bg-gray-200 text-gray-600 text-xs font-bold`}
        style={{ width: size, height: size }}
      >
        {teamCode || '?'}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt || 'kit'}
      className={className}
      onError={handleError}
      onLoad={() => setHasError(false)}
    />
  );
}