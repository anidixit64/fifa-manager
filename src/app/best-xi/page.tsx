'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useOptimizedNavigation } from '@/hooks/useOptimizedNavigation';
import { analyzeTeam } from '@/utils/teamAnalysis';
import { Player, Team } from '@/types/player';

type TogglePosition = 'RWB' | 'RB' | 'RW' | 'LWB' | 'LB' | 'LW';

interface PositionCount {
  position: string;
  count: number;
}

interface PositionPriority {
  position: string;
  priorities: string[];
}

interface PlayerRating {
  player: Player;
  rating: number;
  position: string;
}

interface TeamAnalysis {
  bestXI: PlayerRating[];
  bench: PlayerRating[];
  aging: Player[];
  veterans: Player[];
  youngStars: Player[];
  positionStrengths: {
    [key: string]: {
      hasProspect: boolean;
      hasVeteran: boolean;
      hasNormal: boolean;
      hasAging: boolean;
      count: number;
      message?: string;
    };
  };
  sectorStrengths: {
    [key: string]: {
      count: number;
      message?: string;
    };
  };
}

export default function BestXIPage() {
  const router = useRouter();
  const { navigateTo } = useOptimizedNavigation({ transitionDuration: 100 });
  const [selectedTeam] = useLocalStorage<Team | null>('selectedTeam', null);
  const [players, setPlayers] = useLocalStorage<Player[]>('fifaPlayers', []);
  const [positionCounts] = useLocalStorage<PositionCount[]>('positionCounts', []);
  const [positionPriorities] = useLocalStorage<PositionPriority[]>('positionPriorities', []);
  const [analysis, setAnalysis] = useState<TeamAnalysis | null>(null);
  const [toggledPositions, setToggledPositions] = useState<Set<TogglePosition>>(new Set());
  const [isClient, setIsClient] = useState(false);
  const [bestXIToggle, setBestXIToggle] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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

  useEffect(() => {
    if (!selectedTeam) {
      router.push('/create-team');
    } else {
      analyzeTeamData();
    }
  }, [selectedTeam, router, players, positionCounts, positionPriorities, toggledPositions]);

  const analyzeTeamData = () => {
    if (!players || players.length === 0) {
      setAnalysis(null);
      return;
    }

    // Convert Set to array for the analysis function
    const toggledPositionsArray = Array.from(toggledPositions);
    
    // Use the centralized team analysis utility
    const teamAnalysis = analyzeTeam(players, positionCounts, positionPriorities, toggledPositionsArray);
    setAnalysis(teamAnalysis);
  };

  // Helper function to render player card content based on toggle state
  const renderPlayerCardContent = (player: Player, position: string) => {
    if (bestXIToggle && player.mainPosition !== 'GK') {
      // Show stats when toggle is on (for non-GK players)
      const goals = player.stats?.goals || 0;
      const assists = player.stats?.assists || 0;
      return (
        <div className="text-center">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-[#a78968] font-mono">Goals</p>
              <p className="text-sm font-bold text-[#dde1e0] font-mono">{goals}</p>
            </div>
            <div>
              <p className="text-xs text-[#a78968] font-mono">Assists</p>
              <p className="text-sm font-bold text-[#dde1e0] font-mono">{assists}</p>
            </div>
          </div>
        </div>
      );
    } else {
      // Show overall rating when toggle is off or for GK players
      return (
        <div className="text-center">
          <h3 className="font-bold text-[#dde1e0] font-mono text-xs truncate">{player.shortName}</h3>
          <p className="text-xs text-[#dde1e0] font-mono">{position}</p>
          <p className="text-sm font-bold text-[#dde1e0] font-mono">{player.overall}</p>
        </div>
      );
    }
  };

  return (
    <main className="min-h-screen bg-[#3c5c34]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigateTo('/manager')}
            className="relative group p-2 rounded-full bg-[#dde1e0]/10 hover:bg-[#dde1e0]/20 transition-all duration-300 hover:scale-110 active:scale-95 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/50 mr-4"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6 text-[#dde1e0]/80 group-hover:text-[#a78968] transition-all duration-300 group-hover:rotate-12 group-active:-rotate-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {/* Hover glow effect */}
            <div className="absolute inset-0 rounded-full bg-[#a78968]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
          </button>
          <h1 className="text-3xl font-bold text-[#dde1e0] font-mono tracking-wider">Best XI Analysis</h1>
        </div>

        {analysis && (
          <div className="space-y-8">
            {/* Best XI */}
            <div className="bg-[#dde1e0]/10 backdrop-blur-sm rounded-lg shadow p-6 border border-[#a78968]/30">
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-[#dde1e0] font-mono tracking-wider">Best XI</h2>
                <button
                  onClick={() => setBestXIToggle(!bestXIToggle)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#a78968] focus:ring-offset-2 focus:ring-offset-[#2a2a2a] ${
                    bestXIToggle ? 'bg-[#a78968]' : 'bg-[#644d36]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      bestXIToggle ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {/* Best XI Row Layout */}
              <div className="space-y-6">
                {/* Row 6: RW, ST, CF, LW */}
                <div className="flex justify-between items-center w-full min-h-[70px]">
                  {/* Left wing positions */}
                  <div className="flex space-x-2">
                    {analysis.bestXI
                      .filter(({ position }) => position === 'LW')
                      .map(({ player, position }) => (
                        <div
                          key={player.id}
                          className="bg-[#644d36]/20 p-2 rounded-lg border border-[#d4af37] hover:border-[#d4af37]/60 transition-colors flex flex-col justify-center w-[200px] h-[70px]"
                        >
                          {renderPlayerCardContent(player, position)}
                        </div>
                      ))}
                  </div>

                  {/* Center positions */}
                  <div className="flex justify-center space-x-2">
                    {analysis.bestXI
                      .filter(({ position }) => ['ST', 'CF'].includes(position))
                      .sort((a, b) => {
                        const order = { 'ST': 0, 'CF': 1 };
                        return order[a.position as keyof typeof order] - order[b.position as keyof typeof order];
                      })
                      .map(({ player, position }) => (
                        <div
                          key={player.id}
                          className="bg-[#644d36]/20 p-2 rounded-lg border border-[#d4af37] hover:border-[#d4af37]/60 transition-colors flex flex-col justify-center w-[200px] h-[70px]"
                        >
                          {renderPlayerCardContent(player, position)}
                        </div>
                      ))}
                  </div>

                  {/* Right wing positions */}
                  <div className="flex space-x-2">
                    {analysis.bestXI
                      .filter(({ position }) => position === 'RW')
                      .map(({ player, position }) => (
                        <div
                          key={player.id}
                          className="bg-[#644d36]/20 p-2 rounded-lg border border-[#d4af37] hover:border-[#d4af37]/60 transition-colors flex flex-col justify-center w-[200px] h-[70px]"
                        >
                          {renderPlayerCardContent(player, position)}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Row 5: CAM */}
                <div className="flex justify-center w-full min-h-[70px]">
                  <div className="flex justify-center space-x-2">
                    {analysis.bestXI
                      .filter(({ position }) => position === 'CAM')
                      .map(({ player, position }) => (
                        <div
                          key={player.id}
                          className="bg-[#644d36]/20 p-2 rounded-lg border border-[#d4af37] hover:border-[#d4af37]/60 transition-colors flex flex-col justify-center w-[200px] h-[70px]"
                        >
                          {renderPlayerCardContent(player, position)}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Row 4: RM, CM, LM */}
                <div className="flex justify-between items-center w-full min-h-[70px]">
                  {/* Left midfield */}
                  <div className="flex space-x-2">
                    {analysis.bestXI
                      .filter(({ position }) => position === 'LM')
                      .map(({ player, position }) => (
                        <div
                          key={player.id}
                          className="bg-[#644d36]/20 p-2 rounded-lg border border-[#d4af37] hover:border-[#d4af37]/60 transition-colors flex flex-col justify-center w-[200px] h-[70px]"
                        >
                          {renderPlayerCardContent(player, position)}
                        </div>
                      ))}
                  </div>

                  {/* Center midfield */}
                  <div className="flex justify-center space-x-2">
                    {analysis.bestXI
                      .filter(({ position }) => position === 'CM')
                      .map(({ player, position }) => (
                        <div
                          key={player.id}
                          className="bg-[#644d36]/20 p-2 rounded-lg border border-[#d4af37] hover:border-[#d4af37]/60 transition-colors flex flex-col justify-center w-[200px] h-[70px]"
                        >
                          {renderPlayerCardContent(player, position)}
                        </div>
                      ))}
                  </div>

                  {/* Right midfield */}
                  <div className="flex space-x-2">
                    {analysis.bestXI
                      .filter(({ position }) => position === 'RM')
                      .map(({ player, position }) => (
                        <div
                          key={player.id}
                          className="bg-[#644d36]/20 p-2 rounded-lg border border-[#d4af37] hover:border-[#d4af37]/60 transition-colors flex flex-col justify-center w-[200px] h-[70px]"
                        >
                          {renderPlayerCardContent(player, position)}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Row 3: CDM */}
                <div className="flex justify-center w-full min-h-[70px]">
                  <div className="flex justify-center space-x-2">
                    {analysis.bestXI
                      .filter(({ position }) => position === 'CDM')
                      .map(({ player, position }) => (
                        <div
                          key={player.id}
                          className="bg-[#644d36]/20 p-2 rounded-lg border border-[#d4af37] hover:border-[#d4af37]/60 transition-colors flex flex-col justify-center w-[200px] h-[70px]"
                        >
                          {renderPlayerCardContent(player, position)}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Row 2: RWB, RB, CB, LB, LWB */}
                <div className="flex justify-between items-center w-full min-h-[70px]">
                  {/* Left back positions */}
                  <div className="flex space-x-2">
                    {analysis.bestXI
                      .filter(({ position }) => ['LB', 'LWB'].includes(position))
                      .sort((a, b) => {
                        const order = { 'LB': 0, 'LWB': 1 };
                        return order[a.position as keyof typeof order] - order[b.position as keyof typeof order];
                      })
                      .map(({ player, position }) => (
                        <div
                          key={player.id}
                          className="bg-[#644d36]/20 p-2 rounded-lg border border-[#d4af37] hover:border-[#d4af37]/60 transition-colors flex flex-col justify-center w-[200px] h-[70px]"
                        >
                          {renderPlayerCardContent(player, position)}
                        </div>
                      ))}
                  </div>

                  {/* Center back positions */}
                  <div className="flex justify-center space-x-2">
                    {analysis.bestXI
                      .filter(({ position }) => position === 'CB')
                      .map(({ player, position }) => (
                        <div
                          key={player.id}
                          className="bg-[#644d36]/20 p-2 rounded-lg border border-[#d4af37] hover:border-[#d4af37]/60 transition-colors flex flex-col justify-center w-[200px] h-[70px]"
                        >
                          {renderPlayerCardContent(player, position)}
                        </div>
                      ))}
                  </div>

                  {/* Right back positions */}
                  <div className="flex space-x-2">
                    {analysis.bestXI
                      .filter(({ position }) => ['RB', 'RWB'].includes(position))
                      .sort((a, b) => {
                        const order = { 'RB': 0, 'RWB': 1 };
                        return order[a.position as keyof typeof order] - order[b.position as keyof typeof order];
                      })
                      .map(({ player, position }) => (
                        <div
                          key={player.id}
                          className="bg-[#644d36]/20 p-2 rounded-lg border border-[#d4af37] hover:border-[#d4af37]/60 transition-colors flex flex-col justify-center w-[200px] h-[70px]"
                        >
                          {renderPlayerCardContent(player, position)}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Row 1: GK */}
                <div className="flex justify-center w-full min-h-[70px]">
                  <div className="flex justify-center space-x-2">
                    {analysis.bestXI
                      .filter(({ position }) => position === 'GK')
                      .map(({ player, position }) => (
                        <div
                          key={player.id}
                          className="bg-[#644d36]/20 p-2 rounded-lg border border-[#d4af37] hover:border-[#d4af37]/60 transition-colors flex flex-col justify-center w-[200px] h-[70px]"
                        >
                          {renderPlayerCardContent(player, position)}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bench */}
            <div className="bg-[#dde1e0]/10 backdrop-blur-sm rounded-lg shadow p-6 border border-[#a78968]/30">
              <h2 className="text-2xl font-bold text-[#dde1e0] font-mono tracking-wider mb-6">Bench</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysis.bench.map(({ player, position }) => (
                  <div key={player.id} className="bg-[#644d36]/10 p-4 rounded-lg border border-[#d4af37] hover:border-[#d4af37]/60 transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-[#dde1e0] font-mono">{player.name}</h3>
                        <p className="text-sm text-[#a78968] font-mono">{position}</p>
                      </div>
                      <div className="text-right">
                        {bestXIToggle && player.mainPosition !== 'GK' ? (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <p className="text-xs text-[#a78968] font-mono">Goals</p>
                              <p className="text-sm font-bold text-[#dde1e0] font-mono">{player.stats?.goals || 0}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-[#a78968] font-mono">Assists</p>
                              <p className="text-sm font-bold text-[#dde1e0] font-mono">{player.stats?.assists || 0}</p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-lg font-bold text-[#a78968] font-mono">{player.overall}</p>
                            <p className="text-sm text-[#644d36] font-mono">{player.role}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Player Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Young Stars */}
              <div className="bg-[#dde1e0]/10 backdrop-blur-sm rounded-lg shadow p-6 border border-[#a78968]/30">
                <h2 className="text-xl font-bold text-[#dde1e0] font-mono tracking-wider mb-4">Young Stars</h2>
                <div className="space-y-2">
                  {analysis.youngStars.map(player => (
                    <div key={player.id} className="bg-[#644d36]/10 p-3 rounded-lg border border-[#d4af37] hover:border-[#d4af37]/60 transition-colors">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-[#dde1e0] font-mono">{player.name}</h3>
                          <p className="text-sm text-[#a78968] font-mono">{player.mainPosition}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#a78968] font-mono">{player.overall}</p>
                          <p className="text-sm text-[#644d36] font-mono">Age: {player.age}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Veterans */}
              <div className="bg-[#dde1e0]/10 backdrop-blur-sm rounded-lg shadow p-6 border border-[#a78968]/30">
                <h2 className="text-xl font-bold text-[#dde1e0] font-mono tracking-wider mb-4">Veterans</h2>
                <div className="space-y-2">
                  {analysis.veterans.map(player => (
                    <div key={player.id} className="bg-[#644d36]/10 p-3 rounded-lg border border-[#d4af37] hover:border-[#d4af37]/60 transition-colors">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-[#dde1e0] font-mono">{player.name}</h3>
                          <p className="text-sm text-[#a78968] font-mono">{player.mainPosition}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#a78968] font-mono">{player.overall}</p>
                          <p className="text-sm text-[#644d36] font-mono">Age: {player.age}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aging Players */}
              <div className="bg-[#dde1e0]/10 backdrop-blur-sm rounded-lg shadow p-6 border border-[#a78968]/30">
                <h2 className="text-xl font-bold text-[#dde1e0] font-mono tracking-wider mb-4">Aging Players</h2>
                <div className="space-y-2">
                  {analysis.aging.map(player => (
                    <div key={player.id} className="bg-[#644d36]/10 p-3 rounded-lg border border-[#d4af37] hover:border-[#d4af37]/60 transition-colors">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-[#dde1e0] font-mono">{player.name}</h3>
                          <p className="text-sm text-[#a78968] font-mono">{player.mainPosition}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#a78968] font-mono">{player.overall}</p>
                          <p className="text-sm text-[#644d36] font-mono">Age: {player.age}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Team Strengths */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Sector Strengths */}
              <div className="bg-[#dde1e0]/10 backdrop-blur-sm rounded-lg shadow p-6 border border-[#a78968]/30">
                <h2 className="text-xl font-bold text-[#dde1e0] font-mono tracking-wider mb-4">Sector Strengths</h2>
                <div className="space-y-4">
                  {Object.entries(analysis.sectorStrengths).map(([sector, data]) => (
                    <div key={sector} className="bg-[#644d36]/10 p-4 rounded-lg border border-[#d4af37] hover:border-[#d4af37]/60 transition-colors">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-[#dde1e0] font-mono">{sector}</h3>
                        <p className="text-sm text-[#a78968] font-mono">Players: {data.count}</p>
                      </div>
                      {data.message && (
                        <p className="mt-2 text-sm text-[#a78968] font-mono">{data.message}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Position Strengths */}
              <div className="bg-[#dde1e0]/10 backdrop-blur-sm rounded-lg shadow p-6 border border-[#a78968]/30">
                <h2 className="text-xl font-bold text-[#dde1e0] font-mono tracking-wider mb-4">Position Strengths</h2>
                <div className="space-y-4">
                  {Object.entries(analysis.positionStrengths).map(([position, data]) => (
                    <div key={position} className="bg-[#644d36]/10 p-4 rounded-lg border border-[#d4af37] hover:border-[#d4af37]/60 transition-colors">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-[#dde1e0] font-mono">{position}</h3>
                        <p className="text-sm text-[#a78968] font-mono">Players: {data.count}</p>
                      </div>
                      {data.message && (
                        <p className="mt-2 text-sm text-[#a78968] font-mono">{data.message}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 