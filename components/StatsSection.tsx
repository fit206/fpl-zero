"use client";

interface StatsSectionProps {
  stats: {
    averagePoints: number;
    mostTransferredIn: {
      name: string;
      transfersIn: number;
    };
    mostTransferredOut: {
      name: string;
      transfersOut: number;
    };
  };
}

export default function StatsSection({ stats }: StatsSectionProps) {
  return (
    <div className="card p-6">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Key Statistics
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Average Points */}
        <div className="text-center">
          <div className="text-3xl font-bold text-brand-cyan mb-2">
            {stats.averagePoints.toFixed(1)}
          </div>
          <div className="text-white/80 text-sm">Average Points</div>
          <div className="text-white/60 text-xs mt-1">Across all players</div>
        </div>

        {/* Most Transferred In */}
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400 mb-2">
            {stats.mostTransferredIn.name}
          </div>
          <div className="text-white/80 text-sm">Most Transferred In</div>
          <div className="text-white/60 text-xs mt-1">
            {stats.mostTransferredIn.transfersIn.toLocaleString()} transfers
          </div>
        </div>

        {/* Most Transferred Out */}
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400 mb-2">
            {stats.mostTransferredOut.name}
          </div>
          <div className="text-white/80 text-sm">Most Transferred Out</div>
          <div className="text-white/60 text-xs mt-1">
            {stats.mostTransferredOut.transfersOut.toLocaleString()} transfers
          </div>
        </div>
      </div>
    </div>
  );
}
