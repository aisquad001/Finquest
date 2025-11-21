/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

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
                    <motion.div
                        key={effect.id}
                        initial={{ opacity: 0, y: 20, scale: 0.5 }}
                        animate={{ opacity: 1, y: -20, scale: 1.1 }}
                        exit={{ opacity: 0, y: -60 }}
                        className={`
                            px-6 py-2 rounded-full font-game text-2xl text-white shadow-xl border-2 text-stroke-black
                            ${effect.type === 'xp' ? 'bg-neon-green border-white' : ''}
                            ${effect.type === 'coin' ? 'bg-yellow-400 border-white' : ''}
                            ${effect.type === 'level' ? 'bg-neon-pink border-white text-3xl' : ''}
                            ${effect.type === 'error' ? 'bg-red-500 border-white text-lg' : ''}
                        `}
                    >
                        {effect.text}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};