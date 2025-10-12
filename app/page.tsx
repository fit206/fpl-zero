// app/page.tsx
'use client';

import React from 'react';
import SuggestionCard from '@/components/SuggestionCard';
import Pitch from '@/components/Pitch';

type Suggestion = {
  pos: string;
  outId: number;
  outName: string;
  priceOut: number;
  ePtsOut: number;
  inId: number;
  inName: string;
  priceIn: number;
  ePtsIn: number;
  delta: number;
};

type RecommendationResponse = {
  gw: number;
  bank: number;
  suggestions: Suggestion[];
  lineup?: {
    starters: any[];
    bench: any[];
  };
  managerName?: string;
  teamName?: string;
  entryId?: number;
};

function formatBank(bank: number) {
  return `£${bank.toFixed(1)}m`;
}

export default function HomePage() {
  const [entryId, setEntryId] = React.useState<string>('');
  const [data, setData] = React.useState<RecommendationResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [proMode, setProMode] = React.useState(false);
  // Load saved data on component mount
  React.useEffect(() => {
    console.log('HomePage: Loading saved data from localStorage');
    const savedData = localStorage.getItem('transferData');
    const savedProMode = localStorage.getItem('proMode');
    
    console.log('HomePage: savedData =', savedData);
    console.log('HomePage: savedProMode =', savedProMode);
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        console.log('HomePage: parsedData =', parsedData);
        
        if (parsedData.entryId && parsedData.managerName && parsedData.teamName) {
          console.log('HomePage: Setting entryId to', parsedData.entryId.toString());
          setEntryId(parsedData.entryId.toString());
          
          // Reconstruct the data object for display
          setData({
            managerName: parsedData.managerName,
            teamName: parsedData.teamName,
            entryId: parsedData.entryId,
            suggestions: parsedData.suggestions || [],
            lineup: parsedData.lineup,
            gw: parsedData.gw || 0,
            bank: parsedData.bank || 0,
            // Add other required fields with default values
          });
          console.log('HomePage: Data loaded successfully');
        } else {
          console.log('HomePage: Missing required fields in saved data');
        }
      } catch (err) {
        console.error('Error loading saved data:', err);
      }
    } else {
      console.log('HomePage: No saved data found');
    }
    
    // Load Pro Mode state
    if (savedProMode) {
      setProMode(savedProMode === 'true');
    }
  }, []);


  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setData(null);
    const idNum = Number(entryId);
    if (!Number.isFinite(idNum) || idNum <= 0) {
      setError('Sila masukkan FPL Team ID yang sah.');
      return;
    }
    setLoading(true);
    try {
      // Pilih endpoint berdasarkan Pro Mode
      const endpoint = proMode ? '/api/recommendations/pro' : '/api/recommendations';
      const eventParam = proMode ? '' : '&event=next';
      const res = await fetch(`${endpoint}?entryId=${idNum}${eventParam}`);
      const json = await res.json();
      console.log('HomePage: API response:', json);
      if (!res.ok) {
        setError(json?.error || 'Ralat tidak diketahui.');
      } else {
        setData(json as RecommendationResponse);
        
        
        // Set localStorage to show Transfer tab
        localStorage.setItem('hasRecommendations', 'true');
        
        // Save transfer data for transfer page
        const dataToSave = {
          suggestions: json.suggestions || [],
          entryId: idNum,
          managerName: json.managerName || 'Unknown Manager',
          teamName: json.teamName || 'Unknown Team',
          lineup: json.lineup,
          gw: json.gw,
          bank: json.bank
        };
        
        console.log('HomePage: Saving data to localStorage:', dataToSave);
        localStorage.setItem('transferData', JSON.stringify(dataToSave));
        
        // Trigger storage event for other tabs
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'hasRecommendations',
          newValue: 'true'
        }));
      }
    } catch {
      setError('Ralat rangkaian. Cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {/* Hero / Stat block ala FPL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 mb-6 lg:mb-8">
          <div className="lg:col-span-2 card p-4 lg:p-5">
            <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Penasihat Transfer FPL</h1>
            <p className="mt-1 text-xs sm:text-sm muted">
              Dapatkan cadangan transfer terbaik untuk Fantasy Premier League
            </p>
            {/* Pro Mode Toggle */}
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={proMode}
                  onChange={(e) => {
                    setProMode(e.target.checked);
                    localStorage.setItem('proMode', e.target.checked.toString());
                  }}
                  className="w-4 h-4 rounded border-white/20 bg-plum-700/50 text-brand-cyan focus:ring-brand-cyan focus:ring-2"
                />
                <span className="text-xs sm:text-sm font-medium text-white/90">
                  Mod Pro Masa Nyata
                </span>
              </label>
              {proMode && (
                <span className="px-2 py-1 text-xs font-bold bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30 rounded-full w-fit">
                  PRO
                </span>
              )}
            </div>
          </div>
            </div>

            <form onSubmit={onSubmit} className="mt-4 lg:mt-5">
              <label htmlFor="entry" className="block text-xs sm:text-sm font-medium muted mb-2">
                ID Pasukan FPL
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  id="entry"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={entryId}
                  onChange={(e) => setEntryId(e.target.value)}
                  placeholder="Contoh: 317033"
                  className="w-full sm:flex-1 rounded-xl bg-plum-700/70 border border-white/10 px-3 py-2 text-sm sm:text-base text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand-purple"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl px-4 py-2 text-sm sm:text-base font-bold text-plum-900 whitespace-nowrap"
                  style={{
                    background:
                      'linear-gradient(90deg, #3DE0FF 0%, #7B61FF 45%, #9B25FF 100%)',
                  }}
                >
                  {loading ? 'Memuat...' : 'Dapatkan Cadangan'}
                </button>
              </div>

              {error && (
                <div className="mt-3 rounded-lg border border-red-400/30 bg-red-500/10 text-red-200 px-3 py-2 text-sm">
                  {error}
                </div>
              )}
            </form>
          </div>

          {/* Info bar ala tiles */}
          <div className="card p-4 lg:p-5 flex flex-col justify-between">
            <div className="text-xs sm:text-sm muted">Status</div>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:gap-3">
              <div className="rounded-xl bg-plum-700/60 border border-white/10 p-2 sm:p-3">
                <div className="text-xs muted">Gameweek</div>
                <div className="text-lg sm:text-xl font-extrabold">
                  {data && typeof data.gw === 'number' ? data.gw : '-'}
                </div>
              </div>
              <div className="rounded-xl bg-plum-700/60 border border-white/10 p-2 sm:p-3">
                <div className="text-xs muted">Bank</div>
                <div className="text-lg sm:text-xl font-extrabold text-brand-green">
                  {data && typeof data.bank === 'number' ? formatBank(data.bank) : '-'}
                </div>
              </div>
            </div>
            <div className="mt-3 sm:mt-4 text-[10px] sm:text-[11px] muted">
              {proMode ? (
                <>
                  <div className="font-semibold text-brand-cyan text-xs">Mod Pro: Odds + API-Football</div>
                  <div className="text-[10px]">Model ePts advanced dengan clean sheet & goals expectancy</div>
                </>
              ) : (
                'Model ePts ringkas (form+PPG+FDR+minutes).'
              )}
            </div>
          </div>
        </div>


        {/* Lineup Pitch */}
        {data?.lineup?.starters?.length ? (
          <div className="mb-6 lg:mb-8">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-extrabold">Formasi Pasukan</h2>
            </div>
            <div className="flex justify-center overflow-x-auto">
              <Pitch 
                lineup={data.lineup} 
                managerName={data.managerName}
                teamName={data.teamName}
                entryId={data.entryId}
              />
            </div>
          </div>
        ) : null}

        {/* Transfer suggestions moved to /transfer page */}
      </div>
    </main>
  );
}