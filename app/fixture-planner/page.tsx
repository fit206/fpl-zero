'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, Info } from 'lucide-react';

type Fixture = {
  event: number;
  opponent: {
    id: number;
    name: string;
    shortName: string;
    difficulty: number;
  };
  isHome: boolean;
  difficulty: number;
};

type TeamFixtureRun = {
  teamId: number;
  teamName: string;
  shortName: string;
  fixtures: Fixture[];
  avgDifficulty: number;
  rating: 'easy' | 'medium' | 'hard';
};

type FixturePlannerData = {
  currentGW: number;
  gameweeks: Array<{
    id: number;
    name: string;
    deadlineTime: string;
    finished: boolean;
  }>;
  teamFixtureRuns: TeamFixtureRun[];
};

export default function FixturePlannerPage() {
  const [data, setData] = useState<FixturePlannerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [gwRange, setGwRange] = useState(5); // Show 5 or 8 GW

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/fixture-planner');
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
    if (difficulty <= 3) return 'bg-yellow-500/80';
    if (difficulty <= 4) return 'bg-orange-500/80';
    return 'bg-red-500/80';
  };

  const getDifficultyText = (difficulty: number) => {
    if (difficulty <= 2) return 'Mudah';
    if (difficulty <= 3) return 'Sederhana';
    if (difficulty <= 4) return 'Susah';
    return 'Sangat Susah';
  };

  const getRatingColor = (rating: string) => {
    if (rating === 'easy') return 'text-green-400 bg-green-900/30 border-green-400/30';
    if (rating === 'medium') return 'text-yellow-400 bg-yellow-900/30 border-yellow-400/30';
    return 'text-red-400 bg-red-900/30 border-red-400/30';
  };

  const getRatingText = (rating: string) => {
    if (rating === 'easy') return 'Run Mudah';
    if (rating === 'medium') return 'Run Sederhana';
    return 'Run Susah';
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-purple mx-auto mb-4"></div>
          <p className="text-white/60">Memuat data fixtures...</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="card p-6 max-w-md">
          <p className="text-red-400 text-center">{error || 'Tiada data'}</p>
          <button
            onClick={fetchData}
            className="mt-4 w-full rounded-xl px-4 py-2 bg-brand-purple text-white font-medium hover:bg-brand-purple/80"
          >
            Cuba Lagi
          </button>
        </div>
      </main>
    );
  }

  const selectedTeamData = selectedTeam 
    ? data.teamFixtureRuns.find(t => t.teamId === selectedTeam)
    : null;

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="card p-4 lg:p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-brand-purple/20 border border-brand-purple/30">
              <Calendar className="w-6 h-6 text-brand-purple" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">Fixture Difficulty Planner</h1>
              <p className="text-sm muted mt-1">
                Rancang transfer berdasarkan jadual perlawanan {gwRange} GW akan datang
              </p>
            </div>
          </div>

          {/* GW Range Selector */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setGwRange(5)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                gwRange === 5
                  ? 'bg-brand-purple text-white'
                  : 'bg-plum-700/50 text-white/70 hover:bg-plum-700'
              }`}
            >
              5 GW
            </button>
            <button
              onClick={() => setGwRange(8)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                gwRange === 8
                  ? 'bg-brand-purple text-white'
                  : 'bg-plum-700/50 text-white/70 hover:bg-plum-700'
              }`}
            >
              8 GW
            </button>
          </div>

          {/* Legend */}
          <div className="mt-4 p-3 rounded-lg bg-plum-700/30 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-brand-cyan" />
              <span className="text-xs font-medium text-white/80">Petunjuk Kesukaran:</span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-green-500/80"></div>
                <span className="text-white/70">Mudah (1-2)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-yellow-500/80"></div>
                <span className="text-white/70">Sederhana (3)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-orange-500/80"></div>
                <span className="text-white/70">Susah (4)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-red-500/80"></div>
                <span className="text-white/70">Sangat Susah (5)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Best and Worst Runs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Best Fixture Runs */}
          <div className="card p-4 lg:p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-400">
              <TrendingUp className="w-5 h-5" />
              Run Terbaik (Mudah)
            </h2>
            <div className="space-y-2">
              {data.teamFixtureRuns
                .filter(team => team.rating === 'easy')
                .slice(0, 10)
                .map((team, idx) => (
                  <button
                    key={team.teamId}
                    onClick={() => setSelectedTeam(team.teamId)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedTeam === team.teamId
                        ? 'bg-green-900/30 border-green-400/50'
                        : 'bg-plum-700/30 border-white/5 hover:bg-plum-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm">{team.teamName}</div>
                        <div className="text-xs text-white/60 mt-1">
                          Purata Kesukaran: {team.avgDifficulty.toFixed(2)}
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getRatingColor(team.rating)}`}>
                        {getRatingText(team.rating)}
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </div>

          {/* Worst Fixture Runs */}
          <div className="card p-4 lg:p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-400">
              <TrendingDown className="w-5 h-5" />
              Run Terburuk (Susah)
            </h2>
            <div className="space-y-2">
              {data.teamFixtureRuns
                .slice()
                .reverse()
                .filter(team => team.rating === 'hard')
                .slice(0, 10)
                .map((team, idx) => (
                  <button
                    key={team.teamId}
                    onClick={() => setSelectedTeam(team.teamId)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedTeam === team.teamId
                        ? 'bg-red-900/30 border-red-400/50'
                        : 'bg-plum-700/30 border-white/5 hover:bg-plum-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm">{team.teamName}</div>
                        <div className="text-xs text-white/60 mt-1">
                          Purata Kesukaran: {team.avgDifficulty.toFixed(2)}
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getRatingColor(team.rating)}`}>
                        {getRatingText(team.rating)}
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* Selected Team Details */}
        {selectedTeamData && (
          <div className="card p-4 lg:p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">
              {selectedTeamData.teamName} - Jadual {gwRange} GW Akan Datang
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {selectedTeamData.fixtures.slice(0, gwRange).map((fixture, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-plum-700/30 border border-white/10"
                >
                  <div className="text-xs text-white/60 mb-2">GW {fixture.event}</div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-white/80">
                      {fixture.isHome ? 'vs' : '@'} {fixture.opponent.shortName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`flex-1 h-2 rounded-full ${getDifficultyColor(fixture.difficulty)}`}></div>
                    <span className="text-xs font-bold">{fixture.difficulty}</span>
                  </div>
                  <div className="text-xs text-white/50 mt-1">
                    {getDifficultyText(fixture.difficulty)}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-lg bg-plum-700/50">
              <div className="text-sm font-medium text-white/80">
                💡 <strong>Cadangan:</strong>{' '}
                {selectedTeamData.rating === 'easy' && (
                  <span className="text-green-400">
                    Masa yang BAIK untuk transfer masuk pemain dari {selectedTeamData.shortName}!
                  </span>
                )}
                {selectedTeamData.rating === 'medium' && (
                  <span className="text-yellow-400">
                    Jadual sederhana untuk {selectedTeamData.shortName}. Monitor form pemain.
                  </span>
                )}
                {selectedTeamData.rating === 'hard' && (
                  <span className="text-red-400">
                    Pertimbangkan transfer keluar pemain dari {selectedTeamData.shortName}!
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Full Fixture Table */}
        <div className="card p-4 lg:p-6">
          <h2 className="text-xl font-bold mb-4">Semua Pasukan - Jadual {gwRange} GW</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-2 muted font-medium sticky left-0 bg-plum-800 z-10">Pasukan</th>
                  <th className="text-center py-3 px-2 muted font-medium">Purata</th>
                  {data.gameweeks.slice(0, gwRange).map((gw) => (
                    <th key={gw.id} className="text-center py-3 px-2 muted font-medium min-w-[80px]">
                      GW{gw.id}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.teamFixtureRuns.map((team) => (
                  <tr
                    key={team.teamId}
                    className="border-b border-white/5 hover:bg-plum-700/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedTeam(team.teamId)}
                  >
                    <td className="py-3 px-2 font-semibold sticky left-0 bg-plum-800">
                      {team.shortName}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        team.avgDifficulty <= 2.5 ? 'bg-green-900/50 text-green-400' :
                        team.avgDifficulty <= 3.5 ? 'bg-yellow-900/50 text-yellow-400' :
                        'bg-red-900/50 text-red-400'
                      }`}>
                        {team.avgDifficulty.toFixed(1)}
                      </span>
                    </td>
                    {team.fixtures.slice(0, gwRange).map((fixture, idx) => (
                      <td key={idx} className="py-3 px-2">
                        <div className="flex flex-col items-center gap-1">
                          <div className={`w-12 h-8 rounded flex items-center justify-center text-xs font-bold ${getDifficultyColor(fixture.difficulty)}`}>
                            {fixture.opponent.shortName.slice(0, 3)}
                          </div>
                          <div className="text-[10px] text-white/50">
                            {fixture.isHome ? 'H' : 'A'}
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

