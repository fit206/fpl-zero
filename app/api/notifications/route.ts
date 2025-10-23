import { NextRequest, NextResponse } from 'next/server';

const FPL_BASE = 'https://fantasy.premierleague.com/api';

export async function GET(req: NextRequest) {
  try {
    // Fetch bootstrap data
    const bootstrapRes = await fetch(`${FPL_BASE}/bootstrap-static/`, {
      cache: 'no-store'
    });
    if (!bootstrapRes.ok) {
      throw new Error('Failed to fetch bootstrap data');
    }
    const bootstrap = await bootstrapRes.json();

    // Get current gameweek
    const currentEvent = bootstrap.events.find((e: any) => e.is_current);
    const nextEvent = bootstrap.events.find((e: any) => e.is_next);
    const currentGW = currentEvent ? currentEvent.id : 1;

    const notifications: any[] = [];

    // 1. DEADLINE ALERTS
    if (nextEvent) {
      const deadline = new Date(nextEvent.deadline_time);
      const now = new Date();
      const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilDeadline > 0 && hoursUntilDeadline <= 24) {
        notifications.push({
          id: `deadline-gw${nextEvent.id}`,
          type: 'deadline',
          priority: 'high',
          title: `Deadline Menghampiri!`,
          message: `GW${nextEvent.id} deadline dalam ${Math.floor(hoursUntilDeadline)} jam`,
          timestamp: deadline.toISOString(),
          action: '/transfer',
          icon: '⏰',
        });
      } else if (hoursUntilDeadline > 24 && hoursUntilDeadline <= 48) {
        notifications.push({
          id: `deadline-gw${nextEvent.id}`,
          type: 'deadline',
          priority: 'medium',
          title: `Deadline GW${nextEvent.id}`,
          message: `${Math.floor(hoursUntilDeadline / 24)} hari lagi`,
          timestamp: deadline.toISOString(),
          action: '/transfer',
          icon: '📅',
        });
      }
    }

    // 2. PRICE CHANGES (Last 24 hours)
    const priceChanges = bootstrap.elements
      .filter((p: any) => p.cost_change_event !== 0)
      .sort((a: any, b: any) => Math.abs(b.cost_change_event) - Math.abs(a.cost_change_event))
      .slice(0, 10);

    if (priceChanges.length > 0) {
      const risers = priceChanges.filter((p: any) => p.cost_change_event > 0).length;
      const fallers = priceChanges.filter((p: any) => p.cost_change_event < 0).length;
      
      notifications.push({
        id: `prices-gw${currentGW}`,
        type: 'price',
        priority: 'medium',
        title: 'Price Changes',
        message: `${risers} naik, ${fallers} turun hari ini`,
        timestamp: new Date().toISOString(),
        action: '/price-changes',
        icon: '💰',
        data: { risers, fallers },
      });
    }

    // 3. INJURY ALERTS (Players with status)
    const injuredPlayers = bootstrap.elements
      .filter((p: any) => 
        p.news && p.news.trim() !== '' &&
        (p.chance_of_playing_next_round !== null && p.chance_of_playing_next_round < 100)
      )
      .filter((p: any) => parseFloat(p.selected_by_percent) > 5) // Only popular players
      .slice(0, 15);

    if (injuredPlayers.length > 0) {
      const critical = injuredPlayers.filter((p: any) => 
        (p.chance_of_playing_next_round || 0) < 50
      ).length;

      notifications.push({
        id: `injuries-gw${currentGW}`,
        type: 'injury',
        priority: critical > 0 ? 'high' : 'medium',
        title: 'Injury Updates',
        message: `${injuredPlayers.length} pemain ada injury concerns`,
        timestamp: new Date().toISOString(),
        action: '/news',
        icon: '🏥',
        data: { total: injuredPlayers.length, critical },
      });
    }

    // 4. TRENDING TRANSFERS
    const trendingIn = bootstrap.elements
      .filter((p: any) => p.transfers_in_event > 0)
      .sort((a: any, b: any) => b.transfers_in_event - a.transfers_in_event)
      .slice(0, 3);

    const trendingOut = bootstrap.elements
      .filter((p: any) => p.transfers_out_event > 0)
      .sort((a: any, b: any) => b.transfers_out_event - a.transfers_out_event)
      .slice(0, 3);

    if (trendingIn.length > 0) {
      const topPlayer = trendingIn[0];
      notifications.push({
        id: `trending-gw${currentGW}`,
        type: 'transfer',
        priority: 'low',
        title: 'Trending Transfers',
        message: `${topPlayer.web_name} paling ramai di-transfer masuk`,
        timestamp: new Date().toISOString(),
        action: '/news#transfers',
        icon: '📈',
        data: { 
          topIn: topPlayer.web_name,
          topOut: trendingOut[0]?.web_name 
        },
      });
    }

    // 5. FORM ALERTS (Players in excellent form)
    const hotPlayers = bootstrap.elements
      .filter((p: any) => parseFloat(p.form) >= 7 && parseFloat(p.selected_by_percent) < 15)
      .sort((a: any, b: any) => parseFloat(b.form) - parseFloat(a.form))
      .slice(0, 5);

    if (hotPlayers.length > 0) {
      notifications.push({
        id: `form-gw${currentGW}`,
        type: 'form',
        priority: 'low',
        title: 'Hot Form Players',
        message: `${hotPlayers.length} pemain low-owned dalam form cemerlang`,
        timestamp: new Date().toISOString(),
        action: '/differential-finder',
        icon: '🔥',
        data: { count: hotPlayers.length },
      });
    }

    // 6. FIXTURE ANNOUNCEMENTS
    // Check for potential DGW/BGW in next 5 gameweeks
    const fixturesRes = await fetch(`${FPL_BASE}/fixtures/`, {
      cache: 'no-store'
    });
    const fixtures = fixturesRes.ok ? await fixturesRes.json() : [];
    
    const teamFixtureCount: any = {};
    for (let gw = currentGW + 1; gw <= currentGW + 5; gw++) {
      const gwFixtures = fixtures.filter((f: any) => f.event === gw);
      gwFixtures.forEach((f: any) => {
        if (!teamFixtureCount[gw]) teamFixtureCount[gw] = {};
        teamFixtureCount[gw][f.team_h] = (teamFixtureCount[gw][f.team_h] || 0) + 1;
        teamFixtureCount[gw][f.team_a] = (teamFixtureCount[gw][f.team_a] || 0) + 1;
      });

      // Check for DGW
      const teamsWithDGW = Object.values(teamFixtureCount[gw] || {}).filter((count: any) => count >= 2).length;
      if (teamsWithDGW >= 4) {
        notifications.push({
          id: `dgw-gw${gw}`,
          type: 'fixture',
          priority: 'high',
          title: `Double Gameweek Alert!`,
          message: `GW${gw} mungkin DGW - ${teamsWithDGW}+ teams main 2x`,
          timestamp: new Date().toISOString(),
          action: '/fixture-planner',
          icon: '⚡',
          data: { gw, teamsCount: teamsWithDGW },
        });
      }
    }

    // Sort by priority and timestamp
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    notifications.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return NextResponse.json({
      currentGW,
      totalNotifications: notifications.length,
      notifications,
      lastUpdated: new Date().toISOString(),
      stats: {
        high: notifications.filter(n => n.priority === 'high').length,
        medium: notifications.filter(n => n.priority === 'medium').length,
        low: notifications.filter(n => n.priority === 'low').length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Ralat mengambil notifications' },
      { status: 500 }
    );
  }
}

