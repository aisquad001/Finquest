
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, HeartIcon, StarIcon, PlayIcon, CheckCircleIcon, ShareIcon } from '@heroicons/react/24/solid';
import { Lesson } from '../services/gamification';
import { playSound } from '../services/audio';
import { fetchLessonsForLevel } from '../services/db';
import { getRandomRoast } from '../services/contentGenerator';

interface LessonPlayerProps {
    level: any; 
    onClose: () => void;
    onComplete: (xp: number, coins: number) => void;
}

interface FloatingReward {
    id: string;
    x: number;
    y: number;
    text: string;
    type: 'xp' | 'coin' | 'bonus';
}

// --- SUB-COMPONENTS ---

const FunFactView = ({ lesson, onNext }: { lesson: Lesson, onNext: (e: any) => void }) => {
    const handleShare = async () => {
        if (navigator.share) {
            await navigator.share({
                title: "Racked Fact",
                text: `${lesson.content.text} - Learned on Racked.gg 🧠`,
                url: "https://racked.gg"
            });
        } else {
            alert("Copied to clipboard!");
        }
    };

    return (
        <div className="flex flex-col h-full p-6 justify-center items-center text-center bg-gradient-to-br from-indigo-900 to-purple-900">
            <div className="text-6xl mb-6 animate-bounce">🧠</div>
            <div className="bg-white/10 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-yellow-400 mb-6 border border-white/10">
                Did You Know?
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-8 leading-tight">
                "{lesson.content.text}"
            </h2>
            <div className="text-sm text-gray-400 font-mono mb-12">Source: {lesson.content.factSource || "Trust Me Bro"}</div>
            
            <div className="flex gap-4 w-full">
                <button onClick={handleShare} className="flex-1 py-4 bg-white/10 text-white font-bold rounded-2xl flex items-center justify-center gap-2">
                    <ShareIcon className="w-5 h-5" /> Share
                </button>
                <button onClick={onNext} className="flex-[2] py-4 bg-neon-green text-black font-game text-xl rounded-2xl btn-3d">
                    MIND BLOWN 🤯
                </button>
            </div>
        </div>
    );
};

const SwipeView = ({ lesson, onNext, triggerRoast }: { lesson: Lesson, onNext: (e: any) => void, triggerRoast: () => void }) => {
    const [cardIndex, setCardIndex] = useState(0);
    const cards = lesson.content.cards || [];
    const currentCard = cards[cardIndex];

    const handleSwipe = (direction: 'left' | 'right', e?: any) => {
        const isRight = direction === 'right';
        const correct = currentCard.isRight === isRight;
        
        if (correct) {
            playSound('pop');
            if (cardIndex < cards.length - 1) {
                setCardIndex(prev => prev + 1);
            } else {
                onNext(e);
            }
        } else {
            playSound('error');
            triggerRoast();
        }
    };

    if (!currentCard) return <div>Done</div>;

    return (
        <div className="flex flex-col items-center justify-center h-full p-4 relative">
            <h3 className="font-game text-3xl mb-12 text-white drop-shadow-md text-center leading-tight">
                {lesson.title || "What's the move?"}
            </h3>
            
            <div className="relative w-full max-w-xs aspect-[3/4]">
                <motion.div 
                    key={cardIndex}
                    initial={{ scale: 0.5, opacity: 0, y: 50 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="absolute inset-0 bg-white rounded-3xl shadow-[10px_10px_0px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center p-8 text-center border-4 border-black transform rotate-1"
                >
                    <div className="text-black font-black text-3xl leading-tight select-none">
                        {currentCard.text}
                    </div>
                    <div className="mt-6 text-xs font-bold text-gray-400 uppercase tracking-widest">
                        {cardIndex + 1} / {cards.length}
                    </div>
                </motion.div>
            </div>

            <div className="flex gap-8 mt-12 w-full justify-center">
                <button onClick={(e) => handleSwipe('left', e)} className="flex-1 max-w-[100px] aspect-square bg-red-500 rounded-2xl border-b-[6px] border-red-800 active:border-b-0 active:translate-y-1.5 transition-all flex flex-col items-center justify-center shadow-lg group">
                    <XMarkIcon className="w-8 h-8 text-white mb-1"/>
                    <span className="text-xs font-black text-white uppercase">{currentCard.isRight ? 'NOPE' : 'FACT'}</span>
                </button>
                <button onClick={(e) => handleSwipe('right', e)} className="flex-1 max-w-[100px] aspect-square bg-green-500 rounded-2xl border-b-[6px] border-green-800 active:border-b-0 active:translate-y-1.5 transition-all flex flex-col items-center justify-center shadow-lg group">
                    <CheckCircleIcon className="w-8 h-8 text-white mb-1"/>
                    <span className="text-xs font-black text-white uppercase">{currentCard.isRight ? 'FACT' : 'NOPE'}</span>
                </button>
            </div>
        </div>
    );
};

const TapLieView = ({ lesson, onNext, triggerRoast }: { lesson: Lesson, onNext: (e: any) => void, triggerRoast: () => void }) => {
    const handleTap = (isLie: boolean, e: any) => {
        if (isLie) {
            onNext(e);
        } else {
            playSound('error');
            triggerRoast();
        }
    };

    return (
        <div className="flex flex-col h-full p-6 justify-center">
            <h3 className="text-center font-game text-4xl text-white mb-8 drop-shadow-[0_4px_0_#000] text-stroke-black">TAP THE LIE! 🤥</h3>
            <div className="grid grid-cols-1 gap-4">
                {(lesson.content.statements || []).map((s: any, i: number) => (
                    <button 
                        key={i}
                        onClick={(e) => handleTap(s.isLie, e)}
                        className="p-6 bg-white text-black font-black rounded-2xl shadow-[4px_4px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all text-xl border-4 border-black hover:bg-gray-50 text-left"
                    >
                        {s.text}
                    </button>
                ))}
            </div>
        </div>
    );
};

const DragDropView = ({ lesson, onNext }: { lesson: Lesson, onNext: (e: any) => void }) => {
    const [items, setItems] = useState(() => (lesson.content.items || []));
    const buckets = lesson.content.buckets || ['Needs', 'Wants'];

    const handleDrop = (itemId: string, bucket: string, e: any) => {
        playSound('coin');
        const remaining = items.filter((i: any) => i.id !== itemId);
        setItems(remaining);
        if (remaining.length === 0) setTimeout(() => onNext(e), 500);
    };

    return (
        <div className="flex flex-col h-full p-4 pt-12">
            <h3 className="text-center font-game text-2xl text-white mb-8 text-stroke-black">Sort It Out!</h3>
            <div className="flex justify-center gap-4 mb-auto">
                {buckets.map((b: string) => (
                    <div key={b} className="w-32 h-32 border-4 border-dashed border-white/30 rounded-2xl flex items-center justify-center text-white font-bold uppercase bg-black/20 text-xl backdrop-blur-md">
                        {b}
                    </div>
                ))}
            </div>
            <div className="flex flex-wrap justify-center gap-4 pb-12 min-h-[150px]">
                {items.map((item: any) => (
                    <motion.div
                        key={item.id}
                        drag
                        dragConstraints={{ top: -300, left: -150, right: 150, bottom: 0 }}
                        whileDrag={{ scale: 1.2, cursor: 'grabbing' }}
                        onDragEnd={(e, info) => {
                            if (info.point.y < window.innerHeight / 2) handleDrop(item.id, item.category, e);
                        }}
                        className="px-6 py-3 bg-neon-blue text-black font-black rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] cursor-grab border-2 border-black text-lg"
                    >
                        {item.text}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

const MemeView = ({ lesson, onNext }: { lesson: Lesson, onNext: (e: any) => void }) => {
    const [revealed, setRevealed] = useState(false);
    return (
        <div className="flex flex-col h-full p-6 justify-center items-center">
            <div onClick={() => { if (!revealed) { playSound('pop'); setRevealed(true); } }} className="relative w-full max-w-md aspect-square bg-black border-[6px] border-white rounded-3xl overflow-hidden mb-6 cursor-pointer shadow-2xl transform hover:scale-105 transition-transform duration-300">
                <img src={lesson.content.imageUrl} className="w-full h-full object-cover opacity-90" />
                <div className="absolute top-4 w-full text-center font-game text-3xl text-white text-stroke-black leading-tight p-2 drop-shadow-lg">{lesson.content.topText}</div>
                <div className="absolute bottom-4 w-full text-center font-game text-3xl text-white text-stroke-black leading-tight p-2 drop-shadow-lg">{lesson.content.bottomText}</div>
                {!revealed && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm transition-opacity">
                        <div className="bg-neon-pink text-white border-4 border-white px-8 py-4 rounded-full font-black animate-bounce text-2xl shadow-lg rotate-3">
                            TAP TO REVEAL 🫣
                        </div>
                    </div>
                )}
            </div>
            {revealed && (
                <button onClick={(e) => onNext(e)} className="w-full px-8 py-4 bg-green-500 text-black font-game text-2xl rounded-2xl border-b-[6px] border-green-800 active:border-b-0 active:translate-y-2 transition-all shadow-xl">
                    NO CAP 🧢
                </button>
            )}
        </div>
    );
};

const CalculatorView = ({ lesson, onNext }: { lesson: Lesson, onNext: (e: any) => void }) => {
    const [revealed, setRevealed] = useState(false);
    const [displayValue, setDisplayValue] = useState(0);

    const targetValue = parseInt((lesson.content.resultLabel?.match(/[\d,]+/) || ['1000000'])[0].replace(/,/g, ''));

    const handleCalculate = () => {
        playSound('click');
        let start = 0;
        const duration = 1500;
        const startTime = performance.now();
        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            setDisplayValue(Math.floor(ease * targetValue));
            if (progress < 1) requestAnimationFrame(animate);
            else { setRevealed(true); playSound('kaching'); }
        };
        requestAnimationFrame(animate);
    };

    return (
        <div className="flex flex-col h-full p-6 justify-center items-center text-center">
            <h3 className="font-game text-3xl text-white mb-8 text-shadow-neon text-stroke-black leading-tight">
                {lesson.title}
            </h3>
            <div className="bg-white text-black p-6 rounded-3xl border-[6px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] w-full max-w-md mb-8 relative">
                <div className="text-sm font-black text-gray-400 uppercase tracking-widest mb-2">SCENARIO</div>
                <p className="text-xl font-black mb-6">{lesson.content.label}</p>
                <div className="h-24 flex items-center justify-center bg-gray-100 rounded-2xl border-4 border-gray-300">
                    <span className={`text-4xl font-black font-mono ${revealed ? 'text-green-600' : 'text-gray-400'}`}>
                        {revealed ? `$${displayValue.toLocaleString()}` : '???'}
                    </span>
                </div>
            </div>
            {!revealed ? (
                <button onClick={handleCalculate} className="w-full py-4 bg-orange-500 text-white font-game text-2xl rounded-xl border-b-[6px] border-orange-800 active:border-b-0 active:translate-y-1.5 transition-all">
                    RUN THE NUMBERS 🚀
                </button>
            ) : (
                <button onClick={onNext} className="w-full py-4 bg-neon-green text-black font-game text-2xl rounded-xl border-b-[6px] border-green-800 active:border-b-0 active:translate-y-1.5 transition-all">
                    SHEESH 🤯
                </button>
            )}
        </div>
    );
};

// --- MAIN COMPONENT ---

export const LessonPlayer: React.FC<LessonPlayerProps> = ({ level, onClose, onComplete }) => {
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [hearts, setHearts] = useState(3);
    const [isLoading, setIsLoading] = useState(true);
    const [rewards, setRewards] = useState<FloatingReward[]>([]);
    const [failureToast, setFailureToast] = useState<string | null>(null);
    
    // Boss State
    const [showBossIntro, setShowBossIntro] = useState(false);
    const [bossCurrentQuestion, setBossCurrentQuestion] = useState(0);
    const [isBossStage, setIsBossStage] = useState(false);
    const [showBossVictory, setShowBossVictory] = useState(false);
    
    // Why it matters Summary
    const [showSummary, setShowSummary] = useState(false);

    useEffect(() => {
        const loadContent = async () => {
            setIsLoading(true);
            const data = await fetchLessonsForLevel(level.id);
            if (data.length === 0 && level.lessons) setLessons(level.lessons);
            else setLessons(data);
            setIsLoading(false);
        };
        loadContent();
    }, [level.id]);

    const currentLesson = lessons[currentIndex];

    // Helper to trigger floating reward
    const triggerReward = (e: any, xp: number, coins: number, label?: string) => {
        let x = window.innerWidth / 2, y = window.innerHeight / 2;
        if (e && e.clientX) { x = e.clientX; y = e.clientY; }
        setRewards(prev => [...prev, 
            { id: Date.now() + 'xp', x, y: y - 50, text: `+${xp} XP`, type: 'xp' },
            { id: Date.now() + 'coin', x, y: y - 80, text: `+${coins} Coins`, type: 'coin' }
        ]);
        setTimeout(() => setRewards(prev => prev.slice(1)), 1500);
    };

    // Helper to trigger wrong answer roast
    const triggerRoast = () => {
        const roast = getRandomRoast();
        setFailureToast(roast);
        setTimeout(() => setFailureToast(null), 2500);
    };

    const handleLessonComplete = (xp: number, coins: number, e: any) => {
        playSound('success');
        triggerReward(e, xp, coins, "CORRECT!");
        (window as any).confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 }, colors: ['#4ade80', '#ffffff'] });
        
        if (currentIndex < lessons.length - 1) {
            setTimeout(() => setCurrentIndex(prev => prev + 1), 800);
        } else {
            // End of lessons -> Summary -> Boss
            setTimeout(() => setShowSummary(true), 500);
        }
    };

    const startBossBattle = () => {
        setShowSummary(false);
        setIsBossStage(true);
        setShowBossIntro(true);
        playSound('chest');
        setTimeout(() => setShowBossIntro(false), 3000);
    };

    const handleBossAnswer = (isCorrect: boolean, e: any) => {
        if (isCorrect) {
            playSound('success');
            triggerReward(e, 50, 20, "HIT!");
            if (bossCurrentQuestion < level.bossQuiz.length - 1) {
                setBossCurrentQuestion(prev => prev + 1);
            } else {
                playSound('fanfare');
                setShowBossVictory(true);
                (window as any).confetti({ particleCount: 500, spread: 160, origin: { y: 0.5 } });
                const totalXp = 500 + (hearts * 100);
                const totalCoins = 200 + (hearts * 50);
                setTimeout(() => onComplete(totalXp, totalCoins), 4000);
            }
        } else {
            playSound('error');
            triggerRoast();
            setHearts(prev => {
                const newHearts = prev - 1;
                if (newHearts <= 0) {
                    playSound('fail');
                    setTimeout(() => { alert("GAME OVER. The Boss wiped your account. Try again!"); onClose(); }, 500);
                }
                return newHearts;
            });
        }
    };

    if (isLoading) return <div className="fixed inset-0 bg-[#1a0b2e] flex items-center justify-center text-white font-game text-2xl">Loading...</div>;

    return (
        <div id="lesson-container" className="fixed inset-0 z-[100] bg-[#1a0b2e] flex flex-col overflow-hidden font-body">
            
            {/* Rewards Layer */}
            <div className="absolute inset-0 pointer-events-none z-[9999]">
                <AnimatePresence>
                    {rewards.map(r => (
                        <motion.div
                            key={r.id}
                            initial={{ opacity: 0, y: r.y, scale: 0.5 }}
                            animate={{ opacity: 1, y: r.y - 100, scale: 1.5 }}
                            exit={{ opacity: 0 }}
                            className={`absolute font-game text-shadow-neon whitespace-nowrap ${r.type === 'xp' ? 'text-neon-green text-4xl' : 'text-yellow-400 text-3xl'}`}
                        >
                            {r.text}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* FAILURE TOAST ROAST */}
            <AnimatePresence>
                {failureToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, rotate: -5 }}
                        animate={{ opacity: 1, y: 0, rotate: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-32 left-1/2 -translate-x-1/2 z-[1000] bg-red-600 text-white px-6 py-4 rounded-2xl shadow-[0_0_30px_rgba(220,38,38,0.6)] border-4 border-black font-game text-2xl text-center max-w-[90%] transform rotate-2"
                    >
                        {failureToast}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HEADER */}
            <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm border-b border-white/5 z-50">
                <div className="w-full mr-4">
                    {isBossStage ? (
                        <div className="flex gap-2 justify-center w-full">
                            {[...Array(3)].map((_, i) => (
                                <HeartIcon key={i} className={`w-8 h-8 drop-shadow-md ${i < hearts ? 'text-red-500 animate-pulse' : 'text-gray-800'}`} />
                            ))}
                        </div>
                    ) : (
                         <div className="w-full relative h-6 bg-gray-800 rounded-full border-2 border-black overflow-hidden">
                             <motion.div 
                                className="h-full bg-neon-green"
                                initial={{ width: 0 }}
                                animate={{ width: `${((currentIndex + 1) / lessons.length) * 100}%` }}
                             />
                         </div>
                    )}
                </div>
                <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
                    <XMarkIcon className="w-6 h-6 text-white" />
                </button>
            </div>

            {/* BODY */}
            <div className="flex-1 relative overflow-hidden">
                
                {/* SUMMARY SCREEN BEFORE BOSS */}
                {showSummary && (
                    <div className="absolute inset-0 z-50 bg-gradient-to-br from-blue-900 to-black flex flex-col items-center justify-center p-8 text-center animate-pop-in">
                        <div className="text-6xl mb-6">🎓</div>
                        <h2 className="font-game text-4xl text-white mb-4">LEVEL COMPLETE!</h2>
                        <div className="bg-white/10 p-6 rounded-2xl border border-white/20 mb-8">
                            <div className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-2">Why this matters</div>
                            <p className="text-white text-xl font-bold">You now know how to avoid losing money. Use this knowledge to defeat the boss!</p>
                        </div>
                        <button onClick={startBossBattle} className="w-full py-4 bg-neon-pink text-white font-game text-2xl rounded-2xl btn-3d">
                            FIGHT BOSS ⚔️
                        </button>
                    </div>
                )}

                {/* BOSS INTRO */}
                <AnimatePresence>
                    {showBossIntro && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            exit={{ opacity: 0, scale: 1.5 }}
                            className="absolute inset-0 z-50 bg-red-900/95 flex flex-col items-center justify-center text-center p-8"
                        >
                            <div className="text-9xl mb-8 animate-bounce">{level.bossImage || '👹'}</div>
                            <h1 className="font-game text-6xl text-white text-stroke-black mb-4">BOSS FIGHT</h1>
                            <p className="text-4xl font-black text-red-200 uppercase tracking-widest">{level.bossName}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* BOSS VICTORY */}
                <AnimatePresence>
                    {showBossVictory && (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="absolute inset-0 z-[100] bg-gradient-to-b from-yellow-600/90 to-black/95 flex flex-col items-center justify-center p-6 text-center"
                        >
                             <div className="text-9xl mb-4">🏆</div>
                             <h1 className="font-game text-6xl text-white text-stroke-black mb-2">VICTORY!</h1>
                             <p className="text-2xl font-bold text-yellow-200 mb-8">You earned a Badge!</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* LESSON CONTENT */}
                {!isBossStage && !showSummary && currentLesson && (
                    <motion.div
                        key={currentLesson.id}
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="h-full"
                    >
                        {currentLesson.type === 'swipe' && <SwipeView lesson={currentLesson} onNext={(e) => handleLessonComplete(100, 50, e)} triggerRoast={triggerRoast} />}
                        {currentLesson.type === 'drag_drop' && <DragDropView lesson={currentLesson} onNext={(e) => handleLessonComplete(150, 50, e)} />}
                        {currentLesson.type === 'tap_lie' && <TapLieView lesson={currentLesson} onNext={(e) => handleLessonComplete(100, 50, e)} triggerRoast={triggerRoast} />}
                        {currentLesson.type === 'calculator' && <CalculatorView lesson={currentLesson} onNext={(e) => handleLessonComplete(100, 50, e)} />}
                        {currentLesson.type === 'meme' && <MemeView lesson={currentLesson} onNext={(e) => handleLessonComplete(50, 20, e)} />}
                        {currentLesson.type === 'fun_fact' && <FunFactView lesson={currentLesson} onNext={(e) => handleLessonComplete(50, 10, e)} />}
                        {currentLesson.type === 'info' && (
                            <div className="flex flex-col h-full p-6 pt-12 items-center text-center">
                                <h2 className="font-game text-3xl text-white mb-8">{currentLesson.title}</h2>
                                <div className="bg-white/10 p-6 rounded-3xl border border-white/20 mb-8 text-xl text-white leading-relaxed">
                                    {currentLesson.content.text}
                                </div>
                                <button onClick={(e) => handleLessonComplete(100, 50, e)} className="px-12 py-4 bg-white text-black font-game text-xl rounded-full btn-3d hover:scale-105 transition-transform">CONTINUE ➡</button>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* BOSS BATTLE UI */}
                {isBossStage && !showBossIntro && !showBossVictory && level.bossQuiz && level.bossQuiz[bossCurrentQuestion] && (
                    <div className="h-full flex flex-col p-6 pt-8 bg-gradient-to-b from-red-950 to-black">
                        <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
                            <div className="text-8xl mb-8">{level.bossImage || '👹'}</div>
                            <div className="bg-black/80 border-4 border-red-600 rounded-3xl p-6 mb-8 w-full text-center shadow-[0_0_40px_rgba(220,38,38,0.4)] relative">
                                <div className="absolute -top-3 -right-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">BOSS HP: {level.bossQuiz.length - bossCurrentQuestion}</div>
                                <h3 className="text-2xl font-black text-white leading-tight">{level.bossQuiz[bossCurrentQuestion].question}</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-4 w-full">
                                {level.bossQuiz[bossCurrentQuestion].options.map((opt: string, i: number) => (
                                    <button
                                        key={i}
                                        onClick={(e) => handleBossAnswer(i === level.bossQuiz[bossCurrentQuestion].correctIndex, e)}
                                        className="p-5 bg-white text-black font-bold text-lg rounded-2xl border-b-[6px] border-gray-300 active:border-b-0 active:translate-y-1.5 transition-all"
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
