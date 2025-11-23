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
import { ProfileSetup } from './components/ProfileSetup';
import { playSound } from './services/audio';
import { trackEvent } from './services/analytics';
import { 
    WORLDS_METADATA,
    WorldData,
    UserState
} from './services/gamification';
import { requestNotificationPermission, scheduleDemoNotifications } from './services/notifications';

// STORE & DB IMPORTS
import { useUserStore } from './services/useUserStore';
import { addXP, addCoins, purchaseItem, processDailyStreak, checkWorldCompletion, triggerVisualEffect } from './services/gameLogic';
import { auth, signInWithGoogle, signInAsGuest, logout, subscribeToAuthChanges } from './services/firebase';
import { createUserDoc, saveLevelProgress, updateUser } from './services/db';
import { logger } from './services/logger';

const App: React.FC = () => {
  // Global State
  const { user, loading: storeLoading, error: storeError, syncUser, clearUser, setError, setUser, setLoading } = useUserStore();
  
  // UI State
  const [showOnboarding, setShowOnboarding] = useState(true); // Default to true until auth check
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [domainStatus, setDomainStatus] = useState<'correct' | 'old' | 'localhost'>('correct');
  const [isTargetReady, setIsTargetReady] = useState(false);

  // ROUTING FIX: Support query param 'view=portal' to avoid 404s on static hosts
  const searchParams = new URLSearchParams(window.location.search);
  const isPortalRoute = window.location.pathname === '/portal' || searchParams.get('view') === 'portal';
  const isAdminRoute = window.location.pathname === '/admin';
  
  const [view, setView] = useState<'dashboard' | 'map' | 'lesson' | 'zoo' | 'portal' | 'admin'>(
      isAdminRoute ? 'admin' : isPortalRoute ? 'portal' : 'dashboard'
  );

  const [activeWorld, setActiveWorld] = useState<WorldData | null>(null);
  const [activeLevel, setActiveLevel] = useState<any | null>(null);

  // SECURITY CHECK FOR ADMIN
  useEffect(() => {
      if (view === 'admin') {
          if (user) {
             if (!user.isAdmin) {
                 logger.warn("Unauthorized admin access attempt", { uid: user.uid });
                 setView('dashboard');
                 window.history.replaceState({}, '', '/');
             }
          } else if (!storeLoading) {
              setView('dashboard');
          }
      }
  }, [view, user, storeLoading]);

  // DOMAIN & HTTPS ENFORCER
  useEffect(() => {
      const host = window.location.hostname;
      if (window.location.protocol === 'http:' && !host.includes('localhost') && !host.includes('127.0.0.1') && !host.startsWith('192.168.')) {
          window.location.href = window.location.href.replace('http:', 'https:');
      }
      if (host === 'racked.gg' || host === 'www.racked.gg' || host.endsWith('.run.app') || host.includes('firebaseapp.com')) {
         setDomainStatus('correct');
      } else if (host.includes('localhost') || host.includes('127.0.0.1')) {
         setDomainStatus('localhost');
      } else {
         setDomainStatus('old');
         const checkTarget = async () => {
             try { await fetch('https://racked.gg', { mode: 'no-cors' }); setIsTargetReady(true); } catch (e) { setIsTargetReady(false); }
         };
         checkTarget();
         const interval = setInterval(checkTarget, 15000);
         return () => clearInterval(interval);
      }
  }, []);

  // AUTH LISTENER
  useEffect(() => {
      let unsubscribeSync: () => void;

      // Use wrapper function to avoid direct import issues from firebase/auth in App.tsx
      const unsubscribeAuth = subscribeToAuthChanges(async (firebaseUser) => {
          if (firebaseUser) {
              logger.info("Auth State: User Logged In", { uid: firebaseUser.uid });
              if (unsubscribeSync) unsubscribeSync();
              
              // 1. Start syncing user data (Sets loading=true)
              unsubscribeSync = syncUser(firebaseUser.uid);
              
              // 2. Ensure Profile Exists (Auto-Create if missing)
              try {
                 const newUserData = await createUserDoc(firebaseUser.uid, { 
                     email: firebaseUser.email, 
                     photoURL: firebaseUser.photoURL,
                     displayName: firebaseUser.displayName,
                     authMethod: firebaseUser.isAnonymous ? 'guest' : 'google'
                 });

                 // CRITICAL FIX: Manually force state update to prevent race condition
                 // if the snapshot listener is slow or blocked.
                 if (newUserData) {
                     setUser(newUserData);
                 }
                 
                 setShowOnboarding(false);
                 requestNotificationPermission().then(granted => {
                    if (granted) scheduleDemoNotifications();
                 });

              } catch (e: any) {
                 logger.error("Profile auto-creation failed", { error: e.message });
                 setError("Failed to initialize profile. " + e.message);
              }

          } else {
              logger.info("Auth State: No User");
              
              // Mock Mode Check
              const mockUid = localStorage.getItem('racked_mock_session_uid');
              if (mockUid) {
                  logger.info("Restoring Mock Session", { mockUid });
                  unsubscribeSync = syncUser(mockUid);
                  setShowOnboarding(false);
              } else {
                  clearUser();
                  if (unsubscribeSync) unsubscribeSync();
                  setShowOnboarding(true); // Show Login Screen
              }
          }
      });

      return () => {
          unsubscribeAuth();
          if (unsubscribeSync) unsubscribeSync();
      };
  }, []);

  // POST-SYNC LOGIC
  useEffect(() => {
      if (user && user.uid) {
          setShowOnboarding(false);
          processDailyStreak(user.uid, user);
      }
  }, [user?.uid]);

  // Navigation Handlers
  const handleOpenWorld = (worldId: string) => {
      const world = WORLDS_METADATA.find(w => w.id === worldId);
      if (world) {
          setActiveWorld(world);
          setView('map');
          playSound('pop');
      }
  };

  const handleSelectLevel = (level: any) => {
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
      requestNotificationPermission(); 
  };

  const handleLevelComplete = async (xp: number, coins: number) => {
      if (!user || !user.uid || !activeWorld || !activeLevel) return;
      
      const finalXp = user.subscriptionStatus === 'pro' ? xp * 2 : xp;
      
      // 1. Save Level Progress (DB)
      await saveLevelProgress(user.uid, activeWorld.id, activeLevel.id, finalXp, true);
      
      // 2. Add XP & Coins (Handles Level Up Logic internally now)
      addXP(user.uid, finalXp);
      addCoins(user.uid, coins, 'Level Complete');
      
      // 3. Check for World Completion Badge (Pass current level to handle race conditions)
      await checkWorldCompletion(user.uid, activeWorld.id, activeLevel.id);
      
      trackEvent('level_complete', { levelId: activeLevel?.id, xpEarned: finalXp });
      
      // 4. Navigation - If last level (8), go to Dashboard to show unlocked content
      if (activeLevel.levelNumber === 8) {
          handleCloseMap();
      } else {
          handleCloseLesson();
      }
  };

  const handleClaimReward = (xp: number, coins: number) => {
      if (user?.uid) {
        addXP(user.uid, xp);
        addCoins(user.uid, coins, 'Reward');
      }
  };

  const handleBuyItem = async (item: any) => {
      if (!user?.uid) return;
      
      const success = await purchaseItem(user.uid, item.id, item.cost, user.coins);
      
      if (success) {
          // Full-screen confetti celebration
          (window as any).confetti({
              particleCount: 150,
              spread: 100,
              origin: { y: 0.6 },
              colors: ['#FFD700', '#FFFFFF', '#00FF88']
          });

          // Auto-Equip Logic for Cosmetics
          if (item.category === 'cosmetic' && item.cosmeticType) {
               const type = item.cosmeticType; 
               const val = item.cosmeticValue;
               
               // Construct new avatar config
               const newAvatar = { ...user.avatar, [type]: val };
               
               // Update DB and Local Store
               await updateUser(user.uid, { avatar: newAvatar });
               setUser({ ...user, avatar: newAvatar }); 
               
               triggerVisualEffect(`${item.name} Equipped!`, 'level');
          }
          
          trackEvent('purchase_item', { itemId: item.id, cost: item.cost });
      }
  };

  const handleUpdatePortfolio = async (newPortfolio: any) => {
      if (user?.uid) await updateUser(user.uid, { portfolio: newPortfolio });
  };

  const handleProfileSave = async (data: Partial<UserState>) => {
      if (user?.uid) {
          await updateUser(user.uid, data);
          // Optimistic update for immediate UI feedback
          setUser({ ...user, ...data });
          setIsEditingProfile(false);
      }
  };

  // TRIGGERED BY ONBOARDING BUTTONS
  const handleOnboardingAuth = async (data: any) => {
      try {
          if (data.authMethod === 'guest') {
              await signInAsGuest();
          } else if (data.authMethod === 'google') {
              await signInWithGoogle();
          }
          // Auth listener (useEffect) handles the rest
      } catch (error: any) {
          logger.error("Signup Flow Failed", error);
          // UI error display handled by the store error state or alert in signIn function
      }
  };

  const handleManualLogout = async () => {
      await logout();
      window.location.reload();
  };

  // --- RENDER ---

  if (view === 'portal') {
      return (
        <PortalDashboard 
            childData={user} 
            onExit={() => { 
                window.history.pushState({}, '', '/'); 
                setView('dashboard'); 
            }} 
        />
      );
  }

  if (view === 'admin') {
      return <AdminDashboard onExit={() => { window.history.pushState({}, '', '/'); setView('dashboard'); }} />;
  }

  // LOADING SCREEN
  if (storeLoading && !user) {
      return (
          <div className="min-h-screen bg-[#1a0b2e] flex flex-col items-center justify-center p-6 text-center">
              <div className="flex flex-col items-center animate-pulse mb-8">
                  <div className="text-6xl mb-4 animate-bounce">💸</div>
                  <h2 className="font-game text-white text-2xl">RACKING UP...</h2>
              </div>
              {storeError ? (
                  <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-xl max-w-md mb-8 animate-pop-in">
                      <p className="font-bold mb-2">⚠️ Error</p>
                      <p className="text-xs mb-4">{storeError}</p>
                      <button onClick={() => window.location.reload()} className="w-full py-3 bg-white text-black font-bold rounded-xl">RETRY</button>
                  </div>
              ) : (
                  <button 
                    onClick={handleManualLogout} 
                    className="mt-8 text-gray-500 hover:text-white text-xs font-bold underline"
                  >
                      Stuck? Sign Out
                  </button>
              )}
          </div>
      );
  }

  // LOGIN SCREEN
  if (showOnboarding || !user) {
      return <Onboarding onComplete={handleOnboardingAuth} onOpenPortal={() => {
          // Update URL to query param style so refresh keeps user on portal without 404
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('view', 'portal');
          window.history.pushState({}, '', newUrl.toString());
          setView('portal');
      }} />;
  }

  // PROFILE SETUP (New User or Editing)
  if (user && (!user.isProfileComplete || isEditingProfile)) {
      return (
          <ProfileSetup 
              user={user} 
              onSave={handleProfileSave} 
              isNewUser={!user.isProfileComplete} 
          />
      );
  }

  return (
    <div className="min-h-[100dvh] bg-[#1a0b2e] text-white overflow-x-hidden font-body selection:bg-neon-pink selection:text-white relative">
      
      {domainStatus === 'old' && (
          <div className={`fixed top-0 left-0 right-0 z-[9999] text-white text-center py-3 cursor-pointer ${isTargetReady ? 'bg-green-600' : 'bg-gray-800'}`} onClick={() => { if (isTargetReady) window.location.href = 'https://racked.gg'; }}>
              {isTargetReady ? "🚀 RACKED.GG IS READY!" : "⏳ WAITING FOR DNS..."}
          </div>
      )}

      <VisualEffects />

      <div className="fixed inset-0 pointer-events-none z-0">
           <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-neon-purple/10 rounded-full blur-[120px] mix-blend-screen"></div>
           <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-neon-blue/10 rounded-full blur-[120px] mix-blend-screen"></div>
      </div>
      
      <div className={`relative z-10 ${domainStatus === 'old' ? 'pt-10' : ''}`}>
          {view === 'dashboard' && (
            <Dashboard 
                user={user} 
                onOpenWorld={handleOpenWorld}
                onClaimReward={handleClaimReward}
                onBuyItem={handleBuyItem}
                onOpenZoo={() => setView('zoo')}
                onOpenPremium={() => setShowPremiumModal(true)}
                onOpenAdmin={() => { window.history.pushState({}, '', '/admin'); setView('admin'); }}
                onEditProfile={() => setIsEditingProfile(true)}
            />
          )}
          
          {view === 'map' && activeWorld && (
              <WorldLevelMap world={activeWorld} completedLevels={user.completedLevels} onClose={handleCloseMap} onSelectLevel={handleSelectLevel} />
          )}

          {view === 'lesson' && activeLevel && (
              <LessonPlayer level={activeLevel} onClose={handleCloseLesson} onComplete={handleLevelComplete} />
          )}

          {view === 'zoo' && user.portfolio && (
              <WallStreetZoo portfolio={user.portfolio} onUpdatePortfolio={handleUpdatePortfolio} onClose={() => setView('dashboard')} />
          )}
      </div>
      
      {showPremiumModal && (
          <PremiumModal onClose={() => setShowPremiumModal(false)} onUpgrade={() => {}} />
      )}

    </div>
  );
};

export default App;