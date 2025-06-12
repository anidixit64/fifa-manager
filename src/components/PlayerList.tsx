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
            <div className="w-32"></div> {/* Name spacer */}
            <div className="w-12"></div> {/* Position spacer */}
            <div className="w-12"></div> {/* Overall spacer */}
            <div className="flex-1 grid grid-cols-6 gap-0 pl-4">
              {ATTRIBUTES.map((attr) => (
                <div 
                  key={attr} 
                  className="text-xs text-black text-center"
                >
                  {attr}
                </div>
              ))}
            </div>
          </div>

          {sortedPlayers.map((player) => (
            <div key={player.id}>
              <div
                onClick={() => togglePlayer(player.id)}
                className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center">
                  <div className="flex items-center flex-1">
                    <span className="font-semibold text-black w-32">{player.name}</span>
                    <span className="text-black w-12">{player.mainPosition}</span>
                    <span className="font-medium text-blue-600 w-12">{player.overall}</span>
                    <div className="flex-1 grid grid-cols-6 gap-0 pl-4">
                      {ATTRIBUTES.map((attr) => (
                        <div 
                          key={attr} 
                          className="text-sm font-medium text-black text-center"
                        >
                          {player.attributes[attr]}
                        </div>
                      ))}
                    </div>
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
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-black">{player.name}</h3>
                      <p className="text-black">Age: {player.age}</p>
                      <p className="text-black">Nationality: {player.nationality}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {ATTRIBUTES.map(attr => (
                        <div key={attr} className="flex flex-col items-center space-y-1">
                          <span className="text-sm text-black capitalize">{attr}</span>
                          <div className="flex items-center space-x-2">
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
                      <div className="flex flex-col items-center space-y-1">
                        <span className="text-sm text-black">Overall</span>
                        <div className="flex items-center space-x-2">
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
                      <div className="flex flex-col items-center space-y-1">
                        <span className="text-sm text-black">Position</span>
                        <div className="flex items-center space-x-2">
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