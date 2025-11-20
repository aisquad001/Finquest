/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { LessonPlayer } from './components/LessonPlayer';
import { WorldLevelMap } from './components/WorldLevelMap';
import { Onboarding } from './components/Onboarding';
import { WallStreetZoo } from './components/WallStreetZoo';
import { playSound } from './services/audio';
import { 
    UserState, 
    loadUser, 
    saveUser, 
    createInitialUser, 
    ShopItem,
    WORLDS_METADATA,
    WorldData,
    Portfolio
} from './services/gamification';
import { GET_WORLD_LEVELS, GameLevel } from './services/content';

const App: React.FC = () => {
  // Global User State
  const [user, setUser] = useState<UserState | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(true);
  
  // Navigation State
  const [view, setView] = useState<'dashboard' | 'map' | 'lesson' | 'zoo'>('dashboard');
  const [activeWorld, setActiveWorld] = useState<WorldData | null>(null);
  const [activeLevel, setActiveLevel] = useState<GameLevel | null>(null);

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

  // Navigation Handlers
  const handleOpenWorld = (worldId: string) => {
      const world = WORLDS_METADATA.find(w => w.id === worldId);
      if (world) {
          setActiveWorld(world);
          setView('map');
          playSound('pop');
      }
  };

  const handleSelectLevel = (levelId: string) => {
      if (!activeWorld) return;
      const levels = GET_WORLD_LEVELS(activeWorld.id);
      const level = levels.find(l => l.id === levelId);
      
      if (level) {
          setActiveLevel(level);
          setView('lesson');
          playSound('pop');
      }
  };

  const handleOpenZoo = () => {
      if (user && user.level >= 20) { // Strict check, though user starts at 21 in this version
          setView('zoo');
          playSound('pop');
      } else {
          playSound('error');
          alert("Requires Level 20!");
      }
  };

  const handleCloseMap = () => {
      setActiveWorld(null);
      setView('dashboard');
  };

  const handleCloseLesson = () => {
      setActiveLevel(null);
      setView('map');
  };

  const handleCloseZoo = () => {
      setView('dashboard');
  };

  const handleLevelComplete = (xp: number, coins: number) => {
      if (!user || !activeLevel) return;

      setUser(prev => {
          if (!prev) return null;
          
          const newXp = prev.xp + xp;
          const newCoins = prev.coins + coins;
          
          // Check for level up
          let newLevel = prev.level;
          // Simple incremental check for demo purposes
          if (newXp > prev.level * 500) { 
             // In a real app, check against the quadratic formula
             newLevel += 1;
          }

          const newCompletedLevels = !prev.completedLevels.includes(activeLevel.id)
            ? [...prev.completedLevels, activeLevel.id]
            : prev.completedLevels;

          return {
              ...prev,
              xp: newXp,
              coins: newCoins,
              level: newLevel,
              completedLevels: newCompletedLevels
          };
      });

      handleCloseLesson();
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

  const handleUpdatePortfolio = (newPortfolio: Portfolio) => {
      setUser(prev => {
          if (!prev) return null;
          return { ...prev, portfolio: newPortfolio };
      });
  };

  if (showOnboarding) {
      return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (!user) return null;

  return (
    <div className="min-h-[100dvh] bg-[#1a0b2e] text-white overflow-x-hidden font-body selection:bg-neon-pink selection:text-white relative">
      
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
           <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-neon-purple/10 rounded-full blur-[120px] mix-blend-screen"></div>
           <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-neon-blue/10 rounded-full blur-[120px] mix-blend-screen"></div>
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
      </div>
      
      {/* Views */}
      <div className="relative z-10">
          {view === 'dashboard' && (
            <Dashboard 
                user={user} 
                onOpenWorld={handleOpenWorld}
                onClaimReward={handleClaimReward}
                onBuyItem={handleBuyItem}
                onOpenZoo={handleOpenZoo}
            />
          )}
          
          {view === 'map' && activeWorld && (
              <WorldLevelMap 
                  world={activeWorld}
                  completedLevels={user.completedLevels}
                  onClose={handleCloseMap}
                  onSelectLevel={handleSelectLevel}
              />
          )}

          {view === 'lesson' && activeLevel && (
              <LessonPlayer 
                  level={activeLevel}
                  onClose={handleCloseLesson}
                  onComplete={handleLevelComplete}
              />
          )}

          {view === 'zoo' && user.portfolio && (
              <WallStreetZoo 
                  portfolio={user.portfolio}
                  onUpdatePortfolio={handleUpdatePortfolio}
                  onClose={handleCloseZoo}
              />
          )}
      </div>

    </div>
  );
};

export default App;