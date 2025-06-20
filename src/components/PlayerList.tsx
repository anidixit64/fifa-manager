'use client';

import { useState } from 'react';
import { Player } from '@/types/player';

interface PlayerListProps {
  players: Player[];
  onDeletePlayer: (playerId: string) => void;
  onUpdatePlayer: (player: Player) => void;
}

const POSITIONS = [
  'GK', 'LB', 'CB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST'
];

const ROLES = [
  { value: 'C', label: 'Crucial' },
  { value: 'I', label: 'Important' },
  { value: 'R', label: 'Rotation' },
  { value: 'S', label: 'Squad' },
  { value: 'P', label: 'Prospect' }
] as const;

type PlayerRole = typeof ROLES[number]['value'];

const ATTRIBUTES: (keyof Player['attributes'])[] = [
  'pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'
];

export default function PlayerList({ players, onDeletePlayer, onUpdatePlayer }: PlayerListProps) {
  const [expandedPlayers, setExpandedPlayers] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc' | null;
  }>({ key: 'mainPosition', direction: 'asc' });

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

  const updateAttribute = (player: Player, attr: keyof Player['attributes'], delta: number) => {
    const newValue = Math.max(0, Math.min(99, player.attributes[attr] + delta));
    const updatedPlayer = {
      ...player,
      attributes: {
        ...player.attributes,
        [attr]: newValue
      }
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

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[#dde1e0] font-mono">Squad</h2>
      {players.length === 0 ? (
        <div className="text-center py-4 text-[#dde1e0] font-mono">
          No players added yet. Add your first player using the form above.
        </div>
      ) : (
        <div className="space-y-2">
          {/* Attribute Headers */}
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

          {getSortedPlayers().map((player) => (
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
                    <div className="w-6 text-center text-[#dde1e0] font-mono">{player.attributes.pace}</div>
                    <div className="w-6 text-center text-[#dde1e0] font-mono">{player.attributes.shooting}</div>
                    <div className="w-6 text-center text-[#dde1e0] font-mono">{player.attributes.passing}</div>
                    <div className="w-6 text-center text-[#dde1e0] font-mono">{player.attributes.dribbling}</div>
                    <div className="w-6 text-center text-[#dde1e0] font-mono">{player.attributes.defending}</div>
                    <div className="w-6 text-center text-[#dde1e0] font-mono">{player.attributes.physical}</div>
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
                    className="absolute top-2 right-2 text-[#644d36] hover:text-[#8f7a5a] active:scale-95 transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="grid grid-cols-1 gap-6">
                      <div className="flex flex-col items-center space-y-2">
                        <span className="text-lg font-medium text-[#644d36] font-mono">Age</span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateAge(player, -1);
                            }}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 active:scale-95 transition-all border border-[#a8b8a7]/30"
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
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 active:scale-95 transition-all border border-[#a8b8a7]/30"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col items-center space-y-2">
                        <span className="text-lg font-medium text-[#644d36] font-mono">Nationality</span>
                        <span className="text-sm font-medium text-[#dde1e0] font-mono">
                          {player.nationality}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-x-24 gap-y-2 mr-32">
                      {ATTRIBUTES.map(attr => (
                        <div key={attr} className="flex flex-col items-center space-y-0.5">
                          <span className="text-sm text-[#644d36] font-mono">{attr.charAt(0).toUpperCase() + attr.slice(1)}</span>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateAttribute(player, attr, -1);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 active:scale-95 transition-all border border-[#a8b8a7]/30"
                            >
                              -
                            </button>
                            <span className="text-sm font-medium text-[#dde1e0] w-8 text-center font-mono">
                              {player.attributes[attr]}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateAttribute(player, attr, 1);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 active:scale-95 transition-all border border-[#a8b8a7]/30"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="flex flex-col items-center space-y-0.5">
                        <span className="text-sm text-[#644d36] font-mono">Overall</span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateAttribute(player, 'pace', -1);
                            }}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 active:scale-95 transition-all border border-[#a8b8a7]/30"
                          >
                            -
                          </button>
                          <span className="text-sm font-medium text-[#dde1e0] w-8 text-center font-mono">
                            {player.overall}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateAttribute(player, 'pace', 1);
                            }}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 active:scale-95 transition-all border border-[#a8b8a7]/30"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col items-center space-y-0.5">
                        <span className="text-sm text-[#644d36] font-mono">Position</span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updatePosition(player, 'prev');
                            }}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 active:scale-95 transition-all border border-[#a8b8a7]/30"
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
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 active:scale-95 transition-all border border-[#a8b8a7]/30"
                          >
                            &gt;
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col items-center space-y-0.5">
                        <span className="text-sm text-[#644d36] font-mono">Role</span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateRole(player, 'prev');
                            }}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 active:scale-95 transition-all border border-[#a8b8a7]/30"
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
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 active:scale-95 transition-all border border-[#a8b8a7]/30"
                          >
                            &gt;
                          </button>
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
  );
} 