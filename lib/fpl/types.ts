export interface PlayerElement {
  id: number;
  code: number; // FPL player code untuk headshot
  first_name: string;
  second_name: string;
  web_name: string;
  team: number;
  element_type: number;
  now_cost: number;
  status: string;
  chance_of_playing_next_round: number | null;
  form: string;
  points_per_game: string;

  news?: string | null;
  news_added?: string | null;

  yellow_cards?: number;
  red_cards?: number;

  // optional stats (digunakan jika ada pada bootstrap)
  minutes?: number;
  expected_goals_per_90?: string | null;
  expected_assists_per_90?: string | null;
  expected_goal_involvements_per_90?: string | null;
  selected_by_percent?: string;
}

export interface Team {
  id: number;
  name: string;
  short_name?: string; // penting untuk label lawan
  code?: number;
  // optional strengths dari FPL bootstrap (jika ada)
  strength_overall_home?: number;
  strength_overall_away?: number;
  strength_attack_home?: number;
  strength_attack_away?: number;
  strength_defence_home?: number;
  strength_defence_away?: number;
}

export interface Event {
  id: number;
  is_current: boolean;
  is_next: boolean;
}

export interface Fixture {
  event: number | null;
  team_h: number;
  team_a: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
  kickoff_time?: string | null; // <-- untuk pilih perlawanan terdekat/DGW
  
  // medan tambahan dari FPL
  finished?: boolean;
  finished_provisional?: boolean;
  started?: boolean;
  team_h_score?: number | null;
  team_a_score?: number | null;
}

export interface Pick {
  element: number;
  position?: number;           // optional: 1..15
  multiplier?: number;         // optional: >0 starter, 0 bench
  is_captain?: boolean;
  is_vice_captain?: boolean;
}

export interface PicksResponse {
  picks: Pick[];
  entry_history: {
    bank: number;
    event_transfers_cost: number;
  };
}

export interface ElementType {
  id: number;
  singular_name_short: 'GK' | 'DEF' | 'MID' | 'FWD' | string;
}

export interface Bootstrap {
  elements: PlayerElement[];
  teams: Team[];
  events: Event[];
  element_types: ElementType[];
}

export interface TransferSuggestion {
  pos: string;
  outId: number;
  outName: string;
  priceOut: number;
  ePtsOut: number;
  inId: number;
  inName: string;
  priceIn: number;
  ePtsIn: number;
  delta: number;
}

export interface LineupPlayer {
  id: number;
  name: string;
  pos: 'GK' | 'DEF' | 'MID' | 'FWD';
  teamId: number;
  teamCode?: number;
  teamShort: string;
  position: number;
  isCaptain: boolean;
  isVice: boolean;
  fixtures: { oppShort: string; home: boolean }[];
}

export interface Lineup {
  starters: LineupPlayer[];
  bench: LineupPlayer[];
}

export interface RecommendationsResponse {
  gw: number;
  bank: number;
  suggestions: TransferSuggestion[];
  lineup?: Lineup;
  managerName?: string;
  teamName?: string;
  entryId?: number;
}
