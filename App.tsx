
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
    WORLDS_METADATA,
    WorldData,
} from './services/gamification';
import { requestNotificationPermission, scheduleDemoNotifications } from './services/notifications';

// STORE & DB IMPORTS
import { useUserStore } from './services/useUserStore';
import { addXP, addCoins, purchaseItem, processDailyStreak, devAddResources, triggerMoneyCheat } from './services/gameLogic';
import { auth, signInWithGoogle, signInWithApple, signInAsGuest, logout } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { createUserDoc, saveLevelProgress, updateUser } from './services/db';

const App: React.FC = () => {
  // Global State from Zustand
  const { user, loading: storeLoading, error: storeError, syncUser, clearUser } = useUserStore();
  
  // UI State
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  
  // Domain Check State
  const [domainStatus, setDomainStatus] = useState<'correct' | 'old' | 'localhost'>('correct');
  const [isTargetReady, setIsTargetReady] = useState(false);

  // Navigation State
  const isPortalRoute = window.location.pathname === '/portal';
  const isAdminRoute = window.location.pathname === '/admin';
  
  const [view, setView] = useState<'dashboard' | 'map' | 'lesson' | 'zoo' | 'portal' | 'admin'>(
      isAdminRoute ? 'admin' : isPortalRoute ? 'portal' : 'dashboard'
  );
  const [activeWorld, setActiveWorld] = useState<WorldData | null>(null);
  const [activeLevel, setActiveLevel] = useState<any | null>(null);

  // EASTER EGG STATE
  const [konami, setKonami] = useState('');

  // DOMAIN & HTTPS ENFORCER
  useEffect(() => {
      const host = window.location.hostname;
      
      // 1. Force HTTPS on production
      if (window.location.protocol === 'http:' && host !== 'localhost' && !host.includes('127.0.0.1')) {
          window.location.href = window.location.href.replace('http:', 'https:');
      }

      // 2. Check Domain Status
      // Accept racked.gg, localhost, and google cloud run/firebase domains as valid
      if (host === 'racked.gg' || host === 'www.racked.gg' || host.endsWith('.run.app') || host.includes('firebaseapp.com')) {
         setDomainStatus('correct');
      } else if (host === 'localhost' || host.includes('127.0.0.1')) {
         setDomainStatus('localhost');
      } else {
         setDomainStatus('old');

         // 3. Active DNS Check for Migration
         const checkTarget = async () => {
             try {
                 // Attempt to fetch root with no-cors to check network reachability (opaque response = success)
                 await fetch('https://racked.gg', { mode: 'no-cors', cache: 'reload' });
                 setIsTargetReady(true);
                 console.log("Target domain is reachable!");
             } catch (e) {
                 console.log("Target domain DNS still propagating...", e);
                 setIsTargetReady(false);
             }
         };
         
         // Check immediately and then every 15s
         checkTarget();
         const interval = setInterval(checkTarget, 15000);
         return () => clearInterval(interval);
      }
  }, []);

  // AUTH & SYNC LISTENER
  useEffect(() => {
      let unsubscribeSync: () => void;

      // 1. Firebase Listener (Real Auth)
      const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
              if (unsubscribeSync) unsubscribeSync();
              unsubscribeSync = syncUser(firebaseUser.uid);
              
              requestNotificationPermission().then(granted => {
                  if (granted) scheduleDemoNotifications();
              });
          } else {
              // Check for mock session (Rebranded to racked_)
              const mockUid = localStorage.getItem('racked_mock_session_uid');
              if (mockUid) {
                  console.log("Restoring Mock Session:", mockUid);
                  unsubscribeSync = syncUser(mockUid);
              } else {
                  clearUser();
                  if (unsubscribeSync) unsubscribeSync();
                  if (window.location.pathname === '/') setShowOnboarding(true);
              }
          }
      });

      return () => {
          unsubscribeAuth();
          if (unsubscribeSync) unsubscribeSync();
      };
  }, []);

  // CHEAT CODES LISTENER
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const newCode = (konami + e.key).slice(-5).toUpperCase();
        setKonami(newCode);
        if (newCode === 'MONEY' && user?.uid) {
            triggerMoneyCheat(user.uid);
            setKonami('');
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user?.uid, konami]);

  // POST-SYNC LOGIC (Streaks & Loading)
  useEffect(() => {
      if (user && user.uid) {
          setShowOnboarding(false);
          processDailyStreak(user.uid, user);
      }
  }, [user?.uid]);

  const handleLogout = async () => {
      await logout();
      localStorage.removeItem('racked_mock_session_uid');
      clearUser();
      setShowOnboarding(true);
      setView('dashboard');
  };

  const handlePlayDemo = async () => {
      await logout(); // Ensure clean slate
      const mockId = `mock_demo_${Date.now()}`;
      localStorage.setItem('racked_mock_session_uid', mockId);
      window.location.reload(); // Reload to force syncUser to pick up the mock ID
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
      // Request notification permission after first lesson for high conversion
      requestNotificationPermission(); 
  };

  const handleLevelComplete = async (xp: number, coins: number) => {
      if (!user || !user.uid || !activeWorld || !activeLevel) return;
      
      const finalXp = user.subscriptionStatus === 'pro' ? xp * 2 : xp;
      
      // 1. Update Atomic Stats
      addXP(user.uid, finalXp, user.level);
      addCoins(user.uid, coins, 'Level Complete');

      // 2. Save Detailed Progress (DB)
      await saveLevelProgress(user.uid, activeWorld.id, activeLevel.id, finalXp, true);

      trackEvent('level_complete', { levelId: activeLevel?.id, xpEarned: finalXp });
      handleCloseLesson();
  };

  const handleClaimReward = (xp: number, coins: number) => {
      if (user?.uid) {
        addXP(user.uid, xp, user.level);
        addCoins(user.uid, coins, 'Reward');
      }
  };

  const handleBuyItem = async (item: any) => {
      if (!user?.uid) return;
      await purchaseItem(user.uid, item.id, item.cost, user.coins);
      trackEvent('purchase_item', { itemId: item.id, cost: item.cost });
  };

  const handleUpdatePortfolio = async (newPortfolio: any) => {
      if (user?.uid) {
          await updateUser(user.uid, { portfolio: newPortfolio });
      }
  };

  const handleOnboardingAuth = async (data: any) => {
      console.log("Handle Onboarding Auth:", data);
      try {
          let firebaseUser;
          
          if (data.authMethod === 'guest') {
              firebaseUser = await signInAsGuest();
          } else if (data.authMethod === 'google') {
              firebaseUser = await signInWithGoogle();
          } else if (data.authMethod === 'apple') {
              firebaseUser = await signInWithApple();
          } else {
              throw new Error("Unknown authentication method");
          }

          if (firebaseUser) {
              try {
                  console.log("Auth successful. Creating/Fetching profile for:", firebaseUser.uid);
                  await createUserDoc(firebaseUser.uid, { 
                      ...data, 
                      email: firebaseUser.email || `guest_${firebaseUser.uid.substring(0,6)}@racked.gg`,
                      photoURL: firebaseUser.photoURL 
                  });

                  if (firebaseUser.uid.startsWith('mock_')) {
                      localStorage.setItem('racked_mock_session_uid', firebaseUser.uid);
                      syncUser(firebaseUser.uid);
                  }
                  playSound('levelup');
              } catch (dbError: any) {
                  console.error("DB Profile Creation Failed:", dbError);
                  throw new Error("Profile creation failed. " + (dbError.message || "Check internet."));
              }
          } else {
              throw new Error("Authentication failed (No User)");
          }
      } catch (error: any) {
          console.error("Signup Flow Failed:", error);
          throw error; // Let Onboarding component handle the UI error
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

  // Initial Loading or Syncing
  if (storeLoading && !user) {
      return (
          <div className="min-h-screen bg-[#1a0b2e] flex flex-col items-center justify-center p-6 text-center">
              <div className="flex flex-col items-center animate-pulse mb-8">
                  <div className="text-6xl mb-4 animate-bounce">💸</div>
                  <h2 className="font-game text-white text-2xl">RACKING UP...</h2>
                  <p className="text-white/50 text-sm mt-2">Syncing your empire</p>
              </div>
              
              {storeError && (
                  <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-xl max-w-md mb-8 animate-pop-in">
                      <p className="font-bold mb-2">⚠️ Connection Error</p>
                      <p className="text-xs mb-4">{storeError}</p>
                      
                      <div className="flex flex-col gap-3">
                          <button 
                            onClick={() => window.location.reload()}
                            className="w-full py-3 bg-white text-black font-bold rounded-xl btn-3d hover:scale-105 transition-transform"
                          >
                              🔄 RETRY CONNECTION
                          </button>

                          <button 
                            onClick={handlePlayDemo}
                            className="w-full py-3 bg-transparent border border-white/20 text-white/50 font-bold rounded-xl hover:bg-white/5 hover:text-white transition-colors text-xs"
                          >
                              🎮 Or Play in Demo Mode
                          </button>
                      </div>
                  </div>
              )}

              {/* Escape Hatch */}
              <button 
                onClick={handleLogout}
                className="text-gray-500 underline text-sm hover:text-white transition-colors mt-4"
              >
                  Sign Out / Cancel
              </button>
          </div>
      );
  }

  // Onboarding
  if (showOnboarding || !user) {
      return <Onboarding onComplete={handleOnboardingAuth} />;
  }

  return (
    <div className="min-h-[100dvh] bg-[#1a0b2e] text-white overflow-x-hidden font-body selection:bg-neon-pink selection:text-white relative">
      
      {/* DOMAIN MIGRATION BANNER - Shows only on old URL */}
      {domainStatus === 'old' && (
          <div 
            className={`fixed top-0 left-0 right-0 z-[9999] text-white text-center font-game text-xs md:text-sm py-3 shadow-[0_0_20px_rgba(0,0,0,0.4)] cursor-pointer border-b-2 border-white flex items-center justify-center gap-2 transition-colors duration-500
                ${isTargetReady ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:brightness-110' : 'bg-gray-800 text-gray-400 cursor-wait'}
            `}
            onClick={() => {
                if (isTargetReady) window.location.href = 'https://racked.gg';
                else alert("DNS for racked.gg is still propagating. This usually takes 1-2 hours, but can take up to 24h. Please try again later!");
            }}
          >
              {isTargetReady ? (
                  <>
                      <span className="animate-pulse">🚀 RACKED.GG IS READY!</span>
                      <span className="bg-white text-green-600 px-2 py-0.5 rounded text-[10px] font-black">TAP TO SWITCH</span>
                  </>
              ) : (
                  <>
                      <span>⏳ WAITING FOR DNS (RACKED.GG)...</span>
                      <span className="text-[10px] opacity-70 hidden md:inline">Checking connectivity...</span>
                  </>
              )}
          </div>
      )}

      {/* Mock Mode Indicator */}
      {user.uid.startsWith('mock_') && (
          <div className="fixed top-0 left-0 z-[9999] bg-yellow-500 text-black text-[10px] font-black px-2 py-1 rounded-br-lg opacity-80 pointer-events-none">
              DEMO MODE (OFFLINE)
          </div>
      )}

      <VisualEffects />

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
           <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-neon-purple/10 rounded-full blur-[120px] mix-blend-screen"></div>
           <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-neon-blue/10 rounded-full blur-[120px] mix-blend-screen"></div>
      </div>
      
      {/* Views */}
      <div className={`relative z-10 ${domainStatus === 'old' ? 'pt-10' : ''}`}>
          {view === 'dashboard' && (
            <Dashboard 
                user={user} 
                onOpenWorld={handleOpenWorld}
                onClaimReward={handleClaimReward}
                onBuyItem={handleBuyItem}
                onOpenZoo={() => { if(user.level >= 2) setView('zoo'); else alert("Reach Level 2 to Unlock Market!"); }} // Lowered for testing
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
                  onClose={() => setView('dashboard')}
              />
          )}
      </div>
      
      {/* Premium Modal */}
      {showPremiumModal && (
          <PremiumModal 
             onClose={() => setShowPremiumModal(false)} 
             onUpgrade={() => {}} 
          />
      )}

    </div>
  );
};

export default App;
