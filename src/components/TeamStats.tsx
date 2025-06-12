import { Player } from '@/types/player';

interface TeamStatsProps {
  players: Player[];
}

export default function TeamStats({ players }: TeamStatsProps) {
  if (players.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        Add players to see team statistics.
      </div>
    );
  }

  const calculateAverage = (numbers: number[]): number => {
    return Math.round(numbers.reduce((sum, num) => sum + num, 0) / numbers.length);
  };

  const averageAge = calculateAverage(players.map(p => p.age));
  const averageOverall = calculateAverage(players.map(p => p.overall));
  
  const attributeAverages = {
    passing: calculateAverage(players.map(p => p.attributes.passing)),
    shooting: calculateAverage(players.map(p => p.attributes.shooting)),
    dribbling: calculateAverage(players.map(p => p.attributes.dribbling)),
    pace: calculateAverage(players.map(p => p.attributes.pace)),
    strength: calculateAverage(players.map(p => p.attributes.strength)),
    defending: calculateAverage(players.map(p => p.attributes.defending)),
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Team Statistics</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">General</h3>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="text-gray-600">Total Players:</span>{' '}
              <span className="font-medium">{players.length}</span>
            </p>
            <p className="text-sm">
              <span className="text-gray-600">Average Age:</span>{' '}
              <span className="font-medium">{averageAge}</span>
            </p>
            <p className="text-sm">
              <span className="text-gray-600">Average Overall:</span>{' '}
              <span className="font-medium">{averageOverall}</span>
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Attributes</h3>
          <div className="space-y-2">
            {Object.entries(attributeAverages).map(([attr, value]) => (
              <p key={attr} className="text-sm">
                <span className="text-gray-600 capitalize">{attr}:</span>{' '}
                <span className="font-medium">{value}</span>
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 