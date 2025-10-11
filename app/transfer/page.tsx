'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import SuggestionCard from '@/components/SuggestionCard';

type TransferSuggestion = {
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

export default function TransferPage() {
  const [entryId, setEntryId] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<TransferSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('transferData');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        
        // Transform suggestions to ensure proper structure
        const transformedSuggestions: TransferSuggestion[] = (data.suggestions || []).map((s: any, index: number) => ({
          pos: s.pos || 'N/A',
          outId: s.outId || index,
          outName: s.outName || 'Unknown Player',
          priceOut: s.priceOut || 0,
          ePtsOut: s.ePtsOut || 0,
          inId: s.inId || index,
          inName: s.inName || 'Unknown Player',
          priceIn: s.priceIn || 0,
          ePtsIn: s.ePtsIn || 0,
          delta: s.delta || 0
        }));
        
        setSuggestions(transformedSuggestions);
        setEntryId(data.entryId || '');
        setHasData(true);
      } catch (err) {
        console.error('Error loading saved data:', err);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryId.trim()) return;

    setLoading(true);
    setError(null);
    setSuggestions([]);

    try {
      const response = await fetch(`/api/recommendations?entryId=${entryId}&event=next`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get recommendations');
      }

      // Transform the data to match our interface
      const transformedSuggestions: TransferSuggestion[] = data.suggestions.map((s: any, index: number) => ({
        pos: s.pos,
        outId: s.outId,
        outName: s.outName,
        priceOut: s.priceOut,
        ePtsOut: s.ePtsOut,
        inId: s.inId,
        inName: s.inName,
        priceIn: s.priceIn,
        ePtsIn: s.ePtsIn,
        delta: s.delta
      }));

      setSuggestions(transformedSuggestions);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="card p-4 lg:p-5 mb-6 lg:mb-8">
          <div className="text-center">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white mb-2">Cadangan Transfer</h1>
            <p className="text-white/80">Dapatkan cadangan transfer yang dikuasakan AI untuk pasukan FPL anda</p>
          </div>
        </div>

        {/* Form - only show if no data */}
        {!hasData && (
          <div className="card p-4 lg:p-5 mb-6 lg:mb-8">
            <form onSubmit={handleSubmit} className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="entryId" className="block text-sm font-medium text-white/90 mb-2">
                  ID Pasukan FPL
                </label>
                <input
                  type="text"
                  id="entryId"
                  value={entryId}
                  onChange={(e) => setEntryId(e.target.value)}
                  placeholder="Masukkan ID Pasukan FPL anda (cth: 123456)"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent text-white placeholder-white/60"
                  required
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-brand-green text-white font-semibold rounded-lg hover:bg-brand-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Menganalisis...' : 'Dapatkan Cadangan'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Show current team info if data exists */}
        {hasData && (
          <div className="card p-4 lg:p-5 mb-6 lg:mb-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Analisis Pasukan Semasa</h3>
              <p className="text-white/80">Cadangan transfer untuk ID Pasukan: {entryId}</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="card p-4 lg:p-5 mb-6 lg:mb-8 border-red-500/30 bg-red-500/10">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-4">
            <div className="card p-4 lg:p-5 mb-6 lg:mb-8">
              <h2 className="text-xl font-semibold text-white mb-2">
                Cadangan Transfer Disyorkan ({suggestions.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-4xl mx-auto">
              {suggestions.map((suggestion, index) => (
                <SuggestionCard
                  key={`${suggestion.outId}-${suggestion.inId}-${suggestion.pos}`}
                  pos={suggestion.pos}
                  outName={suggestion.outName}
                  inName={suggestion.inName}
                  priceOut={suggestion.priceOut}
                  priceIn={suggestion.priceIn}
                  ePtsOut={suggestion.ePtsOut}
                  ePtsIn={suggestion.ePtsIn}
                  delta={suggestion.delta}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state - only show if no data and no suggestions */}
        {!hasData && !loading && suggestions.length === 0 && !error && (
          <div className="card p-8 lg:p-12 text-center">
            <div className="text-white/40 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Tiada cadangan lagi</h3>
            <p className="text-white/80">Masukkan ID Pasukan FPL anda di atas untuk mendapatkan cadangan transfer yang diperibadikan</p>
          </div>
        )}

        {/* No suggestions message when data exists but no suggestions */}
        {hasData && suggestions.length === 0 && !loading && !error && (
          <div className="card p-8 lg:p-12 text-center">
            <div className="text-white/40 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Tiada cadangan transfer</h3>
            <p className="text-white/80">Pasukan anda sudah dioptimumkan. Tiada transfer yang disyorkan pada masa ini.</p>
          </div>
        )}
      </div>
    </main>
  );
}
