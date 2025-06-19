'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleStartManaging = () => {
    router.push('/create-team');
  };

  if (!mounted) {
    return (
      <main className="min-h-screen bg-[#3c5c34] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4 font-mono">FIFA MANAGER</h1>
          <button className="px-6 py-3 bg-[#4CAF50] text-white rounded-none border-2 border-white hover:bg-[#45a049] transition-colors font-mono">
            START MANAGING
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#3c5c34] relative overflow-hidden">
      {/* Soccer field pattern */}
      <div className="absolute inset-0">
        {/* Grass texture */}
        <div className="absolute inset-0 bg-[#3c5c34] opacity-90"></div>
        
        {/* Field lines */}
        <div className="absolute inset-0">
          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 border-4 border-white/30 rounded-full"></div>
          
          {/* Center line */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-full bg-white/30"></div>
          
          {/* Penalty areas */}
          <div className="absolute top-1/4 left-0 w-32 h-1/2 border-r-4 border-white/30"></div>
          <div className="absolute top-1/4 right-0 w-32 h-1/2 border-l-4 border-white/30"></div>
          
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:2rem_2rem]"></div>
        </div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative mb-8"
          >
            <img
              src="/soccer_player2.png"
              alt="Soccer Player"
              className="w-64 h-64 object-contain filter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-7xl font-bold mb-6 font-mono tracking-wider"
          >
            <span className="text-[#4CAF50]">FIFA</span>
            <span className="text-white block mt-2">MANAGER</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-white/80 text-xl mb-8 font-mono"
          >
            BUILD YOUR DREAM TEAM
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            onClick={handleStartManaging}
            className="relative group px-12 py-4 text-xl font-bold text-white overflow-hidden font-mono"
          >
            {/* Button background */}
            <div className="absolute inset-0 bg-[#4CAF50] group-hover:bg-[#45a049] transition-colors"></div>
            
            {/* Button border */}
            <div className="absolute inset-0 border-4 border-white"></div>
            
            {/* Button text */}
            <span className="relative z-10 tracking-wider">
              START MANAGING
            </span>

            {/* Hover effect */}
            <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
          </motion.button>
        </motion.div>
      </div>
    </main>
  );
}
