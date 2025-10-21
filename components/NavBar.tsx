'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState, memo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Logo from './Logo';

  const mainLinks = [
    { href: '/', label: 'Utama' },
    { href: '/live-gameweek', label: 'Live' },
    { href: '/fpl-squad', label: 'Squad' },
    { href: '/captain', label: 'Captain' },
  ];

  const toolLinks = [
    { href: '/fixture-planner', label: 'Fixtures' },
    { href: '/chip-strategy', label: 'Chips' },
    { href: '/differential-finder', label: 'Diff' },
    { href: '/budget-optimizer', label: 'Budget' },
  ];

  const infoLinks = [
    { href: '/mini-league', label: 'League' },
    { href: '/fpl-analytics', label: 'Analytics' },
    { href: '/news', label: 'News' },
    { href: '/notifications', label: 'Alerts' },
    { href: '/price-changes', label: 'Prices' },
  ];

  const baseLinks = [...mainLinks, ...toolLinks, ...infoLinks];

const transferLink = { href: '/transfer', label: 'Transfer' };

const NavItem = memo(({ href, label }: { href: string; label: string }) => {
  const pathname = usePathname();
  const active = pathname === href;
  
  return (
    <Link
      href={href}
      className={`relative pb-1 text-[11px] lg:text-[12px] font-medium transition-all duration-200 cursor-pointer group ${
        active ? 'text-black' : 'text-black/70 hover:text-black'
      }`}
    >
      <span>{label}</span>
      <span
        className={`absolute left-0 bottom-0 h-[1.5px] w-full bg-black transition-all duration-200 ${
          active ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0 group-hover:opacity-50 group-hover:scale-x-50'
        }`}
      />
    </Link>
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
      <div className="mx-auto max-w-7xl px-3">
        {/* Compact Panel */}
        <div className="h-14 rounded-xl border border-black bg-white shadow-[0_2px_0_#000,0_4px_15px_rgba(0,0,0,0.06)] relative">
          {/* Grid layout: brand | nav (desktop) | actions */}
          <div className="flex items-center justify-between h-full px-3">
            {/* Brand kiri */}
            <Link href="/" className="select-none">
              <Logo size="sm" showText={true} />
            </Link>

            {/* Desktop Navigation dengan grouping */}
            <nav className="hidden lg:flex flex-1 justify-center">
              <div className="flex items-center gap-4">
                {/* Main Links */}
                <ul className="flex items-center gap-2.5">
                  {mainLinks.map((link) => (
                    <li key={link.href}>
                      <NavItem href={link.href} label={link.label} />
                    </li>
                  ))}
                  {showTransfer && (
                    <li key={transferLink.href}>
                      <NavItem href={transferLink.href} label={transferLink.label} />
                    </li>
                  )}
                </ul>

                {/* Divider */}
                <div className="h-4 w-px bg-black/20"></div>

                {/* Tool Links */}
                <ul className="flex items-center gap-2.5">
                  {toolLinks.map((link) => (
                    <li key={link.href}>
                      <NavItem href={link.href} label={link.label} />
                    </li>
                  ))}
                </ul>

                {/* Divider */}
                <div className="h-4 w-px bg-black/20"></div>

                {/* Info Links */}
                <ul className="flex items-center gap-2.5">
                  {infoLinks.map((link) => (
                    <li key={link.href}>
                      <NavItem href={link.href} label={link.label} />
                    </li>
                  ))}
                </ul>
              </div>
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center h-8 rounded-lg bg-black px-3 text-[12px] font-medium text-white shadow-[0_1px_0_#000] hover:bg-black/90 transition-all duration-200"
              >
                Mula Sekarang
              </Link>
            </div>

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-all duration-200"
              aria-label="Toggle mobile menu"
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
            <div className="lg:hidden border-t border-gray-200 bg-white rounded-b-xl shadow-lg">
              <nav className="px-3 py-3">
                <ul className="grid grid-cols-2 gap-2">
                  {allLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`block px-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-200 text-center ${
                          pathname === link.href 
                            ? 'bg-black text-white' 
                            : 'text-black hover:bg-gray-100'
                        }`}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <Link
                    href="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full px-3 py-2 rounded-lg bg-black text-white text-[13px] font-medium text-center hover:bg-black/90 transition-all duration-200"
                  >
                    Mula Sekarang
                  </Link>
                </div>
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
