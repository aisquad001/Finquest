/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useMemo } from 'react';
import { Avatar } from './Avatar';
import { playSound } from '../services/audio';
import { UserState, SHOP_ITEMS } from '../services/gamification';
import { ArrowRightIcon, ArrowPathIcon, LockClosedIcon } from '@heroicons/react/24/solid';

interface ProfileSetupProps {
    user: UserState;
    onSave: (data: Partial<UserState>) => void;
    isNewUser: boolean;
}

// Base (Free) Items
const BASE_EMOJIS = ['😎', '🤠', '👽', '👻', '🤖', '😼', '💀', '💩', '🤓', '🐼', '🐯', '🦊'];
const BASE_OUTFITS = ['👕', '🧥', '👗', '🥋', '🦺', '👔', '👚'];
const BASE_BACKGROUNDS = ['bg-neon-blue', 'bg-neon-green', 'bg-neon-pink', 'bg-neon-purple', 'bg-yellow-400', 'bg-orange-500', 'bg-red-500', 'bg-indigo-500'];
const BASE_ACCESSORIES = ['🧢', '', '🕶️', '🎩']; // Added base accessories

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ user, onSave, isNewUser }) => {
    const [nickname, setNickname] = useState(user.nickname || '');
    const [avatarConfig, setAvatarConfig] = useState(user.avatar || { emoji: '😎', outfit: '👕', accessory: '🧢', bg: 'bg-neon-blue' });
    const [activeTab, setActiveTab] = useState<'emoji' | 'outfit' | 'accessory' | 'bg'>('emoji');

    // Merge Free Items with Premium Shop Items
    const availableOptions = useMemo(() => {
        // Helper to check if an item is premium and locked
        const checkStatus = (val: string, type: 'emoji' | 'outfit' | 'bg' | 'accessory') => {
            // Find if this value exists in the shop for this specific cosmetic type
            const shopItem = SHOP_ITEMS.find(i => i.category === 'cosmetic' && i.cosmeticType === type && i.cosmeticValue === val);
            
            if (shopItem) {
                // It's a premium item. Check if user owns it.
                const isUnlocked = user.inventory.includes(shopItem.id);
                return { isPremium: true, isUnlocked, cost: shopItem.cost };
            }
            // Not in shop = Base item = Free/Unlocked
            return { isPremium: false, isUnlocked: true, cost: 0 };
        };

        // Get all unique values from both lists (Base + Shop)
        const allEmojis = Array.from(new Set([...BASE_EMOJIS, ...SHOP_ITEMS.filter(i => i.cosmeticType === 'emoji').map(i => i.cosmeticValue!)]));
        const allOutfits = Array.from(new Set([...BASE_OUTFITS, ...SHOP_ITEMS.filter(i => i.cosmeticType === 'outfit').map(i => i.cosmeticValue!)]));
        const allBgs = Array.from(new Set([...BASE_BACKGROUNDS, ...SHOP_ITEMS.filter(i => i.cosmeticType === 'bg').map(i => i.cosmeticValue!)]));
        const allAccessories = Array.from(new Set([...BASE_ACCESSORIES, ...SHOP_ITEMS.filter(i => i.cosmeticType === 'accessory').map(i => i.cosmeticValue!)]));

        return {
            emoji: allEmojis.map(e => ({ val: e, ...checkStatus(e, 'emoji') })),
            outfit: allOutfits.map(o => ({ val: o, ...checkStatus(o, 'outfit') })),
            accessory: allAccessories.map(a => ({ val: a, ...checkStatus(a, 'accessory') })),
            bg: allBgs.map(b => ({ val: b, ...checkStatus(b, 'bg') }))
        };
    }, [user.inventory]);

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
        // Only pick from UNLOCKED options
        const unlockedEmojis = availableOptions.emoji.filter(o => o.isUnlocked).map(o => o.val);
        const unlockedOutfits = availableOptions.outfit.filter(o => o.isUnlocked).map(o => o.val);
        const unlockedBgs = availableOptions.bg.filter(o => o.isUnlocked).map(o => o.val);
        const unlockedAccs = availableOptions.accessory.filter(o => o.isUnlocked).map(o => o.val);

        setAvatarConfig({
            emoji: unlockedEmojis[Math.floor(Math.random() * unlockedEmojis.length)],
            outfit: unlockedOutfits[Math.floor(Math.random() * unlockedOutfits.length)],
            accessory: unlockedAccs[Math.floor(Math.random() * unlockedAccs.length)],
            bg: unlockedBgs[Math.floor(Math.random() * unlockedBgs.length)]
        });
    };

    const handleSelect = (type: 'emoji' | 'outfit' | 'bg' | 'accessory', item: any) => {
        if (!item.isUnlocked) {
            playSound('error');
            alert(`Locked! Buy this in the Item Shop for ${item.cost.toLocaleString()} Coins.`);
            return;
        }
        playSound('pop');
        setAvatarConfig({ ...avatarConfig, [type]: item.val });
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
                    <div className="flex justify-center gap-2 mb-4 overflow-x-auto no-scrollbar">
                        {[
                            { id: 'emoji', label: 'Face' },
                            { id: 'outfit', label: 'Fit' },
                            { id: 'accessory', label: 'Bling' },
                            { id: 'bg', label: 'Aura' }
                        ].map(tab => (
                            <button 
                                key={tab.id}
                                onClick={() => { playSound('click'); setActiveTab(tab.id as any); }}
                                className={`px-4 py-2 rounded-xl font-bold text-sm uppercase transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-black shadow-lg' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-5 gap-3 h-48 overflow-y-auto pr-1 content-start">
                        {activeTab === 'emoji' && availableOptions.emoji.map((item, i) => (
                            <button 
                                key={i} 
                                onClick={() => handleSelect('emoji', item)} 
                                className={`aspect-square flex items-center justify-center text-2xl rounded-xl relative border-2 transition-all
                                    ${item.isUnlocked ? 'hover:bg-white/20 cursor-pointer border-transparent' : 'bg-black/50 cursor-not-allowed opacity-60 border-red-900/30'}
                                    ${avatarConfig.emoji === item.val ? 'bg-white/20 border-white' : 'bg-white/5'}
                                `}
                            >
                                {item.val}
                                {!item.isUnlocked && <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl backdrop-blur-[1px]"><LockClosedIcon className="w-4 h-4 text-yellow-500 mb-1"/><span className="text-[8px] font-bold text-white bg-black/50 px-1 rounded">${(item.cost/1000).toFixed(1)}k</span></div>}
                            </button>
                        ))}
                        {activeTab === 'outfit' && availableOptions.outfit.map((item, i) => (
                            <button 
                                key={i} 
                                onClick={() => handleSelect('outfit', item)} 
                                className={`aspect-square flex items-center justify-center text-2xl rounded-xl relative border-2 transition-all
                                    ${item.isUnlocked ? 'hover:bg-white/20 cursor-pointer border-transparent' : 'bg-black/50 cursor-not-allowed opacity-60 border-red-900/30'}
                                    ${avatarConfig.outfit === item.val ? 'bg-white/20 border-white' : 'bg-white/5'}
                                `}
                            >
                                {item.val}
                                {!item.isUnlocked && <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl backdrop-blur-[1px]"><LockClosedIcon className="w-4 h-4 text-yellow-500 mb-1"/><span className="text-[8px] font-bold text-white bg-black/50 px-1 rounded">${(item.cost/1000).toFixed(1)}k</span></div>}
                            </button>
                        ))}
                        {activeTab === 'accessory' && availableOptions.accessory.map((item, i) => (
                            <button 
                                key={i} 
                                onClick={() => handleSelect('accessory', item)} 
                                className={`aspect-square flex items-center justify-center text-2xl rounded-xl relative border-2 transition-all
                                    ${item.isUnlocked ? 'hover:bg-white/20 cursor-pointer border-transparent' : 'bg-black/50 cursor-not-allowed opacity-60 border-red-900/30'}
                                    ${avatarConfig.accessory === item.val ? 'bg-white/20 border-white' : 'bg-white/5'}
                                `}
                            >
                                {item.val || <span className="text-xs text-white/30">None</span>}
                                {!item.isUnlocked && <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl backdrop-blur-[1px]"><LockClosedIcon className="w-4 h-4 text-yellow-500 mb-1"/><span className="text-[8px] font-bold text-white bg-black/50 px-1 rounded">${(item.cost/1000).toFixed(1)}k</span></div>}
                            </button>
                        ))}
                        {activeTab === 'bg' && availableOptions.bg.map((item, i) => (
                            <button 
                                key={i} 
                                onClick={() => handleSelect('bg', item)} 
                                className={`aspect-square rounded-xl border-2 relative transition-all
                                    ${item.val} 
                                    ${item.isUnlocked ? 'hover:scale-105 transition-transform cursor-pointer border-transparent' : 'cursor-not-allowed opacity-50 border-red-900/30'}
                                    ${avatarConfig.bg === item.val ? 'border-white scale-105 shadow-lg' : ''}
                                `}
                            >
                                {!item.isUnlocked && <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl backdrop-blur-[1px]"><LockClosedIcon className="w-4 h-4 text-yellow-500 mb-1"/><span className="text-[8px] font-bold text-white bg-black/50 px-1 rounded">${(item.cost/1000).toFixed(1)}k</span></div>}
                            </button>
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
