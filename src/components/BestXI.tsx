'use client';

import { Player } from '@/types/player';
import { useTeamThemeStyles } from '@/hooks/useTeamThemeStyles';

interface BestXIProps {
  players: Player[];
  onPlayerClick: (player: Player) => void;
}

export default function BestXI({ players, onPlayerClick }: BestXIProps) {
  const styles = useTeamThemeStyles();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className={`text-2xl font-bold ${styles.primaryText} mb-6`}>Best XI</h2>
      <div className="grid grid-cols-3 gap-4">
        {players.map((player) => (
          <div
            key={player.id}
            onClick={() => onPlayerClick(player)}
            className={`p-4 rounded-lg border ${styles.primaryBorder} cursor-pointer hover:shadow-md transition-shadow`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">{player.name}</span>
              <span className={`${styles.secondaryText} font-bold`}>{player.overall}</span>
            </div>
            <div className="text-sm text-gray-600">{player.mainPosition}</div>
          </div>
        ))}
      </div>
    </div>
  );
} 