// components/CrestChain.tsx
'use client';
import React from 'react';
import { crestSlug } from '@/lib/crests/slugs';

type Props = {
  short?: string;
  name?: string;
  teamCode?: number;
  teamId?: number;
  size?: 50 | 70;
  className?: string;
  alt?: string;
  preferLocal?: boolean; // default false
};

export default function CrestChain({
  short,
  name,
  teamCode,
  teamId,
  size = 50,
  className,
  alt,
  preferLocal = false,
}: Props) {
  const slug = crestSlug(short, name);
  const remote = `/api/crest?teamCode=${teamCode ?? 0}&teamId=${teamId ?? 0}&size=${size}`;
  const localSvg = `/crests/clubs/${slug}.svg`;
  const localPng = `/crests/clubs/${slug}.png`;

  const sources = preferLocal
    ? [localSvg, localPng, remote, '/crests/fallback.svg']
    : [remote, localSvg, localPng, '/crests/fallback.svg'];

  const [i, setI] = React.useState(0);
  React.useEffect(() => setI(0), [slug, teamCode, teamId, size, preferLocal]);

  const src = sources[Math.min(i, sources.length - 1)];

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt || short || name || 'crest'}
      className={className}
      onError={() => setI((v) => Math.min(v + 1, sources.length - 1))}
    />
  );
}
