"use client";
import { useState } from "react";
import SquadCard from "../../components/SquadCard";
import ChartsSection from "../../components/ChartsSection";

interface SquadPlayer {
  id: number;
  name: string;
  webName: string;
  teamId: number;
  teamName: string;
  position: number;
  positionName: string;
  cost: number;
  expectedPoints: number;
  form: number;
  pointsPerGame: number;
}

interface SquadResult {
  starting_11: SquadPlayer[];
  bench: SquadPlayer[];
  captain: SquadPlayer;
  vice_captain: SquadPlayer;
  totalCost: number;
  totalExpectedPoints: number;
  formation: string;
}

export default function FPLSquadPage() {
  const [squad, setSquad] = useState<SquadResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFormation, setSelectedFormation] = useState("3-4-3");

  const formations = [
    { value: "3-4-3", label: "3-4-3" },
    { value: "3-5-2", label: "3-5-2" },
    { value: "4-3-3", label: "4-3-3" },
    { value: "4-4-2", label: "4-4-2" },
    { value: "4-5-1", label: "4-5-1" },
    { value: "5-3-2", label: "5-3-2" },
    { value: "5-4-1", label: "5-4-1" }
  ];

  const generateSquad = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await fetch(`/api/fpl-squad?formation=${selectedFormation}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: SquadResult = await response.json();
      setSquad(result);
      
    } catch (err: any) {
      console.error("Failed to generate squad:", err);
      setError("Tidak dapat menghasilkan squad optimal sekarang. Cuba lagi nanti.");
    } finally {
      setLoading(false);
    }
  };

  const formatCost = (cost: number) => {
    return `£${(cost / 10).toFixed(1)}m`;
  };

  const formatTotalCost = (cost: number) => {
    return `£${(cost / 10).toFixed(0)}m`;
  };

  return (
    <main className="min-h-screen">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="card p-4 lg:p-5 mb-6 lg:mb-8">
          <div className="text-center">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white mb-2">
              FPL Squad Optimizer
            </h1>
            <p className="text-white/80">
              Algoritma optimisasi untuk menghasilkan squad Fantasy Premier League terbaik
            </p>
            <div className="mt-3 text-sm text-white/60">
              Squad 15 pemain dengan budget £100m
            </div>
          </div>
        </div>

        {/* Formation Selection & Generate Button */}
        <div className="card p-6 mb-6">
          <div className="max-w-md mx-auto">
            <div className="mb-4">
              <label htmlFor="formation" className="block text-sm font-medium text-white mb-2">
                Pilih Formasi
              </label>
              <select
                id="formation"
                value={selectedFormation}
                onChange={(e) => setSelectedFormation(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:border-transparent"
              >
                {formations.map((formation) => (
                  <option key={formation.value} value={formation.value} className="bg-gray-800 text-white">
                    {formation.label}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={generateSquad}
              disabled={loading}
              className="w-full inline-flex items-center justify-center px-8 py-4 bg-brand-cyan text-white font-semibold rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Generating Squad...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate Optimal Squad ({selectedFormation})
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="card p-4 lg:p-5 mb-6 border-red-500/30 bg-red-500/10">
            <div className="text-center">
              <div className="text-red-300 mb-2">
                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Squad Results */}
        {squad && (
          <>
            {/* Squad Summary */}
            <div className="card p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-brand-cyan mb-2">
                    {formatTotalCost(squad.totalCost)}
                  </div>
                  <div className="text-white/80 text-sm">Total Cost</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-400 mb-2">
                    {squad.totalExpectedPoints.toFixed(1)}
                  </div>
                  <div className="text-white/80 text-sm">Total Expected Points</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-yellow-400 mb-2">
                    {squad.formation}
                  </div>
                  <div className="text-white/80 text-sm">Formation</div>
                </div>
              </div>
            </div>

            {/* Captain & Vice-Captain */}
            <div className="card p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Captain & Vice-Captain
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Captain */}
                <div className="card p-4 border-yellow-500/30 bg-yellow-500/10">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white font-bold text-sm">C</span>
                    </div>
                    <h3 className="text-lg font-bold text-yellow-400">Captain</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="text-white font-semibold">{squad.captain.webName}</div>
                    <div className="text-white/80 text-sm">{squad.captain.teamName} • {squad.captain.positionName}</div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Cost: {formatCost(squad.captain.cost)}</span>
                      <span className="text-yellow-400 font-semibold">Expected: {squad.captain.expectedPoints.toFixed(1)} pts</span>
                    </div>
                  </div>
                </div>

                {/* Vice-Captain */}
                <div className="card p-4 border-blue-500/30 bg-blue-500/10">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white font-bold text-sm">VC</span>
                    </div>
                    <h3 className="text-lg font-bold text-blue-400">Vice-Captain</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="text-white font-semibold">{squad.vice_captain.webName}</div>
                    <div className="text-white/80 text-sm">{squad.vice_captain.teamName} • {squad.vice_captain.positionName}</div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Cost: {formatCost(squad.vice_captain.cost)}</span>
                      <span className="text-blue-400 font-semibold">Expected: {squad.vice_captain.expectedPoints.toFixed(1)} pts</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Starting XI */}
            <div className="card p-4 lg:p-5 mb-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 100-4H7a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                </svg>
                Starting XI ({squad.starting_11.length} players)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {squad.starting_11.map((player) => (
                  <SquadCard key={player.id} player={player} />
                ))}
              </div>
            </div>

            {/* Bench Players */}
            <div className="card p-4 lg:p-5 mb-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Bench Players ({squad.bench.length} players)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {squad.bench.map((player) => (
                  <SquadCard key={player.id} player={player} />
                ))}
              </div>
            </div>

            {/* Charts */}
            <ChartsSection players={[...squad.starting_11, ...squad.bench]} />

            {/* Info Box */}
            <div className="card p-6 bg-blue-500/10 border-blue-500/30">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-blue-400 mb-2">About This Squad</h3>
                  <p className="text-blue-200 text-sm">
                    This squad is automatically generated based on live Fantasy Premier League stats using optimization logic from the open-source project fpl-squad. 
                    The algorithm selects the best 15 players under £100 million using your chosen formation, ensuring no more than 3 players per club.
                    All valid FPL formations are supported: 3-4-3, 3-5-2, 4-3-3, 4-4-2, 4-5-1, 5-3-2, and 5-4-1.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-6">
            <div className="card p-6 animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="text-center">
                    <div className="h-8 bg-white/20 rounded w-20 mx-auto mb-2"></div>
                    <div className="h-4 bg-white/20 rounded w-24 mx-auto"></div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Captain & Vice-Captain Loading Skeleton */}
            <div className="card p-6 animate-pulse">
              <div className="h-6 bg-white/20 rounded w-1/3 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(2)].map((_, index) => (
                  <div key={index} className="card p-4 animate-pulse">
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-white/20 rounded-full mr-3"></div>
                      <div className="h-5 bg-white/20 rounded w-24"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-white/20 rounded w-3/4"></div>
                      <div className="h-3 bg-white/20 rounded w-1/2"></div>
                      <div className="flex justify-between">
                        <div className="h-3 bg-white/20 rounded w-16"></div>
                        <div className="h-3 bg-white/20 rounded w-20"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Starting XI Loading Skeleton */}
            <div className="card p-4 lg:p-5 animate-pulse mb-6">
              <div className="h-6 bg-white/20 rounded w-1/3 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(11)].map((_, cardIndex) => (
                  <div key={cardIndex} className="card p-4 animate-pulse">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="h-4 bg-white/20 rounded w-12"></div>
                        <div className="h-3 bg-white/20 rounded w-16"></div>
                      </div>
                      <div className="h-5 bg-white/20 rounded w-full"></div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-4 bg-white/20 rounded"></div>
                        <div className="h-4 bg-white/20 rounded"></div>
                        <div className="h-4 bg-white/20 rounded"></div>
                        <div className="h-4 bg-white/20 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Bench Loading Skeleton */}
            <div className="card p-4 lg:p-5 animate-pulse">
              <div className="h-6 bg-white/20 rounded w-1/3 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(4)].map((_, cardIndex) => (
                  <div key={cardIndex} className="card p-4 animate-pulse">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="h-4 bg-white/20 rounded w-12"></div>
                        <div className="h-3 bg-white/20 rounded w-16"></div>
                      </div>
                      <div className="h-5 bg-white/20 rounded w-full"></div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-4 bg-white/20 rounded"></div>
                        <div className="h-4 bg-white/20 rounded"></div>
                        <div className="h-4 bg-white/20 rounded"></div>
                        <div className="h-4 bg-white/20 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
