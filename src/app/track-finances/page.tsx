'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOptimizedNavigation } from '@/hooks/useOptimizedNavigation';
import { useTeamTheme } from '@/contexts/TeamThemeContext';
import useLocalStorage from '@/hooks/useLocalStorage';
import { Player } from '@/types/player';

export default function TrackFinancesPage() {
  const router = useRouter();
  const { navigateTo } = useOptimizedNavigation({ transitionDuration: 50 });
  const { setTheme } = useTeamTheme();
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [currentMoney, setCurrentMoney] = useState('');
  const [maxBudget, setMaxBudget] = useState(0);
  const [currentBudget, setCurrentBudget] = useState(0);
  const [isGreenToggleOn, setIsGreenToggleOn] = useState(false);
  const [isRedToggleOn, setIsRedToggleOn] = useState(false);
  const [players] = useLocalStorage<Player[]>('fifaPlayers', []);

  return (
    <main className="min-h-screen bg-[#3c5c34] relative overflow-hidden">
      {/* Background soccer player image */}
      <div className="absolute inset-0">
        <img
          src="/soccer_player1.png"
          alt="Soccer Player Background"
          className="w-full h-full object-cover opacity-20 blur-sm"
        />
      </div>

      {/* Simplified soccer field pattern overlay */}
      <div className="absolute inset-0">
        {/* Grass texture */}
        <div className="absolute inset-0 bg-[#3c5c34] opacity-90"></div>
        
        {/* Simplified field elements */}
        <div className="absolute inset-0">
          {/* Center line only */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-full bg-[#dde1e0]/20"></div>
          
          {/* Simple overlay for texture */}
          <div className="absolute inset-0 bg-[#dde1e0]/5"></div>
        </div>
      </div>

      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header with back button and Set Budget button */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <button
                onClick={() => navigateTo('/manager')}
                className="relative group p-2 rounded-full bg-[#dde1e0]/10 hover:bg-[#dde1e0]/20 transition-all duration-300 hover:scale-110 active:scale-95 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/50 mr-4"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6 text-[#dde1e0]/80 group-hover:text-[#dde1e0] transition-all duration-300 group-hover:rotate-12 group-active:-rotate-6" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {/* Hover glow effect */}
                <div className="absolute inset-0 rounded-full bg-[#dde1e0]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              </button>
              <h1 className="text-4xl font-bold text-[#dde1e0] font-mono tracking-wider">Track Finances</h1>
            </div>
            
            {/* Set Budget and Modify Buttons */}
            <div className="flex space-x-4">
              {/* Set Budget Button */}
              <div className="relative">
                <button
                  onClick={() => setShowBudgetModal(!showBudgetModal)}
                  className="relative group px-6 py-3 text-[#3c5c34] overflow-hidden font-mono shadow-md transition-transform duration-150 hover:scale-105 active:scale-95 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/60"
                >
                  {/* Button background */}
                  <div className="absolute inset-0 bg-[#dde1e0] group-hover:bg-[#c8d0cf] transition-colors"></div>
                  {/* Button border */}
                  <div className="absolute inset-0 border-2 border-[#3c5c34]"></div>
                  {/* Button text */}
                  <span className="relative z-10 tracking-wider font-semibold">
                    Set Budget
                  </span>
                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-[#3c5c34]/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                </button>

                {/* Budget Modal */}
                {showBudgetModal && (
                  <div className="absolute top-full left-0 mt-2 bg-[#dde1e0] border-2 border-[#3c5c34] rounded-lg shadow-lg p-4 z-50 min-w-64">
                    <div className="space-y-3">
                      <h3 className="text-[#3c5c34] font-mono font-semibold text-lg">Set Maximum Budget</h3>
                      <div className="space-y-2">
                        <div className="text-[#3c5c34] font-mono text-sm">Select maximum budget in $10M increments:</div>
                        <div className="grid grid-cols-2 gap-2">
                          {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((amount) => (
                            <button
                              key={amount}
                              onClick={() => setBudgetAmount((amount * 1000000).toString())}
                              className={`px-3 py-2 border border-[#3c5c34] rounded font-mono text-sm transition-colors ${
                                budgetAmount === (amount * 1000000).toString()
                                  ? 'bg-[#3c5c34] text-[#dde1e0]'
                                  : 'bg-white text-[#3c5c34] hover:bg-[#dde1e0]/20'
                              }`}
                            >
                              ${amount}M
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            const amount = parseInt(budgetAmount) || 0;
                            if (amount > 0) {
                              setMaxBudget(amount);
                              setCurrentBudget(amount); // Fill bar to 100%
                              setShowBudgetModal(false);
                              setBudgetAmount('');
                            }
                          }}
                          disabled={!budgetAmount}
                          className={`flex-1 px-4 py-2 font-mono font-semibold rounded transition-colors ${
                            budgetAmount
                              ? 'bg-[#3c5c34] text-[#dde1e0] hover:bg-[#2a4a2a]'
                              : 'bg-[#a78968]/50 text-[#dde1e0]/50 cursor-not-allowed'
                          }`}
                        >
                          Set
                        </button>
                        <button
                          onClick={() => {
                            setShowBudgetModal(false);
                            setBudgetAmount('');
                          }}
                          className="flex-1 px-4 py-2 bg-[#a78968] text-[#dde1e0] font-mono font-semibold rounded hover:bg-[#8f7a5a] transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modify Button */}
              <div className="relative">
                <button
                  onClick={() => {
                    setCurrentMoney(currentBudget.toString());
                    setShowModifyModal(!showModifyModal);
                  }}
                  className="relative group px-6 py-3 text-[#3c5c34] overflow-hidden font-mono shadow-md transition-transform duration-150 hover:scale-105 active:scale-95 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#a78968]/60"
                >
                  {/* Button background */}
                  <div className="absolute inset-0 bg-[#dde1e0] group-hover:bg-[#c8d0cf] transition-colors"></div>
                  {/* Button border */}
                  <div className="absolute inset-0 border-2 border-[#3c5c34]"></div>
                  {/* Button text */}
                  <span className="relative z-10 tracking-wider font-semibold">
                    Modify
                  </span>
                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-[#3c5c34]/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                </button>

                {/* Modify Modal */}
                {showModifyModal && (
                  <div className="absolute top-full left-0 mt-2 bg-[#dde1e0] border-2 border-[#3c5c34] rounded-lg shadow-lg p-4 z-50 min-w-64">
                    <div className="space-y-3">
                      <h3 className="text-[#3c5c34] font-mono font-semibold text-lg">Set Current Money</h3>
                      <div className="space-y-2">
                        <div className="text-[#3c5c34] font-mono text-sm">
                          Current max budget: ${maxBudget.toLocaleString()}
                        </div>
                        <div className="text-[#3c5c34] font-mono text-sm">Enter current money amount:</div>
                        <input
                          type="number"
                          value={currentMoney}
                          onChange={(e) => setCurrentMoney(e.target.value)}
                          placeholder="Enter amount"
                          className="w-full px-3 py-2 border border-[#3c5c34] rounded font-mono text-sm focus:outline-none focus:border-[#2a4a2a]"
                        />
                        <div className="text-[#3c5c34] font-mono text-xs text-gray-600">
                          Amount must be between $0 and ${maxBudget.toLocaleString()}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            const amount = parseInt(currentMoney) || 0;
                            if (amount >= 0 && amount <= maxBudget) {
                              setCurrentBudget(amount);
                              setShowModifyModal(false);
                              setCurrentMoney('');
                            }
                          }}
                          disabled={!currentMoney || parseInt(currentMoney) < 0 || parseInt(currentMoney) > maxBudget}
                          className={`flex-1 px-4 py-2 font-mono font-semibold rounded transition-colors ${
                            currentMoney && parseInt(currentMoney) >= 0 && parseInt(currentMoney) <= maxBudget
                              ? 'bg-[#3c5c34] text-[#dde1e0] hover:bg-[#2a4a2a]'
                              : 'bg-[#a78968]/50 text-[#dde1e0]/50 cursor-not-allowed'
                          }`}
                        >
                          Set
                        </button>
                        <button
                          onClick={() => {
                            setShowModifyModal(false);
                            setCurrentMoney('');
                          }}
                          className="flex-1 px-4 py-2 bg-[#a78968] text-[#dde1e0] font-mono font-semibold rounded hover:bg-[#8f7a5a] transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="relative h-[calc(100vh-200px)]">
            {/* Bar - Left Side */}
            <div className="absolute left-16 top-1/2 transform -translate-y-1/2 h-full">
              <div className="relative h-full">
                {/* Bar Container */}
                <div className="w-16 h-full bg-[#dde1e0]/10 rounded-full border-4 border-[#a78968] shadow-lg">
                  {/* Red Fill Bar - fills proportionally based on current money vs max budget */}
                  <div 
                    className="w-full bg-red-500/70 rounded-full shadow-inner transition-all duration-500"
                    style={{ 
                      height: maxBudget > 0 ? `${(currentBudget / maxBudget) * 100}%` : '0%' 
                    }}
                  ></div>
                </div>
                
                {/* Level Tag */}
                <div 
                  className="absolute -left-56 transform -translate-y-1/2 transition-all duration-500"
                  style={{ 
                    top: maxBudget > 0 ? `${100 - ((currentBudget / maxBudget) * 100)}%` : '100%' 
                  }}
                >
                  <div className="relative">
                    {/* Tag Shape */}
                    <div className="bg-[#dde1e0] border-2 border-[#3c5c34] px-16 py-8 rounded-lg shadow-lg relative">
                      {/* Tag Pointer - pointing horizontally from right side to red fill level */}
                      <div className="absolute right-0 top-1/2 transform translate-x-full -translate-y-1/2">
                        <div className="w-0 h-0 border-t-12 border-b-12 border-l-12 border-transparent border-l-[#3c5c34]"></div>
                        <div className="w-0 h-0 border-t-10 border-b-10 border-l-10 border-transparent border-l-[#dde1e0] absolute top-1 right-0.5"></div>
                      </div>
                      {/* Number Display */}
                      <span className="text-[#3c5c34] font-mono font-bold text-6xl">
                        {currentBudget > 0 ? `$${currentBudget.toLocaleString()}` : ''}
                      </span>
                      {/* Max Budget Display */}
                      <div className="text-[#3c5c34] font-mono text-sm text-center mt-2">
                        Max: ${maxBudget.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trade Calculator - Dynamic height based on toggle state */}
            <div className={`absolute left-40 top-0 -right-30 bg-[#dde1e0]/10 backdrop-blur-sm rounded-lg shadow-lg border border-[#dde1e0]/20 overflow-hidden transition-all duration-300 ${
              isGreenToggleOn || isRedToggleOn ? 'h-full' : 'h-auto'
            }`}>
              {/* Trade Calculator Header */}
              <div className="p-6 border-b border-[#dde1e0]/20">
                <div className="flex items-center justify-between">
                  <div className="flex-1"></div>
                  <h2 className="text-2xl font-bold text-[#dde1e0] font-mono tracking-wider flex-1 text-center">Trade Calculator</h2>
                  
                  {/* Toggle Buttons */}
                  <div className="flex space-x-3 flex-1 justify-end">
                    {/* Green Toggle Button with Down Arrow */}
                    <button
                      onClick={() => {
                        if (isRedToggleOn) setIsRedToggleOn(false);
                        setIsGreenToggleOn(!isGreenToggleOn);
                      }}
                      className={`relative w-10 h-10 rounded-full border-2 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#dde1e0]/50 ${
                        isGreenToggleOn
                          ? 'bg-green-500 border-green-600 shadow-lg shadow-green-500/50'
                          : 'bg-green-500/30 border-green-500/50 hover:bg-green-500/50'
                      }`}
                    >
                      <svg
                        className={`w-5 h-5 mx-auto transition-all duration-300 ${
                          isGreenToggleOn ? 'text-white' : 'text-green-400'
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </button>

                    {/* Red Toggle Button with Up Arrow */}
                    <button
                      onClick={() => {
                        if (isGreenToggleOn) setIsGreenToggleOn(false);
                        setIsRedToggleOn(!isRedToggleOn);
                      }}
                      className={`relative w-10 h-10 rounded-full border-2 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#dde1e0]/50 ${
                        isRedToggleOn
                          ? 'bg-red-500 border-red-600 shadow-lg shadow-red-500/50'
                          : 'bg-red-500/30 border-red-500/50 hover:bg-red-500/50'
                      }`}
                    >
                      <svg
                        className={`w-5 h-5 mx-auto transition-all duration-300 ${
                          isRedToggleOn ? 'text-white' : 'text-red-400'
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Trade Calculator Content - Only show when a toggle is active */}
              {(isGreenToggleOn || isRedToggleOn) && (
                <div className="p-6">
                  {/* Search Bar */}
                  <div className="mb-6">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search players..."
                        className="w-full px-4 py-3 bg-[#dde1e0]/20 border-2 border-[#a78968] rounded-lg text-[#dde1e0] font-mono placeholder-[#a8b8a7]/70 focus:outline-none focus:border-[#3c5c34] focus:bg-[#dde1e0]/30 transition-all duration-300"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <svg className="w-5 h-5 text-[#a8b8a7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-[#a8b8a7] font-mono">
                      {isGreenToggleOn ? 'Green toggle (down arrow) is active' : 'Red toggle (up arrow) is active'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 