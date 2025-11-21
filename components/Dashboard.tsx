
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { Avatar } from './Avatar';
import { SocialShare } from './SocialShare';
import { 
    BoltIcon, 
    CheckBadgeIcon, 
    LockClosedIcon, 
    StarIcon,
    ShoppingBagIcon,
    TrophyIcon,
    GiftIcon,
    FireIcon,
    ChartBarIcon,
    UserGroupIcon,
    QrCodeIcon
} from '@heroicons/react/24/solid';
import { 
    WORLDS_METADATA, 
    ShopItem, 
    LeaderboardEntry, 
    UserState, 
    getXpForNextLevel, 
    getMockLeaderboard, 
    SHOP_ITEMS,
    SEASONAL_EVENTS,
    Challenge
} from '../services/gamification';
import { generateLinkCode } from '../services/portal';
import { playSound } from '../services/audio';
import { GET_WORLD_LEVELS } from '../services/content';

interface DashboardProps {
    user: UserState;
    onOpenWorld: (worldId: string) => void;
    onClaimReward: (xp: number, coins: number) => void;
    onBuyItem: (item: ShopItem) => void;
    onOpenZoo: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onOpenWorld, onClaimReward, onBuyItem, onOpenZoo }) => {
    const [activeTab, setActiveTab] = useState<'map' | 'leaderboard' | 'social'>('map');
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(getMockLeaderboard());
    const [showChestModal, setShowChestModal] = useState(false);
    const [showSocialShare, setShowSocialShare] = useState<{type: any, data: any} | null>(null);
    const [familyCode, setFamilyCode] = useState<string | null>(null);
    
    // Challenges State
    const completedChallengesCount = user.dailyChallenges.filter(c => c.completed).length;
    const allChallengesCompleted = completedChallengesCount === user.dailyChallenges.length;

    // Calculate XP Progress
    const nextLevelXp = getXpForNextLevel(user.level);
    const currentLevelBaseXp = getXpForNextLevel(user.level - 1);
    const levelProgress = Math.min(100, Math.max(0, ((user.xp - currentLevelBaseXp) / (nextLevelXp - currentLevelBaseXp)) * 100));

    const handleChallengeClick = (challenge: Challenge) => {
        if (challenge.completed) return;
        
        // For demo: auto-complete on click if it's not the hard one
        if (challenge.difficulty !== 'hard') {
             playSound('success');
             onClaimReward(challenge.rewardXp, challenge.rewardCoins);
             // Update local state would happen via parent, but we simulate here for UI feedback
             challenge.completed = true; // Mutation for demo only
             (window as any).confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        } else {
            alert("Go to Wall Street Zoo to complete this!");
            onOpenZoo();
        }
    };

    const handleBuy = (item: ShopItem) => {
        if (user.coins >= item.cost) {
            playSound('coin');
            onBuyItem(item);
            if (navigator.vibrate) navigator.vibrate(50);
        } else {
            playSound('error');
        }
    };

    const handleShareStreak = () => {
        setShowSocialShare({
            type: 'streak',
            data: {
                value: `${user.streak} DAYS`,
                subtitle: 'Can you beat me?',
                avatar: user.avatar,
                nickname: user.nickname
            }
        });
    };

    const handleGenerateCode = () => {
        playSound('pop');
        setFamilyCode(generateLinkCode());
    };

    const zooUnlocked = user.level >= 20;

    return (
        <div className="relative pb-24 max-w-md mx-auto md:max-w-2xl">
            
            {/* SEASONAL BANNER */}
            {SEASONAL_EVENTS.active && (
                <div className={`bg-gradient-to-r ${SEASONAL_EVENTS.themeColor} text-white text-xs font-bold py-2 px-4 text-center flex items-center justify-center gap-2 animate-pulse-fast cursor-pointer sticky top-0 z-[60]`}>
                    <span className="text-lg">{SEASONAL_EVENTS.icon}</span>
                    <span className="uppercase tracking-widest">{SEASONAL_EVENTS.title} LIVE!</span>
                </div>
            )}

            {/* HEADER */}
            <div className="sticky top-8 z-50 px-4 pt-2 pb-2 bg-[#1a0b2e]/95 backdrop-blur-sm border-b border-white/5">
                
                {/* Top Row: Stats & Fire */}
                <div className="flex items-center justify-between mb-4">
                    
                    {/* User Info */}
                    <div className="flex items-center gap-3">
                        <div className="relative group cursor-pointer" onClick={() => setShowSocialShare({type: 'levelup', data: { value: `LVL ${user.level}`, subtitle: 'Rising Star', avatar: user.avatar, nickname: user.nickname}})}>
                            <Avatar level={user.level} size="sm" customConfig={user.avatar} />
                            <div className="absolute -bottom-1 -right-1 bg-neon-blue text-black text-[10px] font-black px-1.5 rounded-full border border-white">
                                {user.level}
                            </div>
                        </div>
                        <div>
                             <div className="text-white font-bold text-lg leading-none font-game">{user.nickname}</div>
                             <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase mt-1">
                                <span className="text-yellow-400">🪙 {user.coins.toLocaleString()}</span>
                             </div>
                        </div>
                    </div>

                    {/* GIANT STREAK FIRE */}
                    <button onClick={handleShareStreak} className="flex flex-col items-center relative group">
                         <div className={`text-5xl transition-transform group-hover:scale-110 drop-shadow-[0_0_15px_rgba(255,165,0,0.6)] ${user.streak > 7 ? 'animate-fire-flicker text-blue-400' : 'animate-pulse text-orange-500'}`}>
                             {user.streak > 30 ? '💎' : user.streak > 7 ? '🔥' : '🔥'}
                         </div>
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-black text-black text-xl mt-2 pointer-events-none">
                             {user.streak}
                         </div>
                         <div className="text-[9px] text-orange-400 font-black uppercase tracking-wider bg-black/50 px-2 rounded-full mt-[-5px]">
                             Streak
                         </div>
                    </button>
                </div>

                {/* CHALLENGE CHEST WIDGET */}
                <div 
                    onClick={() => setShowChestModal(true)}
                    className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-2xl p-1 cursor-pointer btn-3d group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes-light.png')] opacity-10"></div>
                    <div className="flex items-center justify-between px-4 py-2 relative z-10">
                        <div className="flex items-center gap-3">
                             <div className={`text-3xl transition-transform ${allChallengesCompleted ? 'animate-chest-shake' : 'group-hover:rotate-12'}`}>
                                 {allChallengesCompleted ? '💰' : '🎁'}
                             </div>
                             <div className="text-left">
                                 <div className="text-white font-game text-sm uppercase">Daily Loot</div>
                                 <div className="text-[10px] text-indigo-300 font-bold flex items-center gap-1">
                                     {completedChallengesCount}/3 Complete
                                     {allChallengesCompleted && <span className="text-neon-green">Ready!</span>}
                                 </div>
                             </div>
                        </div>
                        {/* Progress Dots */}
                        <div className="flex gap-1">
                            {user.dailyChallenges.map((c, i) => (
                                <div key={i} className={`w-2 h-2 rounded-full ${c.completed ? 'bg-neon-green shadow-neon' : 'bg-white/20'}`}></div>
                            ))}
                        </div>
                    </div>
                    {/* Progress Bar Bottom */}
                    <div className="h-1 w-full bg-black/20 mt-1">
                        <div className="h-full bg-neon-green transition-all duration-500" style={{ width: `${(completedChallengesCount / 3) * 100}%` }}></div>
                    </div>
                </div>
            </div>

            {/* MAIN SCROLL CONTENT */}
            <div className="px-4 mt-6 space-y-8">
                
                {/* TABS */}
                <div className="flex justify-center gap-2 mb-6 p-1 bg-white/5 rounded-full border border-white/5">
                    {['map', 'leaderboard', 'social'].map((t) => (
                        <button 
                            key={t}
                            onClick={() => { playSound('click'); setActiveTab(t as any) }}
                            className={`flex-1 py-2 rounded-full font-game text-sm uppercase tracking-wide transition-all ${activeTab === t ? 'bg-white text-black shadow-lg scale-105' : 'text-gray-500 hover:text-white'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {/* VIEW: MAP */}
                {activeTab === 'map' && (
                    <div className="relative flex flex-col items-center gap-8 py-4">
                         {/* WALL STREET ZOO CARD */}
                        <button 
                            onClick={onOpenZoo}
                            className={`w-full rounded-3xl p-[2px] btn-3d group transition-all
                                ${zooUnlocked 
                                    ? 'bg-gradient-to-r from-neon-green via-white to-neon-green animate-pulse-fast cursor-pointer' 
                                    : 'bg-gray-800 cursor-not-allowed grayscale opacity-80'
                                }
                            `}
                        >
                            <div className="bg-[#1a0b2e] rounded-[22px] p-4 flex items-center gap-4 h-full relative overflow-hidden">
                                <div className="absolute right-0 bottom-0 opacity-20 text-6xl rotate-12 translate-x-4 translate-y-4">🦍</div>
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-neon border border-white/20 ${zooUnlocked ? 'bg-white/10' : 'bg-black/50'}`}>
                                    📈
                                </div>
                                <div className="text-left flex-1 relative z-10">
                                    <h3 className="font-game text-xl text-white leading-none mb-1 text-stroke-black">WALL STREET ZOO</h3>
                                    <p className="text-[10px] text-gray-300 font-bold leading-tight">
                                        {zooUnlocked ? 'Trade Stocks. Get Rich. No Cap.' : 'Unlocks at Level 20'}
                                    </p>
                                </div>
                            </div>
                        </button>

                        {/* WORLDS LIST */}
                        <div className="w-full space-y-6">
                            {WORLDS_METADATA.map((world, index) => {
                                const isUnlocked = user.level >= world.unlockLevel;
                                const worldLevels = GET_WORLD_LEVELS(world.id);
                                const completedInWorld = worldLevels.filter(l => user.completedLevels.includes(l.id)).length;
                                const isCompleted = completedInWorld === worldLevels.length;
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
                                                : 'bg-black border-gray-800 opacity-60 grayscale'
                                            }
                                        `}
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${isUnlocked ? 'bg-black/20' : 'bg-transparent'}`}>
                                            {isUnlocked ? <Icon className="w-8 h-8" /> : <LockClosedIcon className="w-6 h-6 text-gray-500" />}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <h3 className={`font-game text-lg leading-none mb-1 ${isUnlocked ? 'text-white text-stroke-black' : 'text-gray-500'}`}>
                                                {world.title}
                                            </h3>
                                            {isUnlocked && (
                                                <div className="text-[10px] font-bold text-black/60 uppercase">{completedInWorld}/{worldLevels.length} Levels</div>
                                            )}
                                        </div>
                                        {isCompleted && <StarIcon className="w-8 h-8 text-yellow-400 drop-shadow-md" />}
                                    </button>
                                );
                            })}
                        </div>

                         {/* SHOP CAROUSEL */}
                         <div className="w-full pt-8 border-t border-white/10">
                            <div className="flex items-center justify-between px-2 mb-3">
                                <h2 className="font-game text-xl text-white flex items-center gap-2">
                                    <ShoppingBagIcon className="w-6 h-6 text-neon-pink" />
                                    ITEM SHOP
                                </h2>
                            </div>
                            <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar snap-x">
                                {SHOP_ITEMS.map(item => (
                                    <div key={item.id} className="flex-shrink-0 w-36 snap-start bg-[#1e112a] border-2 border-neon-pink/30 rounded-2xl p-3 flex flex-col items-center text-center relative overflow-hidden group">
                                        <div className="text-4xl mb-2 mt-2 transition-transform group-hover:scale-110">{item.emoji}</div>
                                        <div className="font-game text-white text-sm leading-none mb-1">{item.name}</div>
                                        <button 
                                            onClick={() => handleBuy(item)}
                                            className="w-full mt-2 bg-white/10 hover:bg-neon-pink hover:text-black border border-white/20 text-white font-bold py-1 rounded-lg text-xs transition-all flex items-center justify-center gap-1"
                                        >
                                            <span className="text-yellow-400 group-hover:text-black">🪙</span> {item.cost}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEW: LEADERBOARD */}
                {activeTab === 'leaderboard' && (
                    <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden">
                        <div className="bg-black/40 p-4 border-b border-white/10 flex justify-between items-center">
                             <h2 className="font-game text-xl text-white flex items-center gap-2">
                                <TrophyIcon className="w-6 h-6 text-yellow-400" />
                                TOP PLAYERS
                            </h2>
                            <span className="text-xs font-mono text-gray-400">Resets Weekly</span>
                        </div>
                        <div className="divide-y divide-white/5">
                            {leaderboard.map((entry) => (
                                <div key={entry.rank} className={`flex items-center p-4 ${entry.rank === 1 ? 'bg-yellow-400/10' : ''}`}>
                                    <div className="font-black text-lg text-white w-8">{entry.rank}</div>
                                    <div className="text-2xl mr-4">{entry.avatar}</div>
                                    <div className="flex-1">
                                        <div className="font-bold text-white">{entry.name}</div>
                                        <div className="text-xs text-gray-500">{entry.country}</div>
                                    </div>
                                    <div className="font-mono font-bold text-neon-green">{entry.xp.toLocaleString()} XP</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* VIEW: SOCIAL */}
                {activeTab === 'social' && (
                    <div className="text-center py-12 space-y-8">
                        <div>
                            <div className="text-6xl mb-4">👯‍♀️</div>
                            <h2 className="font-game text-2xl text-white mb-2">SQUAD GOALS</h2>
                            <p className="text-gray-400 mb-8 px-8">Invite your friends to compete in Wall Street Zoo and earn 10,000 Coins!</p>
                            
                            <button className="bg-neon-blue text-black font-game text-xl px-8 py-4 rounded-full btn-3d mb-4 w-full">
                                INVITE FRIENDS
                            </button>
                            <div className="text-xs text-gray-500 font-bold uppercase">Your Code: RICH-KID-99</div>
                        </div>

                        {/* PARENT LINKING SECTION */}
                        <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
                             <h2 className="font-game text-xl text-white mb-2 flex items-center justify-center gap-2">
                                 <QrCodeIcon className="w-6 h-6 text-neon-pink" />
                                 LINK PARENT
                             </h2>
                             <p className="text-gray-400 text-sm mb-6">
                                 Unlock the FinQuest Debit Card and show off your mastery.
                             </p>
                             
                             {!familyCode ? (
                                 <button 
                                     onClick={handleGenerateCode}
                                     className="w-full py-3 bg-white/10 hover:bg-neon-pink hover:text-white text-neon-pink font-bold rounded-xl border border-neon-pink/30 transition-all"
                                 >
                                     Generate Family Code
                                 </button>
                             ) : (
                                 <div className="bg-black/40 p-4 rounded-xl animate-pop-in">
                                     <div className="text-xs text-gray-500 uppercase font-bold mb-1">Give this to your parent</div>
                                     <div className="font-mono text-3xl text-white font-bold tracking-widest select-all">
                                         {familyCode}
                                     </div>
                                 </div>
                             )}
                        </div>
                    </div>
                )}

            </div>

            {/* CHALLENGE MODAL */}
            {showChestModal && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-[#1a0b2e] w-full max-w-md rounded-3xl border-4 border-indigo-500 overflow-hidden relative">
                        <button onClick={() => setShowChestModal(false)} className="absolute top-4 right-4 text-white z-20"><span className="text-2xl">✖</span></button>
                        
                        <div className="bg-indigo-900/50 p-8 text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                            <div className="text-6xl mb-4 animate-bounce">{allChallengesCompleted ? '💰' : '🎁'}</div>
                            <h2 className="font-game text-3xl text-white text-stroke-black">DAILY LOOT</h2>
                            <p className="text-indigo-200 font-bold">Complete all 3 to unlock the chest!</p>
                        </div>

                        <div className="p-6 space-y-4">
                            {user.dailyChallenges.map((quest) => (
                                <button 
                                    key={quest.id} 
                                    onClick={() => handleChallengeClick(quest)}
                                    disabled={quest.completed}
                                    className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between text-left transition-all
                                        ${quest.completed 
                                            ? 'bg-green-500/10 border-green-500 opacity-50' 
                                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                                        }
                                    `}
                                >
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded text-black ${quest.difficulty === 'easy' ? 'bg-green-400' : quest.difficulty === 'medium' ? 'bg-yellow-400' : 'bg-red-500'}`}>
                                                {quest.difficulty}
                                            </span>
                                            <h4 className="font-bold text-white">{quest.title}</h4>
                                        </div>
                                        <p className="text-xs text-gray-400">{quest.description}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        {quest.completed ? (
                                            <CheckBadgeIcon className="w-8 h-8 text-green-500" />
                                        ) : (
                                            <>
                                                <span className="text-xs font-bold text-neon-blue">+{quest.rewardXp} XP</span>
                                                <span className="text-xs font-bold text-yellow-400">+{quest.rewardCoins} 🪙</span>
                                            </>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* SOCIAL SHARE MODAL */}
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
