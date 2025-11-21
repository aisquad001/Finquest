
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
import { VisualEffects } from './components/VisualEffects';
import { playSound } from './services/audio';
import { trackEvent } from './services/analytics';
import { 
    UserState, 
    ShopItem,
    WORLDS_METADATA,
    WorldData,
    Portfolio,
    createInitialUser
} from './services/gamification';
import { requestNotificationPermission, scheduleDemoNotifications } from './services/notifications';
import { GET_WORLD_LEVELS, GameLevel } from './services/content';

// STORE & DB IMPORTS
import { useUserStore } from './services/useUserStore';
import { addXP, addCoins, purchaseItem, processDailyStreak } from './services/gameLogic';
import { auth, signInWithGoogle, signInAsGuest } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { createUserDoc } from './services/db';

const App: React.FC = () => {
  // Global State from Zustand
  const { user, loading: storeLoading, syncUser, clearUser } = useUserStore();
  
  // UI State
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  
  // Navigation State
  const isPortalRoute = window.location.pathname === '/portal';
  const isAdminRoute = window.location.pathname === '/admin';
  
  const [view, setView] = useState<'dashboard' | 'map' | 'lesson' | 'zoo' | 'portal' | 'admin'>(
      isAdminRoute ? 'admin' : isPortalRoute ? 'portal' : 'dashboard'
  );
  const [activeWorld, setActiveWorld] = useState<WorldData | null>(null);
  const [activeLevel, setActiveLevel] = useState<GameLevel | null>(null);

  // AUTH & SYNC LISTENER
  useEffect(() => {
      let unsubscribeSync: () => void;

      // 1. Firebase Listener (Real Auth)
      const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
              // Clean up any previous sync
              if (unsubscribeSync) unsubscribeSync();

              // Connect Store to Firestore
              unsubscribeSync = syncUser(firebaseUser.uid);
              
              // Request Notifications
              requestNotificationPermission().then(granted => {
                  if (granted) scheduleDemoNotifications();
              });
          } else {
              // If not firebase user, check if we have a local mock session
              const mockUid = localStorage.getItem('finquest_mock_session_uid');
              if (mockUid) {
                  console.log("Restoring Mock Session:", mockUid);
                  unsubscribeSync = syncUser(mockUid);
              } else {
                  clearUser();
                  if (unsubscribeSync) unsubscribeSync();
                  // Trigger onboarding if not in special routes
                  if (window.location.pathname === '/') setShowOnboarding(true);
              }
          }
      });

      return () => {
          unsubscribeAuth();
          if (unsubscribeSync) unsubscribeSync();
      };
  }, []);

  // POST-SYNC LOGIC (Streaks & Loading)
  useEffect(() => {
      if (user && user.uid) {
          setShowOnboarding(false);
          processDailyStreak(user.uid, user);
      }
  }, [user?.uid]); // Only run when UID is confirmed

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

  const handleCloseMap = () => {
      setActiveWorld(null);
      setView('dashboard');
  };

  const handleCloseLesson = () => {
      setActiveLevel(null);
      setView('map');
  };

  const handleLevelComplete = (xp: number, coins: number) => {
      if (!user || !user.uid) return;
      
      const finalXp = user.subscriptionStatus === 'pro' ? xp * 2 : xp;
      
      // Call Atomic Logic
      addXP(user.uid, finalXp, user.level);
      addCoins(user.uid, coins, 'Level Complete');
      
      // Note: user object updates automatically via store sync
      trackEvent('level_complete', { levelId: activeLevel?.id, xpEarned: finalXp });
      handleCloseLesson();
  };

  const handleClaimReward = (xp: number, coins: number) => {
      if (user?.uid) {
        addXP(user.uid, xp, user.level);
        addCoins(user.uid, coins, 'Reward');
      }
  };

  const handleBuyItem = async (item: ShopItem) => {
      if (!user?.uid) return;
      await purchaseItem(user.uid, item.id, item.cost, user.coins);
      trackEvent('purchase_item', { itemId: item.id, cost: item.cost });
  };

  const handleOnboardingAuth = async (data: any) => {
      console.log("Handle Onboarding Auth:", data);
      try {
          let firebaseUser;
          
          // Strict check for Auth Method
          if (data.authMethod === 'guest') {
              console.log("Attempting Guest Login...");
              firebaseUser = await signInAsGuest();
          } else if (data.authMethod === 'google') {
              // Default to Google if not guest
              console.log("Attempting Google Login...");
              firebaseUser = await signInWithGoogle();
          } else {
              console.error("Unknown auth method:", data.authMethod);
              throw new Error("Unknown authentication method");
          }

          if (firebaseUser) {
              console.log("User authenticated:", firebaseUser.uid);
              
              try {
                  // Create Doc - Store will pick it up automatically via sync
                  await createUserDoc(firebaseUser.uid, { 
                      ...data, 
                      email: firebaseUser.email || `guest_${firebaseUser.uid.substring(0,6)}@finquest.app` 
                  });

                  // IMPORTANT: If this is a mock user, we must manually store session and trigger sync
                  // because onAuthStateChanged won't fire.
                  if (firebaseUser.uid.startsWith('mock_')) {
                      localStorage.setItem('finquest_mock_session_uid', firebaseUser.uid);
                      syncUser(firebaseUser.uid);
                  }

                  setShowOnboarding(false);
              } catch (dbError) {
                  console.error("DB Profile Creation Failed:", dbError);
                  throw new Error("Authentication successful, but profile creation failed. Please try again.");
              }
          } else {
              throw new Error("Authentication failed - no user returned");
          }
      } catch (error: any) {
          console.error("Signup Failed:", error);
          // Re-throw so Onboarding component handles the UI state (resetting buttons)
          throw error;
      }
  };

  // --- RENDER ---

  if (view === 'portal') {
      return <PortalDashboard childData={user} onExit={() => {
          window.history.pushState({}, '', '/');
          setView('dashboard');
      }} />;
  }

  if (view === 'admin') {
      return <AdminDashboard onExit={() => {
          window.history.pushState({}, '', '/');
          setView('dashboard');
      }} />;
  }

  // Initial Loading
  if (storeLoading && !user) {
      return (
          <div className="min-h-screen bg-[#1a0b2e] flex items-center justify-center">
              <div className="flex flex-col items-center animate-pulse">
                  <div className="text-6xl mb-4 animate-bounce">💸</div>
                  <h2 className="font-game text-white text-2xl">SYNCING RICHES...</h2>
              </div>
          </div>
      );
  }

  // Onboarding
  if (showOnboarding || !user) {
      return <Onboarding onComplete={handleOnboardingAuth} />;
  }

  return (
    <div className="min-h-[100dvh] bg-[#1a0b2e] text-white overflow-x-hidden font-body selection:bg-neon-pink selection:text-white relative">
      
      <VisualEffects />

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
           <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-neon-purple/10 rounded-full blur-[120px] mix-blend-screen"></div>
           <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-neon-blue/10 rounded-full blur-[120px] mix-blend-screen"></div>
      </div>
      
      {/* Views */}
      <div className="relative z-10">
          {view === 'dashboard' && (
            <Dashboard 
                user={user} 
                onOpenWorld={handleOpenWorld}
                onClaimReward={handleClaimReward}
                onBuyItem={handleBuyItem}
                onOpenZoo={() => { if(user.level >= 20) setView('zoo'); else alert("Level 20 Required!"); }}
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
                  onUpdatePortfolio={() => {}} // Handled via internal transactions in future update
                  onClose={() => setView('dashboard')}
              />
          )}
      </div>
      
      {/* Premium Modal */}
      {showPremiumModal && (
          <PremiumModal 
             onClose={() => setShowPremiumModal(false)} 
             onUpgrade={() => {}} // Store updates automatically
          />
      )}

    </div>
  );
};

export default App;
