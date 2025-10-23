'use client';

import React, { useState, useEffect } from 'react';
import { Bell, RefreshCw, AlertCircle, TrendingUp, Calendar, DollarSign, Heart, Zap, X } from 'lucide-react';
import Link from 'next/link';

type Notification = {
  id: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  timestamp: string;
  action?: string;
  icon: string;
  data?: any;
};

type NotificationData = {
  currentGW: number;
  totalNotifications: number;
  notifications: Notification[];
  lastUpdated: string;
  stats: {
    high: number;
    medium: number;
    low: number;
  };
};

export default function NotificationsPage() {
  const [data, setData] = useState<NotificationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
    // Load dismissed notifications
    const saved = localStorage.getItem('dismissedNotifications');
    if (saved) {
      try {
        setDismissedIds(new Set(JSON.parse(saved)));
      } catch (e) {}
    }

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/notifications');
      const json = await res.json();
      
      if (!res.ok) {
        setError(json?.error || 'Ralat tidak diketahui');
      } else {
        setData(json);
      }
    } catch {
      setError('Ralat rangkaian. Cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const dismissNotification = (id: string) => {
    const newDismissed = new Set(dismissedIds);
    newDismissed.add(id);
    setDismissedIds(newDismissed);
    localStorage.setItem('dismissedNotifications', JSON.stringify(Array.from(newDismissed)));
  };

  const clearAllDismissed = () => {
    setDismissedIds(new Set());
    localStorage.removeItem('dismissedNotifications');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'deadline': return Calendar;
      case 'price': return DollarSign;
      case 'injury': return Heart;
      case 'transfer': return TrendingUp;
      case 'form': return Zap;
      case 'fixture': return AlertCircle;
      default: return Bell;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500/50 bg-red-500/10';
      case 'medium': return 'border-yellow-500/50 bg-yellow-500/10';
      default: return 'border-blue-500/50 bg-blue-500/10';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/30 text-red-400';
      case 'medium': return 'bg-yellow-500/30 text-yellow-400';
      default: return 'bg-blue-500/30 text-blue-400';
    }
  };

  const getFilteredNotifications = () => {
    if (!data) return [];
    let filtered = data.notifications.filter(n => !dismissedIds.has(n.id));
    if (filterType !== 'all') {
      filtered = filtered.filter(n => n.type === filterType);
    }
    return filtered;
  };

  const getRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Baru sahaja';
    if (diffMins < 60) return `${diffMins} minit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    return `${diffDays} hari lalu`;
  };

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="card p-4 lg:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-brand-purple/20 border border-brand-purple/30 relative">
                <Bell className="w-6 h-6 text-brand-purple" />
                {data && data.totalNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center">
                    {data.totalNotifications}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-extrabold">Notifications & Alerts</h1>
                <p className="text-sm muted mt-1">
                  Stay updated dengan FPL news terkini
                </p>
              </div>
            </div>

            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 rounded-lg bg-plum-700/50 hover:bg-plum-700 transition-all disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {error && (
            <div className="mt-3 rounded-lg border border-red-400/30 bg-red-500/10 text-red-200 px-3 py-2 text-sm">
              {error}
            </div>
          )}
        </div>

        {data && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="card p-4">
                <div className="text-xs text-red-400 mb-1">High Priority</div>
                <div className="text-2xl font-extrabold">{data.stats.high}</div>
              </div>
              <div className="card p-4">
                <div className="text-xs text-yellow-400 mb-1">Medium</div>
                <div className="text-2xl font-extrabold">{data.stats.medium}</div>
              </div>
              <div className="card p-4">
                <div className="text-xs text-blue-400 mb-1">Low</div>
                <div className="text-2xl font-extrabold">{data.stats.low}</div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {['all', 'deadline', 'price', 'injury', 'transfer', 'form', 'fixture'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${
                    filterType === type
                      ? 'bg-gradient-to-r from-brand-cyan to-brand-purple text-white'
                      : 'bg-plum-700/30 text-white/70 hover:text-white hover:bg-plum-700/50'
                  }`}
                >
                  {type === 'all' ? 'Semua' : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            {dismissedIds.size > 0 && (
              <div className="mb-4">
                <button
                  onClick={clearAllDismissed}
                  className="text-sm text-brand-cyan hover:underline"
                >
                  Show {dismissedIds.size} dismissed notifications
                </button>
              </div>
            )}

            {/* Notifications List */}
            <div className="space-y-3">
              {getFilteredNotifications().map((notification) => {
                const IconComponent = getIcon(notification.type);
                
                return (
                  <div
                    key={notification.id}
                    className={`card p-4 border-2 ${getPriorityColor(notification.priority)} hover:border-opacity-70 transition-all`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon & Priority */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-plum-700/50 flex items-center justify-center text-2xl">
                          {notification.icon}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-bold text-lg">{notification.title}</h3>
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${getPriorityBadge(notification.priority)}`}>
                                {notification.priority.toUpperCase()}
                              </span>
                              <span className="text-xs text-white/60">
                                {getRelativeTime(notification.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-white/80">{notification.message}</p>

                            {/* Additional Data */}
                            {notification.data && (
                              <div className="mt-2 flex gap-3 text-xs text-white/60">
                                {Object.entries(notification.data).map(([key, value]) => (
                                  <span key={key}>
                                    {key}: <span className="font-semibold text-brand-cyan">{String(value)}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Dismiss */}
                          <button
                            onClick={() => dismissNotification(notification.id)}
                            className="p-1 rounded-lg hover:bg-plum-700/50 transition-all"
                            title="Dismiss"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Action Button */}
                        {notification.action && (
                          <Link
                            href={notification.action}
                            className="inline-block mt-2 px-4 py-1.5 rounded-lg bg-plum-700/50 hover:bg-plum-700 text-sm font-semibold transition-all"
                          >
                            View Details →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {getFilteredNotifications().length === 0 && (
                <div className="card p-12 text-center">
                  <div className="text-white/60">
                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Tiada notifications {filterType !== 'all' ? `untuk ${filterType}` : ''}</p>
                    <p className="text-sm mt-2">Semua clear! 🎉</p>
                  </div>
                </div>
              )}
            </div>

            {/* Last Updated */}
            <div className="mt-6 text-center text-xs text-white/40">
              Dikemaskini: {new Date(data.lastUpdated).toLocaleString('ms-MY')}
            </div>

            {/* Info */}
            <div className="card p-4 lg:p-6 mt-6 bg-gradient-to-br from-plum-800/50 to-plum-900/50 border border-brand-purple/30">
              <h3 className="text-lg font-bold mb-3">Notification Types</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-semibold text-brand-cyan">⏰ Deadline:</span>
                  <span className="text-white/70 ml-2">Gameweek deadline reminders</span>
                </div>
                <div>
                  <span className="font-semibold text-brand-cyan">💰 Price:</span>
                  <span className="text-white/70 ml-2">Player price changes</span>
                </div>
                <div>
                  <span className="font-semibold text-brand-cyan">🏥 Injury:</span>
                  <span className="text-white/70 ml-2">Injury updates & doubts</span>
                </div>
                <div>
                  <span className="font-semibold text-brand-cyan">📈 Transfer:</span>
                  <span className="text-white/70 ml-2">Trending transfers</span>
                </div>
                <div>
                  <span className="font-semibold text-brand-cyan">🔥 Form:</span>
                  <span className="text-white/70 ml-2">Hot form players</span>
                </div>
                <div>
                  <span className="font-semibold text-brand-cyan">⚡ Fixture:</span>
                  <span className="text-white/70 ml-2">DGW/BGW announcements</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Loading State */}
        {loading && !data && (
          <div className="card p-12 text-center">
            <div className="text-white/60">
              <Bell className="w-12 h-12 mx-auto mb-3 animate-pulse" />
              <p>Loading notifications...</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

