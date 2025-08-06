'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useOptimizedNavigation } from '@/hooks/useOptimizedNavigation';
import PlayerForm from '@/components/PlayerForm';
import PlayerList from '@/components/PlayerList';
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
  const { navigateTo, preloadRoute } = useOptimizedNavigation({ transitionDuration: 100 });
  const [selectedTeam] = useLocalStorage<Team | null>('selectedTeam', null);
  const [players, setPlayers] = useLocalStorage<Player[]>('fifaPlayers', []);
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [formation] = useLocalStorage<string>('formation', '4-4-2');
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

  const handleInlineUpdatePlayer = (updatedPlayer: Player) => {
    setPlayers(players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
  };

  const handleDeletePlayer = (playerId: string) => {
    setPlayers(players.filter(p => p.id !== playerId));
  };

  const handleDeleteAllPlayers = () => {
    if (players.length === 0) return;
    setShowDeleteAllModal(true);
  };

  const confirmDeleteAll = () => {
    setPlayers([]);
    
    // Clear position priorities (desired attributes per position)
    const initialPriorities = [
      'RB', 'RWB', 'CB', 'LB', 'LWB', 'CM', 'RM', 'LM', 'CDM', 'CAM', 'RF', 'RW', 'LF', 'LW', 'ST', 'CF'
    ].map((pos) => ({
      position: pos,
      priorities: [],
    }));
    localStorage.setItem('positionPriorities', JSON.stringify(initialPriorities));
    
    // Clear toggled positions (inversion toggles)
    localStorage.setItem('toggledPositions', JSON.stringify([]));
    
    setShowDeleteAllModal(false);
  };

  const cancelDeleteAll = () => {
    setShowDeleteAllModal(false);
  };

  const analyzeTeam = () => {
    // Check if user has exactly 10 players selected
    if (!hasValidTactics()) {
      alert(getTacticsValidationMessage());
      return;
    }
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

    navigateTo('/best-xi');
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

  // Check if user has exactly 10 players selected for tactics
  const hasValidTactics = () => {
    if (typeof window === 'undefined') return false;
    if (players.length === 0) return false;
    const storedPositionCounts = localStorage.getItem("positionCounts");
    if (!storedPositionCounts) return false;
    try {
      const positionCounts = JSON.parse(storedPositionCounts);
      const totalCount = positionCounts.reduce((sum: number, pc: { count: number }) => sum + pc.count, 0);
      return totalCount === 10;
    } catch (error) {
      return false;
    }
  };

  // Get the reason why tactics are invalid
  const getTacticsValidationMessage = () => {
    if (players.length === 0) return 'Add players to your squad first';
    const storedPositionCounts = localStorage.getItem("positionCounts");
    if (!storedPositionCounts) return 'No selected formation';
    try {
      const positionCounts = JSON.parse(storedPositionCounts);
      const totalCount = positionCounts.reduce((sum: number, pc: { count: number }) => sum + pc.count, 0);
      if (totalCount !== 10) return 'No selected formation';
      return '';
    } catch (error) {
      return 'No selected formation';
    }
  };

  const stats = calculateTeamStats();

  if (!selectedTeam || isLoading) {
    return (
      <main className="min-h-screen bg-[#3c5c34] relative overflow-hidden">
        {/* Background soccer player image */}
        <div className="absolute inset-0">
          <img
            src="/soccer_player1.png"
            alt="Soccer Player Background"
            className="w-full h-full object-cover opacity-20 blur-sm"
          />
        </div>

        {/* Simplified soccer field pattern overlay */}
        <div className="absolute inset-0">
          {/* Grass texture */}
          <div className="absolute inset-0 bg-[#3c5c34] opacity-90"></div>
          
          {/* Simplified field elements */}
          <div className="absolute inset-0">
            {/* Center line only */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-full bg-[#dde1e0]/20"></div>
            
            {/* Simple overlay for texture */}
            <div className="absolute inset-0 bg-[#dde1e0]/5"></div>
          </div>
        </div>

        <div className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center mb-8">
              <h1 className="text-4xl font-bold text-[#dde1e0] font-mono tracking-wider">Manager Dashboard</h1>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#3c5c34] relative overflow-hidden">
      {/* Background soccer player image */}
      <div className="absolute inset-0">
        <img
          src="/soccer_player1.png"
          alt="Soccer Player Background"
          className="w-full h-full object-cover opacity-20 blur-sm"
        />
      </div>

      {/* Simplified soccer field pattern overlay */}
      <div className="absolute inset-0">
        {/* Grass texture */}
        <div className="absolute inset-0 bg-[#3c5c34] opacity-90"></div>
        
        {/* Simplified field elements */}
        <div className="absolute inset-0">
          {/* Center line only */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-full bg-[#dde1e0]/20"></div>
          
          {/* Simple overlay for texture */}
          <div className="absolute inset-0 bg-[#dde1e0]/5"></div>
        </div>
      </div>

      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header with back button and team info */}
          <div className="flex items-center mb-8">
            <button
              onClick={() => navigateTo('/create-team')}
              className="relative group p-2 rounded-full bg-[#dde1e0]/10 hover:bg-[#dde1e0]/20 transition-all duration-300 hover:scale-110 active:scale-95 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/50 mr-4"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6 text-[#dde1e0]/80 group-hover:text-[#dde1e0] transition-all duration-300 group-hover:rotate-12 group-active:-rotate-6" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-full bg-[#dde1e0]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
            </button>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-[#dde1e0] font-mono tracking-wider mb-2">Manager Dashboard</h1>
              <h2 className="text-2xl font-bold text-[#a8b8a7] font-mono">{selectedTeam?.name || 'No Team Selected'}</h2>
            </div>
            <button
              onClick={() => navigateTo('/create-team')}
              className="relative group px-6 py-3 text-[#3c5c34] overflow-hidden font-mono shadow-md transition-transform duration-150 hover:scale-105 active:scale-95 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/60"
            >
              {/* Button background */}
              <div className="absolute inset-0 bg-[#dde1e0] group-hover:bg-[#c8d0cf] transition-colors"></div>
              
              {/* Button border */}
              <div className="absolute inset-0 border-2 border-[#3c5c34]"></div>
              
              {/* Button text */}
              <span className="relative z-10 tracking-wider font-semibold">
                Change Team
              </span>

              {/* Hover effect */}
              <div className="absolute inset-0 bg-[#3c5c34]/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Squad Management - Left */}
            <div className="lg:col-span-9 bg-[#dde1e0]/10 backdrop-blur-sm rounded-lg shadow-lg p-6 order-1 border border-[#dde1e0]/20">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#dde1e0] font-mono tracking-wider">Squad Management</h2>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowPlayerForm(true)}
                    className="relative group px-6 py-3 text-[#3c5c34] overflow-hidden font-mono shadow-md transition-transform duration-150 hover:scale-105 active:scale-95 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/60"
                  >
                    {/* Button background */}
                    <div className="absolute inset-0 bg-[#dde1e0] group-hover:bg-[#c8d0cf] transition-colors"></div>
                    {/* Button border */}
                    <div className="absolute inset-0 border-2 border-[#3c5c34]"></div>
                    {/* Button text */}
                    <span className="relative z-10 tracking-wider font-semibold">
                      Add Player
                    </span>
                    {/* Hover effect */}
                    <div className="absolute inset-0 bg-[#3c5c34]/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                  </button>
                  <button
                    onClick={handleDeleteAllPlayers}
                    disabled={players.length === 0}
                    className={`relative group px-6 py-3 text-[#dde1e0] overflow-hidden font-mono ${players.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {/* Button background */}
                    <div className={`absolute inset-0 transition-colors ${players.length === 0 ? 'bg-[#644d36]/50' : 'bg-[#644d36] group-hover:bg-[#8f7a5a]'}`}></div>
                    {/* Button border */}
                    <div className="absolute inset-0 border-2 border-[#dde1e0]"></div>
                    {/* Button text */}
                    <span className="relative z-10 tracking-wider font-semibold">
                      Delete All
                    </span>
                    {/* Hover effect */}
                    {players.length > 0 && (
                      <div className="absolute inset-0 bg-[#dde1e0]/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                    )}
                  </button>
                </div>
              </div>
              <PlayerList
                players={players}
                onDeletePlayer={handleDeletePlayer}
                onUpdatePlayer={handleInlineUpdatePlayer}
              />
            </div>

            {/* Team Stats Sidebar - Right */}
            <div className="lg:col-span-3 bg-[#dde1e0]/10 backdrop-blur-sm rounded-lg shadow-lg p-6 order-2 border border-[#dde1e0]/20">
              <h2 className="text-2xl font-bold text-[#dde1e0] font-mono tracking-wider mb-6">Team Stats</h2>
              <div className="space-y-6">
                <div className="bg-[#dde1e0]/5 p-4 rounded-lg border border-[#dde1e0]/20">
                  <h3 className="text-sm font-medium text-[#a8b8a7] mb-2 font-mono">Overall Rating</h3>
                  <div className="text-3xl font-bold text-[#a8b8a7] font-mono">{stats.avgOverall}</div>
                </div>
                <div className="bg-[#dde1e0]/5 p-4 rounded-lg border border-[#dde1e0]/20">
                  <h3 className="text-sm font-medium text-[#644d36] mb-2 font-mono">Average Age</h3>
                  <div className="text-3xl font-bold text-[#644d36] font-mono">{stats.avgAge}</div>
                </div>
                <div className="bg-[#dde1e0]/5 p-4 rounded-lg border border-[#dde1e0]/20">
                  <h3 className="text-sm font-medium text-[#a78968] mb-2 font-mono">Squad Size</h3>
                  <div className="text-3xl font-bold text-[#a78968] font-mono">{players.length}</div>
                </div>
                <button
                  onClick={() => navigateTo('/edit-tactics')}
                  className="w-full relative group px-4 py-3 text-[#dde1e0] overflow-hidden font-mono shadow-md transition-transform duration-150 hover:scale-105 active:scale-95 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37]/60"
                >
                  {/* Button background */}
                  <div className="absolute inset-0 bg-[#d4af37] group-hover:bg-[#b8941f] transition-colors"></div>
                  {/* Button border */}
                  <div className="absolute inset-0 border border-[#b8941f]/60"></div>
                  {/* Button text */}
                  <span className="relative z-10 tracking-wider">
                    Edit Tactics
                  </span>
                </button>
                <button
                  onClick={() => navigateTo('/player-stats')}
                  className="w-full relative group px-4 py-3 text-[#dde1e0] overflow-hidden font-mono shadow-md transition-transform duration-150 hover:scale-105 active:scale-95 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#8b4513]/60"
                >
                  {/* Button background */}
                  <div className="absolute inset-0 bg-[#8b4513] group-hover:bg-[#a0522d] transition-colors"></div>
                  {/* Button border */}
                  <div className="absolute inset-0 border border-[#a0522d]/60"></div>
                  {/* Button text */}
                  <span className="relative z-10 tracking-wider">
                    Player Stats
                  </span>
                </button>
                <button
                  onClick={analyzeTeam}
                  disabled={!hasValidTactics()}
                  className={`w-full relative group px-4 py-3 text-[#dde1e0] overflow-hidden font-mono ${
                    !hasValidTactics() ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  title={getTacticsValidationMessage()}
                >
                  {/* Button background */}
                  <div className={`absolute inset-0 transition-colors ${
                    hasValidTactics() ? 'bg-[#a78968] group-hover:bg-[#8f7a5a]' : 'bg-[#644d36]/50'
                  }`}></div>
                  
                  {/* Button border */}
                  <div className="absolute inset-0 border-2 border-[#dde1e0]"></div>
                  
                  {/* Button text */}
                  <span className="relative z-10 tracking-wider">
                    {hasValidTactics() ? 'Analyze Team' : getTacticsValidationMessage()}
                  </span>

                  {/* Hover effect */}
                  {hasValidTactics() && (
                    <div className="absolute inset-0 bg-[#dde1e0]/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                  )}
                </button>
              </div>
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

      {/* Custom Delete All Confirmation Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#3c5c34] border-2 border-[#a78968] rounded-lg shadow-2xl max-w-md w-full p-6 relative">
            {/* Modal Header */}
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-[#a78968] rounded-full flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#3c5c34]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#dde1e0] font-mono tracking-wider">Delete All Players</h3>
            </div>

            {/* Modal Content */}
            <div className="mb-6">
              <p className="text-[#dde1e0]/90 font-mono leading-relaxed">
                Are you sure you want to delete all players from your squad? This action cannot be undone and will remove all player data.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex space-x-3">
              <button
                onClick={cancelDeleteAll}
                className="flex-1 relative group px-4 py-3 text-[#3c5c34] overflow-hidden font-mono shadow-md transition-transform duration-150 hover:scale-105 active:scale-95 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/60"
              >
                {/* Button background */}
                <div className="absolute inset-0 bg-[#dde1e0] group-hover:bg-[#c8d0cf] transition-colors"></div>
                
                {/* Button border */}
                <div className="absolute inset-0 border-2 border-[#3c5c34]"></div>
                
                {/* Button text */}
                <span className="relative z-10 tracking-wider font-semibold">
                  Cancel
                </span>

                {/* Hover effect */}
                <div className="absolute inset-0 bg-[#3c5c34]/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              </button>

              <button
                onClick={confirmDeleteAll}
                className="flex-1 relative group px-4 py-3 text-[#dde1e0] overflow-hidden font-mono shadow-md transition-transform duration-150 hover:scale-105 active:scale-95 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/60"
              >
                {/* Button background */}
                <div className="absolute inset-0 bg-[#a78968] group-hover:bg-[#8f7a5a] transition-colors"></div>
                
                {/* Button border */}
                <div className="absolute inset-0 border-2 border-[#dde1e0]"></div>
                
                {/* Button text */}
                <span className="relative z-10 tracking-wider font-semibold">
                  Delete All
                </span>

                {/* Hover effect */}
                <div className="absolute inset-0 bg-[#dde1e0]/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
} 