'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useLocalStorage from '@/hooks/useLocalStorage';
import PlayerForm from '@/components/PlayerForm';
import PlayerList from '@/components/PlayerList';
import TeamStats from '@/components/TeamStats';
import { Player, PositionCategory, POSITION_CATEGORIES } from '@/types/player';
import { useTeamTheme } from '@/contexts/TeamThemeContext';

interface Team {
  id: string;
  name: string;
  country: string;
  logo?: string;
  theme?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export default function ManagerPage() {
  const router = useRouter();
  const [teams, setTeams] = useLocalStorage<Team[]>('fifaTeams', []);
  const [selectedTeam] = useLocalStorage<Team | null>('selectedTeam', null);
  const [players, setPlayers] = useLocalStorage<Player[]>('fifaPlayers', []);
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [formation, setFormation] = useLocalStorage<string>('formation', '4-4-2');
  const [bestXI, setBestXI] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setTheme } = useTeamTheme();

  useEffect(() => {
    if (!selectedTeam) {
      router.push('/create-team');
    } else if (selectedTeam.theme) {
      setTheme(selectedTeam.theme);
    }
    setIsLoading(false);
  }, [selectedTeam, router, setTheme]);

  const calculateOverall = (attributes: Player['attributes']): number => {
    const values = Object.values(attributes);
    return Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
  };

  const handleAddPlayer = (playerData: Omit<Player, 'id'>) => {
    const overall = calculateOverall(playerData.attributes);
    const newPlayer: Player = {
      id: Date.now().toString(),
      ...playerData,
      overall,
    };
    setPlayers([...players, newPlayer]);
    setShowPlayerForm(false);
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setShowPlayerForm(true);
  };

  const handleUpdatePlayer = (playerData: Omit<Player, 'id'>) => {
    if (!editingPlayer) return;
    const updatedPlayer: Player = {
      ...playerData,
      id: editingPlayer.id
    };
    setPlayers(players.map(p => p.id === editingPlayer.id ? updatedPlayer : p));
    setShowPlayerForm(false);
    setEditingPlayer(null);
  };

  const handleDeletePlayer = (playerId: string) => {
    setPlayers(players.filter(p => p.id !== playerId));
  };

  const analyzeTeam = () => {
    const formationSlots = {
      '4-3-3': {
        GK: 1,
        DEF: 4,
        MID: 3,
        FWD: 3,
      },
      '4-4-2': {
        GK: 1,
        DEF: 4,
        MID: 4,
        FWD: 2,
      },
      '3-5-2': {
        GK: 1,
        DEF: 3,
        MID: 5,
        FWD: 2,
      },
    };

    const slots = formationSlots[formation as keyof typeof formationSlots] || formationSlots['4-3-3'];
    const selectedPlayers: Player[] = [];
    const usedPlayerIds = new Set<string>();

    const getPlayersForCategory = (category: PositionCategory) => {
      return players
        .filter(p => !usedPlayerIds.has(p.id) && POSITION_CATEGORIES[p.mainPosition] === category)
        .sort((a, b) => b.overall - a.overall);
    };

    // Select GK
    const gkPlayers = getPlayersForCategory('GK');
    if (gkPlayers.length > 0) {
      selectedPlayers.push(gkPlayers[0]);
      usedPlayerIds.add(gkPlayers[0].id);
    }

    // Select DEF
    const defPlayers = getPlayersForCategory('DEF');
    for (let i = 0; i < slots.DEF && i < defPlayers.length; i++) {
      selectedPlayers.push(defPlayers[i]);
      usedPlayerIds.add(defPlayers[i].id);
    }

    // Select MID
    const midPlayers = getPlayersForCategory('MID');
    for (let i = 0; i < slots.MID && i < midPlayers.length; i++) {
      selectedPlayers.push(midPlayers[i]);
      usedPlayerIds.add(midPlayers[i].id);
    }

    // Select FWD
    const fwdPlayers = getPlayersForCategory('FWD');
    for (let i = 0; i < slots.FWD && i < fwdPlayers.length; i++) {
      selectedPlayers.push(fwdPlayers[i]);
      usedPlayerIds.add(fwdPlayers[i].id);
    }

    setBestXI(selectedPlayers);
    router.push('/best-xi');
  };

  const calculateTeamStats = () => {
    if (players.length === 0) return { avgOverall: 0, avgAge: 0 };
    const totalOverall = players.reduce((sum, p) => sum + p.overall, 0);
    const totalAge = players.reduce((sum, p) => sum + p.age, 0);
    return {
      avgOverall: Math.round(totalOverall / players.length),
      avgAge: Math.round(totalAge / players.length),
    };
  };

  const stats = calculateTeamStats();

  if (!selectedTeam || isLoading) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-black mb-8">Manager Dashboard</h1>
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.push('/create-team')}
            className="mr-4 text-black hover:text-blue-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-black">{selectedTeam?.name || 'No Team Selected'}</h1>
            <p className="text-black">{selectedTeam?.country || ''}</p>
          </div>
          <button
            onClick={() => router.push('/create-team')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 active:scale-95 transition-transform"
          >
            Change Team
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Squad Management - Left */}
          <div className="lg:col-span-9 bg-white rounded-lg shadow p-6 order-1">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-black">Squad Management</h2>
              <button
                onClick={() => setShowPlayerForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition-transform"
              >
                Add Player
              </button>
            </div>
            <PlayerList
              players={players}
              onDeletePlayer={handleDeletePlayer}
              onUpdatePlayer={handleUpdatePlayer}
            />
          </div>

          {/* Team Stats Sidebar - Right */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow p-6 order-2">
            <h2 className="text-xl font-bold text-black mb-4">Team Stats</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Overall Rating</h3>
                <div className="text-2xl font-bold text-blue-600">{stats.avgOverall}</div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Average Age</h3>
                <div className="text-2xl font-bold text-blue-600">{stats.avgAge}</div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Squad Size</h3>
                <div className="text-2xl font-bold text-blue-600">{players.length}</div>
              </div>
              <button
                onClick={() => router.push('/edit-tactics')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 active:scale-95 transition-transform"
              >
                Edit Tactics
              </button>
              <button
                onClick={() => router.push('/player-stats')}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 active:scale-95 transition-transform"
              >
                Player Stats
              </button>
              <button
                onClick={analyzeTeam}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 active:scale-95 transition-transform"
              >
                Analyze Team
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPlayerForm && (
        <PlayerForm
          onSubmit={editingPlayer ? handleUpdatePlayer : handleAddPlayer}
          onCancel={() => {
            setShowPlayerForm(false);
            setEditingPlayer(null);
          }}
          initialData={editingPlayer || undefined}
        />
      )}
    </main>
  );
} 