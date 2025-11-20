/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, TrophyIcon, ArrowRightIcon } from '@heroicons/react/24/solid';
import { LessonData } from '../services/gemini';
import { playSound } from '../services/audio';

interface LessonModalProps {
  lesson: LessonData | null;
  isLoading: boolean;
  onClose: () => void;
  onComplete: (xp: number) => void;
}

export const LivePreview: React.FC<LessonModalProps> = ({ lesson, isLoading, onClose, onComplete }) => {
  const [step, setStep] = useState<'content' | 'quiz' | 'result'>('content');
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [sectionIndex, setSectionIndex] = useState(0); // For stepping through content
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lesson) {
        setStep('content');
        setSectionIndex(0);
        setQuizIndex(0);
        setSelectedOption(null);
        setShowExplanation(false);
        setScore(0);
        playSound('pop');
    }
  }, [lesson]);

  // Confetti trigger helper
  const triggerConfetti = () => {
    (window as any).confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00FF88', '#00C2FF', '#FF00B8', '#FFFF00']
    });
  };

  const handleOptionClick = (index: number) => {
      if (showExplanation) return;
      
      setSelectedOption(index);
      setShowExplanation(true);
      
      if (lesson?.quiz && lesson.quiz[quizIndex] && index === lesson.quiz[quizIndex].correctIndex) {
          setScore(prev => prev + 1);
          playSound('success');
          triggerConfetti();
      } else {
          playSound('error');
      }
  };

  const handleNextQuestion = () => {
      playSound('pop');
      if (!lesson?.quiz) return;

      if (quizIndex < lesson.quiz.length - 1) {
          setQuizIndex(prev => prev + 1);
          setSelectedOption(null);
          setShowExplanation(false);
      } else {
          setStep('result');
          playSound('levelup');
          if (score >= Math.ceil(lesson.quiz.length / 2)) {
              onComplete(lesson.xpReward || 100);
              setTimeout(triggerConfetti, 300);
          }
      }
  };

  const handleNextSection = () => {
      playSound('pop');
      if (lesson?.sections && sectionIndex < lesson.sections.length - 1) {
          setSectionIndex(prev => prev + 1);
      } else {
          setStep('quiz');
      }
  };

  if (!lesson && !isLoading) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl transition-all duration-500 ${isLoading || lesson ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      
      {/* Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 text-4xl animate-float">💰</div>
          <div className="absolute bottom-20 right-10 text-4xl animate-float-delayed">💎</div>
          <div className="absolute top-1/2 left-1/4 text-2xl animate-bounce text-neon-pink">✨</div>
      </div>

      {/* Loading State */}
      {isLoading && (
          <div className="text-center flex flex-col items-center animate-pop-in">
              <div className="w-32 h-32 relative mb-8">
                  <div className="absolute inset-0 bg-neon-green rounded-full animate-ping opacity-20"></div>
                  <div className="relative w-full h-full bg-gradient-to-br from-neon-green to-neon-blue rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(0,255,136,0.6)] animate-bounce">
                      <span className="text-5xl">💸</span>
                  </div>
              </div>
              <h2 className="text-4xl font-game text-white text-shadow-neon mb-4">LOADING RICHES...</h2>
              <div className="w-64 h-4 bg-black/50 rounded-full overflow-hidden border border-white/20">
                  <div className="h-full bg-neon-pink animate-[shimmer_1s_infinite] w-full"></div>
              </div>
          </div>
      )}

      {/* Modal Container */}
      {!isLoading && lesson && (
          <div className="w-full max-w-md bg-[#2a1b3d] border-4 border-black rounded-[2.5rem] shadow-[0_20px_0_0_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative max-h-[85vh] animate-pop-in">
            
            {/* Header / Top Bar */}
            <div className="flex items-center justify-between p-6 bg-[#1a0b2e] border-b-4 border-black">
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-neon-green uppercase tracking-widest mb-1">Current Quest</span>
                    <h2 className="font-game text-xl text-white leading-none">{lesson.title}</h2>
                </div>
                <button 
                    onClick={onClose} 
                    className="w-10 h-10 bg-red-500 rounded-xl border-b-4 border-red-800 flex items-center justify-center text-white active:border-b-0 active:translate-y-1 transition-all hover:bg-red-400"
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>
            </div>

            {/* Scrollable Content */}
            <div ref={contentRef} className="flex-1 overflow-y-auto p-6 relative bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] bg-opacity-5">
                
                {step === 'content' && (
                    <div className="space-y-8 flex flex-col items-center text-center h-full justify-between">
                        
                        {/* Section Card */}
                        <div key={sectionIndex} className="flex-1 flex flex-col items-center animate-pop-in w-full">
                            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center text-6xl mb-6 shadow-neon border-2 border-white/20 backdrop-blur-md">
                                {(lesson.sections && lesson.sections[sectionIndex]) ? lesson.sections[sectionIndex].emoji : '👻'}
                            </div>
                            
                            <h3 className="text-2xl font-black text-white mb-4 bg-black/20 px-4 py-1 rounded-lg inline-block">
                                {(lesson.sections && lesson.sections[sectionIndex]) ? lesson.sections[sectionIndex].heading : 'Loading...'}
                            </h3>
                            
                            <div className="bg-white text-black p-6 rounded-3xl border-b-8 border-gray-300 font-bold text-lg leading-relaxed shadow-xl w-full text-left relative">
                                <div className="absolute -top-3 left-6 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-white"></div>
                                <p>{(lesson.sections && lesson.sections[sectionIndex]) ? lesson.sections[sectionIndex].text : ''}</p>
                            </div>
                        </div>

                        {/* Navigation */}
                        <div className="w-full pt-4">
                            <button 
                                onClick={handleNextSection}
                                className="w-full py-4 bg-neon-blue hover:bg-cyan-400 text-black font-game text-2xl uppercase tracking-wider rounded-2xl border-b-[6px] border-[#0088b3] active:border-b-0 active:translate-y-1.5 transition-all shadow-lg"
                            >
                                {lesson.sections && sectionIndex < lesson.sections.length - 1 ? 'Next Tip ➡' : 'Boss Fight! ⚔'}
                            </button>
                            
                            <div className="flex justify-center gap-2 mt-4">
                                {(lesson.sections || []).map((_, i) => (
                                    <div key={i} className={`w-3 h-3 rounded-full ${i === sectionIndex ? 'bg-neon-pink w-6' : 'bg-white/20'} transition-all duration-300`}></div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {step === 'quiz' && lesson.quiz && lesson.quiz[quizIndex] && (
                    <div className="h-full flex flex-col justify-between animate-pop-in">
                        <div>
                            {/* Progress */}
                            <div className="flex justify-between text-xs font-bold text-zinc-400 mb-2 uppercase">
                                <span>Question {quizIndex + 1}</span>
                                <span>{lesson.quiz.length} Total</span>
                            </div>
                            <div className="w-full h-3 bg-black rounded-full mb-8 border border-zinc-700">
                                <div 
                                    className="h-full bg-neon-green rounded-full transition-all duration-500"
                                    style={{ width: `${((quizIndex + 1) / lesson.quiz.length) * 100}%` }}
                                ></div>
                            </div>

                            <h3 className="text-xl font-bold text-white text-center mb-8 drop-shadow-md leading-tight">
                                {lesson.quiz[quizIndex].question}
                            </h3>

                            <div className="space-y-4">
                                {(lesson.quiz[quizIndex].options || []).map((option, idx) => {
                                    const isSelected = selectedOption === idx;
                                    const isCorrect = idx === lesson.quiz![quizIndex].correctIndex;
                                    
                                    let btnStyle = "bg-white text-black border-gray-300"; // Default
                                    
                                    if (showExplanation) {
                                        if (isCorrect) btnStyle = "bg-neon-green text-black border-green-700 ring-4 ring-green-400/50";
                                        else if (isSelected) btnStyle = "bg-red-500 text-white border-red-800 ring-4 ring-red-400/50";
                                        else btnStyle = "bg-gray-400 text-gray-700 border-gray-500 opacity-50";
                                    } else if (isSelected) {
                                        btnStyle = "bg-neon-blue text-black border-blue-700";
                                    }

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleOptionClick(idx)}
                                            disabled={showExplanation}
                                            className={`
                                                w-full p-4 rounded-2xl border-b-[6px] font-bold text-lg text-left transition-all
                                                ${btnStyle} 
                                                ${!showExplanation ? 'hover:translate-y-[-2px] active:translate-y-[2px] active:border-b-0' : ''}
                                            `}
                                        >
                                            {option}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {showExplanation && (
                            <div className="mt-6 animate-pop-in">
                                <div className="bg-black/40 p-4 rounded-xl border-2 border-white/10 text-white text-sm mb-4 font-medium">
                                    <span className="text-neon-yellow font-black text-lg block mb-1">
                                        {selectedOption === lesson.quiz[quizIndex].correctIndex ? 'BOOM! 💥' : 'OOF! 💀'}
                                    </span>
                                    {lesson.quiz[quizIndex].explanation}
                                </div>
                                <button 
                                    onClick={handleNextQuestion}
                                    className="w-full py-4 bg-neon-pink text-white font-game text-2xl rounded-2xl border-b-[6px] border-[#b30082] active:border-b-0 active:translate-y-1.5 transition-all shadow-lg hover:brightness-110"
                                >
                                    CONTINUE
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {step === 'result' && (
                    <div className="flex flex-col items-center justify-center h-full text-center animate-pop-in">
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-neon-yellow blur-[50px] opacity-20"></div>
                            <TrophyIcon className={`w-32 h-32 ${score >= (lesson.quiz?.length || 0) / 2 ? 'text-neon-yellow' : 'text-gray-500'} drop-shadow-lg`} />
                        </div>
                        
                        <h2 className="text-4xl font-game text-white text-stroke-black mb-2">
                            {score >= (lesson.quiz?.length || 0) / 2 ? "LEVEL COMPLETE!" : "TRY AGAIN"}
                        </h2>
                        
                        <div className="bg-black/50 px-6 py-2 rounded-full mb-8 border border-white/10">
                            <p className="text-white font-bold text-xl">
                                Score: <span className="text-neon-blue">{score}</span> / {lesson.quiz?.length}
                            </p>
                        </div>

                        {score >= (lesson.quiz?.length || 0) / 2 && (
                            <div className="mb-8 flex flex-col gap-2 animate-bounce">
                                <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Rewards</span>
                                <div className="bg-gradient-to-r from-neon-green to-emerald-600 px-8 py-4 rounded-2xl border-4 border-black shadow-lg">
                                    <p className="text-black font-game text-3xl">+{lesson.xpReward} XP</p>
                                </div>
                            </div>
                        )}

                        <button 
                            onClick={onClose}
                            className="w-full py-4 bg-white text-black font-game text-2xl rounded-2xl border-b-[6px] border-gray-300 hover:bg-gray-100 active:border-b-0 active:translate-y-1.5 transition-all"
                        >
                            CLAIM REWARD
                        </button>
                    </div>
                )}
            </div>
          </div>
      )}
    </div>
  );
};