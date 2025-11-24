/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Avatar } from './Avatar';
import { SocialShare } from './SocialShare';
import { CreationHistory } from './CreationHistory'; // Badge Collection View
import { 
    SparklesIcon, 
    LockClosedIcon, 
    ShoppingBagIcon,
    TrophyIcon,
    ExclamationTriangleIcon,
    BoltIcon,
    ArrowRightOnRectangleIcon,
    PencilSquareIcon,
    CheckBadgeIcon,
    ArrowRightIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    ArrowDownTrayIcon
} from '@heroicons/react/24/solid';
import { 
    WORLDS_METADATA, 
    ShopItem, 
    LeaderboardEntry, 
    UserState, 
    SHOP_ITEMS,
    BADGES,
    getXpForNextLevel
} from '../services/gamification';
import { claimDailyChest } from '../services/gameLogic';
import { generateLinkCode } from '../services/portal';
import { playSound } from '../services/audio';
import { signInWithGoogle, logout } from '../services/firebase';
import { migrateGuestToReal, subscribeToCollection, updateParentCode, subscribeToLeaderboard } from '../services/db';
import { getMarketData } from '../services/stockMarket';

interface DashboardProps {
    user: UserState;
    onOpenWorld: (worldId: string) => void;
    onClaimReward: (xp: number, coins: number) => void;
    onBuyItem: (item: ShopItem) => void;
    onOpenZoo: () => void;
    onOpenPremium: () => void;
    onOpenAdmin: () => void;
    onEditProfile: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onOpenWorld, onClaimReward, onBuyItem, onOpenZoo, onOpenPremium, onOpenAdmin, onEditProfile }) => {
    const [activeTab, setActiveTab] = useState<'map' | 'leaderboard' | 'social' | 'badges'>('map');
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]); 
    const [showSocialShare, setShowSocialShare] = useState<{type: any, data: any} | null>(null);
    const [familyCode, setFamilyCode] = useState<string | null>(user.parentCode || null);
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    // Initialize with hardcoded SHOP_ITEMS to ensure instant render
    const [shopItems, setShopItems] = useState<ShopItem[]>(SHOP_ITEMS);
    const [shopTier, setShopTier] = useState<1 | 2 | 3 | 4>(1);
    
    // Admin Secret Trigger
    const avatarPressTimer = useRef<any>(null);
    
    // Dropdown State
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    // Guest Upgrade State
    const [isUpgrading, setIsUpgrading] = useState(false);

    // XP Calculation
    const nextLevelXp = getXpForNextLevel(user.level);
    const prevLevelXp = getXpForNextLevel(user.level - 1);
    const currentLevelProgress = user.xp - prevLevelXp;
    const levelRange = nextLevelXp - prevLevelXp;
    const progressPercent = Math.min(100, Math.max(0, (currentLevelProgress / levelRange) * 100));

    // Portfolio Calculation for Home Screen Widget
    const portfolioStats = useMemo(() => {
        const marketData = getMarketData();
        let currentValue = user.portfolio.cash;
        
        // Calculate value of holdings based on latest market data
        Object.entries(user.portfolio.holdings).forEach(([symbol, qty]) => {
            const stock = marketData.find(s => s.symbol === symbol);
            if (stock) {
                currentValue += stock.price * (qty as number);
            }
        });

        const startValue = 100000;
        const totalGain = currentValue - startValue;
        const percentGain = (totalGain / startValue) * 100;
        const hasTrades = user.portfolio.transactions.length > 0;

        return { currentValue, totalGain, percentGain, hasTrades };
    }, [user.portfolio]);

    // PWA Install Logic
    useEffect(() => {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setInstallPrompt(e);
        });
    }, []);

    // Shop Sync Logic
    useEffect(() => {
        const unsub = subscribeToCollection('shop_items', (items) => {
            if (items && items.length > 0) {
                // CRITICAL FIX: Sanitize incoming items to ensure they have valid tiers
                // This fixes the "Restocking soon" bug caused by old DB data missing the 'tier' field
                const sanitizedItems = items.map((i: any) => ({
                    ...i,
                    // If tier is missing, calculate it based on cost
                    tier: i.tier || (i.cost >= 50000 ? 4 : i.cost >= 15000 ? 3 : i.cost >= 5000 ? 2 : 1),
                    // Ensure active is true if missing
                    active: i.active !== false
                })) as ShopItem[];
                setShopItems(sanitizedItems);
            } else {
                // Fallback to hardcoded items if Firestore empty
                setShopItems(SHOP_ITEMS);
            }
        });
        return () => unsub();
    }, []);

    // Leaderboard Sync Logic
    useEffect(() => {
        if (activeTab === 'leaderboard') {
            const unsub = subscribeToLeaderboard((entries) => {
                setLeaderboard(entries);
            });
            return () => unsub();
        }
    }, [activeTab]);

    // Get Latest Badge (Robust Handling)
    const getLatestBadge = () => {
        if (!user.badges || user.badges.length === 0) return null;
        const lastEntry = user.badges[user.badges.length - 1];
        const id = typeof lastEntry === 'string' ? lastEntry : lastEntry.id;
        return BADGES.find(b => b.id === id);
    };
    const latestBadge = getLatestBadge();

    const handleInstall = () => {
        if (installPrompt) {
            installPrompt.prompt();
            setInstallPrompt(null);
        }
    };

    // Daily Chest Logic
    const today = new Date().toLocaleDateString('en-CA');
    const isChestReady = user.lastDailyChestClaim !== today;

    const handleChestClick = () => {
        if (isChestReady && user.uid) {
            claimDailyChest(user.uid, user);
        } else {
            playSound('error');
            alert("Come back tomorrow!");
        }
    };

    const handleBuy = (item: ShopItem) => {
        if (user.inventory.includes(item.id)) {
            playSound('error');
            alert("You already own this!");
            return;
        }
        if (user.coins < item.cost) {
            playSound('error');
            alert("Not enough coins! Trade stocks or do lessons.");
            return;
        }
        onBuyItem(item);
    };

    const handleGenerateCode = async () => {
        playSound('pop');
        const code = generateLinkCode();
        setFamilyCode(code);
        if (user.uid) {
            await updateParentCode(user.uid, code);
        }
    };

    const handleShareApp = async () => {
        const shareData = {
            title: "Racked: The Money Game",
            text: "Join me and turn your allowance into an empire 💰",
            url: `https://racked.gg/?ref=${user.referralCode}`
        };
        
        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log("Share cancelled");
            }
        } else {
            navigator.clipboard.writeText(shareData.url);
            playSound('coin');
            alert("Link copied! Share it to get rich.");
        }
    };

    const handleShareParentLink = async () => {
        if (!familyCode) return;
        const url = `${window.location.origin}/?view=portal&code=${familyCode}`;
        
        const shareData = {
            title: "Racked Parent Portal",
            text: `Login to approve my allowance on Racked! Access Code: ${familyCode}`,
            url: url
        };
        
        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log("Share cancelled");
            }
        } else {
            navigator.clipboard.writeText(shareData.url);
            playSound('coin');
            alert("Magic Link copied! Send it to your parent.");
        }
    };

    // --- GUEST UPGRADE ---
    const handleUpgradeAccount = async () => {
        if (isUpgrading) return;
        setIsUpgrading(true);
        playSound('click');

        try {
            const oldUid = user.uid!;
            const googleUser = await signInWithGoogle();
            if (!googleUser) throw new Error("Login failed");

            await migrateGuestToReal(oldUid, googleUser.uid, googleUser.email || '');
            
            playSound('levelup');
            (window as any).confetti({ particleCount: 300, spread: 180 });
            alert("SUCCESS! Your empire is now saved forever.");
            window.location.reload(); 
        } catch (e: any) {
            console.error(e);
            if(!e.message?.includes('cancelled')) {
                alert("Upgrade failed: " + e.message);
            }
            setIsUpgrading(false);
        }
    };

    // --- ADMIN SECRET ---
    const handleAvatarDown = () => {
        avatarPressTimer.current = setTimeout(() => {
            if (user.isAdmin) {
                playSound('chest');
                if (confirm("ENTER GOD MODE?")) {
                    onOpenAdmin();
                }
            }
        }, 3000); // 3 seconds hold
    };

    const handleAvatarUp = () => {
        if (avatarPressTimer.current) clearTimeout(avatarPressTimer.current);
    };

    const handleLogout = async () => {
        if (confirm("Are you sure you want to log out?")) {
            await logout();
            window.location.reload();
        }
    };

    return (
        <div className="relative pb-24 max-w-md mx-auto md:max-w-2xl">
            
            {/* GUEST WARNING BANNER */}
            {user.loginType === 'guest' && (
                <div className="bg-red-600 text-white p-3 flex items-center justify-between shadow-lg animate-slide-down sticky top-0 z-[60]">
                    <div className="flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-300 animate-pulse" />
                        <div className="text-xs">
                            <div className="font-bold">GUEST MODE (UNSAVED)</div>
                            <div className="opacity-80">Sign in to save {user.coins.toLocaleString()} coins</div>
                        </div>
                    </div>
                    <button 
                        onClick={handleUpgradeAccount}
                        disabled={isUpgrading}
                        className="bg-white text-red-600 text-xs font-bold px-3 py-1.5 rounded-full shadow-md active:scale-95 transition-transform"
                    >
                        {isUpgrading ? 'SAVING...' : 'SAVE PROGRESS'}
                    </button>
                </div>
            )}

            {/* REVAMPED HEADER - PREDOMINANT STATS */}
            <div className="sticky top-0 z-40 pt-4 pb-4 bg-[#1a0b2e]/95 backdrop-blur-xl border-b border-white/10 shadow-2xl">
                <div className="px-4 flex items-start justify-between mb-6">
                    
                    {/* User Identity & Badge */}
                    <div className="flex items-center gap-4 relative">
                        {/* Profile Menu Dropdown */}
                        {showProfileMenu && (
                            <div className="absolute top-14 left-0 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 w-48 z-[100] animate-pop-in">
                                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                                    <div className="text-white font-bold truncate">{user.nickname}</div>
                                    <div className="text-xs text-slate-500">{user.loginType === 'guest' ? 'Guest Account' : user.email}</div>
                                </div>
                                <button onClick={() => { onEditProfile(); setShowProfileMenu(false); }} className="w-full text-left px-3 py-2 text-white hover:bg-slate-800 rounded-lg text-sm font-bold flex items-center gap-2">
                                    <PencilSquareIcon className="w-4 h-4 text-neon-blue" /> Edit Profile
                                </button>
                                {user.isAdmin && (
                                    <button onClick={onOpenAdmin} className="w-full text-left px-3 py-2 text-yellow-400 hover:bg-slate-800 rounded-lg text-sm font-bold flex items-center gap-2">
                                        <BoltIcon className="w-4 h-4" /> God Mode
                                    </button>
                                )}
                                <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-red-400 hover:bg-slate-800 rounded-lg text-sm font-bold flex items-center gap-2">
                                    <ArrowRightOnRectangleIcon className="w-4 h-4" /> Log Out
                                </button>
                            </div>
                        )}

                        <div 
                            className="relative group cursor-pointer transition-transform active:scale-95"
                            onMouseDown={handleAvatarDown}
                            onMouseUp={handleAvatarUp}
                            onTouchStart={handleAvatarDown}
                            onTouchEnd={handleAvatarUp}
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                        >
                            <Avatar level={user.level} size="md" customConfig={user.avatar} />
                            {/* Edit Indicator */}
                            <div className="absolute -bottom-1 -right-1 bg-slate-800 text-white p-1 rounded-full border-2 border-slate-600">
                                <PencilSquareIcon className="w-3 h-3" />
                            </div>
                        </div>
                        
                        <div>
                             <div className="flex items-center gap-2 mb-1">
                                <div className="text-white font-game text-2xl tracking-wide text-shadow-sm">{user.nickname}</div>
                                {user.subscriptionStatus === 'pro' && (
                                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-[10px] font-black px-2 py-0.5 rounded uppercase shadow-sm">PRO</span>
                                )}
                             </div>
                             
                             {/* BADGE DISPLAY */}
                             <div 
                                onClick={() => { playSound('pop'); setActiveTab('badges'); }}
                                className="flex items-center gap-2 cursor-pointer group hover:bg-white/5 p-1 rounded-lg transition-colors -ml-1"
                             >
                                {latestBadge ? (
                                    <>
                                        <div className="text-lg filter drop-shadow-md group-hover:scale-110 transition-transform">
                                            {latestBadge.icon}
                                        </div>
                                        <div className="text-[10px] font-bold text-neon-green uppercase tracking-wider truncate max-w-[120px]">
                                            {latestBadge.name}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-[10px] font-bold text-gray-600 uppercase tracking-wider pl-1">
                                        No Badges
                                    </div>
                                )}
                             </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE: INSTALL + STREAK */}
                    <div className="flex gap-2">
                        {installPrompt && (
                            <button 
                                onClick={handleInstall}
                                className="flex flex-col items-center justify-center bg-neon-green/10 rounded-2xl p-2 border border-neon-green/50 active:scale-90 transition-all h-[58px] w-[58px]"
                            >
                                <ArrowDownTrayIcon className="w-6 h-6 text-neon-green animate-bounce" />
                                <div className="text-[8px] font-black text-neon-green uppercase leading-none mt-1">
                                    Install
                                </div>
                            </button>
                        )}

                        {/* STREAK BADGE (Top Right) */}
                        <button className="flex flex-col items-center justify-center bg-black/40 rounded-2xl p-2 border border-white/10 active:scale-90 transition-all group h-[58px] min-w-[58px]">
                            <div className={`text-3xl drop-shadow-[0_0_10px_rgba(255,100,0,0.5)] ${user.streak > 0 ? 'animate-fire-flicker' : 'grayscale opacity-50'}`}>
                                {user.streak > 30 ? '💎' : '🔥'}
                            </div>
                            <div className="text-[10px] font-black text-orange-500 uppercase leading-none mt-1 group-hover:text-orange-400">
                                {user.streak} Days
                            </div>
                        </button>
                    </div>
                </div>

                {/* PREDOMINANT STATS ROW */}
                <div className="px-4 grid grid-cols-2 gap-3 mb-4">
                    
                    {/* COINS CARD */}
                    <div className="bg-gradient-to-br from-slate-900 to-black border border-yellow-500/30 rounded-2xl p-4 relative overflow-hidden shadow-lg group">
                        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-yellow-500/10 rounded-full blur-xl group-hover:bg-yellow-500/20 transition-all"></div>
                        <div className="relative z-10">
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Bank Balance</div>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl group-hover:scale-110 transition-transform duration-300">🪙</span>
                                <span className="font-game text-2xl md:text-3xl text-yellow-400 tracking-tight text-shadow-sm">
                                    {user.coins.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* XP/LEVEL CARD */}
                    <div className="bg-gradient-to-br from-slate-900 to-black border border-blue-500/30 rounded-2xl p-4 relative overflow-hidden shadow-lg group">
                        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all"></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-1">
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Level {user.level}</div>
                                <div className="text-[10px] font-bold text-blue-400">{Math.floor(progressPercent)}%</div>
                            </div>
                            
                            <div className="font-game text-xl text-white mb-2 flex items-baseline gap-1">
                                {user.xp.toLocaleString()} <span className="text-[10px] font-sans font-bold text-gray-500">XP</span>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000 ease-out"
                                    style={{ width: `${progressPercent}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* DAILY REWARD CHEST */}
                <div className="px-4">
                    <button 
                        onClick={handleChestClick}
                        disabled={!isChestReady}
                        className={`w-full rounded-xl p-[1px] group relative overflow-hidden transition-all active:scale-[0.98]
                            ${isChestReady 
                                ? 'bg-gradient-to-r from-neon-purple via-white to-neon-purple animate-shimmer' 
                                : 'bg-gray-800 cursor-not-allowed opacity-60'}
                        `}
                    >
                        <div className="bg-[#150520] rounded-[11px] px-4 py-2 flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-3">
                                <div className={`text-2xl ${isChestReady ? 'animate-bounce' : 'grayscale'}`}>🎁</div>
                                <div className="text-left">
                                    <div className={`font-game text-sm uppercase ${isChestReady ? 'text-white' : 'text-gray-500'}`}>
                                        {isChestReady ? 'Daily Loot Ready!' : 'Loot Claimed'}
                                    </div>
                                    {isChestReady && <div className="text-[9px] text-neon-purple font-bold">Tap to Open</div>}
                                </div>
                            </div>
                            {isChestReady && <div className="bg-white/20 p-1 rounded-full"><ArrowRightIcon className="w-4 h-4 text-white" /></div>}
                        </div>
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="px-4 mt-6 space-y-8">
                
                {/* TABS */}
                <div className="flex justify-center gap-2 mb-6 p-1 bg-white/5 rounded-full border border-white/5">
                    {['map', 'badges', 'leaderboard', 'social'].map((t) => (
                        <button 
                            key={t}
                            onClick={() => { playSound('click'); setActiveTab(t as any) }}
                            className={`flex-1 py-2 rounded-full font-game text-xs md:text-sm uppercase tracking-wide transition-all ${activeTab === t ? 'bg-white text-black shadow-lg scale-105' : 'text-gray-500 hover:text-white'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {/* MAP TAB */}
                {activeTab === 'map' && (
                    <div className="relative flex flex-col items-center gap-8 py-4">
                        
                        {/* WALL STREET ZOO BUTTON */}
                        <button 
                            onClick={onOpenZoo}
                            className={`w-full relative overflow-hidden rounded-3xl p-[1px] btn-3d group transition-all duration-300
                                ${portfolioStats.hasTrades 
                                    ? (portfolioStats.totalGain >= 0 
                                        ? 'bg-gradient-to-r from-neon-green via-emerald-500 to-neon-green' 
                                        : 'bg-gradient-to-r from-red-500 via-orange-500 to-red-500')
                                    : 'bg-gradient-to-r from-neon-purple via-indigo-500 to-neon-purple'}
                            `}
                        >
                            <div className="bg-[#1a0b2e] rounded-[23px] p-4 h-full relative overflow-hidden">
                                {/* Background Pulse */}
                                <div className={`absolute inset-0 opacity-10 transition-opacity group-hover:opacity-20 
                                    ${portfolioStats.hasTrades && portfolioStats.totalGain < 0 ? 'bg-red-500' : 'bg-neon-green'}
                                `}></div>

                                <div className="flex items-center justify-between relative z-10 gap-4">
                                    {/* Icon & Title */}
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-white/10 bg-black/30 backdrop-blur-md`}>
                                            {portfolioStats.hasTrades ? (portfolioStats.totalGain >= 0 ? '📈' : '📉') : '🦍'}
                                        </div>
                                        <div className="text-left">
                                            <h3 className="font-game text-xl text-white leading-none mb-1 text-stroke-black tracking-wide">
                                                WALL STREET ZOO
                                            </h3>
                                            {!portfolioStats.hasTrades && (
                                                <p className="text-[10px] text-gray-300 font-bold leading-tight">
                                                    Trade Stocks. Get Rich. No Cap.
                                                </p>
                                            )}
                                            {portfolioStats.hasTrades && (
                                                <div className="flex items-center gap-2">
                                                     <span className={`text-xs font-black px-2 py-0.5 rounded text-black ${portfolioStats.totalGain >= 0 ? 'bg-neon-green' : 'bg-red-500 text-white'}`}>
                                                        {portfolioStats.totalGain >= 0 ? '+' : ''}{portfolioStats.percentGain.toFixed(2)}%
                                                     </span>
                                                     <span className="text-[10px] text-gray-400 font-bold uppercase">All Time</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Value Display (Right Side) */}
                                    {portfolioStats.hasTrades && (
                                        <div className="text-right">
                                            <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Net Worth</div>
                                            <div className="font-mono font-bold text-white text-2xl tracking-tighter drop-shadow-md">
                                                ${portfolioStats.currentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </div>
                                            <div className={`text-[10px] font-bold ${portfolioStats.totalGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {portfolioStats.totalGain >= 0 ? '+' : ''}${Math.abs(portfolioStats.totalGain).toLocaleString()}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </button>

                        {/* WORLDS */}
                        <div className="w-full space-y-6">
                            {WORLDS_METADATA.map((world, index) => {
                                // STRICT SEQUENTIAL UNLOCK LOGIC
                                let isUnlocked = index === 0; // World 1 always unlocked
                                
                                if (index > 0) {
                                    // For World N (index), check if World N-1 (index-1) is FULLY mastered
                                    // "Mastered" means all 8 levels completed
                                    const prevWorldId = WORLDS_METADATA[index - 1].id;
                                    
                                    // Normalize ID to match what's stored in completedLevels (e.g. "Moola Basics" -> "MoolaBasics")
                                    const normalizedPrevId = prevWorldId.replace(/\s+/g, '');
                                    const completedInPrev = user.completedLevels.filter(l => l.startsWith(normalizedPrevId)).length;
                                    
                                    // Check if previous world is done (8 levels) OR if explicitly in masteredWorlds
                                    const isPrevMastered = completedInPrev >= 8 || (user.masteredWorlds && user.masteredWorlds.includes(prevWorldId));
                                    
                                    isUnlocked = isPrevMastered;
                                }

                                const completedInWorld = user.completedLevels.filter(l => l.startsWith(world.id.replace(/\s+/g, ''))).length;
                                const isCompleted = completedInWorld >= 8; // 8 levels per world
                                const Icon = world.icon;

                                return (
                                    <button
                                        key={world.id}
                                        onClick={() => isUnlocked && onOpenWorld(world.id)}
                                        disabled={!isUnlocked}
                                        className={`
                                            w-full relative h-24 rounded-3xl border-4 transition-all duration-300 flex items-center px-4 gap-4
                                            ${isUnlocked
                                                ? `${world.color} border-white shadow-[0_0_20px_rgba(255,255,255,0.1)] btn-3d` 
                                                : 'bg-black border-gray-800 opacity-60 grayscale cursor-not-allowed'
                                            }
                                        `}
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${isUnlocked ? 'bg-black/20' : 'bg-transparent'}`}>
                                            {isUnlocked ? <Icon className="w-8 h-8" /> : <LockClosedIcon className="w-6 h-6 text-gray-500" />}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <h3 className="font-game text-lg leading-none mb-1 text-white text-stroke-black">
                                                {world.title}
                                            </h3>
                                            {isUnlocked ? (
                                                <div className="text-[10px] font-bold text-black/60 uppercase">{completedInWorld}/8 Levels</div>
                                            ) : (
                                                <div className="text-[10px] font-bold text-gray-500 uppercase">Complete {WORLDS_METADATA[index-1].title}</div>
                                            )}
                                        </div>
                                        {isCompleted && <CheckBadgeIcon className="w-8 h-8 text-white drop-shadow-md" />}
                                    </button>
                                );
                            })}
                        </div>

                         {/* SHOP */}
                         <div className="w-full pt-8 border-t border-white/10">
                            <div className="flex items-center justify-between px-2 mb-3">
                                <h2 className="font-game text-xl text-white flex items-center gap-2">
                                    <ShoppingBagIcon className="w-6 h-6 text-neon-pink" />
                                    ITEM SHOP
                                </h2>
                            </div>

                            {/* Shop Tabs */}
                            <div className="flex gap-2 mb-4 px-2 overflow-x-auto no-scrollbar">
                                <button onClick={() => setShopTier(1)} className={`px-4 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${shopTier === 1 ? 'bg-green-500 text-black' : 'bg-white/10 text-gray-400'}`}>Starter (&lt;5k)</button>
                                <button onClick={() => setShopTier(2)} className={`px-4 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${shopTier === 2 ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-400'}`}>Baller (5k-10k)</button>
                                <button onClick={() => setShopTier(3)} className={`px-4 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${shopTier === 3 ? 'bg-yellow-500 text-black' : 'bg-white/10 text-gray-400'}`}>Empire (15k-50k)</button>
                                <button onClick={() => setShopTier(4)} className={`px-4 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${shopTier === 4 ? 'bg-purple-500 text-white border border-white/20' : 'bg-white/10 text-gray-400'}`}>Legendary (50k+)</button>
                            </div>

                            <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar snap-x px-2">
                                {shopItems.filter(i => i.active !== false && i.tier === shopTier).length === 0 ? (
                                    <div className="w-full text-center text-gray-500 text-xs italic py-4">
                                        Restocking soon... check back later!
                                    </div>
                                ) : (
                                    shopItems.filter(i => i.active !== false && i.tier === shopTier).map(item => {
                                        const owned = user.inventory.includes(item.id);
                                        const affordable = user.coins >= item.cost;
                                        // Determine styling based on tier
                                        const borderColor = shopTier === 1 ? 'border-green-500/30' : shopTier === 2 ? 'border-blue-500/50' : shopTier === 3 ? 'border-yellow-500' : 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)]';
                                        const glow = shopTier >= 3 ? 'shadow-[0_0_15px_rgba(255,255,255,0.2)]' : '';

                                        return (
                                            <div key={item.id} className={`flex-shrink-0 w-36 snap-start bg-[#1e112a] border-2 rounded-2xl p-3 flex flex-col items-center text-center relative overflow-hidden group ${owned ? 'border-gray-600 opacity-80' : borderColor} ${glow}`}>
                                                {/* Owned Badge - Green Check */}
                                                {owned && <div className="absolute top-2 right-2 bg-green-500 text-black rounded-full p-0.5"><CheckBadgeIcon className="w-3 h-3"/></div>}
                                                
                                                {item.category === 'cosmetic' && <div className="absolute top-2 left-2 text-[8px] bg-white/10 px-1 rounded text-white/70 uppercase tracking-wider">{item.cosmeticType || 'STYLE'}</div>}
                                                
                                                <div className="text-4xl mb-2 mt-4 transition-transform group-hover:scale-110">{item.emoji}</div>
                                                <div className="font-game text-white text-sm leading-none mb-1">{item.name}</div>
                                                
                                                {/* Explicit Price Display */}
                                                {!owned && (
                                                    <div className="text-yellow-400 text-xs font-black mb-2 flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded">
                                                        🪙 {item.cost.toLocaleString()}
                                                    </div>
                                                )}

                                                <button 
                                                    onClick={() => !owned && handleBuy(item)}
                                                    disabled={owned || (!affordable && !owned)}
                                                    className={`w-full font-bold py-1.5 rounded-lg text-xs transition-all flex items-center justify-center gap-1 
                                                        ${owned 
                                                            ? 'bg-green-900/50 text-green-400 border border-green-500/30 cursor-default' 
                                                            : !affordable 
                                                                ? 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50'
                                                                : 'bg-white text-black hover:bg-neon-green hover:scale-105 shadow-lg cursor-pointer'}
                                                    `}
                                                >
                                                    {owned ? 'OWNED' : !affordable ? 'BROKE' : 'BUY'}
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* BADGES TAB */}
                {activeTab === 'badges' && (
                    <div className="animate-pop-in">
                        <CreationHistory user={user} />
                    </div>
                )}

                {/* LEADERBOARD TAB */}
                {activeTab === 'leaderboard' && (
                    <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden">
                        <div className="bg-black/40 p-4 border-b border-white/10 flex justify-between items-center">
                             <h2 className="font-game text-xl text-white flex items-center gap-2">
                                <TrophyIcon className="w-6 h-6 text-yellow-400" />
                                TOP PLAYERS
                            </h2>
                            <span className="text-xs font-mono text-gray-400">Ranked by Net Worth</span>
                        </div>
                        <div className="divide-y divide-white/5">
                            {leaderboard.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="text-6xl mb-4">👑</div>
                                    <h3 className="font-game text-xl text-white mb-2">Be The First!</h3>
                                    <p className="text-sm text-gray-400">Climb the ranks and claim the throne.</p>
                                </div>
                            ) : (
                                leaderboard.slice(0, 10).map((entry) => (
                                    <div key={entry.rank} className={`flex items-center p-4 ${entry.rank === 1 ? 'bg-yellow-400/10' : ''}`}>
                                        <div className={`font-black text-lg w-8 ${entry.rank === 1 ? 'text-yellow-400 text-2xl' : 'text-white'}`}>
                                            {entry.rank === 1 ? '1' : entry.rank}
                                        </div>
                                        <div className="text-3xl mr-4">{entry.avatar}</div>
                                        <div className="flex-1">
                                            <div className="font-bold text-white text-lg">{entry.name}</div>
                                            <div className="text-xs text-gray-500 font-mono">Lvl {Math.floor(Math.sqrt(entry.xp / 100))}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-mono font-bold text-neon-green text-lg">${(entry.netWorth || 0).toLocaleString()}</div>
                                            <div className="text-[10px] text-gray-500 uppercase">Net Worth</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* SOCIAL TAB */}
                {activeTab === 'social' && (
                    <div className="text-center py-8 space-y-8">
                        {/* Referral Widget */}
                        <div className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-3xl p-6 border border-white/10 shadow-xl">
                            <div className="text-6xl mb-4 animate-bounce">👯‍♀️</div>
                            <h2 className="font-game text-2xl text-white mb-2">GET RICH TOGETHER</h2>
                            <p className="text-purple-200 text-sm mb-6 px-4">
                                Invite friends. They get <span className="text-yellow-400 font-bold">20k Coins</span>. You get <span className="text-yellow-400 font-bold">50k Coins</span> + Pro!
                            </p>
                            
                            <div className="bg-black/40 rounded-2xl p-4 mb-6 border border-white/10">
                                <div className="text-xs text-gray-400 uppercase font-bold mb-1">Your Secret Code</div>
                                <div onClick={handleShareApp} className="font-mono text-3xl text-neon-blue font-bold tracking-widest cursor-pointer hover:scale-105 transition-transform">
                                    {user.referralCode}
                                </div>
                                <div className="text-[10px] text-gray-500 mt-1">Tap to share</div>
                            </div>

                            <div className="flex gap-2">
                                <button onClick={handleShareApp} className="flex-1 bg-white text-black font-game text-lg py-3 rounded-xl btn-3d flex items-center justify-center gap-2">
                                    {/* Icon moved to import */}
                                    <span className="text-xl">🚀</span> SHARE
                                </button>
                            </div>

                            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-purple-300">
                                {/* Icon replacement */}
                                <span className="text-lg">👥</span>
                                <span className="font-bold">{user.referralCount} Friends Invited</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {showSocialShare && (
                <SocialShare 
                    type={showSocialShare.type} 
                    data={showSocialShare.data} 
                    onClose={() => setShowSocialShare(null)} 
                />
            )}
        </div>
    );
};