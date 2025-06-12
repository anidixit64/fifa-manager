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

const POSITIONS = [
  'GK', 'LB', 'CB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST'
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

  useEffect(() => {
    if (!selectedTeam) {
      router.push('/create-team');
    }
  }, [selectedTeam, router]);

  // Initialize position counts if not already set
  useEffect(() => {
    if (positionCounts.length === 0) {
      const initialCounts = POSITIONS.map(pos => ({
        position: pos,
        count: 0
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
    setPositionCounts((prev: PositionCount[]) => {
      const newCounts = prev.map((pc: PositionCount) => {
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
      const totalCount = newCounts.reduce((sum: number, pc: PositionCount) => sum + pc.count, 0);
      if (totalCount > 11) {
        return prev;
      }

      return newCounts;
    });
  };

  const updatePositionPriority = (position: string, attribute: string) => {
    setPositionPriorities((prev: PositionPriority[]) => {
      const positionPriority = prev.find((pp: PositionPriority) => pp.position === position);
      if (!positionPriority) return prev;

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

      return prev.map((pp: PositionPriority) => 
        pp.position === position 
          ? { ...pp, priorities }
          : pp
      );
    });
  };

  const getTotalCount = () => {
    return positionCounts.reduce((sum, pc) => sum + pc.count, 0);
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Position Selection Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-black">Positions</h2>
                <span className="text-sm font-medium text-gray-600">
                  {getTotalCount()}/11 Players
                </span>
              </div>
              <div className="space-y-4">
                {POSITIONS.map(position => {
                  const count = positionCounts.find(pc => pc.position === position)?.count || 0;
                  return (
                    <div key={position} className="flex items-center justify-between">
                      <span className="text-black font-medium">{position}</span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updatePositionCount(position, -1)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 active:scale-95 transition-all"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-black font-medium">{count}</span>
                        <button
                          onClick={() => updatePositionCount(position, 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 active:scale-95 transition-all"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Attribute Priority Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-black mb-6">Position Priorities</h2>
              <div className="space-y-6">
                {POSITIONS.map(position => {
                  const count = positionCounts.find(pc => pc.position === position)?.count || 0;
                  const priorities = positionPriorities.find(pp => pp.position === position)?.priorities || [];
                  
                  if (count === 0) return null;

                  return (
                    <div key={position} className="border-b border-gray-200 pb-6 last:border-0">
                      <h3 className="text-lg font-semibold text-black mb-4">{position}</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {ATTRIBUTES.map(attr => {
                          const priorityIndex = priorities.indexOf(attr);
                          return (
                            <button
                              key={attr}
                              onClick={() => updatePositionPriority(position, attr)}
                              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                priorityIndex !== -1
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-black hover:bg-gray-200'
                              }`}
                            >
                              {attr}
                              {priorityIndex !== -1 && (
                                <span className={`ml-2 text-xs font-bold ${
                                  priorityIndex === 0 
                                    ? 'text-green-300' // #1 - Green
                                    : priorityIndex === 1 
                                    ? 'text-yellow-300' // #2 - Yellow
                                    : 'text-red-300' // #3 - Red
                                }`}>
                                  #{priorityIndex + 1}
                                </span>
                              )}
                            </button>
                          );
                        })}
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