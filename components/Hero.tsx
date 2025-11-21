/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { SparklesIcon, BoltIcon } from '@heroicons/react/24/solid';
import { Avatar } from './Avatar';
import { useUserStore } from '../services/useUserStore';
import { getXpForNextLevel } from '../services/gamification';

// Props are now optional as we prefer store, but kept for compatibility if needed
interface HeaderProps {
    xp?: number;
    level?: number;
    streak?: number;
}

export const Hero: React.FC<HeaderProps> = () => {
  const { user } = useUserStore();
  
  if (!user) return null;

  const nextLevelXp = getXpForNextLevel(user.level);
  const prevLevelXp = getXpForNextLevel(user.level - 1);
  const progressPercent = Math.min(100, Math.max(0, ((user.xp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100));

  return (
    <div className="w-full max-w-4xl mx-auto mb-8 px-4 sticky top-4 z-40 pointer-events-none">
        <div className="glass-panel rounded-3xl p-3 md:p-4 flex items-center gap-4 pointer-events-auto bg-black/40">
            
            {/* Avatar / Player */}
            <div className="flex-shrink-0 -ml-2">
                <Avatar level={user.level} size="md" customConfig={user.avatar} />
            </div>

            {/* Stats Display */}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-end mb-1">
                    <h1 className="font-game text-2xl md:text-3xl text-white tracking-wide drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                        LVL {user.level} <span className="text-neon-blue text-lg ml-1 font-body font-bold">NOOB SAVER</span>
                    </h1>
                    <div className="flex items-center gap-1 text-neon-yellow font-game text-xl drop-shadow-sm">
                        <BoltIcon className="w-6 h-6 animate-pulse" />
                        <span>{user.streak}</span>
                    </div>
                </div>

                {/* XP Bar */}
                <div className="relative h-6 bg-black/60 rounded-full border-2 border-black/50 overflow-hidden shadow-inner">
                    <div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-neon-green to-emerald-400 shadow-[0_0_15px_rgba(0,255,136,0.5)] transition-all duration-700 ease-out"
                        style={{ width: `${progressPercent}%` }}
                    >
                        {/* Shine effect on bar */}
                        <div className="absolute inset-0 bg-white/30 skew-x-12 w-full -translate-x-full animate-[shimmer_2s_infinite]"></div>
                    </div>
                    <p className="absolute inset-0 flex items-center justify-center text-xs font-black text-white drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">
                        {user.xp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP
                    </p>
                </div>
            </div>

            {/* Currency / Store Button (Visual) */}
            <div className="hidden sm:flex flex-col items-center justify-center bg-white/10 rounded-2xl p-2 border border-white/10 btn-3d cursor-pointer active:scale-95">
                <SparklesIcon className="w-8 h-8 text-neon-pink mb-1" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Shop</span>
            </div>
        </div>
    </div>
  );
};