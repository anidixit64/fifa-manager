'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useOptimizedNavigation } from '@/hooks/useOptimizedNavigation';
import { analyzeTeam } from '@/utils/teamAnalysis';
import { Player, Team } from '@/types/player';

type TogglePosition = 'RWB' | 'RB' | 'RW' | 'LWB' | 'LB' | 'LW';

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
  const [showTransferSuggestions, setShowTransferSuggestions] = useState(false);

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
      analyzeTeamData();
    }
  }, [selectedTeam, router, players, positionCounts, positionPriorities, toggledPositions]);

  const analyzeTeamData = () => {
    if (!players || players.length === 0) {
      setAnalysis(null);
      return;
    }

    // Convert Set to array for the analysis function
    const toggledPositionsArray = Array.from(toggledPositions);
    
    // Use the centralized team analysis utility
    const teamAnalysis = analyzeTeam(players, positionCounts, positionPriorities, toggledPositionsArray);
    setAnalysis(teamAnalysis);
  };

  // Helper function to determine strength level and border color
  const getStrengthLevel = (data: any, type: 'sector' | 'position') => {
    if (type === 'sector') {
      const count = data.count;
      if (count < 3) return 'weak';
      if (count > 8) return 'strong';
      return 'moderate';
    } else {
      // Position strength logic
      const count = data.count;
      const hasProspect = data.hasProspect;
      const hasVeteran = data.hasVeteran;
      const hasNormal = data.hasNormal;
      const hasAging = data.hasAging;
      
      // Very weak: no players or missing prospects
      if (count === 0 || (count < 2 && !hasProspect)) return 'weak';
      
      // Strong: good count and has prospects
      if (count >= 2 && hasProspect && (hasVeteran || hasNormal)) return 'strong';
      
      // Moderate: some players but could be better
      return 'moderate';
    }
  };

  const getBorderColor = (strengthLevel: string) => {
    switch (strengthLevel) {
      case 'weak':
        return 'border-red-500 hover:border-red-400';
      case 'strong':
        return 'border-green-500 hover:border-green-400';
      case 'moderate':
      default:
        return 'border-[#d4af37] hover:border-[#d4af37]/60';
    }
  };

  // Generate transfer suggestions based on team analysis
  const generateTransferSuggestions = () => {
    if (!analysis) return [];
    
    const suggestions: Array<{
      type: string;
      position: string;
      category: string;
      reason: string;
      priority: 'high' | 'medium' | 'low';
    }> = [];

    // Check for missing starters
    const requiredPositions = ['GK', 'CB', 'RB', 'LB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST', 'CF'];
    const bestXIPositions = analysis.bestXI.map(xi => xi.position);
    
    requiredPositions.forEach(position => {
      if (!bestXIPositions.includes(position)) {
        suggestions.push({
          type: 'Starting',
          position,
          category: 'Any',
          reason: `No starter at ${position} position`,
          priority: 'high'
        });
      }
    });

    // Check position strengths for depth and age balance
    Object.entries(analysis.positionStrengths).forEach(([position, data]) => {
      const positionPlayers = players.filter(p => p.mainPosition === position);
      
      // Check for depth issues
      if (data.count < 2) {
        suggestions.push({
          type: 'Bench',
          position,
          category: 'Any',
          reason: `Only ${data.count} player(s) at ${position} - needs depth`,
          priority: 'medium'
        });
      }
      
      // Check for age balance issues
      if (data.count > 0) {
        const avgAge = positionPlayers.reduce((sum, p) => sum + p.age, 0) / positionPlayers.length;
        
        if (!data.hasProspect && avgAge > 28) {
          suggestions.push({
            type: 'Young Prospect',
            position,
            category: 'Young Star',
            reason: `${position} has no young prospects (avg age: ${avgAge.toFixed(1)})`,
            priority: 'medium'
          });
        }
        
        if (!data.hasVeteran && avgAge < 24) {
          suggestions.push({
            type: 'Veteran',
            position,
            category: 'Veteran',
            reason: `${position} has no experienced players (avg age: ${avgAge.toFixed(1)})`,
            priority: 'low'
          });
        }
        
        if (data.hasAging && !data.hasProspect) {
          suggestions.push({
            type: 'Young Prospect',
            position,
            category: 'Young Star',
            reason: `${position} has aging players but no young prospects`,
            priority: 'high'
          });
        }
      }
    });

    // Check sector strengths
    Object.entries(analysis.sectorStrengths).forEach(([sector, data]) => {
      if (data.count < 3) {
        const sectorPositions = sector === 'Defense' ? ['LB', 'CB', 'RB'] :
                               sector === 'Midfield' ? ['CDM', 'CM', 'CAM', 'LM', 'RM'] :
                               sector === 'Forward' ? ['LW', 'RW', 'ST'] : ['GK'];
        
        sectorPositions.forEach(position => {
          if (!suggestions.some(s => s.position === position && s.type === 'Starting')) {
            suggestions.push({
              type: 'Sector',
              position,
              category: 'Any',
              reason: `Weak ${sector} depth (${data.count} players)`,
              priority: 'medium'
            });
          }
        });
      }
    });

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  // Helper function to render player card content based on toggle state
  const renderPlayerCardContent = (player: Player, position: string) => {
    if (bestXIToggle && player.mainPosition !== 'GK') {
      // Show compact stats when toggle is on (for non-GK players)
      const goals = player.stats?.goals || 0;
      const assists = player.stats?.assists || 0;
      
      return (
        <div className="text-center">
          <p className="text-xs font-bold text-[#dde1e0] font-mono truncate">{player.shortName}</p>
          <p className="text-xs text-[#a78968] font-mono">{position}</p>
          <div className="flex justify-center gap-1 mt-1">
            <span className="text-xs text-[#a78968] font-mono">G:{goals}</span>
            <span className="text-xs text-[#a78968] font-mono">A:{assists}</span>
          </div>
        </div>
      );
    } else {
      // Show compact overall rating when toggle is off or for GK players
      return (
        <div className="text-center">
          <p className="text-xs font-bold text-[#dde1e0] font-mono truncate">{player.shortName}</p>
          <p className="text-xs text-[#a78968] font-mono">{position}</p>
          <p className="text-xs font-bold text-[#dde1e0] font-mono">{player.overall}</p>
        </div>
      );
    }
  };

  return (
    <main className="min-h-screen bg-[#3c5c34]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
          <button
            onClick={() => navigateTo('/manager')}
            className="relative group p-2 rounded-full bg-[#dde1e0]/10 hover:bg-[#dde1e0]/20 transition-all duration-300 hover:scale-110 active:scale-95 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/50 mr-4"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6 text-[#dde1e0]/80 group-hover:text-[#8B6F47] transition-all duration-300 group-hover:rotate-12 group-active:-rotate-6" 
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
          
          {/* Suggest Transfers Button */}
          <button
            onClick={() => setShowTransferSuggestions(true)}
            className="relative group px-6 py-3 text-[#3c5c34] overflow-hidden font-mono shadow-md transition-transform duration-150 hover:scale-105 active:scale-95 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/60"
          >
            {/* Button background */}
            <div className="absolute inset-0 bg-[#dde1e0] group-hover:bg-[#c8d0cf] transition-colors"></div>
            {/* Button border */}
            <div className="absolute inset-0 border-2 border-[#3c5c34]"></div>
            {/* Button text */}
            <span className="relative z-10 tracking-wider font-semibold">
              Suggest Transfers
            </span>
            {/* Hover effect */}
            <div className="absolute inset-0 bg-[#3c5c34]/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
          </button>
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
              
              {/* Best XI Grid Layout */}
              <div className="grid grid-cols-7 grid-rows-7 gap-2 w-full h-[490px] bg-[#3c5c34]/20 rounded-lg p-4">
                {/* Generate all 49 grid cells with players positioned in their designated cells */}
                {Array.from({ length: 49 }, (_, index) => {
                  const col = index % 7;
                  const row = 6 - Math.floor(index / 7); // Reverse row order so 0 is at bottom
                  
                  // Find if there's a player for this coordinate
                  const playerAtPosition = analysis.bestXI.find(({ player, position }) => {
                    let coordinates: { col: number; row: number }[] = [];
                    
                    // Define coordinates for each position
                    switch (position) {
                      case 'GK':
                        coordinates = [{ col: 3, row: 0 }];
                        break;
                      case 'CB':
                        const cbCount = analysis.bestXI.filter(p => p.position === 'CB').length;
                        if (cbCount === 1) {
                          coordinates = [{ col: 3, row: 1 }];
                        } else if (cbCount === 2) {
                          coordinates = [{ col: 2, row: 1 }, { col: 4, row: 1 }];
                        } else if (cbCount === 3) {
                          coordinates = [{ col: 2, row: 1 }, { col: 3, row: 1 }, { col: 4, row: 1 }];
                        }
                        break;
                      case 'RB':
                        coordinates = [{ col: 6, row: 1 }];
                        break;
                      case 'LB':
                        coordinates = [{ col: 0, row: 1 }];
                        break;
                      case 'RWB':
                        coordinates = [{ col: 6, row: 2 }];
                        break;
                      case 'LWB':
                        coordinates = [{ col: 0, row: 2 }];
                        break;
                      case 'CDM':
                        const cmCount = analysis.bestXI.filter(p => p.position === 'CM').length;
                        const cdmCount = analysis.bestXI.filter(p => p.position === 'CDM').length;
                        if (cmCount === 1 && cdmCount === 1) {
                          coordinates = [{ col: 4, row: 3 }];
                        } else if (cdmCount === 2) {
                          coordinates = [{ col: 2, row: 2 }, { col: 4, row: 2 }];
                        } else {
                          coordinates = [{ col: 3, row: 2 }];
                        }
                        break;
                      case 'LM':
                        coordinates = [{ col: 0, row: 3 }];
                        break;
                      case 'CM':
                        const cmPlayers = analysis.bestXI.filter(p => p.position === 'CM');
                        const cmIndex = cmPlayers.findIndex(p => p.player.id === player.id);
                        if (cmPlayers.length === 1) {
                          coordinates = [{ col: 2, row: 3 }];
                        } else if (cmPlayers.length === 2) {
                          coordinates = cmIndex === 0 ? [{ col: 2, row: 3 }] : [{ col: 4, row: 3 }];
                        }
                        break;
                      case 'RM':
                        coordinates = [{ col: 6, row: 3 }];
                        break;
                      case 'CAM':
                        coordinates = [{ col: 3, row: 4 }];
                        break;
                      case 'LW':
                        coordinates = [{ col: 0, row: 5 }];
                        break;
                      case 'CF':
                        const cfCount = analysis.bestXI.filter(p => p.position === 'CF').length;
                        const cfIndex = analysis.bestXI.filter(p => p.position === 'CF').findIndex(p => p.player.id === player.id);
                        if (cfCount === 1) {
                          coordinates = [{ col: 3, row: 5 }];
                        } else if (cfCount === 2) {
                          coordinates = cfIndex === 0 ? [{ col: 2, row: 5 }] : [{ col: 4, row: 5 }];
                        }
                        break;
                      case 'RW':
                        coordinates = [{ col: 6, row: 5 }];
                        break;
                      case 'ST':
                        const stCount = analysis.bestXI.filter(p => p.position === 'ST').length;
                        const stIndex = analysis.bestXI.filter(p => p.position === 'ST').findIndex(p => p.player.id === player.id);
                        if (stCount === 1) {
                          coordinates = [{ col: 3, row: 6 }];
                        } else if (stCount === 2) {
                          coordinates = stIndex === 0 ? [{ col: 2, row: 6 }] : [{ col: 4, row: 6 }];
                        }
                        break;
                      default:
                        coordinates = [];
                    }

                    // Find the appropriate coordinate for this player
                    const playerIndex = analysis.bestXI.filter(p => p.position === position).findIndex(p => p.player.id === player.id);
                    const coordinate = coordinates[playerIndex] || coordinates[0];

                    return coordinate && coordinate.col === col && coordinate.row === row;
                  });

                  if (playerAtPosition) {
                    const { player, position } = playerAtPosition;
                    return (
                        <div
                        key={`player-${player.id}`}
                        className="bg-[#644d36]/20 p-2 rounded-lg border border-[#d4af37] hover:border-[#d4af37]/60 transition-colors flex flex-col justify-center cursor-pointer hover:scale-105 active:scale-95"
                          onClick={() => handlePlayerClick(player.id)}
                          title={`Click to view ${player.shortName}'s stats`}
                        >
                          {renderPlayerCardContent(player, position)}
                        </div>
                    );
                  } else {
                    return (
                        <div
                        key={`cell-${col}-${row}`}
                        className="border border-[#3c5c34]/30 rounded flex items-center justify-center min-h-[60px]"
                      >
                        {/* Empty cell */}
                        </div>
                    );
                  }
                })}
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
                                                        <p className="text-xs text-[#8B6F47] font-mono">Goals</p>
                              <p className="text-sm font-bold text-[#dde1e0] font-mono">{player.stats?.goals || 0}</p>
                            </div>
                            <div className="text-center">
                          <p className="text-xs text-[#8B6F47] font-mono">Assists</p>
                              <p className="text-sm font-bold text-[#dde1e0] font-mono">{player.stats?.assists || 0}</p>
                            </div>
                          </div>
                        ) : (
                          <>
                                                      <p className="text-lg font-bold text-[#8B6F47] font-mono">{player.overall}</p>
                          <p className="text-sm text-[#5A3D2A] font-mono">{player.role}</p>
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
                          <p className="text-sm text-[#8B6F47] font-mono">{player.mainPosition}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#8B6F47] font-mono">{player.overall}</p>
                          <p className="text-sm text-[#5A3D2A] font-mono">Age: {player.age}</p>
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
                          <p className="text-sm text-[#8B6F47] font-mono">{player.mainPosition}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#8B6F47] font-mono">{player.overall}</p>
                          <p className="text-sm text-[#5A3D2A] font-mono">Age: {player.age}</p>
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
                          <p className="text-sm text-[#8B6F47] font-mono">{player.mainPosition}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#8B6F47] font-mono">{player.overall}</p>
                          <p className="text-sm text-[#5A3D2A] font-mono">Age: {player.age}</p>
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
                  {Object.entries(analysis.sectorStrengths).map(([sector, data]) => {
                    const strengthLevel = getStrengthLevel(data, 'sector');
                    const borderColor = getBorderColor(strengthLevel);
                    
                    return (
                      <div key={sector} className={`bg-[#644d36]/10 p-4 rounded-lg border transition-colors ${borderColor}`}>
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-[#dde1e0] font-mono">{sector}</h3>
                          <p className="text-sm text-[#2D1B0E] font-mono">Players: {data.count}</p>
                      </div>
                      {data.message && (
                          <p className="mt-2 text-sm text-[#2D1B0E] font-mono">{data.message}</p>
                      )}
                    </div>
                    );
                  })}
                </div>
              </div>

              {/* Position Strengths */}
              <div className="bg-[#dde1e0]/10 backdrop-blur-sm rounded-lg shadow p-6 border border-[#a78968]/30">
                <h2 className="text-xl font-bold text-[#dde1e0] font-mono tracking-wider mb-4">Position Strengths</h2>
                <div className="space-y-4">
                  {Object.entries(analysis.positionStrengths).map(([position, data]) => {
                    const strengthLevel = getStrengthLevel(data, 'position');
                    const borderColor = getBorderColor(strengthLevel);
                    
                    return (
                      <div key={position} className={`bg-[#644d36]/10 p-4 rounded-lg border transition-colors ${borderColor}`}>
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-[#dde1e0] font-mono">{position}</h3>
                          <p className="text-sm text-[#2D1B0E] font-mono">Players: {data.count}</p>
                      </div>
                      {data.message && (
                          <p className="mt-2 text-sm text-[#2D1B0E] font-mono">{data.message}</p>
                      )}
                    </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transfer Suggestions Modal */}
        {showTransferSuggestions && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" style={{ alignItems: 'center', justifyContent: 'center' }}>
            <div className="bg-[#dde1e0] rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden transform -translate-y-72">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#3c5c34]/20">
                <h2 className="text-2xl font-bold text-[#3c5c34] font-mono tracking-wider">Transfer Suggestions</h2>
                <button
                  onClick={() => setShowTransferSuggestions(false)}
                  className="relative group p-2 rounded-full bg-[#3c5c34]/10 hover:bg-[#3c5c34]/20 transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#3c5c34]/50"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-6 w-6 text-[#3c5c34] group-hover:text-[#2a4a2a] transition-all duration-300" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                {generateTransferSuggestions().length > 0 ? (
                  <div className="space-y-4">
                    {generateTransferSuggestions().map((suggestion, index) => (
                      <div key={index} className="bg-[#3c5c34]/10 backdrop-blur-sm p-4 rounded-lg border border-[#3c5c34]/30">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-mono font-semibold ${
                              suggestion.priority === 'high' 
                                ? 'bg-red-500/20 text-red-700 border border-red-500/30' 
                                : suggestion.priority === 'medium'
                                ? 'bg-yellow-500/20 text-yellow-700 border border-yellow-500/30'
                                : 'bg-blue-500/20 text-blue-700 border border-blue-500/30'
                            }`}>
                              {suggestion.priority.toUpperCase()}
                            </span>
                            <span className="text-[#3c5c34] font-mono font-semibold text-lg">
                              {suggestion.type} {suggestion.position}
                            </span>
                          </div>
                          <span className="text-[#8B6F47] font-mono text-sm bg-[#dde1e0]/50 px-3 py-1 rounded-full">
                            {suggestion.category}
                          </span>
                        </div>
                        <p className="text-[#3c5c34] font-mono text-sm leading-relaxed">
                          {suggestion.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-[#8B6F47] text-6xl mb-4">🎉</div>
                    <h3 className="text-xl font-bold text-[#3c5c34] font-mono mb-2">Team is Well-Balanced!</h3>
                    <p className="text-[#8B6F47] font-mono">
                      Your team appears to have good depth and age balance across all positions.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 