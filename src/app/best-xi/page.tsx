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

  // Helper function to render player card content based on toggle state
  const renderPlayerCardContent = (player: Player, position: string) => {
    if (bestXIToggle && player.mainPosition !== 'GK') {
      // Show only goals and assists when toggle is on (for non-GK players)
      const goals = player.stats?.goals || 0;
      const assists = player.stats?.assists || 0;
      
      return (
        <div className="text-center">
          <div className="grid grid-cols-2 gap-1">
            <div>
                                        <p className="text-xs text-[#8B6F47] font-mono">Goals</p>
                          <p className="text-sm font-bold text-[#dde1e0] font-mono">{goals}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#8B6F47] font-mono">Assists</p>
              <p className="text-sm font-bold text-[#dde1e0] font-mono">{assists}</p>
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
              <div className="grid grid-cols-7 grid-rows-7 gap-2 w-full h-[490px]">
                {/* Generate 49 grid cells (7x7) */}
                {Array.from({ length: 49 }, (_, index) => {
                  const col = index % 7;
                  const row = 6 - Math.floor(index / 7); // Reverse row order so 0 is at bottom
                  
                  // Find players for this specific coordinate
                  const getPlayersForPosition = (position: string, count: number) => {
                    const players = analysis.bestXI.filter(({ position: pos }) => pos === position);
                    return players.slice(0, count);
                  };

                  // Determine which position should be at this coordinate
                  let positionPlayers: any[] = [];
                  
                  // GK: (3, 0)
                  if (col === 3 && row === 0) {
                    positionPlayers = getPlayersForPosition('GK', 1);
                  }
                  // CB: If 1, (3, 1). If 2, (2, 1) and (4, 1). If 3, (2, 1), (3, 1), and (4, 1)
                  else if (row === 1 && [2, 3, 4].includes(col)) {
                    const cbPlayers = getPlayersForPosition('CB', 3);
                    if (cbPlayers.length === 1 && col === 3) {
                      positionPlayers = cbPlayers;
                    } else if (cbPlayers.length === 2 && [2, 4].includes(col)) {
                      positionPlayers = cbPlayers.slice(col === 2 ? 0 : 1, col === 2 ? 1 : 2);
                    } else if (cbPlayers.length >= 3) {
                      positionPlayers = cbPlayers.slice(col - 2, col - 1);
                    }
                  }
                  // RB: (6, 1)
                  else if (col === 6 && row === 1) {
                    positionPlayers = getPlayersForPosition('RB', 1);
                  }
                  // LB: (0, 1)
                  else if (col === 0 && row === 1) {
                    positionPlayers = getPlayersForPosition('LB', 1);
                  }
                  // RWB: (6, 2)
                  else if (col === 6 && row === 2) {
                    positionPlayers = getPlayersForPosition('RWB', 1);
                  }
                  // LWB: (0, 2)
                  else if (col === 0 && row === 2) {
                    positionPlayers = getPlayersForPosition('LWB', 1);
                  }
                  // CDM: (3, 2), but if there is only 1 CM and 1 CDM, then CDM is at (4, 3)
                  else if ((col === 3 && row === 2) || (col === 4 && row === 3)) {
                    const cmPlayers = getPlayersForPosition('CM', 2);
                    const cdmPlayers = getPlayersForPosition('CDM', 1);
                    if (col === 3 && row === 2 && cmPlayers.length > 1) {
                      positionPlayers = cdmPlayers;
                    } else if (col === 4 && row === 3 && cmPlayers.length === 1) {
                      positionPlayers = cdmPlayers;
                    }
                  }
                  // LM: (0, 3)
                  else if (col === 0 && row === 3) {
                    positionPlayers = getPlayersForPosition('LM', 1);
                  }
                  // CM: If 1, (2, 3). If 2, (2, 3), (4, 3).
                  else if (row === 3 && [2, 4].includes(col)) {
                    const cmPlayers = getPlayersForPosition('CM', 2);
                    if (cmPlayers.length === 1 && col === 2) {
                      positionPlayers = cmPlayers;
                    } else if (cmPlayers.length >= 2) {
                      positionPlayers = cmPlayers.slice(col === 2 ? 0 : 1, col === 2 ? 1 : 2);
                    }
                  }
                  // RM: (6, 3)
                  else if (col === 6 && row === 3) {
                    positionPlayers = getPlayersForPosition('RM', 1);
                  }
                  // CAM: (3, 4)
                  else if (col === 3 && row === 4) {
                    positionPlayers = getPlayersForPosition('CAM', 1);
                  }
                  // LW: (0, 5)
                  else if (col === 0 && row === 5) {
                    positionPlayers = getPlayersForPosition('LW', 1);
                  }
                  // CF: If 1, (3, 5). If 2, (2, 5), (4, 5)
                  else if (row === 5 && [2, 3, 4].includes(col)) {
                    const cfPlayers = getPlayersForPosition('CF', 2);
                    if (cfPlayers.length === 1 && col === 3) {
                      positionPlayers = cfPlayers;
                    } else if (cfPlayers.length >= 2 && [2, 4].includes(col)) {
                      positionPlayers = cfPlayers.slice(col === 2 ? 0 : 1, col === 2 ? 1 : 2);
                    }
                  }
                  // RW: (6, 5)
                  else if (col === 6 && row === 5) {
                    positionPlayers = getPlayersForPosition('RW', 1);
                  }
                  // ST: If 1, (3, 6). If 2, (2, 6), (4, 6)
                  else if (row === 6 && [2, 3, 4].includes(col)) {
                    const stPlayers = getPlayersForPosition('ST', 2);
                    if (stPlayers.length === 1 && col === 3) {
                      positionPlayers = stPlayers;
                    } else if (stPlayers.length >= 2 && [2, 4].includes(col)) {
                      positionPlayers = stPlayers.slice(col === 2 ? 0 : 1, col === 2 ? 1 : 2);
                    }
                  }

                  return (
                    <div
                      key={index}
                      className="relative p-1"
                    >
                      {positionPlayers.length > 0 ? (
                        positionPlayers.map(({ player, position }) => (
                          <div
                            key={player.id}
                            className="bg-[#644d36]/20 p-2 rounded-lg border border-[#d4af37] hover:border-[#d4af37]/60 transition-colors flex flex-col justify-center w-full h-full cursor-pointer hover:scale-105 active:scale-95"
                            onClick={() => handlePlayerClick(player.id)}
                            title={`Click to view ${player.shortName}'s stats`}
                          >
                            {renderPlayerCardContent(player, position)}
                          </div>
                        ))
                      ) : (
                        <div className="w-full h-full" />
                      )}
                    </div>
                  );
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
      </div>
    </main>
  );
} 