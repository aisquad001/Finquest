
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, HeartIcon, StarIcon, PlayIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { SparklesIcon, HandThumbUpIcon } from '@heroicons/react/24/outline';
import { Lesson, KNOWLEDGE_GEMS } from '../services/content';
import { playSound } from '../services/audio';
import { fetchLessonsForLevel } from '../services/db';

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

const WRONG_ANSWER_ROASTS = [
    "Oof, that hurt my wallet just watching 😂",
    "Your future self just face-palmed so hard 😭",
    "Even my grandma knows that one 🤭",
    "Bro really said ‘YOLO’ on that answer 💀",
    "That’s the sound of your allowance crying 😢",
    "Almost! The money gods are judging… gently 🙈",
    "Plot twist: that was the broke option 🤡",
    "Your piggy bank just fainted 🐷",
    "The Inflation Dragon just laughed at you 🐉",
    "That’s how you stay broke in 2025 😅",
    "My calculator is shaking its head 📉",
    "Financial advisor has left the chat ✌️",
    "Refund on that answer? No? Okay 😬",
    "Did you guess? Be honest. 🤨",
    "Math isn't mathing right now ✖️",
    "Try again, but with more ripples 🧠",
    "Error 404: Financial Literacy not found 💻",
    "Yikes. Just... yikes. 😬",
    "Don't quit your day job yet! 😂",
    "Wallet: 'Am I a joke to you?' 😐"
];

// --- SUB-COMPONENTS ---

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
            {/* Updated: Removed hint text "Swipe Right for W, Left for L" */}
            <h3 className="font-game text-3xl mb-12 text-white drop-shadow-md text-center leading-tight">
                What's the move?
            </h3>
            
            <div className="relative w-full max-w-xs aspect-[3/4]">
                <motion.div 
                    key={cardIndex}
                    initial={{ scale: 0.5, opacity: 0, y: 50 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="absolute inset-0 bg-white rounded-3xl shadow-[10px_10px_0px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center p-8 text-center border-4 border-black transform rotate-1"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={(e, { offset }) => {
                        if (offset.x > 100) handleSwipe('right', e);
                        else if (offset.x < -100) handleSwipe('left', e);
                    }}
                >
                    <div className="text-6xl mb-6">
                         {/* Updated: Hide answer emoji hints if they gave it away, keeping it neutral */}
                         🤔
                    </div>
                    <div className="text-black font-black text-3xl leading-tight select-none">
                        {currentCard.text}
                    </div>
                    <div className="mt-6 text-xs font-bold text-gray-400 uppercase tracking-widest">
                        {cardIndex + 1} / {cards.length}
                    </div>
                </motion.div>
            </div>

            <div className="flex gap-8 mt-12">
                <button onClick={(e) => handleSwipe('left', e)} className="w-20 h-20 bg-red-500 rounded-full border-b-[6px] border-red-800 active:border-b-0 active:translate-y-1.5 transition-all flex items-center justify-center shadow-lg group">
                    <XMarkIcon className="w-10 h-10 text-white group-hover:scale-110 transition-transform"/>
                </button>
                <button onClick={(e) => handleSwipe('right', e)} className="w-20 h-20 bg-green-500 rounded-full border-b-[6px] border-green-800 active:border-b-0 active:translate-y-1.5 transition-all flex items-center justify-center shadow-lg group">
                    <CheckCircleIcon className="w-10 h-10 text-white group-hover:scale-110 transition-transform"/>
                </button>
            </div>
        </div>
    );
};

const TapLieView = ({ lesson, onNext, triggerRoast }: { lesson: Lesson, onNext: (e: any) => void, triggerRoast: () => void }) => {
    const [timeLeft, setTimeLeft] = useState(10);
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        if (!isActive) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 0) {
                    clearInterval(timer);
                    return 10;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isActive]);

    const handleTap = (isLie: boolean, e: any) => {
        if (isLie) {
            setIsActive(false);
            onNext(e);
        } else {
            playSound('error');
            triggerRoast();
        }
    };

    return (
        <div className="flex flex-col h-full p-6 justify-center">
            <div className="w-full h-8 bg-gray-900 rounded-full mb-8 overflow-hidden border-4 border-black shadow-lg">
                <motion.div 
                    className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                    initial={{ width: '100%' }}
                    animate={{ width: `${(timeLeft / 10) * 100}%` }}
                    transition={{ duration: 1, ease: "linear" }}
                />
            </div>
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
    const fallbackItems = [
        { id: 'f1', text: 'Starbucks', category: 'Wants' },
        { id: 'f2', text: 'Rent', category: 'Needs' },
        { id: 'f3', text: 'Groceries', category: 'Needs' },
        { id: 'f4', text: 'New iPhone', category: 'Wants' }
    ];
    const [items, setItems] = useState(() => (lesson.content && Array.isArray(lesson.content.items) && lesson.content.items.length > 0) ? lesson.content.items : fallbackItems);
    const buckets = lesson.content.buckets || ['Needs', 'Wants'];

    const handleDrop = (itemId: string, bucket: string, e: any) => {
        playSound('coin');
        const remaining = items.filter((i: any) => i.id !== itemId);
        setItems(remaining);
        if (remaining.length === 0) setTimeout(() => onNext(e), 500);
    };

    return (
        <div className="flex flex-col h-full p-4 pt-12">
            <h3 className="text-center font-game text-2xl text-white mb-8 text-stroke-black">Sort the Expenses!</h3>
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
                        dragElastic={0.2}
                        whileDrag={{ scale: 1.2, rotate: 5, cursor: 'grabbing' }}
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
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center w-full">
                    <div className="bg-white/10 p-6 rounded-2xl border-2 border-white/20 mb-8 backdrop-blur-md">
                        <p className="text-neon-blue font-bold text-xl italic">"{lesson.content.explanation}"</p>
                    </div>
                    <button onClick={(e) => onNext(e)} className="w-full px-8 py-4 bg-green-500 text-black font-game text-2xl rounded-2xl border-b-[6px] border-green-800 active:border-b-0 active:translate-y-2 transition-all shadow-xl">
                        NO CAP 🧢
                    </button>
                </motion.div>
            )}
        </div>
    );
};

const CalculatorView = ({ lesson, onNext }: { lesson: Lesson, onNext: (e: any) => void }) => {
    const [revealed, setRevealed] = useState(false);
    const [animating, setAnimating] = useState(false);
    const [displayValue, setDisplayValue] = useState(0);

    const targetValue = parseInt((lesson.content.resultLabel?.match(/[\d,]+/) || ['1000000'])[0].replace(/,/g, ''));

    const handleCalculate = () => {
        setAnimating(true);
        playSound('click');
        
        // Animation sequence
        let start = 0;
        const duration = 1500;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3); // Cubic ease out
            
            setDisplayValue(Math.floor(ease * targetValue));

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setAnimating(false);
                setRevealed(true);
                playSound('kaching');
                (window as any).confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 } });
            }
        };
        
        requestAnimationFrame(animate);
    };

    return (
        <div className="flex flex-col h-full p-6 justify-center items-center text-center">
            <h3 className="font-game text-3xl text-white mb-8 text-shadow-neon text-stroke-black leading-tight drop-shadow-lg">
                {lesson.title}
            </h3>
            
            <div className="bg-white text-black p-6 rounded-3xl border-[6px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] w-full max-w-md mb-8 transform rotate-1 relative">
                <div className="absolute -top-6 -right-6 text-6xl animate-bounce filter drop-shadow-md z-10">🧮</div>
                
                <div className="mb-6">
                     <div className="text-sm font-black text-gray-400 uppercase tracking-widest mb-2">THE SCENARIO</div>
                     <p className="text-2xl font-black font-body leading-tight text-slate-800">{lesson.content.label}</p>
                </div>
                
                <div className="h-32 flex items-center justify-center mb-6 bg-gray-100 rounded-2xl border-4 border-gray-300 inner-shadow relative overflow-hidden">
                    {animating || revealed ? (
                         <motion.div 
                            className="flex flex-col items-center"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: revealed ? 1.2 : 1 }}
                         >
                            <span className={`text-4xl font-black font-mono ${revealed ? 'text-green-600' : 'text-gray-600'}`}>
                                ${displayValue.toLocaleString()}
                            </span>
                         </motion.div>
                    ) : (
                        <span className="text-6xl text-gray-300 font-black opacity-50">?</span>
                    )}
                </div>

                {!revealed && !animating && (
                    <button 
                        onClick={handleCalculate}
                        className="w-full py-4 bg-orange-500 text-white font-game text-2xl rounded-xl border-b-[6px] border-orange-800 active:border-b-0 active:translate-y-1.5 transition-all hover:brightness-110 hover:scale-[1.02]"
                    >
                        RUN THE NUMBERS 🚀
                    </button>
                )}
                
                {animating && (
                    <div className="w-full py-4 bg-gray-300 text-gray-600 font-game text-xl rounded-xl flex items-center justify-center gap-2">
                        <div className="w-4 h-4 bg-gray-600 rounded-full animate-bounce"></div>
                        CALCULATING...
                    </div>
                )}

                {revealed && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                         <p className="text-lg font-bold mb-2 text-gray-800 leading-snug">{lesson.content.resultLabel?.replace(/\$[\d,]+/, '')}</p>
                    </motion.div>
                )}
            </div>

            {revealed && (
                 <motion.button 
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    onClick={onNext} 
                    className="px-12 py-5 bg-neon-green text-black font-game text-3xl rounded-2xl border-b-[8px] border-green-800 active:border-b-0 active:translate-y-2 transition-all shadow-[0_0_40px_rgba(74,222,128,0.6)] hover:scale-105 hover:-rotate-1"
                >
                    MIND BLOWN 🤯
                </motion.button>
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
    
    // Knowledge Gem
    const [activeGem, setActiveGem] = useState<string | null>(null);

    // Social
    const [isLiked, setIsLiked] = useState(false);

    useEffect(() => {
        const loadContent = async () => {
            setIsLoading(true);
            const data = await fetchLessonsForLevel(level.id);
            
            if (data.length === 0 && level.lessons) {
                setLessons(level.lessons);
            } else {
                setLessons(data);
            }
            setIsLoading(false);
        };
        loadContent();
    }, [level.id]);

    const currentLesson = lessons[currentIndex];

    useEffect(() => {
        setIsLiked(false); 
    }, [currentIndex]);

    // Helper to trigger floating reward
    const triggerReward = (e: React.MouseEvent | React.TouchEvent | null, xp: number, coins: number, label?: string) => {
        let x = window.innerWidth / 2;
        let y = window.innerHeight / 2;

        if (e) {
            // Try to get position from click/touch
            if ('touches' in e) {
                x = e.touches[0].clientX;
                y = e.touches[0].clientY;
            } else if ('clientX' in e) {
                x = (e as React.MouseEvent).clientX;
                y = (e as React.MouseEvent).clientY;
            }
        }

        const newRewards: FloatingReward[] = [
            { id: Date.now() + 'xp', x, y: y - 50, text: `+${xp} XP`, type: 'xp' },
            { id: Date.now() + 'coin', x, y: y - 80, text: `+${coins} Coins`, type: 'coin' }
        ];
        if (label) newRewards.push({ id: Date.now() + 'bonus', x, y: y - 110, text: label, type: 'bonus' });

        setRewards(prev => [...prev, ...newRewards]);
        setTimeout(() => {
            setRewards(prev => prev.filter(r => !newRewards.includes(r)));
        }, 1500);
    };

    // Helper to trigger wrong answer roast
    const triggerRoast = () => {
        const roast = WRONG_ANSWER_ROASTS[Math.floor(Math.random() * WRONG_ANSWER_ROASTS.length)];
        setFailureToast(roast);
        setTimeout(() => setFailureToast(null), 2000);
    };

    const handleLessonComplete = (xp: number, coins: number, e: any) => {
        playSound('success');
        triggerReward(e, xp, coins, "CORRECT!");
        (window as any).confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 }, colors: ['#4ade80', '#ffffff'] });
        
        if (currentIndex < lessons.length - 1) {
            setTimeout(() => setCurrentIndex(prev => prev + 1), 1200);
        } else {
            // Start Boss
            setTimeout(() => {
                setIsBossStage(true);
                setShowBossIntro(true);
                playSound('chest');
                setTimeout(() => setShowBossIntro(false), 3000);
            }, 1200);
        }
    };

    const handleBossAnswer = (isCorrect: boolean, e: any) => {
        if (isCorrect) {
            playSound('success');
            triggerReward(e, 50, 20, "HIT!"); // Small reward for boss hit
            
            if (bossCurrentQuestion < level.bossQuiz.length - 1) {
                setBossCurrentQuestion(prev => prev + 1);
            } else {
                // BOSS DEFEATED
                playSound('fanfare');
                setShowBossVictory(true);
                (window as any).confetti({ particleCount: 500, spread: 160, origin: { y: 0.5 } });
                
                const totalXp = 500 + (hearts * 100);
                const totalCoins = 200 + (hearts * 50);
                
                setTimeout(() => onComplete(totalXp, totalCoins), 4000); // Wait for victory animation
            }
        } else {
            playSound('error');
            triggerRoast(); // Roast 'em
            const newHearts = hearts - 1;
            setHearts(newHearts);
            
            // Shake effect
            const container = document.getElementById('lesson-container');
            if(container) {
                container.style.transform = 'translateX(10px)';
                setTimeout(() => container.style.transform = 'translateX(0)', 100);
            }

            if (newHearts <= 0) {
                playSound('fail');
                setTimeout(() => {
                    alert("THE BOSS DEFEATED YOU! 💀\nTry again!");
                    onClose();
                }, 500);
            }
        }
    };

    // --- RENDER MAIN ---
    if (isLoading) return <div className="fixed inset-0 bg-[#1a0b2e] flex items-center justify-center text-white font-game text-2xl">Loading Content...</div>;

    return (
        <div id="lesson-container" className="fixed inset-0 z-[100] bg-[#1a0b2e] flex flex-col overflow-hidden font-body transition-transform duration-100">
            
            {/* Rewards Layer */}
            <div className="absolute inset-0 pointer-events-none z-[9999]">
                <AnimatePresence>
                    {rewards.map(r => (
                        <motion.div
                            key={r.id}
                            initial={{ opacity: 0, y: r.y, x: r.x, scale: 0.5 }}
                            animate={{ opacity: 1, y: r.y - 100, scale: 1.5 }}
                            exit={{ opacity: 0, y: r.y - 150 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`absolute font-game text-shadow-neon whitespace-nowrap pointer-events-none
                                ${r.type === 'xp' ? 'text-neon-green text-4xl' : ''}
                                ${r.type === 'coin' ? 'text-yellow-400 text-3xl' : ''}
                                ${r.type === 'bonus' ? 'text-neon-pink text-5xl rotate-[-10deg]' : ''}
                            `}
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
                        initial={{ opacity: 0, y: 50, scale: 0.8, rotate: -5 }}
                        animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, y: 20, scale: 0.8 }}
                        className="absolute bottom-32 left-1/2 -translate-x-1/2 z-[1000] bg-red-600 text-white px-6 py-4 rounded-2xl shadow-[0_0_30px_rgba(220,38,38,0.6)] border-4 border-black font-game text-2xl text-center max-w-[90%] pointer-events-none transform rotate-2"
                    >
                        {failureToast}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HEADER */}
            <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm border-b border-white/5 z-50">
                <div className="flex items-center gap-2 w-full mr-4">
                    {isBossStage ? (
                        <div className="flex gap-2 justify-center w-full">
                            {[...Array(3)].map((_, i) => (
                                <HeartIcon key={i} className={`w-8 h-8 drop-shadow-md ${i < hearts ? 'text-red-500 animate-pulse' : 'text-gray-800'}`} />
                            ))}
                        </div>
                    ) : (
                         <div className="w-full mr-2 relative mt-2">
                             {/* Comic Style Progress Bar */}
                             <div className="h-8 w-full bg-gray-800 rounded-xl border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.5)] overflow-hidden relative transform -skew-x-6">
                                 <motion.div 
                                    className="h-full bg-[#00FF88] relative"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${((currentIndex + 1) / lessons.length) * 100}%` }}
                                    transition={{ type: "spring", stiffness: 60 }}
                                 >
                                     {/* Striped Pattern Overlay */}
                                     <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#00cc6a_10px,#00cc6a_20px)] opacity-50"></div>
                                     
                                     {/* Glare */}
                                     <div className="absolute top-0 left-0 w-full h-[40%] bg-white opacity-30"></div>
                                 </motion.div>
                             </div>
                             {/* Floating Percent Tag */}
                             <div className="absolute -top-4 right-0 bg-white text-black border-2 border-black text-xs font-black px-2 py-1 rounded-lg rotate-12 shadow-md z-10">
                                 {Math.round(((currentIndex + 1) / lessons.length) * 100)}%
                             </div>
                         </div>
                    )}
                </div>
                <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 active:scale-90 transition-transform">
                    <XMarkIcon className="w-6 h-6 text-white" />
                </button>
            </div>

            {/* BODY */}
            <div className="flex-1 relative overflow-hidden">
                
                {/* BOSS INTRO */}
                <AnimatePresence>
                    {showBossIntro && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            exit={{ opacity: 0, scale: 1.5 }}
                            className="absolute inset-0 z-50 bg-red-900/95 flex flex-col items-center justify-center text-center p-8"
                        >
                            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.5 }} className="text-9xl mb-8">
                                {level.bossImage || '👹'}
                            </motion.div>
                            <h1 className="font-game text-6xl text-white text-stroke-black mb-4 drop-shadow-xl">BOSS FIGHT</h1>
                            <p className="text-4xl font-black text-red-200 uppercase tracking-widest mb-8">{level.bossName}</p>
                            <div className="bg-black/60 p-6 rounded-2xl border-l-8 border-red-500 italic text-white text-2xl shadow-2xl max-w-md">
                                "{level.bossIntro || "Prepare to lose your allowance!"}"
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* BOSS VICTORY OVERLAY */}
                <AnimatePresence>
                    {showBossVictory && (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="absolute inset-0 z-[100] bg-gradient-to-b from-yellow-600/90 to-black/95 flex flex-col items-center justify-center p-6 text-center"
                        >
                             <motion.div 
                                initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} 
                                transition={{ type: "spring", bounce: 0.5 }}
                                className="text-9xl mb-4"
                             >
                                 🏆
                             </motion.div>
                             <h1 className="font-game text-6xl text-white text-stroke-black mb-2 drop-shadow-[0_0_25px_rgba(255,215,0,0.8)]">VICTORY!</h1>
                             <p className="text-2xl font-bold text-yellow-200 mb-8">Boss Defeated</p>
                             
                             <div className="flex gap-4 mb-12">
                                 <div className="bg-black/50 p-4 rounded-2xl border border-green-500/50 flex flex-col items-center min-w-[120px]">
                                     <div className="text-sm text-gray-400 uppercase font-bold">XP Earned</div>
                                     <div className="font-game text-4xl text-neon-green">+800</div>
                                 </div>
                                 <div className="bg-black/50 p-4 rounded-2xl border border-yellow-500/50 flex flex-col items-center min-w-[120px]">
                                     <div className="text-sm text-gray-400 uppercase font-bold">Coins</div>
                                     <div className="font-game text-4xl text-yellow-400">+350</div>
                                 </div>
                             </div>
                             
                             <motion.div 
                                initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} delay={0.5}
                                className="text-white animate-pulse font-game text-xl"
                             >
                                 Redirecting to Map...
                             </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* CONTENT RENDER */}
                {!isBossStage && currentLesson && (
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
                        {(currentLesson.type === 'video' || currentLesson.type === 'info') && (
                            <div className="flex flex-col h-full p-6 pt-12 items-center text-center">
                                <h2 className="font-game text-3xl text-white mb-8">{currentLesson.title}</h2>
                                <div className="bg-white/10 p-6 rounded-3xl border border-white/20 mb-8 text-xl text-white leading-relaxed">
                                    {currentLesson.content.text?.replace(/\*\*/g, '')}
                                </div>
                                <button onClick={(e) => handleLessonComplete(100, 50, e)} className="px-12 py-4 bg-white text-black font-game text-xl rounded-full btn-3d hover:scale-105 transition-transform">CONTINUE ➡</button>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* BOSS BATTLE UI */}
                {isBossStage && !showBossIntro && !showBossVictory && (
                    (level.bossQuiz && level.bossQuiz[bossCurrentQuestion]) ? (
                        <div className="h-full flex flex-col p-6 pt-8 bg-gradient-to-b from-red-950 to-black">
                            <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
                                <motion.div 
                                    animate={{ y: [0, -20, 0] }} 
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="text-8xl mb-8 filter drop-shadow-[0_0_20px_rgba(255,0,0,0.5)]"
                                >
                                    {level.bossImage || '👹'}
                                </motion.div>
                                
                                <div className="bg-black/80 border-4 border-red-600 rounded-3xl p-6 mb-8 w-full text-center shadow-[0_0_40px_rgba(220,38,38,0.4)] relative">
                                    <div className="absolute -top-3 -right-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">BOSS HP: {level.bossQuiz.length - bossCurrentQuestion}</div>
                                    <h3 className="text-2xl font-black text-white leading-tight">{level.bossQuiz[bossCurrentQuestion].question}</h3>
                                </div>

                                <div className="grid grid-cols-1 gap-4 w-full">
                                    {level.bossQuiz[bossCurrentQuestion].options.map((opt: string, i: number) => (
                                        <button
                                            key={i}
                                            onClick={(e) => handleBossAnswer(i === level.bossQuiz[bossCurrentQuestion].correctIndex, e)}
                                            className="p-5 bg-white text-black font-bold text-lg rounded-2xl border-b-[6px] border-gray-300 active:border-b-0 active:translate-y-1.5 transition-all hover:bg-gray-100 hover:scale-[1.02]"
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-white">Boss Glitch. <button onClick={() => onComplete(100,100)}>Skip</button></div>
                    )
                )}
            </div>

            {/* KNOWLEDGE GEM OVERLAY */}
            <AnimatePresence>
                {activeGem && KNOWLEDGE_GEMS[activeGem] && (
                    <motion.div 
                        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                        className="absolute bottom-0 left-0 w-full bg-[#2a1b3d] border-t-4 border-neon-yellow rounded-t-[2.5rem] p-8 z-[200] shadow-2xl"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="text-5xl bg-black/30 p-2 rounded-2xl">{KNOWLEDGE_GEMS[activeGem].emoji}</div>
                                <div>
                                    <div className="text-xs font-bold text-neon-yellow uppercase tracking-widest mb-1">Knowledge Gem Found!</div>
                                    <h3 className="font-game text-3xl text-white">{KNOWLEDGE_GEMS[activeGem].title}</h3>
                                </div>
                            </div>
                            <button onClick={() => setActiveGem(null)} className="bg-white/10 p-2 rounded-full"><XMarkIcon className="w-6 h-6 text-white" /></button>
                        </div>
                        <p className="text-white text-xl leading-relaxed font-medium mb-8">
                            {KNOWLEDGE_GEMS[activeGem].text}
                        </p>
                        <button onClick={() => setActiveGem(null)} className="w-full py-4 bg-neon-yellow text-black font-game text-xl rounded-2xl btn-3d">
                            COLLECT +100 XP
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};
