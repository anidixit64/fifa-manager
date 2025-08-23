export interface PlayerAttributes {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}

export interface GoalkeeperAttributes {
  diving: number;
  handling: number;
  kicking: number;
  reflexes: number;
  speed: number;
  positioning: number;
}

export type PlayerRole = 'C' | 'I' | 'R' | 'S' | 'P';

export interface Player {
  id: string;
  name: string;
  shortName: string;
  age: number;
  nationality: string;
  fifaCode: string;
  mainPosition: string;
  alternatePositions: string[];
  role: PlayerRole;
  attributes: PlayerAttributes | GoalkeeperAttributes;
  overall: number;
  potential: number;
  preferred_foot: 'Left' | 'Right';
  stats: {
    goals: number;
    assists: number;
    redCards: number;
    shots: number;
    shotsOnTarget: number;
  };
}

export interface Team {
  id: string;
  name: string;
  country: string;
  logo?: string;
}

export type PositionCategory = 'GK' | 'DEF' | 'MID' | 'FWD';

export const POSITION_CATEGORIES: Record<string, PositionCategory> = {
  'GK': 'GK',
  'RB': 'DEF',
  'RWB': 'DEF',
  'CB': 'DEF',
  'LB': 'DEF',
  'LWB': 'DEF',
  'CM': 'MID',
  'RM': 'MID',
  'LM': 'MID',
  'CDM': 'MID',
  'CAM': 'MID',
  'RF': 'FWD',
  'RW': 'FWD',
  'LF': 'FWD',
  'LW': 'FWD',
  'ST': 'FWD',
  'CF': 'FWD'
}; 