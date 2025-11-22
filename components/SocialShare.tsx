
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { XMarkIcon, ShareIcon } from '@heroicons/react/24/solid';

interface SocialShareProps {
    type: 'streak' | 'networth' | 'levelup';
    data: {
        value: string | number;
        subtitle: string;
        avatar: any;
        nickname: string;
    };
    onClose: () => void;
}

export const SocialShare: React.FC<SocialShareProps> = ({ type, data, onClose }) => {
    
    const config = {
        streak: {
            bg: 'bg-gradient-to-br from-orange-500 to-red-600',
            icon: '🔥',
            title: 'STREAK MASTER',
        },
        networth: {
            bg: 'bg-gradient-to-br from-green-400 to-emerald-700',
            icon: '📈',
            title: 'PORTFOLIO KING',
        },
        levelup: {
            bg: 'bg-gradient-to-br from-neon-purple to-indigo-900',
            icon: '🆙',
            title: 'LEVEL UP',
        }
    }[type];

    const handleShare = async () => {
        const shareData = {
            title: "Racked: The Money Game",
            text: `Check this out! ${data.nickname} is crushing it on Racked.`,
            url: "https://racked.gg/"
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log("Share cancelled");
            }
        } else {
            alert("Copied to clipboard! (Simulated Share)");
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
            <div className="relative w-full max-w-sm bg-[#1a0b2e] rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl transform transition-all scale-100 hover:scale-105">
                
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4 z-20 bg-black/40 rounded-full p-1 text-white">
                    <XMarkIcon className="w-6 h-6" />
                </button>

                {/* Card Content */}
                <div className={`p-8 ${config.bg} relative overflow-hidden text-center`}>
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    
                    <div className="relative z-10">
                        {/* Avatar Bubble */}
                        <div className="w-24 h-24 mx-auto bg-white rounded-full border-4 border-black shadow-lg flex items-center justify-center text-5xl mb-4">
                            {data.avatar.emoji}
                        </div>
                        
                        <h2 className="font-game text-4xl text-white text-stroke-black mb-1">{data.nickname}</h2>
                        <div className="inline-block bg-black/30 px-4 py-1 rounded-full text-white font-bold text-sm mb-8 uppercase tracking-widest">
                            {config.title}
                        </div>

                        <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm border border-white/20 shadow-xl">
                            <div className="text-6xl mb-2 animate-bounce">{config.icon}</div>
                            <div className="font-game text-5xl text-white drop-shadow-md mb-1">{data.value}</div>
                            <p className="text-white/80 font-bold text-lg uppercase">{data.subtitle}</p>
                        </div>
                    </div>
                </div>

                {/* Footer / CTA */}
                <div className="bg-[#1a0b2e] p-6 text-center">
                    <p className="text-gray-400 text-xs font-bold uppercase mb-4">Can you beat me?</p>
                    <button 
                        onClick={handleShare}
                        className="w-full py-4 bg-white text-black font-game text-2xl rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-200 btn-3d"
                    >
                        <ShareIcon className="w-6 h-6" />
                        SHARE FLEX
                    </button>
                </div>
            </div>
        </div>
    );
};
