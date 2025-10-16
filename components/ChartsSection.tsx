"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell } from 'recharts';

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

interface ChartsSectionProps {
  players: SquadPlayer[];
}

export default function ChartsSection({ players }: ChartsSectionProps) {
  // Prepare data for position bar chart
  const positionData = players.reduce((acc, player) => {
    const existing = acc.find(item => item.position === player.positionName);
    if (existing) {
      existing.totalExpectedPoints += player.expectedPoints;
      existing.count += 1;
    } else {
      acc.push({
        position: player.positionName,
        totalExpectedPoints: player.expectedPoints,
        count: 1
      });
    }
    return acc;
  }, [] as { position: string; totalExpectedPoints: number; count: number }[]);

  // Prepare data for scatter chart (points per million cost)
  const scatterData = players.map(player => ({
    name: player.webName,
    cost: player.cost / 10, // Convert to millions
    expectedPoints: player.expectedPoints,
    position: player.positionName
  }));

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'GK': return '#10b981'; // green
      case 'DEF': return '#3b82f6'; // blue
      case 'MID': return '#f59e0b'; // yellow
      case 'FWD': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Position Bar Chart */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-white mb-4">Expected Points by Position</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={positionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="position" 
              stroke="#9ca3af"
              fontSize={12}
            />
            <YAxis 
              stroke="#9ca3af"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#f9fafb'
              }}
            />
            <Bar 
              dataKey="totalExpectedPoints" 
              fill="#06b6d4"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Scatter Chart */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-white mb-4">Points per Million Cost</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart data={scatterData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              type="number" 
              dataKey="cost" 
              name="Cost (£m)"
              stroke="#9ca3af"
              fontSize={12}
            />
            <YAxis 
              type="number" 
              dataKey="expectedPoints" 
              name="Expected Points"
              stroke="#9ca3af"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#f9fafb'
              }}
              formatter={(value, name) => [
                name === 'cost' ? `£${value}m` : value,
                name === 'cost' ? 'Cost' : 'Expected Points'
              ]}
            />
            <Scatter 
              dataKey="expectedPoints" 
              fill="#06b6d4"
            >
              {scatterData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getPositionColor(entry.position)} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
