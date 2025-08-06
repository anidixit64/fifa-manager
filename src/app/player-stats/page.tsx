'use client';

import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useOptimizedNavigation } from '@/hooks/useOptimizedNavigation';
import { Player, POSITION_CATEGORIES } from '@/types/player';

interface Team {
  id: string;
  name: string;
  country: string;
  logo?: string;
}

const POSITION_WEIGHTS = {
  // Forwards
  'RW': { goals: 0.7, assists: 0.3 },
  'LW': { goals: 0.7, assists: 0.3 },
  'CF': { goals: 0.7, assists: 0.3 },
  'ST': { goals: 0.7, assists: 0.3 },
  // Midfielders
  'LM': { goals: 0.3, assists: 0.7 },
  'RM': { goals: 0.3, assists: 0.7 },
  'CDM': { goals: 0.2, assists: 0.8 },
  'CAM': { goals: 0.3, assists: 0.7 },
  'CM': { goals: 0.3, assists: 0.7 },
  // Defenders
  'RB': { goals: 0.1, assists: 0.9 },
  'RWB': { goals: 0.1, assists: 0.9 },
  'LB': { goals: 0.1, assists: 0.9 },
  'LWB': { goals: 0.1, assists: 0.9 },
  'CB': { goals: 0.1, assists: 0.9 },
};

export default function PlayerStatsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { navigateTo } = useOptimizedNavigation({ transitionDuration: 50 });
  const [selectedTeam] = useLocalStorage<Team | null>('selectedTeam', null);
  const [players, setPlayers] = useLocalStorage<Player[]>('fifaPlayers', []);
  const [isClient, setIsClient] = useState(false);
  const [expandedPlayers, setExpandedPlayers] = useState<Set<string>>(new Set());
  const [focusedInputs, setFocusedInputs] = useState<Set<string>>(new Set());
  const [expandedAdvancedStats, setExpandedAdvancedStats] = useState<Set<string>>(new Set());
  const playerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Memoize filtered players for better performance
  const nonGKPlayers = useMemo(() => 
    players.filter(player => player.mainPosition !== 'GK'), 
    [players]
  );

  // Calculate true shooting percentage
  const calculateTrueShootingPercentage = (player: Player): number => {
    const goals = player.stats?.goals || 0;
    const shots = player.stats?.shots || 0;
    const shotsOnTarget = player.stats?.shotsOnTarget || 0;
    
    if (shots === 0 && shotsOnTarget === 0) return 0;
    
    const goalsPerShot = shots > 0 ? goals / shots : 0;
    const goalsPerShotOnTarget = shotsOnTarget > 0 ? goals / shotsOnTarget : 0;
    
    return Math.round(((goalsPerShot + goalsPerShotOnTarget) / 2) * 100);
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!selectedTeam) {
      router.push('/create-team');
    }
  }, [selectedTeam, router]);

  // Handle playerId parameter and scroll to specific player
  useEffect(() => {
    if (isClient && players.length > 0) {
      const playerId = searchParams.get('playerId');
      if (playerId) {
        // Find the player
        const player = players.find(p => p.id === playerId);
        if (player && player.mainPosition !== 'GK') {
          // Use requestAnimationFrame for smoother scrolling
          requestAnimationFrame(() => {
            const playerElement = playerRefs.current[playerId];
            if (playerElement) {
              playerElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
              });
              // Add a highlight effect
              playerElement.style.boxShadow = '0 0 20px rgba(167, 137, 104, 0.8)';
              setTimeout(() => {
                if (playerElement) {
                  playerElement.style.boxShadow = '';
                }
              }, 1500);
            }
          });
        }
      }
    }
  }, [isClient, players, searchParams]);

  const updatePlayerStats = (playerId: string, field: 'goals' | 'assists' | 'redCards' | 'shots' | 'shotsOnTarget', value: number) => {
    setPlayers(players.map(player => {
      if (player.id === playerId) {
        return {
          ...player,
          stats: {
            ...player.stats,
            [field]: Math.max(0, value) // Ensure non-negative values
          }
        };
      }
      return player;
    }));
  };

  const handleInputFocus = (playerId: string, field: 'goals' | 'assists' | 'redCards' | 'shots' | 'shotsOnTarget') => {
    setFocusedInputs(prev => new Set(prev).add(`${playerId}-${field}`));
  };

  const handleInputBlur = (playerId: string, field: 'goals' | 'assists' | 'redCards' | 'shots' | 'shotsOnTarget', value: string) => {
    setFocusedInputs(prev => {
      const newSet = new Set(prev);
      newSet.delete(`${playerId}-${field}`);
      return newSet;
    });
    
    const numValue = value === '' ? 0 : parseInt(value);
    updatePlayerStats(playerId, field, numValue);
  };

  const calculateStatsScore = (player: Player): { positionScore: number; sectorScore: number; combinedScore: number } => {
    // Get all non-GK players
    const allPlayers = players.filter(p => p.mainPosition !== 'GK');
    
    // Get players in the same position
    const samePositionPlayers = allPlayers.filter(p => p.mainPosition === player.mainPosition);
    
    // Get players in the same sector
    const playerSector = POSITION_CATEGORIES[player.mainPosition];
    const sameSectorPlayers = allPlayers.filter(p => POSITION_CATEGORIES[p.mainPosition] === playerSector);
    
    // Calculate raw scores for all players
    const calculateRawScore = (p: Player) => {
      const pWeights = POSITION_WEIGHTS[p.mainPosition as keyof typeof POSITION_WEIGHTS] || { goals: 0.5, assists: 0.5 };
      const pGoals = p.stats?.goals || 0;
      const pAssists = p.stats?.assists || 0;
      const pRedCards = p.stats?.redCards || 0;
      const pShots = p.stats?.shots || 0;
      const pShotsOnTarget = p.stats?.shotsOnTarget || 0;
      
      // Base score from goals and assists
      let score = (pGoals * pWeights.goals + pAssists * pWeights.assists);
      
      // Bonus for shooting efficiency (only for forwards and attacking midfielders)
      const isAttackingPlayer = ['ST', 'CF', 'LW', 'RW', 'CAM'].includes(p.mainPosition);
      if (isAttackingPlayer && pShots > 0) {
        const shootingAccuracy = pShotsOnTarget / pShots;
        const conversionRate = pGoals / Math.max(pShotsOnTarget, 1);
        const shootingBonus = (shootingAccuracy * 0.5 + conversionRate * 0.5) * 2; // Max 2 point bonus
        score += shootingBonus;
      }
      
      // Penalty for red cards (each red card reduces score by 2 points)
      score -= pRedCards * 2;
      
      return Math.max(0, score); // Ensure score doesn't go below 0
    };
    
    // Calculate player's raw score
    const playerRawScore = calculateRawScore(player);
    
    // Calculate position relative score (0-10)
    const positionScores = samePositionPlayers.map(calculateRawScore);
    const maxPositionScore = Math.max(...positionScores, 1); // Avoid division by zero
    const positionScore = (playerRawScore / maxPositionScore) * 10;
    
    // Calculate sector relative score (0-10)
    const sectorScores = sameSectorPlayers.map(calculateRawScore);
    const maxSectorScore = Math.max(...sectorScores, 1); // Avoid division by zero
    const sectorScore = (playerRawScore / maxSectorScore) * 10;
    
    // Calculate combined score (average of position and sector scores)
    const combinedScore = (positionScore + sectorScore) / 2;
    
    return {
      positionScore: Number(positionScore.toFixed(1)),
      sectorScore: Number(sectorScore.toFixed(1)),
      combinedScore: Number(combinedScore.toFixed(1))
    };
  };

  const togglePlayerExpansion = (playerId: string) => {
    setExpandedPlayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      return newSet;
    });
  };

  const toggleAdvancedStats = (playerId: string) => {
    setExpandedAdvancedStats(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      return newSet;
    });
  };

  if (!selectedTeam || !isClient) {
    return (
      <main className="min-h-screen bg-[#3c5c34] flex items-center justify-center">
        <div className="text-[#dde1e0] font-mono">Loading...</div>
      </main>
    );
  }

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
          <h1 className="text-3xl font-bold text-[#dde1e0] font-mono tracking-wider">Player Stats</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nonGKPlayers.map(player => (
            <div 
              key={player.id} 
              ref={el => { playerRefs.current[player.id] = el; }}
              className="bg-[#dde1e0]/10 backdrop-blur-sm rounded-lg shadow p-6 border border-[#a78968]/30 hover:border-[#644d36]/50 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#dde1e0] font-mono">{player.shortName}</h3>
                  <p className="text-sm text-[#a78968] font-mono">{player.mainPosition}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[#a78968] font-mono">{player.overall}</p>
                  <p className="text-sm text-[#644d36] font-mono">{player.role}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#dde1e0] mb-1 font-mono">
                    Goals
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updatePlayerStats(player.id, 'goals', (player.stats?.goals || 0) - 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#a78968]/40 text-[#dde1e0] hover:bg-[#a78968]/60 active:scale-95 transition-all"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={focusedInputs.has(`${player.id}-goals`) ? (player.stats?.goals || '') : (player.stats?.goals || 0)}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                        updatePlayerStats(player.id, 'goals', value);
                      }}
                      onFocus={() => handleInputFocus(player.id, 'goals')}
                      onBlur={(e) => handleInputBlur(player.id, 'goals', e.target.value)}
                      className="w-16 px-2 py-1 text-center border border-[#644d36]/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/50 text-[#dde1e0] bg-[#dde1e0]/5 font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      onClick={() => updatePlayerStats(player.id, 'goals', (player.stats?.goals || 0) + 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#a78968]/40 text-[#dde1e0] hover:bg-[#a78968]/60 active:scale-95 transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#dde1e0] mb-1 font-mono">
                    Assists
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updatePlayerStats(player.id, 'assists', (player.stats?.assists || 0) - 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#a78968]/40 text-[#dde1e0] hover:bg-[#a78968]/60 active:scale-95 transition-all"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={focusedInputs.has(`${player.id}-assists`) ? (player.stats?.assists || '') : (player.stats?.assists || 0)}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                        updatePlayerStats(player.id, 'assists', value);
                      }}
                      onFocus={() => handleInputFocus(player.id, 'assists')}
                      onBlur={(e) => handleInputBlur(player.id, 'assists', e.target.value)}
                      className="w-16 px-2 py-1 text-center border border-[#644d36]/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/50 text-[#dde1e0] bg-[#dde1e0]/5 font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      onClick={() => updatePlayerStats(player.id, 'assists', (player.stats?.assists || 0) + 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#a78968]/40 text-[#dde1e0] hover:bg-[#a78968]/60 active:scale-95 transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Advanced Stats Dropdown */}
              <button
                onClick={() => toggleAdvancedStats(player.id)}
                className="w-full mt-4 flex items-center justify-between px-4 py-2 text-sm font-medium text-[#dde1e0] bg-[#644d36]/20 rounded-lg hover:bg-[#644d36]/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#a78968]/50 font-mono transition-colors"
              >
                <span>Advanced Stats</span>
                <svg
                  className={`w-5 h-5 transform transition-transform ${expandedAdvancedStats.has(player.id) ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expandedAdvancedStats.has(player.id) && (
                <div className="mt-2 p-4 bg-[#644d36]/10 rounded-lg border border-[#a78968]/30">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Red Cards */}
                    <div>
                      <label className="block text-sm font-medium text-[#dde1e0] mb-1 font-mono">
                        Red Cards
                      </label>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updatePlayerStats(player.id, 'redCards', (player.stats?.redCards || 0) - 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#a78968]/40 text-[#dde1e0] hover:bg-[#a78968]/60 active:scale-95 transition-all"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={focusedInputs.has(`${player.id}-redCards`) ? (player.stats?.redCards || '') : (player.stats?.redCards || 0)}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                            updatePlayerStats(player.id, 'redCards', value);
                          }}
                          onFocus={() => handleInputFocus(player.id, 'redCards')}
                          onBlur={(e) => handleInputBlur(player.id, 'redCards', e.target.value)}
                          className="w-16 px-2 py-1 text-center border border-[#644d36]/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/50 text-[#dde1e0] bg-[#dde1e0]/5 font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          onClick={() => updatePlayerStats(player.id, 'redCards', (player.stats?.redCards || 0) + 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#a78968]/40 text-[#dde1e0] hover:bg-[#a78968]/60 active:scale-95 transition-all"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Shots */}
                    <div>
                      <label className="block text-sm font-medium text-[#dde1e0] mb-1 font-mono">
                        Shots
                      </label>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updatePlayerStats(player.id, 'shots', (player.stats?.shots || 0) - 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#a78968]/40 text-[#dde1e0] hover:bg-[#a78968]/60 active:scale-95 transition-all"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={focusedInputs.has(`${player.id}-shots`) ? (player.stats?.shots || '') : (player.stats?.shots || 0)}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                            updatePlayerStats(player.id, 'shots', value);
                          }}
                          onFocus={() => handleInputFocus(player.id, 'shots')}
                          onBlur={(e) => handleInputBlur(player.id, 'shots', e.target.value)}
                          className="w-16 px-2 py-1 text-center border border-[#644d36]/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/50 text-[#dde1e0] bg-[#dde1e0]/5 font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          onClick={() => updatePlayerStats(player.id, 'shots', (player.stats?.shots || 0) + 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#a78968]/40 text-[#dde1e0] hover:bg-[#a78968]/60 active:scale-95 transition-all"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Shots on Target */}
                    <div>
                      <label className="block text-sm font-medium text-[#dde1e0] mb-1 font-mono">
                        Shots on Target
                      </label>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updatePlayerStats(player.id, 'shotsOnTarget', (player.stats?.shotsOnTarget || 0) - 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#a78968]/40 text-[#dde1e0] hover:bg-[#a78968]/60 active:scale-95 transition-all"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={focusedInputs.has(`${player.id}-shotsOnTarget`) ? (player.stats?.shotsOnTarget || '') : (player.stats?.shotsOnTarget || 0)}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                            updatePlayerStats(player.id, 'shotsOnTarget', value);
                          }}
                          onFocus={() => handleInputFocus(player.id, 'shotsOnTarget')}
                          onBlur={(e) => handleInputBlur(player.id, 'shotsOnTarget', e.target.value)}
                          className="w-16 px-2 py-1 text-center border border-[#644d36]/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/50 text-[#dde1e0] bg-[#dde1e0]/5 font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          onClick={() => updatePlayerStats(player.id, 'shotsOnTarget', (player.stats?.shotsOnTarget || 0) + 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#a78968]/40 text-[#dde1e0] hover:bg-[#a78968]/60 active:scale-95 transition-all"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* True Shooting Percentage */}
                    <div>
                      <label className="block text-sm font-medium text-[#dde1e0] mb-1 font-mono">
                        True Shooting %
                      </label>
                      <div className="flex items-center justify-center">
                        <span className="text-lg font-bold text-[#a78968] font-mono">
                          {calculateTrueShootingPercentage(player)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => togglePlayerExpansion(player.id)}
                className="w-full mt-4 flex items-center justify-between px-4 py-2 text-sm font-medium text-[#dde1e0] bg-[#644d36]/20 rounded-lg hover:bg-[#644d36]/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#a78968]/50 font-mono transition-colors"
              >
                <span>View Stats Score</span>
                <svg
                  className={`w-5 h-5 transform transition-transform ${expandedPlayers.has(player.id) ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expandedPlayers.has(player.id) && (
                <div className="mt-4 p-4 bg-[#644d36]/10 rounded-lg border border-[#a78968]/30">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-[#dde1e0] font-mono">Stats Score</span>
                    <span className="text-lg font-bold text-[#a78968] font-mono">
                      {calculateStatsScore(player).combinedScore}
                    </span>
                  </div>
                  <div className="text-xs text-[#644d36] mt-1 font-mono">
                    Based on goals, assists, red cards, and shooting efficiency relative to position and sector
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
} 