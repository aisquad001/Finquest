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
    <div className="w-full max-w-5xl mx-auto mt-8 px-4 pb-24">
      
      <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-game text-white flex items-center gap-2">
            <span className="text-3xl">🏆</span>
            BADGE COLLECTION
          </h2>
          <span className="text-xs font-mono text-zinc-500 bg-black/40 px-3 py-1 rounded-full border border-white/10">
              {ownedBadges.length} / {BADGES.length} Unlocked
          </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {BADGES.map((badge) => {
            // Check if user owns this badge by ID
            const earnedBadge = ownedBadges.find(b => b.id === badge.id);
            const isUnlocked = !!earnedBadge;
            
            return (
              <div 
                key={badge.id}
                className={`
                    relative overflow-hidden p-4 rounded-2xl border-2 transition-all duration-500 group
                    ${isUnlocked 
                        ? `${badge.color} border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]` 
                        : 'bg-zinc-900/50 border-zinc-800 opacity-80 grayscale'
                    }
                `}
              >
                 {isUnlocked && (
                     <div className="absolute top-2 right-2 bg-white text-black text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                         <CheckBadgeIcon className="w-3 h-3 text-blue-500" /> OWNED
                     </div>
                 )}
                 
                 <div className="flex flex-col items-center text-center pt-2">
                    <div className={`text-5xl mb-3 transition-transform duration-300 ${isUnlocked ? 'group-hover:scale-110 drop-shadow-md' : 'opacity-30'}`}>
                        {badge.icon}
                    </div>
                    
                    <h4 className={`font-game text-sm uppercase leading-tight mb-1 ${isUnlocked ? 'text-white text-stroke-black' : 'text-zinc-500'}`}>
                        {badge.name}
                    </h4>
                    
                    <p className="text-[10px] font-bold leading-tight opacity-80 mb-1">
                        {badge.description}
                    </p>

                    {isUnlocked && earnedBadge && (
                        <p className="text-[8px] font-mono text-white/50 mt-1">
                            Earned: {new Date(earnedBadge.earned).toLocaleDateString()}
                        </p>
                    )}
                    
                    {!isUnlocked && (
                        <p className="text-[9px] font-bold text-white/40 mt-1 italic">
                            Unlock: {badge.unlockCondition}
                        </p>
                    )}
                 </div>

                 {!isUnlocked && (
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                         <LockClosedIcon className="w-8 h-8 text-white/30" />
                     </div>
                 )}
              </div>
            );
        })}
      </div>

      <div className="mt-8 p-6 bg-gradient-to-r from-indigo-900 to-purple-900 rounded-2xl border border-white/10 text-center">
          <h3 className="font-game text-xl text-white mb-2">Want more badges?</h3>
          <p className="text-sm text-indigo-200">Keep completing worlds and streaks to fill your trophy case!</p>
      </div>
    </div>
  );
};