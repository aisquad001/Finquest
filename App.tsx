/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { Hero } from './components/Hero';
import { InputArea } from './components/InputArea';
import { LivePreview } from './components/LivePreview';
import { CreationHistory } from './components/CreationHistory';
import { generateLesson, LessonData } from './services/gemini';
import { playSound } from './services/audio';

const App: React.FC = () => {
  // Game State
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(1);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  
  // Content State
  const [activeLesson, setActiveLesson] = useState<LessonData | null>(null);
  const [currentModuleId, setCurrentModuleId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load progress
  useEffect(() => {
    const saved = localStorage.getItem('finquest_progress_v2');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            setXp(data.xp || 0);
            setLevel(data.level || 1);
            setCompletedModules(data.completedModules || []);
            setStreak(data.streak || 1);
        } catch(e) { console.error(e); }
    }
  }, []);

  // Save progress
  useEffect(() => {
    localStorage.setItem('finquest_progress_v2', JSON.stringify({ xp, level, completedModules, streak }));
  }, [xp, level, completedModules, streak]);

  const handleSelectTopic = async (prompt: string, moduleId: string) => {
      setIsGenerating(true);
      setCurrentModuleId(moduleId);
      // Simulate minimal loading time for feel
      const minLoad = new Promise(resolve => setTimeout(resolve, 1500));
      
      try {
          const [lesson] = await Promise.all([generateLesson(prompt), minLoad]);
          setActiveLesson(lesson);
          playSound('success');
      } catch (err) {
          console.error("Failed");
          setActiveLesson(null);
      } finally {
          setIsGenerating(false);
      }
  };

  const handleLessonComplete = (earnedXp: number) => {
      setXp(prev => prev + earnedXp);
      
      const xpForNextLevel = level * 1000;
      if (xp + earnedXp >= xpForNextLevel) {
          setLevel(prev => prev + 1);
          playSound('levelup');
      }

      if (currentModuleId && !completedModules.includes(currentModuleId)) {
          setCompletedModules(prev => [...prev, currentModuleId]);
      }
      
      setActiveLesson(null);
      setCurrentModuleId(null);
  };

  const handleCloseLesson = () => {
      setActiveLesson(null);
      setCurrentModuleId(null);
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-[#2a1b3d] to-[#1a0b2e] text-white overflow-x-hidden font-body selection:bg-neon-pink selection:text-white relative">
      
      {/* Animated Background Particles */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {[...Array(10)].map((_, i) => (
              <div 
                key={i}
                className="absolute text-white/10 animate-float"
                style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDuration: `${5 + Math.random() * 10}s`,
                    fontSize: `${20 + Math.random() * 40}px`
                }}
              >
                  {['●', '★', '▲', '■'][Math.floor(Math.random() * 4)]}
              </div>
          ))}
           {/* Gradient Blobs */}
           <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-neon-purple/20 rounded-full blur-[100px] mix-blend-screen"></div>
           <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-neon-blue/20 rounded-full blur-[100px] mix-blend-screen"></div>
      </div>
      
      <div className="relative z-10 flex-1 w-full pt-4 pb-12">
        
        <Hero xp={xp} level={level} streak={streak} />
        
        {/* Map Title */}
        <div className="text-center mb-8">
            <h2 className="font-game text-4xl text-white text-stroke-black tracking-wide drop-shadow-neon transform -rotate-2">
                ADVENTURE MAP
            </h2>
        </div>

        <InputArea 
            onSelectTopic={handleSelectTopic} 
            completedModules={completedModules}
            isGenerating={isGenerating}
        />

        <CreationHistory completedModules={completedModules} />
        
        <footer className="text-center pb-8 px-4 mt-12">
            <p className="text-xs text-white/40 font-bold uppercase tracking-widest">
                FinQuest v2.0 • Press Start
            </p>
        </footer>
      </div>

      {/* Game Level Overlay */}
      <LivePreview
        lesson={activeLesson}
        isLoading={isGenerating}
        onClose={handleCloseLesson}
        onComplete={handleLessonComplete}
      />
    </div>
  );
};

export default App;