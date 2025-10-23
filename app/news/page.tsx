"use client";
import { useEffect, useState } from "react";
import InjuryCard from "../../components/InjuryCard";
import TransferCard from "../../components/TransferCard";
import CountdownTimer from "../../components/CountdownTimer";

interface InjuryPlayer {
  id: number;
  name: string;
  webName: string;
  teamId: number;
  teamName: string;
  teamShortName: string;
  position: number;
  positionName: string;
  status: string;
  statusLabel: string;
  news: string;
  newsAdded: string;
  statusColor: string;
}

interface TransferPlayer {
  id: number;
  name: string;
  webName: string;
  teamId: number;
  teamName: string;
  teamShortName: string;
  position: number;
  positionName: string;
  transfersIn: number;
  transfersOut: number;
  transfersInEvent: number;
  transfersOutEvent: number;
}

interface TransferData {
  transferredIn: TransferPlayer[];
  transferredOut: TransferPlayer[];
}


export default function NewsPage() {
  const [injuries, setInjuries] = useState<InjuryPlayer[]>([]);
  const [transfers, setTransfers] = useState<TransferData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllData() {
      try {
        setLoading(true);
        setError("");

        // Fetch injuries data
        const injuriesResponse = await fetch('/api/fpl-injuries');
        if (injuriesResponse.ok) {
          const injuriesData = await injuriesResponse.json();
          setInjuries(injuriesData);
        }

        // Fetch transfers data
        const transfersResponse = await fetch('/api/fpl-transfers');
        if (transfersResponse.ok) {
          const transfersData = await transfersResponse.json();
          setTransfers(transfersData);
        }
        
      } catch (err: any) {
        console.error("Failed to fetch data:", err);
        setError("Tidak dapat memuatkan data sekarang. Cuba lagi nanti.");
      } finally {
        setLoading(false);
      }
    }

    fetchAllData();
  }, []);


  return (
    <main className="min-h-screen">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="card p-4 lg:p-5 mb-6 lg:mb-8">
          <div className="text-center">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white mb-2">
              FPL News & Updates
            </h1>
            <p className="text-white/80 mb-4">
              Maklumat terkini tentang kecederaan pemain dan trend transfer Fantasy Premier League
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-brand-cyan/20 text-brand-cyan rounded-lg hover:bg-brand-cyan/30 transition-colors text-sm font-medium"
            >
              🔄 Muat Semula Data
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
          
        {/* Main Content */}
        <div className="space-y-6">
          {/* Gameweek Deadline Countdown */}
          <CountdownTimer deadline="2024-12-21T18:30:00Z" />

          {/* Injury & Suspension Section */}
          <div className="card p-4 lg:p-5">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Status Pemain (Kecederaan & Penggantungan)
              </h2>
              <p className="text-white/60 text-sm">
                Maklumat terkini tentang kecederaan pemain dan status penggantungan dari FPL API. 
                Penggantungan kad kuning/merah mungkin tidak selalu ditunjukkan jika tidak dikemas kini dalam sistem FPL.
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="card p-4 animate-pulse">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="h-4 bg-white/20 rounded w-12"></div>
                        <div className="h-3 bg-white/20 rounded w-16"></div>
                      </div>
                      <div className="h-5 bg-white/20 rounded w-full"></div>
                      <div className="h-4 bg-white/20 rounded w-3/4"></div>
                      <div className="h-3 bg-white/20 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : injuries.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {injuries.map((player) => (
                  <InjuryCard key={player.id} player={player} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-white/60 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-white/60">Tiada maklumat kecederaan terkini</p>
              </div>
            )}
          </div>

          {/* Top Transfers Section */}
          <div id="transfers" className="card p-4 lg:p-5 scroll-mt-20">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
              <svg className="w-5 h-5 mr-2 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Transfer Teratas Minggu Ini
            </h2>

            {loading ? (
              <div className="space-y-6">
                <div>
                  <div className="h-5 bg-white/20 rounded w-48 mb-4"></div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[...Array(5)].map((_, index) => (
                      <div key={index} className="card p-3 animate-pulse">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="h-3 bg-white/20 rounded w-8"></div>
                            <div className="h-2 bg-white/20 rounded w-6"></div>
                          </div>
                          <div className="h-3 bg-white/20 rounded w-full"></div>
                          <div className="h-2 bg-white/20 rounded w-3/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="h-5 bg-white/20 rounded w-48 mb-4"></div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[...Array(5)].map((_, index) => (
                      <div key={index} className="card p-3 animate-pulse">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="h-3 bg-white/20 rounded w-8"></div>
                            <div className="h-2 bg-white/20 rounded w-6"></div>
                          </div>
                          <div className="h-3 bg-white/20 rounded w-full"></div>
                          <div className="h-2 bg-white/20 rounded w-3/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : transfers ? (
              <div className="space-y-6">
                {/* Transferred In */}
                <div>
                  <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center">
                    <span className="mr-2">↗</span>
                    Paling Banyak Dibeli
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {transfers.transferredIn.map((player) => (
                      <TransferCard key={player.id} player={player} type="in" />
                    ))}
                  </div>
                </div>

                {/* Transferred Out */}
                <div>
                  <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center">
                    <span className="mr-2">↘</span>
                    Paling Banyak Dijual
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {transfers.transferredOut.map((player) => (
                      <TransferCard key={player.id} player={player} type="out" />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-white/60 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-white/60">Tiada data transfer tersedia</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}