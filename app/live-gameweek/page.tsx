"use client";
import { useEffect, useState } from 'react';

interface LiveGameweekData {
  gameweek: {
    id: number;
    name: string;
    deadlineTime: string;
    averageScore: number;
    highestScore: number;
    finished: boolean;
    dataChecked: boolean;
  };
  team: {
    managerName: string;
    teamName: string;
    livePoints: number;
    captainPoints: number;
    transfers: number;
    transfersCost: number;
    netPoints: number;
    chipUsed: string | null;
    overallPoints: number;
    overallRank: number;
    lastRank: number;
  };
  players: any[];
  topPerformers: any[];
  fixtures: any[];
  bonusInfo: any[];
}

export default function LiveGameweekPage() {
  const [entryId, setEntryId] = useState('');
  const [data, setData] = useState<LiveGameweekData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Load saved entry ID
  useEffect(() => {
    const saved = localStorage.getItem('fplEntryId');
    if (saved) {
      setEntryId(saved);
    }
  }, []);

  // Auto-refresh every 60 seconds if enabled
  useEffect(() => {
    if (!autoRefresh || !entryId || !data) return;
    
    const interval = setInterval(() => {
      fetchLiveData(false); // Silent refresh
    }, 60000);

    return () => clearInterval(interval);
  }, [autoRefresh, entryId, data]);

  const fetchLiveData = async (showLoading = true) => {
    if (!entryId) {
      setError('Sila masukkan Entry ID anda');
      return;
    }

    try {
      if (showLoading) setLoading(true);
      setError('');

      // Save entry ID
      localStorage.setItem('fplEntryId', entryId);

      const res = await fetch(`/api/live-gameweek?entryId=${entryId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch live data');
      }

      const liveData = await res.json();
      setData(liveData);
    } catch (err: any) {
      console.error(err);
      setError('Ralat mengambil data. Sila cuba lagi.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const getPositionName = (position: number) => {
    const positions: { [key: number]: string } = {
      1: 'GKP',
      2: 'DEF',
      3: 'MID',
      4: 'FWD',
    };
    return positions[position] || '';
  };

  const getPositionColor = (position: number) => {
    const colors: { [key: number]: string } = {
      1: 'bg-yellow-500/20 text-yellow-400',
      2: 'bg-blue-500/20 text-blue-400',
      3: 'bg-green-500/20 text-green-400',
      4: 'bg-red-500/20 text-red-400',
    };
    return colors[position] || 'bg-gray-500/20 text-gray-400';
  };

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="card p-4 lg:p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-white mb-2 flex items-center">
                <span className="mr-2">📊</span>
                Live Gameweek Tracker
              </h1>
              <p className="text-white/70 text-sm">
                Jejaki points team anda secara live dengan auto-refresh
              </p>
            </div>
            
            {data && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                    autoRefresh 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-white/10 text-white/70 border border-white/10'
                  }`}
                >
                  {autoRefresh ? '✓ Auto-Refresh ON' : 'Auto-Refresh OFF'}
                </button>
                <button
                  onClick={() => fetchLiveData()}
                  className="px-4 py-2 bg-brand-cyan/20 text-brand-cyan rounded-lg hover:bg-brand-cyan/30 transition-colors text-sm font-medium"
                >
                  🔄 Refresh
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Entry ID Input */}
        <div className="card p-4 lg:p-5 mb-6">
          <label className="block text-white/80 mb-2 text-sm font-medium">
            FPL Entry ID
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={entryId}
              onChange={(e) => setEntryId(e.target.value)}
              placeholder="Masukkan Entry ID anda"
              className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-brand-cyan/50"
            />
            <button
              onClick={() => fetchLiveData()}
              disabled={loading || !entryId}
              className="px-6 py-2 bg-brand-cyan/20 text-brand-cyan rounded-lg hover:bg-brand-cyan/30 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Track Live'}
            </button>
          </div>
          <p className="text-white/50 text-xs mt-2">
            Cari Entry ID anda di URL: fantasy.premierleague.com/entry/<strong>YOUR_ID</strong>/event/...
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="card p-4 mb-6 bg-red-500/10 border-red-500/30">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Live Data */}
        {data && (
          <div className="space-y-6">
            {/* Gameweek Info & Team Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Live Points */}
              <div className="card p-5 bg-gradient-to-br from-brand-cyan/10 to-brand-purple/10 border-brand-cyan/20">
                <div className="text-white/70 text-sm mb-1">Live Points</div>
                <div className="text-4xl font-bold text-brand-cyan mb-2">
                  {data.team.netPoints}
                </div>
                <div className="text-white/50 text-xs space-y-1">
                  <div>Gross: {data.team.livePoints} pts</div>
                  {data.team.transfersCost > 0 && (
                    <div className="text-red-400">Transfers: -{data.team.transfersCost} pts</div>
                  )}
                  {data.team.chipUsed && (
                    <div className="text-yellow-400">Chip: {data.team.chipUsed}</div>
                  )}
                </div>
              </div>

              {/* Average Comparison */}
              <div className="card p-5">
                <div className="text-white/70 text-sm mb-1">vs Average</div>
                <div className={`text-3xl font-bold mb-2 ${
                  data.team.netPoints > data.gameweek.averageScore 
                    ? 'text-green-400' 
                    : data.team.netPoints < data.gameweek.averageScore
                      ? 'text-red-400'
                      : 'text-white'
                }`}>
                  {data.team.netPoints > data.gameweek.averageScore ? '+' : ''}
                  {(data.team.netPoints - data.gameweek.averageScore).toFixed(0)}
                </div>
                <div className="text-white/50 text-xs">
                  Average: {data.gameweek.averageScore} pts
                </div>
              </div>

              {/* Rank Info */}
              <div className="card p-5">
                <div className="text-white/70 text-sm mb-1">Overall Rank</div>
                <div className="text-2xl font-bold text-white mb-2">
                  {data.team.overallRank.toLocaleString()}
                </div>
                <div className="text-white/50 text-xs">
                  Points: {data.team.overallPoints}
                </div>
              </div>
            </div>

            {/* Fixtures */}
            <div className="card p-5">
              <h2 className="text-lg font-bold text-white mb-4">
                {data.gameweek.name} - Live Fixtures
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.fixtures.map((fixture) => (
                  <div key={fixture.id} className="card p-4 bg-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 text-right">
                        <div className="text-white font-medium">{fixture.homeTeam.shortName}</div>
                      </div>
                      <div className="px-4 text-center">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-white">
                            {fixture.homeTeam.score ?? '-'}
                          </span>
                          <span className="text-white/50">-</span>
                          <span className="text-2xl font-bold text-white">
                            {fixture.awayTeam.score ?? '-'}
                          </span>
                        </div>
                        {fixture.started && !fixture.finished && (
                          <span className="text-xs text-green-400 animate-pulse">● LIVE</span>
                        )}
                        {fixture.finished && (
                          <span className="text-xs text-white/50">FT</span>
                        )}
                        {!fixture.started && (
                          <span className="text-xs text-white/50">
                            {new Date(fixture.kickoffTime).toLocaleTimeString('en-MY', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium">{fixture.awayTeam.shortName}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Your Team */}
            <div className="card p-5">
              <h2 className="text-lg font-bold text-white mb-4">Your Team Points</h2>
              <div className="space-y-2">
                {/* Starting 11 */}
                {data.players
                  .filter((p) => p.position <= 11)
                  .sort((a, b) => a.position - b.position)
                  .map((player) => (
                    <div key={player.id} className="card p-3 bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`px-2 py-1 rounded text-xs font-medium ${getPositionColor(player.position <= 11 ? (player.position === 1 ? 1 : player.position <= 5 ? 2 : player.position <= 8 ? 3 : 4) : 0)}`}>
                            {player.position}
                          </div>
                          <div>
                            <div className="text-white font-medium flex items-center gap-2">
                              {player.name}
                              {player.isCaptain && (
                                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">C</span>
                              )}
                              {player.isViceCaptain && (
                                <span className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded">V</span>
                              )}
                            </div>
                            <div className="text-white/50 text-xs">
                              {player.stats.minutes || 0}' played
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-brand-cyan">
                            {player.totalPoints} pts
                          </div>
                          <div className="text-white/50 text-xs">
                            {player.points} × {player.multiplier}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                {/* Bench */}
                <div className="pt-3 border-t border-white/10">
                  <div className="text-white/50 text-sm font-medium mb-2">Bench</div>
                  {data.players
                    .filter((p) => p.position > 11)
                    .sort((a, b) => a.position - b.position)
                    .map((player) => (
                      <div key={player.id} className="card p-3 bg-white/5 mb-2 opacity-60">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-white/50 text-xs font-medium">
                              {player.position - 11}
                            </div>
                            <div className="text-white text-sm">{player.name}</div>
                          </div>
                          <div className="text-white/70 text-sm">
                            {player.points} pts
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Top Performers */}
            <div className="card p-5">
              <h2 className="text-lg font-bold text-white mb-4">Top 10 Performers (GW{data.gameweek.id})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.topPerformers.map((player, index) => (
                  <div key={player.id} className="card p-3 bg-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                          index === 1 ? 'bg-gray-400/20 text-gray-400' :
                          index === 2 ? 'bg-orange-500/20 text-orange-400' :
                          'bg-white/10 text-white/50'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-white font-medium">{player.name}</div>
                          <div className="text-white/50 text-xs">
                            {player.stats.goals_scored > 0 && `⚽ ${player.stats.goals_scored} `}
                            {player.stats.assists > 0 && `🅰️ ${player.stats.assists} `}
                            {player.stats.clean_sheets > 0 && `🧤 CS `}
                          </div>
                        </div>
                      </div>
                      <div className="text-xl font-bold text-brand-cyan">
                        {player.points}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        {!data && !loading && (
          <div className="card p-5 bg-brand-cyan/5 border-brand-cyan/20">
            <h3 className="text-white font-semibold mb-2">ℹ️ Panduan</h3>
            <ul className="text-white/70 text-sm space-y-1 list-disc list-inside">
              <li>Masukkan Entry ID untuk track live points</li>
              <li>Data akan auto-refresh setiap 60 saat (bila enabled)</li>
              <li>Bonus points mungkin belum final untuk fixtures yang masih live</li>
              <li>Transfers cost akan ditolak daripada total points</li>
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}

