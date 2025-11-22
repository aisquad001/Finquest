
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeftIcon, BoltIcon, ChartBarIcon, ClockIcon, InformationCircleIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, GlobeAltIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
import { Portfolio, Stock, calculateRiskScore, Transaction, LeaderboardEntry, getMockLeaderboard } from '../services/gamification';
import { getMarketData, fetchRealMarketData, generateChartData, StockAsset, getMarketStatus } from '../services/stockMarket';
import { playSound } from '../services/audio';

interface WallStreetZooProps {
    portfolio: Portfolio;
    onUpdatePortfolio: (newPortfolio: Portfolio) => void;
    onClose: () => void;
}

const StockRow: React.FC<{ stock: StockAsset; ownedQty?: number; onSelect: (stock: StockAsset) => void }> = ({ stock, ownedQty, onSelect }) => (
    <motion.div 
        onClick={() => { playSound('pop'); onSelect(stock); }}
        layoutId={`stock-${stock.symbol}`}
        className="bg-[#2a1b3d] border border-white/10 p-4 rounded-2xl flex items-center justify-between mb-3 cursor-pointer active:scale-95 transition-transform"
    >
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-2xl shadow-inner">
                {stock.logo}
            </div>
            <div>
                <div className="font-bold text-white leading-none">{stock.symbol}</div>
                <div className="text-[10px] text-gray-400">{stock.name}</div>
                {ownedQty && ownedQty > 0 ? (
                    <div className="text-[10px] text-neon-blue font-bold mt-0.5">
                        Owned: ${(ownedQty * stock.price).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                ) : null}
            </div>
        </div>
        <div className="text-right">
            <div className="font-mono font-bold text-white">${stock.price.toFixed(2)}</div>
            <div className={`text-xs font-black flex items-center justify-end gap-1 ${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stock.changePercent >= 0 ? <ArrowTrendingUpIcon className="w-3 h-3" /> : <ArrowTrendingDownIcon className="w-3 h-3" />}
                {Math.abs(stock.changePercent).toFixed(2)}%
            </div>
        </div>
    </motion.div>
);

const LineChart = ({ data, color }: { data: number[], color: string }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((val - min) / range) * 100;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            <path 
                d={`M ${points}`} 
                fill="none" 
                stroke={color} 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
            />
            <path 
                d={`M ${points} L 100,110 L 0,110 Z`} 
                fill={color} 
                fillOpacity="0.1" 
                stroke="none"
            />
        </svg>
    );
};

export const WallStreetZoo: React.FC<WallStreetZooProps> = ({ portfolio, onUpdatePortfolio, onClose }) => {
    const [activeTab, setActiveTab] = useState<'market' | 'portfolio' | 'rankings'>('market');
    const [marketData, setMarketData] = useState<StockAsset[]>(getMarketData());
    const [feedStatus, setFeedStatus] = useState<string>('CONNECTING...');
    const [selectedStock, setSelectedStock] = useState<StockAsset | null>(null);
    const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
    const [tradeAmount, setTradeAmount] = useState<string>('');
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(getMockLeaderboard());

    // --- REAL DATA POLL LOOP ---
    useEffect(() => {
        const updateMarket = async () => {
            const updatedData = await fetchRealMarketData();
            setMarketData([...updatedData]); // Trigger re-render with new prices
            setFeedStatus(getMarketStatus());
        };

        updateMarket(); // Initial fetch
        const interval = setInterval(updateMarket, 5000); // Poll every 5s for faster feedback
        return () => clearInterval(interval);
    }, []);

    // --- Derived State ---
    const currentNetWorth = useMemo(() => {
        let value = portfolio.cash;
        Object.entries(portfolio.holdings).forEach(([sym, qty]) => {
            const stock = marketData.find(s => s.symbol === sym);
            if (stock) value += stock.price * (qty as number);
        });
        return value;
    }, [portfolio, marketData]);

    const riskScore = calculateRiskScore(portfolio);
    
    // Risk Animal Logic
    let riskAnimal = { emoji: '🐢', name: 'Chill Turtle', color: 'text-green-400' };
    if (riskScore > 3 && riskScore <= 7) riskAnimal = { emoji: '🐈', name: 'Balanced Cat', color: 'text-yellow-400' };
    if (riskScore > 7) riskAnimal = { emoji: '🦍', name: 'Degenerate Ape', color: 'text-red-500' };

    const handleTrade = () => {
        if (!selectedStock || !tradeAmount) return;
        const amount = parseFloat(tradeAmount);
        if (isNaN(amount) || amount <= 0) {
            alert("Enter a valid amount");
            return;
        }

        const price = selectedStock.price;
        const qty = amount / price;
        const newPortfolio = { ...portfolio };
        
        if (tradeType === 'buy') {
            if (newPortfolio.cash < amount) {
                playSound('error');
                alert("You're broke! Sell something first.");
                return;
            }
            newPortfolio.cash -= amount;
            newPortfolio.holdings[selectedStock.symbol] = (newPortfolio.holdings[selectedStock.symbol] || 0) + qty;
            playSound('kaching');
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
            if (newPortfolio.holdings[selectedStock.symbol] <= 0.0001) {
                delete newPortfolio.holdings[selectedStock.symbol];
            }
            playSound('coin');
        }

        // Record Transaction
        const tx: Transaction = {
            id: Date.now().toString(),
            symbol: selectedStock.symbol,
            type: tradeType,
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
            colors: tradeType === 'buy' ? ['#00FF88', '#FFFFFF'] : ['#FF00B8', '#FFFFFF']
        });
        
        setTradeAmount('');
        setSelectedStock(null);
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#0f0518] flex flex-col font-body">
            
            {/* HEADER */}
            <div className="p-4 flex items-center justify-between bg-[#1a0b2e]/80 backdrop-blur-md border-b border-white/10 z-20">
                <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
                    <ArrowLeftIcon className="w-5 h-5 text-white" />
                </button>
                <div className="flex flex-col items-center">
                    <h1 className="font-game text-lg text-white tracking-wider">WALL STREET ZOO</h1>
                    <div className={`flex items-center gap-1 text-[10px] font-mono transition-colors ${feedStatus === 'LIVE' ? 'text-neon-green' : 'text-yellow-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${feedStatus === 'LIVE' ? 'bg-neon-green animate-pulse' : 'bg-yellow-500'}`}></span>
                        {feedStatus === 'LIVE' ? 'LIVE FEED' : 'SIMULATED FEED'}
                    </div>
                </div>
                <div className="w-9"></div>
            </div>

            {/* NEWS TICKER */}
            <div className="bg-black py-1 overflow-hidden border-b border-white/5">
                <div className="whitespace-nowrap animate-[shimmer_10s_linear_infinite] text-[10px] font-mono text-gray-400 flex gap-8">
                    <span>🚀 TSLA +2.4%</span>
                    <span>📉 INFLATION HITS 3.2%</span>
                    <span>🦍 APES HOLDING STRONG</span>
                    <span>💎 BITCOIN TO MOON</span>
                    <span>🍎 APPLE RELEASES IPHONE 25</span>
                </div>
            </div>

            {/* SCROLLABLE BODY */}
            <div className="flex-1 overflow-y-auto pb-24">
                
                {/* PORTFOLIO SUMMARY */}
                <div className="p-6 bg-gradient-to-b from-[#1a0b2e] to-[#0f0518]">
                    <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1 text-center">Total Net Worth</div>
                    <div className="font-game text-5xl text-center text-white mb-4 tracking-tight">
                        ${currentNetWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    
                    <div className="h-32 w-full bg-black/20 rounded-xl border border-white/5 p-4 mb-6 relative overflow-hidden">
                         <LineChart 
                            data={generateChartData('SPY', '1W')} // Mock history of user portfolio
                            color="#00C2FF" 
                         />
                         <div className="absolute top-2 left-2 text-xs font-bold text-neon-blue">7 Day Performance</div>
                    </div>

                    {/* STATS ROW */}
                    <div className="flex gap-3">
                        <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/5">
                            <div className="text-[10px] text-gray-400 uppercase font-bold">Cash Available</div>
                            <div className="font-mono font-bold text-white text-lg">
                                ${portfolio.cash.toLocaleString(undefined, { notation: 'compact' })}
                            </div>
                        </div>
                        <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/5">
                            <div className="text-[10px] text-gray-400 uppercase font-bold">Risk Level</div>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">{riskAnimal.emoji}</span>
                                <span className={`font-bold text-sm ${riskAnimal.color}`}>{riskScore}/10</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* TABS */}
                <div className="sticky top-0 z-30 bg-[#0f0518]/90 backdrop-blur-md border-b border-white/10 flex p-2 gap-2">
                    {[
                        { id: 'market', label: 'Explore' },
                        { id: 'portfolio', label: 'My Assets' },
                        { id: 'rankings', label: 'Leaderboard' }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => { playSound('click'); setActiveTab(tab.id as any); }}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:bg-white/5'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* TAB CONTENT */}
                <div className="p-4 min-h-[300px]">
                    {activeTab === 'market' && (
                        <div>
                             <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                 <GlobeAltIcon className="w-4 h-4 text-neon-blue" /> Trending Now
                             </h3>
                             {marketData.map(stock => (
                                 <StockRow key={stock.symbol} stock={stock} ownedQty={portfolio.holdings[stock.symbol]} onSelect={setSelectedStock} />
                             ))}
                        </div>
                    )}

                    {activeTab === 'portfolio' && (
                        Object.keys(portfolio.holdings).length === 0 ? (
                            <div className="text-center py-12 opacity-50">
                                <div className="text-6xl mb-4">🕸️</div>
                                <p>No assets found.</p>
                                <button onClick={() => setActiveTab('market')} className="text-neon-blue underline mt-2">Go Shopping</button>
                            </div>
                        ) : (
                            <div>
                                {marketData.filter(s => portfolio.holdings[s.symbol]).map(stock => (
                                    <StockRow key={stock.symbol} stock={stock} ownedQty={portfolio.holdings[stock.symbol]} onSelect={setSelectedStock} />
                                ))}
                            </div>
                        )
                    )}

                    {activeTab === 'rankings' && (
                        <div className="space-y-2">
                            <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl mb-6 flex items-center gap-4">
                                <div className="text-4xl">🏆</div>
                                <div>
                                    <h3 className="font-bold text-yellow-400 text-sm uppercase">Weekly Challenge</h3>
                                    <p className="text-xs text-yellow-100">Highest returns wins 50,000 Coins!</p>
                                </div>
                            </div>
                            {leaderboard.map((entry, i) => (
                                <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
                                    <div className={`font-black text-lg w-6 text-center ${i < 3 ? 'text-yellow-400' : 'text-gray-500'}`}>
                                        {entry.rank}
                                    </div>
                                    <div className="text-2xl">{entry.avatar}</div>
                                    <div className="flex-1">
                                        <div className="font-bold text-white text-sm">{entry.name}</div>
                                        <div className="text-xs text-gray-400">{entry.country}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-mono font-bold text-white text-sm">${(entry.netWorth || 0).toLocaleString()}</div>
                                        <div className="text-[10px] text-green-400 font-bold">
                                            +{Math.floor(Math.random() * 20)}%
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* TRADE MODAL */}
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

                        <div className="flex-1 p-6 overflow-y-auto">
                             <div className="text-center mb-8">
                                 <div className="text-6xl mb-4 animate-bounce">{selectedStock.logo}</div>
                                 <div className="font-mono text-5xl font-bold text-white tracking-tighter">${selectedStock.price.toFixed(2)}</div>
                                 <div className={`inline-block px-3 py-1 rounded-lg font-bold mt-2 ${selectedStock.changePercent >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                     {selectedStock.changePercent > 0 ? '▲' : '▼'} {Math.abs(selectedStock.changePercent).toFixed(2)}% Today
                                 </div>
                             </div>

                             <div className="h-40 w-full bg-black/40 rounded-2xl border border-white/10 p-4 mb-8 relative overflow-hidden">
                                 <LineChart 
                                    data={generateChartData(selectedStock.symbol, '1D')}
                                    color={selectedStock.changePercent >= 0 ? '#00FF88' : '#EF4444'} 
                                 />
                             </div>

                             {/* BUY/SELL TOGGLE */}
                             <div className="bg-white/10 p-1 rounded-xl flex mb-6">
                                 <button 
                                    onClick={() => setTradeType('buy')}
                                    className={`flex-1 py-3 rounded-lg font-black text-lg transition-all ${tradeType === 'buy' ? 'bg-green-500 text-black shadow-lg' : 'text-gray-400'}`}
                                 >
                                     BUY
                                 </button>
                                 <button 
                                    onClick={() => setTradeType('sell')}
                                    className={`flex-1 py-3 rounded-lg font-black text-lg transition-all ${tradeType === 'sell' ? 'bg-red-500 text-white shadow-lg' : 'text-gray-400'}`}
                                 >
                                     SELL
                                 </button>
                             </div>

                             {/* AMOUNT INPUT */}
                             <div className="mb-8">
                                 <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Amount (USD)</label>
                                 <div className="relative">
                                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400">$</span>
                                     <input 
                                        type="number" 
                                        value={tradeAmount}
                                        onChange={(e) => setTradeAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-black/50 border-2 border-white/20 rounded-2xl py-4 pl-10 pr-4 text-3xl font-bold text-white focus:border-neon-blue outline-none"
                                     />
                                 </div>
                                 <div className="text-right text-xs text-gray-400 mt-2">
                                     Available Cash: ${portfolio.cash.toLocaleString()}
                                 </div>
                             </div>

                             <button 
                                onClick={handleTrade}
                                className={`w-full py-4 rounded-2xl font-black text-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] active:scale-95 transition-transform
                                    ${tradeType === 'buy' ? 'bg-green-500 text-black hover:bg-green-400' : 'bg-red-500 text-white hover:bg-red-400'}
                                `}
                             >
                                 CONFIRM {tradeType.toUpperCase()}
                             </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
