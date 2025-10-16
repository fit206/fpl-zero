'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState, memo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Logo from './Logo';

const baseLinks = [
  { href: '/', label: 'Utama' },
  { href: '/fixtures', label: 'Jadual' },
  { href: '/captain', label: 'Kapten' },
  { href: '/news', label: 'Berita' },
  { href: '/highlights', label: 'Highlights' },
  { href: '/fpl-analytics', label: 'FPL Analytics' },
  { href: '/fpl-squad', label: 'FPL Squad' },
];

const transferLink = { href: '/transfer', label: 'Transfer' };

const NavItem = memo(({ href, label }: { href: string; label: string }) => {
  const pathname = usePathname();
  const active = pathname === href;
  
  return (
    <a
      href={href}
      className={`relative pb-2 text-[14px] md:text-[15px] font-semibold transition cursor-pointer ${
        active ? 'text-black' : 'text-black/80 hover:text-black'
      }`}
    >
      {label}
      <span
        className={`absolute left-0 bottom-0 h-[2px] w-full bg-black transition-opacity ${
          active ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </a>
  );
});

function NavBarContent() {
  const [showTransfer, setShowTransfer] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const handleStorageChange = useCallback((e: StorageEvent) => {
    if (e.key === 'hasRecommendations') {
      setShowTransfer(e.newValue === 'true');
    }
  }, []);

  useEffect(() => {
    // Check if user has recommendations (has team ID)
    const hasRecommendations = localStorage.getItem('hasRecommendations') === 'true';
    setShowTransfer(hasRecommendations);
  }, []);

  // Listen for storage changes from other tabs
  useEffect(() => {
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [handleStorageChange]);

  const allLinks = showTransfer ? [...baseLinks, transferLink] : baseLinks;

  return (
    <div className="sticky top-3 z-50 w-full">
      <div className="mx-auto max-w-6xl px-3">
        {/* Panel putih border hitam */}
        <div className="h-12 rounded-2xl border border-black bg-white shadow-[0_2px_0_#000,0_6px_20px_rgba(0,0,0,0.06)] relative">
          {/* Grid layout: brand | nav (desktop) | hamburger (mobile) */}
          <div className="flex items-center justify-between h-full px-3">
            {/* Brand kiri */}
            <a href="/" className="select-none">
              <Logo size="md" showText={true} />
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex flex-1 justify-center">
              <ul className="flex items-center gap-6">
                {allLinks.map((l) => (
                  <li key={l.href}>
                    <NavItem href={l.href} label={l.label} />
                  </li>
                ))}
              </ul>
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center">
              <a
                href="/"
                className="inline-flex items-center justify-center h-9 rounded-full bg-black px-4 text-[15px] font-semibold text-white shadow-[0_1px_0_#000] hover:bg-black/90 transition"
              >
                Mula Sekarang
              </a>
            </div>

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-5 h-5 flex flex-col justify-center items-center">
                <span className={`block w-4 h-0.5 bg-black transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-1' : ''}`} />
                <span className={`block w-4 h-0.5 bg-black transition-all duration-300 mt-1 ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
                <span className={`block w-4 h-0.5 bg-black transition-all duration-300 mt-1 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1' : ''}`} />
              </div>
            </button>
          </div>

          {/* Mobile Dropdown Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 bg-white rounded-b-2xl">
              <nav className="px-4 py-3">
                <ul className="space-y-2">
                  {allLinks.map((l) => (
                    <li key={l.href}>
                      <a
                        href={l.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`block px-3 py-2 rounded-lg text-[15px] font-semibold transition-colors ${
                          pathname === l.href 
                            ? 'bg-black text-white' 
                            : 'text-black hover:bg-gray-100'
                        }`}
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                  <li className="pt-2">
                    <a
                      href="/"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full px-3 py-2 rounded-lg bg-black text-white text-[15px] font-semibold text-center hover:bg-black/90 transition-colors"
                    >
                      Mula Sekarang
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Export with dynamic import to prevent hydration issues
export default dynamic(() => Promise.resolve(NavBarContent), {
  ssr: false
});
