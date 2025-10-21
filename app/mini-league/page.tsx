'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Users, Trophy, Target } from 'lucide-react';

type LeagueStanding = {
  id: number;
  entry: number;
  entry_name: string;
  player_name: string;
  rank: number;
  last_rank: number;
  rank_sort: number;
  total: number;
  event_total: number;
};

type LeagueData = {
  league: {
    id: number;
    name: string;
    created: string;
    closed: boolean;
    rank: number | null;
    max_entries: number | null;
    league_type: string;
    scoring: string;
    start_event: number;
  };
  standings: {
    has_next: boolean;
    page: number;
    results: LeagueStanding[];
  };
  new_entries: any;
};

type PlayerSquad = {
  entry: any;
  picks: {
    picks: Array<{
      element: number;
      position: number;
      is_captain: boolean;
      is_vice_captain: boolean;
      multiplier: number;
    }>;
  } | null;
};

export default function MiniLeaguePage() {
  const [leagueId, setLeagueId] = useState('');
  const [myEntryId, setMyEntryId] = useState('');
  const [leagueData, setLeagueData] = useState<LeagueData | null>(null);
  const [squadData, setSquadData] = useState<Map<number, PlayerSquad>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzingSquads, setAnalyzingSquads] = useState(false);
  const [fplData, setFplData] = useState<any>(null);

  // Load saved league ID
  useEffect(() => {
    const saved = localStorage.getItem('savedLeagueId');
    if (saved) setLeagueId(saved);
    
    const savedEntry = localStorage.getItem('transferData');
    if (savedEntry) {
      try {
        const data = JSON.parse(savedEntry);
        if (data.entryId) setMyEntryId(data.entryId.toString());
      } catch (e) {}
    }
  }, []);

  // Fetch FPL bootstrap data
  useEffect(() => {
    console.log('Loading FPL data...');
    fetch('/api/fpl-data')
      .then(res => res.json())
      .then(data => {
        console.log('FPL data loaded:', { 
          hasPlayers: !!data?.players, 
          playersCount: data?.players?.length,
          hasTeams: !!data?.teams,
          teamsCount: data?.teams?.length
        });
        setFplData(data);
      })
      .catch(err => {
        console.error('Error loading FPL data:', err);
        setError('Ralat memuat data FPL');
      });
  }, []);

  const fetchLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLeagueData(null);
    setSquadData(new Map());

    const idNum = Number(leagueId);
    if (!Number.isFinite(idNum) || idNum <= 0) {
      setError('Sila masukkan League ID yang sah.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/mini-league?leagueId=${idNum}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json?.error || 'League tidak dijumpai');
      } else {
        setLeagueData(json);
        localStorage.setItem('savedLeagueId', leagueId);
      }
    } catch {
      setError('Ralat rangkaian. Cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const analyzeSquads = async () => {
    if (!leagueData) return;

    // Ensure FPL data is loaded first
    if (!fplData) {
      setError('Sila tunggu sebentar, data FPL sedang dimuat...');
      return;
    }

    setAnalyzingSquads(true);
    setError(null);
    const newSquadData = new Map<number, PlayerSquad>();

    // Fetch top 10 squads
    const topEntries = leagueData.standings.results.slice(0, 10);
    console.log('Analyzing squads for entries:', topEntries.map(e => e.entry));
    console.log('FPL data available:', !!fplData?.players, 'Players count:', fplData?.players?.length);

    for (const entry of topEntries) {
      try {
        const res = await fetch(`/api/league-squad?entryId=${entry.entry}`);
        if (res.ok) {
          const data = await res.json();
          console.log(`Squad data for ${entry.entry}:`, data);
          console.log(`Picks for ${entry.entry}:`, data.picks?.picks);
          newSquadData.set(entry.entry, data);
        }
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (err) {
        console.error(`Error fetching squad for ${entry.entry}:`, err);
      }
    }

    console.log('Final squadData size:', newSquadData.size);
    console.log('All squad data:', Array.from(newSquadData.entries()));
    setSquadData(newSquadData);
    setAnalyzingSquads(false);
  };

  const getRankChange = (rank: number, lastRank: number) => {
    if (lastRank === 0) return null;
    const change = lastRank - rank;
    if (change > 0) return { type: 'up', value: change };
    if (change < 0) return { type: 'down', value: Math.abs(change) };
    return { type: 'same', value: 0 };
  };

  const getPlayerName = (elementId: number) => {
    if (!fplData?.players) return `Player ${elementId}`;
    const player = fplData.players.find((p: any) => p.id === elementId);
    return player ? player.webName : `Player ${elementId}`;
  };

  const getPlayerOwnership = () => {
    if (!fplData?.players || squadData.size === 0) {
      console.log('getPlayerOwnership early return:', { 
        hasFplData: !!fplData?.players, 
        squadDataSize: squadData.size 
      });
      return [];
    }

    const ownershipMap = new Map<number, number>();

    squadData.forEach((squad, entryId) => {
      console.log(`Processing squad ${entryId}:`, { 
        hasPicks: !!squad.picks, 
        hasPicksArray: !!squad.picks?.picks,
        picksLength: squad.picks?.picks?.length 
      });
      
      if (squad.picks?.picks) {
        squad.picks.picks.forEach((pick) => {
          const current = ownershipMap.get(pick.element) || 0;
          ownershipMap.set(pick.element, current + 1);
        });
      }
    });

    console.log('Ownership map size:', ownershipMap.size);
    console.log('Top 5 owned players:', Array.from(ownershipMap.entries()).slice(0, 5));

    const ownership = Array.from(ownershipMap.entries())
      .map(([elementId, count]) => {
        const player = fplData.players.find((p: any) => p.id === elementId);
        return {
          elementId,
          name: player?.webName || `Player ${elementId}`,
          team: player?.teamId || 0,
          position: player?.position || 0,
          count,
          percentage: ((count / squadData.size) * 100).toFixed(1),
        };
      })
      .sort((a, b) => b.count - a.count);

    return ownership;
  };

  const getDifferentials = () => {
    console.log('getDifferentials called:', { myEntryId, squadDataSize: squadData.size });
    
    if (!myEntryId || squadData.size === 0) return [];

    const mySquad = squadData.get(Number(myEntryId));
    console.log('My squad data:', mySquad);
    console.log('My picks:', mySquad?.picks?.picks);
    
    if (!mySquad?.picks?.picks) return [];

    const ownership = getPlayerOwnership();
    const ownershipMap = new Map(ownership.map(o => [o.elementId, o.count]));

    console.log('Ownership map for differentials:', Array.from(ownershipMap.entries()).slice(0, 10));

    const differentials = mySquad.picks.picks
      .map((pick) => {
        const ownedBy = ownershipMap.get(pick.element) || 0;
        return {
          elementId: pick.element,
          name: getPlayerName(pick.element),
          ownedBy,
          percentage: squadData.size > 0 ? ((ownedBy / squadData.size) * 100).toFixed(1) : '0',
        };
      })
      .filter(d => d.ownedBy <= squadData.size * 0.3) // < 30% ownership
      .sort((a, b) => a.ownedBy - b.ownedBy);

    console.log('Differentials result:', differentials);
    return differentials;
  };

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="card p-4 lg:p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-brand-purple/20 border border-brand-purple/30">
              <Trophy className="w-6 h-6 text-brand-purple" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">Mini-League Tracker</h1>
              <p className="text-sm muted mt-1">Analisis liga anda dan squad pesaing</p>
            </div>
          </div>

          <form onSubmit={fetchLeague} className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="leagueId" className="block text-sm font-medium muted mb-2">
                  League ID
                </label>
                <input
                  id="leagueId"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={leagueId}
                  onChange={(e) => setLeagueId(e.target.value)}
                  placeholder="Contoh: 123456"
                  className="w-full rounded-xl bg-plum-700/70 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand-purple"
                />
              </div>
              <div>
                <label htmlFor="myEntry" className="block text-sm font-medium muted mb-2">
                  Entry ID Anda (opsional - untuk differentials)
                </label>
                <input
                  id="myEntry"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={myEntryId}
                  onChange={(e) => setMyEntryId(e.target.value)}
                  placeholder="Contoh: 317033"
                  className="w-full rounded-xl bg-plum-700/70 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand-purple"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl px-6 py-2.5 text-sm font-bold text-plum-900"
                style={{
                  background: 'linear-gradient(90deg, #3DE0FF 0%, #7B61FF 45%, #9B25FF 100%)',
                }}
              >
                {loading ? 'Memuat...' : 'Lihat League'}
              </button>

              {leagueData && (
                <button
                  type="button"
                  onClick={analyzeSquads}
                  disabled={analyzingSquads || !fplData}
                  className="rounded-xl px-6 py-2.5 text-sm font-bold bg-plum-700 border border-white/10 hover:bg-plum-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!fplData ? 'Menunggu data FPL...' : ''}
                >
                  {analyzingSquads ? 'Menganalisis...' : !fplData ? 'Menunggu data FPL...' : 'Analisis Squad (Top 10)'}
                </button>
              )}
            </div>

            {error && (
              <div className="mt-3 rounded-lg border border-red-400/30 bg-red-500/10 text-red-200 px-3 py-2 text-sm">
                {error}
              </div>
            )}
          </form>
        </div>

        {/* League Info */}
        {leagueData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="card p-4">
              <div className="text-xs muted mb-2">Nama League</div>
              <div className="text-xl font-bold">{leagueData.league.name}</div>
            </div>
            <div className="card p-4">
              <div className="text-xs muted mb-2">Jenis</div>
              <div className="text-xl font-bold capitalize">{leagueData.league.league_type}</div>
            </div>
            <div className="card p-4">
              <div className="text-xs muted mb-2">Ahli</div>
              <div className="text-xl font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-cyan" />
                {leagueData.standings.results.length}
                {leagueData.league.max_entries && ` / ${leagueData.league.max_entries}`}
              </div>
            </div>
          </div>
        )}

        {/* Standings Table */}
        {leagueData && (
          <div className="card p-4 lg:p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Kedudukan</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-2 muted font-medium">Rank</th>
                    <th className="text-left py-3 px-2 muted font-medium">Nama Manager</th>
                    <th className="text-left py-3 px-2 muted font-medium">Nama Pasukan</th>
                    <th className="text-right py-3 px-2 muted font-medium">GW Points</th>
                    <th className="text-right py-3 px-2 muted font-medium">Total</th>
                    <th className="text-center py-3 px-2 muted font-medium">Perubahan</th>
                  </tr>
                </thead>
                <tbody>
                  {leagueData.standings.results.map((standing, idx) => {
                    const rankChange = getRankChange(standing.rank, standing.last_rank);
                    const isMyTeam = myEntryId && standing.entry === Number(myEntryId);

                    return (
                      <tr
                        key={standing.entry}
                        className={`border-b border-white/5 hover:bg-plum-700/30 transition-colors ${
                          isMyTeam ? 'bg-brand-cyan/10 border-brand-cyan/30' : ''
                        }`}
                      >
                        <td className="py-3 px-2 font-bold">{standing.rank}</td>
                        <td className="py-3 px-2">{standing.player_name}</td>
                        <td className="py-3 px-2 text-white/80">{standing.entry_name}</td>
                        <td className="py-3 px-2 text-right font-semibold">{standing.event_total}</td>
                        <td className="py-3 px-2 text-right font-bold text-brand-green">
                          {standing.total.toLocaleString()}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex justify-center">
                            {rankChange && (
                              <div
                                className={`flex items-center gap-1 text-xs font-medium ${
                                  rankChange.type === 'up'
                                    ? 'text-green-400'
                                    : rankChange.type === 'down'
                                    ? 'text-red-400'
                                    : 'text-white/40'
                                }`}
                              >
                                {rankChange.type === 'up' && <TrendingUp className="w-4 h-4" />}
                                {rankChange.type === 'down' && <TrendingDown className="w-4 h-4" />}
                                {rankChange.type === 'same' && <Minus className="w-4 h-4" />}
                                {rankChange.value > 0 && rankChange.value}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Player Ownership Analysis */}
        {squadData.size > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Most Owned Players */}
            <div className="card p-4 lg:p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-purple" />
                Pemain Paling Popular
              </h2>
              <div className="space-y-2">
                {getPlayerOwnership()
                  .slice(0, 15)
                  .map((player, idx) => (
                    <div
                      key={player.elementId}
                      className="flex items-center justify-between p-3 rounded-lg bg-plum-700/50 border border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-bold text-white/40 w-6">#{idx + 1}</div>
                        <div>
                          <div className="font-semibold text-sm">{player.name}</div>
                          <div className="text-xs text-white/60">
                            Dimiliki oleh {player.count} / {squadData.size} managers
                          </div>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-brand-cyan">{player.percentage}%</div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Differentials */}
            <div className="card p-4 lg:p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-brand-green" />
                Differential Anda
              </h2>
              {myEntryId ? (
                getDifferentials().length > 0 ? (
                  <div className="space-y-2">
                    {getDifferentials().map((diff, idx) => (
                      <div
                        key={diff.elementId}
                        className="flex items-center justify-between p-3 rounded-lg bg-green-900/20 border border-green-400/20"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-bold text-green-400 w-6">#{idx + 1}</div>
                          <div>
                            <div className="font-semibold text-sm">{diff.name}</div>
                            <div className="text-xs text-white/60">
                              Hanya {diff.ownedBy} / {squadData.size} managers ada
                            </div>
                          </div>
                        </div>
                        <div className="text-lg font-bold text-green-400">{diff.percentage}%</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-white/60">
                    <p>Tiada differential dijumpai.</p>
                    <p className="text-sm mt-2">Semua pemain anda popular dalam liga!</p>
                  </div>
                )
              ) : (
                <div className="text-center py-8 text-white/60">
                  <p>Masukkan Entry ID anda di atas untuk melihat differentials</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        {!leagueData && (
          <div className="card p-6 text-center">
            <div className="text-white/60 max-w-md mx-auto">
              <p className="mb-4">Untuk mencari League ID anda:</p>
              <ol className="text-left space-y-2 text-sm">
                <li>1. Pergi ke FPL website/app</li>
                <li>2. Klik pada Leagues & Cups</li>
                <li>3. Pilih league yang anda ingin track</li>
                <li>4. Lihat URL - nombor selepas /leagues/</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

