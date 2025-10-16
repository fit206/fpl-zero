"use client";
import { useState } from "react";
import PlayerCard from "./PlayerCard";

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

interface SectionProps {
  title: string;
  data: PlayerData[];
  searchTerm: string;
}

export default function Section({ title, data, searchTerm }: SectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Filter data based on search term
  const filteredData = data.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.team.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="card p-4 lg:p-5 mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <h2 className="text-xl font-bold text-white flex items-center">
          <span className="mr-3">{title.split(' ')[0]}</span>
          {title.split(' ').slice(1).join(' ')}
          <span className="ml-3 text-sm text-white/60">({filteredData.length})</span>
        </h2>
        <svg
          className={`w-5 h-5 text-white/60 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-4">
          {filteredData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredData.map((item) => (
                <PlayerCard key={item.id} data={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-white/40 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709" />
                </svg>
              </div>
              <p className="text-white/60">
                {searchTerm ? 'Tiada hasil ditemui untuk carian ini' : 'Tiada update ditemui'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
