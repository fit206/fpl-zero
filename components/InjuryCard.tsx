"use client";

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

interface InjuryCardProps {
  player: InjuryPlayer;
}

const positionColors = {
  'GK': 'bg-green-500/20 text-green-400 border-green-500/30',
  'DEF': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'MID': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'FWD': 'bg-red-500/20 text-red-400 border-red-500/30'
};

export default function InjuryCard({ player }: InjuryCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="card p-4 hover:scale-105 transition-all duration-300 border border-white/20 bg-white/5">
      <div className="space-y-3">
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
        <h3 className="text-lg font-bold text-white">
          {player.webName}
        </h3>

        {/* Status chip */}
        <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${player.statusColor}`}>
          {player.statusLabel}
        </div>

        {/* News */}
        <div className="space-y-2">
          <div className="text-sm text-white/80">
            {player.news}
          </div>
          <div className="text-xs text-white/60">
            {formatDate(player.newsAdded)}
          </div>
        </div>
      </div>
    </div>
  );
}
