/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { XMarkIcon, CheckIcon, StarIcon } from '@heroicons/react/24/solid';
import { playSound } from '../services/audio';
import { simulatePurchase, PRO_PLAN, COIN_PACKS } from '../services/billing';

interface PremiumModalProps {
    onClose: () => void;
    onUpgrade: () => void;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({ onClose, onUpgrade }) => {
    const [view, setView] = useState<'pro' | 'coins'>('pro');
    const [isLoading, setIsLoading] = useState(false);

    const handlePurchase = async (id: string) => {
        setIsLoading(true);
        playSound('click');
        const success = await simulatePurchase(id);
        setIsLoading(false);
        
        if (success) {
            onUpgrade();
            (window as any).confetti({ particleCount: 200, spread: 100, colors: ['#FFD700', '#FFFFFF'] });
            setTimeout(onClose, 2000);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-[#1a0b2e] rounded-3xl border-2 border-yellow-500/50 overflow-hidden shadow-2xl relative animate-pop-in">
                
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white z-10">
                    <XMarkIcon className="w-8 h-8" />
                </button>

                {/* Tabs */}
                <div className="flex border-b border-white/10">
                    <button 
                        onClick={() => setView('pro')}
                        className={`flex-1 py-4 font-game text-lg uppercase tracking-wider transition-colors ${view === 'pro' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-black/40 text-gray-500'}`}
                    >
                        Racked Pro
                    </button>
                    <button 
                        onClick={() => setView('coins')}
                        className={`flex-1 py-4 font-game text-lg uppercase tracking-wider transition-colors ${view === 'coins' ? 'bg-blue-500/20 text-blue-400' : 'bg-black/40 text-gray-500'}`}
                    >
                        Get Coins
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 relative">
                    {/* Background FX */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

                    {view === 'pro' && (
                        <div className="text-center">
                            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full flex items-center justify-center text-5xl shadow-[0_0_30px_rgba(234,179,8,0.4)] mb-6 animate-pulse-fast">
                                👑
                            </div>
                            <h2 className="font-game text-3xl text-white mb-2">UNLEASH YOUR POTENTIAL</h2>
                            <p className="text-gray-400 mb-8">Join the top 1% of money masters.</p>

                            <div className="space-y-3 mb-8 text-left">
                                {PRO_PLAN.features.map((feat, i) => (
                                    <div key={i} className="flex items-center gap-3 text-white font-bold">
                                        <CheckIcon className="w-6 h-6 text-green-400 flex-shrink-0" />
                                        {feat}
                                    </div>
                                ))}
                            </div>

                            <button 
                                onClick={() => handlePurchase('sub_pro_monthly')}
                                disabled={isLoading}
                                className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-game text-2xl rounded-xl hover:scale-105 transition-transform shadow-lg mb-3 disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {isLoading ? 'PROCESSING...' : `GO PRO - $${PRO_PLAN.monthly}/mo`}
                            </button>
                            <button 
                                onClick={() => handlePurchase('sub_pro_yearly')}
                                disabled={isLoading}
                                className="text-yellow-400 text-sm font-bold uppercase tracking-wider underline hover:text-white"
                            >
                                Or pay ${PRO_PLAN.yearly}/yr (Save 33%)
                            </button>
                        </div>
                    )}

                    {view === 'coins' && (
                        <div className="grid grid-cols-2 gap-4">
                            {COIN_PACKS.map((pack) => (
                                <button 
                                    key={pack.id}
                                    onClick={() => handlePurchase(pack.id)}
                                    disabled={isLoading}
                                    className="relative bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all active:scale-95 group"
                                >
                                    {pack.bonus && (
                                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full animate-bounce">
                                            {pack.bonus}
                                        </div>
                                    )}
                                    <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🪙</div>
                                    <div className="font-bold text-white text-lg mb-1">{pack.coins.toLocaleString()}</div>
                                    <div className="text-green-400 font-mono font-bold border border-green-500/30 rounded px-2 py-1 inline-block bg-green-500/10">
                                        ${pack.price}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};