'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <h1 className="text-6xl font-bold text-black mb-8 animate-fade-in">
        FIFA Manager
      </h1>
      <button
        onClick={() => router.push('/create-team')}
        className="bg-blue-600 text-white px-8 py-4 rounded-lg text-xl font-semibold
                 hover:bg-blue-700 transform hover:scale-105 transition-all duration-200
                 active:scale-95 shadow-lg hover:shadow-xl"
      >
        Start Managing
      </button>
    </main>
  );
}
