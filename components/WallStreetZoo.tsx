/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useMemo } from 'react';
import { ArrowLeftIcon, BoltIcon, ChartBarIcon, ClockIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
import { STOCK_UNIVERSE, Portfolio, Stock, calculateRiskScore, generateStockHistory, Transaction } from '../services/gamification';
import { playSound } from '../services/audio';

interface WallStreetZooProps {
    portfolio: Portfolio;
    onUpdatePortfolio: (newPortfolio: Portfolio) => void;
    onClose: () => void;
}

export const WallStreetZoo: React.FC<WallStreetZooProps> = ({ portfolio, onUpdatePortfolio, onClose }) => {
    const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
    const [timeframe, setTimeframe] = useState<'1D' | '1Y' | '5Y'>('1D');
    const [activeTab, setActiveTab] = useState<'market' | 'holdings'>('market');

    // --- Derived State ---
    const totalHoldingsValue = Object.entries(portfolio.holdings).reduce((acc, [sym, qty]) => {
        const stock = STOCK_UNIVERSE.find(s => s.symbol === sym);
        return acc + (stock ? stock.price * (qty as number) : 0);
    }, 0);
    const netWorth = portfolio.cash + totalHoldingsValue;
    const riskScore = calculateRiskScore(portfolio);

    // Risk Animal Logic
    let riskAnimal = { emoji: '🐢', name: 'Chill Turtle', color: 'text-green-400' };
    if (riskScore > 3 && riskScore <= 7) riskAnimal = { emoji: '🐈', name: 'Balanced Cat', color: 'text-yellow-400' };
    if (riskScore > 7) riskAnimal = { emoji: '🦍', name: 'Degenerate Ape', color: 'text-red-500' };

    // --- Actions ---
    const handleTrade = (type: 'buy' | 'sell', amount: number) => {
        if (!selectedStock) return;
        
        playSound('coin');
        const price = selectedStock.price;
        // Simple quantity calculation (fractional shares allowed for gameplay)
        const qty = amount / price;

        const newPortfolio = { ...portfolio };
        
        if (type === 'buy') {
             if (newPortfolio.cash < amount) {
                 playSound('error');
                 alert("You're broke! Sell something first.");
                 return;
             }
             newPortfolio.cash -= amount;
             newPortfolio.holdings[selectedStock.symbol] = (newPortfolio.holdings[selectedStock.symbol] || 0) + qty;
        } else {
             const currentQty = newPortfolio.holdings[selectedStock.symbol] || 0;
             const currentValue = currentQty * price;
             if (currentValue < amount) {
                 playSound('error');
                 alert("You don't own that much!");
                 return;
             }
             newPortfolio.cash += amount;
             newPortfolio.holdings[selectedStock.symbol] = currentQty - qty;
             // Clean up if 0
             if (newPortfolio.holdings[selectedStock.symbol] <= 0.0001) {
                 delete newPortfolio.holdings[selectedStock.symbol];
             }
        }

        // Record Transaction
        const tx: Transaction = {
            id: Date.now().toString(),
            symbol: selectedStock.symbol,
            type,
            amount,
            price,
            quantity: qty,
            date: new Date().toISOString()
        };
        newPortfolio.transactions.unshift(tx);

        onUpdatePortfolio(newPortfolio);
        
        (window as any).confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.8 },
            colors: type === 'buy' ? ['#00FF88', '#FFFFFF'] : ['#FF00B8', '#FFFFFF']
        });

        setSelectedStock(null);
    };

    // --- Components ---

    const StockCard: React.FC<{ stock: Stock, ownedQty?: number }> = ({ stock, ownedQty }) => (
        <motion.button
            onClick={() => { playSound('pop'); setSelectedStock(stock); }}
            layoutId={`stock-${stock.symbol}`}
            className="w-full bg-[#2a1b3d] border border-white/10 p-4 rounded-2xl flex items-center justify-between mb-3 hover:bg-white/5 transition-colors group btn-3d"
        >
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-black/30 rounded-xl flex items-center justify-center text-2xl border border-white/10 group-hover:scale-110 transition-transform">
                    {stock.mascot}
                </div>
                <div className="text-left">
                    <div className="font-bold text-white leading-none">{stock.symbol}</div>
                    <div className="text-xs text-gray-400">{stock.name}</div>
                    {ownedQty && ownedQty > 0 && (
                        <div className="text-[10px] text-neon-blue font-bold mt-1">
                            Owned: ${(ownedQty * stock.price).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                    )}
                </div>
            </div>
            <div className="text-right">
                <div className="font-mono font-bold text-white">${stock.price.toFixed(2)}</div>
                <div className={`text-xs font-black px-2 py-0.5 rounded-md ${stock.changePercent >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {stock.changePercent > 0 ? '+' : ''}{stock.changePercent}%
                </div>
            </div>
        </motion.button>
    );

    const SimpleChart = ({ data, color }: { data: number[], color: string }) => {
        const max = Math.max(...data);
        const min = Math.min(...data);
        const range = max - min;
        const points = data.map((val, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - ((val - min) / range) * 100;
            return `${x},${y}`;
        }).join(' ');

        return (
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible preserve-3d">
                <polyline 
                    fill="none" 
                    stroke={color} 
                    strokeWidth="2" 
                    points={points} 
                    vectorEffect="non-scaling-stroke"
                />
                {/* Gradient fill below area */}
                <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.2"/>
                    <stop offset="100%" stopColor={color} stopOpacity="0"/>
                </linearGradient>
                 <polyline 
                    fill="url(#grad)" 
                    stroke="none" 
                    points={`0,100 ${points} 100,100`} 
                />
            </svg>
        );
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#120b1e] flex flex-col overflow-hidden font-body">
            
            {/* TOP NAV */}
            <div className="p-4 flex items-center justify-between bg-[#1a0b2e] border-b border-white/5 z-20">
                <button onClick={onClose} className="p-2 bg-white/10 rounded-full">
                    <ArrowLeftIcon className="w-6 h-6 text-white" />
                </button>
                <div className="flex flex-col items-center">
                    <span className="font-game text-xl text-white tracking-wider">WALL STREET ZOO</span>
                    <span className="text-[10px] font-mono text-neon-green flex items-center gap-1">
                         <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></span>
                         MARKET OPEN
                    </span>
                </div>
                <div className="w-10"></div> {/* Spacer */}
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto pb-24">
                
                {/* PORTFOLIO HEADER */}
                <div className="p-6 bg-gradient-to-b from-[#1a0b2e] to-[#120b1e] relative overflow-hidden">
                     {/* Background Grid */}
                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] opacity-5"></div>

                     <div className="relative z-10 text-center">
                         <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Net Worth</div>
                         <div className="font-game text-5xl text-white mb-2 animate-pulse-fast">
                             ${netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                         </div>
                         <div className="flex items-center justify-center gap-2 text-sm font-bold mb-6">
                             <span className="text-neon-blue flex items-center gap-1">
                                 Cash: ${portfolio.cash.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                             </span>
                             <span className="text-gray-600">|</span>
                             <span className="text-green-400 flex items-center gap-1">
                                 +4.2% Today
                             </span>
                         </div>

                         {/* MAIN GRAPH */}
                         <div className="h-32 w-full mb-6 relative">
                             <SimpleChart 
                                data={[netWorth * 0.9, netWorth * 0.95, netWorth * 0.92, netWorth * 0.98, netWorth]} 
                                color="#00FF88" 
                             />
                             {/* Time Warp Toggle */}
                             <div className="absolute top-0 right-0 flex bg-black/40 rounded-lg p-1 border border-white/10">
                                 {['1D', '1Y', '5Y'].map(t => (
                                     <button 
                                        key={t} 
                                        onClick={() => setTimeframe(t as any)}
                                        className={`px-2 py-1 text-[10px] font-bold rounded ${timeframe === t ? 'bg-white text-black' : 'text-gray-400'}`}
                                    >
                                        {t}
                                    </button>
                                 ))}
                             </div>
                         </div>

                         {/* RISK METER */}
                         <div className="bg-black/30 rounded-xl p-3 border border-white/5 flex items-center justify-between">
                             <div className="text-left">
                                 <div className="text-[10px] text-gray-500 uppercase font-bold">Risk Animal</div>
                                 <div className={`font-game text-lg leading-none ${riskAnimal.color}`}>{riskAnimal.name}</div>
                             </div>
                             <div className="text-4xl animate-bounce">{riskAnimal.emoji}</div>
                             <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden relative">
                                 <div 
                                    className={`absolute top-0 left-0 h-full w-1/3 bg-green-400 rounded-full opacity-30`}
                                 ></div>
                                 <div 
                                    className={`absolute top-0 left-1/3 h-full w-1/3 bg-yellow-400 rounded-full opacity-30`}
                                 ></div>
                                 <div 
                                    className={`absolute top-0 right-0 h-full w-1/3 bg-red-500 rounded-full opacity-30`}
                                 ></div>
                                 {/* Indicator */}
                                 <div 
                                    className="absolute top-0 h-full w-1 bg-white shadow-[0_0_10px_white]"
                                    style={{ left: `${(riskScore / 10) * 100}%` }}
                                 ></div>
                             </div>
                         </div>
                     </div>
                </div>

                {/* TABS */}
                <div className="sticky top-0 z-30 bg-[#120b1e]/90 backdrop-blur-md p-4 flex gap-4 border-b border-white/5">
                    <button 
                        onClick={() => setActiveTab('market')}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'market' ? 'bg-white text-black' : 'bg-white/5 text-gray-400'}`}
                    >
                        Market
                    </button>
                    <button 
                        onClick={() => setActiveTab('holdings')}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'holdings' ? 'bg-white text-black' : 'bg-white/5 text-gray-400'}`}
                    >
                        My Portfolio
                    </button>
                </div>

                {/* LIST */}
                <div className="p-4">
                    {activeTab === 'market' ? (
                        STOCK_UNIVERSE.map(stock => (
                            <StockCard key={stock.symbol} stock={stock} ownedQty={portfolio.holdings[stock.symbol]} />
                        ))
                    ) : (
                        Object.keys(portfolio.holdings).length === 0 ? (
                            <div className="text-center text-gray-500 py-12">
                                <div className="text-4xl mb-4">🕸️</div>
                                <p>Your portfolio is empty.</p>
                                <p className="text-xs">Go buy some stonks!</p>
                            </div>
                        ) : (
                            STOCK_UNIVERSE
                                .filter(s => portfolio.holdings[s.symbol])
                                .map(stock => (
                                    <StockCard key={stock.symbol} stock={stock} ownedQty={portfolio.holdings[stock.symbol]} />
                                ))
                        )
                    )}
                </div>
            </div>

            {/* STOCK DETAIL MODAL */}
            <AnimatePresence>
                {selectedStock && (
                    <motion.div 
                        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                        className="fixed inset-0 z-[60] bg-[#1a0b2e] flex flex-col"
                    >
                         {/* Modal Header */}
                        <div className="p-4 flex items-center justify-between border-b border-white/10 bg-black/20">
                            <button onClick={() => setSelectedStock(null)} className="p-2 bg-white/10 rounded-full">
                                <ArrowLeftIcon className="w-6 h-6 text-white" />
                            </button>
                            <h2 className="font-game text-xl text-white">{selectedStock.name}</h2>
                            <div className="w-10"></div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                             {/* Big Price */}
                             <div className="text-center mb-8">
                                 <div className="text-6xl mb-2">{selectedStock.mascot}</div>
                                 <div className="font-mono text-4xl font-bold text-white mb-1">${selectedStock.price.toFixed(2)}</div>
                                 <div className={`inline-block px-3 py-1 rounded-lg font-bold ${selectedStock.changePercent >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                     {selectedStock.changePercent > 0 ? '▲' : '▼'} {Math.abs(selectedStock.changePercent)}% Today
                                 </div>
                             </div>

                             {/* Context / Explainer */}
                             <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 mb-6 flex items-start gap-3">
                                 <InformationCircleIcon className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                                 <div>
                                     <h4 className="font-bold text-blue-300 text-sm uppercase mb-1">Why did it move?</h4>
                                     <p className="text-sm text-blue-100 italic">"{selectedStock.whyMoved}"</p>
                                 </div>
                             </div>

                             {/* Fake History Graph */}
                             <div className="h-40 w-full bg-black/20 rounded-2xl border border-white/5 p-4 mb-6">
                                 <SimpleChart 
                                    data={generateStockHistory(selectedStock)} 
                                    color={selectedStock.changePercent >= 0 ? '#00FF88' : '#EF4444'} 
                                 />
                             </div>

                             {/* Risk Info */}
                             <div className="flex items-center gap-4 mb-8">
                                 <div className="flex-1 bg-white/5 rounded-xl p-3 text-center">
                                     <div className="text-[10px] text-gray-500 uppercase font-bold">Category</div>
                                     <div className="font-bold text-white capitalize">{selectedStock.category}</div>
                                 </div>
                                 <div className="flex-1 bg-white/5 rounded-xl p-3 text-center">
                                     <div className="text-[10px] text-gray-500 uppercase font-bold">Risk Level</div>
                                     <div className={`font-bold ${selectedStock.risk > 7 ? 'text-red-500' : selectedStock.risk > 4 ? 'text-yellow-400' : 'text-green-400'}`}>
                                        {selectedStock.risk}/10
                                     </div>
                                 </div>
                             </div>

                             {/* Action Buttons */}
                             <div className="grid grid-cols-2 gap-4 mb-8">
                                 <button 
                                    onClick={() => handleTrade('sell', 1000)}
                                    disabled={!portfolio.holdings[selectedStock.symbol]}
                                    className="py-4 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/50 font-black text-xl disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-transform"
                                 >
                                     SELL
                                 </button>
                                 <button 
                                     onClick={() => handleTrade('buy', 1000)}
                                     className="py-4 rounded-2xl bg-green-500 text-black font-black text-xl shadow-[0_0_20px_rgba(0,255,136,0.4)] active:scale-95 transition-transform"
                                 >
                                     BUY $1k
                                 </button>
                             </div>

                             {/* Regret Simulator (Fun Feature) */}
                             <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
                                 <h4 className="text-xs text-gray-400 uppercase font-bold mb-2">Time Machine</h4>
                                 <p className="text-sm text-gray-300">
                                     If you bought $500 of {selectedStock.name} in 2015, you'd have <span className="text-neon-yellow font-bold">${(500 * (1 + (Math.random() * 10))).toFixed(0)}</span> today.
                                 </p>
                             </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};