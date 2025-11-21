/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { 
    ChartBarIcon, 
    UsersIcon, 
    CurrencyDollarIcon, 
    WrenchScrewdriverIcon, 
    ArrowLeftOnRectangleIcon,
    FunnelIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    BoltIcon,
    CloudArrowUpIcon
} from '@heroicons/react/24/solid';
import { getAnalyticsSnapshot, getRecentEvents } from '../services/analytics';
import { MOCK_USERS, banUser, giftCoins, getContentStats } from '../services/admin';
import { seedGameData } from '../services/db';
import { playSound } from '../services/audio';

interface AdminProps {
    onExit: () => void;
}

export const AdminDashboard: React.FC<AdminProps> = ({ onExit }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'content' | 'economy'>('overview');
    const stats = getAnalyticsSnapshot();
    const content = getContentStats();
    const [isSeeding, setIsSeeding] = useState(false);

    const handleSeed = async () => {
        if (window.confirm("This will overwrite/fill the database with World 1-3 data. Continue?")) {
            setIsSeeding(true);
            playSound('pop');
            await seedGameData();
            setIsSeeding(false);
            playSound('levelup');
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans flex">
            
            {/* Sidebar */}
            <div className="w-64 bg-slate-950 border-r border-slate-800 p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center font-bold">GM</div>
                    <h1 className="font-bold text-xl tracking-wider">GOD MODE</h1>
                </div>

                <nav className="space-y-2 flex-1">
                    {[
                        { id: 'overview', label: 'Analytics', icon: ChartBarIcon },
                        { id: 'users', label: 'User Mgmt', icon: UsersIcon },
                        { id: 'content', label: 'Content CMS', icon: WrenchScrewdriverIcon },
                        { id: 'economy', label: 'Economy', icon: CurrencyDollarIcon },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                activeTab === item.id 
                                ? 'bg-red-600 text-white font-bold' 
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="pt-6 border-t border-slate-800">
                    <div className="text-xs text-slate-500 font-mono mb-2">SERVER STATUS</div>
                    <div className="flex items-center gap-2 text-green-500 text-sm font-bold">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Operational
                    </div>
                    <button onClick={onExit} className="mt-4 flex items-center gap-2 text-slate-400 hover:text-white text-sm">
                        <ArrowLeftOnRectangleIcon className="w-4 h-4" />
                        Exit God Mode
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto bg-slate-900">
                
                {/* Header */}
                <header className="bg-slate-950 border-b border-slate-800 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
                    <h2 className="text-xl font-bold capitalize">{activeTab} Dashboard</h2>
                    <div className="flex gap-4">
                        <button className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded text-sm font-bold">Export Data</button>
                        <button className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-sm font-bold">Create Event</button>
                    </div>
                </header>

                <div className="p-8 max-w-7xl mx-auto">
                    
                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div className="space-y-8">
                            {/* KPI Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                                    <div className="text-slate-400 text-xs font-bold uppercase mb-2">Daily Active Users</div>
                                    <div className="text-3xl font-bold">{stats.dau.toLocaleString()}</div>
                                    <div className="text-green-400 text-sm mt-1">↑ 12% vs last week</div>
                                </div>
                                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                                    <div className="text-slate-400 text-xs font-bold uppercase mb-2">Total Revenue</div>
                                    <div className="text-3xl font-bold text-green-400">${stats.revenue.total.toLocaleString()}</div>
                                    <div className="text-slate-400 text-sm mt-1">Proj: ${stats.revenue.projected.toLocaleString()}</div>
                                </div>
                                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                                    <div className="text-slate-400 text-xs font-bold uppercase mb-2">Conversion Rate</div>
                                    <div className="text-3xl font-bold text-blue-400">{stats.conversionRate}%</div>
                                    <div className="text-slate-400 text-sm mt-1">Free to Pro</div>
                                </div>
                                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                                    <div className="text-slate-400 text-xs font-bold uppercase mb-2">Day 30 Retention</div>
                                    <div className="text-3xl font-bold text-yellow-400">{stats.retention[6]}%</div>
                                    <div className="text-slate-400 text-sm mt-1">Industry Avg: 15%</div>
                                </div>
                            </div>

                            {/* Retention Curve (Visual Only) */}
                            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                                <h3 className="font-bold mb-6">Retention Curve (D1 - D30)</h3>
                                <div className="h-40 flex items-end gap-2">
                                    {stats.retention.map((val, i) => (
                                        <div key={i} className="flex-1 flex flex-col justify-end gap-2 group">
                                            <div 
                                                className="bg-blue-600 rounded-t-lg hover:bg-blue-500 transition-all relative" 
                                                style={{ height: `${val}%` }}
                                            >
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {val}%
                                                </div>
                                            </div>
                                            <div className="text-center text-xs text-slate-500">D{Math.pow(2, i)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Live Event Feed */}
                            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-700 font-bold">Live Event Stream</div>
                                <div className="max-h-60 overflow-y-auto">
                                    {getRecentEvents().map((evt, i) => (
                                        <div key={i} className="px-6 py-3 border-b border-slate-700/50 flex justify-between text-sm font-mono hover:bg-slate-700/50">
                                            <span className="text-blue-400">{evt.timestamp.split('T')[1].split('.')[0]}</span>
                                            <span className="text-white">{evt.name}</span>
                                            <span className="text-slate-500">{JSON.stringify(evt.properties)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* USERS TAB */}
                    {activeTab === 'users' && (
                        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                            <div className="p-4 border-b border-slate-700 flex gap-4">
                                <input type="text" placeholder="Search by email or ID..." className="bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white w-96" />
                                <button className="bg-slate-700 px-4 py-2 rounded font-bold">Filter</button>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-slate-900 text-slate-400 text-xs uppercase font-bold">
                                    <tr>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Level</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {MOCK_USERS.map((u) => (
                                        <tr key={u.id} className="hover:bg-slate-700/50">
                                            <td className="px-6 py-4">
                                                <div className="font-bold">{u.nickname}</div>
                                                <div className="text-xs text-slate-500">{u.email}</div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-yellow-400">Lvl {u.level}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${u.status === 'active' ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                                                    {u.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 flex gap-2">
                                                <button 
                                                    onClick={() => giftCoins(u.id!, 1000)}
                                                    className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold"
                                                >
                                                    Gift Coin
                                                </button>
                                                {u.status === 'active' && (
                                                    <button 
                                                        onClick={() => banUser(u.id!)}
                                                        className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-xs font-bold"
                                                    >
                                                        Ban
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* CONTENT TAB */}
                    {activeTab === 'content' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                                <h3 className="font-bold mb-4">Performance Matrix</h3>
                                <div className="space-y-4">
                                    {content.map(c => (
                                        <div key={c.id} className="flex items-center justify-between">
                                            <div>
                                                <div className="font-bold">{c.title}</div>
                                                <div className="text-xs text-slate-500">{c.completions.toLocaleString()} plays</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-2 bg-slate-900 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full ${c.rating > 4.5 ? 'bg-green-500' : c.rating > 4.0 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                                        style={{ width: `${(c.rating / 5) * 100}%` }}
                                                    ></div>
                                                </div>
                                                <span className="font-mono font-bold">{c.rating}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-6">
                                <button 
                                    onClick={handleSeed}
                                    disabled={isSeeding}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl border border-indigo-400 p-6 flex flex-col justify-center items-center text-center transition-all active:scale-95"
                                >
                                    <CloudArrowUpIcon className="w-12 h-12 mb-2" />
                                    <h3 className="font-bold text-lg">{isSeeding ? 'Seeding DB...' : 'Seed Game Content'}</h3>
                                    <p className="text-indigo-200 text-sm">Populate Worlds 1-3 (Database Init)</p>
                                </button>

                                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex flex-col justify-center items-center text-center dashed-border">
                                    <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4 text-2xl">➕</div>
                                    <h3 className="font-bold text-lg">Add New Micro-Lesson</h3>
                                    <p className="text-slate-400 text-sm mb-4">Drag & Drop JSON file or use Builder</p>
                                    <button className="bg-blue-600 text-white font-bold py-2 px-6 rounded-full">Open Builder</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ECONOMY TAB */}
                    {activeTab === 'economy' && (
                        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8">
                            <h3 className="font-bold mb-6 text-xl flex items-center gap-2">
                                <WrenchScrewdriverIcon className="w-6 h-6 text-orange-500" />
                                Global Balancer
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Global XP Multiplier</label>
                                    <input type="range" min="1" max="5" step="0.1" className="w-full accent-blue-500" />
                                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                                        <span>1.0x (Normal)</span>
                                        <span>5.0x (Event)</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Inflation Rate (Zoo)</label>
                                    <input type="range" min="0" max="10" step="0.5" className="w-full accent-red-500" />
                                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                                        <span>0% (Stable)</span>
                                        <span>10% (Chaos)</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Loot Box Drop Rate</label>
                                    <input type="range" min="0" max="100" step="5" className="w-full accent-green-500" />
                                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                                        <span>Rare</span>
                                        <span>Abundant</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8 p-4 bg-slate-900 rounded border border-slate-600">
                                <h4 className="font-bold text-red-400 mb-2 flex items-center gap-2">
                                    <ExclamationTriangleIcon className="w-5 h-5" /> 
                                    Danger Zone
                                </h4>
                                <div className="flex gap-4">
                                    <button className="bg-red-900/50 border border-red-800 text-red-400 px-4 py-2 rounded font-bold hover:bg-red-900">Reset Economy</button>
                                    <button className="bg-red-900/50 border border-red-800 text-red-400 px-4 py-2 rounded font-bold hover:bg-red-900">Maintenance Mode</button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};