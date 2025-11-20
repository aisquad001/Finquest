/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

interface AvatarProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
}

export const Avatar: React.FC<AvatarProps> = ({ level, size = 'md' }) => {
  // Determine avatar stage based on level
  let stage = 'noob';
  let emoji = '😐';
  let outfit = '👕';
  let accessory = '';
  let bg = 'bg-zinc-400';

  if (level >= 3) {
    stage = 'hustler';
    emoji = '😎';
    outfit = '🧥';
    accessory = '🧢';
    bg = 'bg-blue-400';
  }
  if (level >= 6) {
    stage = 'boss';
    emoji = '🤑';
    outfit = '👔';
    accessory = '📱';
    bg = 'bg-purple-400';
  }
  if (level >= 10) {
    stage = 'god';
    emoji = '🦁';
    outfit = '👑';
    accessory = '💎';
    bg = 'bg-yellow-400';
  }

  const sizeClasses = {
    sm: 'w-12 h-12 text-xl',
    md: 'w-20 h-20 text-3xl',
    lg: 'w-32 h-32 text-5xl'
  };

  return (
    <div className={`relative ${sizeClasses[size]} rounded-full ${bg} border-4 border-black shadow-3d flex items-center justify-center animate-float`}>
      <div className="relative z-10 transform scale-125">
        {emoji}
      </div>
      <div className="absolute -bottom-1 -right-2 text-[0.8em] rotate-12 filter drop-shadow-md">
        {outfit}
      </div>
      {accessory && (
        <div className="absolute -top-2 -left-1 text-[0.8em] -rotate-12 filter drop-shadow-md">
            {accessory}
        </div>
      )}
      
      {/* Sparkles for higher levels */}
      {level >= 6 && (
        <>
          <div className="absolute -top-2 right-0 text-[0.5em] animate-pulse">✨</div>
          <div className="absolute bottom-2 -left-2 text-[0.5em] animate-bounce">✨</div>
        </>
      )}
    </div>
  );
};