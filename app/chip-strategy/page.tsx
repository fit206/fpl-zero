'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Check, X, Clock, Lightbulb, AlertCircle } from 'lucide-react';

type Chip = {
  name: string;
  displayName: string;
  description: string;
  icon: string;
  used: boolean;
  canUse: boolean;
};

type ChipRecommendation = {
  recommendedGW: number | null;
  reason: string;
  priority: number;
  tips: string[];
};

type ChipStrategyData = {
  teamInfo: {
    managerName: string;
    teamName: string;
    overallPoints: number;
    overallRank: number;
    currentGW: number;
  };
  chips: Chip[];
  recommendations: {
    [key: string]: ChipRecommendation;
  };
  upcomingGWs: any[];
  deadlineInfo: {
    nextGW: number;
    deadlineTime: string;
  } | null;
};

export default function ChipStrategyPage() {
  const [entryId, setEntryId] = useState('');
  const [data, setData] = useState<ChipStrategyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualChipStatus, setManualChipStatus] = useState<{[key: string]: boolean}>({});

  // Load saved entry ID and manual chip status
  useEffect(() => {
    const saved = localStorage.getItem('transferData');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.entryId) {
          setEntryId(parsed.entryId.toString());
        }
      } catch (e) {}
    }

    // Load manual chip status
    const savedChips = localStorage.getItem('chipStatus');
    if (savedChips) {
      try {
        setManualChipStatus(JSON.parse(savedChips));
      } catch (e) {}
    }
  }, []);

  const toggleChipStatus = (chipName: string, currentStatus: boolean) => {
    const newStatus = { ...manualChipStatus, [chipName]: !currentStatus };
    setManualChipStatus(newStatus);
    localStorage.setItem('chipStatus', JSON.stringify(newStatus));
    
    // Update data if loaded
    if (data) {
      const updatedData = { ...data };
      updatedData.chips = updatedData.chips.map(chip => 
        chip.name === chipName 
          ? { ...chip, used: !currentStatus, canUse: currentStatus }
          : chip
      );
      
      // Update recommendations based on chip status
      const chipUsed = !currentStatus;
      const currentRec = updatedData.recommendations[chipName];
      updatedData.recommendations = {
        ...updatedData.recommendations,
        [chipName]: {
          ...currentRec,
          priority: chipUsed ? 0 : currentRec.priority || 3,
          recommendedGW: chipUsed ? null : currentRec.recommendedGW,
          reason: chipUsed 
            ? 'Sudah digunakan'
            : getDefaultReason(chipName, currentRec.recommendedGW)
        }
      };
      
      setData(updatedData);
    }
  };

  const getDefaultReason = (chipName: string, recommendedGW?: number | null) => {
    if (!recommendedGW) {
      const reasons: {[key: string]: string} = {
        'wildcard': 'Guna bila team anda perlu rebuild besar (banyak injuries/poor form)',
        'bboost': 'Simpan untuk Double Gameweek (DGW) - 2x fixtures dalam 1 GW',
        '3xc': 'Simpan untuk DGW atau easy home fixture untuk premium captain',
        'freehit': 'Simpan untuk Blank Gameweek (BGW) atau masa ramai team tak main'
      };
      return reasons[chipName] || 'Belum ada cadangan';
    }
    
    const reasonsWithGW: {[key: string]: string} = {
      'wildcard': `Cadangan guna sekitar GW${recommendedGW} untuk prepare/refresh team`,
      'bboost': `SIMPAN untuk GW${recommendedGW} - Double Gameweek!`,
      '3xc': `Guna GW${recommendedGW} pada captain premium dengan fixtures terbaik`,
      'freehit': `Simpan untuk GW${recommendedGW} - Blank Gameweek`
    };
    return reasonsWithGW[chipName] || `Cadangan guna pada GW${recommendedGW}`;
  };

  const fetchData = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const idNum = Number(entryId);
    if (!Number.isFinite(idNum) || idNum <= 0) {
      setError('Sila masukkan Entry ID yang sah.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/chip-strategy?entryId=${idNum}`);
      const json = await res.json();
      
      if (!res.ok) {
        setError(json?.error || 'Ralat tidak diketahui');
      } else {
        // Merge manual chip status with API data
        const mergedData = { ...json };
        mergedData.chips = json.chips.map((chip: Chip) => {
          const manualStatus = manualChipStatus[chip.name];
          if (manualStatus !== undefined) {
            return {
              ...chip,
              used: manualStatus,
              canUse: !manualStatus
            };
          }
          return chip;
        });
        
        // Update recommendations based on merged status
        mergedData.chips.forEach((chip: Chip) => {
          if (mergedData.recommendations[chip.name]) {
            mergedData.recommendations[chip.name] = {
              ...mergedData.recommendations[chip.name],
              priority: chip.used ? 0 : mergedData.recommendations[chip.name].priority,
              reason: chip.used 
                ? 'Sudah digunakan'
                : mergedData.recommendations[chip.name].reason
            };
          }
        });
        
        setData(mergedData);
      }
    } catch {
      setError('Ralat rangkaian. Cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority === 0) return 'bg-gray-500/20 border-gray-500/30';
    if (priority >= 5) return 'bg-red-500/20 border-red-500/30';
    if (priority >= 4) return 'bg-orange-500/20 border-orange-500/30';
    return 'bg-yellow-500/20 border-yellow-500/30';
  };

  const getPriorityText = (priority: number) => {
    if (priority === 0) return 'Tidak tersedia';
    if (priority >= 5) return 'Prioriti SANGAT TINGGI';
    if (priority >= 4) return 'Prioriti Tinggi';
    if (priority >= 3) return 'Prioriti Sederhana';
    return 'Prioriti Rendah';
  };

  return (
    <main className="min-h-screen">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="card p-4 lg:p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-brand-purple/20 border border-brand-purple/30">
              <Sparkles className="w-6 h-6 text-brand-purple" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">Chip Strategy Advisor</h1>
              <p className="text-sm muted mt-1">
                Rancang strategi penggunaan chips dengan bijak
              </p>
            </div>
          </div>

          <form onSubmit={fetchData} className="mt-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={entryId}
                onChange={(e) => setEntryId(e.target.value)}
                placeholder="Masukkan FPL Entry ID"
                className="flex-1 rounded-xl bg-plum-700/70 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand-purple"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl px-6 py-2 text-sm font-bold text-plum-900 whitespace-nowrap"
                style={{
                  background: 'linear-gradient(90deg, #3DE0FF 0%, #7B61FF 45%, #9B25FF 100%)',
                }}
              >
                {loading ? 'Memuat...' : 'Analisis Chips'}
              </button>
            </div>

            {error && (
              <div className="mt-3 rounded-lg border border-red-400/30 bg-red-500/10 text-red-200 px-3 py-2 text-sm">
                {error}
              </div>
            )}
          </form>
        </div>

        {data && (
          <>
            {/* Team Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="card p-4">
                <div className="text-xs muted mb-1">Manager</div>
                <div className="text-lg font-bold">{data.teamInfo.managerName}</div>
                <div className="text-sm text-white/70">{data.teamInfo.teamName}</div>
              </div>
              <div className="card p-4">
                <div className="text-xs muted mb-1">Gameweek Semasa</div>
                <div className="text-3xl font-extrabold text-brand-cyan">GW {data.teamInfo.currentGW}</div>
              </div>
              <div className="card p-4">
                <div className="text-xs muted mb-1">Overall Rank</div>
                <div className="text-lg font-bold text-brand-green">
                  {data.teamInfo.overallRank.toLocaleString()}
                </div>
                <div className="text-sm text-white/70">
                  {data.teamInfo.overallPoints} points
                </div>
              </div>
            </div>

            {/* Upcoming Gameweeks Preview */}
            {data.upcomingGWs && data.upcomingGWs.length > 0 && (
              <div className="card p-4 lg:p-6 mb-6">
                <h2 className="text-lg font-bold mb-3">Upcoming Gameweeks</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {data.upcomingGWs.map((gw: any) => (
                    <div
                      key={gw.id}
                      className={`p-3 rounded-lg border-2 text-center ${
                        gw.isDGW
                          ? 'bg-green-500/20 border-green-500/50'
                          : gw.isBGW
                          ? 'bg-orange-500/20 border-orange-500/50'
                          : 'bg-plum-700/30 border-white/10'
                      }`}
                    >
                      <div className="text-xs text-white/60 mb-1">
                        {gw.isDGW ? '⚡ DGW' : gw.isBGW ? '⚠️ BGW' : 'Normal'}
                      </div>
                      <div className="text-2xl font-extrabold text-brand-cyan">
                        {gw.id}
                      </div>
                      <div className="text-xs text-white/70 mt-1">
                        {gw.fixtureCount} fixtures
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-white/60 flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-green-500/50"></div>
                    <span>DGW = Double Gameweek</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-orange-500/50"></div>
                    <span>BGW = Blank Gameweek</span>
                  </div>
                </div>
              </div>
            )}

            {/* Chips Status */}
            <div className="card p-4 lg:p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Status Chips</h2>
                <div className="text-xs text-white/60">
                  Klik pada chip untuk tandakan sebagai digunakan/tersedia
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {data.chips.map((chip) => (
                  <button
                    key={chip.name}
                    onClick={() => toggleChipStatus(chip.name, chip.used)}
                    className={`p-4 rounded-xl border-2 transition-all text-left cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                      chip.used
                        ? 'bg-gray-900/30 border-gray-500/30 hover:border-gray-400/40'
                        : 'bg-plum-700/30 border-brand-cyan/30 hover:border-brand-cyan/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-4xl">{chip.icon}</div>
                      <div>
                        {chip.used ? (
                          <div className="flex items-center gap-1 text-xs font-bold text-gray-400">
                            <Check className="w-4 h-4" />
                            <span>Digunakan</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs font-bold text-green-400">
                            <Sparkles className="w-4 h-4" />
                            <span>Tersedia</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="font-bold text-lg mb-1">{chip.displayName}</div>
                    <div className="text-xs text-white/60 mb-3">{chip.description}</div>
                    <div className="text-xs text-brand-cyan/80 font-medium">
                      Klik untuk {chip.used ? 'tandakan tersedia' : 'tandakan digunakan'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Strategi & Cadangan</h2>
              
              {Object.entries(data.recommendations)
                .sort(([, a], [, b]) => b.priority - a.priority)
                .map(([chipName, rec]) => {
                  const chip = data.chips.find(c => c.name === chipName);
                  if (!chip) return null;

                  return (
                    <div
                      key={chipName}
                      className={`card p-4 lg:p-6 border-2 ${getPriorityColor(rec.priority)}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="text-5xl">{chip.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="text-xl font-bold">{chip.displayName}</h3>
                            {rec.recommendedGW && (
                              <div className="px-4 py-1.5 rounded-full text-sm font-extrabold bg-gradient-to-r from-brand-cyan to-brand-purple text-white shadow-lg">
                                🎯 GW {rec.recommendedGW}
                              </div>
                            )}
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              rec.priority === 0 ? 'bg-gray-500/30 text-gray-400' :
                              rec.priority >= 5 ? 'bg-red-500/30 text-red-400' :
                              rec.priority >= 4 ? 'bg-orange-500/30 text-orange-400' :
                              'bg-yellow-500/30 text-yellow-400'
                            }`}>
                              {getPriorityText(rec.priority)}
                            </span>
                          </div>

                          <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-plum-700/30">
                            <Lightbulb className="w-5 h-5 text-brand-cyan flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <div className="font-medium text-sm text-white/90 mb-1">
                                Cadangan:
                              </div>
                              <div className="text-sm text-white/70">{rec.reason}</div>
                            </div>
                          </div>

                          {rec.tips.length > 0 && (
                            <div>
                              <div className="font-medium text-sm mb-2 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-brand-purple" />
                                Tips Strategi:
                              </div>
                              <ul className="space-y-2">
                                {rec.tips.map((tip, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm text-white/70">
                                    <span className="text-brand-cyan">•</span>
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* General Tips */}
            <div className="card p-4 lg:p-6 mt-6 bg-gradient-to-br from-plum-800/50 to-plum-900/50 border border-brand-purple/30">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-purple" />
                Tips Umum Penggunaan Chips
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/80">
                <div>
                  <div className="font-semibold text-brand-cyan mb-2">📅 Timing</div>
                  <ul className="space-y-1 text-xs">
                    <li>• Jangan rush guna chips terlalu awal</li>
                    <li>• Monitor fixture announcements (DGW/BGW)</li>
                    <li>• Check team news sebelum activate</li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold text-brand-cyan mb-2">💡 Planning</div>
                  <ul className="space-y-1 text-xs">
                    <li>• Planning perlu start 2-3 GW awal</li>
                    <li>• Align transfers dengan chip strategy</li>
                    <li>• Monitor pesaing liga anda</li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold text-brand-cyan mb-2">⚠️ Risk Management</div>
                  <ul className="space-y-1 text-xs">
                    <li>• Backup plan kalau player injured</li>
                    <li>• Check rotation risk untuk DGW</li>
                    <li>• Diversify team (jangan all-in 1 team)</li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold text-brand-cyan mb-2">🎯 Priority Order</div>
                  <ul className="space-y-1 text-xs">
                    <li>• 1. Bench Boost (DGW) - Highest points potential</li>
                    <li>• 2. Triple Captain (DGW/Easy fixture)</li>
                    <li>• 3. Free Hit (BGW)</li>
                    <li>• 4. Wildcard (When needed)</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Instructions */}
        {!data && !loading && (
          <div className="card p-6 text-center">
            <div className="text-white/60 max-w-md mx-auto">
              <p className="mb-4">Masukkan FPL Entry ID anda untuk mula menganalisis strategi chips</p>
              <div className="text-sm">
                <p className="mb-3">Feature ini akan membantu anda:</p>
                <ul className="mt-2 space-y-1 text-left">
                  <li>✅ Check status chips (used/available)</li>
                  <li>✅ <strong>Klik pada chip</strong> untuk update status jika tidak tepat</li>
                  <li>✅ Dapatkan cadangan optimal untuk setiap chip</li>
                  <li>✅ Tips dan strategi penggunaan chips</li>
                  <li>✅ Maximize points potential</li>
                </ul>
                <div className="mt-4 p-3 rounded-lg bg-brand-cyan/10 border border-brand-cyan/20 text-xs text-left">
                  <p className="text-brand-cyan font-semibold mb-1">💡 Tips:</p>
                  <p className="text-white/70">
                    Status chips yang anda set akan disimpan secara automatik. 
                    Jika ada chip yang sudah digunakan tapi tidak detected, 
                    klik pada chip tersebut untuk tandakan sebagai 'Digunakan'.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

