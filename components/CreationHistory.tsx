
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { LockClosedIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';
import { BADGES, UserState } from '../services/gamification';

interface BadgeCollectionProps {
  user: UserState;
}

export const CreationHistory: React.FC<BadgeCollectionProps> = ({ user }) => {
  const ownedBadges = user.badges || [];

  return (
    <div className="w-full max-w-5xl mx-auto mt-4 px-4 pb-24">
      
      <div className="flex items-center justify-between mb-6 bg-white/5 p-4 rounded-2xl border border-white/10">
          <div>
              <h2 className="text-2xl font-game text-white flex items-center gap-2">
                <span className="text-3xl">🏆</span>
                TROPHY ROOM
              </h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Flex your achievements</p>
          </div>
          <span className="text-lg font-black text-white bg-black/40 px-4 py-2 rounded-xl border border-white/10">
              <span className="text-yellow-400">{ownedBadges.length}</span> / {BADGES.length}
          </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {BADGES.map((badge) => {
            const isUnlocked = ownedBadges.includes(badge.id);
            
            return (
              <div 
                key={badge.id}
                className={`
                    relative overflow-hidden p-6 rounded-3xl border-4 transition-all duration-500 group min-h-[180px] flex flex-col items-center justify-center text-center
                    ${isUnlocked 
                        ? `${badge.color} border-white shadow-[0_0_25px_rgba(255,255,255,0.3)] scale-100` 
                        : 'bg-zinc-900/80 border-zinc-800 opacity-70 grayscale scale-95'
                    }
                `}
              >
                 {isUnlocked && (
                     <>
                        <div className="absolute top-0 left-0 w-full h-full bg-white/10 animate-[shimmer_2s_infinite]"></div>
                        <div className="absolute top-3 right-3 bg-white text-black text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-1 shadow-lg z-10">
                            <CheckBadgeIcon className="w-3 h-3 text-blue-500" /> OWNED
                        </div>
                     </>
                 )}
                 
                 <div className="relative z-10 flex flex-col items-center">
                    <div className={`text-6xl mb-4 transition-transform duration-300 ${isUnlocked ? 'group-hover:scale-125 drop-shadow-2xl animate-float' : 'opacity-30 blur-[1px]'}`}>
                        {badge.icon}
                    </div>
                    
                    <h4 className={`font-game text-xl uppercase leading-none mb-1 text-stroke-black ${isUnlocked ? 'text-white drop-shadow-md' : 'text-zinc-600'}`}>
                        {badge.name}
                    </h4>
                    
                    {isUnlocked && badge.subtitle && (
                        <p className="text-xs font-black text-white/90 bg-black/30 px-2 py-0.5 rounded mb-2">
                            "{badge.subtitle}"
                        </p>
                    )}
                    
                    <p className="text-[10px] font-bold leading-tight text-white/70 max-w-[90%]">
                        {isUnlocked ? badge.description : `Unlock: ${badge.unlockCondition}`}
                    </p>
                 </div>

                 {!isUnlocked && (
                     <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                         <LockClosedIcon className="w-10 h-10 text-white/20" />
                     </div>
                 )}
              </div>
            );
        })}
      </div>

      <div className="mt-8 p-6 bg-gradient-to-r from-indigo-900 to-purple-900 rounded-3xl border-2 border-white/10 text-center shadow-xl">
          <h3 className="font-game text-xl text-white mb-2">Want more trophies?</h3>
          <p className="text-sm text-indigo-200">Complete worlds and keep your streak alive to fill the case!</p>
      </div>
    </div>
  );
};
