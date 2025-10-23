'use client';

import React, { memo } from 'react';
import Logo from './Logo';

const Footer = memo(function Footer() {
  return (
    <footer className="bg-white text-slate-800 py-8 mt-16 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main Footer Content */}
        <div className="text-center mb-8">
               {/* Brand Section */}
               <div className="flex flex-col items-center mb-4">
                 <Logo size="lg" showText={false} className="gap-0 mb-2" />
                 <span className="text-2xl font-extrabold tracking-tight text-black">FPLZERO</span>
               </div>
          <p className="text-slate-600 text-sm leading-relaxed max-w-2xl mx-auto">
            Platform analisis FPL terbaik dengan AI-powered insights untuk membantu anda mencapai kejayaan dalam Fantasy Premier League.
          </p>
        </div>

        {/* Sponsors Section */}
        <div className="border-t border-slate-200 pt-8">
          <div className="text-center mb-8">
            <h3 className="text-lg font-semibold mb-2 text-slate-900">Sponsor Rasmi</h3>
            <p className="text-slate-600 text-sm">Terima kasih kepada rakan kongsi kami</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center">
            {/* Cursor AI */}
            <div className="text-center">
              <div className="w-24 h-16 flex items-center justify-center">
                <div className="w-24 h-16 rounded-lg flex items-center justify-center overflow-hidden">
                  <img 
                    src="https://www.logoshape.com/wp-content/uploads/2025/03/Cursor_Vector_Logo.png" 
                    alt="Cursor AI" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = `
                        <div class="w-24 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                          </svg>
                        </div>
                      `;
                    }}
                  />
                </div>
              </div>
            </div>

            {/* EA Sports */}
            <div className="text-center">
              <div className="w-24 h-16 flex items-center justify-center">
                <div className="w-24 h-16 rounded-lg flex items-center justify-center overflow-hidden">
                  <img 
                    src="https://resources.premierleague.com/premierleague25/partners/sponsors-light-theme/ea.png" 
                    alt="EA Sports" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = `
                        <div class="w-24 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                          <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                          </svg>
                        </div>
                      `;
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Football Manager */}
            <div className="text-center">
              <div className="w-24 h-16 flex items-center justify-center">
                <div className="w-24 h-16 rounded-lg flex items-center justify-center overflow-hidden">
                  <img 
                    src="https://resources.premierleague.com/premierleague25/partners/sponsors-light-theme/f-m.png" 
                    alt="Football Manager" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = `
                        <div class="w-24 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                        </div>
                      `;
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Barclays */}
            <div className="text-center">
              <div className="w-24 h-16 flex items-center justify-center">
                <div className="w-24 h-16 rounded-lg flex items-center justify-center overflow-hidden">
                  <img 
                    src="https://resources.premierleague.pulselive.com/photo-resources/2023/01/26/11fe030b-2b2e-41ed-8f34-be72a8403ea0/Barclays_Sponsor.png?width=115&height=40" 
                    alt="Barclays" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = `
                        <div class="w-24 h-16 bg-gradient-to-br from-red-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                          </svg>
                        </div>
                      `;
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-200 pt-6 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-slate-600">
            <p>&copy; 2024 FPLZERO. Hak cipta terpelihara.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Disclaimer</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
});

export default Footer;
