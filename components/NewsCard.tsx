"use client";

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  thumbnail: string;
  url: string;
  publishedAt: string;
  source: string;
}

interface NewsCardProps {
  article: NewsArticle;
  onReadMore: (article: NewsArticle) => void;
}

export default function NewsCard({ article, onReadMore }: NewsCardProps) {
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
        {/* Thumbnail */}
        <div className="w-full h-32 bg-gradient-to-br from-brand-cyan/20 to-blue-500/20 rounded-lg flex items-center justify-center">
          <div className="text-brand-cyan text-4xl">⚽</div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white line-clamp-2">
          {article.title}
        </h3>

        {/* Summary */}
        <p className="text-sm text-white/80 line-clamp-3">
          {article.summary}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="text-xs text-white/60">
              {article.source} • {formatDate(article.publishedAt)}
            </div>
            {/* Real news indicator */}
            {(article.id.startsWith('transfer-') ||
              article.id.startsWith('fpl-') ||
              article.id.startsWith('table-') ||
              article.id.startsWith('champions-') ||
              article.id.startsWith('var-') ||
              article.id.startsWith('youth-') ||
              article.id.startsWith('financial-') ||
              article.id.startsWith('injuries-') ||
              article.id.startsWith('tactics-') ||
              article.id.startsWith('stats-') ||
              article.id.startsWith('fixtures-') ||
              article.url.includes('premierleague.com') ||
              article.url.includes('fantasy.premierleague.com') ||
              article.url.includes('skysports.com') ||
              article.url.includes('uefa.com') ||
              article.url.includes('bbc.com') ||
              article.url.includes('theguardian.com') ||
              article.url.includes('espn.com') ||
              article.url.includes('football365.com')) && (
              <span className="px-1.5 py-0.5 bg-green-500/20 text-green-300 rounded text-xs font-medium">
                LIVE
              </span>
            )}
          </div>
          <button
            onClick={() => onReadMore(article)}
            className="text-brand-cyan hover:text-cyan-300 text-sm font-semibold transition-colors"
          >
            Read More →
          </button>
        </div>
      </div>
    </div>
  );
}
