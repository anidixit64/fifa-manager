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

const GOALKEEPER_ATTRIBUTES: (keyof GoalkeeperAttributes)[] = [
  'diving', 'handling', 'kicking', 'reflexes', 'speed', 'positioning'
];

export default function PlayerList({ players, onDeletePlayer, onUpdatePlayer }: PlayerListProps) {
  const [expandedPlayers, setExpandedPlayers] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc' | null;
  }>({ key: 'mainPosition', direction: 'asc' });

  const goalkeepers = players.filter(p => p.mainPosition === 'GK');
  const outfieldPlayers = players.filter(p => p.mainPosition !== 'GK');

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

  const getSortedGoalkeepers = () => {
    if (!sortConfig.direction) {
      return [...goalkeepers].sort((a, b) => a.name.localeCompare(b.name));
    }

    return [...goalkeepers].sort((a, b) => {
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

  const getSortedOutfieldPlayers = () => {
    if (!sortConfig.direction) {
      return [...outfieldPlayers].sort((a, b) => POSITIONS.indexOf(a.mainPosition) - POSITIONS.indexOf(b.mainPosition));
    }

    return [...outfieldPlayers].sort((a, b) => {
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

  const isGoalkeeper = (player: Player): player is Player & { attributes: GoalkeeperAttributes } => {
    return player.mainPosition === 'GK';
  };

  const isOutfieldPlayer = (player: Player): player is Player & { attributes: PlayerAttributes } => {
    return player.mainPosition !== 'GK';
  };

  const updateAttribute = (player: Player, attr: string, delta: number) => {
    const newValue = Math.max(0, Math.min(99, (player.attributes as any)[attr] + delta));
    const updatedAttributes = {
      ...player.attributes,
      [attr]: newValue
    };
    
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
    const updatedPlayer = {
      ...player,
      mainPosition: POSITIONS[newIndex]
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
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[#dde1e0] font-mono">Squad</h2>
      {players.length === 0 ? (
        <div className="text-center py-4 text-[#dde1e0] font-mono">
          No players added yet. Add your first player using the form above.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Goalkeepers Section */}
          {goalkeepers.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[#dde1e0] font-mono">Goalkeepers</h3>
              {/* Goalkeeper Attribute Headers */}
              <div className="flex items-center px-4">
                <div className="w-65"></div>
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
                  <div 
                    className="w-6 text-center text-xs text-[#a8b8a7] cursor-pointer hover:text-[#dde1e0] font-mono"
                    onClick={() => handleSort('diving')}
                  >
                    <div className="h-4">{getSortIcon('diving')}</div>
                    DIV
                  </div>
                  <div 
                    className="w-6 text-center text-xs text-[#a8b8a7] cursor-pointer hover:text-[#dde1e0] font-mono"
                    onClick={() => handleSort('handling')}
                  >
                    <div className="h-4">{getSortIcon('handling')}</div>
                    HAN
                  </div>
                  <div 
                    className="w-6 text-center text-xs text-[#a8b8a7] cursor-pointer hover:text-[#dde1e0] font-mono"
                    onClick={() => handleSort('kicking')}
                  >
                    <div className="h-4">{getSortIcon('kicking')}</div>
                    KIC
                  </div>
                  <div 
                    className="w-6 text-center text-xs text-[#a8b8a7] cursor-pointer hover:text-[#dde1e0] font-mono"
                    onClick={() => handleSort('reflexes')}
                  >
                    <div className="h-4">{getSortIcon('reflexes')}</div>
                    REF
                  </div>
                  <div 
                    className="w-6 text-center text-xs text-[#a8b8a7] cursor-pointer hover:text-[#dde1e0] font-mono"
                    onClick={() => handleSort('speed')}
                  >
                    <div className="h-4">{getSortIcon('speed')}</div>
                    SPE
                  </div>
                  <div 
                    className="w-6 text-center text-xs text-[#a8b8a7] cursor-pointer hover:text-[#dde1e0] font-mono"
                    onClick={() => handleSort('positioning')}
                  >
                    <div className="h-4">{getSortIcon('positioning')}</div>
                    POS
                  </div>
                </div>
              </div>

              {getSortedGoalkeepers().map((player) => (
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
                        <div className="w-6 text-center text-[#dde1e0] font-mono">{(player.attributes as GoalkeeperAttributes).diving}</div>
                        <div className="w-6 text-center text-[#dde1e0] font-mono">{(player.attributes as GoalkeeperAttributes).handling}</div>
                        <div className="w-6 text-center text-[#dde1e0] font-mono">{(player.attributes as GoalkeeperAttributes).kicking}</div>
                        <div className="w-6 text-center text-[#dde1e0] font-mono">{(player.attributes as GoalkeeperAttributes).reflexes}</div>
                        <div className="w-6 text-center text-[#dde1e0] font-mono">{(player.attributes as GoalkeeperAttributes).speed}</div>
                        <div className="w-6 text-center text-[#dde1e0] font-mono">{(player.attributes as GoalkeeperAttributes).positioning}</div>
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
                  <div className="flex justify-center items-center min-h-[160px]">
                    <div className="grid grid-cols-5 gap-6 items-center">
                      {/* Column 1: Overall (top) and Age (bottom) */}
                      <div className="flex flex-col space-y-6">
                        {/* Overall */}
                        <div className="flex flex-col items-center space-y-2">
                          <span className="text-base font-medium text-[#644d36] font-mono">Overall</span>
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

                        {/* Age */}
                        <div className="flex flex-col items-center space-y-2">
                          <span className="text-base font-medium text-[#644d36] font-mono">Age</span>
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
                      </div>

                      {/* Column 2: Position (top) and Role (bottom) */}
                      <div className="flex flex-col space-y-6">
                        {/* Position */}
                        <div className="flex flex-col items-center space-y-2">
                          <span className="text-base font-medium text-[#644d36] font-mono">Position</span>
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

                        {/* Role */}
                        <div className="flex flex-col items-center space-y-2">
                          <span className="text-base font-medium text-[#644d36] font-mono">Role</span>
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
                      </div>

                      {/* Column 3: First Attribute Pair */}
                      <div className="flex flex-col justify-center space-y-6">
                        {/* First Attribute */}
                        <div className="flex flex-col items-center space-y-2">
                          <span className="text-base font-medium text-[#644d36] font-mono">
                            {isGoalkeeper(player) ? 'Diving' : 'Pace'}
                          </span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateAttribute(player, isGoalkeeper(player) ? 'diving' : 'pace', -1);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                            >
                              -
                            </button>
                            <span className="text-sm font-medium text-[#dde1e0] w-8 text-center font-mono">
                              {isGoalkeeper(player) ? (player.attributes as GoalkeeperAttributes).diving : (player.attributes as PlayerAttributes).pace}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateAttribute(player, isGoalkeeper(player) ? 'diving' : 'pace', 1);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Second Attribute */}
                        <div className="flex flex-col items-center space-y-2">
                          <span className="text-base font-medium text-[#644d36] font-mono">
                            {isGoalkeeper(player) ? 'Handling' : 'Dribbling'}
                          </span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateAttribute(player, isGoalkeeper(player) ? 'handling' : 'dribbling', -1);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                            >
                              -
                            </button>
                            <span className="text-sm font-medium text-[#dde1e0] w-8 text-center font-mono">
                              {isGoalkeeper(player) ? (player.attributes as GoalkeeperAttributes).handling : (player.attributes as PlayerAttributes).dribbling}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateAttribute(player, isGoalkeeper(player) ? 'handling' : 'dribbling', 1);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Column 4: Second Attribute Pair */}
                      <div className="flex flex-col justify-center space-y-6">
                        {/* Third Attribute */}
                        <div className="flex flex-col items-center space-y-2">
                          <span className="text-base font-medium text-[#644d36] font-mono">
                            {isGoalkeeper(player) ? 'Kicking' : 'Shooting'}
                          </span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateAttribute(player, isGoalkeeper(player) ? 'kicking' : 'shooting', -1);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                            >
                              -
                            </button>
                            <span className="text-sm font-medium text-[#dde1e0] w-8 text-center font-mono">
                              {isGoalkeeper(player) ? (player.attributes as GoalkeeperAttributes).kicking : (player.attributes as PlayerAttributes).shooting}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateAttribute(player, isGoalkeeper(player) ? 'kicking' : 'shooting', 1);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Fourth Attribute */}
                        <div className="flex flex-col items-center space-y-2">
                          <span className="text-base font-medium text-[#644d36] font-mono">
                            {isGoalkeeper(player) ? 'Reflexes' : 'Passing'}
                          </span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateAttribute(player, isGoalkeeper(player) ? 'reflexes' : 'passing', -1);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                            >
                              -
                            </button>
                            <span className="text-sm font-medium text-[#dde1e0] w-8 text-center font-mono">
                              {isGoalkeeper(player) ? (player.attributes as GoalkeeperAttributes).reflexes : (player.attributes as PlayerAttributes).passing}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateAttribute(player, isGoalkeeper(player) ? 'reflexes' : 'passing', 1);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Column 5: Third Attribute Pair */}
                      <div className="flex flex-col justify-center space-y-6">
                        {/* Fifth Attribute */}
                        <div className="flex flex-col items-center space-y-2">
                          <span className="text-base font-medium text-[#644d36] font-mono">
                            {isGoalkeeper(player) ? 'Speed' : 'Defending'}
                          </span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateAttribute(player, isGoalkeeper(player) ? 'speed' : 'defending', -1);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                            >
                              -
                            </button>
                            <span className="text-sm font-medium text-[#dde1e0] w-8 text-center font-mono">
                              {isGoalkeeper(player) ? (player.attributes as GoalkeeperAttributes).speed : (player.attributes as PlayerAttributes).defending}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateAttribute(player, isGoalkeeper(player) ? 'speed' : 'defending', 1);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Sixth Attribute */}
                        <div className="flex flex-col items-center space-y-2">
                          <span className="text-base font-medium text-[#644d36] font-mono">
                            {isGoalkeeper(player) ? 'Positioning' : 'Physical'}
                          </span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateAttribute(player, isGoalkeeper(player) ? 'positioning' : 'physical', -1);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                            >
                              -
                            </button>
                            <span className="text-sm font-medium text-[#dde1e0] w-8 text-center font-mono">
                              {isGoalkeeper(player) ? (player.attributes as GoalkeeperAttributes).positioning : (player.attributes as PlayerAttributes).physical}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateAttribute(player, isGoalkeeper(player) ? 'positioning' : 'physical', 1);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Outfield Players Section */}
          {outfieldPlayers.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[#dde1e0] font-mono">Outfield Players</h3>
              {/* Outfield Player Attribute Headers */}
              <div className="flex items-center px-4">
                <div className="w-65"></div>
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
                  <div 
                    className="w-6 text-center text-xs text-[#a8b8a7] cursor-pointer hover:text-[#dde1e0] font-mono"
                    onClick={() => handleSort('pace')}
                  >
                    <div className="h-4">{getSortIcon('pace')}</div>
                    PAC
                  </div>
                  <div 
                    className="w-6 text-center text-xs text-[#a8b8a7] cursor-pointer hover:text-[#dde1e0] font-mono"
                    onClick={() => handleSort('shooting')}
                  >
                    <div className="h-4">{getSortIcon('shooting')}</div>
                    SHO
                  </div>
                  <div 
                    className="w-6 text-center text-xs text-[#a8b8a7] cursor-pointer hover:text-[#dde1e0] font-mono"
                    onClick={() => handleSort('passing')}
                  >
                    <div className="h-4">{getSortIcon('passing')}</div>
                    PAS
                  </div>
                  <div 
                    className="w-6 text-center text-xs text-[#a8b8a7] cursor-pointer hover:text-[#dde1e0] font-mono"
                    onClick={() => handleSort('dribbling')}
                  >
                    <div className="h-4">{getSortIcon('dribbling')}</div>
                    DRI
                  </div>
                  <div 
                    className="w-6 text-center text-xs text-[#a8b8a7] cursor-pointer hover:text-[#dde1e0] font-mono"
                    onClick={() => handleSort('defending')}
                  >
                    <div className="h-4">{getSortIcon('defending')}</div>
                    DEF
                  </div>
                  <div 
                    className="w-6 text-center text-xs text-[#a8b8a7] cursor-pointer hover:text-[#dde1e0] font-mono"
                    onClick={() => handleSort('physical')}
                  >
                    <div className="h-4">{getSortIcon('physical')}</div>
                    PHY
                  </div>
                </div>
              </div>

              {getSortedOutfieldPlayers().map((player) => (
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
                        <div className="w-6 text-center text-[#dde1e0] font-mono">{(player.attributes as PlayerAttributes).pace}</div>
                        <div className="w-6 text-center text-[#dde1e0] font-mono">{(player.attributes as PlayerAttributes).shooting}</div>
                        <div className="w-6 text-center text-[#dde1e0] font-mono">{(player.attributes as PlayerAttributes).passing}</div>
                        <div className="w-6 text-center text-[#dde1e0] font-mono">{(player.attributes as PlayerAttributes).dribbling}</div>
                        <div className="w-6 text-center text-[#dde1e0] font-mono">{(player.attributes as PlayerAttributes).defending}</div>
                        <div className="w-6 text-center text-[#dde1e0] font-mono">{(player.attributes as PlayerAttributes).physical}</div>
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
                      <div className="flex justify-center items-center min-h-[160px]">
                        <div className="grid grid-cols-5 gap-6 items-center">
                          {/* Column 1: Overall (top) and Age (bottom) */}
                          <div className="flex flex-col space-y-6">
                            {/* Overall */}
                            <div className="flex flex-col items-center space-y-2">
                              <span className="text-base font-medium text-[#644d36] font-mono">Overall</span>
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

                            {/* Age */}
                            <div className="flex flex-col items-center space-y-2">
                              <span className="text-base font-medium text-[#644d36] font-mono">Age</span>
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
                          </div>

                          {/* Column 2: Position (top) and Role (bottom) */}
                          <div className="flex flex-col space-y-6">
                            {/* Position */}
                            <div className="flex flex-col items-center space-y-2">
                              <span className="text-base font-medium text-[#644d36] font-mono">Position</span>
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

                            {/* Role */}
                            <div className="flex flex-col items-center space-y-2">
                              <span className="text-base font-medium text-[#644d36] font-mono">Role</span>
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
                          </div>

                          {/* Column 3: Pace and Dribbling */}
                          <div className="flex flex-col justify-center space-y-6">
                            {/* Pace */}
                            <div className="flex flex-col items-center space-y-2">
                              <span className="text-base font-medium text-[#644d36] font-mono">Pace</span>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateAttribute(player, 'pace', -1);
                                  }}
                                  className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                                >
                                  -
                                </button>
                                <span className="text-sm font-medium text-[#dde1e0] w-8 text-center font-mono">
                                  {(player.attributes as PlayerAttributes).pace}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateAttribute(player, 'pace', 1);
                                  }}
                                  className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Dribbling */}
                            <div className="flex flex-col items-center space-y-2">
                              <span className="text-base font-medium text-[#644d36] font-mono">Dribbling</span>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateAttribute(player, 'dribbling', -1);
                                  }}
                                  className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                                >
                                  -
                                </button>
                                <span className="text-sm font-medium text-[#dde1e0] w-8 text-center font-mono">
                                  {(player.attributes as PlayerAttributes).dribbling}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateAttribute(player, 'dribbling', 1);
                                  }}
                                  className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Column 4: Shooting and Passing */}
                          <div className="flex flex-col justify-center space-y-6">
                            {/* Shooting */}
                            <div className="flex flex-col items-center space-y-2">
                              <span className="text-base font-medium text-[#644d36] font-mono">Shooting</span>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateAttribute(player, 'shooting', -1);
                                  }}
                                  className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                                >
                                  -
                                </button>
                                <span className="text-sm font-medium text-[#dde1e0] w-8 text-center font-mono">
                                  {(player.attributes as PlayerAttributes).shooting}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateAttribute(player, 'shooting', 1);
                                  }}
                                  className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Passing */}
                            <div className="flex flex-col items-center space-y-2">
                              <span className="text-base font-medium text-[#644d36] font-mono">Passing</span>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateAttribute(player, 'passing', -1);
                                  }}
                                  className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                                >
                                  -
                                </button>
                                <span className="text-sm font-medium text-[#dde1e0] w-8 text-center font-mono">
                                  {(player.attributes as PlayerAttributes).passing}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateAttribute(player, 'passing', 1);
                                  }}
                                  className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Column 5: Defending and Physical */}
                          <div className="flex flex-col justify-center space-y-6">
                            {/* Defending */}
                            <div className="flex flex-col items-center space-y-2">
                              <span className="text-base font-medium text-[#644d36] font-mono">Defending</span>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateAttribute(player, 'defending', -1);
                                  }}
                                  className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                                >
                                  -
                                </button>
                                <span className="text-sm font-medium text-[#dde1e0] w-8 text-center font-mono">
                                  {(player.attributes as PlayerAttributes).defending}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateAttribute(player, 'defending', 1);
                                  }}
                                  className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Physical */}
                            <div className="flex flex-col items-center space-y-2">
                              <span className="text-base font-medium text-[#644d36] font-mono">Physical</span>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateAttribute(player, 'physical', -1);
                                  }}
                                  className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                                >
                                  -
                                </button>
                                <span className="text-sm font-medium text-[#dde1e0] w-8 text-center font-mono">
                                  {(player.attributes as PlayerAttributes).physical}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateAttribute(player, 'physical', 1);
                                  }}
                                  className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 hover:text-[#dde1e0] active:scale-90 transition-all border border-[#a8b8a7]/30 text-sm shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/40"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
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