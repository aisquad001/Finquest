
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useMemo } from 'react';
import { Avatar } from './Avatar';
import { playSound } from '../services/audio';
import { UserState, SHOP_ITEMS, DEFAULT_AVATAR_ITEMS } from '../services/gamification';
import { ArrowPathIcon, LockClosedIcon } from '@heroicons/react/24/solid';

interface ProfileSetupProps {
    user: UserState;
    onSave: (data: Partial<UserState>) => void;
    isNewUser: boolean;
}

// Item interface for the grid
interface SelectionItem {
    id: string;
    value: string;
    type: 'emoji' | 'outfit' | 'accessory' | 'bg';
    isLocked: boolean;
    cost?: number;
    name?: string;
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ user, onSave, isNewUser }) => {
    const [nickname, setNickname] = useState(user.nickname || '');
    const [avatarConfig, setAvatarConfig] = useState(user.avatar || { emoji: '😎', outfit: '👕', accessory: '🧢', bg: 'bg-neon-blue' });
    const [activeTab, setActiveTab] = useState<'emoji' | 'outfit' | 'accessory' | 'bg'>('emoji');

    // --- MERGE INVENTORY LOGIC ---
    const getAvailableItems = (type: 'emoji' | 'outfit' | 'accessory' | 'bg'): SelectionItem[] => {
        const defaults = type === 'emoji' ? DEFAULT_AVATAR_ITEMS.emojis :
                         type === 'outfit' ? DEFAULT_AVATAR_ITEMS.outfits :
                         type === 'bg' ? DEFAULT_AVATAR_ITEMS.backgrounds :
                         []; // Accessories have no defaults in base config, usually

        // Map Defaults
        const baseItems: SelectionItem[] = defaults.map(val => ({
            id: `default_${val}`,
            value: val,
            type,
            isLocked: false
        }));

        // Map Shop Items
        const shopItems: SelectionItem[] = SHOP_ITEMS
            .filter(item => item.avatarPart === type)
            .map(item => ({
                id: item.id,
                value: item.avatarValue || '?',
                type,
                isLocked: !user.inventory.includes(item.id),
                cost: item.cost,
                name: item.name
            }));

        return [...baseItems, ...shopItems];
    };

    // Memoize lists to avoid recalculating on every render
    const emojiList = useMemo(() => getAvailableItems('emoji'), [user.inventory]);
    const outfitList = useMemo(() => getAvailableItems('outfit'), [user.inventory]);
    const accessoryList = useMemo(() => getAvailableItems('accessory'), [user.inventory]);
    const bgList = useMemo(() => getAvailableItems('bg'), [user.inventory]);

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
        // Only randomize using unlocked items
        const pick = (list: SelectionItem[]) => {
            const unlocked = list.filter(i => !i.isLocked);
            return unlocked[Math.floor(Math.random() * unlocked.length)].value;
        };

        setAvatarConfig({
            emoji: pick(emojiList),
            outfit: pick(outfitList),
            accessory: Math.random() > 0.5 ? pick(accessoryList) : '', // 50% chance of accessory
            bg: pick(bgList)
        });
    };

    const handleSelect = (item: SelectionItem) => {
        if (item.isLocked) {
            playSound('error');
            alert(`🔒 LOCKED! Buy "${item.name}" in the Item Shop for ${item.cost} coins.`);
            return;
        }
        playSound('pop');
        setAvatarConfig(prev => ({ ...prev, [item.type]: item.value }));
    };

    return (
        <div className="fixed inset-0 z-[200] bg-[#1a0b2e] flex flex-col items-center justify-center p-6 animate-pop-in overflow-y-auto">
            <div className="w-full max-w-md space-y-6">
                
                <div className="text-center">
                    <h1 className="font-game text-4xl text-white text-stroke-black mb-2 drop-shadow-neon">
                        {isNewUser ? "WHO ARE YOU?" : "EDIT PROFILE"}
                    </h1>
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Customize your legend</p>
                </div>

                {/* Avatar Preview Area */}
                <div className="relative flex justify-center mb-6 group">
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
                    <div className="flex justify-between gap-1 mb-4 overflow-x-auto no-scrollbar">
                        {[
                            { id: 'emoji', label: 'Face' },
                            { id: 'outfit', label: 'Fit' },
                            { id: 'accessory', label: 'Bling' },
                            { id: 'bg', label: 'Aura' }
                        ].map(tab => (
                            <button 
                                key={tab.id}
                                onClick={() => { playSound('click'); setActiveTab(tab.id as any); }}
                                className={`px-4 py-2 rounded-xl font-bold text-xs uppercase whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-white text-black shadow-lg' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-5 gap-2 h-48 overflow-y-auto pr-1 content-start">
                        {(activeTab === 'emoji' ? emojiList : 
                          activeTab === 'outfit' ? outfitList : 
                          activeTab === 'accessory' ? accessoryList : 
                          bgList).map((item) => (
                            <button 
                                key={item.id} 
                                onClick={() => handleSelect(item)} 
                                className={`
                                    aspect-square relative flex items-center justify-center rounded-xl transition-all
                                    ${item.isLocked ? 'bg-black/20 border-2 border-slate-700 opacity-60 grayscale cursor-not-allowed' : 'hover:bg-white/20 cursor-pointer'}
                                    ${avatarConfig[item.type] === item.value ? 'bg-white/20 border-2 border-neon-green shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'bg-white/5'}
                                    ${item.type === 'bg' && !item.isLocked ? item.value + ' border-2 border-white/20' : ''}
                                `}
                            >
                                {item.isLocked && (
                                    <div className="absolute top-0 right-0 bg-red-600 text-white p-0.5 rounded-bl-lg z-10">
                                        <LockClosedIcon className="w-3 h-3" />
                                    </div>
                                )}
                                
                                {item.type !== 'bg' && <span className="text-2xl">{item.value}</span>}
                                
                                {item.isLocked && (
                                    <div className="absolute bottom-0 w-full text-[8px] text-center bg-black/80 text-yellow-400 font-mono">
                                        {item.cost ? item.cost/1000 + 'k' : '$$$'}
                                    </div>
                                )}
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
