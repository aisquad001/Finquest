
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { logger } from './logger';

// ALPHA VANTAGE CONFIG
const API_KEY = 'B63C0ZJ5N69NWF23';
const BASE_URL = 'https://www.alphavantage.co/query';

export interface StockAsset {
    symbol: string;
    name: string;
    category: 'tech' | 'meme' | 'crypto' | 'consumer' | 'index';
    price: number;
    changePercent: number;
    volatility: number; // Used for fallback simulation
    logo: string; // Emoji or URL
    active?: boolean;
    lastUpdated?: number;
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
    // MORE
    { symbol: 'META', name: 'Meta', category: 'tech', price: 480.00, changePercent: 0.9, volatility: 0.04, logo: '♾️' },
    { symbol: 'GOOGL', name: 'Google', category: 'tech', price: 175.00, changePercent: 0.4, volatility: 0.03, logo: '🔍' },
    { symbol: 'COIN', name: 'Coinbase', category: 'crypto', price: 250.00, changePercent: 5.0, volatility: 0.12, logo: '🏦' },
    { symbol: 'HOOD', name: 'Robinhood', category: 'tech', price: 22.00, changePercent: 1.2, volatility: 0.08, logo: '🏹' },
    { symbol: 'PLTR', name: 'Palantir', category: 'tech', price: 28.00, changePercent: 2.5, volatility: 0.09, logo: '🔮' },
    { symbol: 'SNAP', name: 'Snapchat', category: 'tech', price: 12.00, changePercent: -1.5, volatility: 0.10, logo: '👻' },
    { symbol: 'SPOT', name: 'Spotify', category: 'consumer', price: 320.00, changePercent: 0.8, volatility: 0.05, logo: '🎧' },
    { symbol: 'UBER', name: 'Uber', category: 'consumer', price: 75.00, changePercent: 1.1, volatility: 0.04, logo: '🚗' },
    { symbol: 'ABNB', name: 'Airbnb', category: 'consumer', price: 150.00, changePercent: 0.5, volatility: 0.05, logo: '🏠' },
];

// Internal State
let marketState = [...ASSET_LIST];
let isUsingLiveFeed = false;
let fetchQueueIndex = 0;

// Expose status for UI
export const getMarketStatus = () => isUsingLiveFeed ? 'LIVE' : 'SIMULATED';

// --- ALPHA VANTAGE INTEGRATION ---

// Helper to fetch a single quote
const fetchAlphaVantageQuote = async (symbol: string) => {
    try {
        const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        
        // Check for API limit message
        if (data.Note || data.Information) {
            console.warn("[StockMarket] API Limit Hit:", data.Note || data.Information);
            return null; // Rate limited
        }

        const quote = data['Global Quote'];
        if (quote) {
            return {
                price: parseFloat(quote['05. price']),
                changePercent: parseFloat(quote['10. change percent'].replace('%', ''))
            };
        }
        return null;
    } catch (e) {
        console.error(`[StockMarket] Fetch failed for ${symbol}`, e);
        return null;
    }
};

// Smart Poller: Fetches a few stocks at a time to respect rate limits (5/min approx for free tier)
// We simulate the rest between polls.
export const fetchRealMarketData = async (prioritySymbol?: string): Promise<StockAsset[]> => {
    
    // 1. Always fetch priority symbol if provided (e.g. user has modal open)
    if (prioritySymbol) {
        const quote = await fetchAlphaVantageQuote(prioritySymbol);
        if (quote) {
            isUsingLiveFeed = true;
            marketState = marketState.map(s => 
                s.symbol === prioritySymbol ? { ...s, ...quote, lastUpdated: Date.now() } : s
            );
        }
    }

    // 2. Rotate through the list for background updates (1 per call to be safe)
    // We cycle through one stock every time this function is called (e.g., every 10s)
    const stockToUpdate = marketState[fetchQueueIndex % marketState.length];
    if (stockToUpdate.symbol !== prioritySymbol) { // Don't double fetch
        const bgQuote = await fetchAlphaVantageQuote(stockToUpdate.symbol);
        if (bgQuote) {
            isUsingLiveFeed = true;
            marketState = marketState.map(s => 
                s.symbol === stockToUpdate.symbol ? { ...s, ...bgQuote, lastUpdated: Date.now() } : s
            );
        }
    }
    
    fetchQueueIndex++;

    // 3. Apply Simulation/Drift to stale stocks (older than 2 mins)
    // This ensures the UI always feels "alive" even if the API is slow/limited.
    const now = Date.now();
    marketState = marketState.map(asset => {
         // If data is fresh (under 2 mins), keep it.
         if (asset.lastUpdated && (now - asset.lastUpdated < 120000)) {
             return asset;
         }

         // Otherwise, simulate small micro-movements
         const driftPct = (Math.random() - 0.5) * asset.volatility * 0.05; 
         let newPrice = asset.price * (1 + driftPct);
         if (newPrice < 0.01) newPrice = 0.01;
         
         // Gravitate change percent towards the day's random trend
         const newChange = asset.changePercent + (driftPct * 50);
         
         return { ...asset, price: newPrice, changePercent: newChange };
    });

    return marketState;
};

export const getMarketData = () => {
    return marketState;
};

// Generate Chart Data (Mocked history for demo performance)
export const generateChartData = (symbol: string, timeframe: '1D' | '1W' | '1Y') => {
    const asset = marketState.find(a => a.symbol === symbol) || ASSET_LIST[0];
    const points = timeframe === '1D' ? 24 : timeframe === '1W' ? 7 : 30;
    
    let currentPrice = asset.price;
    const data = [];
    
    // Generate a believable chart ending at the current real price
    for (let i = 0; i < points; i++) {
        data.unshift(currentPrice);
        // Reverse walk
        const drift = (Math.random() - 0.5) * asset.volatility * (asset.price * 0.1); 
        currentPrice = currentPrice - drift;
    }
    
    return data;
};
