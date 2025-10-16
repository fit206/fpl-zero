"use client";

export default function HighlightsPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f0f2f5' }}>
      <div className="p-6 md:p-10 flex flex-col items-center">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            EPL Highlights
          </h1>
          <p className="text-gray-600 text-lg">
            Tonton highlights terkini dari English Premier League
          </p>
        </div>

        {/* ScoreBat Embed */}
        <div className="w-full max-w-6xl mx-auto">
          <iframe
            src="https://www.scorebat.com/embed/competition/england-premier-league/?token=MjQ0Nzg4XzE3NjA1OTEwMTNfYTQ4ZThkMGY1OWExYjk2NGMxMWUwMTVkYzQyN2U2YzBlZGQ3YTY4OQ=="
            width="100%"
            height="700"
            frameBorder="0"
            allowFullScreen
            className="rounded-2xl shadow-md w-full"
            title="Premier League Highlights"
          />
        </div>

        {/* Footer Text */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            Video highlights disediakan oleh ScoreBat (sumber rasmi).
          </p>
        </div>
      </div>
    </main>
  );
}