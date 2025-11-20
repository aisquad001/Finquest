/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, LockClosedIcon, StarIcon } from '@heroicons/react/24/solid';
import { GET_WORLD_LEVELS } from '../services/content';
import { WorldData } from '../services/gamification';
import { playSound } from '../services/audio';

interface WorldLevelMapProps {
    world: WorldData;
    completedLevels: string[]; // list of level IDs
    onClose: () => void;
    onSelectLevel: (levelId: string) => void;
}

export const WorldLevelMap: React.FC<WorldLevelMapProps> = ({ world, completedLevels, onClose, onSelectLevel }) => {
    const levels = GET_WORLD_LEVELS(world.id);

    return (
        <div className="fixed inset-0 z-40 bg-[#1a0b2e] flex flex-col overflow-y-auto overflow-x-hidden">
            
            {/* Header */}
            <div className={`sticky top-0 z-50 p-4 flex items-center gap-4 bg-gradient-to-b from-[#1a0b2e] to-transparent`}>
                <button 
                    onClick={() => { playSound('click'); onClose(); }}
                    className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 backdrop-blur-md"
                >
                    <ArrowLeftIcon className="w-6 h-6 text-white" />
                </button>
                <div>
                    <h1 className="font-game text-2xl text-white tracking-wide">{world.title}</h1>
                    <div className="h-1 w-24 bg-gray-700 rounded-full overflow-hidden mt-1">
                        <div 
                            className={`h-full ${world.color}`} 
                            style={{ width: `${(levels.filter(l => completedLevels.includes(l.id)).length / levels.length) * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Map Path */}
            <div className="flex-1 relative p-8 pb-32 flex flex-col items-center gap-12">
                
                {/* S-Curve Path SVG Line */}
                <svg className="absolute top-20 left-0 w-full h-full pointer-events-none opacity-20" style={{ zIndex: 0 }}>
                     <path 
                        d="M 50% 50 Q 90% 200 50% 350 T 50% 650" 
                        fill="none" 
                        stroke="white" 
                        strokeWidth="8" 
                        strokeDasharray="20 20" 
                        strokeLinecap="round"
                     />
                </svg>

                {levels.map((level, index) => {
                    const isLocked = index > 0 && !completedLevels.includes(levels[index - 1].id);
                    const isCompleted = completedLevels.includes(level.id);
                    const isCurrent = !isLocked && !isCompleted;

                    return (
                        <motion.button
                            key={level.id}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => !isLocked && onSelectLevel(level.id)}
                            disabled={isLocked}
                            className={`
                                relative z-10 w-24 h-24 rounded-[2rem] flex items-center justify-center border-4 shadow-2xl transition-transform
                                ${index % 2 === 0 ? '-translate-x-12' : 'translate-x-12'}
                                ${isLocked 
                                    ? 'bg-gray-800 border-gray-600 text-gray-500' 
                                    : isCompleted 
                                        ? 'bg-neon-green border-white text-black scale-90' 
                                        : `${world.color} border-white text-white scale-110 animate-float`
                                }
                            `}
                        >
                            {isLocked ? (
                                <LockClosedIcon className="w-8 h-8" />
                            ) : isCompleted ? (
                                <StarIcon className="w-10 h-10" />
                            ) : (
                                <span className="font-game text-4xl text-stroke-black">{index + 1}</span>
                            )}

                            {/* Level Label */}
                            <div className={`absolute -bottom-10 w-32 text-center text-xs font-bold px-2 py-1 rounded-lg ${isCurrent ? 'bg-white text-black' : 'text-gray-400'}`}>
                                {level.title}
                            </div>

                            {/* Current Indicator */}
                            {isCurrent && (
                                <div className="absolute -top-4 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce">
                                    START
                                </div>
                            )}
                        </motion.button>
                    );
                })}

                {/* Boss Castle at the end (Visual Only for now) */}
                <div className="mt-8 text-6xl animate-bounce">🏰</div>
            </div>
        </div>
    );
};