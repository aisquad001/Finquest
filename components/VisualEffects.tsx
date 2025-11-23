/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Fix for TypeScript errors with framer-motion types
const MotionDiv = motion.div as any;

interface Effect {
    id: string;
    text: string;
    type: 'xp' | 'coin' | 'level' | 'error';
}

export const VisualEffects: React.FC = () => {
    const [effects, setEffects] = useState<Effect[]>([]);

    useEffect(() => {
        const handleEffect = (e: any) => {
            const newEffect = {
                id: Date.now().toString() + Math.random(),
                text: e.detail.text,
                type: e.detail.type
            };
            setEffects(prev => [...prev, newEffect]);

            // Cleanup
            setTimeout(() => {
                setEffects(prev => prev.filter(ef => ef.id !== newEffect.id));
            }, 2000);
        };

        window.addEventListener('game-effect', handleEffect);
        return () => window.removeEventListener('game-effect', handleEffect);
    }, []);

    return (
        <div className="fixed top-20 left-0 right-0 z-[200] pointer-events-none flex flex-col items-center gap-2">
            <AnimatePresence>
                {effects.map(effect => (
                    <MotionDiv
                        key={effect.id}
                        initial={{ opacity: 0, y: 50, scale: 0.5, rotate: -10 }}
                        animate={{ opacity: 1, y: 0, scale: 1.5, rotate: 0 }}
                        exit={{ opacity: 0, y: -100, scale: 2 }}
                        className={`
                            px-8 py-4 rounded-2xl font-game text-3xl md:text-4xl text-white shadow-[0_0_30px_rgba(0,0,0,0.5)] border-4 text-stroke-black
                            ${effect.type === 'xp' ? 'bg-neon-green border-white' : ''}
                            ${effect.type === 'coin' ? 'bg-yellow-400 border-white' : ''}
                            ${effect.type === 'level' ? 'bg-neon-pink border-white text-5xl' : ''}
                            ${effect.type === 'error' ? 'bg-red-500 border-white text-2xl' : ''}
                        `}
                    >
                        {effect.text}
                    </MotionDiv>
                ))}
            </AnimatePresence>
        </div>
    );
};