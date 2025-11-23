
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

interface AvatarConfig {
  emoji: string;
  outfit: string;
  accessory: string;
  bg: string;
}

interface AvatarProps {
  level?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  customConfig?: AvatarConfig | null;
}

export const Avatar: React.FC<AvatarProps> = ({ level = 1, size = 'md', customConfig }) => {
  // Default evolution logic
  let stage = 'noob';
  let emoji = '😐';
  let outfit = '👕';
  let accessory = '';
  let bg = 'bg-zinc-400';

  // Evolution Logic based on Level (Overrides defaults if no custom config)
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

  // If custom config is provided (from onboarding/profile), use that
  if (customConfig) {
    emoji = customConfig.emoji;
    outfit = customConfig.outfit;
    accessory = customConfig.accessory;
    bg = customConfig.bg; // Use custom BG always (removes level lock)
  }

  const sizeClasses = {
    sm: 'w-12 h-12 text-xl',
    md: 'w-20 h-20 text-3xl',
    lg: 'w-32 h-32 text-5xl',
    xl: 'w-48 h-48 text-7xl' 
  };

  return (
    <div className={`relative ${sizeClasses[size]} rounded-full ${bg} border-4 border-black shadow-3d flex items-center justify-center animate-float`}>
      <div className="relative z-10 transform scale-125 select-none">
        {emoji}
      </div>
      <div className="absolute -bottom-1 -right-2 text-[0.8em] rotate-12 filter drop-shadow-md select-none">
        {outfit}
      </div>
      {accessory && (
        <div className="absolute -top-2 -left-1 text-[0.8em] -rotate-12 filter drop-shadow-md select-none">
            {accessory}
        </div>
      )}
      
      {/* Sparkles for higher levels or special items */}
      {(level >= 6 || customConfig) && (
        <>
          <div className="absolute -top-2 right-0 text-[0.5em] animate-pulse">✨</div>
          <div className="absolute bottom-2 -left-2 text-[0.5em] animate-bounce">✨</div>
        </>
      )}
    </div>
  );
};
