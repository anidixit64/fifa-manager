import { Player, GoalkeeperAttributes, PlayerAttributes } from '@/types/player';

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
  
  // Separate goalkeepers and outfield players
  const goalkeepers = players.filter(p => p.mainPosition === 'GK');
  const outfieldPlayers = players.filter(p => p.mainPosition !== 'GK');
  
  // Calculate attribute averages for outfield players only
  const outfieldAttributeAverages = outfieldPlayers.length > 0 ? {
    passing: calculateAverage(outfieldPlayers.map(p => (p.attributes as PlayerAttributes).passing)),
    shooting: calculateAverage(outfieldPlayers.map(p => (p.attributes as PlayerAttributes).shooting)),
    dribbling: calculateAverage(outfieldPlayers.map(p => (p.attributes as PlayerAttributes).dribbling)),
    pace: calculateAverage(outfieldPlayers.map(p => (p.attributes as PlayerAttributes).pace)),
    physical: calculateAverage(outfieldPlayers.map(p => (p.attributes as PlayerAttributes).physical)),
    defending: calculateAverage(outfieldPlayers.map(p => (p.attributes as PlayerAttributes).defending)),
  } : null;

  // Calculate goalkeeper attribute averages if there are goalkeepers
  const goalkeeperAttributeAverages = goalkeepers.length > 0 ? {
    diving: calculateAverage(goalkeepers.map(p => (p.attributes as GoalkeeperAttributes).diving)),
    handling: calculateAverage(goalkeepers.map(p => (p.attributes as GoalkeeperAttributes).handling)),
    kicking: calculateAverage(goalkeepers.map(p => (p.attributes as GoalkeeperAttributes).kicking)),
    reflexes: calculateAverage(goalkeepers.map(p => (p.attributes as GoalkeeperAttributes).reflexes)),
    speed: calculateAverage(goalkeepers.map(p => (p.attributes as GoalkeeperAttributes).speed)),
    positioning: calculateAverage(goalkeepers.map(p => (p.attributes as GoalkeeperAttributes).positioning)),
  } : null;

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
              <span className="text-gray-600">Goalkeepers:</span>{' '}
              <span className="font-medium">{goalkeepers.length}</span>
            </p>
            <p className="text-sm">
              <span className="text-gray-600">Outfield Players:</span>{' '}
              <span className="font-medium">{outfieldPlayers.length}</span>
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
            {outfieldAttributeAverages && (
              <>
                <p className="text-sm font-medium text-gray-700">Outfield Players:</p>
                {Object.entries(outfieldAttributeAverages).map(([attr, value]) => (
                  <p key={attr} className="text-sm ml-2">
                    <span className="text-gray-600 capitalize">{attr}:</span>{' '}
                    <span className="font-medium">{value}</span>
                  </p>
                ))}
              </>
            )}
            {goalkeeperAttributeAverages && (
              <>
                <p className="text-sm font-medium text-gray-700 mt-2">Goalkeepers:</p>
                {Object.entries(goalkeeperAttributeAverages).map(([attr, value]) => (
                  <p key={attr} className="text-sm ml-2">
                    <span className="text-gray-600 capitalize">{attr}:</span>{' '}
                    <span className="font-medium">{value}</span>
                  </p>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 