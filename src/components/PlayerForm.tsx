'use client';

import { useState, useEffect } from 'react';
import { Player, PlayerAttributes } from '@/types/player';

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

export default function PlayerForm({ onSubmit, onCancel, initialData }: PlayerFormProps) {
  const [formData, setFormData] = useState<Omit<Player, 'id'>>(
    initialData || {
      name: '',
      shortName: '',
      age: 18,
      nationality: '',
      fifaCode: '',
      mainPosition: 'ST',
      role: 'S',
      alternatePositions: [],
      overall: 50,
      attributes: {
        pace: 50,
        shooting: 50,
        passing: 50,
        dribbling: 50,
        defending: 50,
        physical: 50,
      },
    }
  );
  const [countrySuggestions, setCountrySuggestions] = useState<Country[]>([]);
  const [allCountries, setAllCountries] = useState<Country[]>([]);
  const [playerSuggestions, setPlayerSuggestions] = useState<PlayerSuggestion[]>([]);
  const [allPlayers, setAllPlayers] = useState<PlayerSuggestion[]>([]);

  useEffect(() => {
    if (initialData) {
      const { id, ...rest } = initialData;
      setFormData(rest);
    }
  }, [initialData]);

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
    setFormData(prev => ({ 
      ...prev, 
      name: player.long_name,
      shortName: player.short_name,
      nationality: player.nationality_name,
      fifaCode: country?.FIFA || ''
    }));
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

  const handleAttributeChange = (attr: keyof PlayerAttributes, value: number) => {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-8 w-full max-w-2xl shadow-xl">
        <h2 className="text-2xl font-bold text-black mb-6">
          {initialData ? 'Edit Player' : 'Add Player'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="relative">
              <label htmlFor="name" className="block text-sm font-medium text-black mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={handleNameChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-gray-50"
                required
              />
              {playerSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                  {playerSuggestions.map((player, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handlePlayerSuggestionClick(player)}
                      className="w-full px-4 py-2 text-left text-black hover:bg-gray-100 focus:outline-none"
                    >
                      {player.long_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="age" className="block text-sm font-medium text-black mb-2">
                Age
              </label>
              <select
                id="age"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-gray-50"
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
              <label htmlFor="nationality" className="block text-sm font-medium text-black mb-2">
                Nationality
              </label>
              <input
                type="text"
                id="nationality"
                value={formData.nationality}
                onChange={handleCountryChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-gray-50"
                required
              />
              {countrySuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                  {countrySuggestions.map((country, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleCountrySuggestionClick(country)}
                      className="w-full px-4 py-2 text-left text-black hover:bg-gray-100 focus:outline-none"
                    >
                      {country.Country}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="position" className="block text-sm font-medium text-black mb-2">
                Position
              </label>
              <select
                id="position"
                value={formData.mainPosition}
                onChange={(e) => setFormData({ ...formData, mainPosition: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-gray-50"
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
              <label htmlFor="role" className="block text-sm font-medium text-black mb-2">
                Role
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as PlayerRole })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-gray-50"
                required
              >
                {ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-black mb-4">Attributes</h3>
            <div className="grid grid-cols-3 gap-6">
              {Object.entries(formData.attributes).map(([attr, value]) => (
                <div key={attr} className="flex flex-col space-y-2">
                  <label htmlFor={attr} className="block text-sm font-medium text-black">
                    {attr.charAt(0).toUpperCase() + attr.slice(1)}
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleAttributeChange(attr as keyof Player['attributes'], value - 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 active:scale-95 transition-all"
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
                      className="w-16 px-2 py-1 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-gray-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAttributeChange(attr as keyof Player['attributes'], value + 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 active:scale-95 transition-all"
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
              className="px-6 py-2 text-black hover:text-gray-700 active:scale-95 transition-transform"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition-transform"
            >
              {initialData ? 'Update Player' : 'Add Player'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 