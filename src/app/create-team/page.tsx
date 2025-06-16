'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useLocalStorage from '@/hooks/useLocalStorage';
import Image from 'next/image';
import { extractColorsFromImage } from '@/utils/colorUtils';

interface Team {
  id: string;
  name: string;
  logo?: string;
  theme?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export default function CreateTeamPage() {
  const router = useRouter();
  const [teams, setTeams] = useLocalStorage<Team[]>('fifaTeams', []);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', logo: '' });
  const [selectedTeam, setSelectedTeam] = useLocalStorage<Team | null>('selectedTeam', null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [teamSuggestions, setTeamSuggestions] = useState<string[]>([]);
  const [allTeamNames, setAllTeamNames] = useState<string[]>([]);

  useEffect(() => {
    // Load team names from JSON
    fetch('/data/teams.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load teams data');
        }
        return response.json();
      })
      .then(data => {
        const names = data.map((team: any) => team['Team Name']);
        setAllTeamNames(names);
      })
      .catch(error => {
        console.error('Error loading teams:', error);
      });
  }, []);

  const handleAddTeam = () => {
    if (newTeam.name) {
      const team: Team = {
        id: Date.now().toString(),
        ...newTeam,
      };
      setTeams([...teams, team]);
      setSelectedTeam(team);
      setNewTeam({ name: '', logo: '' });
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const logoUrl = reader.result as string;
        try {
          // Extract colors from the logo
          const colors = await extractColorsFromImage(logoUrl);
          setNewTeam(prev => ({ 
            ...prev, 
            logo: logoUrl,
            theme: {
              primary: colors.primary,
              secondary: colors.secondary,
              accent: colors.accent
            }
          }));
        } catch (error) {
          console.error('Error extracting colors:', error);
          setNewTeam(prev => ({ ...prev, logo: logoUrl }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTeamNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewTeam(prev => ({ ...prev, name: value }));
    
    if (value) {
      const suggestions = allTeamNames.filter(name => 
        name.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5); // Limit to 5 suggestions
      setTeamSuggestions(suggestions);
    } else {
      setTeamSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setNewTeam(prev => ({ ...prev, name: suggestion }));
    setTeamSuggestions([]);
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
              className="bg-white p-6 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow relative group overflow-hidden h-64 flex items-center justify-center"
              onClick={() => {
                setSelectedTeam(team);
                router.push('/manager');
              }}
            >
              {team.logo && (
                <div 
                  className="absolute inset-0 bg-cover bg-center filter blur-md opacity-60"
                  style={{ backgroundImage: `url(${team.logo})` }}
                />
              )}
              <button
                onClick={(e) => handleDeleteTeam(e, team.id)}
                className="absolute top-2 right-2 text-red-600 opacity-0 group-hover:opacity-100 hover:text-red-800 active:scale-95 transition-all z-10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <h2 className="text-xl font-semibold text-black text-center z-10 relative">{team.name}</h2>
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
              <div className="relative">
                <label className="block text-sm font-medium text-black mb-1">Team Name</label>
                <input
                  type="text"
                  value={newTeam.name}
                  onChange={handleTeamNameChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Enter team name"
                />
                {teamSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    {teamSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full px-4 py-2 text-left text-black hover:bg-gray-100 focus:outline-none"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
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