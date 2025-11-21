
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { XMarkIcon, HeartIcon, StarIcon, PlayIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { SparklesIcon, HandThumbUpIcon, HandThumbDownIcon, FireIcon } from '@heroicons/react/24/outline';
import { GameLevel, Lesson, KNOWLEDGE_GEMS } from '../services/content';
import { playSound } from '../services/audio';
import { fetchLessonsForLevel } from '../services/db';

interface LessonPlayerProps {
    level: any; // Using any temporarily to adapt between legacy/new level types in migration
    onClose: () => void;
    onComplete: (xp: number, coins: number) => void;
}

export const LessonPlayer: React.FC<LessonPlayerProps> = ({ level, onClose, onComplete }) => {
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [hearts, setHearts] = useState(3);
    const [isLoading, setIsLoading] = useState(true);
    
    // Boss State
    const [showBossIntro, setShowBossIntro] = useState(false);
    const [bossCurrentQuestion, setBossCurrentQuestion] = useState(0);
    const [isBossStage, setIsBossStage] = useState(false);
    
    // Knowledge Gem
    const [activeGem, setActiveGem] = useState<string | null>(null);

    // Social
    const [isLiked, setIsLiked] = useState(false);

    useEffect(() => {
        const loadContent = async () => {
            setIsLoading(true);
            // Fetch lessons from DB based on Level ID
            const data = await fetchLessonsForLevel(level.id);
            
            if (data.length === 0 && level.lessons) {
                // Fallback to legacy structure if DB is empty but props have data
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
        setIsLiked(false); // Reset like state on new lesson
    }, [currentIndex]);

    const handleLessonComplete = (xp: number, coins: number) => {
        playSound('success');
        (window as any).confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
        
        if (currentIndex < lessons.length - 1) {
            setTimeout(() => setCurrentIndex(prev => prev + 1), 1000);
        } else {
            // Start Boss
            setTimeout(() => {
                setIsBossStage(true);
                setShowBossIntro(true);
                playSound('chest');
                setTimeout(() => setShowBossIntro(false), 3000);
            }, 1000);
        }
    };

    const handleBossAnswer = (isCorrect: boolean) => {
        if (isCorrect) {
            playSound('success');
            if (bossCurrentQuestion < level.bossQuiz.length - 1) {
                setBossCurrentQuestion(prev => prev + 1);
            } else {
                // BOSS DEFEATED
                playSound('fanfare');
                (window as any).confetti({ particleCount: 500, spread: 180, origin: { y: 0.6 } });
                
                // Calculate Total Rewards (Base + Hearts Bonus)
                const totalXp = 500 + (hearts * 100);
                const totalCoins = 200 + (hearts * 50);
                
                setTimeout(() => onComplete(totalXp, totalCoins), 2000);
            }
        } else {
            playSound('error');
            const newHearts = hearts - 1;
            setHearts(newHearts);
            
            // Screen Shake Effect via CSS class trigger or simple alert for now
            const container = document.getElementById('lesson-container');
            if(container) {
                container.style.transform = 'translateX(10px)';
                setTimeout(() => container.style.transform = 'translateX(0)', 100);
            }

            if (newHearts <= 0) {
                playSound('fail');
                alert("THE BOSS DEFEATED YOU! 💀\nTry again!");
                onClose();
            }
        }
    };

    // --- RENDERERS ---

    const SwipeView = ({ lesson, onNext }: { lesson: Lesson, onNext: () => void }) => {
        const [cardIndex, setCardIndex] = useState(0);
        const cards = lesson.content.cards || [];
        const currentCard = cards[cardIndex];

        const handleSwipe = (direction: 'left' | 'right') => {
            const isRight = direction === 'right'; // Right = True/Good/Keep
            const correct = currentCard.isRight === isRight;
            
            if (correct) {
                playSound('pop');
                if (cardIndex < cards.length - 1) {
                    setCardIndex(prev => prev + 1);
                } else {
                    onNext();
                }
            } else {
                playSound('error');
            }
        };

        if (!currentCard) return <div>Done</div>;

        return (
            <div className="flex flex-col items-center justify-center h-full p-4">
                <h3 className="font-game text-2xl mb-8 text-white">Swipe Right if Smart ✅</h3>
                <motion.div 
                    key={cardIndex}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-72 h-96 bg-white rounded-3xl shadow-2xl flex flex-col items-center justify-center p-6 text-center border-4 border-black relative"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={(e, { offset, velocity }) => {
                        if (offset.x > 100) handleSwipe('right');
                        else if (offset.x < -100) handleSwipe('left');
                    }}
                >
                    <div className="text-black font-black text-3xl mb-4 leading-tight">{currentCard.text}</div>
                    <div className="text-gray-500 font-bold uppercase tracking-widest">{currentCard.label}</div>
                </motion.div>
                <div className="flex gap-8 mt-8">
                    <button onClick={() => handleSwipe('left')} className="p-4 bg-red-500 rounded-full border-b-4 border-red-800 active:translate-y-1"><XMarkIcon className="w-8 h-8 text-white"/></button>
                    <button onClick={() => handleSwipe('right')} className="p-4 bg-green-500 rounded-full border-b-4 border-green-800 active:translate-y-1"><CheckCircleIcon className="w-8 h-8 text-white"/></button>
                </div>
            </div>
        );
    };

    const DragDropView = ({ lesson, onNext }: { lesson: Lesson, onNext: () => void }) => {
        const [items, setItems] = useState(lesson.content.items || []);
        const buckets = lesson.content.buckets || ['Needs', 'Wants'];

        const handleDrop = (itemId: string, bucket: string) => {
            // Verify logic (Mock verification for demo)
            // In generated content, validation is loose or assumed for demo flow
            playSound('coin');
            setItems((prev: any[]) => prev.filter((i: any) => i.id !== itemId));
            if (items.length <= 1) onNext();
        };

        return (
            <div className="flex flex-col h-full p-4 pt-12">
                <h3 className="text-center font-game text-2xl text-white mb-8">Sort the Expenses!</h3>
                
                {/* Buckets */}
                <div className="flex justify-center gap-4 mb-auto">
                    {buckets.map((b: string) => (
                        <div key={b} className="w-28 h-28 border-4 border-dashed border-white/30 rounded-2xl flex items-center justify-center text-white font-bold uppercase bg-black/20">
                            {b}
                        </div>
                    ))}
                </div>

                {/* Draggables */}
                <div className="flex flex-wrap justify-center gap-4 pb-12">
                    {items.map((item: any) => (
                        <motion.div
                            key={item.id}
                            drag
                            dragConstraints={{ top: -300, left: -150, right: 150, bottom: 0 }}
                            dragElastic={0.2}
                            onDragEnd={(e, info) => {
                                if (info.point.y < window.innerHeight / 2) {
                                    handleDrop(item.id, item.category);
                                }
                            }}
                            className="px-6 py-3 bg-neon-blue text-black font-bold rounded-full shadow-lg cursor-grab active:cursor-grabbing"
                        >
                            {item.text}
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    };

    const TapLieView = ({ lesson, onNext }: { lesson: Lesson, onNext: () => void }) => {
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

        const handleTap = (isLie: boolean) => {
            if (isLie) {
                setIsActive(false);
                onNext();
            } else {
                playSound('error');
            }
        };

        return (
            <div className="flex flex-col h-full p-6 justify-center">
                <div className="w-full h-4 bg-gray-700 rounded-full mb-8 overflow-hidden">
                    <motion.div 
                        className="h-full bg-red-500"
                        initial={{ width: '100%' }}
                        animate={{ width: `${(timeLeft / 10) * 100}%` }}
                        transition={{ duration: 1, ease: "linear" }}
                    />
                </div>
                <h3 className="text-center font-game text-3xl text-white mb-8">TAP THE LIE! 🤥</h3>
                <div className="grid grid-cols-1 gap-4">
                    {(lesson.content.statements || []).map((s: any, i: number) => (
                        <button 
                            key={i}
                            onClick={() => handleTap(s.isLie)}
                            className="p-6 bg-white text-black font-bold rounded-2xl shadow-lg active:scale-95 transition-transform text-lg"
                        >
                            {s.text}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    const CalculatorView = ({ lesson, onNext }: { lesson: Lesson, onNext: () => void }) => {
        const [val, setVal] = useState(100);
        
        return (
            <div className="flex flex-col h-full p-6 justify-center items-center text-center">
                <h3 className="font-game text-2xl text-white mb-2">{lesson.title}</h3>
                <p className="text-gray-300 mb-8">{lesson.content.label}</p>
                
                <div className="text-6xl font-black text-neon-green mb-8 font-mono">
                    ${(val * Math.pow(1.08, 40)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>

                <input 
                    type="range" 
                    min="50" max="1000" step="50"
                    value={val} 
                    onChange={(e) => setVal(Number(e.target.value))}
                    className="w-full h-4 bg-gray-700 rounded-lg appearance-none cursor-pointer mb-4"
                />
                <p className="text-white font-bold">{lesson.content.resultLabel || "Future Value"}</p>

                <button onClick={onNext} className="mt-12 px-8 py-4 bg-neon-pink text-white font-game text-xl rounded-full btn-3d">
                    MIND BLOWN 🤯
                </button>
            </div>
        );
    };

    const MemeView = ({ lesson, onNext }: { lesson: Lesson, onNext: () => void }) => {
        const [revealed, setRevealed] = useState(false);

        return (
            <div className="flex flex-col h-full p-6 justify-center items-center">
                <div 
                    onClick={() => { 
                        if (!revealed) { playSound('pop'); setRevealed(true); }
                    }}
                    className="relative w-full max-w-md aspect-square bg-black border-4 border-white rounded-xl overflow-hidden mb-6 cursor-pointer"
                >
                    <img src={lesson.content.imageUrl} className="w-full h-full object-cover opacity-80" />
                    <div className="absolute top-4 w-full text-center font-game text-3xl text-white text-stroke-black leading-tight p-2">{lesson.content.topText}</div>
                    <div className="absolute bottom-4 w-full text-center font-game text-3xl text-white text-stroke-black leading-tight p-2">{lesson.content.bottomText}</div>
                    
                    {!revealed && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                            <div className="bg-white text-black px-6 py-2 rounded-full font-bold animate-bounce">Tap to Reveal Truth</div>
                        </div>
                    )}
                </div>

                {revealed && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                        <div className="bg-white/10 p-4 rounded-xl border border-white/20 mb-6">
                            <p className="text-neon-blue font-bold text-lg">"{lesson.content.explanation}"</p>
                        </div>
                        <button onClick={onNext} className="px-8 py-3 bg-green-500 text-black font-bold rounded-full btn-3d">
                            FACTS 💯
                        </button>
                    </motion.div>
                )}
            </div>
        );
    };

    const ExplainerView = ({ lesson, onNext }: { lesson: Lesson, onNext: () => void }) => {
        // Helper to parse **text** into buttons
        const renderText = () => {
            const parts = (lesson.content.text || "").split(/(\*\*.*?\*\*)/g);
            return (
                <div className="text-xl leading-relaxed text-white">
                    {parts.map((part: string, i: number) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            const key = part.slice(2, -2);
                            const gem = KNOWLEDGE_GEMS[key];
                            if (gem) {
                                return (
                                    <button 
                                        key={i}
                                        onClick={() => { playSound('coin'); setActiveGem(key); }}
                                        className="bg-neon-yellow/20 text-neon-yellow font-bold px-1 rounded hover:bg-neon-yellow/40 underline decoration-dashed"
                                    >
                                        {key}
                                    </button>
                                );
                            }
                            return <strong key={i} className="text-neon-blue">{key}</strong>;
                        }
                        return <span key={i}>{part}</span>;
                    })}
                </div>
            );
        };

        return (
            <div className="flex flex-col h-full p-6 pt-12 items-center">
                <div className="w-full max-w-md aspect-video bg-black rounded-2xl mb-8 flex items-center justify-center border border-white/20 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-black opacity-50"></div>
                    <PlayIcon className="w-16 h-16 text-white/50" />
                </div>

                <div className="bg-white/5 p-6 rounded-3xl border border-white/10 mb-8 w-full">
                    {renderText()}
                </div>

                <button onClick={onNext} className="px-12 py-4 bg-white text-black font-game text-xl rounded-full btn-3d">
                    COLLECT GEM 💎
                </button>
            </div>
        );
    };

    // --- MAIN RENDER ---
    
    if (isLoading) return <div className="fixed inset-0 bg-[#1a0b2e] flex items-center justify-center text-white">Loading...</div>;

    return (
        <div id="lesson-container" className="fixed inset-0 z-[100] bg-[#1a0b2e] flex flex-col overflow-hidden font-body transition-transform duration-100">
            
            {/* HEADER */}
            <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm border-b border-white/5">
                <div className="flex items-center gap-2">
                    {isBossStage ? (
                        <div className="flex gap-1">
                            {[...Array(3)].map((_, i) => (
                                <HeartIcon key={i} className={`w-8 h-8 ${i < hearts ? 'text-red-500 animate-pulse' : 'text-gray-800'}`} />
                            ))}
                        </div>
                    ) : (
                         <div className="h-3 w-32 bg-gray-800 rounded-full overflow-hidden border border-white/10">
                             <div className="h-full bg-neon-green transition-all duration-500" style={{ width: `${((currentIndex + 1) / lessons.length) * 100}%` }}></div>
                         </div>
                    )}
                </div>
                <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
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
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 bg-red-900/90 flex flex-col items-center justify-center text-center p-8"
                        >
                            <div className="text-8xl mb-4 animate-bounce">{level.bossImage || '👹'}</div>
                            <h1 className="font-game text-6xl text-white text-stroke-black mb-4">BOSS FIGHT</h1>
                            <p className="text-3xl font-bold text-red-200 uppercase tracking-widest mb-4">{level.bossName}</p>
                            <div className="bg-black/40 p-4 rounded-xl border-l-4 border-red-500 italic text-white text-xl">
                                "{level.bossIntro || "Prepare to lose your allowance!"}"
                            </div>
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
                        {currentLesson.type === 'swipe' && <SwipeView lesson={currentLesson} onNext={() => handleLessonComplete(100, 50)} />}
                        {currentLesson.type === 'drag_drop' && <DragDropView lesson={currentLesson} onNext={() => handleLessonComplete(150, 50)} />}
                        {currentLesson.type === 'tap_lie' && <TapLieView lesson={currentLesson} onNext={() => handleLessonComplete(100, 50)} />}
                        {currentLesson.type === 'calculator' && <CalculatorView lesson={currentLesson} onNext={() => handleLessonComplete(100, 50)} />}
                        {currentLesson.type === 'meme' && <MemeView lesson={currentLesson} onNext={() => handleLessonComplete(50, 20)} />}
                        {(currentLesson.type === 'video' || currentLesson.type === 'info') && <ExplainerView lesson={currentLesson} onNext={() => handleLessonComplete(100, 50)} />}
                    
                        {/* VIRAL SOCIAL BAR */}
                        <div className="absolute bottom-4 right-4 flex items-center gap-4">
                             <div className="bg-black/40 px-3 py-1 rounded-full text-xs font-bold text-gray-400 flex items-center gap-1 border border-white/10">
                                 <span>🔥</span>
                                 <span>Reacted by {currentLesson.popularity || '12.4k'} teens</span>
                             </div>
                             <button 
                                onClick={() => { playSound('pop'); setIsLiked(!isLiked); }}
                                className={`p-3 rounded-full border-2 transition-all ${isLiked ? 'bg-neon-pink border-neon-pink text-white' : 'bg-black/40 border-white/20 text-gray-400 hover:border-neon-pink hover:text-neon-pink'}`}
                             >
                                 <HandThumbUpIcon className="w-6 h-6" />
                             </button>
                        </div>
                    </motion.div>
                )}

                {/* BOSS BATTLE */}
                {isBossStage && !showBossIntro && level.bossQuiz && level.bossQuiz[bossCurrentQuestion] && (
                    <div className="h-full flex flex-col p-6 pt-12 bg-red-950/30">
                        <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
                             <div className="text-6xl mb-8 animate-pulse">{level.bossImage || '👹'}</div>
                             
                             <div className="bg-black/60 border-2 border-red-500 rounded-3xl p-6 mb-8 w-full text-center shadow-[0_0_40px_rgba(220,38,38,0.3)]">
                                <h3 className="text-2xl font-bold text-white">{level.bossQuiz[bossCurrentQuestion].question}</h3>
                             </div>

                             <div className="grid grid-cols-1 gap-4 w-full">
                                {level.bossQuiz[bossCurrentQuestion].options.map((opt: string, i: number) => (
                                    <button
                                        key={i}
                                        onClick={() => handleBossAnswer(i === level.bossQuiz[bossCurrentQuestion].correctIndex)}
                                        className="p-4 bg-white text-black font-bold text-lg rounded-2xl border-b-[6px] border-gray-300 active:border-b-0 active:translate-y-1.5 transition-all hover:bg-gray-100"
                                    >
                                        {opt}
                                    </button>
                                ))}
                             </div>
                        </div>
                        <div className="text-center text-red-400 font-mono text-xs uppercase tracking-widest mt-4">
                             Boss HP: {level.bossQuiz.length - bossCurrentQuestion}/{level.bossQuiz.length}
                        </div>
                    </div>
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
