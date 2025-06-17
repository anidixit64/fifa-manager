'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useTeamThemeStyles } from '@/hooks/useTeamThemeStyles';

interface Team {
  id: string;
  name: string;
  country: string;
  logo?: string;
}

const POSITIONS = [
  'RB', 'RWB', 'CB', 'LB', 'LWB', 'CM', 'RM', 'LM', 'CDM', 'CAM', 'RF', 'RW', 'LF', 'LW', 'ST', 'CF',
] as const;

const TOGGLE_POSITIONS = ['RWB', 'RB', 'RW', 'LWB', 'LB', 'LW'] as const;
type TogglePosition = typeof TOGGLE_POSITIONS[number];

const ATTRIBUTES = [
  'Pace',
  'Shooting',
  'Passing',
  'Dribbling',
  'Defending',
  'Physical',
] as const;

type Position = typeof POSITIONS[number];
type Attribute = typeof ATTRIBUTES[number];

interface PositionCount {
  position: Position;
  count: number;
}

interface PositionPriority {
  position: Position;
  priorities: Attribute[];
}

const DEFAULT_COUNTS: Record<Position, number> = {
  RB: 0,
  RWB: 0,
  CB: 0,
  LB: 0,
  LWB: 0,
  CM: 0,
  RM: 0,
  LM: 0,
  CDM: 0,
  CAM: 0,
  RF: 0,
  RW: 0,
  LF: 0,
  LW: 0,
  ST: 0,
  CF: 0,
};

export default function EditTacticsPage() {
  const router = useRouter();
  const [selectedTeam] = useLocalStorage<Team | null>('selectedTeam', null);
  const [positionCounts, setPositionCounts] = useLocalStorage<PositionCount[]>('positionCounts', []);
  const [positionPriorities, setPositionPriorities] = useLocalStorage<PositionPriority[]>('positionPriorities', []);
  const [toggledPositions, setToggledPositions] = useState<Set<TogglePosition>>(new Set());
  const [isClient, setIsClient] = useState(false);
  const styles = useTeamThemeStyles();

  // Set isClient to true after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize position counts and priorities
  useEffect(() => {
    if (!positionCounts.length) {
      const initialCounts = POSITIONS.map((pos) => ({
        position: pos,
        count: DEFAULT_COUNTS[pos],
      }));
      setPositionCounts(initialCounts);
    }

    if (!positionPriorities.length) {
      const initialPriorities = POSITIONS.map((pos) => ({
        position: pos,
        priorities: [],
      }));
      setPositionPriorities(initialPriorities);
    }
  }, [positionCounts.length, positionPriorities.length, setPositionCounts, setPositionPriorities]);

  // Load toggled positions from localStorage
  useEffect(() => {
    if (isClient) {
      const storedToggles = localStorage.getItem('toggledPositions');
      if (storedToggles) {
        try {
          const parsedToggles = JSON.parse(storedToggles);
          setToggledPositions(new Set(parsedToggles));
        } catch (error) {
          console.error('Error parsing toggled positions:', error);
        }
      }
    }
  }, [isClient]);

  // Handle navigation
  useEffect(() => {
    if (!selectedTeam) {
      router.push('/create-team');
    }
  }, [selectedTeam, router]);

  const handleIncrement = (position: Position) => {
    const currentCounts = [...positionCounts];
    const index = currentCounts.findIndex(pc => pc.position === position);
    if (index === -1) return;

    const totalCount = currentCounts.reduce((sum, pc) => sum + pc.count, 0);
    if (totalCount >= 10) return;

    currentCounts[index] = {
      ...currentCounts[index],
      count: currentCounts[index].count + 1
    };
    setPositionCounts(currentCounts);
  };

  const handleDecrement = (position: Position) => {
    const currentCounts = [...positionCounts];
    const index = currentCounts.findIndex(pc => pc.position === position);
    if (index === -1) return;

    if (currentCounts[index].count <= 0) return;

    currentCounts[index] = {
      ...currentCounts[index],
      count: currentCounts[index].count - 1
    };
    setPositionCounts(currentCounts);
  };

  const handleReset = () => {
    const newCounts = POSITIONS.map(pos => ({
      position: pos,
      count: DEFAULT_COUNTS[pos]
    }));
    setPositionCounts(newCounts);
  };

  const updatePositionPriority = (position: Position, attribute: Attribute) => {
    const positionPriority = positionPriorities.find((pp) => pp.position === position);
    if (!positionPriority) return;
    
    const priorities = [...positionPriority.priorities];
    const index = priorities.indexOf(attribute);
    
    if (index === -1) {
      if (priorities.length < 3) priorities.push(attribute);
    } else {
      priorities.splice(index, 1);
    }
    
    setPositionPriorities(
      positionPriorities.map((pp) =>
        pp.position === position ? { ...pp, priorities } : pp
      )
    );
  };

  const getTotalCount = () => positionCounts.reduce((sum, pc) => sum + pc.count, 0);

  const handleTogglePosition = (position: TogglePosition) => {
    setToggledPositions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(position)) {
        newSet.delete(position);
      } else {
        newSet.add(position);
      }
      // Save to localStorage only on client
      if (isClient) {
        localStorage.setItem('toggledPositions', JSON.stringify(Array.from(newSet)));
      }
      return newSet;
    });
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
            className="mr-4 text-black hover:opacity-80 transition-opacity"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-4xl font-bold text-black">Edit Tactics</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-black">Position Counts</h2>
            <div className="space-y-2">
              {positionCounts.map(({ position, count }) => (
                <div
                  key={position}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
                >
                  <span className="font-medium text-black">{position}</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDecrement(position)}
                      className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 active:scale-95 transition-all"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-black">{count}</span>
                    <button
                      onClick={() => handleIncrement(position)}
                      className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 active:scale-95 transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className="font-medium text-black">Total (excl. GK)</span>
                <span className="font-bold text-black">{getTotalCount()}/10</span>
              </div>
              <button
                onClick={handleReset}
                className="mt-4 w-full py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 active:scale-95 transition-all"
              >
                Reset Counts
              </button>
            </div>
          </div>
          {/* Main area: Attribute priorities for positions with count >= 1 */}
          <div className="lg:col-span-9 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6 text-black">Attribute Priorities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {positionCounts.filter((pc) => pc.count > 0).map(({ position }) => {
                const positionPriority = positionPriorities.find(
                  (pp) => pp.position === position
                );
                return (
                  <div key={position} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-bold text-black">{position}</h3>
                      {TOGGLE_POSITIONS.includes(position as TogglePosition) && (
                        <button
                          onClick={() => handleTogglePosition(position as TogglePosition)}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            toggledPositions.has(position as TogglePosition) ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
                              toggledPositions.has(position as TogglePosition) ? 'translate-x-6' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ATTRIBUTES.map((attr) => {
                        const idx = positionPriority?.priorities.indexOf(attr) ?? -1;
                        const isSelected = idx !== -1;
                        let priorityColor = "";
                        if (idx === 0) priorityColor = "bg-green-600";
                        else if (idx === 1) priorityColor = "bg-yellow-600";
                        else if (idx === 2) priorityColor = "bg-red-600";
                        return (
                          <button
                            key={attr}
                            onClick={() => updatePositionPriority(position, attr)}
                            className={`px-3 py-1 rounded-full text-sm ${
                              isSelected
                                ? `${priorityColor} text-white`
                                : "bg-blue-200 text-blue-800"
                            }`}
                          >
                            <span className="text-black" style={isSelected ? { color: 'white' } : {}}>{attr}</span>
                            {isSelected && <span className="ml-1 text-white">#{idx + 1}</span>}
                          </button>
                        );
                      })}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Select up to 3 attributes in order of importance.
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 