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

const FORMATIONS = ['4-4-2', '4-3-3', '4-2-3-1', '3-5-2', '5-3-2'];

const ATTRIBUTES = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'];

interface PositionTactic {
  position: string;
  primaryAttribute: string;
}

export default function EditTacticsPage() {
  const router = useRouter();
  const [selectedTeam] = useLocalStorage<Team | null>('selectedTeam', null);
  const [players] = useLocalStorage<Player[]>('fifaPlayers', []);
  const [formation, setFormation] = useLocalStorage<string>('formation', '4-4-2');
  const [positionTactics, setPositionTactics] = useLocalStorage<PositionTactic[]>('positionTactics', []);

  useEffect(() => {
    if (!selectedTeam) {
      router.push('/create-team');
    }
  }, [selectedTeam, router]);

  // Get unique positions from players
  const positions = Array.from(new Set(players.map(p => p.mainPosition)));

  // Initialize position tactics if not already set
  useEffect(() => {
    if (positionTactics.length === 0) {
      const initialTactics = positions.map(pos => ({
        position: pos,
        primaryAttribute: ATTRIBUTES[0]
      }));
      setPositionTactics(initialTactics);
    }
  }, [positions, positionTactics.length, setPositionTactics]);

  const updatePositionTactic = (position: string, attribute: string) => {
    setPositionTactics(prev => 
      prev.map(tactic => 
        tactic.position === position 
          ? { ...tactic, primaryAttribute: attribute }
          : tactic
      )
    );
  };

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.push('/manager')}
            className="mr-4 text-black hover:text-blue-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-black">Edit Tactics</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-black mb-6">Formation</h2>
              <select
                value={formation}
                onChange={(e) => setFormation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              >
                {FORMATIONS.map(form => (
                  <option key={form} value={form}>{form}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-black mb-6">Position Tactics</h2>
              <div className="space-y-4">
                {positions.map(position => {
                  const tactic = positionTactics.find(t => t.position === position);
                  return (
                    <div key={position} className="border-b border-gray-200 pb-4 last:border-0">
                      <h3 className="text-lg font-semibold text-black mb-2">{position}</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {ATTRIBUTES.map(attr => (
                          <button
                            key={attr}
                            onClick={() => updatePositionTactic(position, attr)}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                              tactic?.primaryAttribute === attr
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-black hover:bg-gray-200'
                            }`}
                          >
                            {attr.charAt(0).toUpperCase() + attr.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 