'use client';
import React from 'react';

type Props = {
  teamCode?: number;
  teamId?: number;
  size?: 70 | 50;
  className?: string;
  alt?: string;
};

export default function DirectCrestImage({ teamCode, teamId, size = 70, className, alt }: Props) {
  // Build URLs directly without API
  const buildDirectUrls = () => {
    const urls: string[] = [];
    
    // Try FPL badges first
    if (teamCode && teamCode > 0) {
      urls.push(
        `https://fantasy.premierleague.com/dist/img/badges/badge_${teamCode}-${size}.png`,
        `https://fantasy.premierleague.com/dist/img/badges/badge_${teamCode}_${size}.png`,
        `https://fantasy.premierleague.com/dist/img/badges/${teamCode}.png`
      );
    }
    
    // Try Premier League badges
    if (teamId && teamId > 0) {
      urls.push(
        `https://resources.premierleague.com/premierleague/badges/${size}/t${teamId}.png`,
        `https://resources.premierleague.com/premierleague/badges/70/t${teamId}.png`
      );
    }
    
    return urls;
  };

  const urls = buildDirectUrls();
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setCurrentIndex(0);
    setHasError(false);
  }, [teamCode, teamId, size]);

  const currentUrl = urls[currentIndex] || '';

  const handleError = () => {
    console.log(`DirectCrestImage error for teamCode=${teamCode}, teamId=${teamId}, size=${size}, idx=${currentIndex}`);
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
      alt={alt || 'crest'}
      className={className}
      onError={handleError}
      onLoad={() => setHasError(false)}
    />
  );
}
