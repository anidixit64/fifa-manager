'use client';

import { useRouter } from 'next/navigation';
import useLocalStorage from '@/hooks/useLocalStorage';
import { Player } from '@/types/player';

export default function BestXIPage() {
  const router = useRouter();
  const [teamName] = useLocalStorage('fifaTeamName', 'My Team');
  const [bestXI] = useLocalStorage<Player[]>('bestXI', []);

  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-black">{teamName}'s Best XI</h1>
          <button
            onClick={() => router.push('/manager')}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Back to Manager
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bestXI.map((player) => (
              <div key={player.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-black">{player.name}</h3>
                    <p className="text-sm text-gray-600">{player.nationality}</p>
                    <p className="text-sm text-gray-600">Position: {player.mainPosition}</p>
                    <p className="text-sm font-medium text-blue-600">Overall: {player.overall}</p>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(player.attributes).map(([attr, value]) => (
                    <div key={attr} className="flex justify-between">
                      <span className="text-gray-600 capitalize">{attr}:</span>
                      <span className="font-medium text-black">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
} 