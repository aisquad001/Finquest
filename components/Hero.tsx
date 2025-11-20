/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { SparklesIcon, BoltIcon, TrophyIcon, UserCircleIcon } from '@heroicons/react/24/solid';

interface HeaderProps {
    xp: number;
    level: number;
    streak: number;
}

export const Hero: React.FC<HeaderProps> = ({ xp, level, streak }) => {
  const nextLevelXp = level * 1000;
  const progressPercent = Math.min(100, (xp / nextLevelXp) * 100);

  return (
    <div className="w-full max-w-5xl mx-auto mb-6 px-4 md:px-0">
        {/* Main Header Card */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 md:p-6 backdrop-blur-md shadow-2xl relative overflow-hidden">
            
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-green-500/20 blur-[100px] rounded-full pointer-events-none"></div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                
                {/* Profile Section */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 transform rotate-3 hover:rotate-0 transition-all">
                            <UserCircleIcon className="w-10 h-10 text-white" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-black border border-zinc-700 rounded-full px-2 py-0.5 text-[10px] font-bold text-white">
                            LVL {level}
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight italic">FINQUEST</h1>
                        <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono">
                            <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">Novice Saver</span>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-end">
                    
                    {/* XP Bar */}
                    <div className="flex-1 md:flex-none min-w-[140px] bg-black/40 p-3 rounded-xl border border-zinc-800/50">
                        <div className="flex justify-between text-xs mb-1.5 font-bold">
                            <span className="text-yellow-400 flex items-center gap-1">
                                <SparklesIcon className="w-3 h-3" /> XP
                            </span>
                            <span className="text-zinc-500">{xp} / {nextLevelXp}</span>
                        </div>
                        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Streak */}
                    <div className="bg-black/40 p-3 rounded-xl border border-zinc-800/50 flex flex-col items-center min-w-[80px]">
                        <BoltIcon className={`w-5 h-5 mb-1 ${streak > 0 ? 'text-orange-500' : 'text-zinc-600'}`} />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">Streak</span>
                        <span className="text-sm font-black text-white">{streak} 🔥</span>
                    </div>
                    
                    {/* Coins (Visual only for now) */}
                    <div className="hidden sm:flex bg-black/40 p-3 rounded-xl border border-zinc-800/50 flex-col items-center min-w-[80px]">
                        <TrophyIcon className="w-5 h-5 text-purple-400 mb-1" />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">Rank</span>
                        <span className="text-sm font-black text-white">#42</span>
                    </div>

                </div>
            </div>
        </div>
    </div>
  );
};