'use client';

import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Filter, Star, Target, AlertCircle } from 'lucide-react';

type Player = {
  id: number;
  name: string;
  webName: string;
  team: string;
  teamId: number;
  position: string;
  positionId: number;
  price: number;
  ownership: number;
  form: number;
  pointsPerGame: number;
  totalPoints: number;
  minutes: number;
  goalsScored: number;
  assists: number;
  cleanSheets: number;
  bonus: number;
  upcomingFixtures: any[];
  avgFixtureDifficulty: number;
  differentialScore: number;
  news: string;
  chanceOfPlaying: number | null;
};

type DifferentialData = {
  currentGW: number;
  filters: {
    maxOwnership: number;
    minForm: number;
    position: string;
    maxPrice: number;
  };
  players: Player[];
  byPosition: {
    GKP: Player[];
    DEF: Player[];
    MID: Player[];
    FWD: Player[];
  };
  teams: any[];
};

export default function DifferentialFinderPage() {
  const [data, setData] = useState<DifferentialData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [maxOwnership, setMaxOwnership] = useState(10);
  const [minForm, setMinForm] = useState(0);
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [maxPrice, setMaxPrice] = useState(999);
  const [activeTab, setActiveTab] = useState<'all' | 'GKP' | 'DEF' | 'MID' | 'FWD'>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        maxOwnership: maxOwnership.toString(),
        minForm: minForm.toString(),
        position: selectedPosition,
        maxPrice: maxPrice.toString(),
      });
      
      const res = await fetch(`/api/differential-finder?${params}`);
      const json = await res.json();
      
      if (!res.ok) {
        setError(json?.error || 'Ralat tidak diketahui');
      } else {
        setData(json);
      }
    } catch {
      setError('Ralat rangkaian. Cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return 'bg-green-500/80';
    if (difficulty === 3) return 'bg-yellow-500/80';
    if (difficulty === 4) return 'bg-orange-500/80';
    return 'bg-red-500/80';
  };

  const getDifficultyBg = (difficulty: number) => {
    if (difficulty <= 2) return 'bg-green-500/20 border-green-500/30';
    if (difficulty === 3) return 'bg-yellow-500/20 border-yellow-500/30';
    if (difficulty === 4) return 'bg-orange-500/20 border-orange-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  const getTeamShortName = (teamId: number) => {
    if (!data) return '';
    const team = data.teams.find(t => t.id === teamId);
    return team ? team.shortName : '';
  };

  const getDisplayPlayers = () => {
    if (!data) return [];
    if (activeTab === 'all') return data.players;
    return data.byPosition[activeTab] || [];
  };

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="card p-4 lg:p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-brand-green/20 border border-brand-green/30">
              <Target className="w-6 h-6 text-brand-green" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">Differential Finder</h1>
              <p className="text-sm muted mt-1">
                Cari pemain low ownership dengan potensi tinggi
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-6 p-4 rounded-xl bg-plum-700/30 border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-brand-cyan" />
              <span className="font-semibold text-sm">Filters</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-white/60 mb-1 block">
                  Max Ownership (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={maxOwnership}
                  onChange={(e) => setMaxOwnership(parseFloat(e.target.value))}
                  className="w-full rounded-lg bg-plum-800/70 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan"
                />
              </div>

              <div>
                <label className="text-xs text-white/60 mb-1 block">
                  Min Form
                </label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.5}
                  value={minForm}
                  onChange={(e) => setMinForm(parseFloat(e.target.value))}
                  className="w-full rounded-lg bg-plum-800/70 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan"
                />
              </div>

              <div>
                <label className="text-xs text-white/60 mb-1 block">
                  Max Price (£)
                </label>
                <input
                  type="number"
                  min={4}
                  max={15}
                  step={0.5}
                  value={maxPrice === 999 ? '' : maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value ? parseFloat(e.target.value) : 999)}
                  placeholder="No limit"
                  className="w-full rounded-lg bg-plum-800/70 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan placeholder:text-white/30"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={fetchData}
                  disabled={loading}
                  className="w-full rounded-lg px-4 py-2 text-sm font-bold text-white whitespace-nowrap bg-gradient-to-r from-brand-cyan to-brand-purple hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? 'Mencari...' : 'Apply Filters'}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-3 rounded-lg border border-red-400/30 bg-red-500/10 text-red-200 px-3 py-2 text-sm">
              {error}
            </div>
          )}
        </div>

        {data && (
          <>
            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="card p-4">
                <div className="text-xs muted mb-1">Gameweek Semasa</div>
                <div className="text-2xl font-extrabold text-brand-cyan">GW {data.currentGW}</div>
              </div>
              <div className="card p-4">
                <div className="text-xs muted mb-1">Differentials Found</div>
                <div className="text-2xl font-extrabold text-brand-green">
                  {data.players.length}
                </div>
              </div>
              <div className="card p-4">
                <div className="text-xs muted mb-1">Max Ownership</div>
                <div className="text-2xl font-extrabold text-brand-purple">
                  {maxOwnership}%
                </div>
              </div>
              <div className="card p-4">
                <div className="text-xs muted mb-1">Min Form</div>
                <div className="text-2xl font-extrabold text-yellow-400">
                  {minForm.toFixed(1)}
                </div>
              </div>
            </div>

            {/* Position Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {(['all', 'GKP', 'DEF', 'MID', 'FWD'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-brand-cyan to-brand-purple text-white'
                      : 'bg-plum-700/30 text-white/70 hover:text-white hover:bg-plum-700/50'
                  }`}
                >
                  {tab === 'all' ? 'Semua' : tab}
                  <span className="ml-2 text-xs">
                    ({tab === 'all' ? data.players.length : data.byPosition[tab]?.length || 0})
                  </span>
                </button>
              ))}
            </div>

            {/* Players List */}
            <div className="space-y-3">
              {getDisplayPlayers().map((player, index) => (
                <div
                  key={player.id}
                  className="card p-4 hover:border-brand-cyan/30 transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Rank */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-brand-cyan to-brand-purple flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-bold text-lg">{player.webName}</h3>
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-plum-700/50">
                              {player.team}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              player.position === 'GKP' ? 'bg-yellow-500/30 text-yellow-400' :
                              player.position === 'DEF' ? 'bg-green-500/30 text-green-400' :
                              player.position === 'MID' ? 'bg-blue-500/30 text-blue-400' :
                              'bg-red-500/30 text-red-400'
                            }`}>
                              {player.position}
                            </span>
                          </div>
                          
                          {player.news && (
                            <div className="flex items-center gap-1 text-xs text-orange-400 mb-2">
                              <AlertCircle className="w-3 h-3" />
                              <span>{player.news}</span>
                            </div>
                          )}

                          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-sm">
                            <div>
                              <div className="text-xs text-white/60">Price</div>
                              <div className="font-bold">£{player.price.toFixed(1)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-white/60">Ownership</div>
                              <div className="font-bold text-brand-green">{player.ownership}%</div>
                            </div>
                            <div>
                              <div className="text-xs text-white/60">Form</div>
                              <div className="font-bold">{player.form.toFixed(1)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-white/60">PPG</div>
                              <div className="font-bold">{player.pointsPerGame.toFixed(1)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-white/60">Points</div>
                              <div className="font-bold text-brand-purple">{player.totalPoints}</div>
                            </div>
                            <div>
                              <div className="text-xs text-white/60">Minutes</div>
                              <div className="font-bold">{player.minutes}</div>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="mt-2 flex items-center gap-4 text-xs text-white/70">
                            {player.goalsScored > 0 && (
                              <span>⚽ {player.goalsScored}</span>
                            )}
                            {player.assists > 0 && (
                              <span>🎯 {player.assists}</span>
                            )}
                            {player.cleanSheets > 0 && (
                              <span>🛡️ {player.cleanSheets}</span>
                            )}
                            {player.bonus > 0 && (
                              <span>⭐ {player.bonus} bonus</span>
                            )}
                          </div>
                        </div>

                        {/* Differential Score */}
                        <div className="flex-shrink-0 text-center">
                          <div className="text-xs text-white/60 mb-1">Diff Score</div>
                          <div className="px-3 py-1 rounded-lg bg-gradient-to-br from-brand-cyan/30 to-brand-purple/30 border border-brand-cyan/50">
                            <div className="text-lg font-extrabold text-brand-cyan">
                              {player.differentialScore.toFixed(1)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Upcoming Fixtures */}
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="text-xs text-white/60 mb-2">Next 5 Fixtures:</div>
                        <div className="flex gap-2 flex-wrap">
                          {player.upcomingFixtures.map((fixture, idx) => (
                            <div
                              key={idx}
                              className={`px-3 py-1.5 rounded-lg border ${getDifficultyBg(fixture.difficulty)}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold">
                                  GW{fixture.gw}
                                </span>
                                <span className="text-xs">
                                  {fixture.isHome ? 'vs' : '@'} {getTeamShortName(fixture.opponent)}
                                </span>
                                <div className={`w-2 h-2 rounded-full ${getDifficultyColor(fixture.difficulty)}`}></div>
                              </div>
                            </div>
                          ))}
                          {player.upcomingFixtures.length === 0 && (
                            <span className="text-xs text-white/40">No fixtures scheduled</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {getDisplayPlayers().length === 0 && (
                <div className="card p-8 text-center">
                  <div className="text-white/60">
                    <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Tiada pemain dijumpai dengan filters ini.</p>
                    <p className="text-sm mt-2">Cuba adjust filters dan try lagi.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="card p-4 lg:p-6 mt-6 bg-gradient-to-br from-plum-800/50 to-plum-900/50 border border-brand-cyan/30">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-brand-cyan" />
                Apa itu Differential?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/80">
                <div>
                  <div className="font-semibold text-brand-cyan mb-2">📊 Definition</div>
                  <p className="text-xs">
                    Differential adalah pemain dengan ownership rendah (&lt;10%) yang boleh bagi 
                    points lebih berbanding ramai managers. Bagus untuk catch up dalam ranking.
                  </p>
                </div>
                <div>
                  <div className="font-semibold text-brand-cyan mb-2">🎯 Strategy</div>
                  <p className="text-xs">
                    Pick differentials bila nak take risk atau chase ranks. Check fixtures, form, 
                    dan minutes played. Avoid injured players!
                  </p>
                </div>
                <div>
                  <div className="font-semibold text-brand-cyan mb-2">💡 Differential Score</div>
                  <p className="text-xs">
                    Formula: (Form + PPG) × Fixture Quality / (Ownership + Price).
                    Higher score = better differential potential.
                  </p>
                </div>
                <div>
                  <div className="font-semibold text-brand-cyan mb-2">⚠️ Risks</div>
                  <p className="text-xs">
                    Low ownership = higher risk. Player mungkin tak main regular atau 
                    team/form tak konsisten. Balance differentials dengan template players.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Loading State */}
        {loading && !data && (
          <div className="card p-12 text-center">
            <div className="text-white/60">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 animate-pulse" />
              <p>Mencari differentials terbaik...</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

