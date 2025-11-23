
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useRef } from 'react';
import { Avatar } from './Avatar';
import { SocialShare } from './SocialShare';
import { CreationHistory } from './CreationHistory'; // Badge Collection View
import { 
    SparklesIcon, 
    LockClosedIcon, 
    ShoppingBagIcon,
    TrophyIcon,
    UserPlusIcon,
    ShareIcon,
    ExclamationTriangleIcon,
    BoltIcon,
    ArrowRightOnRectangleIcon,
    PencilSquareIcon,
    CheckBadgeIcon,
    FireIcon
} from '@heroicons/react/24/solid';
import { 
    WORLDS_METADATA, 
    ShopItem, 
    LeaderboardEntry, 
    UserState, 
    SHOP_ITEMS,
    BADGES
} from '../services/gamification';
import { claimDailyChest } from '../services/gameLogic';
import { generateLinkCode } from '../services/portal';
import { playSound } from '../services/audio';
import { signInWithGoogle, logout } from '../services/firebase';
import { migrateGuestToReal, subscribeToCollection, updateParentCode, subscribeToLeaderboard } from '../services/db';

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
    const [shopItems, setShopItems] = useState<ShopItem[]>(SHOP_ITEMS); 
    
    // Admin Secret Trigger
    const avatarPressTimer = useRef<any>(null);
    
    // Dropdown State
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    // Guest Upgrade State
    const [isUpgrading, setIsUpgrading] = useState(false);

    // Determine Latest Badge
    const latestBadgeId = user.badges && user.badges.length > 0 ? user.badges[user.badges.length - 1] : null;
    const latestBadge = BADGES.find(b => b.id === latestBadgeId);

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
            if (items.length > 0) {
                // Merge cloud items with local static definition to keep icons/data but allow pricing updates
                const merged = SHOP_ITEMS.map(staticItem => {
                    const cloudItem = items.find(i => i.id === staticItem.id);
                    return cloudItem ? { ...staticItem, ...cloudItem } : staticItem;
                });
                setShopItems(merged);
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

    const openBadgeTab = () => {
        playSound('pop');
        setActiveTab('badges');
    };

    // Helper to sort shop items by price
    const sortedShopItems = [...shopItems].sort((a, b) => a.cost - b.cost);

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

            {/* NEW TOP BAR - ACHIEVEMENT FOCUSED */}
            <div className="sticky top-0 z-40 px-4 py-3 bg-[#1a0b2e]/95 backdrop-blur-md border-b border-white/5 shadow-2xl">
                <div className="flex flex-col gap-3">
                    
                    {/* ROW 1: AVATAR | BADGE TITLE | PRO */}
                    <div className="flex items-center justify-between">
                        {/* Avatar & Profile */}
                        <div className="flex items-center gap-3 relative group">
                            <div 
                                className="cursor-pointer relative"
                                onMouseDown={handleAvatarDown}
                                onMouseUp={handleAvatarUp}
                                onTouchStart={handleAvatarDown}
                                onTouchEnd={handleAvatarUp}
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                            >
                                <Avatar level={user.level} size="sm" customConfig={user.avatar} />
                                <div className="absolute -bottom-1 -right-1 bg-neon-blue text-black text-[10px] font-black px-1.5 rounded-full border border-white shadow-sm">
                                    {user.level}
                                </div>
                            </div>
                            
                            {/* Profile Menu */}
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

                            {/* NAME & TITLE */}
                            <div>
                                <div className="font-game text-white text-lg leading-none flex items-center gap-1">
                                    {user.nickname}
                                </div>
                                <div 
                                    onClick={openBadgeTab}
                                    className="cursor-pointer hover:scale-105 transition-transform flex items-center gap-1 mt-1 bg-white/10 px-2 py-0.5 rounded-md border border-white/10"
                                >
                                    {latestBadge ? (
                                        <>
                                            <span className="text-lg animate-pulse">{latestBadge.icon}</span>
                                            <span className={`text-[10px] font-black uppercase tracking-wide ${latestBadge.color.replace('bg-', 'text-')}`}>
                                                {latestBadge.name}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-[10px] font-bold text-gray-400">NO BADGES YET</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Side: PRO / Shop Button */}
                        <div>
                            {user.subscriptionStatus === 'pro' ? (
                                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black text-xs px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                                    <SparklesIcon className="w-3 h-3" /> PRO
                                </div>
                            ) : (
                                <button 
                                    onClick={onOpenPremium}
                                    className="bg-white/10 border border-white/20 text-white font-bold text-xs px-3 py-1.5 rounded-full hover:bg-white/20 transition-colors flex items-center gap-1"
                                >
                                    <SparklesIcon className="w-3 h-3 text-yellow-400" />
                                    UPGRADE
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ROW 2: STATS (XP, COINS, STREAK) */}
                    <div className="flex items-center justify-between bg-black/40 rounded-xl p-2 border border-white/10 shadow-inner">
                        
                        <div className="flex items-center gap-2 px-2 border-r border-white/10 pr-4">
                            <span className="text-xs font-bold text-gray-400">XP</span>
                            <span className="font-mono font-bold text-neon-green text-sm">{user.xp.toLocaleString()}</span>
                        </div>

                        <div className="flex items-center gap-2 px-2 border-r border-white/10 pr-4">
                            <span className="text-lg">🪙</span>
                            <span className="font-mono font-bold text-yellow-400 text-sm">{user.coins.toLocaleString()}</span>
                        </div>

                        <div className="flex items-center gap-1 px-2 relative group cursor-pointer" onClick={() => alert(`Streak: ${user.streak} Days\nFrozen: ${user.streakFreezes > 0}`)}>
                            <FireIcon className={`w-4 h-4 ${user.streak > 0 ? 'text-orange-500 animate-pulse' : 'text-gray-600'}`} />
                            <span className="font-black text-white text-sm">{user.streak}</span>
                            <span className="text-[10px] text-gray-500 font-bold ml-1 uppercase hidden sm:inline">Day Streak</span>
                        </div>

                    </div>
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
                        
                        {/* DAILY REWARD CHEST */}
                        <button 
                            onClick={handleChestClick}
                            disabled={!isChestReady}
                            className={`w-full rounded-2xl p-1 btn-3d group relative overflow-hidden transition-all mb-4
                                ${isChestReady ? 'bg-gradient-to-r from-indigo-900 to-purple-900 cursor-pointer' : 'bg-gray-800 cursor-not-allowed grayscale opacity-75'}
                            `}
                        >
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes-light.png')] opacity-10"></div>
                            <div className="flex items-center justify-between px-4 py-2 relative z-10">
                                <div className="flex items-center gap-3">
                                     <div className={`text-3xl transition-transform ${isChestReady ? 'animate-bounce' : ''}`}>
                                         🎁
                                     </div>
                                     <div className="text-left">
                                         <div className="text-white font-game text-sm uppercase">{isChestReady ? 'Daily Loot Ready!' : 'Loot Claimed'}</div>
                                         <div className="text-[10px] text-indigo-300 font-bold flex items-center gap-1">
                                             {isChestReady ? 'Tap to open' : 'Refreshes tomorrow'}
                                         </div>
                                     </div>
                                </div>
                            </div>
                        </button>

                        {/* ZOO BUTTON - ALWAYS UNLOCKED */}
                        <button 
                            onClick={onOpenZoo}
                            className={`w-full rounded-3xl p-[2px] btn-3d group transition-all bg-gradient-to-r from-neon-green via-white to-neon-green animate-pulse-fast cursor-pointer`}
                        >
                            <div className="bg-[#1a0b2e] rounded-[22px] p-4 flex items-center gap-4 h-full relative overflow-hidden">
                                <div className="absolute right-0 bottom-0 opacity-20 text-6xl rotate-12 translate-x-4 translate-y-4">🦍</div>
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-neon border border-white/20 bg-white/10`}>
                                    📈
                                </div>
                                <div className="text-left flex-1 relative z-10">
                                    <h3 className="font-game text-xl text-white leading-none mb-1 text-stroke-black">WALL STREET ZOO</h3>
                                    <p className="text-[10px] text-gray-300 font-bold leading-tight">
                                        Trade Stocks. Get Rich. No Cap.
                                    </p>
                                </div>
                            </div>
                        </button>

                        {/* WORLDS */}
                        <div className="w-full space-y-6">
                            {WORLDS_METADATA.map((world, index) => {
                                // STRICT UNLOCK LOGIC: 
                                // World N unlocks only if World N-1 Level 8 is completed.
                                let isUnlocked = false;
                                let lockMessage = "";

                                if (index === 0) {
                                    isUnlocked = true; // World 1 always unlocked
                                } else {
                                    const prevWorld = WORLDS_METADATA[index - 1];
                                    // ID format must match contentGenerator: NameNoSpaces_l8
                                    const prevWorldLastLevelId = `${prevWorld.id.replace(/\s+/g, '')}_l8`;
                                    
                                    if (user.completedLevels.includes(prevWorldLastLevelId)) {
                                        isUnlocked = true;
                                    } else {
                                        isUnlocked = false;
                                        lockMessage = `Complete ${prevWorld.title} to unlock`;
                                    }
                                }

                                const normalizedWorldId = world.id.replace(/\s+/g, '');
                                const completedInWorld = user.completedLevels.filter(l => l.startsWith(normalizedWorldId)).length;
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
                                                <div className="text-[10px] font-bold text-red-400 uppercase flex items-center gap-1">
                                                    <LockClosedIcon className="w-3 h-3" /> {lockMessage}
                                                </div>
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
                            <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar snap-x">
                                {sortedShopItems.filter(i => i.active !== false).map(item => {
                                    const owned = user.inventory.includes(item.id);
                                    return (
                                        <div key={item.id} className={`flex-shrink-0 w-36 snap-start bg-[#1e112a] border-2 rounded-2xl p-3 flex flex-col items-center text-center relative overflow-hidden group ${owned ? 'border-gray-600 opacity-70' : 'border-neon-pink/30'}`}>
                                            {owned && <div className="absolute top-2 right-2 bg-green-500 text-black text-[9px] font-bold px-1 rounded">OWNED</div>}
                                            <div className="text-4xl mb-2 mt-2 transition-transform group-hover:scale-110">{item.emoji}</div>
                                            <div className="font-game text-white text-sm leading-none mb-1 h-8 flex items-center justify-center">{item.name}</div>
                                            <button 
                                                onClick={() => !owned && handleBuy(item)}
                                                disabled={owned}
                                                className={`w-full mt-2 font-bold py-1 rounded-lg text-xs transition-all flex items-center justify-center gap-1 
                                                    ${owned ? 'bg-transparent text-gray-500' : 'bg-white/10 hover:bg-neon-pink hover:text-black text-white border border-white/20'}
                                                `}
                                            >
                                                {owned ? 'In Bag' : <><span className="text-yellow-400 group-hover:text-black">🪙</span> {item.cost}</>}
                                            </button>
                                        </div>
                                    );
                                })}
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
                                    <ShareIcon className="w-5 h-5" /> SHARE
                                </button>
                            </div>

                            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-purple-300">
                                <UserPlusIcon className="w-4 h-4" />
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
