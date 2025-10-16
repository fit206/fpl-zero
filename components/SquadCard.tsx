"use client";

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

interface SquadCardProps {
  player: SquadPlayer;
}

const positionColors = {
  'GK': 'bg-green-500/20 text-green-400 border-green-500/30',
  'DEF': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'MID': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'FWD': 'bg-red-500/20 text-red-400 border-red-500/30'
};

export default function SquadCard({ player }: SquadCardProps) {
  const formatCost = (cost: number) => {
    return `£${(cost / 10).toFixed(1)}m`;
  };

  const getFormColor = (form: number) => {
    if (form >= 7) return 'text-green-400';
    if (form >= 5) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getExpectedPointsColor = (points: number) => {
    if (points >= 6) return 'text-green-400';
    if (points >= 4) return 'text-yellow-400';
    return 'text-red-400';
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
            {player.teamName}
          </div>
        </div>

        {/* Player name */}
        <h3 className="text-lg font-bold text-white">
          {player.webName}
        </h3>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <div className="text-white/60 text-xs">Cost</div>
            <div className="font-bold text-white">
              {formatCost(player.cost)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-white/60 text-xs">Expected Points</div>
            <div className={`font-bold ${getExpectedPointsColor(player.expectedPoints)}`}>
              {player.expectedPoints.toFixed(1)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-white/60 text-xs">Form</div>
            <div className={`font-bold ${getFormColor(player.form)}`}>
              {player.form.toFixed(1)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-white/60 text-xs">PPG</div>
            <div className="font-bold text-white">
              {player.pointsPerGame.toFixed(1)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
