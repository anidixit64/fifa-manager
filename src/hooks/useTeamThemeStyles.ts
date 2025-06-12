import { useTeamTheme } from '@/contexts/TeamThemeContext';

export function useTeamThemeStyles() {
  const { theme } = useTeamTheme();

  if (!theme) {
    return {
      primaryColor: 'rgb(59, 130, 246)', // Default blue
      secondaryColor: 'rgb(37, 99, 235)', // Default darker blue
      accentColor: 'rgb(96, 165, 250)', // Default lighter blue
      primaryBg: 'bg-blue-600',
      secondaryBg: 'bg-blue-700',
      accentBg: 'bg-blue-500',
      primaryText: 'text-blue-600',
      secondaryText: 'text-blue-700',
      accentText: 'text-blue-500',
      primaryBorder: 'border-blue-600',
      secondaryBorder: 'border-blue-700',
      accentBorder: 'border-blue-500',
      primaryHover: 'hover:bg-blue-700',
      secondaryHover: 'hover:bg-blue-800',
      accentHover: 'hover:bg-blue-600',
    };
  }

  // Convert hex to RGB for opacity support
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const primaryRgb = hexToRgb(theme.primary);
  const secondaryRgb = hexToRgb(theme.secondary);
  const accentRgb = hexToRgb(theme.accent);

  return {
    primaryColor: primaryRgb ? `rgb(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b})` : theme.primary,
    secondaryColor: secondaryRgb ? `rgb(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b})` : theme.secondary,
    accentColor: accentRgb ? `rgb(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b})` : theme.accent,
    primaryBg: `bg-[${theme.primary}]`,
    secondaryBg: `bg-[${theme.secondary}]`,
    accentBg: `bg-[${theme.accent}]`,
    primaryText: `text-[${theme.primary}]`,
    secondaryText: `text-[${theme.secondary}]`,
    accentText: `text-[${theme.accent}]`,
    primaryBorder: `border-[${theme.primary}]`,
    secondaryBorder: `border-[${theme.secondary}]`,
    accentBorder: `border-[${theme.accent}]`,
    primaryHover: `hover:bg-[${theme.primary}]`,
    secondaryHover: `hover:bg-[${theme.secondary}]`,
    accentHover: `hover:bg-[${theme.accent}]`,
  };
} 