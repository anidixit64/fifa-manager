'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useOptimizedNavigation } from '@/hooks/useOptimizedNavigation';
import { Player, PositionCategory, POSITION_CATEGORIES } from '@/types/player';

interface Team {
  id: string;
  name: string;
  country: string;
  logo?: string;
}

type TogglePosition = 'RWB' | 'RB' | 'RW' | 'LWB' | 'LB' | 'LW';

const TOGGLE_POSITIONS: TogglePosition[] = ['RWB', 'RB', 'RW', 'LWB', 'LB', 'LW'];

interface PositionCount {
  position: string;
  count: number;
}

interface PositionPriority {
  position: string;
  priorities: string[];
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

export default function BestXIPage() {
  const router = useRouter();
  const { navigateTo } = useOptimizedNavigation({ transitionDuration: 50 });
  const [selectedTeam] = useLocalStorage<Team | null>('selectedTeam', null);
  const [players, setPlayers] = useLocalStorage<Player[]>('fifaPlayers', []);
  const [positionCounts] = useLocalStorage<PositionCount[]>('positionCounts', []);
  const [positionPriorities] = useLocalStorage<PositionPriority[]>('positionPriorities', []);
  const [analysis, setAnalysis] = useState<TeamAnalysis | null>(null);
  const [toggledPositions, setToggledPositions] = useState<Set<TogglePosition>>(new Set());
  const [isClient, setIsClient] = useState(false);
  const [bestXIToggle, setBestXIToggle] = useState(false);

  // Optimized click handler
  const handlePlayerClick = useCallback((playerId: string) => {
    navigateTo(`/player-stats?playerId=${playerId}`);
  }, [navigateTo]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load toggled positions from localStorage
  useEffect(() => {
    if (isClient) {
      const storedToggles = localStorage.getItem('toggledPositions');
      if (storedToggles) {
        try {
          const parsedToggles = JSON.parse(storedToggles);
          setToggledPositions(new Set(parsedToggles));
        } catch (error) {
          console.error('Error parsing toggled positions:', error);
        }
      }
    }
  }, [isClient]);

  useEffect(() => {
    if (!selectedTeam) {
      router.push('/create-team');
    } else {
      analyzeTeam();
    }
  }, [selectedTeam, router, players, positionCounts, positionPriorities]);

  const calculatePlayerRating = (player: Player, position: string): number => {
    const positionPriority = positionPriorities.find(pp => pp.position === position);
    let rating = 0;

    // Base rating from overall
    rating += player.overall * 0.3;

    // Attribute rating based on position priorities
    if (positionPriority && positionPriority.priorities.length > 0) {
      const priorities = positionPriority.priorities;
      const attributeWeights = priorities.reduce((acc, attr, index) => {
        acc[attr.toLowerCase()] = 1 - (index * 0.2); // 1.0, 0.8, 0.6 for top 3
        return acc;
      }, {} as { [key: string]: number });

      // Calculate weighted attribute score
      const attributeScore = Object.entries(player.attributes).reduce((sum, [attr, value]) => {
        const weight = attributeWeights[attr] || 0.2; // Default weight for non-prioritized attributes
        return sum + (value * weight);
      }, 0) / Object.keys(player.attributes).length;

      rating += attributeScore * 0.4;
    } else {
      // If no priorities set, use average of all attributes
      const avgAttribute = Object.values(player.attributes).reduce((sum, val) => sum + val, 0) / 
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
    if (TOGGLE_POSITIONS.includes(position as TogglePosition)) {
      const isInverted = toggledPositions.has(position as TogglePosition);
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
  };

  const calculateGKRating = (player: Player): number => {
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
  };

  const analyzeTeam = () => {
    // Calculate average age and overall
    const avgAge = players.reduce((sum, p) => sum + p.age, 0) / players.length;
    const avgOverall = players.reduce((sum, p) => sum + p.overall, 0) / players.length;

    // Calculate standard deviations
    const ageStdDev = Math.sqrt(
      players.reduce((sum, p) => sum + Math.pow(p.age - avgAge, 2), 0) / players.length
    );

    // Rate players for each position
    const playerRatings: PlayerRating[] = [];
    
    // Only rate players for positions that are configured in tactics
    const tacticsPositions = positionCounts
      .filter(pc => pc.count > 0)
      .map(pc => pc.position);
    
    // Always include GK if there are GK players
    const positionsToRate = players.some(p => p.mainPosition === 'GK') 
      ? ['GK', ...tacticsPositions]
      : tacticsPositions;
    
    positionsToRate.forEach(position => {
      players.forEach(player => {
        // Check if player can play this position (main position or in alternatePositions)
        const canPlayPosition = player.mainPosition === position || 
                               player.alternatePositions.includes(position);
        
        if (canPlayPosition) {
          const rating = position === 'GK' 
            ? calculateGKRating(player)
            : calculatePlayerRating(player, position);
          
          // Apply position priority weighting
          let finalRating = rating;
          if (player.mainPosition === position) {
            // Main position gets full rating
            finalRating = rating;
          } else if (player.alternatePositions.includes(position)) {
            // Secondary positions get reduced rating (70% of main position rating)
            finalRating = rating * 0.7;
          }
          
          playerRatings.push({ player, rating: finalRating, position });
        }
      });
    });

    // Sort by rating and select best XI
    const sortedRatings = playerRatings.sort((a, b) => b.rating - a.rating);
    const bestXI: PlayerRating[] = [];
    const usedPositions = new Set<string>();
    const usedPlayers = new Set<string>();

    // Select best player for each position, handling conflicts
    sortedRatings.forEach(({ player, rating, position }) => {
      if (bestXI.length < 11 && !usedPositions.has(position) && !usedPlayers.has(player.id)) {
        bestXI.push({ player, rating, position });
        usedPositions.add(position);
        usedPlayers.add(player.id);
      }
    });

    // Select bench players (remaining top players)
    const bench = sortedRatings
      .filter(({ player }) => !usedPlayers.has(player.id))
      .slice(0, 7);

    // Categorize players
    const aging = players.filter(p => p.age > avgAge + ageStdDev);
    const veterans = players.filter(p => p.age > 30 && p.overall > avgOverall);
    const youngStars = players.filter(p => p.age < avgAge - ageStdDev && p.overall > avgOverall);

    // Analyze position strengths
    const positionStrengths: TeamAnalysis['positionStrengths'] = {};
    
    // Only analyze positions that the user has set in edit tactics
    const configuredPositions = positionCounts
      .filter(pc => pc.count > 0)
      .map(pc => pc.position);
    
    configuredPositions.forEach(position => {
      const positionPlayers = players.filter(p => 
        p.mainPosition === position || p.alternatePositions.includes(position)
      );
      const count = positionPlayers.length;

      const hasProspect = positionPlayers.some(p => p.age < avgAge - ageStdDev);
      const hasVeteran = positionPlayers.some(p => p.age > 30);
      const hasNormal = positionPlayers.some(p => p.age >= avgAge - ageStdDev && p.age <= avgAge + ageStdDev);
      const hasAging = positionPlayers.some(p => p.age > avgAge + ageStdDev);

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
      const sectorPlayers = players.filter(p => 
        positions.includes(p.mainPosition) || 
        p.alternatePositions.some(pos => positions.includes(pos))
      );
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

    setAnalysis({
      bestXI,
      bench,
      aging,
      veterans,
      youngStars,
      positionStrengths,
      sectorStrengths
    });
  };

  // Helper function to render player card content based on toggle state
  const renderPlayerCardContent = (player: Player, position: string) => {
    if (bestXIToggle && player.mainPosition !== 'GK') {
      // Show stats when toggle is on (for non-GK players)
      const goals = player.stats?.goals || 0;
      const assists = player.stats?.assists || 0;
      const redCards = player.stats?.redCards || 0;
      const shots = player.stats?.shots || 0;
      const shotsOnTarget = player.stats?.shotsOnTarget || 0;
      
      // Calculate true shooting percentage
      const trueShootingPercentage = (() => {
        if (shots === 0 && shotsOnTarget === 0) return 0;
        const goalsPerShot = shots > 0 ? goals / shots : 0;
        const goalsPerShotOnTarget = shotsOnTarget > 0 ? goals / shotsOnTarget : 0;
        return Math.round(((goalsPerShot + goalsPerShotOnTarget) / 2) * 100);
      })();
      
      return (
        <div className="text-center">
          <div className="grid grid-cols-2 gap-1">
            <div>
              <p className="text-xs text-[#a78968] font-mono">Goals</p>
              <p className="text-sm font-bold text-[#dde1e0] font-mono">{goals}</p>
            </div>
            <div>
              <p className="text-xs text-[#a78968] font-mono">Assists</p>
              <p className="text-sm font-bold text-[#dde1e0] font-mono">{assists}</p>
            </div>
            <div>
              <p className="text-xs text-[#a78968] font-mono">Red</p>
              <p className="text-sm font-bold text-[#dde1e0] font-mono">{redCards}</p>
            </div>
            <div>
              <p className="text-xs text-[#a78968] font-mono">TS%</p>
              <p className="text-sm font-bold text-[#dde1e0] font-mono">{trueShootingPercentage}%</p>
            </div>
          </div>
        </div>
      );
    } else {
      // Show overall rating when toggle is off or for GK players
      return (
        <div className="text-center">
          <h3 className="font-bold text-[#dde1e0] font-mono text-xs truncate">{player.shortName}</h3>
          <p className="text-xs text-[#dde1e0] font-mono">{position}</p>
          <p className="text-sm font-bold text-[#dde1e0] font-mono">{player.overall}</p>
        </div>
      );
    }
  };

  return (
    <main className="min-h-screen bg-[#3c5c34]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigateTo('/manager')}
            className="relative group p-2 rounded-full bg-[#dde1e0]/10 hover:bg-[#dde1e0]/20 transition-all duration-300 hover:scale-110 active:scale-95 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/50 mr-4"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6 text-[#dde1e0]/80 group-hover:text-[#a78968] transition-all duration-300 group-hover:rotate-12 group-active:-rotate-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {/* Hover glow effect */}
            <div className="absolute inset-0 rounded-full bg-[#a78968]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
          </button>
          <h1 className="text-3xl font-bold text-[#dde1e0] font-mono tracking-wider">Best XI Analysis</h1>
        </div>

        {analysis && (
          <div className="space-y-8">
            {/* Best XI */}
            <div className="bg-[#dde1e0]/10 backdrop-blur-sm rounded-lg shadow p-6 border border-[#a78968]/30">
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-[#dde1e0] font-mono tracking-wider">Best XI</h2>
                <button
                  onClick={() => setBestXIToggle(!bestXIToggle)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#a78968] focus:ring-offset-2 focus:ring-offset-[#2a2a2a] ${
                    bestXIToggle ? 'bg-[#a78968]' : 'bg-[#644d36]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      bestXIToggle ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {/* Best XI Row Layout */}
              <div className="space-y-6">
                {/* Row 6: RW, ST, CF, LW */}
                <div className="flex justify-between items-center w-full min-h-[70px]">
                  {/* Left wing positions */}
                  <div className="flex space-x-2">
                    {analysis.bestXI
                      .filter(({ position }) => position === 'LW')
                      .map(({ player, position }) => (
                        <div
                          key={player.id}
                          className="bg-[#644d36]/20 p-2 rounded-lg border border-[#d4af37] hover:border-[#d4af37]/60 transition-colors flex flex-col justify-center w-[200px] h-[70px] cursor-pointer hover:scale-105 active:scale-95"
                          onClick={() => handlePlayerClick(player.id)}
                          title={`Click to view ${player.shortName}'s stats`}
                        >
                          {renderPlayerCardContent(player, position)}
                        </div>
                      ))}
                  </div>

                  {/* Center positions */}
                  <div className="flex justify-center space-x-2">
                    {analysis.bestXI
                      .filter(({ position }) => ['ST', 'CF'].includes(position))
                      .sort((a, b) => {
                        const order = { 'ST': 0, 'CF': 1 };
                        return order[a.position as keyof typeof order] - order[b.position as keyof typeof order];
                      })
                      .map(({ player, position }) => (
                        <div
                          key={player.id}
                          className="bg-[#644d36]/20 p-2 rounded-lg border border-[#d4af37] hover:border-[#d4af37]/60 transition-colors flex flex-col justify-center w-[200px] h-[70px] cursor-pointer hover:scale-105 active:scale-95"
                          onClick={() => navigateTo(`/player-stats?playerId=${player.id}`)}
                        >
                          {renderPlayerCardContent(player, position)}
                        </div>
                      ))}
                  </div>

                  {/* Right wing positions */}
                  <div className="flex space-x-2">
                    {analysis.bestXI
                      .filter(({ position }) => position === 'RW')
                      .map(({ player, position }) => (
                        <div
                          key={player.id}
                          className="bg-[#644d36]/20 p-2 rounded-lg border border-[#d4af37] hover:border-[#d4af37]/60 transition-colors flex flex-col justify-center w-[200px] h-[70px] cursor-pointer hover:scale-105 active:scale-95"
                          onClick={() => navigateTo(`/player-stats?playerId=${player.id}`)}
                        >
                          {renderPlayerCardContent(player, position)}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Row 5: CAM */}
                <div className="flex justify-center w-full min-h-[70px]">
                  <div className="flex justify-center space-x-2">
                    {analysis.bestXI
                      .filter(({ position }) => position === 'CAM')
                      .map(({ player, position }) => (
                        <div
                          key={player.id}
                          className="bg-[#644d36]/20 p-2 rounded-lg border border-[#d4af37] hover:border-[#d4af37]/60 transition-colors flex flex-col justify-center w-[200px] h-[70px] cursor-pointer hover:scale-105 active:scale-95"
                          onClick={() => navigateTo(`/player-stats?playerId=${player.id}`)}
                        >
                          {renderPlayerCardContent(player, position)}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Row 4: RM, CM, LM */}
                <div className="flex justify-between items-center w-full min-h-[70px]">
                  {/* Left midfield */}
                  <div className="flex space-x-2">
                    {analysis.bestXI
                      .filter(({ position }) => position === 'LM')
                      .map(({ player, position }) => (
                        <div
                          key={player.id}
                          className="bg-[#644d36]/20 p-2 rounded-lg border border-[#d4af37] hover:border-[#d4af37]/60 transition-colors flex flex-col justify-center w-[200px] h-[70px] cursor-pointer hover:scale-105 active:scale-95"
                          onClick={() => navigateTo(`/player-stats?playerId=${player.id}`)}
                        >
                          {renderPlayerCardContent(player, position)}
                        </div>
                      ))}
                  </div>

                  {/* Center midfield */}
                  <div className="flex justify-center space-x-2">
                    {analysis.bestXI
                      .filter(({ position }) => position === 'CM')
                      .map(({ player, position }) => (
                        <div
                          key={player.id}
                          className="bg-[#644d36]/20 p-2 rounded-lg border border-[#d4af37] hover:border-[#d4af37]/60 transition-colors flex flex-col justify-center w-[200px] h-[70px] cursor-pointer hover:scale-105 active:scale-95"
                          onClick={() => navigateTo(`/player-stats?playerId=${player.id}`)}
                        >
                          {renderPlayerCardContent(player, position)}
                        </div>
                      ))}
                  </div>

                  {/* Right midfield */}
                  <div className="flex space-x-2">
                    {analysis.bestXI
                      .filter(({ position }) => position === 'RM')
                      .map(({ player, position }) => (
                        <div
                          key={player.id}
                          className="bg-[#644d36]/20 p-2 rounded-lg border border-[#d4af37] hover:border-[#d4af37]/60 transition-colors flex flex-col justify-center w-[200px] h-[70px] cursor-pointer hover:scale-105 active:scale-95"
                          onClick={() => navigateTo(`/player-stats?playerId=${player.id}`)}
                        >
                          {renderPlayerCardContent(player, position)}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Row 3: CDM */}
                <div className="flex justify-center w-full min-h-[70px]">
                  <div className="flex justify-center space-x-2">
                    {analysis.bestXI
                      .filter(({ position }) => position === 'CDM')
                      .map(({ player, position }) => (
                        <div
                          key={player.id}
                          className="bg-[#644d36]/20 p-2 rounded-lg border border-[#d4af37] hover:border-[#d4af37]/60 transition-colors flex flex-col justify-center w-[200px] h-[70px] cursor-pointer hover:scale-105 active:scale-95"
                          onClick={() => navigateTo(`/player-stats?playerId=${player.id}`)}
                        >
                          {renderPlayerCardContent(player, position)}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Row 2: RWB, RB, CB, LB, LWB */}
                <div className="flex justify-between items-center w-full min-h-[70px]">
                  {/* Left back positions */}
                  <div className="flex space-x-2">
                    {analysis.bestXI
                      .filter(({ position }) => ['LB', 'LWB'].includes(position))
                      .sort((a, b) => {
                        const order = { 'LB': 0, 'LWB': 1 };
                        return order[a.position as keyof typeof order] - order[b.position as keyof typeof order];
                      })
                      .map(({ player, position }) => (
                        <div
                          key={player.id}
                          className="bg-[#644d36]/20 p-2 rounded-lg border border-[#d4af37] hover:border-[#d4af37]/60 transition-colors flex flex-col justify-center w-[200px] h-[70px] cursor-pointer hover:scale-105 active:scale-95"
                          onClick={() => navigateTo(`/player-stats?playerId=${player.id}`)}
                        >
                          {renderPlayerCardContent(player, position)}
                        </div>
                      ))}
                  </div>

                  {/* Center back positions */}
                  <div className="flex justify-center space-x-2">
                    {analysis.bestXI
                      .filter(({ position }) => position === 'CB')
                      .map(({ player, position }) => (
                        <div
                          key={player.id}
                          className="bg-[#644d36]/20 p-2 rounded-lg border border-[#d4af37] hover:border-[#d4af37]/60 transition-colors flex flex-col justify-center w-[200px] h-[70px] cursor-pointer hover:scale-105 active:scale-95"
                          onClick={() => navigateTo(`/player-stats?playerId=${player.id}`)}
                        >
                          {renderPlayerCardContent(player, position)}
                        </div>
                      ))}
                  </div>

                  {/* Right back positions */}
                  <div className="flex space-x-2">
                    {analysis.bestXI
                      .filter(({ position }) => ['RB', 'RWB'].includes(position))
                      .sort((a, b) => {
                        const order = { 'RB': 0, 'RWB': 1 };
                        return order[a.position as keyof typeof order] - order[b.position as keyof typeof order];
                      })
                      .map(({ player, position }) => (
                        <div
                          key={player.id}
                          className="bg-[#644d36]/20 p-2 rounded-lg border border-[#d4af37] hover:border-[#d4af37]/60 transition-colors flex flex-col justify-center w-[200px] h-[70px] cursor-pointer hover:scale-105 active:scale-95"
                          onClick={() => navigateTo(`/player-stats?playerId=${player.id}`)}
                        >
                          {renderPlayerCardContent(player, position)}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Row 1: GK */}
                <div className="flex justify-center w-full min-h-[70px]">
                  <div className="flex justify-center space-x-2">
                    {analysis.bestXI
                      .filter(({ position }) => position === 'GK')
                      .map(({ player, position }) => (
                        <div
                          key={player.id}
                          className="bg-[#644d36]/20 p-2 rounded-lg border border-[#d4af37] hover:border-[#d4af37]/60 transition-colors flex flex-col justify-center w-[200px] h-[70px] cursor-pointer hover:scale-105 active:scale-95"
                          onClick={() => navigateTo(`/player-stats?playerId=${player.id}`)}
                        >
                          {renderPlayerCardContent(player, position)}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bench */}
            <div className="bg-[#dde1e0]/10 backdrop-blur-sm rounded-lg shadow p-6 border border-[#a78968]/30">
              <h2 className="text-2xl font-bold text-[#dde1e0] font-mono tracking-wider mb-6">Bench</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysis.bench.map(({ player, position }) => (
                  <div key={player.id} className="bg-[#644d36]/10 p-4 rounded-lg border border-[#d4af37] hover:border-[#d4af37]/60 transition-colors cursor-pointer hover:scale-105 active:scale-95" onClick={() => navigateTo(`/player-stats?playerId=${player.id}`)}>
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-[#dde1e0] font-mono">{player.name}</h3>
                        <p className="text-sm text-[#a78968] font-mono">{position}</p>
                      </div>
                      <div className="text-right">
                        {bestXIToggle && player.mainPosition !== 'GK' ? (
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-center">
                              <p className="text-xs text-[#a78968] font-mono">Goals</p>
                              <p className="text-sm font-bold text-[#dde1e0] font-mono">{player.stats?.goals || 0}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-[#a78968] font-mono">Assists</p>
                              <p className="text-sm font-bold text-[#dde1e0] font-mono">{player.stats?.assists || 0}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-[#a78968] font-mono">Red</p>
                              <p className="text-sm font-bold text-[#dde1e0] font-mono">{player.stats?.redCards || 0}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-[#a78968] font-mono">TS%</p>
                              <p className="text-sm font-bold text-[#dde1e0] font-mono">
                                {(() => {
                                  const goals = player.stats?.goals || 0;
                                  const shots = player.stats?.shots || 0;
                                  const shotsOnTarget = player.stats?.shotsOnTarget || 0;
                                  if (shots === 0 && shotsOnTarget === 0) return 0;
                                  const goalsPerShot = shots > 0 ? goals / shots : 0;
                                  const goalsPerShotOnTarget = shotsOnTarget > 0 ? goals / shotsOnTarget : 0;
                                  return Math.round(((goalsPerShot + goalsPerShotOnTarget) / 2) * 100);
                                })()}%
                              </p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-lg font-bold text-[#a78968] font-mono">{player.overall}</p>
                            <p className="text-sm text-[#644d36] font-mono">{player.role}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Player Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Young Stars */}
              <div className="bg-[#dde1e0]/10 backdrop-blur-sm rounded-lg shadow p-6 border border-[#a78968]/30">
                <h2 className="text-xl font-bold text-[#dde1e0] font-mono tracking-wider mb-4">Young Stars</h2>
                <div className="space-y-2">
                  {analysis.youngStars.map(player => (
                    <div key={player.id} className="bg-[#644d36]/10 p-3 rounded-lg border border-[#d4af37] hover:border-[#d4af37]/60 transition-colors cursor-pointer hover:scale-105 active:scale-95" onClick={() => navigateTo(`/player-stats?playerId=${player.id}`)}>
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-[#dde1e0] font-mono">{player.name}</h3>
                          <p className="text-sm text-[#a78968] font-mono">{player.mainPosition}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#a78968] font-mono">{player.overall}</p>
                          <p className="text-sm text-[#644d36] font-mono">Age: {player.age}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Veterans */}
              <div className="bg-[#dde1e0]/10 backdrop-blur-sm rounded-lg shadow p-6 border border-[#a78968]/30">
                <h2 className="text-xl font-bold text-[#dde1e0] font-mono tracking-wider mb-4">Veterans</h2>
                <div className="space-y-2">
                  {analysis.veterans.map(player => (
                    <div key={player.id} className="bg-[#644d36]/10 p-3 rounded-lg border border-[#d4af37] hover:border-[#d4af37]/60 transition-colors cursor-pointer hover:scale-105 active:scale-95" onClick={() => navigateTo(`/player-stats?playerId=${player.id}`)}>
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-[#dde1e0] font-mono">{player.name}</h3>
                          <p className="text-sm text-[#a78968] font-mono">{player.mainPosition}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#a78968] font-mono">{player.overall}</p>
                          <p className="text-sm text-[#644d36] font-mono">Age: {player.age}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aging Players */}
              <div className="bg-[#dde1e0]/10 backdrop-blur-sm rounded-lg shadow p-6 border border-[#a78968]/30">
                <h2 className="text-xl font-bold text-[#dde1e0] font-mono tracking-wider mb-4">Aging Players</h2>
                <div className="space-y-2">
                  {analysis.aging.map(player => (
                    <div key={player.id} className="bg-[#644d36]/10 p-3 rounded-lg border border-[#d4af37] hover:border-[#d4af37]/60 transition-colors cursor-pointer hover:scale-105 active:scale-95" onClick={() => navigateTo(`/player-stats?playerId=${player.id}`)}>
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-[#dde1e0] font-mono">{player.name}</h3>
                          <p className="text-sm text-[#a78968] font-mono">{player.mainPosition}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#a78968] font-mono">{player.overall}</p>
                          <p className="text-sm text-[#644d36] font-mono">Age: {player.age}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Team Strengths */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Sector Strengths */}
              <div className="bg-[#dde1e0]/10 backdrop-blur-sm rounded-lg shadow p-6 border border-[#a78968]/30">
                <h2 className="text-xl font-bold text-[#dde1e0] font-mono tracking-wider mb-4">Sector Strengths</h2>
                <div className="space-y-4">
                  {Object.entries(analysis.sectorStrengths).map(([sector, data]) => (
                    <div key={sector} className="bg-[#644d36]/10 p-4 rounded-lg border border-[#d4af37] hover:border-[#d4af37]/60 transition-colors">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-[#dde1e0] font-mono">{sector}</h3>
                        <p className="text-sm text-[#a78968] font-mono">Players: {data.count}</p>
                      </div>
                      {data.message && (
                        <p className="mt-2 text-sm text-[#a78968] font-mono">{data.message}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Position Strengths */}
              <div className="bg-[#dde1e0]/10 backdrop-blur-sm rounded-lg shadow p-6 border border-[#a78968]/30">
                <h2 className="text-xl font-bold text-[#dde1e0] font-mono tracking-wider mb-4">Position Strengths</h2>
                <div className="space-y-4">
                  {Object.entries(analysis.positionStrengths).map(([position, data]) => (
                    <div key={position} className="bg-[#644d36]/10 p-4 rounded-lg border border-[#d4af37] hover:border-[#d4af37]/60 transition-colors">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-[#dde1e0] font-mono">{position}</h3>
                        <p className="text-sm text-[#a78968] font-mono">Players: {data.count}</p>
                      </div>
                      {data.message && (
                        <p className="mt-2 text-sm text-[#a78968] font-mono">{data.message}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 