/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useRef } from 'react';
import { 
    WrenchScrewdriverIcon, 
    ArrowLeftOnRectangleIcon,
    CloudArrowUpIcon,
    PlusIcon,
    TrashIcon,
    PencilSquareIcon,
    PhotoIcon,
    ArrowLeftIcon,
    CheckCircleIcon,
    BoltIcon,
    ArrowUpTrayIcon,
    DocumentTextIcon,
    UsersIcon,
    ChartBarIcon,
    CurrencyDollarIcon,
    MegaphoneIcon,
    ShoppingBagIcon,
    FireIcon,
    GlobeAltIcon,
    ShieldCheckIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/solid';
import { 
    WORLDS_METADATA, 
    LevelData, 
    Lesson, 
    LessonType, 
    WorldData,
    SHOP_ITEMS
} from '../services/gamification';
import { 
    fetchLevelsForWorld, 
    fetchLessonsForLevel, 
    seedGameData,
    upsertLesson,
    deleteLesson,
    updateLevelConfig 
} from '../services/db';
import { playSound } from '../services/audio';
import { MOCK_USERS, banUser, giftCoins, getContentStats } from '../services/admin';
import { getAnalyticsSnapshot } from '../services/analytics';
import { sendMockNotification } from '../services/notifications';
import { useUserStore } from '../services/useUserStore';
import { devAddResources } from '../services/gameLogic';

// --- TYPES & INTERFACES ---

interface AdminProps {
    onExit: () => void;
}

type ViewType = 'dashboard' | 'users' | 'analytics' | 'cms' | 'shop' | 'monetization' | 'push' | 'god';

// --- SUB-COMPONENTS ---

// 1. DASHBOARD HOME
const DashboardHome = () => {
    const stats = getAnalyticsSnapshot();
    return (
        <div className="p-8 space-y-8 animate-pop-in">
            <h2 className="text-3xl font-game text-white mb-6">Command Center</h2>
            
            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Daily Active Users', val: stats.dau.toLocaleString(), color: 'bg-blue-600', icon: UsersIcon },
                    { label: 'Total Revenue', val: `$${stats.revenue.total.toLocaleString()}`, color: 'bg-green-600', icon: CurrencyDollarIcon },
                    { label: 'Conversion Rate', val: `${stats.conversionRate}%`, color: 'bg-purple-600', icon: BoltIcon },
                    { label: 'Retention (D1)', val: `${stats.retention[0]}%`, color: 'bg-orange-600', icon: FireIcon },
                ].map((s, i) => (
                    <div key={i} className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 p-3 rounded-bl-2xl ${s.color} opacity-20 group-hover:opacity-40 transition-opacity`}>
                            <s.icon className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{s.label}</div>
                        <div className="text-3xl font-black text-white">{s.val}</div>
                    </div>
                ))}
            </div>

            {/* Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                        <ChartBarIcon className="w-5 h-5 text-blue-400" /> Revenue Trend (7 Days)
                    </h3>
                    <div className="h-64 flex items-end justify-between gap-2 px-4 pb-4 border-b border-slate-600">
                         {[65, 59, 80, 81, 56, 55, 90].map((h, i) => (
                             <div key={i} className="w-full bg-blue-500/20 rounded-t hover:bg-blue-500 transition-colors relative group">
                                 <div style={{ height: `${h}%` }} className="absolute bottom-0 w-full bg-blue-500 rounded-t"></div>
                                 <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">${h}k</div>
                             </div>
                         ))}
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-2 px-2">
                        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>
                </div>

                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                        <GlobeAltIcon className="w-5 h-5 text-green-400" /> Live Map (Active Now)
                    </h3>
                    <div className="h-64 bg-slate-900 rounded-xl border border-slate-700 relative flex items-center justify-center overflow-hidden">
                         <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/world-map.png')] bg-cover"></div>
                         {[...Array(5)].map((_, i) => (
                             <div key={i} className="absolute w-3 h-3 bg-green-500 rounded-full animate-ping" style={{ top: `${Math.random()*80}%`, left: `${Math.random()*80}%`, animationDelay: `${i*0.5}s` }}></div>
                         ))}
                         <div className="text-slate-500 text-sm">4,203 Users Online</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 2. USER MANAGEMENT
const UserManagement = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState(MOCK_USERS);

    const filteredUsers = users.filter(u => 
        u.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 h-full flex flex-col animate-pop-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-game text-white">User Database</h2>
                <input 
                    type="text" 
                    placeholder="Search via ID, Email, Nickname..." 
                    className="bg-slate-800 border border-slate-600 p-3 rounded-xl w-96 text-white outline-none focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="flex-1 bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden flex flex-col">
                <div className="grid grid-cols-6 bg-slate-900 p-4 font-bold text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
                    <div className="col-span-2">User</div>
                    <div>Status</div>
                    <div>Level/XP</div>
                    <div>Joined</div>
                    <div className="text-right">Actions</div>
                </div>
                <div className="overflow-y-auto flex-1 p-2">
                    {filteredUsers.map(user => (
                        <div key={user.id} className="grid grid-cols-6 p-4 items-center hover:bg-slate-700/50 rounded-xl transition-colors border-b border-slate-700/50 last:border-0">
                            <div className="col-span-2 flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center text-xl">
                                    {user.avatar?.emoji || '👤'}
                                </div>
                                <div>
                                    <div className="font-bold text-white">{user.nickname}</div>
                                    <div className="text-xs text-slate-400">{user.email}</div>
                                    <div className="text-[10px] font-mono text-slate-500">{user.id}</div>
                                </div>
                            </div>
                            <div>
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${user.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {user.status || 'Active'}
                                </span>
                            </div>
                            <div className="text-sm font-mono">
                                <span className="text-blue-400 font-bold">Lvl {user.level}</span>
                                <span className="text-slate-500 mx-1">|</span>
                                <span className="text-yellow-400">{user.coins?.toLocaleString()} 🪙</span>
                            </div>
                            <div className="text-sm text-slate-400">{user.joinedAt?.split('T')[0]}</div>
                            <div className="text-right flex justify-end gap-2">
                                <button onClick={() => giftCoins(user.id!, 1000)} className="p-2 bg-yellow-500/10 text-yellow-400 rounded hover:bg-yellow-500/20" title="Gift 1000 Coins">
                                    <CurrencyDollarIcon className="w-4 h-4" />
                                </button>
                                <button onClick={() => banUser(user.id!)} className="p-2 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20" title="Ban User">
                                    <ArrowLeftOnRectangleIcon className="w-4 h-4" />
                                </button>
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
    const [seeding, setSeeding] = useState(false);
    
    const handleSeed = async () => {
        if(confirm("Reset all content to default?")) {
            setSeeding(true);
            await seedGameData();
            setSeeding(false);
            alert("Content Reset Complete");
        }
    };

    return (
        <div className="p-8 animate-pop-in">
            <h2 className="text-3xl font-game text-white mb-6">Content CMS</h2>
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <h3 className="font-bold text-white mb-4">Database Tools</h3>
                <button 
                    onClick={handleSeed} 
                    disabled={seeding}
                    className="bg-red-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                    {seeding ? "Seeding..." : "Reset & Seed Default Content"}
                </button>
                <p className="text-slate-400 text-sm mt-2">
                    Restores World 1 levels and lessons to factory defaults.
                </p>
            </div>
            <div className="mt-8">
                 <h3 className="font-bold text-white mb-4">Worlds Config</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {WORLDS_METADATA.map(w => (
                         <div key={w.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-4">
                             <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${w.color}`}>
                                 <w.icon className="w-6 h-6 text-white" />
                             </div>
                             <div>
                                 <div className="font-bold text-white">{w.title}</div>
                                 <div className="text-xs text-slate-500">Unlock Lvl: {w.unlockLevel}</div>
                             </div>
                         </div>
                     ))}
                 </div>
            </div>
        </div>
    );
};

// 4. SHOP ECONOMY
const ShopEconomy = () => {
    return (
        <div className="p-8 animate-pop-in">
            <h2 className="text-3xl font-game text-white mb-6">Shop & Economy</h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {SHOP_ITEMS.map(item => (
                     <div key={item.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
                         <div className="text-4xl mb-2">{item.emoji}</div>
                         <div className="font-bold text-white">{item.name}</div>
                         <div className="text-yellow-400 font-mono font-bold">{item.cost} Coins</div>
                         <div className="text-xs text-slate-500 mt-2">{item.description}</div>
                     </div>
                 ))}
             </div>
        </div>
    );
};

// 5. PUSH NOTIFICATIONS
// Renamed from PushManager to avoid conflict with global type
const PushNotificationManager = () => {
    return (
        <div className="p-8 animate-pop-in">
            <h2 className="text-3xl font-game text-white mb-6">Push Notifications</h2>
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <h3 className="font-bold text-white mb-4">Test Triggers</h3>
                <div className="flex flex-wrap gap-4">
                    <button onClick={() => sendMockNotification('MORNING_STREAK')} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">
                        Streak Warning
                    </button>
                    <button onClick={() => sendMockNotification('MARKET_CLOSE')} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold">
                        Market Update
                    </button>
                    <button onClick={() => sendMockNotification('SOCIAL_LIKE')} className="bg-pink-600 text-white px-4 py-2 rounded-lg font-bold">
                        Social Like
                    </button>
                </div>
            </div>
        </div>
    );
};

// 6. GOD TOOLS
const GodTools = () => {
    const { user } = useUserStore();
    const handleSelfBoost = () => {
        if (user?.uid) {
            devAddResources(user.uid);
            alert("Resources added to your account.");
        }
    };

    return (
        <div className="p-8 animate-pop-in">
            <h2 className="text-3xl font-game text-white mb-6">God Tools</h2>
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 mb-6">
                <h3 className="font-bold text-white mb-2">Self Boost</h3>
                <p className="text-slate-400 text-sm mb-4">Add 10,000 XP and 50,000 Coins to your admin account.</p>
                <button onClick={handleSelfBoost} className="bg-yellow-500 text-black font-bold px-4 py-2 rounded-lg hover:bg-yellow-400">
                    Grant Resources
                </button>
            </div>
        </div>
    );
};

// --- MAIN ADMIN COMPONENT ---

export const AdminDashboard: React.FC<AdminProps> = ({ onExit }) => {
    const [view, setView] = useState<ViewType>('dashboard');
    const { user } = useUserStore();

    // SECURITY CHECK
    useEffect(() => {
        if (!user || !user.isAdmin) {
            alert("ACCESS DENIED: God Mode is restricted.");
            onExit();
        }
    }, [user]);

    // Shift+G Listener for God Mode (Backup Trigger)
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.shiftKey && e.key === 'G') {
                playSound('chest');
                setView('god');
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

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

    if (!user || !user.isAdmin) return null; // Double protect render

    return (
        <div className="flex h-screen bg-slate-950 text-white font-sans overflow-hidden">
            
            {/* SIDEBAR */}
            <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col flex-shrink-0 relative z-10">
                <div className="p-6 flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-600 rounded flex items-center justify-center font-bold text-xs shadow-lg">GM</div>
                    <div>
                        <h1 className="font-bold text-lg tracking-wider leading-none">GOD MODE</h1>
                        <div className="text-[10px] text-slate-500 font-mono">v2.4.0 • {view.toUpperCase()}</div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2 py-2">
                    <div className="text-[10px] font-bold text-slate-600 uppercase px-4 mb-2 mt-2">Analytics</div>
                    <SidebarItem id="dashboard" label="Dashboard" icon={ChartBarIcon} />
                    <SidebarItem id="analytics" label="Deep Dive" icon={GlobeAltIcon} />
                    
                    <div className="text-[10px] font-bold text-slate-600 uppercase px-4 mb-2 mt-6">Management</div>
                    <SidebarItem id="users" label="Users" icon={UsersIcon} />
                    <SidebarItem id="cms" label="Content CMS" icon={WrenchScrewdriverIcon} />
                    
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
            <div className="flex-1 bg-slate-900 overflow-hidden relative">
                <div className="absolute inset-0 overflow-y-auto">
                    {view === 'dashboard' && <DashboardHome />}
                    {view === 'users' && <UserManagement />}
                    {view === 'cms' && <ContentCMS />}
                    {view === 'shop' && <ShopEconomy />}
                    {view === 'push' && <PushNotificationManager />}
                    {view === 'god' && <GodTools />}
                    {view === 'analytics' && <div className="p-8 text-center text-slate-500 mt-20 text-xl">Analytics Integration Coming Soon</div>}
                </div>
            </div>

        </div>
    );
};