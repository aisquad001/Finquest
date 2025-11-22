
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { logger } from './logger';

// REAL FINANCIAL FEED INTEGRATION
// We use Yahoo Finance via multiple CORS proxies to get real-time data without a backend.

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

// UPDATED BASE PRICES (2025 Levels)
export const ASSET_LIST: StockAsset[] = [
    // BLUE CHIP / TECH
    { symbol: 'AAPL', name: 'Apple', category: 'tech', price: 230.50, changePercent: 0.5, volatility: 0.02, logo: '🍎' },
    { symbol: 'TSLA', name: 'Tesla', category: 'tech', price: 350.00, changePercent: 2.1, volatility: 0.08, logo: '🚘' },
    { symbol: 'NVDA', name: 'Nvidia', category: 'tech', price: 140.00, changePercent: 1.5, volatility: 0.06, logo: '📟' },
    { symbol: 'MSFT', name: 'Microsoft', category: 'tech', price: 450.00, changePercent: 0.2, volatility: 0.01, logo: '💻' },
    { symbol: 'AMZN', name: 'Amazon', category: 'consumer', price: 195.00, changePercent: 0.8, volatility: 0.03, logo: '📦' },
    
    // MEME STOCKS
    { symbol: 'GME', name: 'GameStop', category: 'meme', price: 25.00, changePercent: -5.0, volatility: 0.15, logo: '🛑' },
    { symbol: 'AMC', name: 'AMC', category: 'meme', price: 5.50, changePercent: -2.0, volatility: 0.12, logo: '🍿' },
    { symbol: 'RBLX', name: 'Roblox', category: 'meme', price: 45.00, changePercent: 3.0, volatility: 0.09, logo: '🧱' },
    
    // CRYPTO
    { symbol: 'BTC', name: 'Bitcoin', category: 'crypto', price: 95000.00, changePercent: 4.0, volatility: 0.10, logo: '🪙' },
    { symbol: 'ETH', name: 'Ethereum', category: 'crypto', price: 2800.00, changePercent: 3.2, volatility: 0.09, logo: '💎' },
    { symbol: 'DOGE', name: 'Dogecoin', category: 'crypto', price: 0.12, changePercent: 10.0, volatility: 0.20, logo: '🐕' },
    
    // CONSUMER
    { symbol: 'NKE', name: 'Nike', category: 'consumer', price: 105.00, changePercent: 0.1, volatility: 0.02, logo: '👟' },
    { symbol: 'DIS', name: 'Disney', category: 'consumer', price: 110.00, changePercent: -0.5, volatility: 0.03, logo: '🏰' },
    { symbol: 'NFLX', name: 'Netflix', category: 'consumer', price: 650.00, changePercent: 1.0, volatility: 0.05, logo: '🎬' },
    { symbol: 'MCD', name: 'McDonalds', category: 'consumer', price: 300.00, changePercent: 0.1, volatility: 0.01, logo: '🍟' },
    { symbol: 'KO', name: 'Coca-Cola', category: 'consumer', price: 62.00, changePercent: 0.0, volatility: 0.01, logo: '🥤' },
    
    // INDICES
    { symbol: 'SPY', name: 'S&P 500', category: 'index', price: 580.00, changePercent: 0.3, volatility: 0.01, logo: '🇺🇸' },
    { symbol: 'QQQ', name: 'Nasdaq', category: 'index', price: 500.00, changePercent: 0.5, volatility: 0.02, logo: '🌐' },
];

// Internal State
let marketState = [...ASSET_LIST];
let isUsingLiveFeed = false;

// Expose status for UI
export const getMarketStatus = () => isUsingLiveFeed ? 'LIVE' : 'SIMULATED';

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
            if (error.code !== 'permission-denied') logger.warn("Zoo config sync warning", error.message);
        });
        overrideListenerSet = true;
    } catch(e) {
        logger.warn("Offline mode: Zoo config not synced.");
    }
}

export const getMarketData = () => {
    return marketState;
};

// --- ROBUST FETCHING UTILS ---

async function fetchYahooQuotes(tickers: string[]) {
    const symbols = tickers.join(',');
    // Yahoo Finance API V7 with Cache Busting
    const yahooUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}&_=${Date.now()}`;

    const proxies = [
        // Strategy 1: AllOrigins Raw (Bypasses JSON wrapping issues)
        { url: (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`, name: 'allorigins-raw' },
        // Strategy 2: Corsproxy.io
        { url: (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`, name: 'corsproxy' },
        // Strategy 3: CodeTabs
        { url: (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`, name: 'codetabs' },
        // Strategy 4: ThingProxy
        { url: (u: string) => `https://thingproxy.freeboard.io/fetch/${u}`, name: 'thingproxy' }
    ];

    for (const proxy of proxies) {
        try {
            const res = await fetch(proxy.url(yahooUrl));
            if (!res.ok) continue;
            
            const data = await res.json();
            
            // Handle potential double-wrapping or different structures
            let result = data.quoteResponse?.result;
            
            // Fallback: Check if data.contents contains the JSON (AllOrigins standard mode sometimes does this)
            if (!result && data.contents) {
                try {
                    const inner = typeof data.contents === 'string' ? JSON.parse(data.contents) : data.contents;
                    result = inner.quoteResponse?.result;
                } catch {}
            }

            if (result && result.length > 0) {
                // logger.info(`Fetched via ${proxy.name}`);
                return result;
            }
        } catch (e: any) {
             // logger.debug(`Proxy ${proxy.name} failed: ${e.message}`);
        }
    }

    throw new Error("All proxies exhausted");
}

// REAL-TIME FETCH FUNCTION
export const fetchRealMarketData = async (): Promise<StockAsset[]> => {
    try {
        // Map symbols to Yahoo format (Crypto needs -USD)
        const tickers = marketState.map(s => s.category === 'crypto' ? `${s.symbol}-USD` : s.symbol);
        
        const results = await fetchYahooQuotes(tickers);

        if (results && results.length > 0) {
            isUsingLiveFeed = true;
            marketState = marketState.map(asset => {
                const searchSymbol = asset.category === 'crypto' ? `${asset.symbol}-USD` : asset.symbol;
                const quote = results.find((r: any) => r.symbol === searchSymbol);
                
                if (quote && (quote.regularMarketPrice || quote.marketState)) {
                    return {
                        ...asset,
                        price: quote.regularMarketPrice || quote.price || asset.price,
                        changePercent: quote.regularMarketChangePercent || quote.changePercent || 0
                    };
                }
                return asset;
            });
            // logger.info("✅ Market data updated via live feed.");
        }
    } catch (e: any) {
        isUsingLiveFeed = false;
        // logger.warn("⚠️ Feed failed, using simulation.", { error: e.message });
        
        // FALLBACK: Simulate VISIBLE movement if API fails
        marketState = marketState.map(asset => {
             // 1. Drift: Random walk based on volatility
             // We increase the multiplier here (0.05 -> 0.15) so user sees movement even if offline
             const driftPct = (Math.random() - 0.5) * asset.volatility * 0.15; 
             let newPrice = asset.price * (1 + driftPct);
             if (newPrice < 0.01) newPrice = 0.01;
             
             // 2. Update Change Percent visually
             // We slowly gravitate change percent towards the day's random trend
             const newChange = asset.changePercent + (driftPct * 100);
             
             return { ...asset, price: newPrice, changePercent: newChange };
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
