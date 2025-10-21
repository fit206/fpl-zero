'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const Logo = ({ size = 'md', showText = true, className = '' }: LogoProps) => {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl'
  };

  const getLogoSize = () => {
    switch (size) {
      case 'sm': return { width: 36, height: 24 };
      case 'md': return { width: 48, height: 32 };
      case 'lg': return { width: 90, height: 60 };
      default: return { width: 48, height: 32 };
    }
  };

  const logoSize = getLogoSize();

  return (
    <div className={`flex items-center gap-0 ${className}`}>
      <div 
        className="relative"
        style={{ width: logoSize.width, height: logoSize.height }}
      >
        {!imageError ? (
          <>
            <Image 
              src="/fplzero-logo.png" 
              alt="FPLZERO Logo" 
              fill
              sizes="(max-width: 768px) 36px, (max-width: 1024px) 48px, 90px"
              className={`object-contain transition-opacity duration-200 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
              onError={() => setImageError(true)}
              onLoad={() => setIsLoaded(true)}
              loading="lazy"
            />
            {!isLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
                <span className="text-gray-400 text-xs">Loading...</span>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-400 text-xs">Logo</span>
          </div>
        )}
      </div>
      {showText && (
        <span className={`${textSizeClasses[size]} font-extrabold tracking-tight text-black`}>
          FPLZERO
        </span>
      )}
    </div>
  );
};

export default Logo;
