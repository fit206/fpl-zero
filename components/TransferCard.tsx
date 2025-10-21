"use client";

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

interface TransferCardProps {
  player: TransferPlayer;
  type: 'in' | 'out';
}

const positionColors = {
  'GK': 'bg-green-500/20 text-green-400 border-green-500/30',
  'DEF': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'MID': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'FWD': 'bg-red-500/20 text-red-400 border-red-500/30'
};

export default function TransferCard({ player, type }: TransferCardProps) {
  const transferCount = type === 'in' ? player.transfersInEvent : player.transfersOutEvent;
  const transferColor = type === 'in' ? 'text-green-400' : 'text-red-400';
  const transferIcon = type === 'in' ? '↗' : '↘';

  return (
    <div className="card p-3 hover:scale-105 transition-all duration-300 border border-white/20 bg-white/5">
      <div className="space-y-2">
        {/* Header with position and team */}
        <div className="flex items-center justify-between">
          <div className={`px-2 py-1 rounded text-xs font-semibold border ${positionColors[player.positionName as keyof typeof positionColors]}`}>
            {player.positionName}
          </div>
          <div className="text-xs text-white/60">
            {player.teamShortName}
          </div>
        </div>

        {/* Player name */}
        <h3 className="text-sm font-bold text-white">
          {player.webName}
        </h3>

        {/* Transfer count */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/60">This GW</span>
          <div className={`flex items-center text-sm font-semibold ${transferColor}`}>
            <span className="mr-1">{transferIcon}</span>
            {transferCount.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
