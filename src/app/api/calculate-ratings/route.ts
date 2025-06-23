import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

interface PlayerAttributes {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}

interface Player {
  id: string;
  name: string;
  shortName: string;
  age: number;
  nationality: string;
  fifaCode: string;
  mainPosition: string;
  alternatePositions: string[];
  role: 'C' | 'I' | 'R' | 'S' | 'P';
  attributes: PlayerAttributes;
  overall: number;
  potential: number;
  preferred_foot: 'Left' | 'Right';
  stats: {
    goals: number;
    assists: number;
  };
}

interface PositionPriority {
  position: string;
  priorities: string[];
}

interface PositionCount {
  position: string;
  count: number;
}

interface PlayerRating {
  player: Player;
  rating: number;
  position: string;
}

interface TeamAnalysis {
  bestXI: PlayerRating[];
  bench: PlayerRating[];
  aging: Player[];
  veterans: Player[];
  youngStars: Player[];
  positionStrengths: {
    [key: string]: {
      hasProspect: boolean;
      hasVeteran: boolean;
      hasNormal: boolean;
      hasAging: boolean;
      count: number;
      message?: string;
    };
  };
  sectorStrengths: {
    [key: string]: {
      count: number;
      message?: string;
    };
  };
}

const ROLE_WEIGHTS = {
  'C': 1.0,  // Crucial
  'I': 0.8,  // Important
  'R': 0.6,  // Rotation
  'S': 0.4,  // Squad
  'P': 0.2   // Prospect
};

const SECTORS = {
  'Defense': ['LB', 'CB', 'RB'],
  'Midfield': ['CDM', 'CM', 'CAM', 'LM', 'RM'],
  'Forward': ['LW', 'RW', 'ST'],
  'Goalkeeper': ['GK']
};

const TOGGLE_POSITIONS = ['RWB', 'RB', 'RW', 'LWB', 'LB', 'LW'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      players, 
      positionCounts, 
      positionPriorities, 
      toggledPositions 
    } = body;

    // Validate input
    if (!players || !Array.isArray(players)) {
      return NextResponse.json({ error: 'Invalid players data' }, { status: 400 });
    }

    // Calculate average age and overall for statistical analysis
    const avgAge = players.reduce((sum: number, p: Player) => sum + p.age, 0) / players.length;
    const avgOverall = players.reduce((sum: number, p: Player) => sum + p.overall, 0) / players.length;
    const ageStdDev = Math.sqrt(
      players.reduce((sum: number, p: Player) => sum + Math.pow(p.age - avgAge, 2), 0) / players.length
    );

    // Rate players for each position
    const playerRatings: PlayerRating[] = [];
    
    // Only rate players for positions that are configured in tactics
    const tacticsPositions = positionCounts
      ?.filter((pc: PositionCount) => pc.count > 0)
      .map((pc: PositionCount) => pc.position) || [];
    
    // Always include GK if there are GK players
    const positionsToRate = players.some((p: Player) => p.mainPosition === 'GK') 
      ? ['GK', ...tacticsPositions]
      : tacticsPositions;
    
    positionsToRate.forEach((position: string) => {
      players.forEach((player: Player) => {
        if (player.mainPosition === position) {
          const rating = position === 'GK' 
            ? calculateGKRating(player)
            : calculatePlayerRating(player, position, positionPriorities, toggledPositions);
          playerRatings.push({ player, rating, position });
        }
      });
    });

    // Sort by rating and select best XI
    const sortedRatings = playerRatings.sort((a, b) => b.rating - a.rating);
    const bestXI: PlayerRating[] = [];
    const usedPositions = new Set<string>();

    // Select best player for each position
    sortedRatings.forEach(({ player, rating, position }) => {
      if (bestXI.length < 11 && !usedPositions.has(position)) {
        bestXI.push({ player, rating, position });
        usedPositions.add(position);
      }
    });

    // Select bench players (remaining top players)
    const bench = sortedRatings
      .filter(({ player }) => !bestXI.some(xi => xi.player.id === player.id))
      .slice(0, 7);

    // Categorize players
    const aging = players.filter((p: Player) => p.age > avgAge + ageStdDev);
    const veterans = players.filter((p: Player) => p.age > 30 && p.overall > avgOverall);
    const youngStars = players.filter((p: Player) => p.age < avgAge - ageStdDev && p.overall > avgOverall);

    // Analyze position strengths
    const positionStrengths: TeamAnalysis['positionStrengths'] = {};
    
    // Only analyze positions that the user has set in edit tactics
    const configuredPositions = positionCounts
      ?.filter((pc: PositionCount) => pc.count > 0)
      .map((pc: PositionCount) => pc.position) || [];
    
    configuredPositions.forEach((position: string) => {
      const positionPlayers = players.filter((p: Player) => p.mainPosition === position);
      const count = positionPlayers.length;

      const hasProspect = positionPlayers.some((p: Player) => p.age < avgAge - ageStdDev);
      const hasVeteran = positionPlayers.some((p: Player) => p.age > 30);
      const hasNormal = positionPlayers.some((p: Player) => p.age >= avgAge - ageStdDev && p.age <= avgAge + ageStdDev);
      const hasAging = positionPlayers.some((p: Player) => p.age > avgAge + ageStdDev);

      let message: string | undefined;
      if (count === 0) {
        message = `No players at ${position}`;
      } else if (count < 2) {
        message = `Need more players at ${position}`;
      } else if (!hasProspect) {
        message = `Need ${position} prospects`;
      }

      positionStrengths[position] = {
        hasProspect,
        hasVeteran,
        hasNormal,
        hasAging,
        count,
        message
      };
    });

    // Analyze sector strengths
    const sectorStrengths: TeamAnalysis['sectorStrengths'] = {};
    Object.entries(SECTORS).forEach(([sector, positions]) => {
      const sectorPlayers = players.filter((p: Player) => positions.includes(p.mainPosition));
      const count = sectorPlayers.length;
      
      let message: string | undefined;
      if (count < 3) {
        message = `Weak ${sector} depth`;
      } else if (count > 8) {
        message = `Strong ${sector} depth`;
      }

      sectorStrengths[sector] = {
        count,
        message
      };
    });

    const analysis: TeamAnalysis = {
      bestXI,
      bench,
      aging,
      veterans,
      youngStars,
      positionStrengths,
      sectorStrengths
    };

    return NextResponse.json(analysis);

  } catch (error) {
    console.error('Error calculating ratings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculatePlayerRating(
  player: Player, 
  position: string, 
  positionPriorities: PositionPriority[], 
  toggledPositions: string[]
): number {
  const positionPriority = positionPriorities?.find(pp => pp.position === position);
  let rating = 0;

  // Base rating from overall
  rating += player.overall * 0.3;

  // Attribute rating based on position priorities
  if (positionPriority && positionPriority.priorities.length > 0) {
    const priorities = positionPriority.priorities;
    const attributeWeights = priorities.reduce((acc: { [key: string]: number }, attr: string, index: number) => {
      acc[attr.toLowerCase()] = 1 - (index * 0.2); // 1.0, 0.8, 0.6 for top 3
      return acc;
    }, {});

    // Calculate weighted attribute score
    const attributeScore = Object.entries(player.attributes).reduce((sum: number, [attr, value]) => {
      const weight = attributeWeights[attr] || 0.2; // Default weight for non-prioritized attributes
      return sum + (value * weight);
    }, 0) / Object.keys(player.attributes).length;

    rating += attributeScore * 0.4;
  } else {
    // If no priorities set, use average of all attributes
    const avgAttribute = Object.values(player.attributes).reduce((sum: number, val: number) => sum + val, 0) / 
      Object.keys(player.attributes).length;
    rating += avgAttribute * 0.4;
  }

  // Age rating
  const ageDiff = Math.abs(player.age - 25);
  const ageRating = Math.max(0, 1 - (ageDiff * 0.05));
  rating += ageRating * 0.15;

  // Role rating
  const roleWeight = ROLE_WEIGHTS[player.role] || 0.2;
  rating += roleWeight * 0.15;

  // Potential boost - slight boost for higher potential
  const potentialBoost = (player.potential - player.overall) * 0.02; // 2% boost per point of potential above overall
  rating += Math.max(0, potentialBoost);

  // Foot preference boost for wing positions
  if (TOGGLE_POSITIONS.includes(position)) {
    const isInverted = toggledPositions?.includes(position) || false;
    const isRightWing = ['RB', 'RWB', 'RW'].includes(position);
    const isRightFooted = player.preferred_foot === 'Right';
    
    // If inverted is off, boost same foot. If inverted is on, boost opposite foot
    if ((isRightWing && isRightFooted && !isInverted) || 
        (isRightWing && !isRightFooted && isInverted) ||
        (!isRightWing && !isRightFooted && !isInverted) ||
        (!isRightWing && isRightFooted && isInverted)) {
      rating += 0.5; // Small boost of 0.5 points
    }
  }

  return rating;
}

function calculateGKRating(player: Player): number {
  let rating = 0;

  // Base rating from overall
  rating += player.overall * 0.5;

  // Age rating
  const ageDiff = Math.abs(player.age - 25);
  const ageRating = Math.max(0, 1 - (ageDiff * 0.05));
  rating += ageRating * 0.25;

  // Role rating
  const roleWeight = ROLE_WEIGHTS[player.role] || 0.2;
  rating += roleWeight * 0.25;

  // Potential boost - slight boost for higher potential
  const potentialBoost = (player.potential - player.overall) * 0.02; // 2% boost per point of potential above overall
  rating += Math.max(0, potentialBoost);

  return rating;
} 