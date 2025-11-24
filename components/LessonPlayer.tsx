/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, HeartIcon, CheckCircleIcon, ShareIcon, ArrowLeftIcon, ArrowRightIcon, LightBulbIcon } from '@heroicons/react/24/solid';
import { Lesson, LessonDragItem } from '../services/gamification';
import { playSound } from '../services/audio';
import { fetchLessonsForLevel } from '../services/db';
import { getRandomRoast, getRandomFunFact, getRandomDeepDive } from '../services/contentGenerator';

// Fix for TypeScript errors with framer-motion types
const MotionDiv = motion.div as any;

interface LessonPlayerProps {
    level: any; 
    onClose: () => void;
    onComplete: (xp: number, coins: number) => void;
}

interface FloatingReward {
    id: string;
    text: string;
    type: 'xp' | 'coin' | 'bonus';
}

// --- SUB-COMPONENTS ---

const PollView = ({ lesson, onNext, triggerRoast }: { lesson: Lesson, onNext: (e: any) => void, triggerRoast: () => void }) => {
    const options = lesson.content.options || ["Yes", "No"];
    const correctIndex = typeof lesson.content.correct === 'number' ? lesson.content.correct : 0;

    const handleVote = (index: number, e: any) => {
        if (index === correctIndex) {
            onNext(e);
        } else {
            playSound('error');
            triggerRoast();
        }
    };

    return (
        <div className="flex flex-col h-full p-6 justify-center items-center text-center">
            <h3 className="font-game text-2xl text-white/70 mb-6 uppercase tracking-widest">{lesson.title}</h3>
            <div className="bg-white/10 p-6 rounded-3xl mb-8 border-2 border-white/20 w-full shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-50"></div>
                <h2 className="text-3xl md:text-4xl font-black text-white leading-tight drop-shadow-md">
                    {lesson.content.text || lesson.content.question}
                </h2>
            </div>
            <div className="grid gap-4 w-full">
                {options.map((opt, i) => (
                    <button 
                        key={i}
                        onClick={(e) => handleVote(i, e)}
                        className="w-full py-5 bg-white text-black font-bold rounded-2xl border-b-[6px] border-gray-300 active:border-b-0 active:translate-y-1.5 transition-all text-xl md:text-2xl shadow-lg hover:bg-gray-50"
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
};

const FunFactView = ({ lesson, onNext }: { lesson: Lesson, onNext: (e: any) => void }) => {
    // This is for the dedicated Lesson Type 'funFact', not the interstitial pop-up
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
    
    const isSortingMode = lesson.content.cards && lesson.content.cards.length > 0;
    const sortingCards = lesson.content.cards || [];
    const currentSortingCard = sortingCards[cardIndex];

    const decisionQuestion = lesson.content.question || lesson.title;
    const leftLabel = lesson.content.left || "Left";
    const rightLabel = lesson.content.right || "Right";
    const correctDirection = lesson.content.correct || "right"; 

    const handleSwipe = (direction: 'left' | 'right', e?: any) => {
        if (isSortingMode) {
            const isRight = direction === 'right';
            const correct = currentSortingCard.isRight === isRight;
            
            if (correct) {
                playSound('pop');
                if (cardIndex < sortingCards.length - 1) {
                    setCardIndex(prev => prev + 1);
                } else {
                    onNext(e);
                }
            } else {
                playSound('error');
                triggerRoast();
            }
        } else {
            if (direction === correctDirection) {
                playSound('pop');
                onNext(e);
            } else {
                playSound('error');
                triggerRoast();
            }
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full p-4 relative">
            <h3 className="font-game text-3xl mb-8 text-white drop-shadow-md text-center leading-tight">
                {isSortingMode ? (lesson.title || "Sort It!") : "What's the move?"}
            </h3>
            
            <div className="relative w-full max-w-xs aspect-[3/4] mb-8">
                <MotionDiv 
                    key={isSortingMode ? cardIndex : 'decision'}
                    initial={{ scale: 0.5, opacity: 0, y: 50 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="absolute inset-0 bg-white rounded-3xl shadow-[10px_10px_0px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center p-8 text-center border-4 border-black transform rotate-1"
                >
                    <div className="text-black font-black text-3xl leading-tight select-none">
                        {isSortingMode ? currentSortingCard.text : decisionQuestion}
                    </div>
                    {isSortingMode && (
                        <div className="mt-6 text-xs font-bold text-gray-400 uppercase tracking-widest">
                            {cardIndex + 1} / {sortingCards.length}
                        </div>
                    )}
                    {!isSortingMode && lesson.content.text && (
                         <div className="mt-6 text-sm font-bold text-gray-500 italic">
                            "{lesson.content.text}"
                        </div>
                    )}
                </MotionDiv>
            </div>

            <div className="flex gap-4 mt-auto w-full justify-center pb-12 px-4">
                <button 
                    onClick={(e) => handleSwipe('left', e)} 
                    className={`flex-1 rounded-2xl border-b-[6px] active:border-b-0 active:translate-y-1.5 transition-all flex flex-col items-center justify-center py-4 shadow-lg group
                        ${isSortingMode ? 'bg-red-500 border-red-800' : 'bg-blue-500 border-blue-800'}
                    `}
                >
                    {isSortingMode ? <XMarkIcon className="w-6 h-6 text-white mb-1"/> : <ArrowLeftIcon className="w-6 h-6 text-white mb-1" />}
                    <span className="text-xs font-black text-white uppercase px-2 break-words w-full text-center">
                        {isSortingMode ? "Left" : leftLabel}
                    </span>
                </button>
                
                <button 
                    onClick={(e) => handleSwipe('right', e)} 
                    className={`flex-1 rounded-2xl border-b-[6px] active:border-b-0 active:translate-y-1.5 transition-all flex flex-col items-center justify-center py-4 shadow-lg group
                        ${isSortingMode ? 'bg-green-500 border-green-800' : 'bg-purple-500 border-purple-800'}
                    `}
                >
                    {isSortingMode ? <CheckCircleIcon className="w-6 h-6 text-white mb-1"/> : <ArrowRightIcon className="w-6 h-6 text-white mb-1" />}
                    <span className="text-xs font-black text-white uppercase px-2 break-words w-full text-center">
                         {isSortingMode ? "Right" : rightLabel}
                    </span>
                </button>
            </div>
        </div>
    );
};

const TapLieView = ({ lesson, onNext, triggerRoast }: { lesson: Lesson, onNext: (e: any) => void, triggerRoast: () => void }) => {
    const statements = lesson.content.statements || [];
    
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
            <h3 className="text-center font-game text-4xl text-white mb-2 drop-shadow-[0_4px_0_#000] text-stroke-black">TAP THE LIE! 🤥</h3>
            <div className="text-center text-yellow-300 mb-8 text-2xl md:text-3xl font-black uppercase tracking-wider drop-shadow-sm border-b-4 border-white/10 pb-4 mx-4">
                {lesson.content.text}
            </div>
            <div className="grid grid-cols-1 gap-4">
                {statements.map((s: any, i: number) => (
                    <button 
                        key={i}
                        onClick={(e) => handleTap(s.isLie, e)}
                        className="p-6 bg-white text-black font-black rounded-2xl shadow-[4px_4px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all text-xl md:text-2xl border-4 border-black hover:bg-gray-50 text-left"
                    >
                        {s.text}
                    </button>
                ))}
            </div>
        </div>
    );
};

const DragDropView = ({ lesson, onNext }: { lesson: Lesson, onNext: (e: any) => void }) => {
    const [items, setItems] = useState<(LessonDragItem | string)[]>(() => (lesson.content.items || []));
    const buckets = lesson.content.buckets || ['Needs', 'Wants'];

    const handleDrop = (itemId: string, e: any) => {
        playSound('coin');
        const remaining = items.filter((i: any) => (typeof i === 'string' ? i : i.id) !== itemId);
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
                {items.map((item: any) => {
                    const id = typeof item === 'string' ? item : item.id;
                    const text = typeof item === 'string' ? item : item.text;
                    return (
                        <MotionDiv
                            key={id}
                            drag
                            dragConstraints={{ top: -300, left: -150, right: 150, bottom: 0 }}
                            whileDrag={{ scale: 1.2, cursor: 'grabbing' }}
                            onDragEnd={(e: any, info: any) => {
                                if (info.point.y < window.innerHeight / 2) handleDrop(id, e);
                            }}
                            className="px-6 py-3 bg-neon-blue text-black font-black rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] cursor-grab border-2 border-black text-lg"
                        >
                            {text}
                        </MotionDiv>
                    );
                })}
            </div>
        </div>
    );
};

const MemeView = ({ lesson, onNext }: { lesson: Lesson, onNext: (e: any) => void }) => {
    const [revealed, setRevealed] = useState(false);
    return (
        <div className="flex flex-col h-full p-6 justify-center items-center">
            <div onClick={() => { if (!revealed) { playSound('pop'); setRevealed(true); } }} className="relative w-full max-w-md aspect-square bg-black border-[6px] border-white rounded-3xl overflow-hidden mb-6 cursor-pointer shadow-2xl transform hover:scale-105 transition-transform duration-300">
                <img src={lesson.content.imageUrl || "https://i.imgflip.com/30b1gx.jpg"} className="w-full h-full object-cover opacity-90" />
                {lesson.content.topText && <div className="absolute top-4 w-full text-center font-game text-3xl text-white text-stroke-black leading-tight p-2 drop-shadow-lg">{lesson.content.topText}</div>}
                {lesson.content.bottomText && <div className="absolute bottom-4 w-full text-center font-game text-3xl text-white text-stroke-black leading-tight p-2 drop-shadow-lg">{lesson.content.bottomText}</div>}
                {lesson.content.caption && <div className="absolute bottom-0 bg-black/80 text-white w-full p-4 text-center font-bold text-lg">{lesson.content.caption}</div>}
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

    const targetValue = typeof lesson.content.answer === 'number' 
        ? lesson.content.answer 
        : parseInt((lesson.content.resultLabel?.match(/[\d,]+/) || ['1000000'])[0].replace(/,/g, ''));

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
                <div className="text-sm font-black text-gray-400 uppercase tracking-widest mb-2">{lesson.content.label || "SCENARIO"}</div>
                <p className="text-xl font-black mb-6">{lesson.content.question || lesson.content.label}</p>
                <div className="h-24 flex items-center justify-center bg-gray-100 rounded-2xl border-4 border-gray-300">
                    <span className={`text-4xl font-black font-mono ${revealed ? 'text-green-600' : 'text-gray-400'}`}>
                        {revealed ? `$${displayValue.toLocaleString()}` : '???'}
                    </span>
                </div>
                {revealed && <p className="mt-4 font-bold text-sm">{lesson.content.text}</p>}
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
    
    // Features for Engagement
    const [showDeepDive, setShowDeepDive] = useState(false);
    const [deepDiveContent, setDeepDiveContent] = useState("");
    const [showFunFact, setShowFunFact] = useState(false);
    const [funFactContent, setFunFactContent] = useState<any>(null);

    // Boss State
    const [showBossIntro, setShowBossIntro] = useState(false);
    const [bossCurrentQuestion, setBossCurrentQuestion] = useState(0);
    const [isBossStage, setIsBossStage] = useState(false);
    const [showBossVictory, setShowBossVictory] = useState(false);
    
    // Summary
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

    const triggerReward = (e: any, xp: number, coins: number) => {
        const xpId = `xp-${Date.now()}-${Math.random()}`;
        const coinId = `coin-${Date.now()}-${Math.random()}`;
        
        const newRewards: FloatingReward[] = [
            { id: xpId, text: `+${xp} XP`, type: 'xp' },
            { id: coinId, text: `+${coins} Coins`, type: 'coin' }
        ];

        setRewards(prev => [...prev, ...newRewards]);
        
        setTimeout(() => {
            setRewards(prev => prev.filter(r => r.id !== xpId && r.id !== coinId));
        }, 1500);
    };

    const triggerRoast = () => {
        const roast = getRandomRoast();
        setFailureToast(roast);
        setTimeout(() => setFailureToast(null), 2500);
    };

    // NEW: Handle correct answer -> Show Deep Dive first
    const handleLessonComplete = (xp: number, coins: number, e: any) => {
        playSound('success');
        triggerReward(e, xp, coins);
        (window as any).confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 }, colors: ['#4ade80', '#ffffff'] });
        
        // 1. Show Deep Dive (Knowledge Panel)
        setDeepDiveContent(getRandomDeepDive());
        setShowDeepDive(true);
    };

    // 2. Continue from Deep Dive -> Check for Fun Fact
    const handleDeepDiveContinue = () => {
        setShowDeepDive(false);
        
        // Check if we should show a Fun Fact (every 3rd lesson: indices 2, 5, 8...)
        // currentIndex is 0-based. So index 2 is the 3rd lesson.
        if ((currentIndex + 1) % 3 === 0) {
            setFunFactContent(getRandomFunFact());
            setShowFunFact(true);
        } else {
            advanceLesson();
        }
    };

    // 3. Continue from Fun Fact -> Advance
    const handleFunFactContinue = () => {
        setShowFunFact(false);
        advanceLesson();
    };

    const advanceLesson = () => {
        if (currentIndex < lessons.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setShowSummary(true);
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
            triggerReward(e, 50, 20);
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

    const handleShareFunFact = async () => {
        if (navigator.share && funFactContent) {
            await navigator.share({
                title: "Racked Fun Fact",
                text: `${funFactContent.text} 🤯 #RackedApp`,
                url: "https://racked.gg"
            });
        } else {
            alert("Copied to clipboard!");
        }
    };

    if (isLoading) return <div className="fixed inset-0 bg-[#1a0b2e] flex items-center justify-center text-white font-game text-2xl">Loading...</div>;

    return (
        <div id="lesson-container" className="fixed inset-0 z-[100] bg-[#1a0b2e] flex flex-col overflow-hidden font-body">
            
            {/* Rewards Layer */}
            <div className="fixed inset-0 pointer-events-none z-[9999] flex items-center justify-center">
                <AnimatePresence>
                    {rewards.map((r) => (
                        <MotionDiv
                            key={r.id}
                            initial={{ opacity: 0, x: "-50%", y: r.type === 'xp' ? 0 : 50, scale: 0.5 }} 
                            animate={{ opacity: 1, x: "-50%", y: r.type === 'xp' ? -120 : -40, scale: 1.5 }} 
                            exit={{ opacity: 0, scale: 2 }}
                            transition={{ duration: 0.8, ease: "easeOut" }} 
                            style={{ left: '50%', top: '50%' }}
                            className={`absolute font-game text-shadow-neon whitespace-nowrap text-stroke-black border-black drop-shadow-2xl
                                ${r.type === 'xp' ? 'text-neon-green text-5xl md:text-7xl' : 'text-yellow-400 text-4xl md:text-6xl'}`}
                        >
                            {r.text}
                        </MotionDiv>
                    ))}
                </AnimatePresence>
            </div>

            {/* Failure Toast */}
            <AnimatePresence>
                {failureToast && (
                    <MotionDiv
                        initial={{ opacity: 0, y: 50, rotate: -5 }}
                        animate={{ opacity: 1, y: 0, rotate: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-32 left-1/2 -translate-x-1/2 z-[1000] bg-red-600 text-white px-6 py-4 rounded-2xl shadow-[0_0_30px_rgba(220,38,38,0.6)] border-4 border-black font-game text-2xl text-center max-w-[90%] transform rotate-2"
                    >
                        {failureToast}
                    </MotionDiv>
                )}
            </AnimatePresence>

            {/* DEEP DIVE PANEL (Correct Answer) */}
            <AnimatePresence>
                {showDeepDive && (
                    <MotionDiv
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 20, stiffness: 100 }}
                        className="fixed bottom-0 left-0 right-0 z-[2000] bg-[#0f0518] border-t-4 border-neon-green rounded-t-3xl p-6 pb-10 shadow-[0_-10px_40px_rgba(74,222,128,0.3)]"
                    >
                        <div className="max-w-md mx-auto">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-neon-green rounded-full flex items-center justify-center text-black font-black text-xl">
                                    <CheckCircleIcon className="w-6 h-6" />
                                </div>
                                <h3 className="font-game text-2xl text-neon-green">YOU'RE RIGHT!</h3>
                            </div>
                            <div className="bg-white/10 p-4 rounded-xl border border-white/10 mb-6">
                                <p className="text-white font-bold text-lg leading-snug">
                                    {deepDiveContent}
                                </p>
                            </div>
                            <button 
                                onClick={handleDeepDiveContinue}
                                className="w-full py-4 bg-white text-black font-game text-xl rounded-xl hover:bg-gray-200 active:scale-95 transition-all"
                            >
                                CONTINUE ➡
                            </button>
                        </div>
                    </MotionDiv>
                )}
            </AnimatePresence>

            {/* FUN FACT MODAL (Every 3rd Lesson) */}
            <AnimatePresence>
                {showFunFact && funFactContent && (
                    <MotionDiv 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="fixed inset-0 z-[3000] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
                    >
                        {/* Particles */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            {[...Array(20)].map((_, i) => (
                                <div key={i} className="absolute text-2xl animate-float opacity-30" 
                                     style={{ left: `${Math.random()*100}%`, top: `${Math.random()*100}%`, animationDelay: `${Math.random()*2}s` }}>
                                    {['🧠','💡','⚡','🔥'][Math.floor(Math.random()*4)]}
                                </div>
                            ))}
                        </div>

                        <div className="relative w-full max-w-md bg-[#1a0b2e] border-4 border-neon-pink rounded-[2rem] p-8 shadow-[0_0_60px_rgba(255,0,184,0.4)]">
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                                <div className="w-20 h-20 bg-neon-pink rounded-full flex items-center justify-center text-5xl border-4 border-black shadow-lg animate-bounce">
                                    {funFactContent.emoji}
                                </div>
                            </div>
                            
                            <h2 className="mt-8 font-game text-3xl text-white text-stroke-black mb-6">FUN FACT</h2>
                            
                            <div className="bg-white/10 p-6 rounded-2xl border border-white/10 mb-6">
                                <p className="text-xl font-black text-white leading-tight mb-4">
                                    {funFactContent.text}
                                </p>
                                <div className="flex items-center justify-center gap-2 text-xs text-gray-400 font-mono bg-black/30 py-1 px-3 rounded-full w-fit mx-auto">
                                    <span className="opacity-50">SOURCE:</span>
                                    <span className="text-neon-blue">{funFactContent.source}</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button 
                                    onClick={handleShareFunFact}
                                    className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/10 flex items-center justify-center gap-2 transition-all"
                                >
                                    <ShareIcon className="w-5 h-5" /> Share
                                </button>
                                <button 
                                    onClick={handleFunFactContinue}
                                    className="flex-[2] py-3 bg-neon-pink text-white font-game text-xl rounded-xl hover:scale-105 transition-transform shadow-lg"
                                >
                                    NEXT ➡
                                </button>
                            </div>
                        </div>
                    </MotionDiv>
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
                             <MotionDiv 
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

                <AnimatePresence>
                    {showBossIntro && (
                        <MotionDiv 
                            initial={{ opacity: 0, scale: 0.8 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            exit={{ opacity: 0, scale: 1.5 }}
                            className="absolute inset-0 z-50 bg-red-900/95 flex flex-col items-center justify-center text-center p-8"
                        >
                            <div className="text-9xl mb-8 animate-bounce">{level.bossImage || '👹'}</div>
                            <h1 className="font-game text-6xl text-white text-stroke-black mb-4">BOSS FIGHT</h1>
                            <p className="text-4xl font-black text-red-200 uppercase tracking-widest">{level.bossName}</p>
                        </MotionDiv>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showBossVictory && (
                        <MotionDiv 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="absolute inset-0 z-[100] bg-gradient-to-b from-yellow-600/90 to-black/95 flex flex-col items-center justify-center p-6 text-center"
                        >
                             <div className="text-9xl mb-4">🏆</div>
                             <h1 className="font-game text-6xl text-white text-stroke-black mb-2">VICTORY!</h1>
                             <p className="text-2xl font-bold text-yellow-200 mb-8">You earned a Badge!</p>
                        </MotionDiv>
                    )}
                </AnimatePresence>

                {!isBossStage && !showSummary && currentLesson && (
                    <MotionDiv
                        key={currentLesson.id}
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="h-full"
                    >
                        {(currentLesson.type === 'swipe' || currentLesson.type === 'scenario') && <SwipeView lesson={currentLesson} onNext={(e) => handleLessonComplete(100, 50, e)} triggerRoast={triggerRoast} />}
                        {currentLesson.type === 'poll' && <PollView lesson={currentLesson} onNext={(e) => handleLessonComplete(100, 50, e)} triggerRoast={triggerRoast} />}
                        {currentLesson.type === 'drag_drop' && <DragDropView lesson={currentLesson} onNext={(e) => handleLessonComplete(150, 50, e)} />}
                        {currentLesson.type === 'tapLie' ? <TapLieView lesson={currentLesson} onNext={(e) => handleLessonComplete(100, 50, e)} triggerRoast={triggerRoast} /> : null}
                        {currentLesson.type === 'calculator' && <CalculatorView lesson={currentLesson} onNext={(e) => handleLessonComplete(100, 50, e)} />}
                        {currentLesson.type === 'meme' && <MemeView lesson={currentLesson} onNext={(e) => handleLessonComplete(50, 20, e)} />}
                        {(currentLesson.type === 'funFact') && <FunFactView lesson={currentLesson} onNext={(e) => handleLessonComplete(50, 10, e)} />}
                        {(currentLesson.type === 'info' || currentLesson.type === 'video' || currentLesson.type === 'badge') && (
                            <div className="flex flex-col h-full p-6 pt-12 items-center text-center overflow-y-auto">
                                <h2 className="font-game text-3xl text-white mb-6 uppercase tracking-widest">{currentLesson.title}</h2>
                                
                                {currentLesson.content.imageUrl && (
                                    <div className="w-full max-w-sm mb-6 rounded-3xl overflow-hidden border-4 border-black shadow-lg bg-black/20">
                                        <img 
                                            src={currentLesson.content.imageUrl} 
                                            alt="Analogy" 
                                            className="w-full h-48 object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                e.currentTarget.parentElement!.style.display = 'none';
                                            }} 
                                        />
                                    </div>
                                )}

                                <div className="bg-white/10 p-6 rounded-3xl border border-white/20 mb-8 w-full shadow-lg relative">
                                    <p className="text-2xl md:text-4xl font-black text-white leading-tight drop-shadow-md">
                                        {currentLesson.content.text}
                                    </p>
                                    {currentLesson.content.analogy && (
                                        <div className="mt-6 bg-black/40 p-4 rounded-xl border border-yellow-500/50 flex items-start gap-3 text-left">
                                            <LightBulbIcon className="w-8 h-8 text-yellow-400 flex-shrink-0" />
                                            <div>
                                                <span className="text-xs font-bold text-yellow-500 uppercase tracking-widest block mb-1">Think of it like this:</span>
                                                <p className="text-yellow-100 font-bold text-lg leading-snug">
                                                    "{currentLesson.content.analogy}"
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <button onClick={(e) => handleLessonComplete(100, 50, e)} className="px-12 py-4 bg-white text-black font-game text-xl rounded-full btn-3d hover:scale-105 transition-transform">CONTINUE ➡</button>
                            </div>
                        )}
                    </MotionDiv>
                )}

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