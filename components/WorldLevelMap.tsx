
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, LockClosedIcon, StarIcon, PlayIcon } from '@heroicons/react/24/solid';
import { fetchLevelsForWorld } from '../services/db';
import { WorldData, LevelData } from '../services/gamification';
import { playSound } from '../services/audio';
import { Avatar } from './Avatar';
import { useUserStore } from '../services/useUserStore';

interface WorldLevelMapProps {
    world: WorldData;
    completedLevels: string[]; // list of level IDs
    onClose: () => void;
    onSelectLevel: (level: LevelData) => void;
}

export const WorldLevelMap: React.FC<WorldLevelMapProps> = ({ world, completedLevels, onClose, onSelectLevel }) => {
    const [levels, setLevels] = useState<LevelData[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useUserStore();
    const scrollRef = useRef<HTMLDivElement>(null);
    
    // Ensure completedLevels is safe
    const safeCompletedLevels = completedLevels || [];

    useEffect(() => {
        const loadLevels = async () => {
            const data = await fetchLevelsForWorld(world.id);
            setLevels(data);
            setLoading(false);
        };
        loadLevels();
    }, [world.id]);

    // Auto-scroll to the current level (which is essentially the 'highest' unlocked one)
    useEffect(() => {
        if (!loading && scrollRef.current) {
            // Small timeout to ensure render
            setTimeout(() => {
                const currentLevelEl = document.getElementById('current-level-indicator');
                if (currentLevelEl) {
                    currentLevelEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    // Scroll to bottom (Level 1) if no current indicator found
                    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
                }
            }, 100);
        }
    }, [loading, levels]);

    return (
        <div className="fixed inset-0 z-40 bg-[#0f0518] flex flex-col font-body overflow-hidden">
            
            {/* Header */}
            <div className={`sticky top-0 z-50 p-4 flex items-center justify-between bg-[#0f0518]/90 backdrop-blur-xl border-b border-white/10 shadow-2xl`}>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => { playSound('click'); onClose(); }}
                        className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 active:scale-95 transition-transform"
                    >
                        <ArrowLeftIcon className="w-6 h-6 text-white" />
                    </button>
                    <div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">World Map</div>
                        <h1 className="font-game text-xl text-white tracking-wide text-stroke-black">{world.title}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/10">
                    <StarIcon className="w-4 h-4 text-yellow-400" />
                    <span className="text-white font-bold text-sm">
                        {levels.filter(l => safeCompletedLevels.includes(l.id)).length}/{levels.length}
                    </span>
                </div>
            </div>

            {/* Map Area - Vertical Climb */}
            <div 
                ref={scrollRef}
                className="flex-1 relative overflow-y-auto overflow-x-hidden bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] bg-fixed"
            >
                {/* Ambient Glows */}
                <div className="fixed top-1/4 left-0 w-64 h-64 bg-purple-900/20 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="fixed bottom-1/4 right-0 w-64 h-64 bg-blue-900/20 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="min-h-full flex flex-col-reverse items-center justify-start py-32 relative">
                    
                    {loading && <div className="text-white animate-pulse mb-20">Loading World Data...</div>}

                    {/* Winding Path Line */}
                    {!loading && levels.length > 0 && (
                        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30" style={{ zIndex: 0 }}>
                            <defs>
                                <linearGradient id="pathGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                                    <stop offset="0%" stopColor="#4ade80" />
                                    <stop offset="100%" stopColor="#3b82f6" />
                                </linearGradient>
                            </defs>
                            {/* We draw a generic S-curve path that roughly aligns with the flex items */}
                             <path 
                                d={`M 50% 100% ${levels.map((_, i) => {
                                    // Calculate vertical position roughly based on item height (160px approx per level)
                                    const y = 100 - ((i + 1) / levels.length) * 100; 
                                    const x = i % 2 === 0 ? '80%' : '20%';
                                    return `Q ${x} ${y}% 50% ${y - 5}%`;
                                }).join(' ')}`}
                                fill="none" 
                                stroke="url(#pathGradient)" 
                                strokeWidth="8" 
                                strokeLinecap="round"
                                strokeDasharray="12 12"
                            />
                        </svg>
                    )}

                    {levels.map((level, index) => {
                        const prevLevelId = index > 0 ? levels[index - 1].id : null;
                        
                        // Strict Sequential Unlock:
                        // Level 1 (index 0) is unlocked by default.
                        // Level N is locked if Level N-1 is NOT completed.
                        const isLocked = index > 0 && (!prevLevelId || !safeCompletedLevels.includes(prevLevelId));
                        
                        const isCompleted = safeCompletedLevels.includes(level.id);
                        const isCurrent = !isLocked && !isCompleted;
                        const isBoss = level.bossName && index === levels.length - 1;

                        // Stagger alignment
                        const alignClass = index % 2 === 0 ? 'translate-x-16' : '-translate-x-16';

                        return (
                            <div key={level.id} className={`relative flex justify-center my-6 w-full z-10 ${alignClass}`}>
                                
                                {/* The Level Node */}
                                <motion.button
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => !isLocked && onSelectLevel(level)}
                                    disabled={isLocked}
                                    className={`
                                        relative w-24 h-24 rounded-[2rem] flex items-center justify-center border-b-8 shadow-2xl transition-all duration-300 group
                                        ${isLocked 
                                            ? 'bg-slate-800 border-slate-900 text-slate-600 cursor-not-allowed' 
                                            : isCompleted 
                                                ? 'bg-yellow-400 border-yellow-600 text-yellow-900'
                                                : 'bg-neon-green border-green-700 text-white animate-float'
                                        }
                                        ${isCurrent ? 'scale-110 ring-4 ring-white/50 shadow-[0_0_50px_rgba(74,222,128,0.5)]' : ''}
                                    `}
                                >
                                    {isLocked ? (
                                        <LockClosedIcon className="w-8 h-8" />
                                    ) : isCompleted ? (
                                        <StarIcon className="w-12 h-12 drop-shadow-md" />
                                    ) : isBoss ? (
                                        <span className="text-5xl filter drop-shadow-md">👹</span>
                                    ) : (
                                        <PlayIcon className="w-10 h-10 ml-1 filter drop-shadow-md" />
                                    )}

                                    {/* Current Level Pulsing Ring */}
                                    {isCurrent && (
                                        <span className="absolute inset-0 rounded-[2rem] border-2 border-white animate-ping opacity-50"></span>
                                    )}
                                </motion.button>

                                {/* Avatar Positioning */}
                                {isCurrent && user && (
                                    <motion.div 
                                        id="current-level-indicator"
                                        initial={{ y: -20, opacity: 0 }}
                                        animate={{ y: -85, opacity: 1 }}
                                        className="absolute z-20 pointer-events-none"
                                    >
                                        <div className="relative">
                                            <Avatar level={user.level} size="sm" customConfig={user.avatar} />
                                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-black rotate-45"></div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Level Label / Card */}
                                <div className={`absolute ${index % 2 === 0 ? '-left-32 text-right' : '-right-32 text-left'} top-1/2 -translate-y-1/2 w-32`}>
                                    <div className={`text-xs font-black uppercase mb-1 ${isLocked ? 'text-slate-600' : isCurrent ? 'text-neon-green' : 'text-yellow-400'}`}>
                                        {isBoss ? 'BOSS BATTLE' : `Level ${index + 1}`}
                                    </div>
                                    <div className={`font-game text-sm leading-tight ${isLocked ? 'text-slate-500' : 'text-white text-shadow-sm'}`}>
                                        {level.title.replace(`Level ${level.levelNumber}:`, '')}
                                    </div>
                                    {isCurrent && (
                                        <div className="bg-white text-black text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-2 animate-bounce">
                                            PLAY NOW
                                        </div>
                                    )}
                                    {isLocked && (
                                        <div className="text-[9px] font-bold text-red-500 mt-1 leading-tight">
                                            Complete Level {index} to unlock
                                        </div>
                                    )}
                                </div>

                            </div>
                        );
                    })}
                    
                    {/* Start Point Graphic */}
                    <div className="mb-8 mt-auto text-center opacity-50">
                        <div className="text-4xl">🏁</div>
                        <div className="font-game text-white text-xs uppercase mt-2">Start Here</div>
                    </div>

                </div>
            </div>
        </div>
    );
};
