"use client";
import { useEffect, useState } from "react";
import FPLPlayerCard from "../../components/FPLPlayerCard";
import StatsSection from "../../components/StatsSection";

interface FPLPlayer {
  id: number;
  name: string;
  webName: string;
  teamId: number;
  position: number;
  totalPoints: number;
  cost: number;
  selectedByPercent: number;
  form: number;
  valueForm: number;
  transfersIn: number;
  transfersOut: number;
  pointsPerGame: number;
}

interface FPLTeam {
  id: number;
  name: string;
  shortName: string;
  code: number;
}

interface FPLData {
  players: FPLPlayer[];
  teams: FPLTeam[];
}

export default function FPLAnalyticsPage() {
  const [data, setData] = useState<FPLData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchFPLData() {
      try {
        setLoading(true);
        setError("");
        
        // Check cache first
        const cacheKey = 'fpl_data_cache';
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            const now = Date.now();
            // Cache valid for 6 hours
            if (now - parsed.timestamp < 6 * 60 * 60 * 1000) {
              setData(parsed.data);
              setLoading(false);
              return;
            }
          } catch (e) {
            // Invalid cache, continue with fetch
          }
        }

        // Fetch data from our API route
        const response = await fetch('/api/fpl-data');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const fplData: FPLData = await response.json();
        setData(fplData);
        
        // Cache the result
        localStorage.setItem(cacheKey, JSON.stringify({
          data: fplData,
          timestamp: Date.now()
        }));
        
      } catch (err: any) {
        console.error("Failed to fetch FPL data:", err);
        setError("Tidak dapat memuatkan data FPL sekarang. Cuba lagi nanti.");
      } finally {
        setLoading(false);
      }
    }
    
    fetchFPLData();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
          <div className="card p-4 lg:p-5 mb-6 lg:mb-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-cyan mx-auto mb-4"></div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white mb-2">
                Memuatkan Data FPL Analytics
              </h1>
              <p className="text-white/80">Mengambil data terkini dari Fantasy Premier League...</p>
            </div>
          </div>
          
          {/* Loading Skeleton */}
          <div className="space-y-6">
            <div className="card p-4 lg:p-5 animate-pulse">
              <div className="space-y-4">
                <div className="h-6 bg-white/20 rounded w-1/3"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, cardIndex) => (
                    <div key={cardIndex} className="card p-4 animate-pulse">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="h-4 bg-white/20 rounded w-16"></div>
                          <div className="h-3 bg-white/20 rounded w-20"></div>
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
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
          <div className="card p-4 lg:p-5 mb-6 lg:mb-8 border-red-500/30 bg-red-500/10">
            <div className="text-center">
              <div className="text-red-300 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-red-300 mb-2">
                Ralat Memuatkan Data FPL
              </h1>
              <p className="text-red-200">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Cuba Lagi
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!data) return null;

  // Get top 10 players by total points
  const topPlayers = data.players
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 10);

  // Calculate key statistics
  const averagePoints = data.players.reduce((sum, player) => sum + player.totalPoints, 0) / data.players.length;
  
  const mostTransferredIn = data.players.reduce((max, player) => 
    player.transfersIn > max.transfersIn ? player : max
  );
  
  const mostTransferredOut = data.players.reduce((max, player) => 
    player.transfersOut > max.transfersOut ? player : max
  );

  const stats = {
    averagePoints,
    mostTransferredIn: {
      name: mostTransferredIn.webName,
      transfersIn: mostTransferredIn.transfersIn
    },
    mostTransferredOut: {
      name: mostTransferredOut.webName,
      transfersOut: mostTransferredOut.transfersOut
    }
  };

  return (
    <main className="min-h-screen">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="card p-4 lg:p-5 mb-6 lg:mb-8">
          <div className="text-center">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white mb-2">
              FPL Analytics
            </h1>
            <p className="text-white/80">
              Analisis mendalam mengenai Fantasy Premier League dengan data real-time
            </p>
            <div className="mt-3 text-sm text-white/60">
              Data dikemas kini setiap 6 jam dari Fantasy Premier League API
            </div>
          </div>
        </div>

        {/* Top Players Section */}
        <div className="card p-4 lg:p-5 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center">
              <svg className="w-5 h-5 mr-2 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Top 10 Players by Total Points
            </h2>
            <div className="text-sm text-white/60">
              {topPlayers.length} players
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {topPlayers.map((player) => {
              const team = data.teams.find(t => t.id === player.teamId);
              if (!team) return null;
              
              return (
                <FPLPlayerCard 
                  key={player.id} 
                  player={player} 
                  team={team} 
                />
              );
            })}
          </div>
        </div>

        {/* Key Statistics */}
        <StatsSection stats={stats} />

        {/* View More Analytics Button */}
      </div>
    </main>
  );
}
