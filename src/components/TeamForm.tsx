'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface TeamFormProps {
  onSubmit: (formData: any) => void;
  isSubmitting: boolean;
}

export default function TeamForm({ onSubmit, isSubmitting }: TeamFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
  });
  const [teamSuggestions, setTeamSuggestions] = useState<string[]>([]);
  const [allTeamNames, setAllTeamNames] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTeamNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, name: value }));
    
    if (value) {
      const suggestions = allTeamNames.filter(name => 
        name.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      setTeamSuggestions(suggestions);
    } else {
      setTeamSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setFormData(prev => ({ ...prev, name: suggestion }));
    setTeamSuggestions([]);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="relative">
          <label className="block text-lg font-medium text-white mb-2">Team Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={handleTeamNameChange}
            className="retro-input w-full"
            placeholder="Enter team name"
            required
          />
          {teamSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute z-10 w-full mt-1 retro-card"
            >
              {teamSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-2 text-left text-white hover:bg-white/10 focus:outline-none"
                >
                  {suggestion}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        <div>
          <label className="block text-lg font-medium text-white mb-2">Team Logo</label>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="retro-button flex-1"
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
            {formData.logo && (
              <div className="relative w-16 h-16 retro-border">
                <Image
                  src={formData.logo}
                  alt="Team logo preview"
                  fill
                  className="object-contain"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <motion.button
        type="submit"
        disabled={isSubmitting}
        className="retro-button w-full"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {isSubmitting ? 'Creating...' : 'Create Team'}
      </motion.button>
    </form>
  );
} 