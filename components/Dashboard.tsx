
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { Avatar } from './Avatar';
import { 
    BoltIcon, 
    CurrencyDollarIcon, 
    CheckBadgeIcon, 
    LockClosedIcon, 
    StarIcon,
    ShoppingBagIcon,
    TrophyIcon,
    GiftIcon,
    ClockIcon,
    FireIcon
} from '@heroicons/react/24/solid';
import { WORLDS, Quest, ShopItem, LeaderboardEntry, UserState, getXpForNextLevel, getMockLeaderboard, generateDailyQuests, SHOP_ITEMS } from '../services/gamification';
import { playSound } from '../services/audio';

interface DashboardProps {
    user: UserState;
    onPlayWorld: (worldId: string, prompt: string) => void;
    onClaimReward: (xp: number, coins: number) => void;
    onBuyItem: (item: ShopItem) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onPlayWorld, onClaimReward, onBuyItem }) => {
    const [activeTab, setActiveTab] = useState<'map' | 'leaderboard'>('map');
    const [quests, setQuests] = useState<Quest[]>(generateDailyQuests());
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(getMockLeaderboard());
    const [dailyRewardClaimed, setDailyRewardClaimed] = useState(false);

    // Calculate XP Progress
    const nextLevelXp = getXpForNextLevel(user.level);
    const currentLevelBaseXp = getXpForNextLevel(user.level - 1);
    const levelProgress = Math.min(100, Math.max(0, ((user.xp - currentLevelBaseXp) / (nextLevelXp - currentLevelBaseXp)) * 100));

    const handleQuestClaim = (questId: string) => {
        setQuests(prev => prev.map(q => {
            if (q.id === questId && !q.completed) {
                playSound('success');
                onClaimReward(q.rewardXp, q.rewardCoins);
                
                // Trigger confetti
                (window as any).confetti({
                    particleCount: 50,
                    spread: 60,
                    origin: { y: 0.7 }
                });
                
                return { ...q, completed: true };
            }
            return q;
        }));
    };

    const handleDailyReward = () => {
        if (dailyRewardClaimed) return;
        playSound('chest');
        setDailyRewardClaimed(true);
        onClaimReward(200, 500);
        (window as any).confetti({
             particleCount: 150,
             spread: 100,
             origin: { y: 0.5 },
             colors: ['#FFFF00', '#FFA500']
        });
    };

    const handleBuy = (item: ShopItem) => {
        if (user.coins >= item.cost) {
            playSound('coin');
            onBuyItem(item);
            // Haptic feedback if available
            if (navigator.vibrate) navigator.vibrate(50);
        } else {
            playSound('error');
        }
    };

    return (
        <div className="relative pb-24 max-w-md mx-auto md:max-w-2xl">
            
            {/* FIXED HEADER */}
            <div className="sticky top-0 z-50 px-4 pt-4 pb-2 bg-gradient-to-b from-[#2a1b3d] via-[#2a1b3d]/95 to-transparent backdrop-blur-sm">
                
                {/* Top Row: Stats */}
                <div className="flex items-center justify-between mb-3 bg-black/40 p-2 rounded-full border border-white/10 shadow-lg">
                    <div className="flex items-center gap-2 pl-1">
                        <div className="relative">
                            <Avatar level={user.level} size="sm" customConfig={user.avatar} />
                            <div className="absolute -bottom-1 -right-1 bg-neon-blue text-black text-[10px] font-black px-1.5 rounded-full border border-white">
                                {user.level}
                            </div>
                        </div>
                        <div>
                             <div className="text-white font-bold text-sm leading-none">{user.nickname}</div>
                             <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                                {user.level < 5 ? 'Rookie' : user.level < 10 ? 'Hustler' : 'Boss'}
                             </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pr-3">
                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1 text-neon-yellow font-black text-lg leading-none drop-shadow-md">
                                <FireIcon className="w-5 h-5 animate-pulse" />
                                {user.streak}
                            </div>
                            <div className="text-[9px] text-gray-400 font-bold uppercase">Streak</div>
                        </div>
                        <div className="h-8 w-[1px] bg-white/10"></div>
                        <div className="flex flex-col items-end">
                             <div className="flex items-center gap-1 text-white font-black text-lg leading-none">
                                <span className="text-xl">🪙</span>
                                {user.coins.toLocaleString()}
                            </div>
                             <div className="text-[9px] text-gray-400 font-bold uppercase">Coins</div>
                        </div>
                    </div>
                </div>

                {/* XP Bar */}
                <div className="relative h-5 bg-black rounded-full border border-white/10 overflow-hidden mb-2 shadow-inner">
                    <div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-neon-pink to-purple-500 transition-all duration-1000 ease-out"
                        style={{ width: `${levelProgress}%` }}
                    >
                        <div className="absolute inset-0 bg-white/20 w-full -translate-x-full animate-[shimmer_2s_infinite]"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white tracking-widest drop-shadow-md">
                        {user.xp} / {nextLevelXp} XP
                    </div>
                </div>

                {/* Daily Reward Button */}
                {!dailyRewardClaimed && (
                    <button 
                        onClick={handleDailyReward}
                        className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 p-2 rounded-xl flex items-center justify-between shadow-lg btn-3d animate-pulse-fast mb-2 group"
                    >
                        <div className="flex items-center gap-3">
                            <GiftIcon className="w-8 h-8 text-white group-hover:rotate-12 transition-transform" />
                            <div className="text-left">
                                <div className="text-black font-black text-sm uppercase">Daily Chest Ready!</div>
                                <div className="text-black/70 text-[10px] font-bold">Tap to claim 500 Coins + XP</div>
                            </div>
                        </div>
                        <div className="bg-white text-orange-600 px-3 py-1 rounded-lg font-black text-xs">OPEN</div>
                    </button>
                )}
            </div>

            {/* MAIN SCROLL CONTENT */}
            <div className="px-4 space-y-8">
                
                {/* TABS */}
                <div className="flex justify-center gap-4 mb-6">
                    <button 
                        onClick={() => { playSound('click'); setActiveTab('map') }}
                        className={`px-6 py-2 rounded-full font-game text-xl tracking-wide transition-all ${activeTab === 'map' ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)] scale-105' : 'bg-black/30 text-gray-500'}`}
                    >
                        MAP
                    </button>
                    <button 
                         onClick={() => { playSound('click'); setActiveTab('leaderboard') }}
                        className={`px-6 py-2 rounded-full font-game text-xl tracking-wide transition-all ${activeTab === 'leaderboard' ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)] scale-105' : 'bg-black/30 text-gray-500'}`}
                    >
                        RANKS
                    </button>
                </div>

                {/* VIEW: MAP */}
                {activeTab === 'map' && (
                    <>
                        {/* HERO PROGRESS MAP */}
                        <div className="relative flex flex-col items-center gap-8 py-8">
                             {/* Vertical Line */}
                            <div className="absolute top-0 bottom-0 left-1/2 w-4 bg-black/30 -translate-x-1/2 rounded-full">
                                <div 
                                    className="w-full bg-neon-green rounded-full transition-all duration-1000"
                                    style={{ height: `${(user.completedWorlds.length / WORLDS.length) * 100}%` }}
                                ></div>
                            </div>

                            {WORLDS.map((world, index) => {
                                const isUnlocked = user.level >= world.unlockLevel || index === 0 || user.completedWorlds.includes(WORLDS[Math.max(0, index-1)].id);
                                const isCompleted = user.completedWorlds.includes(world.id);
                                const isNext = !isCompleted && isUnlocked && (index === 0 || user.completedWorlds.includes(WORLDS[index-1].id));
                                const Icon = world.icon;

                                return (
                                    <div key={world.id} className="relative z-10 w-full flex justify-center">
                                        {/* Level Indicator Bubble */}
                                        <div className={`absolute left-4 md:left-20 top-1/2 -translate-y-1/2 text-xs font-bold ${isUnlocked ? 'text-white' : 'text-gray-600'}`}>
                                            LVL {world.unlockLevel}
                                        </div>

                                        <button
                                            onClick={() => isUnlocked && onPlayWorld(world.id, world.prompt)}
                                            disabled={!isUnlocked}
                                            className={`
                                                group relative w-64 h-24 rounded-3xl border-4 transition-all duration-300 flex items-center px-4 gap-4
                                                ${isNext 
                                                    ? `${world.color} border-white scale-110 shadow-[0_0_30px_rgba(255,255,255,0.3)] animate-bounce` 
                                                    : isCompleted 
                                                        ? 'bg-gray-800 border-gray-600 grayscale opacity-80'
                                                        : 'bg-black border-gray-800 opacity-60'
                                                }
                                            `}
                                        >
                                            <div className={`
                                                w-12 h-12 rounded-xl flex items-center justify-center text-white
                                                ${isUnlocked ? 'bg-black/20' : 'bg-transparent'}
                                            `}>
                                                {isUnlocked ? <Icon className="w-8 h-8" /> : <LockClosedIcon className="w-6 h-6 text-gray-500" />}
                                            </div>
                                            
                                            <div className="flex-1 text-left">
                                                <h3 className={`font-game text-lg leading-none mb-1 ${isUnlocked ? 'text-white text-stroke-black' : 'text-gray-500'}`}>
                                                    {world.title}
                                                </h3>
                                                {isNext && <div className="text-[10px] font-bold bg-black/30 inline-block px-2 py-0.5 rounded-full text-white animate-pulse">START HERE</div>}
                                                {isCompleted && <div className="text-[10px] font-bold text-green-400 flex items-center gap-1"><CheckBadgeIcon className="w-3 h-3"/> DONE</div>}
                                                {!isUnlocked && <div className="text-[10px] font-bold text-gray-500">LOCKED</div>}
                                            </div>

                                            {/* Completion Stars */}
                                            {isCompleted && (
                                                <div className="absolute -top-2 -right-2 flex">
                                                    <StarIcon className="w-6 h-6 text-yellow-400 drop-shadow-md" />
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* ACTIVE QUESTS */}
                        <div className="bg-white/5 rounded-3xl p-5 border border-white/10">
                            <div className="flex items-center gap-2 mb-4">
                                <CheckBadgeIcon className="w-6 h-6 text-neon-green" />
                                <h2 className="font-game text-xl text-white">TODAY'S QUESTS</h2>
                            </div>
                            <div className="space-y-3">
                                {quests.map(quest => (
                                    <div key={quest.id} className="bg-black/40 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-sm text-white">{quest.title}</h4>
                                            <p className="text-xs text-gray-400 mb-2">{quest.description}</p>
                                            <div className="flex items-center gap-2 text-[10px] font-bold">
                                                <span className="text-neon-blue flex items-center gap-0.5"><BoltIcon className="w-3 h-3"/> {quest.rewardXp} XP</span>
                                                <span className="text-yellow-400 flex items-center gap-0.5">🪙 {quest.rewardCoins}</span>
                                            </div>
                                        </div>
                                        {quest.completed ? (
                                            <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-lg text-xs font-black uppercase border border-green-500/50">
                                                CLAIMED
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => handleQuestClaim(quest.id)} // Simulate progress for demo
                                                className="bg-neon-blue text-black px-4 py-2 rounded-lg text-xs font-black uppercase btn-3d hover:bg-cyan-300"
                                            >
                                                GO
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* SHOP CAROUSEL */}
                        <div className="pt-4">
                            <div className="flex items-center justify-between px-2 mb-3">
                                <h2 className="font-game text-xl text-white flex items-center gap-2">
                                    <ShoppingBagIcon className="w-6 h-6 text-neon-pink" />
                                    ITEM SHOP
                                </h2>
                                <span className="text-xs font-bold text-neon-yellow animate-pulse">New Stock!</span>
                            </div>
                            
                            <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar snap-x">
                                {SHOP_ITEMS.map(item => (
                                    <div key={item.id} className="flex-shrink-0 w-40 snap-start bg-[#1e112a] border-2 border-neon-pink/30 rounded-2xl p-3 flex flex-col items-center text-center relative overflow-hidden group">
                                        {item.limitedTime && (
                                            <div className="absolute top-0 left-0 w-full bg-red-600 text-white text-[8px] font-black py-0.5 uppercase tracking-widest">
                                                Limited Time
                                            </div>
                                        )}
                                        <div className="text-5xl mb-2 mt-2 transition-transform group-hover:scale-110">{item.emoji}</div>
                                        <div className="font-game text-white text-lg leading-none mb-1">{item.name}</div>
                                        <div className="text-[10px] text-gray-400 mb-3 h-8 leading-tight">{item.description}</div>
                                        
                                        <button 
                                            onClick={() => handleBuy(item)}
                                            className="w-full bg-white/10 hover:bg-neon-pink hover:text-black border border-white/20 text-white font-bold py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1"
                                        >
                                            <span className="text-yellow-400 group-hover:text-black">🪙</span> {item.cost}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* VIEW: LEADERBOARD */}
                {activeTab === 'leaderboard' && (
                    <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden">
                        <div className="bg-black/40 p-4 border-b border-white/10 flex justify-between items-center">
                             <h2 className="font-game text-xl text-white flex items-center gap-2">
                                <TrophyIcon className="w-6 h-6 text-yellow-400" />
                                GLOBAL TOP 100
                            </h2>
                            <span className="text-xs font-mono text-gray-400">Resets in 2d 14h</span>
                        </div>
                        
                        <div className="divide-y divide-white/5">
                            {leaderboard.map((entry) => (
                                <div key={entry.rank} className={`flex items-center p-4 ${entry.rank === 1 ? 'bg-yellow-400/10' : ''}`}>
                                    <div className={`w-8 text-center font-black text-lg ${entry.rank === 1 ? 'text-yellow-400 text-2xl' : entry.rank === 2 ? 'text-gray-300' : entry.rank === 3 ? 'text-orange-400' : 'text-gray-500'}`}>
                                        {entry.rank}
                                    </div>
                                    <div className="w-10 h-10 bg-black/30 rounded-full flex items-center justify-center text-xl border border-white/10 mx-3">
                                        {entry.avatar}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-white">{entry.name}</div>
                                        <div className="text-xs text-gray-500">{entry.country}</div>
                                    </div>
                                    <div className="font-mono font-bold text-neon-green">
                                        {entry.xp.toLocaleString()} XP
                                    </div>
                                </div>
                            ))}
                            {/* User Rank (Fixed at bottom if list was long, but here inline) */}
                            <div className="flex items-center p-4 bg-neon-blue/10 border-t-2 border-neon-blue/30">
                                <div className="w-8 text-center font-black text-lg text-white">99</div>
                                <div className="w-10 h-10 bg-black/30 rounded-full flex items-center justify-center text-xl border border-white/10 mx-3">
                                    {user.avatar.emoji}
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-white">{user.nickname} (You)</div>
                                    <div className="text-xs text-neon-blue font-bold">RISING STAR</div>
                                </div>
                                <div className="font-mono font-bold text-white">
                                    {user.xp.toLocaleString()} XP
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
