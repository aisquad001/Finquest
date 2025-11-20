
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { LivePreview } from './components/LivePreview';
import { Onboarding } from './components/Onboarding';
import { generateLesson, LessonData } from './services/gemini';
import { playSound } from './services/audio';
import { 
    UserState, 
    loadUser, 
    saveUser, 
    createInitialUser, 
    WORLDS,
    ShopItem
} from './services/gamification';

const App: React.FC = () => {
  // Global User State
  const [user, setUser] = useState<UserState | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(true);
  
  // Content State
  const [activeLesson, setActiveLesson] = useState<LessonData | null>(null);
  const [currentWorldId, setCurrentWorldId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load progress on mount
  useEffect(() => {
    const loadedUser = loadUser();
    if (loadedUser) {
        setUser(loadedUser);
        setShowOnboarding(false);
    } else {
        setShowOnboarding(true);
    }
  }, []);

  // Save progress whenever user state changes
  useEffect(() => {
    if (user) {
        saveUser(user);
    }
  }, [user]);

  const handleOnboardingComplete = (data: any) => {
      const newUser = createInitialUser(data);
      setUser(newUser);
      setShowOnboarding(false);
  };

  const handlePlayWorld = async (worldId: string, prompt: string) => {
      if (!user) return;
      setIsGenerating(true);
      setCurrentWorldId(worldId);
      
      // Simulate minimal loading time for feel + loading animation
      const minLoad = new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
          // Personalize prompt
          const personalizedPrompt = `${prompt}. Address the user as ${user.nickname}. Make it relatable for a level ${user.level} player.`;
          const [lesson] = await Promise.all([generateLesson(personalizedPrompt), minLoad]);
          setActiveLesson(lesson);
          playSound('success');
      } catch (err) {
          console.error("Failed generation", err);
          setActiveLesson(null);
      } finally {
          setIsGenerating(false);
      }
  };

  const handleLessonComplete = (earnedXp: number) => {
      if (!user) return;
      
      // Calculate rewards
      const earnedCoins = Math.floor(earnedXp * 0.5); // 1 XP = 0.5 Coins roughly
      
      setUser(prev => {
          if (!prev) return null;
          
          const newXp = prev.xp + earnedXp;
          const newCoins = prev.coins + earnedCoins;
          
          // Simple level up check (Visual handled in Dashboard bar usually, but we update state here)
          // Note: Real level up logic would be more complex with the formula, 
          // but for now we just increment XP. Level is derived or explicitly stored.
          // Let's increment level if XP crosses threshold of current level * 1000 (Simplified for now to match old logic)
          // or use the new gamification service formula if we wanted to recalculate level.
          // For safety, let's just keep level explicit.
          
          let newLevel = prev.level;
          const xpThreshold = 100 * Math.pow(prev.level, 2) + prev.xp; // Dynamic threshold
          // Actually, let's just use a simple milestone check for this demo
          if (newXp > prev.level * 500) {
              newLevel += 1;
              playSound('levelup');
          }

          const newCompletedWorlds = (currentWorldId && !prev.completedWorlds.includes(currentWorldId))
            ? [...prev.completedWorlds, currentWorldId]
            : prev.completedWorlds;

          return {
              ...prev,
              xp: newXp,
              coins: newCoins,
              level: newLevel,
              completedWorlds: newCompletedWorlds
          };
      });

      setActiveLesson(null);
      setCurrentWorldId(null);
  };

  const handleClaimReward = (xp: number, coins: number) => {
      setUser(prev => {
          if (!prev) return null;
          return {
              ...prev,
              xp: prev.xp + xp,
              coins: prev.coins + coins
          };
      });
  };

  const handleBuyItem = (item: ShopItem) => {
      setUser(prev => {
          if (!prev) return null;
          return {
              ...prev,
              coins: prev.coins - item.cost,
              inventory: [...prev.inventory, item.id]
          };
      });
  };

  const handleCloseLesson = () => {
      setActiveLesson(null);
      setCurrentWorldId(null);
  };

  if (showOnboarding) {
      return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (!user) return null; // Loading state if needed

  return (
    <div className="min-h-[100dvh] bg-[#1a0b2e] text-white overflow-x-hidden font-body selection:bg-neon-pink selection:text-white relative">
      
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
           <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-neon-purple/10 rounded-full blur-[120px] mix-blend-screen"></div>
           <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-neon-blue/10 rounded-full blur-[120px] mix-blend-screen"></div>
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
      </div>
      
      {/* Main App Content */}
      <div className="relative z-10">
          <Dashboard 
            user={user} 
            onPlayWorld={handlePlayWorld}
            onClaimReward={handleClaimReward}
            onBuyItem={handleBuyItem}
          />
      </div>

      {/* Game Level Overlay */}
      <LivePreview
        lesson={activeLesson}
        isLoading={isGenerating}
        onClose={handleCloseLesson}
        onComplete={handleLessonComplete}
      />
    </div>
  );
};

export default App;
