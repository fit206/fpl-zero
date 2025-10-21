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

export default function DirectKitImage({
  teamCode,
  teamId,
  size = 110,
  role = 'outfield',
  className,
  alt,
}: Props) {
  // Build URLs directly without API
  const buildDirectUrls = () => {
    const urls: string[] = [];
    const base = 'https://fantasy.premierleague.com/dist/img/shirts/standard';
    const crest = `https://resources.premierleague.com/premierleague/badges/70/t${teamId}.png`;

    if (role === 'gk') {
      if (teamCode && teamCode > 0) {
        urls.push(
          `${base}/shirt_${teamCode}_1-${size}.png`,
          `${base}/shirt_${teamCode}_1-66.png`,
          `${base}/shirt_${teamCode}-${size}.png`,
          `${base}/shirt_${teamCode}-66.png`
        );
      }
      if (teamId && teamId > 0) urls.push(crest);
    } else if (role === 'outfield') {
      if (teamCode && teamCode > 0) {
        urls.push(
          `${base}/shirt_${teamCode}-${size}.png`,
          `${base}/shirt_${teamCode}-66.png`
        );
      }
      if (teamId && teamId > 0) urls.push(crest);
    } else if (role === 'crest') {
      if (teamCode && teamCode > 0) {
        urls.push(
          `https://fantasy.premierleague.com/dist/img/badges/badge_${teamCode}-70.png`,
          `https://fantasy.premierleague.com/dist/img/badges/badge_${teamCode}_70.png`,
          `https://fantasy.premierleague.com/dist/img/badges/${teamCode}.png`
        );
      }
      if (teamId && teamId > 0) {
        urls.push(crest);
        urls.push(`https://resources.premierleague.com/premierleague/badges/110/t${teamId}.png`);
      }
    }

    return urls;
  };

  const urls = buildDirectUrls();
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setCurrentIndex(0);
    setHasError(false);
  }, [teamCode, teamId, size, role]);

  const currentUrl = urls[currentIndex] || '';

  const handleError = () => {
    console.log(`DirectKitImage error for teamCode=${teamCode}, teamId=${teamId}, role=${role}, idx=${currentIndex}`);
    console.log(`Failed URL: ${currentUrl}`);
    if (currentIndex < urls.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setHasError(true);
    }
  };

  if (hasError || urls.length === 0) {
    return (
      <div 
        className={`${className} flex items-center justify-center bg-gray-200 text-gray-600 text-xs font-bold`}
        style={{ width: size, height: size }}
      >
        {teamCode || teamId || '?'}
      </div>
    );
  }

  return (
    <img
      src={currentUrl}
      alt={alt || 'kit'}
      className={className}
      onError={handleError}
      onLoad={() => setHasError(false)}
    />
  );
}
