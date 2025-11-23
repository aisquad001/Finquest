/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, HeartIcon } from '@heroicons/react/24/solid';
import { Lesson } from '../services/gamification';
import { playSound } from '../services/audio';
import { fetchLessonsForLevel, subscribeToSystemConfig } from '../services/db';
import { getRandomRoast } from '../services/contentGenerator';

interface LessonPlayerProps {
    level: any; 
    onClose: () => void;
    onComplete: (xp: number, coins: number) => void;
}

export const LessonPlayer: React.FC<LessonPlayerProps> = ({ level, onClose, onComplete }) => {
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [hearts, setHearts] = useState(3);
    const [isLoading, setIsLoading] = useState(true);
    const [showReviveAd, setShowReviveAd] = useState(false);
    const [adsEnabled, setAdsEnabled] = useState(false);

    useEffect(() => {
        const unsub = subscribeToSystemConfig(c => setAdsEnabled(c.adsEnabled));
        return () => unsub();
    }, []);

    useEffect(() => {
        const loadContent = async () => {
            setIsLoading(true);
            const data = await fetchLessonsForLevel(level.id);
            setLessons(data.length ? data : level.lessons || []);
            setIsLoading(false);
        };
        loadContent();
    }, [level.id]);

    const handleWrong = () => {
        playSound('error');
        setHearts(prev => {
            const next = prev - 1;
            if (next <= 0) {
                if (adsEnabled) {
                    setShowReviveAd(true);
                    return 0;
                } else {
                    alert("Game Over! " + getRandomRoast());
                    onClose();
                    return 0;
                }
            }
            return next;
        });
    };

    const handleRevive = () => {
        playSound('click');
        // Simulate Ad
        setTimeout(() => {
            setShowReviveAd(false);
            setHearts(1);
            alert("Revived with 1 Heart!");
        }, 1500);
    };

    if (isLoading) return <div className="fixed inset-0 bg-black text-white flex items-center justify-center">Loading...</div>;

    return (
        <div className="fixed inset-0 z-50 bg-[#1a0b2e] flex flex-col font-body">
            {showReviveAd && (
                <div className="absolute inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-8 text-center">
                    <h2 className="text-4xl font-game text-red-500 mb-4">YOU DIED</h2>
                    <button onClick={handleRevive} className="w-full py-4 bg-neon-green text-black font-game text-2xl rounded-2xl mb-4">
                        📺 WATCH AD TO REVIVE
                    </button>
                    <button onClick={onClose} className="text-gray-500 font-bold underline">Give Up</button>
                </div>
            )}

            <div className="p-4 flex justify-between bg-black/20">
                <div className="flex gap-1">
                    {[...Array(3)].map((_,i) => <HeartIcon key={i} className={`w-6 h-6 ${i < hearts ? 'text-red-500' : 'text-gray-700'}`} />)}
                </div>
                <button onClick={onClose}><XMarkIcon className="w-6 h-6 text-white" /></button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-white">
                <h2 className="text-2xl font-bold mb-4">Level Content</h2>
                <p className="text-gray-400 mb-8">Content Loaded Successfully.</p>
                <div className="flex gap-4">
                    <button onClick={() => { playSound('success'); onComplete(100, 50); }} className="bg-white text-black px-6 py-3 rounded-xl font-bold">Win Level</button>
                    <button onClick={handleWrong} className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold">Fail (Test Hearts)</button>
                </div>
            </div>
        </div>
    );
};