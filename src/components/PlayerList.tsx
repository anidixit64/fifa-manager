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

  const togglePlayer = (playerId: string) => {
    const newExpanded = new Set(expandedPlayers);
    if (newExpanded.has(playerId)) {
      newExpanded.delete(playerId);
    } else {
      newExpanded.add(playerId);
    }
    setExpandedPlayers(newExpanded);
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

  // Sort players by position
  const sortedPlayers = [...players].sort((a, b) => {
    return POSITIONS.indexOf(a.mainPosition) - POSITIONS.indexOf(b.mainPosition);
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-black">Squad</h2>
      {players.length === 0 ? (
        <div className="text-center py-4 text-black">
          No players added yet. Add your first player using the form above.
        </div>
      ) : (
        <div className="space-y-2">
          {/* Attribute Headers */}
          <div className="flex items-center px-4">
            <div className="w-65"></div> {/* Name spacer */}
            <div className="flex-1 flex justify-between items-center">
              <div className="w-8 text-center text-xs text-black">Country</div>
              <div className="w-8 text-center text-xs text-black">Position</div>
              <div className="w-8 text-center text-xs text-black">Role</div>
              <div className="w-8 text-center text-xs text-black">Overall</div>
              <div className="w-8 text-center text-xs text-black">PAC</div>
              <div className="w-8 text-center text-xs text-black">SHO</div>
              <div className="w-8 text-center text-xs text-black">PAS</div>
              <div className="w-8 text-center text-xs text-black">DRI</div>
              <div className="w-8 text-center text-xs text-black">DEF</div>
              <div className="w-8 text-center text-xs text-black">PHY</div>
            </div>
          </div>

          {sortedPlayers.map((player) => (
            <div key={player.id}>
              <div
                onClick={() => togglePlayer(player.id)}
                className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center">
                  <div className="w-65">
                    <span className="font-semibold text-black">{player.shortName || player.name}</span>
                  </div>
                  <div className="flex-1 flex justify-between items-center">
                    <div className="w-8 text-center text-black">{player.fifaCode}</div>
                    <div className="w-8 text-center text-black">{player.mainPosition}</div>
                    <div className="w-8 text-center text-black">{player.role}</div>
                    <div className="w-8 text-center font-medium text-blue-600">{player.overall}</div>
                    <div className="w-8 text-center text-black">{player.attributes.pace}</div>
                    <div className="w-8 text-center text-black">{player.attributes.shooting}</div>
                    <div className="w-8 text-center text-black">{player.attributes.passing}</div>
                    <div className="w-8 text-center text-black">{player.attributes.dribbling}</div>
                    <div className="w-8 text-center text-black">{player.attributes.defending}</div>
                    <div className="w-8 text-center text-black">{player.attributes.physical}</div>
                  </div>
                </div>
              </div>
              {expandedPlayers.has(player.id) && (
                <div className="mt-2 bg-gray-50 p-4 rounded-lg relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePlayer(player.id);
                    }}
                    className="absolute top-2 right-2 text-red-600 hover:text-red-800 active:scale-95 transition-transform"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="grid grid-cols-1 gap-6">
                      <div className="flex flex-col items-center space-y-2">
                        <span className="text-lg font-medium text-black">Age</span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateAge(player, -1);
                            }}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 active:scale-95 transition-all"
                          >
                            -
                          </button>
                          <span className="text-sm font-medium text-black w-8 text-center">
                            {player.age}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateAge(player, 1);
                            }}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 active:scale-95 transition-all"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col items-center space-y-2">
                        <span className="text-lg font-medium text-black">Nationality</span>
                        <span className="text-sm font-medium text-black">
                          {player.nationality}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-x-24 gap-y-2 mr-32">
                      {ATTRIBUTES.map(attr => (
                        <div key={attr} className="flex flex-col items-center space-y-0.5">
                          <span className="text-sm text-black">{attr.charAt(0).toUpperCase() + attr.slice(1)}</span>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateAttribute(player, attr, -1);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 active:scale-95 transition-all"
                            >
                              -
                            </button>
                            <span className="text-sm font-medium text-black w-8 text-center">
                              {player.attributes[attr]}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateAttribute(player, attr, 1);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 active:scale-95 transition-all"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="flex flex-col items-center space-y-0.5">
                        <span className="text-sm text-black">Overall</span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateAttribute(player, 'pace', -1);
                            }}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 active:scale-95 transition-all"
                          >
                            -
                          </button>
                          <span className="text-sm font-medium text-black w-8 text-center">
                            {player.overall}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateAttribute(player, 'pace', 1);
                            }}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 active:scale-95 transition-all"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col items-center space-y-0.5">
                        <span className="text-sm text-black">Position</span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updatePosition(player, 'prev');
                            }}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 active:scale-95 transition-all"
                          >
                            &lt;
                          </button>
                          <span className="text-sm font-medium text-black w-8 text-center">
                            {player.mainPosition}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updatePosition(player, 'next');
                            }}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 active:scale-95 transition-all"
                          >
                            &gt;
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col items-center space-y-0.5">
                        <span className="text-sm text-black">Role</span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateRole(player, 'prev');
                            }}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 active:scale-95 transition-all"
                          >
                            &lt;
                          </button>
                          <span className="text-sm font-medium text-black w-8 text-center">
                            {player.role}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateRole(player, 'next');
                            }}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 active:scale-95 transition-all"
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