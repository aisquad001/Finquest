
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';

// POLYGON.IO Integration Note:
// In a real production build, you would fetch from: https://api.polygon.io/v2/aggs/ticker/{ticker}/range/1/day/...
// For this "Live-Ready" demo, we implement a robust simulation engine that mimics real market behavior
// so the app works instantly for anyone who clones it without needing an API key immediately.

export interface StockAsset {
    symbol: string;
    name: string;
    category: 'tech' | 'meme' | 'crypto' | 'consumer' | 'index';
    price: number;
    changePercent: number;
    volatility: number; // 0-1: How much it moves
    logo: string; // Emoji or URL
    active?: boolean;
}

export const ASSET_LIST: StockAsset[] = [
    // BLUE CHIP / TECH
    { symbol: 'AAPL', name: 'Apple', category: 'tech', price: 185.50, changePercent: 0.5, volatility: 0.02, logo: '🍎' },
    { symbol: 'TSLA', name: 'Tesla', category: 'tech', price: 240.00, changePercent: 2.1, volatility: 0.08, logo: '🚘' },
    { symbol: 'NVDA', name: 'Nvidia', category: 'tech', price: 480.00, changePercent: 1.5, volatility: 0.06, logo: '📟' },
    { symbol: 'MSFT', name: 'Microsoft', category: 'tech', price: 390.00, changePercent: 0.2, volatility: 0.01, logo: '💻' },
    { symbol: 'AMZN', name: 'Amazon', category: 'consumer', price: 155.00, changePercent: 0.8, volatility: 0.03, logo: '📦' },
    
    // MEME STOCKS
    { symbol: 'GME', name: 'GameStop', category: 'meme', price: 22.00, changePercent: -5.0, volatility: 0.15, logo: '🛑' },
    { symbol: 'AMC', name: 'AMC', category: 'meme', price: 4.50, changePercent: -2.0, volatility: 0.12, logo: '🍿' },
    { symbol: 'RBLX', name: 'Roblox', category: 'meme', price: 38.00, changePercent: 3.0, volatility: 0.09, logo: '🧱' },
    
    // CRYPTO
    { symbol: 'BTC', name: 'Bitcoin', category: 'crypto', price: 42000.00, changePercent: 4.0, volatility: 0.10, logo: '🪙' },
    { symbol: 'ETH', name: 'Ethereum', category: 'crypto', price: 2250.00, changePercent: 3.2, volatility: 0.09, logo: '💎' },
    { symbol: 'DOGE', name: 'Dogecoin', category: 'crypto', price: 0.08, changePercent: 10.0, volatility: 0.20, logo: '🐕' },
    
    // CONSUMER
    { symbol: 'NKE', name: 'Nike', category: 'consumer', price: 95.00, changePercent: 0.1, volatility: 0.02, logo: '👟' },
    { symbol: 'DIS', name: 'Disney', category: 'consumer', price: 92.00, changePercent: -0.5, volatility: 0.03, logo: '🏰' },
    { symbol: 'NFLX', name: 'Netflix', category: 'consumer', price: 460.00, changePercent: 1.0, volatility: 0.05, logo: '🎬' },
    { symbol: 'MCD', name: 'McDonalds', category: 'consumer', price: 290.00, changePercent: 0.1, volatility: 0.01, logo: '🍟' },
    { symbol: 'KO', name: 'Coca-Cola', category: 'consumer', price: 58.00, changePercent: 0.0, volatility: 0.01, logo: '🥤' },
    
    // INDICES
    { symbol: 'SPY', name: 'S&P 500', category: 'index', price: 475.00, changePercent: 0.3, volatility: 0.01, logo: '🇺🇸' },
    { symbol: 'QQQ', name: 'Nasdaq', category: 'index', price: 405.00, changePercent: 0.5, volatility: 0.02, logo: '🌐' },
];

// Simulation State
let marketState = [...ASSET_LIST];

// Setup Listener for Admin Overrides
let overrideListenerSet = false;
if (!overrideListenerSet) {
    try {
        onSnapshot(doc(db, 'zoo_config', 'market_state'), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                // Apply global market events
                if (data.event === 'crash') {
                    marketState = marketState.map(s => ({...s, price: s.price * 0.8, changePercent: -20}));
                } else if (data.event === 'moon') {
                    marketState = marketState.map(s => ({...s, price: s.price * 1.5, changePercent: 50}));
                }
            }
        }, (error) => {
            // Suppress permission errors in console for non-admin users
            if (error.code !== 'permission-denied') {
                console.warn("Zoo config sync warning:", error.message);
            }
        });
        overrideListenerSet = true;
    } catch(e) {
        console.warn("Offline mode: Zoo config not synced.");
    }
}

export const getMarketData = () => {
    return marketState;
};

// Run a simulation step to update prices based on volatility
export const simulateMarketMovement = () => {
    marketState = marketState.map(asset => {
        const drift = (Math.random() - 0.5) * 2; // -1 to 1
        const change = drift * asset.volatility * (asset.price * 0.01); // Move relative to price and volatility
        
        let newPrice = asset.price + change;
        if (newPrice < 0.01) newPrice = 0.01; // Prevent negative prices

        // Calculate change percent relative to opening (mocked as static for this session)
        const original = ASSET_LIST.find(a => a.symbol === asset.symbol)?.price || asset.price;
        const percent = ((newPrice - original) / original) * 100;

        return {
            ...asset,
            price: newPrice,
            changePercent: percent
        };
    });
    return marketState;
};

export const generateChartData = (symbol: string, timeframe: '1D' | '1W' | '1Y') => {
    const asset = ASSET_LIST.find(a => a.symbol === symbol) || ASSET_LIST[0];
    const points = timeframe === '1D' ? 24 : timeframe === '1W' ? 7 : 30;
    
    let currentPrice = asset.price;
    const data = [];
    
    for (let i = 0; i < points; i++) {
        // Reverse walk
        data.unshift(currentPrice);
        const drift = (Math.random() - 0.5) * asset.volatility * 20; 
        currentPrice = currentPrice - drift;
    }
    
    return data;
};
