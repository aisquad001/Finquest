
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
import { PortalDashboard } from './components/PortalDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { PremiumModal } from './components/PremiumModal';
import { playSound } from './services/audio';
import { trackEvent } from './services/analytics';
import { 
    UserState, 
    loadUser, 
    saveUser, 
    createInitialUser, 
    ShopItem,
    WORLDS_METADATA,
    WorldData,
    Portfolio,
    checkStreak,
    Challenge
} from './services/gamification';
import { requestNotificationPermission, scheduleDemoNotifications } from './services/notifications';
import { GET_WORLD_LEVELS, GameLevel } from './services/content';

const App: React.FC = () => {
  // Global User State
  const [user, setUser] = useState<UserState | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  
  // Navigation State
  const isPortalRoute = window.location.pathname === '/portal';
  const isAdminRoute = window.location.pathname === '/admin';
  
  const [view, setView] = useState<'dashboard' | 'map' | 'lesson' | 'zoo' | 'portal' | 'admin'>(
      isAdminRoute ? 'admin' : isPortalRoute ? 'portal' : 'dashboard'
  );
  const [activeWorld, setActiveWorld] = useState<WorldData | null>(null);
  const [activeLevel, setActiveLevel] = useState<GameLevel | null>(null);

  // Theme Effect: Switch body class based on view
  useEffect(() => {
      document.body.classList.remove('portal-mode', 'game-mode', 'admin-mode');
      if (view === 'portal') {
          document.body.classList.add('portal-mode');
      } else if (view === 'admin') {
          document.body.classList.add('admin-mode');
      } else {
          document.body.classList.add('game-mode');
      }
      
      if (user) {
          trackEvent('view_changed', { view });
      }
  }, [view, user]);

  // Load progress & Streak Logic
  useEffect(() => {
    const loadedUser = loadUser();
    if (loadedUser) {
        // Run Streak Check Logic
        const { updatedUser, savedByFreeze, broken } = checkStreak(loadedUser);
        setUser(updatedUser);
        setShowOnboarding(false);

        if (view !== 'portal' && view !== 'admin') {
            if (savedByFreeze) {
                alert("❄️ STREAK FROZEN! Your streak was saved by a freeze item.");
            } else if (broken) {
                alert("💔 STREAK LOST! You missed a day. Start again!");
            }

            // Initial Notification Prompt (Simulated)
            setTimeout(() => {
                requestNotificationPermission().then(granted => {
                    if (granted) scheduleDemoNotifications();
                });
            }, 3000);
        }
        
        trackEvent('session_start', { level: updatedUser.level, streak: updatedUser.streak });

    } else {
        if (view !== 'portal' && view !== 'admin') {
             setShowOnboarding(true);
        }
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
      trackEvent('signup_complete', { path: newUser.avatar.outfit }); // Simplified tracking
      // Prompt for notifications
      requestNotificationPermission().then(granted => {
          if (granted) scheduleDemoNotifications();
      });
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
      if (user && user.level >= 20) {
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
      
      // 2x Boost logic check (mocked)
      const finalXp = user.subscriptionStatus === 'pro' ? xp * 2 : xp;

      setUser(prev => {
          if (!prev) return null;
          
          const newXp = prev.xp + finalXp;
          const newCoins = prev.coins + coins;
          
          let newLevel = prev.level;
          // Simple check for demo level up
          if (newXp > prev.level * 500) { 
             newLevel += 1;
          }

          const newCompletedLevels = !prev.completedLevels.includes(activeLevel.id)
            ? [...prev.completedLevels, activeLevel.id]
            : prev.completedLevels;

          // Update Daily Challenge (Medium)
          const updatedChallenges = prev.dailyChallenges.map(c => 
              (c.difficulty === 'medium' && !c.completed) 
              ? { ...c, completed: true } 
              : c
          );

          return {
              ...prev,
              xp: newXp,
              coins: newCoins,
              level: newLevel,
              completedLevels: newCompletedLevels,
              dailyChallenges: updatedChallenges
          };
      });

      trackEvent('level_complete', { levelId: activeLevel.id, xpEarned: finalXp });
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
          // Special logic for Streak Freeze
          const newStreakFreezes = item.id === 'item_freeze' ? (prev.streakFreezes || 0) + 1 : prev.streakFreezes;
          
          return {
              ...prev,
              coins: prev.coins - item.cost,
              streakFreezes: newStreakFreezes,
              inventory: [...prev.inventory, item.id]
          };
      });
      trackEvent('purchase_item', { itemId: item.id, cost: item.cost });
  };

  const handleUpdatePortfolio = (newPortfolio: Portfolio) => {
      setUser(prev => {
          if (!prev) return null;
          
          // Update Daily Challenge (Hard) if a trade happened
          const updatedChallenges = prev.dailyChallenges.map(c => 
            (c.difficulty === 'hard' && !c.completed)
            ? { ...c, completed: true }
            : c
          );

          return { 
              ...prev, 
              portfolio: newPortfolio,
              dailyChallenges: updatedChallenges
          };
      });
  };

  const handleUpgrade = () => {
      setUser(prev => prev ? ({ ...prev, subscriptionStatus: 'pro' }) : null);
      trackEvent('upgrade_pro', { source: 'modal' });
  };

  // Portal View Renders differently (no background effects)
  if (view === 'portal') {
      return <PortalDashboard childData={user} onExit={() => {
          window.history.pushState({}, '', '/');
          setView('dashboard');
      }} />;
  }

  // Admin View
  if (view === 'admin') {
      return <AdminDashboard onExit={() => {
          window.history.pushState({}, '', '/');
          setView('dashboard');
      }} />;
  }

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
                onOpenPremium={() => setShowPremiumModal(true)}
                onOpenAdmin={() => { window.history.pushState({}, '', '/admin'); setView('admin'); }}
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
      
      {/* Secret Portal Link (Bottom Footer) */}
      <div className="relative z-10 text-center pb-4 text-white/10 text-xs uppercase font-bold cursor-pointer hover:text-white/50 transition-colors">
          <span onClick={() => { window.history.pushState({}, '', '/portal'); setView('portal'); }}>Teacher / Parent Portal</span>
      </div>

      {/* Premium Modal */}
      {showPremiumModal && (
          <PremiumModal 
             onClose={() => setShowPremiumModal(false)} 
             onUpgrade={handleUpgrade}
          />
      )}

    </div>
  );
};

export default App;
