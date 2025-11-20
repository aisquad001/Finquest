/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, CheckCircleIcon, XCircleIcon, ArrowRightIcon, BoltIcon } from '@heroicons/react/24/outline';
import { LessonData } from '../services/gemini';

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
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lesson) {
        setStep('content');
        setQuizIndex(0);
        setSelectedOption(null);
        setShowExplanation(false);
        setScore(0);
        if (contentRef.current) contentRef.current.scrollTop = 0;
    }
  }, [lesson]);

  if (!lesson && !isLoading) return null;

  const handleOptionClick = (index: number) => {
      if (showExplanation) return;
      setSelectedOption(index);
      setShowExplanation(true);
      
      if (index === lesson!.quiz[quizIndex].correctIndex) {
          setScore(prev => prev + 1);
      }
  };

  const handleNextQuestion = () => {
      if (quizIndex < lesson!.quiz.length - 1) {
          setQuizIndex(prev => prev + 1);
          setSelectedOption(null);
          setShowExplanation(false);
      } else {
          setStep('result');
          // Only award XP if they pass (50%+)
          if (score >= Math.ceil(lesson!.quiz.length / 2)) {
              onComplete(lesson!.xpReward || 100);
          }
      }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md transition-all duration-300 ${isLoading || lesson ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      
      {/* Loading State */}
      {isLoading && (
          <div className="text-center flex flex-col items-center animate-pulse">
              <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-2xl animate-spin mb-6"></div>
              <h2 className="text-2xl font-bold text-white mb-2">Loading World...</h2>
              <p className="text-zinc-400">FinBot is calculating the stonks 📈</p>
          </div>
      )}

      {/* Lesson Content */}
      {!isLoading && lesson && (
          <div className="w-full max-w-2xl bg-[#121214] border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col relative">
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-xl">
                        {step === 'content' ? '📖' : step === 'quiz' ? '🎮' : '🏆'}
                    </div>
                    <div>
                        <h2 className="font-bold text-white text-sm sm:text-base leading-tight">{lesson.title}</h2>
                        <div className="flex items-center gap-1 text-xs text-yellow-500 font-bold mt-0.5">
                            <BoltIcon className="w-3 h-3" />
                            {lesson.xpReward} XP Reward
                        </div>
                    </div>
                </div>
                <button 
                    onClick={onClose} 
                    className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
                >
                    <XMarkIcon className="w-6 h-6 text-zinc-500 hover:text-white" />
                </button>
            </div>

            {/* Scrollable Area */}
            <div ref={contentRef} className="flex-1 overflow-y-auto p-4 sm:p-8 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                
                {step === 'content' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Intro Bubble */}
                        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 p-6 rounded-2xl relative overflow-hidden">
                             <div className="relative z-10">
                                <p className="text-blue-200 font-medium text-lg leading-relaxed">
                                    "{lesson.intro}"
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs">🤖</div>
                                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wide">FinBot Says</span>
                                </div>
                             </div>
                        </div>
                        
                        {/* Sections */}
                        <div className="grid gap-6">
                            {lesson.sections.map((section, idx) => (
                                <div key={idx} className="group">
                                    <div className="flex items-start gap-4 mb-2">
                                        <span className="text-3xl bg-zinc-800 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border border-zinc-700 shadow-lg group-hover:scale-110 transition-transform">
                                            {section.emoji}
                                        </span>
                                        <div>
                                            <h3 className="text-xl font-bold text-white mb-2">{section.heading}</h3>
                                            <p className="text-zinc-400 leading-relaxed text-base sm:text-lg">{section.text}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Action Button */}
                        <div className="pt-4">
                            <button 
                                onClick={() => setStep('quiz')}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.01] flex items-center justify-center gap-2"
                            >
                                Start Challenge <ArrowRightIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {step === 'quiz' && (
                    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-zinc-800 rounded-full mb-8">
                            <div 
                                className="h-full bg-green-500 rounded-full transition-all duration-500"
                                style={{ width: `${((quizIndex) / lesson.quiz.length) * 100}%` }}
                            ></div>
                        </div>

                        <h3 className="text-xl sm:text-2xl font-bold text-white text-center mb-8 leading-tight">
                            {lesson.quiz[quizIndex].question}
                        </h3>

                        <div className="space-y-3">
                            {lesson.quiz[quizIndex].options.map((option, idx) => {
                                const isSelected = selectedOption === idx;
                                const isCorrect = idx === lesson.quiz[quizIndex].correctIndex;
                                const showState = showExplanation;

                                let btnClass = "bg-zinc-800/50 hover:bg-zinc-800 border-zinc-700";
                                if (showState) {
                                    if (isCorrect) btnClass = "bg-green-500/20 border-green-500 text-green-100 ring-1 ring-green-500";
                                    else if (isSelected && !isCorrect) btnClass = "bg-red-500/20 border-red-500 text-red-100 opacity-50";
                                    else if (!isCorrect) btnClass = "bg-zinc-800/30 border-zinc-800 opacity-30";
                                }

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleOptionClick(idx)}
                                        disabled={showExplanation}
                                        className={`w-full p-5 rounded-xl border text-left transition-all duration-200 text-base font-medium relative overflow-hidden ${btnClass} ${isSelected && !showState ? 'border-blue-500 ring-1 ring-blue-500' : ''}`}
                                    >
                                        <div className="flex items-center justify-between relative z-10">
                                            <span>{option}</span>
                                            {showState && isCorrect && <CheckCircleIcon className="w-6 h-6 text-green-500" />}
                                            {showState && isSelected && !isCorrect && <XCircleIcon className="w-6 h-6 text-red-500" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {showExplanation && (
                            <div className="animate-in fade-in zoom-in duration-300 pt-4">
                                <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-700 text-zinc-300 mb-6 text-sm">
                                    <span className="font-bold text-white block mb-1">💡 Insight:</span>
                                    {lesson.quiz[quizIndex].explanation}
                                </div>
                                <button 
                                    onClick={handleNextQuestion}
                                    className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors shadow-lg"
                                >
                                    {quizIndex < lesson.quiz.length - 1 ? 'Next Level' : 'Finish Quest'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {step === 'result' && (
                    <div className="text-center space-y-6 py-12 animate-in zoom-in duration-500">
                        <div className="relative inline-block">
                            <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-4 shadow-2xl ${score >= lesson.quiz.length / 2 ? 'bg-yellow-500 rotate-12' : 'bg-zinc-800 rotate-0'}`}>
                                <span className="text-4xl">{score >= lesson.quiz.length / 2 ? '👑' : '💀'}</span>
                            </div>
                        </div>
                        
                        <div>
                            <h2 className="text-4xl font-black text-white mb-2">
                                {score >= lesson.quiz.length / 2 ? "QUEST COMPLETE!" : "GAME OVER"}
                            </h2>
                            <p className="text-zinc-400 text-lg">
                                You got {score} out of {lesson.quiz.length} correct
                            </p>
                        </div>

                        {score >= lesson.quiz.length / 2 ? (
                            <div className="inline-flex flex-col items-center gap-2 animate-bounce">
                                <div className="bg-green-500/20 border border-green-500/50 px-6 py-2 rounded-full">
                                    <p className="text-green-400 font-mono font-bold text-xl">+{lesson.xpReward} XP</p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-red-500/10 border border-red-500/20 px-6 py-3 rounded-lg inline-block">
                                <p className="text-red-400 font-medium">Score 50% or more to keep the loot.</p>
                            </div>
                        )}

                        <div className="pt-12 w-full max-w-xs mx-auto">
                            <button 
                                onClick={onClose}
                                className="w-full py-4 bg-white text-black font-black tracking-wide rounded-2xl hover:bg-zinc-200 transition-colors shadow-xl"
                            >
                                CLAIM & EXIT
                            </button>
                        </div>
                    </div>
                )}
            </div>
          </div>
      )}
    </div>
  );
};