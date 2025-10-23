"use client";

interface PlayerData {
  id: string;
  name: string;
  team: string;
  detail: string;
  date: string;
  source?: string;
  type: 'injury' | 'suspension' | 'transfer';
  link?: string;
}

interface PlayerCardProps {
  data: PlayerData;
}

export default function PlayerCard({ data }: PlayerCardProps) {
  const getTypeIcon = () => {
    switch (data.type) {
      case 'injury':
        return (
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        );
      case 'suspension':
        return (
          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'transfer':
        return (
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getTypeColor = () => {
    switch (data.type) {
      case 'injury':
        return 'border-red-500/30 bg-red-500/10';
      case 'suspension':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'transfer':
        return 'border-blue-500/30 bg-blue-500/10';
      default:
        return 'border-white/20 bg-white/5';
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const handleCardClick = () => {
    if (data.link) {
      window.open(data.link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div 
      className={`card p-4 hover:scale-105 transition-all duration-300 cursor-pointer group border ${getTypeColor()} ${data.link ? 'hover:shadow-lg' : ''}`}
      onClick={handleCardClick}
    >
      <div className="space-y-3">
        {/* Header with icon and type */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {getTypeIcon()}
            <span className="ml-2 text-xs font-semibold text-white/80 uppercase tracking-wide">
              {data.type}
            </span>
          </div>
          <div className="text-xs text-white/60">
            {formatDate(data.date)}
          </div>
        </div>

        {/* Player name */}
        <h3 className="text-lg font-bold text-white group-hover:text-brand-cyan transition-colors">
          {data.name}
        </h3>

        {/* Team */}
        <div className="flex items-center text-sm text-white/80">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          {data.team}
        </div>

        {/* Detail */}
        <div className="text-sm text-white/70">
          <span className="font-medium">Berita:</span> {data.detail}
        </div>

        {/* Source */}
        {data.source && (
          <div className="text-xs text-white/50">
            <span className="font-medium">Sumber:</span> {data.source}
          </div>
        )}

        {/* Link indicator */}
        {data.link && (
          <div className="flex items-center text-xs text-brand-cyan group-hover:text-cyan-300 transition-colors">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Klik untuk baca lebih lanjut
          </div>
        )}
      </div>
    </div>
  );
}
