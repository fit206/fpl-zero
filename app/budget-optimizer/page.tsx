'use client';

import React, { useState, useEffect } from 'react';
import { Coins, TrendingUp, Filter, Star, Target, DollarSign, Zap } from 'lucide-react';

type Player = {
  id: number;
  name: string;
  webName: string;
  team: string;
  teamId: number;
  position: string;
  positionId: number;
  price: number;
  totalPoints: number;
  form: number;
  pointsPerGame: number;
  minutes: number;
  pointsPerMillion: number;
  formPerMillion: number;
  valueScore: number;
  ownership: number;
  news: string;
};

type BudgetData = {
  currentGW: number;
  budget: number;
  players: Player[];
  byPosition: {
    GKP: Player[];
    DEF: Player[];
    MID: Player[];
    FWD: Player[];
  };
  budgetSuggestions: any;
  stats: {
    totalPlayers: number;
    avgPrice: number;
    avgValue: number;
  };
  teams: any[];
};

export default function BudgetOptimizerPage() {
  const [data, setData] = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [budget, setBudget] = useState(15);
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [sortBy, setSortBy] = useState('value');
  const [activeTab, setActiveTab] = useState<'all' | 'GKP' | 'DEF' | 'MID' | 'FWD'>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        budget: budget.toString(),
        position: selectedPosition,
        sortBy: sortBy,
      });
      
      const res = await fetch(`/api/budget-optimizer?${params}`);
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

  const getValueColor = (score: number) => {
    if (score >= 15) return 'text-green-400';
    if (score >= 10) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getValueBg = (score: number) => {
    if (score >= 15) return 'bg-green-500/20 border-green-500/50';
    if (score >= 10) return 'bg-yellow-500/20 border-yellow-500/50';
    return 'bg-orange-500/20 border-orange-500/50';
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
            <div className="p-3 rounded-xl bg-yellow-500/20 border border-yellow-500/30">
              <Coins className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">Budget Optimizer</h1>
              <p className="text-sm muted mt-1">
                Cari players terbaik mengikut budget anda
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-6 p-4 rounded-xl bg-plum-700/30 border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-brand-cyan" />
              <span className="font-semibold text-sm">Filters & Budget</span>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Budget Slider */}
              <div className="lg:col-span-2">
                <label className="text-xs text-white/60 mb-2 block">
                  Max Budget Per Player: £{budget.toFixed(1)}m
                </label>
                <input
                  type="range"
                  min={4}
                  max={15}
                  step={0.5}
                  value={budget}
                  onChange={(e) => setBudget(parseFloat(e.target.value))}
                  className="w-full h-2 bg-plum-800 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
                />
                <div className="flex justify-between text-xs text-white/40 mt-1">
                  <span>£4.0m</span>
                  <span>£15.0m</span>
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="text-xs text-white/60 mb-2 block">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full rounded-lg bg-plum-800/70 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan"
                >
                  <option value="value">Best Value</option>
                  <option value="points">Total Points</option>
                  <option value="form">Current Form</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={fetchData}
                disabled={loading}
                className="w-full sm:w-auto rounded-lg px-6 py-2 text-sm font-bold text-white bg-gradient-to-r from-brand-cyan to-brand-purple hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Mencari...' : 'Apply Filters'}
              </button>
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
                <div className="text-xs muted mb-1">Gameweek</div>
                <div className="text-2xl font-extrabold text-brand-cyan">GW {data.currentGW}</div>
              </div>
              <div className="card p-4">
                <div className="text-xs muted mb-1">Players Found</div>
                <div className="text-2xl font-extrabold text-brand-green">
                  {data.stats.totalPlayers}
                </div>
              </div>
              <div className="card p-4">
                <div className="text-xs muted mb-1">Avg Price</div>
                <div className="text-2xl font-extrabold text-yellow-400">
                  £{data.stats.avgPrice}m
                </div>
              </div>
              <div className="card p-4">
                <div className="text-xs muted mb-1">Avg Value</div>
                <div className="text-2xl font-extrabold text-brand-purple">
                  {data.stats.avgValue}
                </div>
              </div>
            </div>

            {/* Budget Guides */}
            <div className="card p-4 lg:p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-yellow-500" />
                Budget Allocation Guides
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(data.budgetSuggestions).map(([type, allocation]: any) => (
                  <div key={type} className="p-4 rounded-xl bg-plum-700/30 border border-white/10">
                    <h3 className="font-bold text-lg mb-3 capitalize">{type} Strategy</h3>
                    <div className="space-y-2 text-sm">
                      {Object.entries(allocation).map(([pos, range]: any) => (
                        <div key={pos} className="flex items-center justify-between">
                          <span className="text-white/70">{pos} ({range.count})</span>
                          <span className="font-semibold">£{range.min}-{range.max}m</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
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
                  {tab === 'all' ? 'All' : tab}
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
                    {/* Rank & Value Badge */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-cyan to-brand-purple flex items-center justify-center font-bold text-sm mb-2">
                        {index + 1}
                      </div>
                      <div className={`px-2 py-1 rounded-lg border text-center ${getValueBg(player.valueScore)}`}>
                        <div className="text-xs text-white/60">Value</div>
                        <div className={`text-sm font-bold ${getValueColor(player.valueScore)}`}>
                          {player.valueScore}
                        </div>
                      </div>
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

                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-sm mb-3">
                            <div>
                              <div className="text-xs text-white/60">Price</div>
                              <div className="font-bold text-yellow-400">£{player.price.toFixed(1)}m</div>
                            </div>
                            <div>
                              <div className="text-xs text-white/60">Points</div>
                              <div className="font-bold text-brand-purple">{player.totalPoints}</div>
                            </div>
                            <div>
                              <div className="text-xs text-white/60">Form</div>
                              <div className="font-bold">{player.form.toFixed(1)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-white/60">Pts/£m</div>
                              <div className="font-bold text-brand-green">{player.pointsPerMillion}</div>
                            </div>
                            <div>
                              <div className="text-xs text-white/60">Form/£m</div>
                              <div className="font-bold text-brand-cyan">{player.formPerMillion}</div>
                            </div>
                            <div>
                              <div className="text-xs text-white/60">Ownership</div>
                              <div className="font-bold">{player.ownership}%</div>
                            </div>
                          </div>

                          {/* Value Explanation */}
                          <div className="flex items-center gap-3 text-xs">
                            <div className="flex items-center gap-1">
                              <Zap className="w-3 h-3 text-brand-cyan" />
                              <span className="text-white/70">
                                {player.pointsPerMillion} pts per £1m
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3 text-brand-green" />
                              <span className="text-white/70">
                                {player.formPerMillion.toFixed(1)} form per £1m
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {getDisplayPlayers().length === 0 && (
                <div className="card p-8 text-center">
                  <div className="text-white/60">
                    <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Tiada pemain dijumpai dengan budget ini.</p>
                    <p className="text-sm mt-2">Cuba naikkan budget atau tukar filters.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="card p-4 lg:p-6 mt-6 bg-gradient-to-br from-plum-800/50 to-plum-900/50 border border-yellow-500/30">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Value Score Explained
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/80">
                <div>
                  <div className="font-semibold text-yellow-400 mb-2">📊 Formula</div>
                  <p className="text-xs">
                    Value Score = (Points per £1m × 60%) + (Form per £1m × 40%).
                    Higher score = better value for money.
                  </p>
                </div>
                <div>
                  <div className="font-semibold text-yellow-400 mb-2">🎯 Interpretation</div>
                  <p className="text-xs">
                    15+ = Excellent value, 10-15 = Good value, &lt;10 = Average.
                    Consider form, fixtures, dan rotation risk juga.
                  </p>
                </div>
                <div>
                  <div className="font-semibold text-yellow-400 mb-2">💡 Usage</div>
                  <p className="text-xs">
                    Gunakan budget guides untuk allocate funds across positions.
                    Balance antara premium players dan budget enablers.
                  </p>
                </div>
                <div>
                  <div className="font-semibold text-yellow-400 mb-2">⚠️ Notes</div>
                  <p className="text-xs">
                    Value score based on past performance. Check fixtures,
                    news, dan injuries sebelum pick players.
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
              <Coins className="w-12 h-12 mx-auto mb-3 animate-pulse" />
              <p>Mengoptimumkan budget...</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

