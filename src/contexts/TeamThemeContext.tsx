'use client';

import { createContext, useContext, ReactNode } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';

interface TeamTheme {
  primary: string;
  secondary: string;
  accent: string;
}

interface TeamThemeContextType {
  theme: TeamTheme | null;
  setTheme: (theme: TeamTheme | null) => void;
}

const TeamThemeContext = createContext<TeamThemeContextType | undefined>(undefined);

export function TeamThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useLocalStorage<TeamTheme | null>('teamTheme', null);

  return (
    <TeamThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </TeamThemeContext.Provider>
  );
}

export function useTeamTheme() {
  const context = useContext(TeamThemeContext);
  if (context === undefined) {
    throw new Error('useTeamTheme must be used within a TeamThemeProvider');
  }
  return context;
} 