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

const POSITIONS = [
  'GK', 'LB', 'CB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST'
];

const ATTRIBUTES = ['Pace', 'Shooting', 'Passing', 'Dribbling', 'Defending', 'Physical'];

const ROLE_WEIGHTS = {
  'C': 1.0,  // Crucial
  'I': 0.8,  // Important
  'R': 0.6,  // Rotation
  'S': 0.4,  // Squad
  'P': 0.2   // Prospect
};

const SECTORS = {
  'Defense': ['LB', 'CB', 'RB'],
  'Midfield': ['CDM', 'CM', 'CAM', 'LM', 'RM'],
  'Forward': ['LW', 'RW', 'ST'],
  'Goalkeeper': ['GK']
};

const BENCH_REQUIREMENTS = {
  'GK': 1,
  'Fullback': ['LB', 'RB'],
  'CB': 1,
  'Mid': ['CDM', 'CM', 'CAM', 'LM', 'RM'],
  'Winger': ['LW', 'RW'],
  'Striker': ['ST']
};

export default function BestXIPage() {
  const router = useRouter();
  const [selectedTeam] = useLocalStorage<Team | null>('selectedTeam', null);
  const [players] = useLocalStorage<Player[]>('fifaPlayers', []);
  const [positionCounts] = useLocalStorage<PositionCount[]>('positionCounts', []);
  const [positionPriorities] = useLocalStorage<PositionPriority[]>('positionPriorities', []);
  const [analysis, setAnalysis] = useState<TeamAnalysis | null>(null);

  useEffect(() => {
    if (!selectedTeam) {
      router.push('/create-team');
    } else {
      analyzeTeam();
    }
  }, [selectedTeam, router, players, positionCounts, positionPriorities]);

  const calculatePlayerRating = (player: Player, position: string): number => {
    const positionPriority = positionPriorities.find(pp => pp.position === position);
    let rating = 0;

    // Base rating from overall
    rating += player.overall * 0.3;

    // Attribute rating based on position priorities
    if (positionPriority && positionPriority.priorities.length > 0) {
      const priorities = positionPriority.priorities;
      const attributeWeights = priorities.reduce((acc, attr, index) => {
        acc[attr.toLowerCase()] = 1 - (index * 0.2); // 1.0, 0.8, 0.6 for top 3
        return acc;
      }, {} as { [key: string]: number });

      // Calculate weighted attribute score
      const attributeScore = Object.entries(player.attributes).reduce((sum, [attr, value]) => {
        const weight = attributeWeights[attr] || 0.2; // Default weight for non-prioritized attributes
        return sum + (value * weight);
      }, 0) / Object.keys(player.attributes).length;

      rating += attributeScore * 0.4;
    } else {
      // If no priorities set, use average of all attributes
      const avgAttribute = Object.values(player.attributes).reduce((sum, val) => sum + val, 0) / 
        Object.keys(player.attributes).length;
      rating += avgAttribute * 0.4;
    }

    // Age rating
    const ageDiff = Math.abs(player.age - 25);
    const ageRating = Math.max(0, 1 - (ageDiff * 0.05));
    rating += ageRating * 0.15;

    // Role rating
    const roleWeight = ROLE_WEIGHTS[player.role] || 0.2;
    rating += roleWeight * 0.15;

    return rating;
  };

  const calculateGKRating = (player: Player): number => {
    let rating = 0;

    // Base rating from overall
    rating += player.overall * 0.5;

    // Age rating
    const ageDiff = Math.abs(player.age - 25);
    const ageRating = Math.max(0, 1 - (ageDiff * 0.05));
    rating += ageRating * 0.25;

    // Role rating
    const roleWeight = ROLE_WEIGHTS[player.role] || 0.2;
    rating += roleWeight * 0.25;

    return rating;
  };

  const analyzeTeam = () => {
    // Calculate average age and overall
    const avgAge = players.reduce((sum, p) => sum + p.age, 0) / players.length;
    const avgOverall = players.reduce((sum, p) => sum + p.overall, 0) / players.length;

    // Calculate standard deviations
    const ageStdDev = Math.sqrt(
      players.reduce((sum, p) => sum + Math.pow(p.age - avgAge, 2), 0) / players.length
    );
    const overallStdDev = Math.sqrt(
      players.reduce((sum, p) => sum + Math.pow(p.overall - avgOverall, 2), 0) / players.length
    );

    // Rate players for each position
    const playerRatings: PlayerRating[] = [];
    POSITIONS.forEach(position => {
      players.forEach(player => {
        if (player.mainPosition === position) {
          const rating = position === 'GK' 
            ? calculateGKRating(player)
            : calculatePlayerRating(player, position);
          playerRatings.push({ player, rating, position });
        }
      });
    });

    // Sort players by rating for each position
    const bestXI: PlayerRating[] = [];
    const bench: PlayerRating[] = [];
    const usedPlayers = new Set<string>();

    // Select Best XI
    POSITIONS.forEach(position => {
      const positionPlayers = playerRatings
        .filter(pr => pr.position === position)
        .sort((a, b) => b.rating - a.rating);

      if (positionPlayers.length > 0) {
        bestXI.push(positionPlayers[0]);
        usedPlayers.add(positionPlayers[0].player.id);
      }
    });

    // Select Bench
    const benchPositions = Object.entries(BENCH_REQUIREMENTS);
    benchPositions.forEach(([category, positions]) => {
      const availablePlayers = playerRatings
        .filter(pr => !usedPlayers.has(pr.player.id))
        .filter(pr => Array.isArray(positions) ? positions.includes(pr.position) : pr.position === positions)
        .sort((a, b) => b.rating - a.rating);

      if (availablePlayers.length > 0) {
        bench.push(availablePlayers[0]);
        usedPlayers.add(availablePlayers[0].player.id);
      }
    });

    // Categorize players
    const aging = players.filter(p => 
      p.age > avgAge + (2 * ageStdDev) && 
      p.overall < avgOverall - (2 * overallStdDev)
    );

    const veterans = players.filter(p => 
      p.age > avgAge + (2 * ageStdDev) && 
      p.overall > avgOverall + overallStdDev
    );

    const youngStars = players.filter(p => 
      p.age < avgAge - (2 * ageStdDev) && 
      p.overall > avgOverall + (2 * overallStdDev)
    );

    // Analyze position strengths
    const positionStrengths: { [key: string]: any } = {};
    const sectorStrengths: { [key: string]: any } = {};

    // Analyze each sector
    Object.entries(SECTORS).forEach(([sector, positions]) => {
      const sectorPlayers = players.filter(p => positions.includes(p.mainPosition));
      const count = sectorPlayers.length;
      let message;

      if (count < 4) {
        message = `Need more ${sector.toLowerCase()} players (currently ${count})`;
      }

      sectorStrengths[sector] = { count, message };
    });

    // Analyze each position
    POSITIONS.forEach(position => {
      const positionCount = positionCounts.find(pc => pc.position === position)?.count || 0;
      if (positionCount === 0) return; // Skip positions not selected by user

      const positionPlayers = players.filter(p => p.mainPosition === position);
      const hasProspect = positionPlayers.some(p => p.role === 'P');
      const hasVeteran = positionPlayers.some(p => p.role === 'C' || p.role === 'I');
      const hasNormal = positionPlayers.some(p => p.role === 'R' || p.role === 'S');
      const hasAging = positionPlayers.some(p => aging.includes(p));
      const count = positionPlayers.length;

      let message;
      if (count === 0) {
        message = `No ${position} players`;
      } else if (!hasProspect) {
        message = `No prospect ${position} players`;
      } else if (!hasVeteran && !hasNormal) {
        message = `Only prospects at ${position}`;
      } else if (hasAging && count <= 2) {
        message = `Aging players at ${position}`;
      }

      positionStrengths[position] = {
        hasProspect,
        hasVeteran,
        hasNormal,
        hasAging,
        count,
        message
      };
    });

    setAnalysis({
      bestXI,
      bench,
      aging,
      veterans,
      youngStars,
      positionStrengths,
      sectorStrengths
    });
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
          <h1 className="text-3xl font-bold text-black">Best XI Analysis</h1>
        </div>

        {analysis && (
          <div className="space-y-8">
            {/* Best XI */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-black mb-6">Best XI</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysis.bestXI.map(({ player, position }) => (
                  <div key={player.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-black">{player.name}</h3>
                        <p className="text-sm text-gray-600">{position}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">{player.overall}</p>
                        <p className="text-sm text-gray-600">{player.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bench */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-black mb-6">Bench</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysis.bench.map(({ player, position }) => (
                  <div key={player.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-black">{player.name}</h3>
                        <p className="text-sm text-gray-600">{position}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">{player.overall}</p>
                        <p className="text-sm text-gray-600">{player.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Player Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Young Stars */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-black mb-4">Young Stars</h2>
                <div className="space-y-2">
                  {analysis.youngStars.map(player => (
                    <div key={player.id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-black">{player.name}</h3>
                          <p className="text-sm text-gray-600">{player.mainPosition}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">{player.overall}</p>
                          <p className="text-sm text-gray-600">Age: {player.age}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Veterans */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-black mb-4">Veterans</h2>
                <div className="space-y-2">
                  {analysis.veterans.map(player => (
                    <div key={player.id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-black">{player.name}</h3>
                          <p className="text-sm text-gray-600">{player.mainPosition}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">{player.overall}</p>
                          <p className="text-sm text-gray-600">Age: {player.age}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aging Players */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-black mb-4">Aging Players</h2>
                <div className="space-y-2">
                  {analysis.aging.map(player => (
                    <div key={player.id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-black">{player.name}</h3>
                          <p className="text-sm text-gray-600">{player.mainPosition}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">{player.overall}</p>
                          <p className="text-sm text-gray-600">Age: {player.age}</p>
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
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-black mb-4">Sector Strengths</h2>
                <div className="space-y-4">
                  {Object.entries(analysis.sectorStrengths).map(([sector, data]) => (
                    <div key={sector} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-black">{sector}</h3>
                        <p className="text-sm text-gray-600">Players: {data.count}</p>
                      </div>
                      {data.message && (
                        <p className="mt-2 text-sm text-red-600">{data.message}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Position Strengths */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-black mb-4">Position Strengths</h2>
                <div className="space-y-4">
                  {Object.entries(analysis.positionStrengths).map(([position, data]) => (
                    <div key={position} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-black">{position}</h3>
                        <p className="text-sm text-gray-600">Players: {data.count}</p>
                      </div>
                      {data.message && (
                        <p className="mt-2 text-sm text-red-600">{data.message}</p>
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