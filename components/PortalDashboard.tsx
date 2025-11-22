/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { 
    UserGroupIcon, 
    ChartBarIcon, 
    CreditCardIcon, 
    AcademicCapIcon, 
    ShieldCheckIcon,
    ExclamationTriangleIcon,
    ArrowRightOnRectangleIcon,
    PrinterIcon
} from '@heroicons/react/24/solid';
import { UserState } from '../services/gamification';
import { MOCK_BANKING, getInterventions, MOCK_CERTIFICATE } from '../services/portal';
import { Avatar } from './Avatar';

interface PortalProps {
    childData: UserState | null;
    onExit: () => void;
}

export const PortalDashboard: React.FC<PortalProps> = ({ childData, onExit }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'banking' | 'education'>('overview');
    const [linkCode, setLinkCode] = useState('');
    const [isLinked, setIsLinked] = useState(!!childData);

    // If no child linked (simulated for demo flow)
    if (!isLinked || !childData) {
        return (
            <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-6 font-sans">
                <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center text-white text-3xl">
                            🛡️
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">Racked Parent Portal</h1>
                    <p className="text-slate-500 text-center mb-8">Track progress, manage allowance, and secure their financial future.</p>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Enter Family Code</label>
                            <input 
                                type="text" 
                                placeholder="e.g. 123-456"
                                value={linkCode}
                                onChange={(e) => setLinkCode(e.target.value)}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <p className="text-xs text-slate-400 mt-2">Get this code from your teen's app settings.</p>
                        </div>
                        <button 
                            onClick={() => setIsLinked(true)} // Simulating auth
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-md"
                        >
                            Connect Account
                        </button>
                        <button onClick={onExit} className="w-full py-3 text-slate-500 hover:text-slate-700 font-medium">
                            Back to App
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const alerts = getInterventions(childData);
    const riskScore = 4; // Derived mock

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
            {/* Top Navigation */}
            <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">🛡️</div>
                    <span className="font-bold text-xl text-slate-900 tracking-tight">Racked Portal</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Synced Just Now
                    </div>
                    <button onClick={onExit} className="text-slate-500 hover:text-slate-800 flex items-center gap-2 font-medium transition-colors">
                        <ArrowRightOnRectangleIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">Log Out</span>
                    </button>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
                
                {/* Sidebar / Child Selector */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Child Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-4 transform scale-75 origin-center">
                                <Avatar level={childData.level} customConfig={childData.avatar} size="lg" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">{childData.nickname}</h2>
                            <p className="text-sm text-slate-500 mb-4">Level {childData.level} • {childData.streak} Day Streak</p>
                            
                            <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2">
                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '65%' }}></div>
                            </div>
                            <p className="text-xs text-slate-400">1,250 XP to Level {childData.level + 1}</p>
                        </div>
                        <hr className="my-6 border-slate-100" />
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Net Worth</span>
                                <span className="font-bold text-slate-900">${(childData.portfolio.cash * 1.05).toLocaleString(undefined, { maximumFractionDigits: 0})}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Risk Profile</span>
                                <span className="font-bold text-green-600 flex items-center gap-1">
                                    <ShieldCheckIcon className="w-4 h-4" /> Conservative
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Menu */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        {[
                            { id: 'overview', label: 'Dashboard', icon: ChartBarIcon },
                            { id: 'banking', label: 'Banking & Allowance', icon: CreditCardIcon },
                            { id: 'education', label: 'School Reports', icon: AcademicCapIcon },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as any)}
                                className={`w-full flex items-center gap-3 px-6 py-4 text-left transition-colors border-l-4 ${
                                    activeTab === item.id 
                                    ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold' 
                                    : 'border-transparent text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3 space-y-6">
                    
                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <>
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                    <div className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Learning Time</div>
                                    <div className="text-3xl font-bold text-slate-900">3h 15m</div>
                                    <div className="text-green-600 text-sm mt-1">↑ 20% this week</div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                    <div className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Topics Mastered</div>
                                    <div className="text-3xl font-bold text-slate-900">8</div>
                                    <div className="text-slate-400 text-sm mt-1">Latest: Compound Interest</div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                    <div className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Interventions</div>
                                    <div className="text-3xl font-bold text-slate-900">{alerts.length}</div>
                                    <div className="text-blue-600 text-sm mt-1 cursor-pointer hover:underline">View details</div>
                                </div>
                            </div>

                            {/* Activity Feed / Red Flags */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-800">Recent Activity & Alerts</h3>
                                    <button className="text-blue-600 text-sm font-medium">Download Report</button>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {alerts.length === 0 && (
                                        <div className="p-8 text-center text-slate-500">No alerts to report. Great job!</div>
                                    )}
                                    {alerts.map((alert, i) => (
                                        <div key={i} className="p-6 flex gap-4 hover:bg-slate-50 transition-colors">
                                            <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${alert.type === 'warning' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                                {alert.type === 'warning' ? <ExclamationTriangleIcon className="w-5 h-5" /> : <ShieldCheckIcon className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900">{alert.title}</h4>
                                                <p className="text-slate-600 text-sm mt-1">{alert.message}</p>
                                                <div className="mt-2 inline-flex items-center text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                                    Action: {alert.actionTaken}
                                                </div>
                                            </div>
                                            <div className="ml-auto text-xs text-slate-400 whitespace-nowrap">
                                                {new Date(alert.date).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Mastery Cards */}
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 opacity-10 text-9xl transform translate-x-10 -translate-y-10">🎓</div>
                                <div className="relative z-10">
                                    <h3 className="text-2xl font-bold mb-2">Weekly Highlight</h3>
                                    <p className="text-blue-100 mb-6 max-w-lg">
                                        {childData.nickname} successfully simulated a 10-year investment strategy, turning $10k into $24k using Index Funds.
                                    </p>
                                    <button 
                                        onClick={() => window.print()}
                                        className="bg-white text-blue-700 font-bold py-3 px-6 rounded-lg shadow-md hover:bg-blue-50 transition-colors flex items-center gap-2"
                                    >
                                        <PrinterIcon className="w-5 h-5" />
                                        Print Mastery Certificate
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* BANKING TAB */}
                    {activeTab === 'banking' && (
                        <div className="space-y-6">
                            {/* Card Preview */}
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center gap-8">
                                <div className="relative w-80 h-48 bg-gradient-to-br from-slate-800 to-black rounded-2xl shadow-2xl p-6 text-white flex flex-col justify-between overflow-hidden">
                                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]"></div>
                                    <div className="relative z-10 flex justify-between items-start">
                                        <span className="font-bold tracking-wider">Racked</span>
                                        <div className="w-8 h-8 bg-white/20 rounded-full"></div>
                                    </div>
                                    <div className="relative z-10 font-mono text-lg tracking-widest opacity-80">•••• •••• •••• 4209</div>
                                    <div className="relative z-10 flex justify-between items-end">
                                        <div>
                                            <div className="text-[10px] opacity-60 uppercase">Card Holder</div>
                                            <div className="font-bold uppercase">{childData.nickname}</div>
                                        </div>
                                        <div className="w-12 h-8 bg-white/80 rounded opacity-80"></div>
                                    </div>
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Real Money Mode <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded uppercase align-middle ml-2">Phase 1</span></h3>
                                    <p className="text-slate-500 mb-6">
                                        Link a funding source to enable the Racked Debit Card. Controls allow you to lock the card instantly.
                                    </p>
                                    <button className="w-full md:w-auto bg-slate-900 text-white font-bold py-3 px-6 rounded-lg hover:bg-black transition-colors">
                                        Activate Card (Requires ID)
                                    </button>
                                </div>
                            </div>

                            {/* Allowance Splitter */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-slate-900">Smart Allowance Split</h3>
                                    <span className="text-sm text-slate-500">Next Payout: Friday ($20)</span>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between text-sm font-bold mb-2">
                                            <span className="text-green-600">Spending (50%)</span>
                                            <span className="text-slate-900">$10.00</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-3">
                                            <div className="bg-green-500 h-3 rounded-full" style={{ width: '50%' }}></div>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">Goes to Debit Card</p>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm font-bold mb-2">
                                            <span className="text-blue-600">Savings (30%)</span>
                                            <span className="text-slate-900">$6.00</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-3">
                                            <div className="bg-blue-500 h-3 rounded-full" style={{ width: '30%' }}></div>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">High-Yield Account (4.5% APY)</p>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm font-bold mb-2">
                                            <span className="text-purple-600">Investing (20%)</span>
                                            <span className="text-slate-900">$4.00</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-3">
                                            <div className="bg-purple-500 h-3 rounded-full" style={{ width: '20%' }}></div>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">S&P 500 Fractional Shares (Requires Approval)</p>
                                    </div>
                                </div>
                            </div>

                            {/* Transaction Log */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-700">Recent Transactions</div>
                                <div className="divide-y divide-slate-100">
                                    {MOCK_BANKING.transactions.map((tx) => (
                                        <div key={tx.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.amount > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                                    {tx.amount > 0 ? '+' : '$'}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900">{tx.merchant}</div>
                                                    <div className="text-xs text-blue-600 font-medium">{tx.educationalNote}</div>
                                                </div>
                                            </div>
                                            <div className={`font-mono font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-slate-900'}`}>
                                                {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* EDUCATION TAB (Report Card) */}
                    {activeTab === 'education' && (
                        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 text-center">
                            <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">Certificate of Achievement</h2>
                            <p className="text-slate-500 mb-8">This document certifies that</p>
                            
                            <div className="text-4xl font-bold text-blue-700 mb-4 font-serif border-b-2 border-slate-100 pb-4 inline-block px-12">
                                {childData.nickname}
                            </div>
                            
                            <p className="text-slate-600 max-w-md mx-auto mb-8">
                                Has successfully completed the requirements for <strong className="text-slate-900">{MOCK_CERTIFICATE.level}</strong> in Financial Literacy, demonstrating proficiency in {MOCK_CERTIFICATE.description}
                            </p>
                            
                            <div className="flex justify-center gap-12 mb-8">
                                <div>
                                    <div className="w-32 border-b border-slate-400 mb-2"></div>
                                    <div className="text-xs text-slate-400 uppercase">Date</div>
                                    <div className="text-sm font-bold">{MOCK_CERTIFICATE.date}</div>
                                </div>
                                <div>
                                    <div className="w-32 border-b border-slate-400 mb-2"></div>
                                    <div className="text-xs text-slate-400 uppercase">Signature</div>
                                    <div className="text-sm font-bold font-serif italic">Racked Academy</div>
                                </div>
                            </div>
                            
                            <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 no-print">
                                Print Certificate
                            </button>
                        </div>
                    )}

                </div>
            </div>

            {/* Print Styles handled in global CSS via @media print */}
        </div>
    );
};