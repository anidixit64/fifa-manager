'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useLocalStorage from '@/hooks/useLocalStorage';
import { Player } from '@/types/player';

interface Team {
  id: string;
  name: string;
  country: string;
  logo?: string;
}

export default function PlayerStatsPage() {
  const router = useRouter();
  const [selectedTeam] = useLocalStorage<Team | null>('selectedTeam', null);
  const [players, setPlayers] = useLocalStorage<Player[]>('fifaPlayers', []);
  const [isClient, setIsClient] = useState(false);

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

  if (!selectedTeam || !isClient) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.push('/manager')}
            className="mr-4 text-black hover:text-blue-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-black">Player Statistics</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map(player => (
            <div key={player.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-black">{player.name}</h3>
                  <p className="text-sm text-gray-600">{player.mainPosition}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">{player.overall}</p>
                  <p className="text-sm text-gray-600">{player.role}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Goals
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updatePlayerStats(player.id, 'goals', (player.stats?.goals || 0) - 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 active:scale-95 transition-all"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={player.stats?.goals || 0}
                      onChange={(e) => updatePlayerStats(player.id, 'goals', parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-1 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-gray-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      onClick={() => updatePlayerStats(player.id, 'goals', (player.stats?.goals || 0) + 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 active:scale-95 transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assists
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updatePlayerStats(player.id, 'assists', (player.stats?.assists || 0) - 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 active:scale-95 transition-all"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={player.stats?.assists || 0}
                      onChange={(e) => updatePlayerStats(player.id, 'assists', parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-1 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-gray-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      onClick={() => updatePlayerStats(player.id, 'assists', (player.stats?.assists || 0) + 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 active:scale-95 transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
} 