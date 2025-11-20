/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { FireIcon, CurrencyDollarIcon, BuildingLibraryIcon, RocketLaunchIcon } from '@heroicons/react/24/solid';

interface StatsBarProps {
  completedModules: string[];
}

export const CreationHistory: React.FC<StatsBarProps> = ({ completedModules }) => {
  
  const achievements = [
      { id: 'first_world', name: 'Island Survivor', icon: CurrencyDollarIcon, desc: "Complete World 1", unlocked: completedModules.length >= 1 },
      { id: 'half_way', name: 'Money Ninja', icon: BuildingLibraryIcon, desc: "Complete 4 Worlds", unlocked: completedModules.length >= 4 },
      { id: 'master', name: 'Wealth Wizard', icon: RocketLaunchIcon, desc: "Complete all Worlds", unlocked: completedModules.length >= 8 },
      { id: 'streak_master', name: 'On Fire', icon: FireIcon, desc: "7 Day Streak", unlocked: false }, // Placeholder
  ];

  return (
    <div className="w-full max-w-5xl mx-auto mt-8 px-4 pb-24">
      
      <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="bg-yellow-500 w-2 h-8 rounded-full"></span>
            Achievements
          </h2>
          <span className="text-xs font-mono text-zinc-500">{achievements.filter(a => a.unlocked).length}/{achievements.length} Unlocked</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {achievements.map((ach) => (
          <div 
            key={ach.id}
            className={`
                relative overflow-hidden p-4 rounded-xl border transition-all duration-500
                ${ach.unlocked 
                    ? 'bg-zinc-900 border-zinc-700 opacity-100 shadow-lg shadow-black/50' 
                    : 'bg-zinc-900/30 border-zinc-800/50 opacity-60 grayscale'
                }
            `}
          >
             {/* Glow Effect for unlocked */}
             {ach.unlocked && (
                 <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/10 blur-2xl rounded-full"></div>
             )}

             <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${ach.unlocked ? 'bg-yellow-500/20 text-yellow-500' : 'bg-zinc-800 text-zinc-600'}`}>
                    <ach.icon className="w-6 h-6" />
                </div>
                {ach.unlocked && <div className="text-[10px] bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-bold uppercase">Claimed</div>}
             </div>
             
             <div>
                 <h4 className={`font-bold ${ach.unlocked ? 'text-white' : 'text-zinc-500'}`}>{ach.name}</h4>
                 <p className="text-xs text-zinc-500 mt-1">{ach.desc}</p>
             </div>
          </div>
        ))}
      </div>

      {/* Daily Challenge Section */}
      <div className="mt-8 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center animate-bounce">
                    <span className="text-2xl">🎁</span>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Daily Loot Box</h3>
                    <p className="text-sm text-indigo-200">Come back tomorrow for free XP!</p>
                </div>
            </div>
            <button disabled className="px-6 py-3 bg-zinc-800 text-zinc-500 font-bold rounded-xl cursor-not-allowed">
                Opens in 14h 32m
            </button>
      </div>
    </div>
  );
};