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

// 3. CONTENT CMS (THE BIG ONE)
const ContentCMS = () => {
    const [activeTab, setActiveTab] = useState<'content' | 'media' | 'import'>('content');
    const [selectedWorld, setSelectedWorld] = useState<WorldData | null>(null);
    const [levels, setLevels] = useState<LevelData[]>([]);
    const [selectedLevel, setSelectedLevel] = useState<LevelData | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
    const [editingBoss, setEditingBoss] = useState<LevelData | null>(null);
    const [jsonImport, setJsonImport] = useState('');
    const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [importMsg, setImportMsg] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const LESSON_TYPES: LessonType[] = ['swipe', 'drag_drop', 'tap_lie', 'calculator', 'meme', 'info'];

    useEffect(() => {
        if (selectedWorld) {
            fetchLevelsForWorld(selectedWorld.id).then(setLevels);
            setSelectedLevel(null);
            setLessons([]);
            setEditingLesson(null);
            setEditingBoss(null);
        }
    }, [selectedWorld]);

    useEffect(() => {
        if (selectedLevel) {
            fetchLessonsForLevel(selectedLevel.id).then(setLessons);
            setEditingLesson(null);
            setEditingBoss(null);
        }
    }, [selectedLevel]);

    const processImport = async (rawJson: string) => {
        setImportStatus('loading');
        setImportMsg('Parsing JSON...');
        try {
            const cleanJson = rawJson.trim().replace(/^\uFEFF/, '');
            let data;
            try { data = JSON.parse(cleanJson); } catch (e: any) { throw new Error(`Invalid JSON Syntax: ${e.message}`); }

            let itemsToImport = [];
            if (Array.isArray(data)) itemsToImport = data;
            else if (data.lessons && Array.isArray(data.lessons)) itemsToImport = data.lessons;
            else if (data.items && Array.isArray(data.items)) itemsToImport = data.items;
            else if (data.id && data.type) itemsToImport = [data];
            else throw new Error("JSON must contain an array of lessons.");

            let count = 0;
            setImportMsg(`Importing ${itemsToImport.length} items...`);
            for (const item of itemsToImport) {
                if (item.id) {
                    if (!item.content) item.content = { text: "Imported Content" };
                    await upsertLesson(item);
                    count++;
                }
            }

            setImportStatus('success');
            setImportMsg(`SUCCESS: ${count} unique lessons imported 🔥`);
            setJsonImport('');
            playSound('levelup');
            setTimeout(() => { setImportStatus('idle'); setImportMsg(''); }, 5000);
        } catch (e: any) {
            setImportStatus('error');
            setImportMsg(e.message || "Unknown Import Error");
            playSound('error');
        }
    };

    const handleTestImport = () => {
        const testData = [
          {"id":"test1","worldId":"world1","levelId":"world1_1","type":"info","title":"Test Lesson 1","content":{"text":"If this works, we’re golden 🚀"}},
          {"id":"test2","worldId":"world1","levelId":"world1_1","type":"swipe","title":"Test Swipe","content":{"question":"Need or Want?","leftLabel":"Need","rightLabel":"Want","correctSide":"right","text":"Test passed"}}
        ];
        setJsonImport(JSON.stringify(testData, null, 2));
        processImport(JSON.stringify(testData));
    };

    const handleFullImport = async () => {
        setImportStatus('loading');
        setImportMsg("Fetching 384 Unique Lessons...");
        try {
            const res = await fetch('https://files.catbox.moe/4p3h7k.json');
            if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
            const text = await res.text();
            processImport(text);
        } catch (e: any) {
            setImportStatus('error');
            setImportMsg(`Download Failed: ${e.message}`);
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Sub-Nav for CMS */}
            <div className="bg-slate-900 border-b border-slate-800 px-4 flex gap-2">
                {[{id: 'content', label: 'Content', icon: WrenchScrewdriverIcon}, {id: 'media', label: 'Media', icon: PhotoIcon}, {id: 'import', label: 'Bulk Import', icon: CloudArrowUpIcon}].map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`py-3 px-4 border-b-2 text-sm font-bold flex items-center gap-2 ${activeTab === t.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400'}`}>
                        <t.icon className="w-4 h-4" /> {t.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* IMPORT TAB */}
                {activeTab === 'import' && (
                    <div className="flex-1 bg-slate-900 p-8 flex flex-col relative animate-pop-in">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2 text-white">Bulk Content Import</h2>
                                <p className="text-slate-400 text-sm">Paste JSON or upload file.</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={handleTestImport} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded font-bold text-xs flex items-center gap-2 border border-slate-600"><BoltIcon className="w-4 h-4 text-yellow-400" />Test (Small)</button>
                                <button onClick={handleFullImport} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold text-xs flex items-center gap-2 shadow-lg"><CloudArrowUpIcon className="w-4 h-4" />Import FULL (384)</button>
                            </div>
                        </div>
                        {importStatus !== 'idle' && (
                            <div className={`mb-4 p-4 rounded-lg border flex items-center gap-3 font-bold shadow-lg ${importStatus === 'success' ? 'bg-green-900/30 border-green-500 text-green-400' : importStatus === 'error' ? 'bg-red-900/30 border-red-500 text-red-400' : 'bg-blue-900/30 border-blue-500 text-blue-400'}`}>
                                {importStatus === 'loading' ? <ArrowUpTrayIcon className="w-5 h-5 animate-bounce" /> : importStatus === 'success' ? <CheckCircleIcon className="w-5 h-5" /> : <TrashIcon className="w-5 h-5" />}
                                <span>{importMsg}</span>
                            </div>
                        )}
                        <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 p-4 mb-4 font-mono text-xs text-green-400 overflow-hidden relative group">
                            <textarea className="w-full h-full bg-transparent outline-none resize-none" value={jsonImport} onChange={e => setJsonImport(e.target.value)} placeholder='[ Paste JSON here... ]' />
                            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <input type="file" ref={fileInputRef} onChange={(e) => { const file = e.target.files?.[0]; if(file) { const r = new FileReader(); r.onload = evt => setJsonImport(evt.target?.result as string); r.readAsText(file); }}} accept=".json" className="hidden" />
                                <button onClick={() => fileInputRef.current?.click()} className="bg-slate-800 text-white px-4 py-2 rounded shadow-lg border border-slate-600 font-bold flex items-center gap-2"><DocumentTextIcon className="w-4 h-4" />Upload File</button>
                            </div>
                        </div>
                        <button onClick={() => processImport(jsonImport)} disabled={!jsonImport || importStatus === 'loading'} className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-500 shadow-lg flex items-center gap-2 self-end"><CheckCircleIcon className="w-5 h-5" />Process Import</button>
                    </div>
                )}

                {/* CONTENT TAB */}
                {activeTab === 'content' && (
                    <>
                        <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col overflow-y-auto">
                            {!selectedWorld && (
                                <div className="p-4 space-y-2">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">Select World</h3>
                                    {WORLDS_METADATA.map(w => (
                                        <button key={w.id} onClick={() => setSelectedWorld(w)} className="w-full p-3 rounded bg-slate-800 border border-slate-700 flex items-center gap-3 hover:bg-slate-700">
                                            <div className={`w-8 h-8 rounded flex items-center justify-center ${w.color} text-white`}><w.icon className="w-4 h-4" /></div>
                                            <div className="text-left font-bold text-sm">{w.title}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {selectedWorld && !selectedLevel && (
                                <div className="p-4 space-y-2">
                                    <button onClick={() => setSelectedWorld(null)} className="text-xs text-slate-400 flex items-center gap-1 mb-4"><ArrowLeftIcon className="w-3 h-3"/> Back</button>
                                    {levels.map(l => (
                                        <button key={l.id} onClick={() => setSelectedLevel(l)} className="w-full p-3 rounded bg-slate-800 border border-slate-700 text-left hover:bg-slate-700">
                                            <div className="font-bold text-sm">Level {l.levelNumber}</div>
                                            <div className="text-xs text-slate-400">{l.bossName}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {selectedLevel && (
                                <div className="p-4 space-y-2">
                                    <button onClick={() => setSelectedLevel(null)} className="text-xs text-slate-400 flex items-center gap-1 mb-4"><ArrowLeftIcon className="w-3 h-3"/> Back</button>
                                    <div onClick={() => { setEditingLesson(null); setEditingBoss(selectedLevel); }} className={`border border-red-900/50 p-3 rounded cursor-pointer ${editingBoss ? 'bg-red-900/30' : 'bg-slate-800'}`}>
                                        <div className="text-xs font-bold text-red-400 uppercase mb-1">Boss Battle</div>
                                        <div className="text-sm font-bold">{selectedLevel.bossName}</div>
                                    </div>
                                    <div className="flex justify-between items-center mt-4 mb-2"><span className="text-xs font-bold text-slate-500">LESSONS</span> <button onClick={() => { const newL = { id: `${Date.now()}`, worldId: selectedWorld!.id, levelId: selectedLevel.id, order: lessons.length, type: 'info', title: 'New', xpReward: 100, coinReward: 50, content: {} } as Lesson; setEditingLesson(newL); }} className="text-green-500"><PlusIcon className="w-4 h-4"/></button></div>
                                    {lessons.map((l, i) => (
                                        <div key={l.id} onClick={() => { setEditingBoss(null); setEditingLesson(l); }} className={`p-3 rounded border cursor-pointer text-sm ${editingLesson?.id === l.id ? 'bg-blue-900/50 border-blue-500' : 'bg-slate-800 border-slate-700'}`}>
                                            <span className="text-slate-500 mr-2">{i+1}</span>
                                            <span className="font-bold">{l.title}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {/* Editor */}
                        <div className="flex-1 bg-slate-800 p-8 overflow-y-auto">
                            {editingLesson && (
                                <div className="max-w-2xl mx-auto">
                                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><PencilSquareIcon className="w-6 h-6 text-blue-500" /> Edit Lesson</h2>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <input className="bg-slate-900 border border-slate-600 p-2 rounded text-sm" value={editingLesson.title} onChange={e => setEditingLesson({...editingLesson, title: e.target.value})} placeholder="Title" />
                                        <select className="bg-slate-900 border border-slate-600 p-2 rounded text-sm uppercase" value={editingLesson.type} onChange={e => setEditingLesson({...editingLesson, type: e.target.value as any})}>
                                            {LESSON_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <textarea className="w-full h-64 bg-slate-900 border border-slate-600 p-2 rounded text-sm font-mono mb-4" value={JSON.stringify(editingLesson.content, null, 2)} onChange={e => { try { setEditingLesson({...editingLesson, content: JSON.parse(e.target.value)}); } catch {} }} />
                                    <button onClick={async () => { await upsertLesson(editingLesson); const updated = await fetchLessonsForLevel(selectedLevel!.id); setLessons(updated); playSound('success'); }} className="bg-blue-600 text-white font-bold py-3 px-6 rounded w-full hover:bg-blue-500">Save Changes</button>
                                </div>
                            )}
                            {editingBoss && (
                                <div className="max-w-2xl mx-auto">
                                     <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-red-400"><PencilSquareIcon className="w-6 h-6" /> Edit Boss</h2>
                                     <input className="w-full bg-slate-900 border border-slate-600 p-2 rounded text-sm mb-4" value={editingBoss.bossName} onChange={e => setEditingBoss({...editingBoss, bossName: e.target.value})} placeholder="Boss Name" />
                                     <textarea className="w-full h-64 bg-slate-900 border border-slate-600 p-2 rounded text-sm font-mono mb-4" value={JSON.stringify(editingBoss.bossQuiz, null, 2)} onChange={e => { try { setEditingBoss({...editingBoss, bossQuiz: JSON.parse(e.target.value)}); } catch {} }} />
                                     <button onClick={async () => { await updateLevelConfig(editingBoss); const updated = await fetchLevelsForWorld(selectedWorld!.id); setLevels(updated); playSound('success'); }} className="bg-red-600 text-white font-bold py-3 px-6 rounded w-full hover:bg-red-500">Save Boss</button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// 4. SHOP & ECONOMY
const ShopEconomy = () => {
    const [items, setItems] = useState(SHOP_ITEMS);
    return (
        <div className="p-8 animate-pop-in">
            <h2 className="text-3xl font-game text-white mb-6">Economy & Shop</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <h3 className="font-bold text-white mb-4">Global Multipliers</h3>
                    <div className="space-y-4">
                         <div className="flex justify-between items-center">
                             <label>XP Multiplier</label>
                             <input type="number" className="bg-slate-900 p-2 rounded w-20 text-center" defaultValue={1.0} />
                         </div>
                         <div className="flex justify-between items-center">
                             <label>Coin Drop Rate</label>
                             <input type="number" className="bg-slate-900 p-2 rounded w-20 text-center" defaultValue={1.0} />
                         </div>
                         <div className="flex justify-between items-center">
                             <label>Market Volatility</label>
                             <input type="range" className="w-32" defaultValue={50} />
                         </div>
                         <button onClick={() => playSound('success')} className="w-full bg-blue-600 py-2 rounded font-bold text-sm mt-4">Apply Config</button>
                    </div>
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 h-96 overflow-y-auto">
                    <h3 className="font-bold text-white mb-4">Active Shop Items</h3>
                    {items.map(item => (
                        <div key={item.id} className="flex items-center gap-3 p-2 border-b border-slate-600">
                            <div className="text-2xl">{item.emoji}</div>
                            <div className="flex-1">
                                <div className="font-bold text-sm">{item.name}</div>
                                <div className="text-xs text-slate-400">{item.cost} Coins</div>
                            </div>
                            <button className="text-blue-400 text-xs underline">Edit</button>
                        </div>
                    ))}
                    <button className="w-full bg-slate-700 py-2 rounded font-bold text-sm mt-4">+ Add Item</button>
                </div>
            </div>
        </div>
    );
};

// 5. PUSH NOTIFICATIONS
const PushManager = () => {
    return (
        <div className="p-8 animate-pop-in max-w-2xl mx-auto">
            <h2 className="text-3xl font-game text-white mb-6">Global Push</h2>
            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl">
                <div className="mb-6">
                    <label className="block text-sm font-bold mb-2">Notification Title</label>
                    <input type="text" className="w-full bg-slate-900 p-4 rounded-xl border border-slate-600 focus:border-blue-500 outline-none" placeholder="e.g. 🔥 Streak at Risk!" />
                </div>
                <div className="mb-8">
                    <label className="block text-sm font-bold mb-2">Body Message</label>
                    <textarea className="w-full bg-slate-900 p-4 rounded-xl border border-slate-600 focus:border-blue-500 outline-none h-32" placeholder="e.g. Log in now to keep your diamond status..." />
                </div>
                <div className="flex gap-4">
                    <button onClick={() => { sendMockNotification('STREAK_DANGER'); playSound('success'); }} className="flex-1 bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-bold text-white shadow-lg flex justify-center gap-2">
                        <MegaphoneIcon className="w-5 h-5" /> Send to All (50k)
                    </button>
                    <button onClick={() => { sendMockNotification('MARKET_CLOSE'); }} className="px-6 bg-slate-700 rounded-xl font-bold hover:bg-slate-600">
                        Test Send
                    </button>
                </div>
                <p className="text-center text-xs text-slate-500 mt-4">Targeting: All Users • Segment: Active Last 7 Days</p>
            </div>
        </div>
    );
};

// 6. GOD TOOLS
const GodTools = () => {
    const [isSeeding, setIsSeeding] = useState(false);
    return (
        <div className="p-8 animate-pop-in">
            <h2 className="text-3xl font-game text-white mb-6 flex items-center gap-2"><BoltIcon className="w-8 h-8 text-yellow-400" /> GOD MODE TOOLS</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-2xl">
                    <h3 className="font-bold text-red-400 mb-2">Danger Zone</h3>
                    <p className="text-xs text-red-300 mb-4">Irreversible actions.</p>
                    <button onClick={async () => { if(confirm("RESET DB?")) { setIsSeeding(true); await seedGameData(); setIsSeeding(false); alert("Done"); }}} disabled={isSeeding} className="w-full bg-red-600 hover:bg-red-500 py-3 rounded font-bold text-white mb-2">
                        {isSeeding ? 'Seeding...' : '☢️ RESET & SEED DB'}
                    </button>
                    <button onClick={() => alert("Users Wiped (Mock)")} className="w-full bg-red-600 hover:bg-red-500 py-3 rounded font-bold text-white">
                        🗑️ WIPE ALL USERS
                    </button>
                </div>
                <div className="bg-blue-900/20 border border-blue-500/50 p-6 rounded-2xl">
                    <h3 className="font-bold text-blue-400 mb-2">Testing</h3>
                    <button onClick={() => { playSound('levelup'); (window as any).confetti({particleCount: 500}); }} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded font-bold text-white mb-2">
                        🎉 Trigger Confetti
                    </button>
                    <button onClick={() => { sendMockNotification('SOCIAL_LIKE'); }} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded font-bold text-white">
                        🔔 Test Notification
                    </button>
                </div>
                <div className="bg-yellow-900/20 border border-yellow-500/50 p-6 rounded-2xl">
                    <h3 className="font-bold text-yellow-400 mb-2">Economy</h3>
                    <button onClick={() => alert("Market Crashed: -20%")} className="w-full bg-yellow-600 hover:bg-yellow-500 py-3 rounded font-bold text-black mb-2">
                        📉 Crash Stock Market
                    </button>
                    <button onClick={() => alert("Market Pumped: +20%")} className="w-full bg-green-600 hover:bg-green-500 py-3 rounded font-bold text-black">
                        📈 Pump Stock Market
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN ADMIN COMPONENT ---

export const AdminDashboard: React.FC<AdminProps> = ({ onExit }) => {
    const [view, setView] = useState<ViewType>('dashboard');

    // Shift+G Listener for God Mode
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
                    {view === 'push' && <PushManager />}
                    {view === 'god' && <GodTools />}
                    {view === 'analytics' && <div className="p-8 text-center text-slate-500 mt-20 text-xl">Analytics Integration Coming Soon</div>}
                </div>
            </div>

        </div>
    );
};
