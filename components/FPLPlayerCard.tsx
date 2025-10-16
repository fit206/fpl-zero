"use client";

interface FPLPlayerCardProps {
  player: {
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
  };
  team: {
    id: number;
    name: string;
    shortName: string;
    code: number;
  };
}

const positionMap = {
  1: 'GK',
  2: 'DEF',
  3: 'MID',
  4: 'FWD'
};

const positionColors = {
  1: 'bg-green-500/20 text-green-400 border-green-500/30',
  2: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  3: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  4: 'bg-red-500/20 text-red-400 border-red-500/30'
};

export default function FPLPlayerCard({ player, team }: FPLPlayerCardProps) {
  const formatCost = (cost: number) => {
    return `£${(cost / 10).toFixed(1)}m`;
  };

  const getFormColor = (form: number) => {
    if (form >= 7) return 'text-green-400';
    if (form >= 5) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPointsColor = (points: number) => {
    if (points >= 100) return 'text-green-400';
    if (points >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="card p-4 hover:scale-105 transition-all duration-300 cursor-pointer group border border-white/20 bg-white/5">
      <div className="space-y-3">
        {/* Header with position and team */}
        <div className="flex items-center justify-between">
          <div className={`px-2 py-1 rounded text-xs font-semibold border ${positionColors[player.position as keyof typeof positionColors]}`}>
            {positionMap[player.position as keyof typeof positionMap]}
          </div>
          <div className="text-xs text-white/60">
            {team.shortName}
          </div>
        </div>

        {/* Player name */}
        <h3 className="text-lg font-bold text-white group-hover:text-brand-cyan transition-colors">
          {player.webName}
        </h3>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <div className="text-white/60 text-xs">Total Points</div>
            <div className={`font-bold ${getPointsColor(player.totalPoints)}`}>
              {player.totalPoints}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-white/60 text-xs">Cost</div>
            <div className="font-bold text-white">
              {formatCost(player.cost)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-white/60 text-xs">Form</div>
            <div className={`font-bold ${getFormColor(player.form)}`}>
              {player.form.toFixed(1)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-white/60 text-xs">Selected By</div>
            <div className="font-bold text-white">
              {player.selectedByPercent.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Additional stats */}
        <div className="pt-2 border-t border-white/10">
          <div className="flex justify-between text-xs text-white/60">
            <span>PPG: {player.pointsPerGame.toFixed(1)}</span>
            <span>Value: {player.valueForm.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
