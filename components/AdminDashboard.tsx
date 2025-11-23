
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useMemo } from 'react';
import { 
    WrenchScrewdriverIcon, 
    ArrowLeftOnRectangleIcon,
    UsersIcon,
    ChartBarIcon,
    CurrencyDollarIcon,
    MegaphoneIcon,
    ShoppingBagIcon,
    FireIcon,
    GlobeAltIcon,
    BoltIcon,
    MagnifyingGlassIcon,
    PencilSquareIcon,
    ExclamationTriangleIcon,
    TrashIcon,
    PlusIcon,
    CloudArrowUpIcon,
    CloudArrowDownIcon,
    XMarkIcon,
    CommandLineIcon,
    UserIcon,
    PlayCircleIcon
} from '@heroicons/react/24/solid';
import { 
    WORLDS_METADATA, 
    ShopItem, 
    UserState,
    SHOP_ITEMS,
    Lesson,
    Stock,
    SystemConfig
} from '../services/gamification';
import { 
    subscribeToAllUsers,
    adminUpdateUser,
    adminMassUpdate,
    subscribeToCollection,
    saveDoc,
    deleteDocument,
    batchWrite,
    subscribeToSystemConfig,
    updateSystemConfig
} from '../services/db';
import { db } from '../services/firebase';
import { collection, getDocs, writeBatch, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { playSound } from '../services/audio';
import { sendMockNotification, NOTIFICATION_TYPES } from '../services/notifications';
import { useUserStore } from '../services/useUserStore';
import { ASSET_LIST, getMarketData } from '../services/stockMarket';
import { generateLevelContent } from '../services/contentGenerator';
import { logger, LogEntry } from '../services/logger';

// --- TYPES & INTERFACES ---

interface AdminProps {
    onExit: () => void;
}

type ViewType = 'dashboard' | 'users' | 'analytics' | 'cms' | 'shop' | 'monetization' | 'push' | 'god' | 'zoo' | 'logs';

// --- REAL-TIME DATA HOOK ---
const useAdminData = () => {
    const [users, setUsers] = useState<UserState[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = subscribeToAllUsers((realUsers) => {
            setUsers(realUsers);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    return { users, loading };
};

// --- SUB-COMPONENTS ---

// 1. DASHBOARD HOME (Stats)
const DashboardHome = ({ users }: { users: UserState[] }) => {
    const stats = useMemo(() => {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const dau = users.filter(u => new Date(u.lastLoginAt || 0) > yesterday).length;
        const revenue = users.reduce((acc, u) => acc + (u.lifetimeSpend || 0), 0); 
        const paying = users.filter(u => (u.lifetimeSpend || 0) > 0).length;
        const conversion = users.length > 0 ? ((paying / users.length) * 100).toFixed(1) : "0.0";
        const retained = users.filter(u => {
            const created = new Date(u.createdAt || 0);
            const lastLogin = new Date(u.lastLoginAt || 0);
            const ageHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
            return ageHours > 24 && lastLogin > yesterday;
        }).length;
        const cohort = users.filter(u => {
            const created = new Date(u.createdAt || 0);
            const ageHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
            return ageHours > 24 && ageHours < 48;
        }).length;
        const retentionRate = cohort > 0 ? Math.round((retained / cohort) * 100) : 100; 

        return { dau, revenue, conversion, retentionRate };
    }, [users]);

    return (
        <div className="p-8 space-y-8 animate-pop-in">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-game text-white">Command Center</h2>
                <div className="flex items-center gap-2 text-neon-green animate-pulse">
                    <div className="w-2 h-2 bg-neon-green rounded-full"></div>
                    <span className="text-xs font-mono">LIVE DATA STREAM</span>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Daily Active Users', val: stats.dau.toLocaleString(), color: 'bg-blue-600', icon: UsersIcon, sub: 'Active < 24h' },
                    { label: 'Total Users', val: users.length.toLocaleString(), color: 'bg-green-600', icon: UsersIcon, sub: 'All Time' },
                    { label: 'Guest Users', val: users.filter(u=>u.loginType==='guest').length.toLocaleString(), color: 'bg-purple-600', icon: BoltIcon, sub: 'Not Registered' },
                    { label: 'Retention (D1)', val: `${stats.retentionRate}%`, color: 'bg-orange-600', icon: FireIcon, sub: 'Returning Users' },
                ].map((s, i) => (
                    <div key={i} className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 p-3 rounded-bl-2xl ${s.color} opacity-20 group-hover:opacity-40 transition-opacity`}>
                            <s.icon className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{s.label}</div>
                        <div className="text-3xl font-black text-white mb-1">{s.val}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{s.sub}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 2. USER MANAGEMENT
const UserManagement = ({ users }: { users: UserState[] }) => {
    const [filterType, setFilterType] = useState<'all' | 'registered' | 'guest'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const totalUsers = users.length;
    const registeredCount = users.filter(u => u.loginType !== 'guest').length;
    const guestCount = users.filter(u => u.loginType === 'guest').length;

    const filteredUsers = users.filter(u => {
        const matchesSearch = 
            u.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.uid?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesFilter = 
            filterType === 'all' ? true :
            filterType === 'registered' ? u.loginType !== 'guest' :
            u.loginType === 'guest';

        return matchesSearch && matchesFilter;
    });

    const handleAction = async (uid: string, action: string) => {
        if (!uid) return;

        if (action === 'delete') {
            if(confirm(`PERMANENTLY DELETE USER ${uid}? This cannot be undone.`)) {
                try {
                    await deleteDoc(doc(db, 'users', uid));
                    playSound('error');
                } catch (e: any) {
                    alert("Delete failed: " + e.message);
                }
            }
            return;
        }

        if (action === 'ban') {
            if(confirm('Ban this user?')) await adminUpdateUser(uid, { role: 'user', loginType: 'guest', coins: 0 }); 
        }
        if (action === 'gift') {
            await adminUpdateUser(uid, { coins: (users.find(u=>u.uid===uid)?.coins || 0) + 1000 });
            playSound('coin');
        }
    };

    return (
        <div className="p-8 h-full flex flex-col animate-pop-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-game text-white">User Database</h2>
                <div className="flex gap-4 items-center">
                     <div className="bg-slate-800 px-4 py-2 rounded-xl flex gap-4 text-xs font-bold">
                        <div className="text-slate-400">Total: <span className="text-white">{totalUsers}</span></div>
                        <div className="text-blue-400">Reg: <span className="text-white">{registeredCount}</span></div>
                        <div className="text-yellow-400">Guest: <span className="text-white">{guestCount}</span></div>
                     </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="Search by name, email or ID..." 
                        className="bg-slate-800 border border-slate-600 p-3 pl-10 rounded-xl w-full text-white outline-none focus:border-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-600">
                    {[
                        { id: 'all', label: 'All Users' },
                        { id: 'registered', label: 'Registered' },
                        { id: 'guest', label: 'Guests' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilterType(tab.id as any)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${filterType === tab.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden flex flex-col">
                <div className="grid grid-cols-6 bg-slate-900 p-4 font-bold text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
                    <div className="col-span-2">User / ID</div>
                    <div>Status</div>
                    <div>Wealth</div>
                    <div>Last Active</div>
                    <div className="text-right">Actions</div>
                </div>
                <div className="overflow-y-auto flex-1 p-2">
                    {filteredUsers.map(user => (
                        <div key={user.uid} className="grid grid-cols-6 p-4 items-center hover:bg-slate-700/50 rounded-xl transition-colors border-b border-slate-700/50 last:border-0">
                            <div className="col-span-2 flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center text-xl relative">
                                    {user.avatar?.emoji || '👤'}
                                    {user.loginType === 'guest' && (
                                        <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-[8px] text-black font-bold px-1 rounded">GUEST</div>
                                    )}
                                </div>
                                <div className="overflow-hidden">
                                    <div className="font-bold text-white truncate">{user.nickname}</div>
                                    <div className="text-xs text-slate-400 truncate">{user.email || 'No Email'}</div>
                                    <div className="text-[9px] font-mono text-slate-600 truncate">{user.uid}</div>
                                </div>
                            </div>
                            <div>
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${user.ageConfirmed ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}`}>
                                    {user.ageConfirmed ? '13+' : 'Unverified'}
                                </span>
                                {user.isAdmin && <span className="ml-2 bg-red-500/20 text-red-400 text-[10px] px-2 py-1 rounded-full">ADMIN</span>}
                            </div>
                            <div className="text-sm font-mono">
                                <div className="text-yellow-400 font-bold">{user.coins?.toLocaleString()} 🪙</div>
                                <div className="text-xs text-slate-500">Lvl {user.level}</div>
                            </div>
                            <div className="text-sm text-slate-400">
                                {new Date(user.lastLoginAt || 0).toLocaleTimeString()}
                                <div className="text-[10px]">{new Date(user.lastLoginAt || 0).toLocaleDateString()}</div>
                            </div>
                            <div className="text-right flex justify-end gap-2">
                                <button onClick={() => handleAction(user.uid!, 'gift')} className="p-2 bg-green-500/10 text-green-400 rounded hover:bg-green-500/20" title="+1000 Coins"><CurrencyDollarIcon className="w-4 h-4" /></button>
                                <button onClick={() => handleAction(user.uid!, 'delete')} className="p-2 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20" title="Delete User"><TrashIcon className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// 3. CONTENT CMS
const ContentCMS = () => {
    const [selectedWorld, setSelectedWorld] = useState<string | null>(null);
    const [isRegenerating, setIsRegenerating] = useState(false);

    const handleRegenerate = async (worldId: string) => {
        if (!confirm(`Regenerate ALL content for ${worldId}? This simulates AI generation.`)) return;
        setIsRegenerating(true);
        
        try {
            // Simulate batch generation
            await new Promise(r => setTimeout(r, 1500));
            // Using the generator to ensure it works, even if we don't save it
            for (let i = 1; i <= 2; i++) {
                const res = generateLevelContent(worldId, i);
                console.log("Generated:", res.level.title);
            }
            alert(`Content regenerated for ${worldId}`);
        } catch (e) {
            console.error(e);
        }
        setIsRegenerating(false);
    };

    return (
        <div className="p-8 animate-pop-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-game text-white">Content CMS</h2>
                    <p className="text-slate-400 text-sm">Manage Worlds, Levels, and Bosses.</p>
                </div>
            </div>

            {selectedWorld ? (
                <div className="animate-slide-up">
                    <button onClick={() => setSelectedWorld(null)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6">
                        <ArrowLeftOnRectangleIcon className="w-4 h-4" /> Back to Worlds
                    </button>
                    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-white">{selectedWorld}</h3>
                            <button 
                                onClick={() => handleRegenerate(selectedWorld)}
                                disabled={isRegenerating}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2"
                            >
                                <CloudArrowUpIcon className="w-4 h-4" />
                                {isRegenerating ? 'Generating...' : 'Regenerate Levels'}
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                                    <div>
                                        <div className="text-neon-green font-bold text-xs uppercase">Level {i + 1}</div>
                                        <div className="text-white font-bold">Content Block</div>
                                    </div>
                                    <button className="p-2 hover:bg-white/10 rounded-lg text-slate-400">
                                        <PencilSquareIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {WORLDS_METADATA.map(world => {
                        const Icon = world.icon;
                        return (
                            <div 
                                key={world.id}
                                onClick={() => setSelectedWorld(world.title)}
                                className={`cursor-pointer bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-white/20 rounded-2xl p-6 flex flex-col items-center text-center transition-all group`}
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white mb-4 ${world.color} shadow-lg group-hover:scale-110 transition-transform`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div className="font-bold text-white text-lg leading-none mb-2">{world.title}</div>
                                <div className="text-xs text-slate-500">8 Levels • 24 Lessons</div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// 4. SHOP & ECONOMY
const ShopEconomy = () => {
    const [items, setItems] = useState<ShopItem[]>(SHOP_ITEMS);
    
    // Simulate fetching dynamic pricing
    useEffect(() => {
        const unsub = subscribeToCollection('shop_items', (cloudItems) => {
            if (cloudItems.length > 0) {
                const merged = SHOP_ITEMS.map(local => {
                    const cloud = cloudItems.find(c => c.id === local.id);
                    return cloud ? { ...local, ...cloud } : local;
                });
                setItems(merged);
            }
        });
        return () => unsub();
    }, []);

    const handlePriceChange = async (id: string, newPrice: number) => {
        const item = items.find(i => i.id === id);
        if (item) {
            // Optimistic update
            setItems(prev => prev.map(i => i.id === id ? { ...i, cost: newPrice } : i));
            await saveDoc('shop_items', id, { cost: newPrice });
        }
    };

    return (
        <div className="p-8 animate-pop-in">
            <h2 className="text-3xl font-game text-white mb-2">Shop Economy</h2>
            <p className="text-slate-400 text-sm mb-8">Adjust item prices and availability dynamically.</p>
            
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-900 text-slate-400 text-xs uppercase">
                            <th className="p-4">Item</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Cost (Coins)</th>
                            <th className="p-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {items.map(item => (
                            <tr key={item.id} className="hover:bg-slate-700/50">
                                <td className="p-4 flex items-center gap-3">
                                    <span className="text-2xl">{item.emoji}</span>
                                    <span className="text-white font-bold text-sm">{item.name}</span>
                                </td>
                                <td className="p-4">
                                    <span className="bg-slate-900 text-slate-300 px-2 py-1 rounded text-xs font-bold uppercase">{item.category}</span>
                                </td>
                                <td className="p-4">
                                    <input 
                                        type="number" 
                                        className="bg-black/30 border border-slate-600 rounded px-2 py-1 text-white w-24 text-right font-mono focus:border-blue-500 outline-none"
                                        value={item.cost}
                                        onChange={(e) => handlePriceChange(item.id, parseInt(e.target.value))}
                                    />
                                </td>
                                <td className="p-4">
                                    <span className="text-green-400 text-xs font-bold">ACTIVE</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// 5. NOTIFICATIONS
const PushNotificationManager = () => {
    const handleSend = (type: string) => {
        if (confirm(`Broadcast ${type} to all users?`)) {
            sendMockNotification(type as any);
            alert("Sent!");
        }
    };

    return (
        <div className="p-8 animate-pop-in">
            <h2 className="text-3xl font-game text-white mb-2">Push Notifications</h2>
            <p className="text-slate-400 text-sm mb-8">Send alerts to users (Web Push).</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(NOTIFICATION_TYPES).map(([key, config]) => (
                    <div key={key} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-blue-500 transition-colors cursor-pointer group" onClick={() => handleSend(key)}>
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                🔔
                            </div>
                            <div>
                                <h3 className="font-bold text-white mb-1">{config.title}</h3>
                                <p className="text-slate-400 text-xs">{config.body}</p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-700 flex justify-end">
                            <button className="text-blue-400 text-xs font-bold uppercase group-hover:text-white">Send Test Broadcast &rarr;</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 6. ZOO ADMIN
const ZooAdmin = () => {
    const [market, setMarket] = useState(getMarketData());

    // Simple refresh to show live data
    useEffect(() => {
        const interval = setInterval(() => setMarket([...getMarketData()]), 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-8 animate-pop-in">
            <h2 className="text-3xl font-game text-white mb-2">Wall Street Zoo</h2>
            <p className="text-slate-400 text-sm mb-8">Monitor the simulated market feed.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {market.map(stock => (
                    <div key={stock.symbol} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="text-2xl">{stock.logo}</div>
                            <div>
                                <div className="font-bold text-white">{stock.symbol}</div>
                                <div className="text-xs text-slate-500">{stock.name}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-mono text-white">${stock.price.toFixed(2)}</div>
                            <div className={`text-xs font-bold ${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 7. GOD TOOLS (With Ads Toggle)
const GodTools = ({ users }: { users: UserState[] }) => {
    const [loading, setLoading] = useState(false);
    const [adsEnabled, setAdsEnabled] = useState(false);

    useEffect(() => {
        const unsub = subscribeToSystemConfig((config) => {
            setAdsEnabled(config.adsEnabled);
        });
        return () => unsub();
    }, []);

    const executeMassAction = async (action: 'give_coins' | 'reset' | 'reward_all') => {
        if (!confirm(`Are you sure? This affects ${users.length} REAL users.`)) return;
        setLoading(true);
        playSound('chest');
        try {
            await adminMassUpdate(action);
            alert("Mass Action Executed Successfully.");
        } catch (e) {
            alert("Error executing mass action.");
        }
        setLoading(false);
    };

    const toggleAds = async () => {
        setLoading(true);
        await updateSystemConfig({ adsEnabled: !adsEnabled });
        setLoading(false);
        playSound('click');
    };

    return (
        <div className="p-8 animate-pop-in">
            <h2 className="text-3xl font-game text-white mb-6">God Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* REWARDED ADS TOGGLE */}
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2"><PlayCircleIcon className="w-5 h-5 text-blue-400"/> Monetization</h3>
                    <div className="flex items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-700">
                        <div>
                            <div className="font-bold text-white">Rewarded Ads</div>
                            <div className="text-xs text-slate-400">Shop + Revive Ads</div>
                        </div>
                        <button 
                            onClick={toggleAds}
                            className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${adsEnabled ? 'bg-green-500 text-black' : 'bg-slate-700 text-slate-400'}`}
                        >
                            {adsEnabled ? 'ON (LIVE)' : 'OFF (HIDDEN)'}
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 p-1">
                        Controls global visibility of "Watch Ad" buttons. Default is OFF for soft launch.
                    </p>
                </div>

                {/* MASS ACTIONS */}
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2"><BoltIcon className="w-5 h-5 text-yellow-400"/> Mass Actions</h3>
                    <div className="space-y-3">
                        <button 
                            onClick={() => executeMassAction('give_coins')} 
                            disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <CurrencyDollarIcon className="w-5 h-5" /> Give 1,000 Coins to ALL
                        </button>
                        <button 
                            onClick={() => executeMassAction('reward_all')} 
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <ShoppingBagIcon className="w-5 h-5" /> Reset Daily Chests
                        </button>
                        <button 
                            onClick={() => executeMassAction('reset')} 
                            disabled={loading}
                            className="w-full bg-red-900 hover:bg-red-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 border border-red-500 disabled:opacity-50"
                        >
                            <ExclamationTriangleIcon className="w-5 h-5" /> GLOBAL RESET (DANGER)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 8. LOGS
const LogsViewer = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);

    useEffect(() => {
        setLogs(logger.getLogs());
    }, []);

    return (
        <div className="p-8 h-full overflow-hidden flex flex-col animate-pop-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-game text-white">System Logs</h2>
                <button onClick={() => { logger.clearLogs(); setLogs([]); }} className="text-red-400 text-xs font-bold uppercase hover:text-white">Clear Logs</button>
            </div>
            <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 p-4 overflow-y-auto font-mono text-xs">
                {logs.length === 0 && <div className="text-slate-600 text-center mt-20">No logs recorded.</div>}
                {logs.map((log, i) => (
                    <div key={i} className="mb-2 border-b border-slate-800 pb-2 last:border-0">
                        <div className="flex gap-2 mb-1">
                            <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                            <span className={`font-bold ${log.level === 'error' ? 'text-red-500' : log.level === 'warn' ? 'text-orange-400' : 'text-blue-400'}`}>
                                {log.level.toUpperCase()}
                            </span>
                            <span className="text-white">{log.message}</span>
                        </div>
                        {log.details && (
                            <pre className="bg-black/30 p-2 rounded text-slate-400 overflow-x-auto">
                                {log.details}
                            </pre>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- MAIN ADMIN COMPONENT ---

export const AdminDashboard: React.FC<AdminProps> = ({ onExit }) => {
    const [view, setView] = useState<ViewType>('dashboard');
    const { users, loading } = useAdminData();

    const SidebarItem = ({ id, label, icon: Icon }: { id: ViewType, label: string, icon: any }) => (
        <button 
            onClick={() => setView(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-bold mb-1
                ${view === id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}
            `}
        >
            <Icon className="w-5 h-5" />
            {label}
        </button>
    );

    if (loading) {
        return <div className="h-screen bg-slate-950 flex items-center justify-center text-white font-game text-2xl animate-pulse">CONNECTING TO MAINFRAME...</div>;
    }

    return (
        <div className="flex h-screen bg-slate-950 text-white font-sans overflow-hidden">
            {/* SIDEBAR */}
            <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col flex-shrink-0 relative z-10">
                <div className="p-6 flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-600 rounded flex items-center justify-center font-bold text-xs shadow-lg animate-pulse">GM</div>
                    <div>
                        <h1 className="font-bold text-lg tracking-wider leading-none">GOD MODE</h1>
                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                             <span className="w-2 h-2 bg-green-500 rounded-full"></span> LIVE
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2 py-2">
                    <div className="text-[10px] font-bold text-slate-600 uppercase px-4 mb-2 mt-2">Analytics</div>
                    <SidebarItem id="dashboard" label="Real-Time Stats" icon={ChartBarIcon} />
                    <SidebarItem id="logs" label="System Logs" icon={CommandLineIcon} />
                    
                    <div className="text-[10px] font-bold text-slate-600 uppercase px-4 mb-2 mt-6">Management</div>
                    <SidebarItem id="users" label="User DB" icon={UsersIcon} />
                    <SidebarItem id="cms" label="Content CMS" icon={WrenchScrewdriverIcon} />
                    <SidebarItem id="zoo" label="Wall Street Zoo" icon={GlobeAltIcon} />
                    
                    <div className="text-[10px] font-bold text-slate-600 uppercase px-4 mb-2 mt-6">Growth</div>
                    <SidebarItem id="shop" label="Shop & Economy" icon={ShoppingBagIcon} />
                    <SidebarItem id="push" label="Notifications" icon={MegaphoneIcon} />
                    
                    <div className="text-[10px] font-bold text-slate-600 uppercase px-4 mb-2 mt-6">System</div>
                    <SidebarItem id="god" label="God Tools" icon={BoltIcon} />
                </div>

                <div className="p-4 border-t border-slate-800">
                    <button onClick={onExit} className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-white text-sm font-bold py-2 rounded hover:bg-slate-900 transition-colors">
                        <ArrowLeftOnRectangleIcon className="w-4 h-4" /> Exit Admin
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 bg-slate-900 overflow-hidden relative flex flex-col">
                {view === 'dashboard' && <div className="h-full overflow-y-auto"><DashboardHome users={users} /></div>}
                {view === 'users' && <UserManagement users={users} />}
                {view === 'cms' && <div className="h-full overflow-y-auto"><ContentCMS /></div>}
                {view === 'shop' && <div className="h-full overflow-y-auto"><ShopEconomy /></div>}
                {view === 'push' && <div className="h-full overflow-y-auto"><PushNotificationManager /></div>}
                {view === 'zoo' && <div className="h-full overflow-y-auto"><ZooAdmin /></div>}
                {view === 'god' && <div className="h-full overflow-y-auto"><GodTools users={users} /></div>}
                {view === 'logs' && <LogsViewer />}
            </div>
        </div>
    );
};
