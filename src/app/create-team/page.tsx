'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useLocalStorage from '@/hooks/useLocalStorage';
import Image from 'next/image';

interface Team {
  id: string;
  name: string;
  country: string;
  logo?: string;
}

export default function CreateTeamPage() {
  const router = useRouter();
  const [teams, setTeams] = useLocalStorage<Team[]>('fifaTeams', []);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', country: '', logo: '' });
  const [selectedTeam, setSelectedTeam] = useLocalStorage<Team | null>('selectedTeam', null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddTeam = () => {
    if (newTeam.name && newTeam.country) {
      const team: Team = {
        id: Date.now().toString(),
        ...newTeam,
      };
      setTeams([...teams, team]);
      setSelectedTeam(team);
      setNewTeam({ name: '', country: '', logo: '' });
      setShowAddTeamModal(false);
      localStorage.removeItem('fifaPlayers');
      router.push('/manager');
    }
  };

  const handleDeleteTeam = (e: React.MouseEvent, teamId: string) => {
    e.stopPropagation();
    const updatedTeams = teams.filter(team => team.id !== teamId);
    setTeams(updatedTeams);
    if (selectedTeam?.id === teamId) {
      setSelectedTeam(null);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewTeam(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.push('/')}
            className="mr-4 text-black hover:text-blue-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-4xl font-bold text-black">Create Your Team</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <div
              key={team.id}
              className="bg-white p-6 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow relative group"
              onClick={() => {
                setSelectedTeam(team);
                router.push('/manager');
              }}
            >
              <button
                onClick={(e) => handleDeleteTeam(e, team.id)}
                className="absolute top-2 right-2 text-red-600 opacity-0 group-hover:opacity-100 hover:text-red-800 active:scale-95 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              {team.logo && (
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <Image
                    src={team.logo}
                    alt={`${team.name} logo`}
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              <h2 className="text-xl font-semibold text-black text-center">{team.name}</h2>
              <p className="text-black text-center">{team.country}</p>
            </div>
          ))}

          <button
            onClick={() => setShowAddTeamModal(true)}
            className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 h-64 transform hover:scale-105 active:scale-95"
          >
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <span className="text-3xl text-blue-600">+</span>
            </div>
            <span className="text-black text-lg">Add Team</span>
          </button>
        </div>
      </div>

      {showAddTeamModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 transform transition-all duration-300 scale-100 animate-fade-in">
            <h2 className="text-2xl font-bold text-black mb-6">Create New Team</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">Team Name</label>
                <input
                  type="text"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Enter team name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Country</label>
                <input
                  type="text"
                  value={newTeam.country}
                  onChange={(e) => setNewTeam(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Enter country"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Team Logo</label>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 bg-gray-100 text-black py-2 px-4 rounded-md hover:bg-gray-200 active:scale-95 transition-transform"
                  >
                    Upload Logo
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {newTeam.logo && (
                    <div className="relative w-12 h-12">
                      <Image
                        src={newTeam.logo}
                        alt="Team logo preview"
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleAddTeam}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 active:scale-95 transition-transform"
                >
                  Create Team
                </button>
                <button
                  onClick={() => setShowAddTeamModal(false)}
                  className="flex-1 bg-gray-200 text-black py-2 px-4 rounded-md hover:bg-gray-300 active:scale-95 transition-transform"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
} 