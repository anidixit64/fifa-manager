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

interface Formation {
  name: string;
  positions: Record<Position, number>;
}

const FORMATIONS: Formation[] = [
  {
    name: '4-3-3',
    positions: {
      RB: 1, RWB: 0, CB: 2, LB: 1, LWB: 0, CM: 2, RM: 0, LM: 0, CDM: 0, CAM: 1, RF: 0, RW: 1, LF: 0, LW: 1, ST: 1, CF: 0,
    }
  },
  {
    name: '4-2-3-1',
    positions: {
      RB: 1, RWB: 0, CB: 2, LB: 1, LWB: 0, CM: 0, RM: 0, LM: 0, CDM: 2, CAM: 1, RF: 0, RW: 1, LF: 0, LW: 1, ST: 1, CF: 0,
    }
  },
  {
    name: '4-4-2',
    positions: {
      RB: 1, RWB: 0, CB: 2, LB: 1, LWB: 0, CM: 2, RM: 1, LM: 1, CDM: 0, CAM: 0, RF: 0, RW: 0, LF: 0, LW: 0, ST: 2, CF: 0,
    }
  },
  {
    name: '5-3-2',
    positions: {
      RB: 0, RWB: 1, CB: 3, LB: 0, LWB: 1, CM: 2, RM: 0, LM: 0, CDM: 0, CAM: 1, RF: 0, RW: 0, LF: 0, LW: 0, ST: 2, CF: 0,
    }
  },
];

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
  const [selectedFormation, setSelectedFormation] = useState<string>('');

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

  const applyFormation = (formationName: string) => {
    const formation = FORMATIONS.find(f => f.name === formationName);
    if (!formation) return;
    
    const newCounts = POSITIONS.map(pos => ({
      position: pos,
      count: formation.positions[pos]
    }));
    setPositionCounts(newCounts);
    setSelectedFormation(formationName);
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
    <main className="min-h-screen bg-[#3c5c34] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.push('/manager')}
            className="mr-4 text-[#dde1e0]/80 hover:text-[#a78968] transition-colors"
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
          <h1 className="text-4xl font-bold text-[#dde1e0] font-mono tracking-wider">Edit Tactics</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-3 bg-[#dde1e0]/10 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-[#a78968]/30">
            <h2 className="text-xl font-bold mb-4 text-[#dde1e0] font-mono tracking-wider">Position Counts</h2>
            
            {/* Formation Dropdown */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#a78968] mb-2 font-mono">Quick Formation</label>
              <select
                value={selectedFormation}
                onChange={(e) => applyFormation(e.target.value)}
                className="w-full px-3 py-2 bg-[#dde1e0]/10 border border-[#a78968]/30 rounded-lg text-[#dde1e0] font-mono focus:outline-none focus:border-[#a78968] focus:ring-1 focus:ring-[#a78968] transition-colors"
              >
                <option value="">Select Formation</option>
                {FORMATIONS.map((formation) => (
                  <option key={formation.name} value={formation.name} className="bg-[#3c5c34] text-[#dde1e0]">
                    {formation.name}
                  </option>
                ))}
              </select>
              
              {selectedFormation && (
                <button
                  onClick={() => {
                    setSelectedFormation('');
                    handleReset();
                  }}
                  className="mt-2 w-full px-3 py-1 text-xs bg-[#644d36]/30 hover:bg-[#644d36]/50 text-[#dde1e0] font-mono rounded transition-colors"
                >
                  Clear Formation
                </button>
              )}
            </div>
            
            <div className="space-y-2">
              {positionCounts.map(({ position, count }) => (
                <div
                  key={position}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-[#644d36]/20 transition-colors border border-transparent hover:border-[#644d36]/30"
                >
                  <span className="font-medium text-[#dde1e0] font-mono">{position}</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDecrement(position)}
                      className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a78968]/40 text-[#dde1e0] hover:bg-[#a78968]/60 active:scale-95 transition-all"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-[#a78968] font-mono font-bold">{count}</span>
                    <button
                      onClick={() => handleIncrement(position)}
                      className="w-6 h-6 flex items-center justify-center rounded-full bg-[#a78968]/40 text-[#dde1e0] hover:bg-[#a78968]/60 active:scale-95 transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
              <div className="mt-4 pt-4 border-t border-[#a78968]/30 flex justify-between items-center">
                <span className="font-medium text-[#dde1e0] font-mono">Total (excl. GK)</span>
                <span className="font-bold text-[#a78968] font-mono text-lg">{getTotalCount()}/10</span>
              </div>
              <button
                onClick={handleReset}
                className="mt-4 w-full relative group px-4 py-2 text-[#dde1e0] overflow-hidden font-mono"
              >
                {/* Button background */}
                <div className="absolute inset-0 bg-[#644d36]/30 group-hover:bg-[#644d36]/50 transition-colors"></div>
                
                {/* Button border */}
                <div className="absolute inset-0 border border-[#644d36]/50"></div>
                
                {/* Button text */}
                <span className="relative z-10 tracking-wider font-semibold">
                  Reset Counts
                </span>
              </button>
            </div>
          </div>
          {/* Main area: Attribute priorities for positions with count >= 1 */}
          <div className="lg:col-span-9 bg-[#dde1e0]/10 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-[#a78968]/30">
            <h2 className="text-2xl font-bold mb-6 text-[#dde1e0] font-mono tracking-wider">Attribute Priorities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {positionCounts.filter((pc) => pc.count > 0).map(({ position }) => {
                const positionPriority = positionPriorities.find(
                  (pp) => pp.position === position
                );
                return (
                  <div key={position} className="p-4 border border-[#644d36]/40 rounded-lg bg-[#dde1e0]/5 hover:bg-[#644d36]/10 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-bold text-[#a78968] font-mono">{position}</h3>
                      {TOGGLE_POSITIONS.includes(position as TogglePosition) && (
                        <button
                          onClick={() => handleTogglePosition(position as TogglePosition)}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            toggledPositions.has(position as TogglePosition) ? 'bg-[#a78968]' : 'bg-[#644d36]/50'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full bg-[#dde1e0] transform transition-transform ${
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
                        if (idx === 0) priorityColor = "bg-[#a78968]";
                        else if (idx === 1) priorityColor = "bg-[#644d36]";
                        else if (idx === 2) priorityColor = "bg-[#a8b8a7]";
                        return (
                          <button
                            key={attr}
                            onClick={() => updatePositionPriority(position, attr)}
                            className={`px-3 py-1 rounded-full text-sm font-mono transition-all hover:scale-105 active:scale-95 ${
                              isSelected
                                ? `${priorityColor} text-[#3c5c34]`
                                : "bg-[#dde1e0]/20 text-[#dde1e0] hover:bg-[#644d36]/30 hover:text-[#a78968]"
                            }`}
                          >
                            <span style={isSelected ? { color: '#3c5c34' } : {}}>{attr}</span>
                            {isSelected && <span className="ml-1" style={{ color: '#3c5c34' }}>#{idx + 1}</span>}
                          </button>
                        );
                      })}
                    </div>
                    <div className="text-xs text-[#644d36] mt-2 font-mono">
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