// components/CrestImage.tsx
'use client';
import React from 'react';

type Props = {
  teamCode?: number;
  teamId?: number;
  size?: 70 | 50;
  className?: string;
  alt?: string;
};

export default function CrestImage({ teamCode, teamId, size = 70, className, alt }: Props) {
  const src = `/api/crest?teamCode=${teamCode ?? 0}&teamId=${teamId ?? 0}&size=${size}`;
  const [imgSrc, setImgSrc] = React.useState(src);

  React.useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={alt || 'crest'}
      className={className}
      onError={() => setImgSrc('/crests/fallback.svg')}
    />
  );
}
