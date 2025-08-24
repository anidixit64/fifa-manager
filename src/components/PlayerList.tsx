'use client';

import { useState } from 'react';
import { Player, PlayerAttributes, GoalkeeperAttributes } from '@/types/player';

interface PlayerListProps {
  players: Player[];
  onDeletePlayer: (playerId: string) => void;
  onUpdatePlayer: (player: Player) => void;
}

const POSITIONS = [
  'GK', 'RB', 'RWB', 'CB', 'LB', 'LWB', 'CM', 'RM', 'LM', 'CDM', 'CAM', 'RF', 'RW', 'LF', 'LW', 'ST', 'CF'
];

const ROLES = [
  { value: 'C', label: 'Crucial' },
  { value: 'I', label: 'Important' },
  { value: 'R', label: 'Rotation' },
  { value: 'S', label: 'Squad' },
  { value: 'P', label: 'Prospect' }
] as const;

type PlayerRole = typeof ROLES[number]['value'];

const PLAYER_ATTRIBUTES: (keyof PlayerAttributes)[] = [
  'pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'
];

const GK_ATTRIBUTES: (keyof GoalkeeperAttributes)[] = [
  'diving', 'handling', 'kicking', 'reflexes', 'speed', 'positioning'
];

export default function PlayerList({ players, onDeletePlayer, onUpdatePlayer }: PlayerListProps) {
  const [expandedPlayers, setExpandedPlayers] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc' | null;
  }>({ key: 'mainPosition', direction: 'asc' });

  // Helper function to safely get attribute value
  const getAttributeValue = (player: Player, attribute: string): number => {
    if (player.mainPosition === 'GK') {
      return (player.attributes as GoalkeeperAttributes)[attribute as keyof GoalkeeperAttributes] || 0;
    } else {
      return (player.attributes as PlayerAttributes)[attribute as keyof PlayerAttributes] || 0;
    }
  };

  // Helper function to get attribute label
  const getAttributeLabel = (attribute: string): string => {
    const labels: Record<string, string> = {
      'pace': 'PAC',
      'shooting': 'SHO',
      'passing': 'PAS',
      'dribbling': 'DRI',
      'defending': 'DEF',
      'physical': 'PHY',
      'diving': 'DIV',
      'handling': 'HAN',
      'kicking': 'KIC',
      'reflexes': 'REF',
      'speed': 'SPD',
      'positioning': 'POS'
    };
    return labels[attribute] || attribute.toUpperCase();
  };

  // Helper function to determine which attributes to show in headers
  const getHeaderAttributes = () => {
    const hasGoalkeepers = players.some(player => player.mainPosition === 'GK');
    const hasOutfieldPlayers = players.some(player => player.mainPosition !== 'GK');
    
    if (hasGoalkeepers && hasOutfieldPlayers) {
      // Mixed squad - show regular attributes for consistency
      return PLAYER_ATTRIBUTES;
    } else if (hasGoalkeepers) {
      // Only goalkeepers - show GK attributes
      return GK_ATTRIBUTES;
    } else {
      // Only outfield players - show regular attributes
      return PLAYER_ATTRIBUTES;
    }
  };

  // Helper function to get attributes for a specific player
  const getPlayerAttributes = (player: Player) => {
    if (player.mainPosition === 'GK') {
      return GK_ATTRIBUTES;
    } else {
      return PLAYER_ATTRIBUTES;
    }
  };

  const togglePlayer = (playerId: string) => {
    const newExpanded = new Set(expandedPlayers);
    if (newExpanded.has(playerId)) {
      newExpanded.delete(playerId);
    } else {
      newExpanded.add(playerId);
    }
    setExpandedPlayers(newExpanded);
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = null;
      }
    }
    setSortConfig({ key, direction });
  };

  const getSortedPlayers = () => {
    if (!sortConfig.direction) {
      return [...players].sort((a, b) => POSITIONS.indexOf(a.mainPosition) - POSITIONS.indexOf(b.mainPosition));
    }

    return [...players].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortConfig.key === 'mainPosition') {
        aValue = POSITIONS.indexOf(a.mainPosition);
        bValue = POSITIONS.indexOf(b.mainPosition);
      } else if (sortConfig.key === 'overall') {
        aValue = a.overall;
        bValue = b.overall;
      } else if (sortConfig.key === 'fifaCode') {
        aValue = a.fifaCode;
        bValue = b.fifaCode;
      } else if (sortConfig.key === 'role') {
        aValue = a.role;
        bValue = b.role;
      } else if (sortConfig.key in a.attributes) {
        aValue = a.attributes[sortConfig.key as keyof typeof a.attributes];
        bValue = b.attributes[sortConfig.key as keyof typeof b.attributes];
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    if (sortConfig.direction === 'asc') return '↑';
    if (sortConfig.direction === 'desc') return '↓';
    return null;
  };

  const updateAttribute = (player: Player, attr: string, delta: number) => {
    const currentValue = getAttributeValue(player, attr);
    const newValue = Math.max(0, Math.min(99, currentValue + delta));
    
    let updatedAttributes;
    if (player.mainPosition === 'GK') {
      updatedAttributes = {
        ...(player.attributes as GoalkeeperAttributes),
        [attr]: newValue
      } as GoalkeeperAttributes;
    } else {
      updatedAttributes = {
        ...(player.attributes as PlayerAttributes),
      [attr]: newValue
      } as PlayerAttributes;
    }
    
    // Recalculate overall rating based on average of all attributes
    const newOverall = Math.round(
      Object.values(updatedAttributes).reduce((sum, val) => sum + val, 0) / 
      Object.keys(updatedAttributes).length
    );
    
    const updatedPlayer = {
      ...player,
      attributes: updatedAttributes,
      overall: newOverall
    };
    onUpdatePlayer(updatedPlayer);
  };

  const updateAge = (player: Player, delta: number) => {
    const newAge = Math.max(18, Math.min(50, player.age + delta));
    const updatedPlayer = {
      ...player,
      age: newAge
    };
    onUpdatePlayer(updatedPlayer);
  };

  const updatePosition = (player: Player, direction: 'next' | 'prev') => {
    const currentIndex = POSITIONS.indexOf(player.mainPosition);
    const newIndex = direction === 'next' 
      ? (currentIndex + 1) % POSITIONS.length 
      : (currentIndex - 1 + POSITIONS.length) % POSITIONS.length;
    const newPosition = POSITIONS[newIndex];
    
    let updatedAttributes;
    if (newPosition === 'GK') {
      // Convert to goalkeeper attributes if switching to GK
      if ('pace' in player.attributes) {
        // Converting from regular attributes to GK attributes
        const avgValue = Object.values(player.attributes).reduce((sum, val) => sum + val, 0) / 6;
        updatedAttributes = {
          diving: Math.round(avgValue),
          handling: Math.round(avgValue),
          kicking: Math.round(avgValue),
          reflexes: Math.round(avgValue),
          speed: Math.round(avgValue),
          positioning: Math.round(avgValue),
        } as GoalkeeperAttributes;
      } else {
        // Already GK attributes, keep them
        updatedAttributes = player.attributes;
      }
    } else {
      // Convert to regular attributes if switching from GK
      if ('diving' in player.attributes) {
        // Converting from GK attributes to regular attributes
        const avgValue = Object.values(player.attributes).reduce((sum, val) => sum + val, 0) / 6;
        updatedAttributes = {
          pace: Math.round(avgValue),
          shooting: Math.round(avgValue),
          passing: Math.round(avgValue),
          dribbling: Math.round(avgValue),
          defending: Math.round(avgValue),
          physical: Math.round(avgValue),
        } as PlayerAttributes;
      } else {
        // Already regular attributes, keep them
        updatedAttributes = player.attributes;
      }
    }
    
    const updatedPlayer = {
      ...player,
      mainPosition: newPosition,
      attributes: updatedAttributes
    };
    onUpdatePlayer(updatedPlayer);
  };

  const updateRole = (player: Player, direction: 'next' | 'prev') => {
    const currentIndex = ROLES.findIndex(r => r.value === player.role);
    const newIndex = direction === 'next' 
      ? (currentIndex + 1) % ROLES.length 
      : (currentIndex - 1 + ROLES.length) % ROLES.length;
    const updatedPlayer = {
      ...player,
      role: ROLES[newIndex].value as PlayerRole
    };
    onUpdatePlayer(updatedPlayer);
  };

  const updatePotential = (player: Player, delta: number) => {
    const newPotential = Math.max(0, Math.min(99, player.potential + delta));
    const updatedPlayer = {
      ...player,
      potential: newPotential
    };
    onUpdatePlayer(updatedPlayer);
  };

  const updateOverall = (player: Player, delta: number) => {
    const newOverall = Math.max(0, Math.min(99, player.overall + delta));
    const updatedPlayer = {
      ...player,
      overall: newOverall
    };
    onUpdatePlayer(updatedPlayer);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[#dde1e0] font-mono">Squad</h2>
      {players.length === 0 ? (
        <div className="text-center py-4 text-[#dde1e0] font-mono">
          No players added yet. Add your first player using the form above.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Goalkeepers Section */}
          {players.some(player => player.mainPosition === 'GK') && (
        <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[#a8b8a7] font-mono">Goalkeepers</h3>
              {/* Goalkeeper Attribute Headers */}
          <div className="flex items-center px-4">
            <div className="w-65"></div> {/* Name spacer */}
            <div className="flex-1 flex justify-between items-center">
              <div 
                className="w-12 text-center text-xs text-[#a8b8a7] cursor-pointer hover:text-[#dde1e0] font-mono"
                onClick={() => handleSort('fifaCode')}
              >
                <div className="h-4">{getSortIcon('fifaCode')}</div>
                Country
              </div>
              <div 
                className="w-12 text-center text-xs text-[#a8b8a7] cursor-pointer hover:text-[#dde1e0] font-mono"
                onClick={() => handleSort('mainPosition')}
              >
                <div className="h-4">{getSortIcon('mainPosition')}</div>
                Position
              </div>
              <div 
                className="w-8 text-center text-xs text-[#a8b8a7] cursor-pointer hover:text-[#dde1e0] font-mono"
                onClick={() => handleSort('role')}
              >
                <div className="h-4">{getSortIcon('role')}</div>
                Role
              </div>
              <div 
                className="w-10 text-center text-xs text-[#a8b8a7] cursor-pointer hover:text-[#dde1e0] font-mono"
                onClick={() => handleSort('overall')}
              >
                <div className="h-4">{getSortIcon('overall')}</div>
                Overall
              </div>
                  {GK_ATTRIBUTES.map((attr) => (
              <div 
                      key={attr}
                className="w-6 text-center text-xs text-[#a8b8a7] cursor-pointer hover:text-[#dde1e0] font-mono"
                      onClick={() => handleSort(attr)}
              >
                      <div className="h-4">{getSortIcon(attr)}</div>
                      {getAttributeLabel(attr)}
              </div>
                  ))}
            </div>
          </div>

              {getSortedPlayers().filter(player => player.mainPosition === 'GK').map((player) => (
            <div key={player.id}>
              <div
                onClick={() => togglePlayer(player.id)}
                className="bg-[#dde1e0]/10 backdrop-blur-sm p-4 rounded-lg shadow cursor-pointer hover:bg-[#dde1e0]/20 transition-all border border-[#dde1e0]/20"
              >
                <div className="flex items-center">
                  <div className="w-65">
                    <span className="font-semibold text-[#dde1e0] font-mono">{player.shortName || player.name}</span>
                  </div>
                  <div className="flex-1 flex justify-between items-center">
                    <div className="w-12 text-center text-[#dde1e0] font-mono">{player.fifaCode}</div>
                    <div className="w-12 text-center text-[#dde1e0] font-mono">{player.mainPosition}</div>
                    <div className="w-8 text-center text-[#dde1e0] font-mono">{player.role}</div>
                    <div className="w-10 text-center font-medium text-[#a8b8a7] font-mono">{player.overall}</div>
                        {GK_ATTRIBUTES.map((attr) => (
                          <div key={attr} className="w-6 text-center text-[#dde1e0] font-mono">
                            {getAttributeValue(player, attr)}
                          </div>
                        ))}
                  </div>
                </div>
              </div>
              {expandedPlayers.has(player.id) && (
                <div className="mt-2 bg-[#dde1e0]/5 backdrop-blur-sm p-4 rounded-lg relative border border-[#dde1e0]/20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePlayer(player.id);
                    }}
                    className="absolute top-2 right-2 text-[#644d36] hover:text-[#8f7a5a] active:scale-90 transition-all hover:rotate-12 focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                      <div className="flex justify-center items-center min-h-[200px]">
                        <div className="grid grid-cols-5 gap-4 items-center">
                          {/* Row 1: Overall, Age, Position, Role, Attribute 1 */}
                        <div className="flex flex-col items-center space-y-2">
                            <span className="text-sm font-medium text-[#644d36] font-mono">Overall</span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateOverall(player, -1);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                            >
                              -
                            </button>
                            <span className="text-sm font-medium text-[#dde1e0] w-8 text-center font-mono">
                              {player.overall}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateOverall(player, 1);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col items-center space-y-2">
                            <span className="text-sm font-medium text-[#644d36] font-mono">Age</span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateAge(player, -1);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                            >
                              -
                            </button>
                            <span className="text-sm font-medium text-[#dde1e0] w-8 text-center font-mono">
                              {player.age}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateAge(player, 1);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                            >
                              +
                            </button>
                        </div>
                      </div>

                        <div className="flex flex-col items-center space-y-2">
                            <span className="text-sm font-medium text-[#644d36] font-mono">Position</span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updatePosition(player, 'prev');
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                            >
                              &lt;
                            </button>
                            <span className="text-sm font-medium text-[#dde1e0] w-8 text-center font-mono">
                              {player.mainPosition}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updatePosition(player, 'next');
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                            >
                              &gt;
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col items-center space-y-2">
                            <span className="text-sm font-medium text-[#644d36] font-mono">Role</span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateRole(player, 'prev');
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                            >
                              &lt;
                            </button>
                            <span className="text-sm font-medium text-[#dde1e0] w-8 text-center font-mono">
                              {player.role}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateRole(player, 'next');
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                            >
                              &gt;
                            </button>
                        </div>
                      </div>

                        <div className="flex flex-col items-center space-y-2">
                            <span className="text-sm font-medium text-[#644d36] font-mono">
                              {GK_ATTRIBUTES[0].charAt(0).toUpperCase() + GK_ATTRIBUTES[0].slice(1)}
                            </span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                  updateAttribute(player, GK_ATTRIBUTES[0], -1);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                            >
                              -
                            </button>
                            <span className="text-sm font-medium text-[#dde1e0] w-8 text-center font-mono">
                                {getAttributeValue(player, GK_ATTRIBUTES[0])}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                  updateAttribute(player, GK_ATTRIBUTES[0], 1);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                            >
                              +
                            </button>
                          </div>
                        </div>

                          {/* Row 2: Attributes 2-6 */}
                          {GK_ATTRIBUTES.slice(1).map((attr, index) => (
                            <div key={attr} className="flex flex-col items-center space-y-2">
                              <span className="text-sm font-medium text-[#644d36] font-mono">
                                {attr.charAt(0).toUpperCase() + attr.slice(1)}
                              </span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                    updateAttribute(player, attr, -1);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                            >
                              -
                            </button>
                            <span className="text-sm font-medium text-[#dde1e0] w-8 text-center font-mono">
                                  {getAttributeValue(player, attr)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                    updateAttribute(player, attr, 1);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                            >
                              +
                            </button>
                          </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Outfield Players Section */}
          {players.some(player => player.mainPosition !== 'GK') && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[#a8b8a7] font-mono">Outfield Players</h3>
              {/* Outfield Player Attribute Headers */}
              <div className="flex items-center px-4">
                <div className="w-65"></div> {/* Name spacer */}
                <div className="flex-1 flex justify-between items-center">
                  <div 
                    className="w-12 text-center text-xs text-[#a8b8a7] cursor-pointer hover:text-[#dde1e0] font-mono"
                    onClick={() => handleSort('fifaCode')}
                  >
                    <div className="h-4">{getSortIcon('fifaCode')}</div>
                    Country
                  </div>
                  <div 
                    className="w-12 text-center text-xs text-[#a8b8a7] cursor-pointer hover:text-[#dde1e0] font-mono"
                    onClick={() => handleSort('mainPosition')}
                  >
                    <div className="h-4">{getSortIcon('mainPosition')}</div>
                    Position
                  </div>
                  <div 
                    className="w-8 text-center text-xs text-[#a8b8a7] cursor-pointer hover:text-[#dde1e0] font-mono"
                    onClick={() => handleSort('role')}
                  >
                    <div className="h-4">{getSortIcon('role')}</div>
                    Role
                  </div>
                  <div 
                    className="w-10 text-center text-xs text-[#a8b8a7] cursor-pointer hover:text-[#dde1e0] font-mono"
                    onClick={() => handleSort('overall')}
                  >
                    <div className="h-4">{getSortIcon('overall')}</div>
                    Overall
                  </div>
                  {PLAYER_ATTRIBUTES.map((attr) => (
                    <div 
                      key={attr}
                      className="w-6 text-center text-xs text-[#a8b8a7] cursor-pointer hover:text-[#dde1e0] font-mono"
                      onClick={() => handleSort(attr)}
                    >
                      <div className="h-4">{getSortIcon(attr)}</div>
                      {getAttributeLabel(attr)}
                    </div>
                  ))}
                        </div>
                      </div>

              {getSortedPlayers().filter(player => player.mainPosition !== 'GK').map((player) => (
                <div key={player.id}>
                  <div
                    onClick={() => togglePlayer(player.id)}
                    className="bg-[#dde1e0]/10 backdrop-blur-sm p-4 rounded-lg shadow cursor-pointer hover:bg-[#dde1e0]/20 transition-all border border-[#dde1e0]/20"
                  >
                    <div className="flex items-center">
                      <div className="w-65">
                        <span className="font-semibold text-[#dde1e0] font-mono">{player.shortName || player.name}</span>
                      </div>
                      <div className="flex-1 flex justify-between items-center">
                        <div className="w-12 text-center text-[#dde1e0] font-mono">{player.fifaCode}</div>
                        <div className="w-12 text-center text-[#dde1e0] font-mono">{player.mainPosition}</div>
                        <div className="w-8 text-center text-[#dde1e0] font-mono">{player.role}</div>
                        <div className="w-10 text-center font-medium text-[#a8b8a7] font-mono">{player.overall}</div>
                        {PLAYER_ATTRIBUTES.map((attr) => (
                          <div key={attr} className="w-6 text-center text-[#dde1e0] font-mono">
                            {getAttributeValue(player, attr)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {expandedPlayers.has(player.id) && (
                    <div className="mt-2 bg-[#dde1e0]/5 backdrop-blur-sm p-4 rounded-lg relative border border-[#dde1e0]/20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePlayer(player.id);
                        }}
                        className="absolute top-2 right-2 text-[#644d36] hover:text-[#8f7a5a] active:scale-90 transition-all hover:rotate-12 focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <div className="flex justify-center items-center min-h-[200px]">
                        <div className="grid grid-cols-5 gap-4 items-center">
                          {/* Row 1: Overall, Age, Position, Role, Attribute 1 */}
                        <div className="flex flex-col items-center space-y-2">
                            <span className="text-sm font-medium text-[#644d36] font-mono">Overall</span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                  updateOverall(player, -1);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                            >
                              -
                            </button>
                            <span className="text-sm font-medium text-[#dde1e0] w-8 text-center font-mono">
                                {player.overall}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                  updateOverall(player, 1);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col items-center space-y-2">
                            <span className="text-sm font-medium text-[#644d36] font-mono">Age</span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                  updateAge(player, -1);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                            >
                              -
                            </button>
                            <span className="text-sm font-medium text-[#dde1e0] w-8 text-center font-mono">
                                {player.age}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                  updateAge(player, 1);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                            >
                              +
                            </button>
                          </div>
                          </div>

                          <div className="flex flex-col items-center space-y-2">
                            <span className="text-sm font-medium text-[#644d36] font-mono">Position</span>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updatePosition(player, 'prev');
                                }}
                                className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                              >
                                &lt;
                              </button>
                              <span className="text-sm font-medium text-[#dde1e0] w-8 text-center font-mono">
                                {player.mainPosition}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updatePosition(player, 'next');
                                }}
                                className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                              >
                                &gt;
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-col items-center space-y-2">
                            <span className="text-sm font-medium text-[#644d36] font-mono">Role</span>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateRole(player, 'prev');
                                }}
                                className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                              >
                                &lt;
                              </button>
                              <span className="text-sm font-medium text-[#dde1e0] w-8 text-center font-mono">
                                {player.role}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateRole(player, 'next');
                                }}
                                className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                              >
                                &gt;
                              </button>
                        </div>
                      </div>

                        <div className="flex flex-col items-center space-y-2">
                            <span className="text-sm font-medium text-[#644d36] font-mono">
                              {PLAYER_ATTRIBUTES[0].charAt(0).toUpperCase() + PLAYER_ATTRIBUTES[0].slice(1)}
                            </span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                  updateAttribute(player, PLAYER_ATTRIBUTES[0], -1);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                            >
                              -
                            </button>
                            <span className="text-sm font-medium text-[#dde1e0] w-8 text-center font-mono">
                                {getAttributeValue(player, PLAYER_ATTRIBUTES[0])}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                  updateAttribute(player, PLAYER_ATTRIBUTES[0], 1);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                            >
                              +
                            </button>
                          </div>
                        </div>

                          {/* Row 2: Attributes 2-6 */}
                          {PLAYER_ATTRIBUTES.slice(1).map((attr, index) => (
                            <div key={attr} className="flex flex-col items-center space-y-2">
                              <span className="text-sm font-medium text-[#644d36] font-mono">
                                {attr.charAt(0).toUpperCase() + attr.slice(1)}
                              </span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                    updateAttribute(player, attr, -1);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                            >
                              -
                            </button>
                            <span className="text-sm font-medium text-[#dde1e0] w-8 text-center font-mono">
                                  {getAttributeValue(player, attr)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                    updateAttribute(player, attr, 1);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                            >
                              +
                            </button>
                          </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 