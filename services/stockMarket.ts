
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

async function tryProxy(url: string, proxyName: string): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout
    
    try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return await res.json();
    } catch (e: any) {
        clearTimeout(timeoutId);
        throw new Error(`${proxyName} failed: ${e.message}`);
    }
}

async function fetchYahooQuotes(tickers: string[]) {
    const symbols = tickers.join(',');
    // Yahoo Finance API V7
    const yahooUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`;

    // STRATEGY 1: Corsproxy.io
    // Usually fast and reliable
    try {
        const data = await tryProxy(`https://corsproxy.io/?${encodeURIComponent(yahooUrl)}`, 'corsproxy');
        if (data.quoteResponse?.result) return data.quoteResponse.result;
        throw new Error("Invalid data structure");
    } catch (e: any) {
        logger.warn(`Proxy 1 skipped: ${e.message}`);
    }

    // STRATEGY 2: AllOrigins
    // Reliable but wraps response in JSON
    try {
        const data = await tryProxy(`https://api.allorigins.win/get?url=${encodeURIComponent(yahooUrl)}&t=${Date.now()}`, 'allorigins');
        if (data.contents) {
             const inner = JSON.parse(data.contents);
             if (inner.quoteResponse?.result) return inner.quoteResponse.result;
        }
        throw new Error("Invalid data structure");
    } catch (e: any) {
        logger.warn(`Proxy 2 skipped: ${e.message}`);
    }

    // STRATEGY 3: CodeTabs
    // Good backup
    try {
         const data = await tryProxy(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(yahooUrl)}`, 'codetabs');
         if (data.quoteResponse?.result) return data.quoteResponse.result;
         throw new Error("Invalid data structure");
    } catch (e: any) {
        logger.warn(`Proxy 3 skipped: ${e.message}`);
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
            logger.info("✅ Market data updated via live feed.");
        }
    } catch (e: any) {
        logger.warn("⚠️ Real-time feed failed, using simulation fallback.", { error: e.message });
        
        // FALLBACK: Simulate movement if API fails so app doesn't feel broken
        marketState = marketState.map(asset => {
             // Random walk with mean reversion logic
             const drift = (Math.random() - 0.5) * asset.volatility * (asset.price * 0.02); 
             let newPrice = asset.price + drift;
             if (newPrice < 0.01) newPrice = 0.01;
             
             // Simulate a slight change in percent for visual effect
             const newChange = asset.changePercent + ((Math.random() - 0.5) * 0.2);
             
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
