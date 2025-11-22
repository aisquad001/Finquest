
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';

// REAL FINANCIAL FEED INTEGRATION
// We use Yahoo Finance via a CORS proxy to get real-time data without a backend.

export interface StockAsset {
    symbol: string;
    name: string;
    category: 'tech' | 'meme' | 'crypto' | 'consumer' | 'index';
    price: number;
    changePercent: number;
    volatility: number; // Used for fallback simulation
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

// Internal State
let marketState = [...ASSET_LIST];

// Setup Listener for Admin Overrides (Crashes/Moons)
let overrideListenerSet = false;
if (!overrideListenerSet) {
    try {
        onSnapshot(doc(db, 'zoo_config', 'market_state'), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                // Admin overrides apply on top of real data
                if (data.event === 'crash') {
                    marketState = marketState.map(s => ({...s, changePercent: s.changePercent - 20}));
                } else if (data.event === 'moon') {
                    marketState = marketState.map(s => ({...s, changePercent: s.changePercent + 50}));
                }
            }
        }, (error) => {
            if (error.code !== 'permission-denied') console.warn("Zoo config sync warning:", error.message);
        });
        overrideListenerSet = true;
    } catch(e) {
        console.warn("Offline mode: Zoo config not synced.");
    }
}

export const getMarketData = () => {
    return marketState;
};

// REAL-TIME FETCH FUNCTION
export const fetchRealMarketData = async (): Promise<StockAsset[]> => {
    try {
        // Map symbols to Yahoo format (Crypto needs -USD)
        const tickers = marketState.map(s => s.category === 'crypto' ? `${s.symbol}-USD` : s.symbol);
        
        // Yahoo Finance Quote Endpoint
        const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${tickers.join(',')}`;
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
        
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const json = await response.json();
        const results = json.quoteResponse?.result || [];

        if (results.length > 0) {
            marketState = marketState.map(asset => {
                const searchSymbol = asset.category === 'crypto' ? `${asset.symbol}-USD` : asset.symbol;
                const quote = results.find((r: any) => r.symbol === searchSymbol);
                
                if (quote && quote.regularMarketPrice) {
                    return {
                        ...asset,
                        price: quote.regularMarketPrice,
                        changePercent: quote.regularMarketChangePercent || 0
                    };
                }
                return asset;
            });
        }
    } catch (e) {
        console.warn("Real-time feed failed, using simulation fallback", e);
        // FALLBACK: Simulate movement if API fails
        marketState = marketState.map(asset => {
             const drift = (Math.random() - 0.5) * asset.volatility * (asset.price * 0.01); 
             let newPrice = asset.price + drift;
             if (newPrice < 0.01) newPrice = 0.01;
             return { ...asset, price: newPrice };
        });
    }
    return marketState;
};

// Generate Chart Data (Mocked history for demo performance, or could fetch real history later)
export const generateChartData = (symbol: string, timeframe: '1D' | '1W' | '1Y') => {
    const asset = marketState.find(a => a.symbol === symbol) || ASSET_LIST[0];
    const points = timeframe === '1D' ? 24 : timeframe === '1W' ? 7 : 30;
    
    let currentPrice = asset.price;
    const data = [];
    
    // Generate a believable chart ending at the current real price
    for (let i = 0; i < points; i++) {
        data.unshift(currentPrice);
        // Reverse walk
        const drift = (Math.random() - 0.5) * asset.volatility * (asset.price * 0.05); 
        currentPrice = currentPrice - drift;
    }
    
    return data;
};
