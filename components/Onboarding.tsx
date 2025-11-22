/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { playSound } from '../services/audio';
import { Avatar } from './Avatar';

interface OnboardingProps {
  onComplete: (data: any) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [isSigningUp, setIsSigningUp] = useState(false);

  const handleAuthAction = async (method: 'google' | 'guest') => {
    if (isSigningUp) return;
    
    setIsSigningUp(true);
    playSound('click');

    try {
        // Just pass the method up. App.tsx handles the heavy lifting/logic.
        await onComplete({ authMethod: method });
    } catch (e: any) {
        console.error("Auth failed in Onboarding:", e);
        setIsSigningUp(false);
        
        // Clean user alerts
        const msg = e.message || "Unknown error";
        if (!msg.includes('cancelled') && !msg.includes('closed')) {
            alert("Login Failed: " + msg);
        }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#1a0b2e] text-white font-body h-dvh w-full overflow-hidden flex flex-col items-center justify-center p-6">
         
         {/* Background FX */}
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
         <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-neon-purple/20 rounded-full blur-[120px] pointer-events-none"></div>
         <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-neon-blue/20 rounded-full blur-[120px] pointer-events-none"></div>

         <div className="relative z-10 text-center max-w-md w-full">
             
             <div className="relative w-40 h-40 mx-auto mb-8">
                <div className="absolute inset-0 bg-neon-green/20 blur-3xl rounded-full animate-pulse"></div>
                <div className="relative z-10 text-9xl animate-float">💸</div>
                <div className="absolute top-0 right-0 text-6xl animate-bounce delay-700">🚀</div>
                <div className="absolute bottom-0 left-0 text-5xl animate-bounce delay-1000">💎</div>
             </div>

             <h1 className="font-game text-6xl mb-2 text-stroke-black text-white leading-tight drop-shadow-neon">
                RACKED
             </h1>
             <p className="text-xl mb-12 text-gray-300 font-bold">The only game where you get rich IRL.</p>
             
             <div className="space-y-4 w-full">
                {/* Google Button */}
                <button 
                    onClick={() => handleAuthAction('google')}
                    disabled={isSigningUp}
                    className="w-full py-4 bg-white text-black font-game text-xl rounded-2xl border-b-[6px] border-gray-300 hover:bg-gray-100 active:border-b-0 active:translate-y-1.5 transition-all shadow-xl flex items-center justify-center gap-3"
                >
                    {isSigningUp ? (
                        <span className="animate-pulse">LOADING...</span>
                    ) : (
                        <>
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" />
                            CONTINUE WITH GOOGLE
                        </>
                    )}
                </button>

                <div className="relative py-4">
                     <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                     <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#1a0b2e] px-2 text-gray-500 font-bold">or</span></div>
                </div>
                
                {/* Guest Button */}
                <button 
                    onClick={() => handleAuthAction('guest')}
                    disabled={isSigningUp}
                    className="w-full py-4 bg-transparent border-2 border-white/20 text-white/70 font-bold rounded-2xl hover:bg-white/5 hover:text-white hover:border-white active:scale-95 transition-all"
                >
                    PLAY AS GUEST
                </button>

                <p className="text-[10px] text-gray-500 mt-4">
                    By continuing, you agree to get rich or die trying. <br/>
                    Guest accounts are not saved across devices.
                </p>
             </div>
         </div>
    </div>
  );
};