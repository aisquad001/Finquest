
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { playSound } from '../services/audio';
import { ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

interface OnboardingProps {
  onComplete: (data: any) => void;
  onOpenPortal?: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onOpenPortal }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [birthYear, setBirthYear] = useState<string>('');
  const [ageStep, setAgeStep] = useState(true); // Default to showing Age Gate first
  const [blocked, setBlocked] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i); // Last 100 years

  const handleAgeVerify = () => {
      if (!birthYear) return;
      const year = parseInt(birthYear);
      const age = currentYear - year;
      
      if (age < 13) {
          setBlocked(true);
          playSound('error');
      } else {
          playSound('success');
          setAgeStep(false);
      }
  };

  const handleAuth = async (method: 'google' | 'guest') => {
      if (isLoading) return;
      setIsLoading(true);
      playSound('click');
      try {
          await onComplete({ 
              authMethod: method,
              ageConfirmed: true,
              birthYear: parseInt(birthYear)
          });
      } catch (e) {
          setIsLoading(false);
          console.error(e);
      }
  };

  // BLOCKED STATE
  if (blocked) {
      return (
          <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-black p-8 text-center font-body">
              <ExclamationTriangleIcon className="w-24 h-24 text-red-500 mb-6 animate-pulse" />
              <h1 className="text-3xl font-game text-white mb-4">ACCESS DENIED</h1>
              <p className="text-gray-400 text-lg max-w-md mb-8">
                  Sorry! You must be 13 or older to play Racked. This is to keep everyone safe (COPPA/GDPR compliance).
              </p>
              <button onClick={() => window.location.reload()} className="text-white underline">Oops, I picked the wrong year</button>
          </div>
      );
  }

  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-black font-body overflow-hidden selection:bg-neon-pink selection:text-white">
         
         {/* 1. Background Gradient #00ff88 -> #ff00b8 */}
         <div className="absolute inset-0 bg-gradient-to-br from-[#00ff88] via-[#1a0b2e] to-[#ff00b8] opacity-90"></div>
         
         {/* Dark Overlay for contrast */}
         <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"></div>

         {/* Floating Coins Animation */}
         <div className="absolute inset-0 pointer-events-none">
             {[...Array(20)].map((_, i) => (
                 <div 
                    key={i}
                    className="absolute text-4xl opacity-40 animate-float"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDuration: `${4 + Math.random() * 6}s`,
                        animationDelay: `${Math.random() * 5}s`
                    }}
                 >
                    {Math.random() > 0.6 ? '💰' : (Math.random() > 0.5 ? '💎' : '🪙')}
                 </div>
             ))}
         </div>

         {/* AGE GATE STEP */}
         {ageStep ? (
             <div className="relative z-10 w-full max-w-md px-6 flex flex-col items-center text-center animate-pop-in bg-black/40 p-8 rounded-3xl border-2 border-white/10 backdrop-blur-md shadow-2xl">
                 <ShieldCheckIcon className="w-16 h-16 text-white mb-4" />
                 <h2 className="font-game text-3xl text-white mb-2">VERIFY AGE</h2>
                 <p className="text-white/80 mb-6 text-sm">Please confirm your birth year to continue.</p>
                 
                 <select 
                    value={birthYear} 
                    onChange={(e) => setBirthYear(e.target.value)}
                    className="w-full p-4 rounded-xl bg-white text-black font-bold text-xl mb-6 outline-none border-4 border-transparent focus:border-neon-blue"
                 >
                     <option value="">Select Year...</option>
                     {years.map(y => (
                         <option key={y} value={y}>{y}</option>
                     ))}
                 </select>

                 <button 
                    onClick={handleAgeVerify}
                    disabled={!birthYear}
                    className="w-full py-4 bg-neon-pink text-white font-game text-xl rounded-xl btn-3d disabled:opacity-50 disabled:grayscale"
                 >
                     CONTINUE
                 </button>
             </div>
         ) : (
             /* AUTH STEP */
             <div className="relative z-10 w-full max-w-md px-6 flex flex-col items-center text-center h-full justify-end pb-16">
                 
                 {/* Logo / Hero Area */}
                 <div className="flex-1 flex flex-col items-center justify-center w-full slide-enter">
                     <div className="relative mb-6 group cursor-pointer transform transition-transform hover:scale-110" onClick={() => playSound('pop')}>
                        <div className="absolute inset-0 bg-white blur-[60px] opacity-30 rounded-full animate-pulse"></div>
                        <div className="text-[120px] animate-bounce drop-shadow-2xl filter brightness-110">
                            💸
                        </div>
                     </div>
                     
                     <h1 className="font-game text-[5.5rem] leading-none text-white mb-6 drop-shadow-[0_8px_0_rgba(0,0,0,0.4)] tracking-tighter italic -rotate-3 text-stroke-black">
                        RACKED
                     </h1>
                     
                     <div className="space-y-3 mb-10">
                        <h2 className="text-3xl font-black text-white leading-tight">
                            Level up your <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00ff88] drop-shadow-md">
                                money game
                            </span>
                        </h2>
                        <p className="text-lg text-white/90 font-bold tracking-wide">
                            Turn allowance into an empire 💰
                        </p>
                     </div>
                 </div>

                 {/* Buttons Area */}
                 <div className="w-full space-y-4 slide-enter" style={{ animationDelay: '0.2s' }}>
                     <button 
                        onClick={() => handleAuth('google')}
                        disabled={isLoading}
                        className="w-full py-5 bg-white hover:bg-gray-100 text-black font-black text-xl rounded-full shadow-[0_0_50px_rgba(255,255,255,0.5)] flex items-center justify-center gap-3 transition-all active:scale-95 relative overflow-hidden group"
                     >
                        {isLoading ? (
                            <span className="animate-pulse">CONNECTING...</span>
                        ) : (
                            <>
                                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="G" />
                                CONTINUE WITH GOOGLE
                            </>
                        )}
                     </button>

                     <button 
                        onClick={() => handleAuth('guest')}
                        disabled={isLoading}
                        className="w-full py-4 bg-black/20 border-2 border-white/40 text-white font-bold text-lg rounded-full hover:bg-white/10 hover:border-white active:scale-95 transition-all backdrop-blur-md"
                     >
                        Play as Guest
                     </button>
                     
                     <div className="pt-4">
                         <button
                            onClick={() => { playSound('click'); if(onOpenPortal) onOpenPortal(); }}
                            className="text-xs text-white/70 font-bold hover:text-white hover:underline uppercase tracking-widest"
                         >
                             Parent Portal Access
                         </button>
                     </div>
                 </div>
             </div>
         )}
    </div>
  );
};
