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
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isClient) {
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
    }
  }, [isClient]);

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

  const handleBack = () => {
    router.push('/');
  };

  if (!isClient || isLoading) {
    return (
      <main className="min-h-screen bg-[#3c5c34] relative overflow-hidden">
        {/* Simplified soccer field pattern */}
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
              <h1 className="text-4xl font-bold text-[#dde1e0] font-mono tracking-wider">Create Your Team</h1>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#3c5c34] relative overflow-hidden">
      {/* Simplified soccer field pattern */}
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
          <div className="flex items-center mb-8">
            <button
              onClick={handleBack}
              className="mr-4 text-[#dde1e0]/80 hover:text-[#dde1e0] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-4xl font-bold text-[#dde1e0] font-mono tracking-wider">Create Your Team</h1>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <div
                key={team.id}
                className="bg-[#dde1e0]/10 backdrop-blur-sm p-6 rounded-lg shadow-lg cursor-pointer hover:bg-[#dde1e0]/20 transition-all duration-300 relative group overflow-hidden h-64 flex items-center justify-center border border-[#dde1e0]/20"
                onClick={() => {
                  setSelectedTeam(team);
                  router.push('/manager');
                }}
              >
                {team.logo && (
                  <div 
                    className="absolute inset-0 bg-cover bg-center filter blur-md opacity-40"
                    style={{ backgroundImage: `url(${team.logo})` }}
                  />
                )}
                <button
                  onClick={(e) => handleDeleteTeam(e, team.id)}
                  className="absolute top-2 right-2 text-[#dde1e0]/60 opacity-0 group-hover:opacity-100 hover:text-[#dde1e0] active:scale-95 transition-all z-10"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <h2 className="text-xl font-semibold text-[#dde1e0] text-center z-10 relative font-mono">{team.name}</h2>
              </div>
            ))}

            <button
              onClick={() => setShowAddTeamModal(true)}
              className="bg-[#dde1e0]/10 backdrop-blur-sm p-8 rounded-lg shadow-lg hover:bg-[#dde1e0]/20 transition-all duration-300 flex flex-col items-center justify-center border-2 border-dashed border-[#dde1e0]/20 h-64 transform hover:scale-105 active:scale-95"
            >
              <div className="w-16 h-16 rounded-full bg-[#a8b8a7]/20 flex items-center justify-center mb-4">
                <span className="text-3xl text-[#a8b8a7]">+</span>
              </div>
              <span className="text-[#dde1e0] text-lg font-mono">Add Team</span>
            </button>
          </div>
        </div>
      </div>

      {showAddTeamModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#dde1e0]/10 backdrop-blur-sm rounded-lg max-w-md w-full p-6 transform transition-all duration-300 scale-100 animate-fade-in border border-[#dde1e0]/20">
            <h2 className="text-2xl font-bold text-[#dde1e0] mb-6 font-mono">Create New Team</h2>
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-[#a8b8a7] mb-1 font-mono">Team Name</label>
                <input
                  type="text"
                  value={newTeam.name}
                  onChange={handleTeamNameChange}
                  className="w-full px-3 py-2 bg-[#dde1e0]/5 border border-[#a8b8a7]/30 rounded-md focus:outline-none focus:ring-2 focus:ring-[#a8b8a7] text-[#dde1e0] placeholder-[#dde1e0]/50"
                  placeholder="Enter team name"
                />
                {teamSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-[#3c5c34] border border-[#a8b8a7]/30 rounded-md shadow-lg">
                    {teamSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full px-4 py-2 text-left text-[#dde1e0] hover:bg-[#a8b8a7]/20 focus:outline-none font-mono"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a8b8a7] mb-1 font-mono">Team Logo</label>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 bg-[#644d36]/20 text-[#644d36] py-2 px-4 rounded-md hover:bg-[#644d36]/30 active:scale-95 transition-all border border-[#644d36]/30"
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
                  className="flex-1 bg-[#a8b8a7]/20 text-[#a8b8a7] py-2 px-4 rounded-md hover:bg-[#a8b8a7]/30 active:scale-95 transition-all border border-[#a8b8a7]/30"
                >
                  Create Team
                </button>
                <button
                  onClick={() => setShowAddTeamModal(false)}
                  className="flex-1 bg-[#a78968]/20 text-[#a78968] py-2 px-4 rounded-md hover:bg-[#a78968]/30 active:scale-95 transition-all border border-[#a78968]/30"
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