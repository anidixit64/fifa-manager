'use client';

import { useState, useEffect, useRef } from 'react';
import { Player, PlayerAttributes, GoalkeeperAttributes } from '@/types/player';

interface PlayerFormProps {
  onSubmit: (player: Omit<Player, 'id'>) => void;
  onCancel: () => void;
  initialData?: Player;
}

interface Country {
  Country: string;
  FIFA: string;
}

interface PlayerSuggestion {
  long_name: string;
  short_name: string;
  nationality_name: string;
  potential: string;
  player_positions: string[];
}

const POSITIONS = [
  'GK', 'RB', 'RWB', 'CB', 'LB', 'LWB', 'CM', 'RM', 'LM', 'CDM', 'CAM', 'RF', 'RW', 'LF', 'LW', 'ST', 'CF'
];

const ROLES = [
  { value: 'C', label: 'Crucial' },
  { value: 'I', label: 'Important' },
  { value: 'R', label: 'Rotation' },
  { value: 'S', label: 'Squad' },
  { value: 'P', label: 'Prospect' }
] as const;

type PlayerRole = typeof ROLES[number]['value'];

const ATTRIBUTES: (keyof PlayerAttributes)[] = [
  'pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'
];

const GK_ATTRIBUTES: (keyof GoalkeeperAttributes)[] = [
  'diving', 'handling', 'kicking', 'reflexes', 'speed', 'positioning'
];

export default function PlayerForm({ onSubmit, onCancel, initialData }: PlayerFormProps) {
  const [formData, setFormData] = useState<Omit<Player, 'id'>>(
    initialData || {
      name: '',
      shortName: '',
      age: 18,
      nationality: '',
      fifaCode: '',
      mainPosition: 'ST',
      role: 'C',
      alternatePositions: [],
      overall: 50,
      potential: 50,
      preferred_foot: 'Right',
      stats: {
        goals: 0,
        assists: 0,
        redCards: 0,
        shots: 0,
        shotsOnTarget: 0,
      },
      attributes: {
        pace: 50,
        shooting: 50,
        passing: 50,
        dribbling: 50,
        defending: 50,
        physical: 50,
      } as PlayerAttributes,
    }
  );
  const [countrySuggestions, setCountrySuggestions] = useState<Country[]>([]);
  const [allCountries, setAllCountries] = useState<Country[]>([]);
  const [playerSuggestions, setPlayerSuggestions] = useState<PlayerSuggestion[]>([]);
  const [allPlayers, setAllPlayers] = useState<PlayerSuggestion[]>([]);
  const [overallInputValue, setOverallInputValue] = useState<string>('');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialData) {
      const { id, ...rest } = initialData;
      setFormData(rest);
      setOverallInputValue('');
    }
  }, [initialData]);

  // Scroll modal to top when it opens
  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.scrollTop = 0;
    }
  }, []);

  useEffect(() => {
    // Load countries from JSON
    fetch('/data/countries.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load countries data');
        }
        return response.json();
      })
      .then(countries => {
        setAllCountries(countries);
      })
      .catch(error => {
        console.error('Error loading countries:', error);
      });

    // Load players from JSON
    fetch('/data/players.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load players data');
        }
        return response.json();
      })
      .then(players => {
        setAllPlayers(players);
      })
      .catch(error => {
        console.error('Error loading players:', error);
      });
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, name: value }));
    
    if (value) {
      const suggestions = allPlayers.filter(player => 
        player.long_name.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5); // Limit to 5 suggestions
      setPlayerSuggestions(suggestions);
    } else {
      setPlayerSuggestions([]);
    }
  };

  const handlePlayerSuggestionClick = (player: PlayerSuggestion) => {
    const country = allCountries.find(c => c.Country === player.nationality_name);
    const firstPosition = player.player_positions && player.player_positions.length > 0 
      ? player.player_positions[0] 
      : 'ST';
    
    // Set alternate positions as all positions except the first one
    const alternatePositions = player.player_positions && player.player_positions.length > 1
      ? player.player_positions.slice(1)
      : [];
    
    setFormData(prev => {
      // Handle attribute conversion based on position
      let newAttributes;
      if (firstPosition === 'GK') {
        // Convert to goalkeeper attributes if switching to GK
        if ('pace' in prev.attributes) {
          // Converting from regular attributes to GK attributes
          const avgValue = Object.values(prev.attributes).reduce((sum, val) => sum + val, 0) / 6;
          newAttributes = {
            diving: Math.round(avgValue),
            handling: Math.round(avgValue),
            kicking: Math.round(avgValue),
            reflexes: Math.round(avgValue),
            speed: Math.round(avgValue),
            positioning: Math.round(avgValue),
          } as GoalkeeperAttributes;
        } else {
          // Already GK attributes, keep them
          newAttributes = prev.attributes;
        }
      } else {
        // Convert to regular attributes if switching from GK
        if ('diving' in prev.attributes) {
          // Converting from GK attributes to regular attributes
          const avgValue = Object.values(prev.attributes).reduce((sum, val) => sum + val, 0) / 6;
          newAttributes = {
            pace: Math.round(avgValue),
            shooting: Math.round(avgValue),
            passing: Math.round(avgValue),
            dribbling: Math.round(avgValue),
            defending: Math.round(avgValue),
            physical: Math.round(avgValue),
          } as PlayerAttributes;
        } else {
          // Already regular attributes, keep them
          newAttributes = prev.attributes;
        }
      }
      
      return {
        ...prev, 
        name: player.long_name,
        shortName: player.short_name,
        nationality: player.nationality_name,
        fifaCode: country?.FIFA || '',
        mainPosition: firstPosition,
        alternatePositions: alternatePositions,
        potential: parseInt(player.potential) || 50,
        attributes: newAttributes
      };
    });
    setPlayerSuggestions([]);
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, nationality: value }));
    
    if (value) {
      const suggestions = allCountries.filter(country => 
        country.Country.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5); // Limit to 5 suggestions
      setCountrySuggestions(suggestions);
    } else {
      setCountrySuggestions([]);
    }
  };

  const handleCountrySuggestionClick = (country: Country) => {
    setFormData(prev => ({ 
      ...prev, 
      nationality: country.Country,
      fifaCode: country.FIFA
    }));
    setCountrySuggestions([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSubmit(formData);
  };

  const handleAttributeChange = (attr: keyof PlayerAttributes | keyof GoalkeeperAttributes, value: number) => {
    if (value >= 0 && value <= 99) {
      setFormData(prev => ({
        ...prev,
        attributes: {
          ...prev.attributes,
          [attr]: value
        }
      }));
    }
  };

  const handlePositionChange = (position: string) => {
    setFormData(prev => {
      let newAttributes;
      if (position === 'GK') {
        // Convert to goalkeeper attributes if switching to GK
        if ('pace' in prev.attributes) {
          // Converting from regular attributes to GK attributes
          const avgValue = Object.values(prev.attributes).reduce((sum, val) => sum + val, 0) / 6;
          newAttributes = {
            diving: Math.round(avgValue),
            handling: Math.round(avgValue),
            kicking: Math.round(avgValue),
            reflexes: Math.round(avgValue),
            speed: Math.round(avgValue),
            positioning: Math.round(avgValue),
          } as GoalkeeperAttributes;
        } else {
          // Already GK attributes, keep them
          newAttributes = prev.attributes;
        }
      } else {
        // Convert to regular attributes if switching from GK
        if ('diving' in prev.attributes) {
          // Converting from GK attributes to regular attributes
          const avgValue = Object.values(prev.attributes).reduce((sum, val) => sum + val, 0) / 6;
          newAttributes = {
            pace: Math.round(avgValue),
            shooting: Math.round(avgValue),
            passing: Math.round(avgValue),
            dribbling: Math.round(avgValue),
            defending: Math.round(avgValue),
            physical: Math.round(avgValue),
          } as PlayerAttributes;
        } else {
          // Already regular attributes, keep them
          newAttributes = prev.attributes;
        }
      }
      
      return {
        ...prev,
        mainPosition: position,
        attributes: newAttributes
      };
    });
  };

  return (
    <div ref={modalRef} className="fixed inset-0 bg-[#3c5c34]/80 backdrop-blur-sm z-[100] overflow-y-auto">
      <div className="min-h-full flex items-start justify-center p-4 pt-8 md:pt-16">
        <div className="bg-[#dde1e0]/95 backdrop-blur-sm rounded-lg p-8 w-full max-w-2xl shadow-xl border border-[#dde1e0]/20 mb-8">
        <h2 className="text-2xl font-bold text-[#3c5c34] mb-6 font-mono">
          {initialData ? 'Edit Player' : 'Add Player'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="relative">
              <label htmlFor="name" className="block text-sm font-medium text-[#644d36] mb-2 font-mono">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={handleNameChange}
                className="w-full px-4 py-2 border border-[#a8b8a7]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a8b8a7] text-[#3c5c34] bg-[#dde1e0]/50"
                required
              />
              {playerSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-[#dde1e0]/95 border border-[#a8b8a7]/30 rounded-md shadow-lg">
                  {playerSuggestions.map((player, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handlePlayerSuggestionClick(player)}
                      className="w-full px-4 py-2 text-left text-[#3c5c34] hover:bg-[#a8b8a7]/20 focus:outline-none font-mono"
                    >
                      {player.long_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="age" className="block text-sm font-medium text-[#644d36] mb-2 font-mono">
                Age
              </label>
              <select
                id="age"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-[#a8b8a7]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a8b8a7] text-[#3c5c34] bg-[#dde1e0]/50"
                required
              >
                {Array.from({ length: 33 }, (_, i) => i + 18).map((age) => (
                  <option key={age} value={age}>
                    {age}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <label htmlFor="nationality" className="block text-sm font-medium text-[#644d36] mb-2 font-mono">
                Nationality
              </label>
              <input
                type="text"
                id="nationality"
                value={formData.nationality}
                onChange={handleCountryChange}
                className="w-full px-4 py-2 border border-[#a8b8a7]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a8b8a7] text-[#3c5c34] bg-[#dde1e0]/50"
                required
              />
              {countrySuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-[#dde1e0]/95 border border-[#a8b8a7]/30 rounded-md shadow-lg">
                  {countrySuggestions.map((country, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleCountrySuggestionClick(country)}
                      className="w-full px-4 py-2 text-left text-[#3c5c34] hover:bg-[#a8b8a7]/20 focus:outline-none font-mono"
                    >
                      {country.Country}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="position" className="block text-sm font-medium text-[#644d36] mb-2 font-mono">
                Position
              </label>
              <select
                id="position"
                value={formData.mainPosition}
                onChange={(e) => handlePositionChange(e.target.value)}
                className="w-full px-4 py-2 border border-[#a8b8a7]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a8b8a7] text-[#3c5c34] bg-[#dde1e0]/50"
                required
              >
                {POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-[#644d36] mb-2 font-mono">
                Role
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as PlayerRole })}
                className="w-full px-4 py-2 border border-[#a8b8a7]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a8b8a7] text-[#3c5c34] bg-[#dde1e0]/50"
                required
              >
                {ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="overall" className="block text-sm font-medium text-[#644d36] mb-2 font-mono">
                Overall
              </label>
              <input
                type="number"
                id="overall"
                min="0"
                max="99"
                value={overallInputValue !== '' ? overallInputValue : (formData.overall ?? 50)}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  setOverallInputValue(inputValue);
                  if (inputValue === '') {
                    // Allow empty while typing
                    setFormData({ ...formData, overall: 0 });
                  } else {
                    const parsedValue = parseInt(inputValue);
                    if (!isNaN(parsedValue)) {
                      setFormData({ ...formData, overall: parsedValue });
                    }
                  }
                }}
                className="w-full px-4 py-2 border border-[#a8b8a7]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a8b8a7] text-[#3c5c34] bg-[#dde1e0]/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="Enter overall rating"
                onFocus={() => {
                  setOverallInputValue(formData.overall?.toString() || '');
                }}
                onBlur={(e) => {
                  const inputValue = e.target.value.trim();
                  // Default to 50 if field is empty or invalid, but allow 0 if explicitly entered
                  if (inputValue === '' || isNaN(parseInt(inputValue))) {
                    setFormData({ ...formData, overall: 50 });
                    setOverallInputValue('');
                  } else {
                    const parsedValue = parseInt(inputValue);
                    // Only update if it's a valid number
                    if (!isNaN(parsedValue)) {
                      setFormData({ ...formData, overall: parsedValue });
                      setOverallInputValue('');
                    }
                  }
                }}
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-[#3c5c34] mb-4 font-mono">
              {formData.mainPosition === 'GK' ? 'Goalkeeper Attributes' : 'Attributes'}
            </h3>
            <div className="grid grid-cols-3 gap-6">
              {Object.entries(formData.attributes).map(([attr, value]) => (
                <div key={attr} className="flex flex-col space-y-2">
                  <label htmlFor={attr} className="block text-sm font-medium text-[#644d36] font-mono">
                    {attr.charAt(0).toUpperCase() + attr.slice(1)}
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleAttributeChange(attr as keyof Player['attributes'], value - 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 active:scale-95 transition-all border border-[#a8b8a7]/30"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      id={attr}
                      min="0"
                      max="99"
                      value={value}
                      onChange={(e) => handleAttributeChange(attr as keyof Player['attributes'], parseInt(e.target.value))}
                      className="w-16 px-2 py-1 text-center border border-[#a8b8a7]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a8b8a7] text-[#3c5c34] bg-[#dde1e0]/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAttributeChange(attr as keyof Player['attributes'], value + 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#a8b8a7]/20 text-[#644d36] hover:bg-[#a8b8a7]/30 active:scale-95 transition-all border border-[#a8b8a7]/30"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 bg-[#a78968]/20 text-[#a78968] rounded-lg hover:bg-[#a78968]/30 active:scale-95 transition-all border border-[#a78968]/30 font-mono"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#a8b8a7] text-[#dde1e0] rounded-lg hover:bg-[#8fa08e] active:scale-95 transition-all font-mono"
            >
              {initialData ? 'Update Player' : 'Add Player'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
} 