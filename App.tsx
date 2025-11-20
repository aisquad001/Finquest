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

  // Load progress on mount
  useEffect(() => {
    const saved = localStorage.getItem('finquest_progress_v1');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            setXp(data.xp || 0);
            setLevel(data.level || 1);
            setCompletedModules(data.completedModules || []);
            setStreak(data.streak || 1);
        } catch(e) {
            console.error("Load failed", e);
        }
    }
  }, []);

  // Save progress
  useEffect(() => {
    localStorage.setItem('finquest_progress_v1', JSON.stringify({ xp, level, completedModules, streak }));
  }, [xp, level, completedModules, streak]);

  const handleSelectTopic = async (prompt: string, moduleId: string) => {
      setIsGenerating(true);
      setCurrentModuleId(moduleId);
      try {
          // We append the module title/context to the prompt in the service
          const lesson = await generateLesson(prompt);
          setActiveLesson(lesson);
      } catch (err) {
          console.error("Lesson generation failed");
          // Fallback for error handled in service but extra safety here
      } finally {
          setIsGenerating(false);
      }
  };

  const handleLessonComplete = (earnedXp: number) => {
      // XP Animation / State Update
      setXp(prev => prev + earnedXp);
      
      // Level up logic (Every 1000 XP * Level)
      const xpForNextLevel = level * 1000;
      if (xp + earnedXp >= xpForNextLevel) {
          setLevel(prev => prev + 1);
          // In a real app, trigger a level-up modal here
      }

      // Mark module as complete
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
    <div className="min-h-[100dvh] bg-zinc-950 text-zinc-50 selection:bg-green-500/30 overflow-y-auto overflow-x-hidden relative flex flex-col font-sans">
      
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:40px_40px] opacity-20 pointer-events-none z-0"></div>
      
      <div className="relative z-10 flex-1 w-full pt-6 md:pt-12 pb-12">
        <Hero xp={xp} level={level} streak={streak} />
        
        <div className="w-full max-w-5xl mx-auto px-4 mb-6 flex items-end justify-between">
            <div>
                <h2 className="text-2xl font-black text-white tracking-tight">WORLD MAP</h2>
                <p className="text-zinc-400 text-sm">Select a region to start your quest.</p>
            </div>
            <div className="hidden sm:block text-right">
                <p className="text-xs font-mono text-zinc-500">PROGRESS</p>
                <p className="text-lg font-bold text-white">{Math.round((completedModules.length / 8) * 100)}%</p>
            </div>
        </div>

        <InputArea 
            onSelectTopic={handleSelectTopic} 
            completedModules={completedModules}
            isGenerating={isGenerating}
        />

        <CreationHistory completedModules={completedModules} />
        
        <footer className="text-center pb-8 px-4">
            <p className="text-xs text-zinc-600 font-mono mb-2">
                Powered by Google Gemini • FinQuest v1.2
            </p>
            <div className="flex justify-center gap-4 text-[10px] text-zinc-700 uppercase tracking-wider">
                <span>Privacy</span>
                <span>Terms</span>
                <span>Support</span>
            </div>
        </footer>
      </div>

      {/* Interactive Lesson Overlay */}
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