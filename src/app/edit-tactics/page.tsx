'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useTeamThemeStyles } from '@/hooks/useTeamThemeStyles';
import { Player } from '@/types/player';

interface Team {
  id: string;
  name: string;
  country: string;
  logo?: string;
}

const POSITIONS = [
  'GK', 'RB', 'RWB', 'CB', 'LB', 'LWB', 'CM', 'RM', 'LM', 'CDM', 'CAM', 'RF', 'RW', 'LF', 'LW', 'ST', 'CF'
];

const ATTRIBUTES = ['Pace', 'Shooting', 'Passing', 'Dribbling', 'Defending', 'Physical'];

interface PositionCount {
  position: string;
  count: number;
}

interface PositionPriority {
  position: string;
  priorities: string[];
}

export default function EditTacticsPage() {
  const router = useRouter();
  const [selectedTeam] = useLocalStorage<Team | null>('selectedTeam', null);
  const [positionCounts, setPositionCounts] = useLocalStorage<PositionCount[]>('positionCounts', []);
  const [positionPriorities, setPositionPriorities] = useLocalStorage<PositionPriority[]>('positionPriorities', []);
  const styles = useTeamThemeStyles();

  useEffect(() => {
    if (!selectedTeam) {
      router.push('/create-team');
    }
  }, [selectedTeam, router]);

  // Initialize position counts if not already set
  useEffect(() => {
    if (positionCounts.length === 0) {
      const defaultCounts = {
        'GK': 1,
        'RB': 1,
        'RWB': 0,
        'CB': 2,
        'LB': 1,
        'LWB': 0,
        'CM': 2,
        'RM': 1,
        'LM': 1,
        'CDM': 1,
        'CAM': 1,
        'RF': 0,
        'RW': 1,
        'LF': 0,
        'LW': 1,
        'ST': 1,
        'CF': 0
      };

      const initialCounts = POSITIONS.map(pos => ({
        position: pos,
        count: defaultCounts[pos as keyof typeof defaultCounts] || 0
      }));
      setPositionCounts(initialCounts);
    }
  }, [positionCounts.length, setPositionCounts]);

  // Initialize position priorities if not already set
  useEffect(() => {
    if (positionPriorities.length === 0) {
      const initialPriorities = POSITIONS.map(pos => ({
        position: pos,
        priorities: []
      }));
      setPositionPriorities(initialPriorities);
    }
  }, [positionPriorities.length, setPositionPriorities]);

  const updatePositionCount = (position: string, delta: number) => {
    const newCounts = positionCounts.map((pc: PositionCount): PositionCount => {
      if (pc.position === position) {
        const newCount = pc.count + delta;
        // GK can only be 0 or 1
        if (position === 'GK') {
          return { ...pc, count: Math.max(0, Math.min(1, newCount)) };
        }
        // Other positions can be 0 or more
        return { ...pc, count: Math.max(0, newCount) };
      }
      return pc;
    });

    // Check if total count would exceed 11
    const totalCount = newCounts.reduce((sum: number, pc: PositionCount): number => sum + pc.count, 0);
    if (totalCount <= 11) {
      setPositionCounts(newCounts);
    }
  };

  const updatePositionPriority = (position: string, attribute: string) => {
    const positionPriority = positionPriorities.find((pp: PositionPriority): boolean => pp.position === position);
    if (!positionPriority) return;

    const priorities = [...positionPriority.priorities];
    const index = priorities.indexOf(attribute);

    if (index === -1) {
      // Add attribute if not already in priorities and less than 3
      if (priorities.length < 3) {
        priorities.push(attribute);
      }
    } else {
      // Remove attribute if already in priorities
      priorities.splice(index, 1);
    }

    const newPriorities = positionPriorities.map((pp: PositionPriority): PositionPriority => 
      pp.position === position 
        ? { ...pp, priorities }
        : pp
    );
    setPositionPriorities(newPriorities);
  };

  const getTotalCount = () => {
    return positionCounts.reduce((sum, pc) => sum + pc.count, 0);
  };

  if (!selectedTeam) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.push('/manager')}
            className={`mr-4 ${styles.primaryText} hover:opacity-80 transition-opacity`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className={`text-4xl font-bold ${styles.primaryText}`}>Edit Tactics</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className={`text-2xl font-bold ${styles.primaryText} mb-6`}>Position Counts</h2>
            <div className="space-y-4">
              {positionCounts.map(({ position, count }) => (
                <div key={position} className="flex items-center justify-between">
                  <span className="font-medium">{position}</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updatePositionCount(position, count - 1)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg ${styles.accentBg} text-white hover:opacity-90 active:scale-95 transition-all`}
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{count}</span>
                    <button
                      onClick={() => updatePositionCount(position, count + 1)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg ${styles.accentBg} text-white hover:opacity-90 active:scale-95 transition-all`}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className={`text-2xl font-bold ${styles.primaryText} mb-6`}>Position Priorities</h2>
            <div className="space-y-4">
              {positionPriorities.map(({ position, priorities }) => (
                <div key={position} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{position}</span>
                    <button
                      onClick={() => updatePositionPriority(position, 'pace')}
                      className={`px-3 py-1 rounded-full text-sm ${
                        priorities.includes('pace')
                          ? `${styles.primaryBg} text-white`
                          : `${styles.accentBg} text-white`
                      }`}
                    >
                      Pace
                    </button>
                    <button
                      onClick={() => updatePositionPriority(position, 'shooting')}
                      className={`px-3 py-1 rounded-full text-sm ${
                        priorities.includes('shooting')
                          ? `${styles.primaryBg} text-white`
                          : `${styles.accentBg} text-white`
                      }`}
                    >
                      Shooting
                    </button>
                    <button
                      onClick={() => updatePositionPriority(position, 'passing')}
                      className={`px-3 py-1 rounded-full text-sm ${
                        priorities.includes('passing')
                          ? `${styles.primaryBg} text-white`
                          : `${styles.accentBg} text-white`
                      }`}
                    >
                      Passing
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 