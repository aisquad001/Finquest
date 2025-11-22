/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useRef, useState } from 'react';
import { playSound } from '../services/audio';
import { Avatar } from './Avatar';
import { ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/solid';

interface OnboardingProps {
  onComplete: (data: any) => void;
}

// Data for the Avatar Creator
const AVATAR_OPTIONS = {
  emojis: ['😎', '🤠', '👽', '👻', '🤖', '😼', '🦊', '🐯'],
  outfits: ['👕', '🧥', '👗', '🥋', '🦺', '👔', '👘', '👚'],
  accessories: ['🧢', '👒', '👓', '👑', '🎧', '🎒', '🎸', '📱'],
  bgs: ['bg-neon-blue', 'bg-neon-pink', 'bg-neon-green', 'bg-neon-purple']
};

// Random nickname generator
const NICKNAMES = [
  "Cashanova", "Dividend Daddy", "Crypto Queen", "Stonks Lord", 
  "Budget Beast", "Savings Samurai", "Profit Prophet", "Moola Master"
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const swiperRef = useRef<any>(null);
  
  // User State
  const [nickname, setNickname] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [avatarConfig, setAvatarConfig] = useState({
    emoji: '😎',
    outfit: '👕',
    accessory: '🧢',
    bg: 'bg-neon-blue'
  });
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);

  useEffect(() => {
    // Initialize Swiper
    const swiperEl = document.querySelector('.swiper');
    if (swiperEl && (window as any).Swiper) {
        swiperRef.current = new (window as any).Swiper('.swiper', {
            direction: 'vertical',
            pagination: { el: '.swiper-pagination', clickable: true },
            allowTouchMove: true,
            speed: 600,
            effect: 'slide',
        });
    }

    return () => {
        if (swiperRef.current) swiperRef.current.destroy();
    }
  }, []);

  const handleNext = () => {
    playSound('pop');
    swiperRef.current?.slideNext();
  };

  const generateNickname = () => {
    playSound('pop');
    const random = NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)];
    setNickname(random);
  };

  const handleAuthAction = async (method: 'google' | 'guest' | 'apple') => {
    console.log("Handle Auth Action Triggered:", method);
    if (isSigningUp) return;
    
    setIsSigningUp(true);
    playSound('click');

    // Prepare User Data
    const userData = {
        nickname: nickname || "Player 1",
        avatar: avatarConfig,
        path: selectedPath || "balanced",
        referralCodeInput: referralCode || null, // Pass code to DB creation
        joinedAt: new Date().toISOString(),
        xp: referralCode ? 1500 : 500, // Bonus XP for referral
        streak: 1,
        authMethod: method 
    };

    try {
        await onComplete(userData);
    } catch (e: any) {
        console.error("Auth failed in Onboarding:", e);
        setIsSigningUp(false);
        alert("Sign in failed. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#1a0b2e] text-white font-body h-dvh w-full overflow-hidden">
        <div className="swiper h-full w-full">
            <div className="swiper-wrapper">
                
                {/* Slide 1: Intro Loop */}
                <div className="swiper-slide flex flex-col items-center justify-center p-6 text-center relative">
                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                     
                     <div className="relative w-full max-w-xs aspect-square mb-8">
                        <div className="absolute inset-0 bg-neon-green/20 blur-3xl rounded-full animate-pulse"></div>
                        <div className="relative z-10 text-9xl animate-float">💸</div>
                        <div className="absolute top-0 right-0 text-6xl animate-bounce delay-700">🚀</div>
                        <div className="absolute bottom-10 left-0 text-5xl animate-bounce delay-1000">💎</div>
                     </div>

                     <h1 className="font-game text-5xl mb-4 text-stroke-black text-white leading-tight drop-shadow-neon">
                        FROM <span className="text-gray-400 line-through">BROKE</span><br/>
                        TO <span className="text-neon-yellow">BALLER</span>
                     </h1>
                     <p className="text-xl mb-12 text-gray-300">Turn your allowance into an empire. No cap.</p>
                     
                     <div className="animate-bounce w-full">
                        <button onClick={handleNext} className="w-full max-w-xs py-4 bg-neon-pink text-white font-game text-2xl rounded-full border-b-[6px] border-[#b30082] active:border-b-0 active:translate-y-1.5 transition-all shadow-lg">
                            GET RICH ⬇
                        </button>
                     </div>
                </div>

                {/* Slide 2: Nickname & Referral */}
                <div className="swiper-slide flex flex-col items-center justify-center p-6 relative">
                    <h2 className="font-game text-3xl mb-4 text-center">Who are you?</h2>
                    
                    <div className="w-full max-w-xs space-y-6">
                        <div>
                             <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Nickname</label>
                             <div className="relative">
                                <input 
                                    type="text" 
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    placeholder="Type ur name..."
                                    className="w-full p-4 rounded-2xl bg-white/10 border-2 border-white/20 text-center text-2xl font-bold placeholder-white/30 focus:outline-none focus:border-neon-blue focus:bg-white/20 transition-all"
                                />
                                <button 
                                    onClick={generateNickname}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xl"
                                >
                                    🎲
                                </button>
                             </div>
                        </div>

                        <div>
                             <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Referral Code (Optional)</label>
                             <input 
                                type="text" 
                                value={referralCode}
                                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                                placeholder="CASHKING69"
                                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-center text-lg font-mono font-bold placeholder-white/20 focus:outline-none focus:border-neon-green transition-all"
                            />
                            {referralCode.length > 3 && <div className="text-center text-xs text-neon-green mt-1 font-bold">Code Applied! +1000 XP Bonus</div>}
                        </div>
                    </div>

                    <button 
                        onClick={handleNext} 
                        disabled={!nickname}
                        className={`mt-12 w-16 h-16 rounded-full flex items-center justify-center transition-all ${nickname ? 'bg-neon-green text-black btn-3d' : 'bg-gray-700 text-gray-500'}`}
                    >
                        <ArrowRightIcon className="w-8 h-8" />
                    </button>
                </div>

                {/* Slide 3: Avatar Creator */}
                <div className="swiper-slide flex flex-col items-center justify-center p-4">
                    <h2 className="font-game text-3xl mb-2">Drip Check</h2>
                    <p className="text-sm text-gray-400 mb-6">Look good, play good.</p>

                    <div className="mb-8 transform scale-110">
                        <Avatar level={1} size="xl" customConfig={avatarConfig} />
                    </div>

                    {/* Controls */}
                    <div className="w-full max-w-sm bg-black/40 p-4 rounded-3xl border border-white/10 space-y-4 backdrop-blur-md">
                        {/* Faces */}
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                            {AVATAR_OPTIONS.emojis.map(e => (
                                <button 
                                    key={e} 
                                    onClick={() => { playSound('pop'); setAvatarConfig(prev => ({...prev, emoji: e}))}}
                                    className={`flex-shrink-0 w-12 h-12 text-2xl rounded-xl ${avatarConfig.emoji === e ? 'bg-neon-blue border-2 border-white' : 'bg-white/10'}`}
                                >{e}</button>
                            ))}
                        </div>
                        {/* Outfits */}
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                            {AVATAR_OPTIONS.outfits.map(o => (
                                <button 
                                    key={o} 
                                    onClick={() => { playSound('pop'); setAvatarConfig(prev => ({...prev, outfit: o}))}}
                                    className={`flex-shrink-0 w-12 h-12 text-2xl rounded-xl ${avatarConfig.outfit === o ? 'bg-neon-pink border-2 border-white' : 'bg-white/10'}`}
                                >{o}</button>
                            ))}
                        </div>
                         {/* Accessories */}
                         <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                            {AVATAR_OPTIONS.accessories.map(a => (
                                <button 
                                    key={a} 
                                    onClick={() => { playSound('pop'); setAvatarConfig(prev => ({...prev, accessory: a}))}}
                                    className={`flex-shrink-0 w-12 h-12 text-2xl rounded-xl ${avatarConfig.accessory === a ? 'bg-neon-green border-2 border-white' : 'bg-white/10'}`}
                                >{a}</button>
                            ))}
                        </div>
                    </div>

                    <button onClick={handleNext} className="mt-8 px-8 py-3 bg-white text-black font-game text-xl rounded-full btn-3d">
                        LOOKING FIRE 🔥
                    </button>
                </div>

                {/* Slide 4: Vibe Check */}
                <div className="swiper-slide flex flex-col items-center justify-center p-6">
                    <h2 className="font-game text-3xl mb-6 text-center">Choose Your Vibe</h2>
                    
                    <div className="w-full max-w-xs space-y-4">
                        {[
                            { id: 'hustler', title: '👟 Sneaker Flipper', desc: 'Buy low, sell high. The grind never stops.', color: 'border-neon-blue text-neon-blue' },
                            { id: 'chaos', title: '🎰 Meme Trader', desc: 'High risk, high reward. To the moon!', color: 'border-neon-pink text-neon-pink' },
                            { id: 'nerd', title: '🤓 Compound King', desc: 'Slow and steady wins the race. Warren Buffet style.', color: 'border-neon-green text-neon-green' }
                        ].map((path) => (
                            <button 
                                key={path.id}
                                onClick={() => { playSound('pop'); setSelectedPath(path.id); setTimeout(handleNext, 300); }}
                                className={`w-full p-4 rounded-2xl border-2 bg-black/40 text-left transition-all hover:scale-105 active:scale-95 ${selectedPath === path.id ? 'bg-white/10 ' + path.color : 'border-white/10 text-gray-400'}`}
                            >
                                <h3 className={`font-game text-xl ${path.color.split(' ')[1]}`}>{path.title}</h3>
                                <p className="text-sm font-medium">{path.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Slide 5: Sign Up */}
                <div className="swiper-slide flex flex-col items-center justify-center p-6">
                     <div className="w-24 h-24 bg-neon-yellow rounded-full flex items-center justify-center text-4xl mb-6 animate-bounce border-4 border-black">
                        🎁
                     </div>
                     <h2 className="font-game text-4xl mb-2 text-center">ALMOST THERE!</h2>
                     <p className="text-gray-300 text-center mb-8 px-4">Save your progress to claim <span className="text-neon-green font-bold">1,000 XP</span> + Starter Pack.</p>

                     <div className="w-full max-w-xs space-y-3">
                        {/* Google */}
                        <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleAuthAction('google'); }}
                            disabled={isSigningUp}
                            className="w-full py-3 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 btn-3d cursor-pointer z-50 relative disabled:opacity-50"
                        >
                            {isSigningUp ? 'Syncing...' : (
                                <>
                                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" />
                                    Continue with Google
                                </>
                            )}
                        </button>

                        {/* Apple (Now Added) */}
                        <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleAuthAction('apple'); }}
                            disabled={isSigningUp}
                            className="w-full py-3 bg-black text-white border border-white/20 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-900 btn-3d cursor-pointer z-50 relative disabled:opacity-50"
                        >
                             <img src="https://www.svgrepo.com/show/511330/apple-173.svg" className="w-5 h-5 invert" />
                            Sign in with Apple
                        </button>

                        <div className="relative py-2">
                             <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                             <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#1a0b2e] px-2 text-gray-500">or</span></div>
                        </div>
                        
                        {/* Guest */}
                        <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleAuthAction('guest'); }}
                            disabled={isSigningUp}
                            className="w-full py-3 bg-transparent border-2 border-white/20 text-white/50 font-bold rounded-xl hover:bg-white/5 cursor-pointer z-50 relative disabled:opacity-50"
                        >
                            {isSigningUp ? 'Starting...' : 'Play as Guest (No Save)'}
                        </button>
                     </div>
                </div>
            </div>
            <div className="swiper-pagination !right-4 !left-auto !top-1/2 !-translate-y-1/2 flex flex-col gap-2"></div>
        </div>
    );
};