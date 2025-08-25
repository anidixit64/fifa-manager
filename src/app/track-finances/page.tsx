'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useOptimizedNavigation } from '@/hooks/useOptimizedNavigation';
import { useTeamTheme } from '@/contexts/TeamThemeContext';
import useLocalStorage from '@/hooks/useLocalStorage';
import { Player } from '@/types/player';
import { analyzeTeam } from '@/utils/teamAnalysis';

// Define sectors for position grouping
const SECTORS = {
  'Defense': ['LB', 'CB', 'RB'],
  'Midfield': ['CDM', 'CM', 'CAM', 'LM', 'RM'],
  'Forward': ['LW', 'RW', 'ST'],
  'Goalkeeper': ['GK']
};

export default function TrackFinancesPage() {
  const router = useRouter();
  const { navigateTo } = useOptimizedNavigation({ transitionDuration: 50 });
  const { setTheme } = useTeamTheme();
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [currentMoney, setCurrentMoney] = useState('');
  const [maxBudget, setMaxBudget] = useLocalStorage<number>('maxBudget', 0);
  const [currentBudget, setCurrentBudget] = useLocalStorage<number>('currentBudget', 0);
  const [isGreenToggleOn, setIsGreenToggleOn] = useState(false);
  const [isRedToggleOn, setIsRedToggleOn] = useState(false);
  const [players] = useLocalStorage<Player[]>('fifaPlayers', []);
  
  // Player search states
  const [searchQuery, setSearchQuery] = useState('');
  const [playerSuggestions, setPlayerSuggestions] = useState<any[]>([]);
  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [showAnalyzeButton, setShowAnalyzeButton] = useState(false);
  const [playerAge, setPlayerAge] = useState('');
  const [playerOverall, setPlayerOverall] = useState('');
  const [playerPrice, setPlayerPrice] = useState('');
  const [playerPace, setPlayerPace] = useState('');
  const [playerShooting, setPlayerShooting] = useState('');
  const [playerPassing, setPlayerPassing] = useState('');
  const [playerDribbling, setPlayerDribbling] = useState('');
  const [playerDefending, setPlayerDefending] = useState('');
  const [playerPhysical, setPlayerPhysical] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Team analysis states
  const [positionCounts] = useLocalStorage<any[]>('positionCounts', []);
  const [positionPriorities] = useLocalStorage<any[]>('positionPriorities', []);
  const [toggledPositions] = useLocalStorage<Set<any>>('toggledPositions', new Set());
  const [evaluation, setEvaluation] = useState<any>(null);
  
  // Dynamic positioning for transfer suggestions box
  const tradeCalculatorRef = useRef<HTMLDivElement>(null);
  const [tradeCalculatorHeight, setTradeCalculatorHeight] = useState(0);

  // Helper function to calculate buying value
  const calculateBuyingValue = (isStarter: boolean, category: string, sectorChanges: any, positionChanges: any, currentBudget: number, playerPrice: number) => {
    let valueScore = 0;
    const valueReasoning: string[] = [];
    let valueAssessment = '';
    let valueColor = '';
    let remainingBudget = 0;
    let budgetPercentage = 0;
    
    if (currentBudget > 0) {
      // Budget is set, calculate full value analysis
      remainingBudget = currentBudget - playerPrice;
      budgetPercentage = (playerPrice / currentBudget) * 100;
      
      // Base value from role assessment (40% weight)
      if (isStarter) {
        valueScore += 40;
        valueReasoning.push("High value: Would be a starter");
      } else {
        valueScore += 15;
        valueReasoning.push("Moderate value: Bench player");
      }
      
      // Category value (25% weight)
      if (category === 'Young Star') {
        valueScore += 25;
        valueReasoning.push("Excellent value: Young star with potential");
      } else if (category === 'Veteran') {
        valueScore += 20;
        valueReasoning.push("Good value: Experienced veteran");
      } else if (category === 'Aging Player') {
        valueScore += 10;
        valueReasoning.push("Lower value: Aging player");
      } else {
        valueScore += 15;
        valueReasoning.push("Standard value: Normal player");
      }
      
      // Impact value (20% weight)
      const hasSignificantImpact = Object.keys(sectorChanges).length > 0 || Object.keys(positionChanges).length > 0;
      if (hasSignificantImpact) {
        valueScore += 20;
        valueReasoning.push("High impact: Improves team structure");
      } else {
        valueScore += 10;
        valueReasoning.push("Limited impact: No structural improvement");
      }
      
      // Budget efficiency (15% weight)
      let budgetEfficiency = 0;
      if (budgetPercentage <= 10) {
        budgetEfficiency = 15;
        valueReasoning.push("Budget friendly: Low cost relative to budget");
      } else if (budgetPercentage <= 25) {
        budgetEfficiency = 12;
        valueReasoning.push("Reasonable cost: Moderate budget impact");
      } else if (budgetPercentage <= 50) {
        budgetEfficiency = 8;
        valueReasoning.push("High cost: Significant budget impact");
      } else {
        budgetEfficiency = 3;
        valueReasoning.push("Very expensive: Major budget commitment");
      }
      valueScore += budgetEfficiency;
      
      // Determine overall value assessment
      if (valueScore >= 80) {
        valueAssessment = 'Excellent Value';
        valueColor = 'text-green-400';
      } else if (valueScore >= 65) {
        valueAssessment = 'Good Value';
        valueColor = 'text-blue-400';
      } else if (valueScore >= 50) {
        valueAssessment = 'Fair Value';
        valueColor = 'text-yellow-400';
      } else if (valueScore >= 35) {
        valueAssessment = 'Poor Value';
        valueColor = 'text-orange-400';
      } else {
        valueAssessment = 'Bad Value';
        valueColor = 'text-red-400';
      }
      
      // Add budget-specific recommendations
      if (budgetPercentage > 75) {
        valueReasoning.push("⚠️ Warning: Spending most of remaining budget");
      } else if (budgetPercentage > 50) {
        valueReasoning.push("⚠️ Caution: High budget commitment");
      }
      
      // Add team-specific recommendations
      if (isStarter && budgetPercentage <= 30) {
        valueReasoning.push("✅ Great deal: Starter at reasonable cost");
      } else if (!isStarter && budgetPercentage > 40) {
        valueReasoning.push("❌ Overpriced: Bench player at high cost");
      }
    } else {
      // No budget set, calculate team fit only
      if (isStarter) {
        valueScore += 50;
        valueReasoning.push("High team fit: Would be a starter");
      } else {
        valueScore += 20;
        valueReasoning.push("Moderate team fit: Bench player");
      }
      
      if (category === 'Young Star') {
        valueScore += 30;
        valueReasoning.push("Excellent fit: Young star with potential");
      } else if (category === 'Veteran') {
        valueScore += 25;
        valueReasoning.push("Good fit: Experienced veteran");
      } else if (category === 'Aging Player') {
        valueScore += 15;
        valueReasoning.push("Lower fit: Aging player");
      } else {
        valueScore += 20;
        valueReasoning.push("Standard fit: Normal player");
      }
      
      const hasSignificantImpact = Object.keys(sectorChanges).length > 0 || Object.keys(positionChanges).length > 0;
      if (hasSignificantImpact) {
        valueScore += 20;
        valueReasoning.push("High impact: Improves team structure");
      } else {
        valueReasoning.push("Limited impact: No structural improvement");
      }
      
      if (valueScore >= 80) {
        valueAssessment = 'Excellent Team Fit';
        valueColor = 'text-green-400';
      } else if (valueScore >= 65) {
        valueAssessment = 'Good Team Fit';
        valueColor = 'text-blue-400';
      } else if (valueScore >= 50) {
        valueAssessment = 'Fair Team Fit';
        valueColor = 'text-yellow-400';
      } else if (valueScore >= 35) {
        valueAssessment = 'Poor Team Fit';
        valueColor = 'text-orange-400';
      } else {
        valueAssessment = 'Bad Team Fit';
        valueColor = 'text-red-400';
      }
      
      valueReasoning.push("💰 Price analysis unavailable: Budget not set");
    }
    
    return {
      valueScore,
      valueAssessment,
      valueColor,
      valueReasoning,
      budgetPercentage,
      remainingBudget
    };
  };

  // Helper function to calculate recommended role based on attributes and overall
  const calculateRecommendedRole = (overall: number, attributes: { pace: number; shooting: number; passing: number; dribbling: number; defending: number; physical: number }): 'C' | 'I' | 'R' | 'S' | 'P' => {
    // Calculate average attribute score
    const avgAttribute = Object.values(attributes).reduce((sum: number, val: number) => sum + val, 0) / 6;
    
    // Calculate role based on overall and average attributes
    const combinedScore = (overall * 0.6) + (avgAttribute * 0.4);
    
    if (combinedScore >= 85) return 'C'; // Crucial
    if (combinedScore >= 78) return 'I'; // Important
    if (combinedScore >= 70) return 'R'; // Rotation
    if (combinedScore >= 60) return 'S'; // Squad
    return 'P'; // Prospect
  };

  // Helper function to calculate selling value
  const calculateSellingValue = (isStarter: boolean, category: string, sectorChanges: any, positionChanges: any, currentBudget: number, sellingPrice: number, wouldLeavePositionEmpty: boolean, wouldLeaveSectorEmpty: boolean) => {
    let valueScore = 0;
    let valueReasoning: string[] = [];
    let valueAssessment = '';
    let valueColor = '';
    let remainingBudget = 0;
    let budgetPercentage = 0;
    
    if (currentBudget > 0) {
      // Budget is set, calculate full selling value analysis
      remainingBudget = currentBudget + sellingPrice;
      budgetPercentage = (sellingPrice / currentBudget) * 100;
      
      // Check for critical depth issues - automatic "Don't Sell"
      if (wouldLeavePositionEmpty) {
        valueScore = 0;
        valueAssessment = 'Critical: Would Leave Position Empty';
        valueColor = 'text-red-400';
        valueReasoning = [
          "❌ CRITICAL: Selling this player would leave the position completely empty",
          "⚠️ You must have at least one player at each position to play the game",
          "💰 No price is worth leaving a position empty"
        ];
        
        return {
          valueScore,
          valueAssessment,
          valueColor,
          valueReasoning,
          budgetPercentage,
          remainingBudget
        };
      }
      
      if (wouldLeaveSectorEmpty) {
        valueScore = 5;
        valueAssessment = 'Critical: Would Leave Sector Empty';
        valueColor = 'text-red-400';
        valueReasoning = [
          "❌ CRITICAL: Selling this player would leave the sector completely empty",
          "⚠️ This would severely weaken your team structure",
          "💰 Only consider if you have immediate replacement plans"
        ];
      }
      
      // Base value from role assessment (40% weight) - REVERSED LOGIC
      if (isStarter) {
        valueScore += 15; // Lower score for selling starters
        valueReasoning.push("High risk: Selling a starter");
      } else {
        valueScore += 40; // Higher score for selling bench players
        valueReasoning.push("Good opportunity: Selling a bench player");
      }
      
      // Category value (25% weight) - REVERSED LOGIC
      if (category === 'Young Star') {
        valueScore += 10; // Lower score for selling young stars
        valueReasoning.push("High risk: Selling a young star with potential");
      } else if (category === 'Veteran') {
        valueScore += 20; // Moderate score for selling veterans
        valueReasoning.push("Moderate risk: Selling an experienced veteran");
      } else if (category === 'Aging Player') {
        valueScore += 35; // Higher score for selling aging players
        valueReasoning.push("Good opportunity: Selling an aging player");
      } else {
        valueScore += 25; // Standard score for normal players
        valueReasoning.push("Standard opportunity: Selling a normal player");
      }
      
      // Impact value (20% weight) - REVERSED LOGIC
      const hasSignificantImpact = Object.keys(sectorChanges).length > 0 || Object.keys(positionChanges).length > 0;
      if (hasSignificantImpact) {
        valueScore += 10; // Lower score if removal hurts team
        valueReasoning.push("High risk: Removal hurts team structure");
      } else {
        valueScore += 20; // Higher score if removal doesn't hurt
        valueReasoning.push("Low risk: Removal doesn't hurt team structure");
      }
      
      // Price efficiency (15% weight) - REVERSED LOGIC
      let priceEfficiency = 0;
      if (budgetPercentage >= 50) {
        priceEfficiency = 15; // High score for high selling price
        valueReasoning.push("Excellent price: High return on investment");
      } else if (budgetPercentage >= 25) {
        priceEfficiency = 12; // Good score for good price
        valueReasoning.push("Good price: Reasonable return");
      } else if (budgetPercentage >= 10) {
        priceEfficiency = 8; // Moderate score for moderate price
        valueReasoning.push("Moderate price: Acceptable return");
      } else {
        priceEfficiency = 3; // Low score for low price
        valueReasoning.push("Low price: Poor return on investment");
      }
      valueScore += priceEfficiency;
      
      // Determine overall selling value assessment
      if (valueScore >= 80) {
        valueAssessment = 'Excellent Selling Opportunity';
        valueColor = 'text-green-400';
      } else if (valueScore >= 65) {
        valueAssessment = 'Good Selling Opportunity';
        valueColor = 'text-blue-400';
      } else if (valueScore >= 50) {
        valueAssessment = 'Fair Selling Opportunity';
        valueColor = 'text-yellow-400';
      } else if (valueScore >= 35) {
        valueAssessment = 'Poor Selling Opportunity';
        valueColor = 'text-orange-400';
      } else {
        valueAssessment = 'Bad Selling Opportunity';
        valueColor = 'text-red-400';
      }
      
      // Add selling-specific recommendations
      if (isStarter && budgetPercentage < 30) {
        valueReasoning.push("❌ Don't sell: Starter at low price");
      } else if (!isStarter && budgetPercentage >= 40) {
        valueReasoning.push("✅ Great deal: Bench player at high price");
      }
      
      if (category === 'Young Star' && budgetPercentage < 50) {
        valueReasoning.push("⚠️ Caution: Young star potential undervalued");
      }
      
    } else {
      // No budget set, calculate team impact only
      
      // Check for critical depth issues - automatic "Don't Sell"
      if (wouldLeavePositionEmpty) {
        valueScore = 0;
        valueAssessment = 'Critical: Would Leave Position Empty';
        valueColor = 'text-red-400';
        valueReasoning = [
          "❌ CRITICAL: Selling this player would leave the position completely empty",
          "⚠️ You must have at least one player at each position to play the game",
          "💰 No price is worth leaving a position empty"
        ];
        
        return {
          valueScore,
          valueAssessment,
          valueColor,
          valueReasoning,
          budgetPercentage,
          remainingBudget
        };
      }
      
      if (wouldLeaveSectorEmpty) {
        valueScore = 5;
        valueAssessment = 'Critical: Would Leave Sector Empty';
        valueColor = 'text-red-400';
        valueReasoning = [
          "❌ CRITICAL: Selling this player would leave the sector completely empty",
          "⚠️ This would severely weaken your team structure",
          "💰 Only consider if you have immediate replacement plans"
        ];
      }
      
      if (isStarter) {
        valueScore += 20; // Lower score for selling starters
        valueReasoning.push("High risk: Selling a starter");
      } else {
        valueScore += 50; // Higher score for selling bench players
        valueReasoning.push("Good opportunity: Selling a bench player");
      }
      
      if (category === 'Young Star') {
        valueScore += 15; // Lower score for selling young stars
        valueReasoning.push("High risk: Selling a young star with potential");
      } else if (category === 'Veteran') {
        valueScore += 25; // Moderate score for selling veterans
        valueReasoning.push("Moderate risk: Selling an experienced veteran");
      } else if (category === 'Aging Player') {
        valueScore += 40; // Higher score for selling aging players
        valueReasoning.push("Good opportunity: Selling an aging player");
      } else {
        valueScore += 30; // Standard score for normal players
        valueReasoning.push("Standard opportunity: Selling a normal player");
      }
      
      const hasSignificantImpact = Object.keys(sectorChanges).length > 0 || Object.keys(positionChanges).length > 0;
      if (hasSignificantImpact) {
        valueScore += 10; // Lower score if removal hurts team
        valueReasoning.push("High risk: Removal hurts team structure");
      } else {
        valueScore += 20; // Higher score if removal doesn't hurt
        valueReasoning.push("Low risk: Removal doesn't hurt team structure");
      }
      
      if (valueScore >= 80) {
        valueAssessment = 'Excellent Team Impact';
        valueColor = 'text-green-400';
      } else if (valueScore >= 65) {
        valueAssessment = 'Good Team Impact';
        valueColor = 'text-blue-400';
      } else if (valueScore >= 50) {
        valueAssessment = 'Fair Team Impact';
        valueColor = 'text-yellow-400';
      } else if (valueScore >= 35) {
        valueAssessment = 'Poor Team Impact';
        valueColor = 'text-orange-400';
      } else {
        valueAssessment = 'Bad Team Impact';
        valueColor = 'text-red-400';
      }
      
      valueReasoning.push("💰 Price analysis unavailable: Budget not set");
    }
    
    return {
      valueScore,
      valueAssessment,
      valueColor,
      valueReasoning,
      budgetPercentage,
      remainingBudget
    };
  };

  // Load players data
  useEffect(() => {
    fetch('/data/players.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load players data');
        }
        return response.json();
      })
      .then(players => {
        setAllPlayers(players);
      })
      .catch(error => {
        console.error('Error loading players:', error);
      });
  }, []);

  // Track trade calculator height for dynamic positioning
  useEffect(() => {
    if (tradeCalculatorRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setTradeCalculatorHeight(entry.contentRect.height);
        }
      });
      
      resizeObserver.observe(tradeCalculatorRef.current);
      
      return () => resizeObserver.disconnect();
    }
  }, [isGreenToggleOn, isRedToggleOn, isAnalyzing, showAnalyzeButton, selectedPlayer]);

  // Handle search query changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value) {
      const suggestions = allPlayers.filter(player => 
        player.long_name.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5); // Limit to 5 suggestions
      setPlayerSuggestions(suggestions);
    } else {
      setPlayerSuggestions([]);
    }
  };

  // Handle player selection
  const handlePlayerSelect = (player: any) => {
    setSelectedPlayer(player);
    setSearchQuery(player.long_name);
    setPlayerSuggestions([]);
    setShowAnalyzeButton(true);
    setPlayerAge('');
    setPlayerOverall('50');
    setPlayerPrice('');
    setPlayerPace('50');
    setPlayerShooting('50');
    setPlayerPassing('50');
    setPlayerDribbling('50');
    setPlayerDefending('50');
    setPlayerPhysical('50');
  };

  // Handle analyze button click
  const handleAnalyze = () => {
    if (selectedPlayer) {
      console.log('Analyzing player:', {
        name: selectedPlayer.name || selectedPlayer.long_name,
        age: selectedPlayer.age,
        position: selectedPlayer.mainPosition || selectedPlayer.player_positions?.[0] || 'Unknown',
        overall: selectedPlayer.overall
      });
      
      if (isGreenToggleOn) {
        // BUYING ANALYSIS (Green toggle)
        
        // Create attributes object from user input
        const playerAttributes = {
          pace: parseInt(playerPace) || 70,
          shooting: parseInt(playerShooting) || 70,
          passing: parseInt(playerPassing) || 70,
          dribbling: parseInt(playerDribbling) || 70,
          defending: parseInt(playerDefending) || 70,
          physical: parseInt(playerPhysical) || 70
        };
        
        // Calculate recommended role based on attributes and overall
        const recommendedRole = calculateRecommendedRole(
          parseInt(playerOverall) || selectedPlayer.overall,
          playerAttributes
        );
        
        // Create a mock player object for analysis
        const mockPlayer: Player = {
          id: 'mock-player',
          name: selectedPlayer.long_name,
          shortName: selectedPlayer.long_name.split(' ').slice(-1)[0],
          age: parseInt(playerAge) || selectedPlayer.age,
          nationality: selectedPlayer.nationality_name || 'Unknown',
          fifaCode: 'MOCK',
          mainPosition: selectedPlayer.player_positions?.[0] || 'Unknown',
          alternatePositions: selectedPlayer.player_positions?.slice(1) || [],
          role: recommendedRole, // Use calculated recommended role
          attributes: playerAttributes,
          overall: parseInt(playerOverall) || selectedPlayer.overall,
          potential: parseInt(playerOverall) || selectedPlayer.overall,
          preferred_foot: (selectedPlayer.preferred_foot as 'Left' | 'Right') || 'Right',
          stats: {
            goals: 0,
            assists: 0,
            redCards: 0,
            shots: 0,
            shotsOnTarget: 0
          }
        };
        
        // Analyze current team
        const currentAnalysis = analyzeTeam(players, positionCounts, positionPriorities, Array.from(toggledPositions));
        
        // Analyze team with new player
        const teamWithNewPlayer = [...players, mockPlayer];
        const newAnalysis = analyzeTeam(teamWithNewPlayer, positionCounts, positionPriorities, Array.from(toggledPositions));
        
        // If no tactics are configured, create a fallback analysis that includes all positions
        let fallbackAnalysis = null;
        if (positionCounts.length === 0) {
          // Create a basic position count that includes the player's position
          const fallbackPositionCounts = [{ position: mockPlayer.mainPosition, count: 1 }];
          fallbackAnalysis = analyzeTeam(teamWithNewPlayer, fallbackPositionCounts, positionPriorities, Array.from(toggledPositions));
        }
        
        // Determine if player would be starter or bench
        const playerPosition = mockPlayer.mainPosition;
        const currentBestXI = currentAnalysis.bestXI.find(xi => xi.position === playerPosition);
        
        // Calculate player rating for comparison
        const analysisToUse = fallbackAnalysis || newAnalysis;
        const playerRating = analysisToUse.bestXI.find(xi => xi.player.id === 'mock-player')?.rating || 0;
        const currentBestRating = currentBestXI?.rating || 0;
        
        // Debug logging
        console.log('Player Rating Debug:', {
          playerName: mockPlayer.name,
          position: mockPlayer.mainPosition,
          overall: mockPlayer.overall,
          age: mockPlayer.age,
          role: mockPlayer.role,
          attributes: mockPlayer.attributes,
          playerRating,
          currentBestRating,
          positionPriorities: positionPriorities.length,
          positionCounts: positionCounts.length
        });
        
        const isStarter = playerRating > currentBestRating;
        
        // Determine player category
        const avgAge = players.reduce((sum, p) => sum + p.age, 0) / players.length;
        const avgOverall = players.reduce((sum, p) => sum + p.overall, 0) / players.length;
        const ageStdDev = Math.sqrt(
          players.reduce((sum, p) => sum + Math.pow(p.age - avgAge, 2), 0) / players.length
        );
        
        let category = 'Normal';
        if (mockPlayer.age < avgAge - ageStdDev) {
          category = 'Young Star';
        } else if (mockPlayer.age > 30 && mockPlayer.overall > avgOverall) {
          category = 'Veteran';
        } else if (mockPlayer.age > avgAge + ageStdDev) {
          category = 'Aging Player';
        }
        
        // Compare sector and position strengths
        const sectorChanges: any = {};
        const positionChanges: any = {};
        
        // Safely compare sector strengths
        if (currentAnalysis.sectorStrengths && newAnalysis.sectorStrengths) {
          Object.keys(currentAnalysis.sectorStrengths).forEach(sector => {
            const currentSector = currentAnalysis.sectorStrengths[sector];
            const newSector = newAnalysis.sectorStrengths[sector];
            
            if (currentSector && newSector) {
              const currentCount = currentSector.count || 0;
              const newCount = newSector.count || 0;
              const currentMessage = currentSector.message || `Count: ${currentCount}`;
              const newMessage = newSector.message || `Count: ${newCount}`;
              
              if (currentMessage !== newMessage) {
                sectorChanges[sector] = {
                  before: currentMessage,
                  after: newMessage
                };
              }
            }
          });
        }
        
        // Safely compare position strengths
        if (currentAnalysis.positionStrengths && newAnalysis.positionStrengths) {
          Object.keys(currentAnalysis.positionStrengths).forEach(position => {
            const currentPosition = currentAnalysis.positionStrengths[position];
            const newPosition = newAnalysis.positionStrengths[position];
            
            if (currentPosition && newPosition) {
              const currentCount = currentPosition.count || 0;
              const newCount = newPosition.count || 0;
              const currentMessage = currentPosition.message || `Count: ${currentCount}`;
              const newMessage = newPosition.message || `Count: ${newCount}`;
              
              if (currentMessage !== newMessage) {
                positionChanges[position] = {
                  before: currentMessage,
                  after: newMessage
                };
              }
            }
          });
        }
        
        // Calculate buying value analysis
        const buyingValue = calculateBuyingValue(isStarter, category, sectorChanges, positionChanges, currentBudget, parseInt(playerPrice));
        
        setEvaluation({
          isStarter,
          category,
          sectorChanges,
          positionChanges,
          playerRating,
          currentBestRating,
          recommendedRole,
          ...buyingValue
        });
        
      } else if (isRedToggleOn) {
        // SELLING ANALYSIS (Red toggle)
        // Analyze current team
        const currentAnalysis = analyzeTeam(players, positionCounts, positionPriorities, Array.from(toggledPositions));
        
        // Analyze team without the player
        const teamWithoutPlayer = players.filter(p => p.id !== selectedPlayer.id);
        const newAnalysis = analyzeTeam(teamWithoutPlayer, positionCounts, positionPriorities, Array.from(toggledPositions));
        
        // Determine if player is currently a starter
        const currentBestXI = currentAnalysis.bestXI.find(xi => xi.player.id === selectedPlayer.id);
        const isStarter = !!currentBestXI;
        
        // Determine player category
        const avgAge = players.reduce((sum, p) => sum + p.age, 0) / players.length;
        const avgOverall = players.reduce((sum, p) => sum + p.overall, 0) / players.length;
        const ageStdDev = Math.sqrt(
          players.reduce((sum, p) => sum + Math.pow(p.age - avgAge, 2), 0) / players.length
        );
        
        let category = 'Normal';
        if (selectedPlayer.age < avgAge - ageStdDev) {
          category = 'Young Star';
        } else if (selectedPlayer.age > 30 && selectedPlayer.overall > avgOverall) {
          category = 'Veteran';
        } else if (selectedPlayer.age > avgAge + ageStdDev) {
          category = 'Aging Player';
        }
        
        // Compare sector and position strengths (impact of removal)
        const sectorChanges: any = {};
        const positionChanges: any = {};
        
        // Safely compare sector strengths
        if (currentAnalysis.sectorStrengths && newAnalysis.sectorStrengths) {
          Object.keys(currentAnalysis.sectorStrengths).forEach(sector => {
            const currentSector = currentAnalysis.sectorStrengths[sector];
            const newSector = newAnalysis.sectorStrengths[sector];
            
            if (currentSector && newSector) {
              const currentCount = currentSector.count || 0;
              const newCount = newSector.count || 0;
              const currentMessage = currentSector.message || `Count: ${currentCount}`;
              const newMessage = newSector.message || `Count: ${newCount}`;
              
              if (currentMessage !== newMessage) {
                sectorChanges[sector] = {
                  before: currentMessage,
                  after: newMessage
                };
              }
            }
          });
        }
        
        // Safely compare position strengths
        if (currentAnalysis.positionStrengths && newAnalysis.positionStrengths) {
          Object.keys(currentAnalysis.positionStrengths).forEach(position => {
            const currentPosition = currentAnalysis.positionStrengths[position];
            const newPosition = newAnalysis.positionStrengths[position];
            
            if (currentPosition && newPosition) {
              const currentCount = currentPosition.count || 0;
              const newCount = newPosition.count || 0;
              const currentMessage = currentPosition.message || `Count: ${currentCount}`;
              const newMessage = newPosition.message || `Count: ${newCount}`;
              
              if (currentMessage !== newMessage) {
                positionChanges[position] = {
                  before: currentMessage,
                  after: newMessage
                };
              }
            }
          });
        }
        
        // Check if selling would leave any position or sector empty
        const playerPosition = selectedPlayer.mainPosition;
        const currentPositionPlayers = players.filter(p => p.mainPosition === playerPosition);
        const wouldLeavePositionEmpty = currentPositionPlayers.length === 1;
        
        // Check sector impact
        const playerSector = Object.entries(SECTORS).find(([sector, positions]) => 
          positions.includes(playerPosition)
        )?.[0];
        const currentSectorPlayers = playerSector ? 
          players.filter(p => SECTORS[playerSector as keyof typeof SECTORS].includes(p.mainPosition)) : [];
        const wouldLeaveSectorEmpty = currentSectorPlayers.length === 1;
        
        // Calculate selling value analysis with depth protection
        const sellingValue = calculateSellingValue(
          isStarter, 
          category, 
          sectorChanges, 
          positionChanges, 
          currentBudget, 
          parseInt(playerPrice),
          wouldLeavePositionEmpty,
          wouldLeaveSectorEmpty
        );
        
        setEvaluation({
          isStarter,
          category,
          sectorChanges,
          positionChanges,
          playerRating: currentBestXI?.rating || 0,
          currentBestRating: 0,
          wouldLeavePositionEmpty,
          wouldLeaveSectorEmpty,
          ...sellingValue
        });
      }
      
      setIsAnalyzing(true);
    }
  };



  // Generate transfer suggestions based on team analysis
  const generateTransferSuggestions = () => {
    
    const suggestions: Array<{
      type: string;
      position: string;
      category: string;
      reason: string;
      priority: 'high' | 'medium' | 'low';
    }> = [];

    // Analyze current team structure
    const currentAnalysis = analyzeTeam(players, positionCounts, positionPriorities, Array.from(toggledPositions));
    
    // Check for missing starters
    const requiredPositions = ['GK', 'CB', 'RB', 'LB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST', 'CF'];
    const bestXIPositions = currentAnalysis.bestXI.map(xi => xi.position);
    
    requiredPositions.forEach(position => {
      if (!bestXIPositions.includes(position)) {
        suggestions.push({
          type: 'Starting',
          position,
          category: 'Any',
          reason: `No starter at ${position} position`,
          priority: 'high'
        });
      }
    });

    // Check position strengths for depth and age balance
    Object.entries(currentAnalysis.positionStrengths).forEach(([position, data]) => {
      const positionPlayers = players.filter(p => p.mainPosition === position);
      
      // Check for depth issues
      if (data.count < 2) {
        suggestions.push({
          type: 'Bench',
          position,
          category: 'Any',
          reason: `Only ${data.count} player(s) at ${position} - needs depth`,
          priority: 'medium'
        });
      }
      
      // Check for age balance issues
      if (data.count > 0) {
        const avgAge = positionPlayers.reduce((sum, p) => sum + p.age, 0) / positionPlayers.length;
        
        if (!data.hasProspect && avgAge > 28) {
          suggestions.push({
            type: 'Young Prospect',
            position,
            category: 'Young Star',
            reason: `${position} has no young prospects (avg age: ${avgAge.toFixed(1)})`,
            priority: 'medium'
          });
        }
        
        if (!data.hasVeteran && avgAge < 24) {
          suggestions.push({
            type: 'Veteran',
            position,
            category: 'Veteran',
            reason: `${position} has no experienced players (avg age: ${avgAge.toFixed(1)})`,
            priority: 'low'
          });
        }
        
        if (data.hasAging && !data.hasProspect) {
          suggestions.push({
            type: 'Young Prospect',
            position,
            category: 'Young Star',
            reason: `${position} has aging players but no young prospects`,
            priority: 'high'
          });
        }
      }
    });

    // Check sector strengths
    Object.entries(currentAnalysis.sectorStrengths).forEach(([sector, data]) => {
      if (data.count < 3) {
        const sectorPositions = sector === 'Defense' ? ['LB', 'CB', 'RB'] :
                               sector === 'Midfield' ? ['CDM', 'CM', 'CAM', 'LM', 'RM'] :
                               sector === 'Forward' ? ['LW', 'RW', 'ST'] : ['GK'];
        
        sectorPositions.forEach(position => {
          if (!suggestions.some(s => s.position === position && s.type === 'Starting')) {
            suggestions.push({
              type: 'Sector',
              position,
              category: 'Any',
              reason: `Weak ${sector} depth (${data.count} players)`,
              priority: 'medium'
            });
          }
        });
      }
    });

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  // Handle clicks outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const searchContainer = document.querySelector('[data-search-container]');
      
      if (searchContainer && !searchContainer.contains(target)) {
        setPlayerSuggestions([]);
      }
    };

    if (playerSuggestions.length > 0) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [playerSuggestions.length]);

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
              <h1 className="text-4xl font-bold text-[#dde1e0] font-mono tracking-wider">Transfer Market</h1>
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
          <div className="relative h-[calc(90vh-180px)]">
                          {/* Bar - Left Side */}
              <div className="absolute left-60 top-[60%] transform -translate-y-1/2 h-full">
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
                    {/* Tag Shape - Fixed size */}
                    <div className="bg-[#dde1e0] border-2 border-[#3c5c34] px-6 py-2 rounded-lg shadow-lg relative w-48 h-12">
                      {/* Tag Pointer - pointing horizontally from right side to red fill level */}
                      <div className="absolute right-0 top-1/2 transform translate-x-full -translate-y-1/2">
                        <div className="w-0 h-0 border-t-6 border-b-6 border-l-6 border-transparent border-l-[#3c5c34]"></div>
                        <div className="w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-[#dde1e0] absolute top-1 right-0.5"></div>
                      </div>
                      {/* Number Display - Dynamic sizing */}
                      <div className="flex items-center justify-center h-full">
                        <span 
                          className="text-[#3c5c34] font-mono font-bold leading-none"
                          style={{
                            fontSize: currentBudget > 0 ? 
                              Math.max(10, Math.min(28, 28 - (currentBudget.toString().length * 1.0))) + 'px' : 
                              '28px'
                          }}
                        >
                        {currentBudget > 0 ? `$${currentBudget.toLocaleString()}` : ''}
                      </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trade Calculator - Dynamic height based on toggle state */}
            <div ref={tradeCalculatorRef} className={`absolute left-85 top-16 right-85 bg-[#dde1e0]/10 backdrop-blur-sm rounded-lg shadow-lg border border-[#dde1e0]/20 transition-all duration-300 ${
              isAnalyzing ? 'h-full overflow-hidden' : 'h-auto overflow-visible'
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
                        if (isRedToggleOn) {
                          setIsRedToggleOn(false);
                          // Clear red toggle data
                          setSelectedPlayer(null);
                          setSearchQuery('');
                          setShowAnalyzeButton(false);
                          setPlayerPrice('');
                        }
                        setIsGreenToggleOn(!isGreenToggleOn);
                        // Clear green toggle data when turning off
                        if (isGreenToggleOn) {
                          setSelectedPlayer(null);
                          setSearchQuery('');
                          setPlayerSuggestions([]);
                          setShowAnalyzeButton(false);
                          setPlayerAge('');
                          setPlayerOverall('');
                          setPlayerPrice('');
                          setPlayerPace('');
                          setPlayerShooting('');
                          setPlayerPassing('');
                          setPlayerDribbling('');
                          setPlayerDefending('');
                          setPlayerPhysical('');
                          setIsAnalyzing(false);
                          setEvaluation(null);
                        }
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
                        if (isGreenToggleOn) {
                          setIsGreenToggleOn(false);
                          // Clear green toggle data
                          setSelectedPlayer(null);
                          setSearchQuery('');
                          setPlayerSuggestions([]);
                          setShowAnalyzeButton(false);
                          setPlayerAge('');
                          setPlayerOverall('');
                          setPlayerPrice('');
                          setPlayerPace('');
                          setPlayerShooting('');
                          setPlayerPassing('');
                          setPlayerDribbling('');
                          setPlayerDefending('');
                          setPlayerPhysical('');
                          setIsAnalyzing(false);
                          setEvaluation(null);
                        }
                        setIsRedToggleOn(!isRedToggleOn);
                        // Clear red toggle data when turning off
                        if (isRedToggleOn) {
                          setSelectedPlayer(null);
                          setSearchQuery('');
                          setShowAnalyzeButton(false);
                          setPlayerPrice('');
                          setIsAnalyzing(false);
                          setEvaluation(null);
                        }
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
              
              {/* Trade Calculator Content - Show search bar for green toggle, full content for red toggle, analyze mode */}
              {isGreenToggleOn && !isAnalyzing && (
              <div className="p-6">
                {/* Search Bar */}
                  <div className="relative" data-search-container>
                    <input
                      type="text"
                      placeholder="Search players..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="w-full px-4 py-3 bg-[#dde1e0]/20 border-2 border-[#a78968] rounded-lg text-[#dde1e0] font-mono placeholder-[#a8b8a7]/70 focus:outline-none focus:border-[#3c5c34] focus:bg-[#dde1e0]/30 transition-all duration-300"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <svg className="w-5 h-5 text-[#a8b8a7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    
                    {/* Player Suggestions - Positioned directly under search bar */}
                    {playerSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-[#dde1e0]/95 border border-[#a78968]/30 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {playerSuggestions.map((player, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handlePlayerSelect(player)}
                            className="w-full px-4 py-3 text-left text-[#3c5c34] hover:bg-[#a78968]/20 focus:outline-none font-mono border-b border-[#a78968]/10 last:border-b-0"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-semibold">{player.long_name}</span>
                              <span className="text-sm text-[#a78968]">
                                {player.player_positions?.[0] || 'Unknown'} • {player.overall || 'N/A'}
                              </span>
                  </div>
                            <div className="text-xs text-[#a78968] mt-1">
                              {player.nationality_name} • Age: {player.age || 'N/A'}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                </div>
                

                  
                  {/* Age, Overall, Price, and Attributes Input Fields */}
                  {showAnalyzeButton && selectedPlayer && (
                    <div className="mt-4 space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label htmlFor="age" className="block text-sm font-medium text-[#a78968] mb-2 font-mono">
                            Age
                          </label>
                          <input
                            type="number"
                            id="age"
                            min="18"
                            max="50"
                            value={playerAge}
                            onChange={(e) => setPlayerAge(e.target.value)}
                            className="w-full px-3 py-2 border border-[#a78968]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a78968] text-[#3c5c34] bg-[#dde1e0]/50 font-mono"
                            placeholder="Enter age"
                          />
                        </div>
                        <div>
                          <label htmlFor="overall" className="block text-sm font-medium text-[#a78968] mb-2 font-mono">
                            Overall
                          </label>
                          <input
                            type="number"
                            id="overall"
                            min="0"
                            max="99"
                            value={playerOverall}
                            onChange={(e) => setPlayerOverall(e.target.value)}
                            className="w-full px-3 py-2 border border-[#a78968]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a78968] text-[#3c5c34] bg-[#dde1e0]/50 font-mono"
                            placeholder="Enter overall"
                          />
                        </div>
                        <div>
                          <label htmlFor="price" className="block text-sm font-medium text-[#a78968] mb-2 font-mono">
                            Price ($)
                          </label>
                          <input
                            type="number"
                            id="price"
                            min="0"
                            max="1000000000"
                            value={playerPrice}
                            onChange={(e) => setPlayerPrice(e.target.value)}
                            className="w-full px-3 py-2 border border-[#a78968]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a78968] text-[#3c5c34] bg-[#dde1e0]/50 font-mono"
                            placeholder="Enter price"
                          />
                        </div>
                      </div>

                      {/* Six Main Attributes */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label htmlFor="pace" className="block text-sm font-medium text-[#a78968] mb-2 font-mono">
                            Pace
                          </label>
                          <input
                            type="number"
                            id="pace"
                            min="0"
                            max="99"
                            value={playerPace}
                            onChange={(e) => setPlayerPace(e.target.value)}
                            className="w-full px-3 py-2 border border-[#a78968]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a78968] text-[#3c5c34] bg-[#dde1e0]/50 font-mono"
                            placeholder="Enter pace"
                          />
                        </div>
                        <div>
                          <label htmlFor="shooting" className="block text-sm font-medium text-[#a78968] mb-2 font-mono">
                            Shooting
                          </label>
                          <input
                            type="number"
                            id="shooting"
                            min="0"
                            max="99"
                            value={playerShooting}
                            onChange={(e) => setPlayerShooting(e.target.value)}
                            className="w-full px-3 py-2 border border-[#a78968]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a78968] text-[#3c5c34] bg-[#dde1e0]/50 font-mono"
                            placeholder="Enter shooting"
                          />
                        </div>
                        <div>
                          <label htmlFor="passing" className="block text-sm font-medium text-[#a78968] mb-2 font-mono">
                            Passing
                          </label>
                          <input
                            type="number"
                            id="passing"
                            min="0"
                            max="99"
                            value={playerPassing}
                            onChange={(e) => setPlayerPassing(e.target.value)}
                            className="w-full px-3 py-2 border border-[#a78968]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a78968] text-[#3c5c34] bg-[#dde1e0]/50 font-mono"
                            placeholder="Enter passing"
                          />
                        </div>
                        <div>
                          <label htmlFor="dribbling" className="block text-sm font-medium text-[#a78968] mb-2 font-mono">
                            Dribbling
                          </label>
                          <input
                            type="number"
                            id="dribbling"
                            min="0"
                            max="99"
                            value={playerDribbling}
                            onChange={(e) => setPlayerDribbling(e.target.value)}
                            className="w-full px-3 py-2 border border-[#a78968]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a78968] text-[#3c5c34] bg-[#dde1e0]/50 font-mono"
                            placeholder="Enter dribbling"
                          />
                        </div>
                        <div>
                          <label htmlFor="defending" className="block text-sm font-medium text-[#a78968] mb-2 font-mono">
                            Defending
                          </label>
                          <input
                            type="number"
                            id="defending"
                            min="0"
                            max="99"
                            value={playerDefending}
                            onChange={(e) => setPlayerDefending(e.target.value)}
                            className="w-full px-3 py-2 border border-[#a78968]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a78968] text-[#3c5c34] bg-[#dde1e0]/50 font-mono"
                            placeholder="Enter defending"
                          />
                        </div>
                        <div>
                          <label htmlFor="physical" className="block text-sm font-medium text-[#a78968] mb-2 font-mono">
                            Physical
                          </label>
                          <input
                            type="number"
                            id="physical"
                            min="0"
                            max="99"
                            value={playerPhysical}
                            onChange={(e) => setPlayerPhysical(e.target.value)}
                            className="w-full px-3 py-2 border border-[#a78968]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a78968] text-[#3c5c34] bg-[#dde1e0]/50 font-mono"
                            placeholder="Enter physical"
                          />
                        </div>
                      </div>
                      
                      <button
                        onClick={handleAnalyze}
                        disabled={!playerAge || !playerOverall || !playerPrice || !playerPace || !playerShooting || !playerPassing || !playerDribbling || !playerDefending || !playerPhysical}
                        className={`w-full px-4 py-3 font-mono font-semibold rounded-lg transition-all duration-300 shadow-lg ${
                          playerAge && playerOverall && playerPrice && playerPace && playerShooting && playerPassing && playerDribbling && playerDefending && playerPhysical
                            ? 'bg-[#3c5c34] text-[#dde1e0] hover:bg-[#2a4a2a]'
                            : 'bg-[#a78968]/50 text-[#dde1e0]/50 cursor-not-allowed'
                        }`}
                      >
                        Analyze {selectedPlayer.long_name}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Analyze Mode Content */}
              {isAnalyzing && (
                <div className="p-6 h-[calc(100%-80px)] overflow-y-auto">


                  {/* Price Display */}
                  {selectedPlayer && playerPrice && (
                    <div className="mb-4 p-3 bg-[#3c5c34]/20 backdrop-blur-sm rounded-lg border border-[#3c5c34]/30">
                <div className="text-center">
                        <span className="text-[#dde1e0] font-mono font-semibold text-lg">
                          {isRedToggleOn ? 'Selling Price' : 'Purchase Price'}: ${parseInt(playerPrice).toLocaleString()}
                        </span>
                </div>
              </div>
                  )}

                  {/* Player Bar - Horizontal layout with only 5 saved traits */}
                  {selectedPlayer && (
                    <div className="bg-[#dde1e0]/10 backdrop-blur-sm p-4 rounded-lg shadow border border-[#dde1e0]/20">
                      {/* Attribute Headers */}
                      <div className="flex items-center mb-3">
                        <div className="w-1/2 flex items-center">
                          <div className="text-xs text-[#a8b8a7] font-mono">Name</div>
            </div>
                        <div className="w-1/2 flex justify-between items-center pr-8">
                          <div className="w-12 text-center text-xs text-[#a8b8a7] font-mono">Position</div>
                          <div className="w-8 text-center text-xs text-[#a8b8a7] font-mono">Age</div>
                          <div className="w-10 text-center text-xs text-[#a8b8a7] font-mono">Overall</div>
                          <div className="w-8 text-center text-xs text-[#a8b8a7] font-mono">Foot</div>
                        </div>
                      </div>

                      {/* Player Data Row */}
                      <div className="flex items-center">
                        <div className="w-1/2">
                          <span className="font-semibold text-[#dde1e0] font-mono">
                            {isGreenToggleOn ? selectedPlayer.long_name : selectedPlayer.name}
                          </span>
                        </div>
                        <div className="w-1/2 flex justify-between items-center pr-8">
                          <div className="w-12 text-center text-[#dde1e0] font-mono">
                            {isGreenToggleOn ? (selectedPlayer.player_positions?.[0] || 'Unknown') : (selectedPlayer.mainPosition || 'Unknown')}
                          </div>
                          <div className="w-8 text-center text-[#dde1e0] font-mono">
                            {isGreenToggleOn ? (playerAge || 'N/A') : selectedPlayer.age}
                          </div>
                          <div className="w-10 text-center font-medium text-[#a8b8a7] font-mono">
                            {isGreenToggleOn ? (playerOverall || 'N/A') : selectedPlayer.overall}
                          </div>
                          <div className="w-8 text-center text-[#dde1e0] font-mono">
                            {selectedPlayer.preferred_foot || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Team Fit Evaluation */}
                  {evaluation && (
                    <div className="mt-6 bg-[#dde1e0]/10 backdrop-blur-sm p-4 rounded-lg shadow border border-[#dde1e0]/20">
                      <h3 className="text-lg font-bold text-[#dde1e0] font-mono mb-4">
                        {isRedToggleOn ? 'Team Impact Analysis' : 'Team Fit Evaluation'}
                      </h3>
                      
                      {/* Role Assessment */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[#a8b8a7] font-mono">
                            {isRedToggleOn ? 'Current Role:' : 'Role Assessment:'}
                          </span>
                          <span className={`font-semibold font-mono ${
                            evaluation.isStarter ? 'text-green-400' : 'text-yellow-400'
                          }`}>
                            {evaluation.isStarter ? 'Starter' : 'Bench Player'}
                          </span>
                        </div>
                        {!isRedToggleOn && (
                          <div className="text-sm text-[#dde1e0] font-mono">
                            Rating: {evaluation.playerRating.toFixed(1)} vs Current Best: {evaluation.currentBestRating.toFixed(1)}
                          </div>
                        )}
                      </div>

                      {/* Player Category */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[#a8b8a7] font-mono">Player Category:</span>
                          <span className="font-semibold text-[#dde1e0] font-mono">{evaluation.category}</span>
                        </div>
                      </div>

                      {/* Recommended Role */}
                      {isGreenToggleOn && evaluation.recommendedRole && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[#a8b8a7] font-mono">Recommended Role:</span>
                            <span className="font-semibold text-[#dde1e0] font-mono">
                              {evaluation.recommendedRole === 'C' ? 'Crucial' :
                               evaluation.recommendedRole === 'I' ? 'Important' :
                               evaluation.recommendedRole === 'R' ? 'Rotation' :
                               evaluation.recommendedRole === 'S' ? 'Squad' : 'Prospect'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Depth Warnings for Selling */}
                      {isRedToggleOn && (evaluation.wouldLeavePositionEmpty || evaluation.wouldLeaveSectorEmpty) && (
                        <div className="mb-4 p-3 bg-red-500/20 rounded-lg border border-red-500/30">
                          <h4 className="text-red-400 font-mono font-semibold mb-2">⚠️ Critical Depth Warning</h4>
                          {evaluation.wouldLeavePositionEmpty && (
                            <div className="text-sm text-red-300 font-mono mb-1">
                              • Selling would leave position completely empty
                            </div>
                          )}
                          {evaluation.wouldLeaveSectorEmpty && (
                            <div className="text-sm text-red-300 font-mono mb-1">
                              • Selling would leave sector completely empty
                            </div>
                          )}
                        </div>
                      )}

                                              {/* Sector Impact */}
                        {Object.keys(evaluation.sectorChanges).length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-[#a8b8a7] font-mono font-semibold mb-2">
                              {isRedToggleOn ? 'Sector Impact (After Removal):' : 'Sector Impact:'}
                            </h4>
                            {Object.entries(evaluation.sectorChanges).map(([sector, change]: [string, any]) => (
                              <div key={sector} className="text-sm text-[#dde1e0] font-mono mb-1">
                                <span className="text-[#a8b8a7]">{sector}:</span> {change.before} → {change.after}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Position Impact */}
                        {Object.keys(evaluation.positionChanges).length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-[#a8b8a7] font-mono font-semibold mb-2">
                              {isRedToggleOn ? 'Position Impact (After Removal):' : 'Position Impact:'}
                            </h4>
                            {Object.entries(evaluation.positionChanges).map(([position, change]: [string, any]) => (
                              <div key={position} className="text-sm text-[#dde1e0] font-mono mb-1">
                                <span className="text-[#a8b8a7]">{position}:</span> {change.before} → {change.after}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* No Impact Message */}
                        {Object.keys(evaluation.sectorChanges).length === 0 && Object.keys(evaluation.positionChanges).length === 0 && (
                          <div className="text-sm text-[#a8b8a7] font-mono italic">
                            {isRedToggleOn ? 'No significant impact on team structure if removed.' : 'No significant changes to team structure detected.'}
                          </div>
                        )}

                                              {/* Value Analysis */}
                        <div className="mt-6 pt-4 border-t border-[#dde1e0]/20">
                          <h4 className="text-[#a8b8a7] font-mono font-semibold mb-3">
                            {isRedToggleOn ? 'Selling Value Analysis' : 'Value Analysis'}
                          </h4>
                          
                          {/* Overall Value Assessment */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[#a8b8a7] font-mono">
                                {isRedToggleOn ? 'Overall Selling Value:' : 'Overall Value:'}
                              </span>
                              <span className={`font-semibold font-mono ${evaluation.valueColor}`}>
                                {evaluation.valueAssessment} ({evaluation.valueScore?.toFixed(0) || '0'}/100)
                              </span>
                            </div>
                          </div>

                        {/* Budget Impact - Only show if budget is set */}
                        {currentBudget > 0 && (
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[#a8b8a7] font-mono">
                                {isRedToggleOn ? 'Budget Gain:' : 'Budget Impact:'}
                              </span>
                              <span className="font-semibold text-[#dde1e0] font-mono">
                                {evaluation.budgetPercentage?.toFixed(1) || '0.0'}% of current budget
                              </span>
                            </div>
                            <div className="text-sm text-[#dde1e0] font-mono">
                              {isRedToggleOn ? 'Budget after sale' : 'Remaining after purchase'}: ${evaluation.remainingBudget?.toLocaleString() || '0'}
                            </div>
                          </div>
                        )}

                        {/* Value Reasoning */}
                        <div className="mb-4">
                          <h5 className="text-[#a8b8a7] font-mono font-semibold mb-2">Value Factors:</h5>
                          <div className="space-y-1">
                            {evaluation.valueReasoning?.map((reason: string, index: number) => (
                              <div key={index} className="text-sm text-[#dde1e0] font-mono flex items-start">
                                <span className="mr-2">•</span>
                                <span>{reason}</span>
                              </div>
                            )) || []}
                          </div>
                        </div>

                                                  {/* Recommendation */}
                          <div className="mt-4 p-3 bg-[#3c5c34]/20 rounded-lg border border-[#3c5c34]/30">
                            <div className="text-center">
                              <span className={`font-semibold font-mono text-lg ${evaluation.valueColor}`}>
                                {isRedToggleOn ? 
                                  ((evaluation.valueScore || 0) >= 65 ? '✅ SELL' : (evaluation.valueScore || 0) >= 50 ? '🤔 CONSIDER SELLING' : '❌ DON\'T SELL') :
                                  ((evaluation.valueScore || 0) >= 65 ? '✅ RECOMMENDED' : (evaluation.valueScore || 0) >= 50 ? '🤔 CONSIDER' : '❌ NOT RECOMMENDED')
                                }
                              </span>
                            </div>
                          </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isRedToggleOn && !isAnalyzing && (
                <div className="p-6">
                  {/* Player Selection Dropdown */}
                  <div className="mb-6">
                    <label htmlFor="playerSelect" className="block text-sm font-medium text-[#644d36] mb-2 font-mono">
                      Select Player to Sell
                    </label>
                    <div className="relative">
                      <select
                        id="playerSelect"
                        value={selectedPlayer?.id || ''}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          const player = players.find(p => p.id === selectedId);
                          if (player) {
                            setSelectedPlayer(player);
                            setSearchQuery(player.name);
                            setShowAnalyzeButton(true);
                            setPlayerAge('');
                            setPlayerOverall('');
                            setPlayerPrice('');
                          }
                        }}
                        className="w-full px-4 py-2 border border-[#a8b8a7]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a8b8a7] text-[#3c5c34] bg-[#dde1e0]/50 font-mono"
                      >
                        <option value="">Select a player from your team...</option>
                        {players.map((player) => (
                          <option key={player.id} value={player.id}>
                            {player.name} - {player.mainPosition} - Age: {player.age} - Overall: {player.overall}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Price Input Field */}
                  {showAnalyzeButton && selectedPlayer && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <label htmlFor="sellPrice" className="block text-sm font-medium text-[#644d36] mb-2 font-mono">
                          Selling Price ($)
                        </label>
                        <input
                          type="number"
                          id="sellPrice"
                          min="0"
                          max="1000000000"
                          value={playerPrice}
                          onChange={(e) => setPlayerPrice(e.target.value)}
                          className="w-full px-3 py-2 border border-[#a78968]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a78968] text-[#3c5c34] bg-[#dde1e0]/50 font-mono"
                          placeholder="Enter selling price"
                        />
                      </div>
                      
                      <button
                        onClick={handleAnalyze}
                        disabled={!playerPrice}
                        className={`w-full px-4 py-3 font-mono font-semibold rounded-lg transition-all duration-300 shadow-lg ${
                          playerPrice
                            ? 'bg-[#3c5c34] text-[#dde1e0] hover:bg-[#2a4a2a]'
                            : 'bg-[#a78968]/50 text-[#dde1e0]/50 cursor-not-allowed'
                        }`}
                      >
                        Analyze Selling {selectedPlayer.name}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Transfer Suggestions Box */}
            <div 
              className="absolute left-85 right-85 bg-[#dde1e0]/10 backdrop-blur-sm rounded-lg shadow-lg border border-[#dde1e0]/20 transition-all duration-150"
              style={{ 
                top: `calc(64px + 16px + ${tradeCalculatorHeight}px + (${tradeCalculatorHeight}px * 0.5))` 
              }}
            >
              <div className="p-6">
                <h3 className="text-xl font-bold text-[#dde1e0] font-mono tracking-wider mb-4">Transfer Suggestions</h3>
                
                {generateTransferSuggestions().length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {generateTransferSuggestions().map((suggestion, index) => (
                      <div key={index} className="bg-[#dde1e0]/20 backdrop-blur-sm p-3 rounded-lg border border-[#a78968]/30">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded text-xs font-mono font-semibold ${
                              suggestion.priority === 'high' 
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                                : suggestion.priority === 'medium'
                                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            }`}>
                              {suggestion.priority.toUpperCase()}
                            </span>
                            <span className="text-[#dde1e0] font-mono font-semibold">
                              {suggestion.type} {suggestion.position}
                            </span>
          </div>
                          <span className="text-[#a78968] font-mono text-sm">
                            {suggestion.category}
                          </span>
                        </div>
                        <p className="text-[#dde1e0] font-mono text-sm">
                          {suggestion.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-[#a78968] font-mono italic">
                      No transfer suggestions available. Your team appears to be well-balanced!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="absolute -right-5 top-16 w-80 bg-[#dde1e0]/10 backdrop-blur-sm rounded-lg shadow-lg border border-[#dde1e0]/20">
              <div className="p-6">
                <h3 className="text-xl font-bold text-[#dde1e0] font-mono tracking-wider mb-4">Shortlist</h3>
                
                {/* Shortlist content will go here */}
                <div className="text-center py-8">
                  <p className="text-[#a78968] font-mono italic">
                    Shortlist functionality coming soon...
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
} 