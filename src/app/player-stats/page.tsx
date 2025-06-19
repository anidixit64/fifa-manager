'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useLocalStorage from '@/hooks/useLocalStorage';
import { Player, PositionCategory, POSITION_CATEGORIES } from '@/types/player';

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
  const [selectedTeam] = useLocalStorage<Team | null>('selectedTeam', null);
  const [players, setPlayers] = useLocalStorage<Player[]>('fifaPlayers', []);
  const [isClient, setIsClient] = useState(false);
  const [expandedPlayers, setExpandedPlayers] = useState<Set<string>>(new Set());
  const [focusedInputs, setFocusedInputs] = useState<Set<string>>(new Set());

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!selectedTeam) {
      router.push('/create-team');
    }
  }, [selectedTeam, router]);

  const updatePlayerStats = (playerId: string, field: 'goals' | 'assists', value: number) => {
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

  const handleInputFocus = (playerId: string, field: 'goals' | 'assists') => {
    setFocusedInputs(prev => new Set(prev).add(`${playerId}-${field}`));
  };

  const handleInputBlur = (playerId: string, field: 'goals' | 'assists', value: string) => {
    setFocusedInputs(prev => {
      const newSet = new Set(prev);
      newSet.delete(`${playerId}-${field}`);
      return newSet;
    });
    
    const numValue = value === '' ? 0 : parseInt(value);
    updatePlayerStats(playerId, field, numValue);
  };

  const calculateStatsScore = (player: Player): { positionScore: number; sectorScore: number; combinedScore: number } => {
    const weights = POSITION_WEIGHTS[player.mainPosition as keyof typeof POSITION_WEIGHTS] || { goals: 0.5, assists: 0.5 };
    const goals = player.stats?.goals || 0;
    const assists = player.stats?.assists || 0;
    
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
      return (pGoals * pWeights.goals + pAssists * pWeights.assists);
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

  if (!selectedTeam || !isClient) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#3c5c34]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.push('/manager')}
            className="mr-4 text-[#dde1e0]/80 hover:text-[#a78968] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-[#dde1e0] font-mono tracking-wider">Player Stats</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.filter(player => player.mainPosition !== 'GK').map(player => (
            <div key={player.id} className="bg-[#dde1e0]/10 backdrop-blur-sm rounded-lg shadow p-6 border border-[#a78968]/30 hover:border-[#644d36]/50 transition-colors">
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
                    Based on goals and assists relative to position and sector
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