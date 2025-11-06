// Client-side team analysis utility
// This contains all the calculation logic from the API route

import { Player, GoalkeeperAttributes } from '@/types/player';

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
  rating += player.overall * 0.3;

  // Goalkeeper-specific attribute rating
  if ('diving' in player.attributes) {
    const gkAttributes = player.attributes as GoalkeeperAttributes;
    const gkAttributeScore = (
      gkAttributes.diving * 0.25 +      // Diving is most important for GKs
      gkAttributes.handling * 0.20 +    // Handling is second most important
      gkAttributes.reflexes * 0.20 +    // Reflexes are crucial
      gkAttributes.positioning * 0.15 + // Positioning is important
      gkAttributes.kicking * 0.10 +     // Kicking is less important
      gkAttributes.speed * 0.10         // Speed is least important for GKs
    );
    rating += gkAttributeScore * 0.4;
  } else {
    // Fallback to overall if no GK attributes
    rating += player.overall * 0.4;
  }

  // Age rating - goalkeepers peak later, so adjust age curve
  const ageDiff = Math.abs(player.age - 28); // GKs peak around 28
  const ageRating = Math.max(0, 1 - (ageDiff * 0.04)); // Slower decline for GKs
  rating += ageRating * 0.15;

  // Role rating
  const roleWeight = ROLE_WEIGHTS[player.role] || 0.2;
  rating += roleWeight * 0.15;

  // Potential boost - slight boost for higher potential
  const potentialBoost = (player.potential - player.overall) * 0.02; // 2% boost per point of potential above overall
  rating += Math.max(0, potentialBoost);

  return rating;
}

export function analyzeTeam(
  players: Player[],
  positionCounts: PositionCount[],
  positionPriorities: PositionPriority[],
  toggledPositions: string[]
): TeamAnalysis {
  if (!players || players.length === 0) {
    return {
      bestXI: [],
      bench: [],
      aging: [],
      veterans: [],
      youngStars: [],
      positionStrengths: {},
      sectorStrengths: {}
    };
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
  
  // Create a map of position counts for easier lookup
  const positionCountsMap = new Map<string, number>();
  positionCounts?.forEach((pc: PositionCount) => {
    positionCountsMap.set(pc.position, pc.count);
  });
  
  // Track how many players we've selected for each position
  const selectedCounts = new Map<string, number>();

  // Initialize selected counts
  positionsToRate.forEach((position: string) => {
    selectedCounts.set(position, 0);
  });

  // First pass: Fill all required position counts (prioritize required positions)
  // Group players by position and fill required counts for each position
  const playersByPosition = new Map<string, PlayerRating[]>();
  sortedRatings.forEach((rating) => {
    if (!playersByPosition.has(rating.position)) {
      playersByPosition.set(rating.position, []);
    }
    playersByPosition.get(rating.position)!.push(rating);
  });

  // Fill required positions first - ensure we respect the counts from positionCounts
  positionsToRate.forEach((position) => {
    // Get required count from positionCountsMap, default to 1 for GK, 0 for others
    let requiredCount: number;
    if (position === 'GK') {
      requiredCount = 1; // Always need 1 GK if available
    } else {
      // For other positions, get from map, default to 0 if not found
      const mapCount = positionCountsMap.get(position);
      requiredCount = mapCount !== undefined ? mapCount : 0;
    }
    
    // Only proceed if we need players for this position
    if (requiredCount > 0) {
      const positionPlayers = playersByPosition.get(position) || [];
      
      // Select up to requiredCount players for this position
      for (let i = 0; i < Math.min(requiredCount, positionPlayers.length); i++) {
        const rating = positionPlayers[i];
        // Make sure we don't add the same player twice
        if (!bestXI.some(xi => xi.player.id === rating.player.id)) {
          bestXI.push(rating);
          selectedCounts.set(position, (selectedCounts.get(position) || 0) + 1);
        }
      }
    }
  });

  // Second pass: Fill remaining slots up to 11 with best available players
  if (bestXI.length < 11) {
    const remainingPlayers = sortedRatings.filter(({ player }) => 
      !bestXI.some(xi => xi.player.id === player.id)
    );
    
    for (let i = 0; i < remainingPlayers.length && bestXI.length < 11; i++) {
      bestXI.push(remainingPlayers[i]);
    }
  }

  // Select bench players based on sector requirements
  // Need: 2 defensive, 2 midfield, 2 forward players (prefer different positions)
  const defensivePositions = ['RB', 'RWB', 'CB', 'LWB', 'LB'];
  const midfieldPositions = ['CM', 'RM', 'LM', 'CDM', 'CAM'];
  const forwardPositions = ['ST', 'CF', 'LW', 'RW'];
  
  const remainingPlayers = sortedRatings.filter(({ player }) => 
    !bestXI.some(xi => xi.player.id === player.id)
  );
  
  const bench: PlayerRating[] = [];
  const benchPlayerIds = new Set<string>();
  
  // Get configured positions from Edit Tactics
  const configuredPositions = new Set<string>();
  positionCounts?.forEach(pc => {
    if (pc.count > 0) {
      configuredPositions.add(pc.position);
    }
  });
  if (players.some(p => p.mainPosition === 'GK')) {
    configuredPositions.add('GK');
  }
  
  // Helper function to get position category
  const getPositionCategory = (position: string): 'defense' | 'midfield' | 'forward' | null => {
    if (defensivePositions.includes(position)) return 'defense';
    if (midfieldPositions.includes(position)) return 'midfield';
    if (forwardPositions.includes(position)) return 'forward';
    return null;
  };
  
  // Helper function to select players from a sector
  const selectSectorPlayers = (
    sectorPositions: string[], 
    targetCount: number, 
    sectorName: string
  ) => {
    const sectorPlayers = remainingPlayers.filter(rating => 
      sectorPositions.includes(rating.position) && 
      configuredPositions.has(rating.position) &&
      !benchPlayerIds.has(rating.player.id)
    );
    
    const selectedPositions = new Set<string>();
    
    // First pass: try to select from different positions
    for (const rating of sectorPlayers) {
      if (bench.filter(b => getPositionCategory(b.position) === sectorName).length >= targetCount) break;
      if (!selectedPositions.has(rating.position)) {
        bench.push(rating);
        benchPlayerIds.add(rating.player.id);
        selectedPositions.add(rating.position);
      }
    }
    
    // Second pass: fill remaining slots if needed (can use same position if no other options)
    if (bench.filter(b => getPositionCategory(b.position) === sectorName).length < targetCount) {
      for (const rating of sectorPlayers) {
        if (bench.filter(b => getPositionCategory(b.position) === sectorName).length >= targetCount) break;
        if (!benchPlayerIds.has(rating.player.id)) {
          bench.push(rating);
          benchPlayerIds.add(rating.player.id);
        }
      }
    }
  };
  
  // Select 2 defensive players
  selectSectorPlayers(defensivePositions, 2, 'defense');
  
  // Select 2 midfield players
  selectSectorPlayers(midfieldPositions, 2, 'midfield');
  
  // Select 2 forward players
  selectSectorPlayers(forwardPositions, 2, 'forward');
  
  // Fill remaining slots (up to 7 total) with best available players if we don't have 6 yet
  if (bench.length < 6) {
    const remaining = remainingPlayers.filter(({ player }) => !benchPlayerIds.has(player.id));
    for (const rating of remaining) {
      if (bench.length >= 7) break;
      bench.push(rating);
      benchPlayerIds.add(rating.player.id);
    }
  }

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

  return {
    bestXI,
    bench,
    aging,
    veterans,
    youngStars,
    positionStrengths,
    sectorStrengths
  };
} 