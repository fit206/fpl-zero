'use client';

import { useState, useEffect } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

export default function PriceChangesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Auto-refresh every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
      setIsLoading(true);
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, []);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleManualRefresh = () => {
    setRefreshKey(prev => prev + 1);
    setIsLoading(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white dark:text-white mb-2">
            FPL Price Changes (Live)
          </h1>
          <p className="text-slate-400 dark:text-slate-400">
            Live price updates from FPL Dashboard
          </p>
        </div>

        {/* Controls Bar */}
        <div className="bg-slate-800 dark:bg-slate-800 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between text-sm text-slate-300 dark:text-slate-300">
            <span>🔄 Auto-refreshes every 10 minutes</span>
            <button
              onClick={handleManualRefresh}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh Now</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12 bg-slate-800 dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-700 dark:border-slate-700">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-slate-400 dark:text-slate-400">
                Loading Live Price Changes...
              </p>
            </div>
          </div>
        )}

        {/* Iframe Container */}
        <div className="relative">
          <iframe
            key={refreshKey}
            src="https://fpldashboard.dev/price-changes"
            className={`
              w-full rounded-2xl shadow-xl border border-slate-700 dark:border-slate-700
              transition-opacity duration-500 ease-in-out
              ${isLoading ? 'opacity-0 absolute' : 'opacity-100'}
            `}
            style={{ height: '90vh' }}
            onLoad={handleIframeLoad}
            title="FPL Price Changes"
            allowFullScreen
          />
        </div>

        {/* Footer Info */}
        <div className="text-center mt-6 text-slate-500 dark:text-slate-500 text-sm">
          <p>Data sourced from FPL Dashboard • Updates automatically every 10 minutes</p>
        </div>
      </div>
    </div>
  );
}
