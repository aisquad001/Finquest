/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { 
    WrenchScrewdriverIcon, ArrowLeftOnRectangleIcon, UsersIcon, ChartBarIcon,
    ShoppingBagIcon, BoltIcon, PencilSquareIcon, CloudArrowUpIcon, 
    CloudArrowDownIcon, ArrowUpTrayIcon, CheckIcon, PlayCircleIcon
} from '@heroicons/react/24/solid';
import { WORLDS_METADATA, UserState, LevelData } from '../services/gamification';
import { 
    subscribeToAllUsers, adminUpdateUser, adminMassUpdate, 
    fetchLevelsForWorld, seedDatabase, saveLevelData, 
    subscribeToSystemConfig, updateSystemConfig 
} from '../services/db';
import { playSound } from '../services/audio';

interface AdminProps { onExit: () => void; }

// 1. CONTENT CMS
const ContentCMS = () => {
    const [selectedWorld, setSelectedWorld] = useState<string | null>(null);
    const [levels, setLevels] = useState<LevelData[]>([]);
    const [editingLevel, setEditingLevel] = useState<LevelData | null>(null);
    const [isSeeding, setIsSeeding] = useState(false);

    useEffect(() => {
        if (selectedWorld) {
            const meta = WORLDS_METADATA.find(w => w.title === selectedWorld);
            if (meta) fetchLevelsForWorld(meta.id).then(setLevels);
        }
    }, [selectedWorld]);

    const handleSeedDB = async () => {
        if (!confirm("WARNING: This will overwrite Firestore content with default data. Continue?")) return;
        setIsSeeding(true);
        await seedDatabase();
        setIsSeeding(false);
        alert("Database seeded!");
        window.location.reload();
    };

    const handleSave = async () => {
        if (editingLevel) {
            await saveLevelData(editingLevel);
            setEditingLevel(null);
            alert("Saved!");
            // Refresh
            const meta = WORLDS_METADATA.find(w => w.title === selectedWorld);
            if (meta) fetchLevelsForWorld(meta.id).then(setLevels);
        }
    };

    const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
            try {
                const json = JSON.parse(ev.target?.result as string);
                if (Array.isArray(json)) {
                    for (const lvl of json) await saveLevelData(lvl);
                    alert(`Uploaded ${json.length} levels!`);
                } else alert("Invalid JSON");
            } catch (err) { alert("Parse Error"); }
        };
        reader.readAsText(file);
    };

    return (
        <div className="p-8 h-full overflow-y-auto text-white">
            <div className="flex justify-between mb-8">
                <h2 className="text-3xl font-game">Content CMS</h2>
                <div className="flex gap-2">
                    <button onClick={handleSeedDB} disabled={isSeeding} className="bg-red-600 px-4 py-2 rounded font-bold flex gap-2 items-center">
                        <CloudArrowUpIcon className="w-4 h-4" /> {isSeeding ? "SEEDING..." : "SEED DB"}
                    </button>
                    <a href="https://files.catbox.moe/9y8q2r.json" target="_blank" className="bg-slate-700 px-4 py-2 rounded font-bold flex gap-2 items-center">
                        <CloudArrowDownIcon className="w-4 h-4" /> Template
                    </a>
                    <label className="bg-blue-600 px-4 py-2 rounded font-bold flex gap-2 items-center cursor-pointer">
                        <ArrowUpTrayIcon className="w-4 h-4" /> Bulk Upload
                        <input type="file" accept=".json" onChange={handleBulkUpload} className="hidden" />
                    </label>
                </div>
            </div>

            {editingLevel ? (
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 animate-slide-up">
                    <div className="flex justify-between mb-4">
                        <h3 className="font-bold text-xl">Editing: {editingLevel.title}</h3>
                        <div className="flex gap-2">
                            <button onClick={() => setEditingLevel(null)} className="text-slate-400 px-4">Cancel</button>
                            <button onClick={handleSave} className="bg-green-600 px-4 py-2 rounded font-bold flex gap-2">
                                <CheckIcon className="w-4 h-4" /> Save
                            </button>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Boss Name</label>
                            <input className="w-full bg-black p-2 rounded border border-slate-600" value={editingLevel.bossName} onChange={e=>setEditingLevel({...editingLevel, bossName: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Boss Intro</label>
                            <input className="w-full bg-black p-2 rounded border border-slate-600" value={editingLevel.bossIntro} onChange={e=>setEditingLevel({...editingLevel, bossIntro: e.target.value})} />
                        </div>
                    </div>
                </div>
            ) : selectedWorld ? (
                <div>
                    <button onClick={() => setSelectedWorld(null)} className="mb-4 text-slate-400 hover:text-white">← Back</button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {levels.map(lvl => (
                            <div key={lvl.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                                <div>
                                    <div className="text-neon-green text-xs font-bold">LEVEL {lvl.levelNumber}</div>
                                    <div className="font-bold">{lvl.title}</div>
                                </div>
                                <button onClick={() => setEditingLevel(lvl)} className="bg-slate-700 p-2 rounded hover:bg-blue-600">
                                    <PencilSquareIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {WORLDS_METADATA.map(w => (
                        <div key={w.id} onClick={() => setSelectedWorld(w.title)} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-blue-500 cursor-pointer flex flex-col items-center text-center">
                            <w.icon className="w-8 h-8 mb-2 text-white" />
                            <div className="font-bold">{w.title}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// 2. GOD TOOLS (ADS)
const GodTools = () => {
    const [adsEnabled, setAdsEnabled] = useState(false);

    useEffect(() => {
        const unsub = subscribeToSystemConfig(c => setAdsEnabled(c.adsEnabled));
        return () => unsub();
    }, []);

    const toggleAds = async () => {
        await updateSystemConfig({ adsEnabled: !adsEnabled });
        playSound('click');
    };

    return (
        <div className="p-8 h-full overflow-y-auto text-white">
            <h2 className="text-3xl font-game mb-6">God Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <h3 className="font-bold mb-4 flex items-center gap-2"><PlayCircleIcon className="w-5 h-5 text-blue-400"/> Monetization</h3>
                    <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl">
                        <div>
                            <div className="font-bold">Rewarded Ads</div>
                            <div className="text-xs text-slate-400">Shop & Revive Ads</div>
                        </div>
                        <button onClick={toggleAds} className={`px-4 py-2 rounded-full font-bold text-sm ${adsEnabled ? 'bg-green-500 text-black' : 'bg-slate-700 text-slate-400'}`}>
                            {adsEnabled ? 'ON (LIVE)' : 'OFF'}
                        </button>
                    </div>
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <h3 className="font-bold mb-4 flex items-center gap-2"><BoltIcon className="w-5 h-5 text-yellow-400"/> Mass Actions</h3>
                    <button onClick={() => adminMassUpdate('give_coins')} className="w-full bg-green-600 py-2 rounded mb-2 font-bold">Give 1000 Coins to All</button>
                    <button onClick={() => adminMassUpdate('reset')} className="w-full bg-red-900 py-2 rounded font-bold border border-red-500">GLOBAL RESET</button>
                </div>
            </div>
        </div>
    );
};

// MAIN
export const AdminDashboard: React.FC<AdminProps> = ({ onExit }) => {
    const [view, setView] = useState('cms');
    const [users, setUsers] = useState<UserState[]>([]);

    useEffect(() => {
        const unsub = subscribeToAllUsers(setUsers);
        return () => unsub();
    }, []);

    return (
        <div className="flex h-screen bg-slate-950 text-white font-sans">
            <div className="w-64 border-r border-slate-800 p-4 flex flex-col">
                <div className="font-bold text-xl mb-6">GOD MODE</div>
                <div className="space-y-1 flex-1">
                    <button onClick={() => setView('cms')} className={`w-full text-left p-2 rounded font-bold ${view === 'cms' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>Content CMS</button>
                    <button onClick={() => setView('god')} className={`w-full text-left p-2 rounded font-bold ${view === 'god' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>God Tools</button>
                    <button onClick={() => setView('users')} className={`w-full text-left p-2 rounded font-bold ${view === 'users' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>Users ({users.length})</button>
                </div>
                <button onClick={onExit} className="text-slate-500 hover:text-white font-bold">Exit Admin</button>
            </div>
            <div className="flex-1 bg-slate-900">
                {view === 'cms' && <ContentCMS />}
                {view === 'god' && <GodTools />}
                {view === 'users' && <div className="p-8">User Management (Placeholder)</div>}
            </div>
        </div>
    );
};