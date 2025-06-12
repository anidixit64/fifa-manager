'use client';

import { useState, useEffect } from 'react';
import { Player, PlayerAttributes } from '@/types/player';

interface PlayerFormProps {
  onSubmit: (player: Omit<Player, 'id'>) => void;
  onCancel: () => void;
  initialData?: Player;
}

const POSITIONS = [
  'GK', 'LB', 'CB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST'
];

const ATTRIBUTES: (keyof PlayerAttributes)[] = [
  'pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'
];

export default function PlayerForm({ onSubmit, onCancel, initialData }: PlayerFormProps) {
  const [formData, setFormData] = useState<Omit<Player, 'id'>>(
    initialData || {
      name: '',
      age: 18,
      nationality: '',
      mainPosition: 'ST',
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

  useEffect(() => {
    if (initialData) {
      const { id, ...rest } = initialData;
      setFormData(rest);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleAttributeChange = (attr: keyof PlayerAttributes, value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 99) {
      setFormData(prev => ({
        ...prev,
        attributes: {
          ...prev.attributes,
          [attr]: numValue
        }
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-black mb-4">
          {initialData ? 'Edit Player' : 'Add Player'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-black mb-1">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              required
            />
          </div>

          <div>
            <label htmlFor="age" className="block text-sm font-medium text-black mb-1">
              Age
            </label>
            <select
              id="age"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              required
            >
              {Array.from({ length: 33 }, (_, i) => i + 18).map((age) => (
                <option key={age} value={age}>
                  {age}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="nationality" className="block text-sm font-medium text-black mb-1">
              Nationality
            </label>
            <input
              type="text"
              id="nationality"
              value={formData.nationality}
              onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              required
            />
          </div>

          <div>
            <label htmlFor="position" className="block text-sm font-medium text-black mb-1">
              Position
            </label>
            <select
              id="position"
              value={formData.mainPosition}
              onChange={(e) => setFormData({ ...formData, mainPosition: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
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
            <h3 className="text-lg font-medium text-black mb-2">Attributes</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(formData.attributes).map(([attr, value]) => (
                <div key={attr}>
                  <label htmlFor={attr} className="block text-sm font-medium text-black mb-1">
                    {attr.charAt(0).toUpperCase() + attr.slice(1)}
                  </label>
                  <input
                    type="range"
                    id={attr}
                    min="0"
                    max="99"
                    value={value}
                    onChange={(e) => handleAttributeChange(attr as keyof Player['attributes'], parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-black">
                    <span>0</span>
                    <span>{value}</span>
                    <span>99</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-black hover:text-gray-700 active:scale-95 transition-transform"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:scale-95 transition-transform"
            >
              {initialData ? 'Update Player' : 'Add Player'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 