
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { Avatar } from './Avatar';
import { playSound } from '../services/audio';
import { UserState } from '../services/gamification';
import { ArrowRightIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

interface ProfileSetupProps {
    user: UserState;
    onSave: (data: Partial<UserState>) => void;
    isNewUser: boolean;
}

const EMOJIS = ['😎', '🤠', '👽', '👻', '🤖', '😼', '🦁', '🦄', '💀', '💩', '🤓', '🐼', '🐯', '🦊'];
const OUTFITS = ['👕', '🧥', '👗', '🥋', '🦺', '👔', '👘', '🦸', '🕴️', '👚'];
const BACKGROUNDS = ['bg-neon-blue', 'bg-neon-green', 'bg-neon-pink', 'bg-neon-purple', 'bg-yellow-400', 'bg-orange-500', 'bg-red-500', 'bg-indigo-500'];

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ user, onSave, isNewUser }) => {
    const [nickname, setNickname] = useState(user.nickname || '');
    const [avatarConfig, setAvatarConfig] = useState(user.avatar || { emoji: '😎', outfit: '👕', accessory: '🧢', bg: 'bg-neon-blue' });
    const [activeTab, setActiveTab] = useState<'emoji' | 'outfit' | 'bg'>('emoji');

    const handleSave = () => {
        if (!nickname.trim()) {
            playSound('error');
            alert("Please enter a nickname!");
            return;
        }
        playSound('levelup');
        onSave({
            nickname: nickname.trim(),
            avatar: avatarConfig,
            isProfileComplete: true
        });
    };

    const randomize = () => {
        playSound('pop');
        setAvatarConfig({
            emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
            outfit: OUTFITS[Math.floor(Math.random() * OUTFITS.length)],
            accessory: '🧢',
            bg: BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)]
        });
    };

    return (
        <div className="fixed inset-0 z-[200] bg-[#1a0b2e] flex flex-col items-center justify-center p-6 animate-pop-in overflow-y-auto">
            <div className="w-full max-w-md space-y-8">
                
                <div className="text-center">
                    <h1 className="font-game text-4xl text-white text-stroke-black mb-2 drop-shadow-neon">
                        {isNewUser ? "WHO ARE YOU?" : "EDIT PROFILE"}
                    </h1>
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Customize your legend</p>
                </div>

                {/* Avatar Preview Area */}
                <div className="relative flex justify-center mb-8 group">
                    <div className="relative transition-transform duration-300 hover:scale-110">
                         <Avatar level={user.level} size="xl" customConfig={avatarConfig} />
                         <button 
                            onClick={randomize}
                            className="absolute bottom-0 right-0 bg-white text-black p-2 rounded-full shadow-lg border-2 border-black hover:bg-gray-200 active:scale-95 transition-all"
                            title="Randomize"
                         >
                             <ArrowPathIcon className="w-6 h-6" />
                         </button>
                    </div>
                </div>

                {/* Nickname Input */}
                <div className="bg-white/5 p-1 rounded-2xl border border-white/10 focus-within:border-neon-green transition-colors">
                    <input 
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value.slice(0, 15))}
                        placeholder="Enter Nickname..."
                        className="w-full bg-transparent text-center text-2xl font-game text-white p-4 outline-none placeholder:text-white/20"
                    />
                </div>

                {/* Builder Controls */}
                <div className="bg-black/40 rounded-3xl p-4 border border-white/10">
                    <div className="flex justify-center gap-2 mb-4">
                        {[
                            { id: 'emoji', label: 'Face' },
                            { id: 'outfit', label: 'Fit' },
                            { id: 'bg', label: 'Aura' }
                        ].map(tab => (
                            <button 
                                key={tab.id}
                                onClick={() => { playSound('click'); setActiveTab(tab.id as any); }}
                                className={`flex-1 py-2 rounded-xl font-bold text-sm uppercase transition-all ${activeTab === tab.id ? 'bg-white text-black shadow-lg' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-5 gap-3 h-48 overflow-y-auto pr-1 content-start">
                        {activeTab === 'emoji' && EMOJIS.map(e => (
                            <button key={e} onClick={() => { playSound('pop'); setAvatarConfig({...avatarConfig, emoji: e}) }} className={`aspect-square flex items-center justify-center text-2xl rounded-xl hover:bg-white/20 ${avatarConfig.emoji === e ? 'bg-white/20 border-2 border-white' : 'bg-white/5'}`}>{e}</button>
                        ))}
                        {activeTab === 'outfit' && OUTFITS.map(o => (
                            <button key={o} onClick={() => { playSound('pop'); setAvatarConfig({...avatarConfig, outfit: o}) }} className={`aspect-square flex items-center justify-center text-2xl rounded-xl hover:bg-white/20 ${avatarConfig.outfit === o ? 'bg-white/20 border-2 border-white' : 'bg-white/5'}`}>{o}</button>
                        ))}
                        {activeTab === 'bg' && BACKGROUNDS.map(bg => (
                            <button key={bg} onClick={() => { playSound('pop'); setAvatarConfig({...avatarConfig, bg: bg}) }} className={`aspect-square rounded-xl hover:scale-105 transition-transform border-2 ${bg} ${avatarConfig.bg === bg ? 'border-white scale-105 shadow-lg' : 'border-transparent opacity-70'}`}></button>
                        ))}
                    </div>
                </div>

                {/* Save Button */}
                <button 
                    onClick={handleSave}
                    className="w-full py-4 bg-neon-green text-black font-game text-2xl rounded-2xl border-b-[6px] border-green-800 active:border-b-0 active:translate-y-1.5 transition-all shadow-[0_0_30px_rgba(74,222,128,0.4)] hover:brightness-110 flex items-center justify-center gap-2"
                >
                    {isNewUser ? "LET'S GO! 🚀" : "SAVE PROFILE 💾"}
                </button>

            </div>
        </div>
    );
};
