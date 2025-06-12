export interface PlayerAttributes {
  passing: number;
  shooting: number;
  dribbling: number;
  pace: number;
  strength: number;
  defending: number;
}

export interface Player {
  id: string;
  name: string;
  age: number;
  nationality: string;
  mainPosition: string;
  attributes: PlayerAttributes;
  overall: number;
}

export type PositionCategory = 'GK' | 'DEF' | 'MID' | 'FWD';

export const POSITION_CATEGORIES: Record<string, PositionCategory> = {
  GK: 'GK',
  CB: 'DEF',
  LB: 'DEF',
  RB: 'DEF',
  CM: 'MID',
  CAM: 'MID',
  CDM: 'MID',
  LM: 'MID',
  RM: 'MID',
  ST: 'FWD',
  CF: 'FWD',
  LW: 'FWD',
  RW: 'FWD',
}; 