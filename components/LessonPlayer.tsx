/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, HeartIcon, BoltIcon, StarIcon } from '@heroicons/react/24/solid';
import { GameLevel, MicroLesson, KNOWLEDGE_GEMS } from '../services/content';
import { playSound } from '../services/audio';
import { SparklesIcon } from '@heroicons/react/24/outline';

interface LessonPlayerProps {
    level: GameLevel;
    onClose: () => void;
    onComplete: (xp: number, coins: number) => void;
}

export const LessonPlayer: React.FC<LessonPlayerProps> = ({ level, onClose, onComplete }) => {
    const [currentIndex, setCurrentIndex] = useState(0); // 0 to lessons.length (last is boss)
    const [hearts, setHearts] = useState(3);
    const [showBossIntro, setShowBossIntro] = useState(false);
    const [bossCurrentQuestion, setBossCurrentQuestion] = useState(0);
    
    // Knowledge Gem State
    const [activeGem, setActiveGem] = useState<string | null>(null);

    // Derived State
    const isBossStage = currentIndex >= level.lessons.length;
    const currentLesson = level.lessons[currentIndex];

    // Helper to render text with tappable gems
    const renderRichText = (text: string) => {
        if (!text) return null;
        
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return (
            <p className="leading-relaxed text-lg">
                {parts.map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        const keyword = part.slice(2, -2);
                        // Check if keyword matches a gem
                        const gemKey = Object.keys(KNOWLEDGE_GEMS).find(k => k.toLowerCase() === keyword.toLowerCase());
                        
                        if (gemKey) {
                            return (
                                <button 
                                    key={i} 
                                    onClick={() => { playSound('pop'); setActiveGem(gemKey); }}
                                    className="text-neon-yellow font-bold underline decoration-dashed underline-offset-4 hover:text-white hover:bg-neon-yellow/20 rounded px-1 transition-colors"
                                >
                                    {keyword}
                                </button>
                            );
                        }
                        return <strong key={i} className="text-white">{keyword}</strong>;
                    }
                    return <span key={i}>{part}</span>;
                })}
            </p>
        );
    };

    const handleLessonNext = () => {
        playSound('success');
        if (currentIndex < level.lessons.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            // Start Boss
            setShowBossIntro(true);
            setTimeout(() => {
                setShowBossIntro(false);
                setCurrentIndex(prev => prev + 1);
                playSound('chest'); // Dramatic sound
            }, 3000);
        }
    };

    const handleBossAnswer = (isCorrect: boolean) => {
        if (isCorrect) {
            playSound('success');
            if (bossCurrentQuestion < level.bossQuiz.length - 1) {
                setBossCurrentQuestion(prev => prev + 1);
            } else {
                // Win!
                playSound('levelup');
                (window as any).confetti({ particleCount: 200, spread: 150, origin: { y: 0.5 } });
                onComplete(level.rewards.xp, level.rewards.coins);
            }
        } else {
            playSound('error');
            setHearts(prev => {
                const newHearts = prev - 1;
                if (newHearts <= 0) {
                    // Game Over logic could go here, for now just reset boss or close
                    alert("BOSS DEFEATED YOU! Try again.");
                    onClose();
                }
                return newHearts;
            });
        }
    };

    // --- SUB-COMPONENTS FOR LESSON TYPES ---

    const InfoView = ({ lesson }: { lesson: MicroLesson }) => (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <h2 className="font-game text-3xl text-white mb-6">{lesson.title}</h2>
            <div className="bg-white/10 p-6 rounded-3xl border border-white/20 mb-8">
                {renderRichText(lesson.content.text)}
            </div>
            <button onClick={handleLessonNext} className="btn-3d bg-neon-green text-black font-bold py-4 px-12 rounded-full text-xl">
                GOT IT
            </button>
        </div>
    );

    const MemeView = ({ lesson }: { lesson: MicroLesson }) => (
        <div className="flex flex-col items-center justify-center h-full p-4">
            <h2 className="font-game text-2xl text-white mb-4 text-center">{lesson.title}</h2>
            <div className="relative w-full max-w-sm aspect-square bg-black rounded-xl overflow-hidden border-4 border-white mb-6 shadow-2xl">
                {/* Simulated Meme Generator Style */}
                <img src={lesson.content.imageUrl} alt="meme" className="w-full h-full object-cover opacity-60" />
                <div className="absolute top-2 left-0 w-full text-center font-game text-3xl text-white text-stroke-black px-2">{lesson.content.topText}</div>
                <div className="absolute bottom-2 left-0 w-full text-center font-game text-3xl text-white text-stroke-black px-2">{lesson.content.bottomText}</div>
            </div>
            <div className="bg-black/50 p-4 rounded-xl text-center mb-6 border border-white/10">
                 <p className="text-neon-blue font-bold italic">"{lesson.content.explanation}"</p>
            </div>
            <button onClick={handleLessonNext} className="btn-3d bg-neon-pink text-white font-bold py-3 px-10 rounded-full text-lg">
                LOL, NEXT
            </button>
        </div>
    );

    const SwipeView = ({ lesson }: { lesson: MicroLesson }) => {
        const [cardIndex, setCardIndex] = useState(0);
        const currentCard = lesson.content.cards[cardIndex];

        const handleChoice = (choice: boolean) => {
            if (choice === currentCard.isRight) playSound('pop');
            else playSound('error'); // Simplified: doesn't punish, just feedback
            
            if (cardIndex < lesson.content.cards.length - 1) {
                setCardIndex(prev => prev + 1);
            } else {
                handleLessonNext();
            }
        };

        return (
             <div className="flex flex-col items-center justify-center h-full p-4">
                <div className="text-sm uppercase tracking-widest text-gray-400 mb-4">Card {cardIndex + 1}/{lesson.content.cards.length}</div>
                <motion.div 
                    key={cardIndex}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-64 h-80 bg-white text-black rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-2xl border-4 border-gray-300 mb-8"
                >
                    <h3 className="font-black text-2xl mb-4">{currentCard.text}</h3>
                    <div className="text-gray-500 text-sm font-bold">{currentCard.label}</div>
                </motion.div>

                <div className="flex gap-4 w-full max-w-xs">
                    <button onClick={() => handleChoice(false)} className="flex-1 py-4 bg-red-500 rounded-2xl font-black text-white shadow-lg active:scale-95 transition-transform">NAH ❌</button>
                    <button onClick={() => handleChoice(true)} className="flex-1 py-4 bg-green-500 rounded-2xl font-black text-white shadow-lg active:scale-95 transition-transform">YEAH ✅</button>
                </div>
             </div>
        );
    };

    // --- RENDER ---

    return (
        <div className="fixed inset-0 z-[100] bg-[#1a0b2e] flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm border-b border-white/5">
                <div className="flex items-center gap-2">
                    {isBossStage && (
                        <div className="flex gap-1">
                            {[...Array(3)].map((_, i) => (
                                <HeartIcon key={i} className={`w-6 h-6 ${i < hearts ? 'text-red-500 animate-pulse' : 'text-gray-700'}`} />
                            ))}
                        </div>
                    )}
                    {!isBossStage && (
                         <div className="h-2 w-24 bg-gray-800 rounded-full overflow-hidden">
                             <div className="h-full bg-neon-green transition-all duration-500" style={{ width: `${(currentIndex / level.lessons.length) * 100}%` }}></div>
                         </div>
                    )}
                </div>
                <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
                    <XMarkIcon className="w-6 h-6 text-white" />
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 relative">
                
                {/* BOSS INTRO OVERLAY */}
                <AnimatePresence>
                    {showBossIntro && (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 bg-red-900/90 flex flex-col items-center justify-center text-center p-6"
                        >
                            <motion.div 
                                initial={{ scale: 0 }} animate={{ scale: 1 }} 
                                className="text-6xl mb-4"
                            >👹</motion.div>
                            <h1 className="font-game text-5xl text-white text-stroke-black mb-2">BOSS FIGHT</h1>
                            <p className="text-red-200 text-2xl font-bold">{level.bossName}</p>
                            <p className="mt-8 text-white animate-pulse">GET READY...</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* LESSON CONTENT SWITCHER */}
                {!isBossStage && (
                    <div className="h-full">
                        {currentLesson.type === 'swipe' && <SwipeView lesson={currentLesson} />}
                        {currentLesson.type === 'meme' && <MemeView lesson={currentLesson} />}
                        {(currentLesson.type === 'info' || currentLesson.type === 'video' || currentLesson.type === 'calculator') && <InfoView lesson={currentLesson} />}
                    </div>
                )}

                {/* BOSS BATTLE INTERFACE */}
                {isBossStage && !showBossIntro && level.bossQuiz[bossCurrentQuestion] && (
                    <div className="h-full flex flex-col p-6 bg-red-900/20">
                         <div className="flex-1 flex flex-col justify-center">
                            <div className="bg-black/50 border-2 border-red-500/50 p-6 rounded-3xl mb-8 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                                <h3 className="text-2xl font-bold text-white text-center leading-tight">
                                    {level.bossQuiz[bossCurrentQuestion].question}
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {level.bossQuiz[bossCurrentQuestion].options.map((opt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleBossAnswer(idx === level.bossQuiz[bossCurrentQuestion].correctIndex)}
                                        className="p-4 bg-white text-black font-bold rounded-xl border-b-[6px] border-gray-300 active:border-b-0 active:translate-y-1.5 transition-all hover:bg-gray-100 text-left"
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                         </div>
                         <div className="text-center text-red-300 font-mono text-sm uppercase tracking-widest mt-4">
                             Boss HP: {level.bossQuiz.length - bossCurrentQuestion}/{level.bossQuiz.length}
                         </div>
                    </div>
                )}

            </div>

            {/* KNOWLEDGE GEM MODAL */}
            <AnimatePresence>
                {activeGem && KNOWLEDGE_GEMS[activeGem] && (
                    <motion.div 
                        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                        className="absolute bottom-0 left-0 w-full bg-[#2a1b3d] border-t-4 border-neon-yellow rounded-t-[2rem] p-6 z-50 shadow-2xl"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="text-4xl">{KNOWLEDGE_GEMS[activeGem].emoji}</div>
                                <div>
                                    <div className="text-xs font-bold text-neon-yellow uppercase tracking-widest">Knowledge Gem</div>
                                    <h3 className="font-game text-2xl text-white">{KNOWLEDGE_GEMS[activeGem].title}</h3>
                                </div>
                            </div>
                            <button onClick={() => setActiveGem(null)} className="bg-white/10 p-2 rounded-full"><XMarkIcon className="w-6 h-6 text-white" /></button>
                        </div>
                        <p className="text-white text-lg leading-relaxed font-medium">
                            {KNOWLEDGE_GEMS[activeGem].text}
                        </p>
                        <div className="mt-6 flex items-center gap-2 text-sm text-gray-400 justify-center">
                            <SparklesIcon className="w-4 h-4 text-neon-yellow" />
                            <span>+10 XP Collected</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};