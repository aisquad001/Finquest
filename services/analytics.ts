
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AnalyticsEvent {
    name: string;
    properties?: Record<string, any>;
    timestamp: string;
}

// Mock Data Generators for Admin Dashboard
export const getAnalyticsSnapshot = () => {
    return {
        dau: 12543,
        mau: 45200,
        retention: [100, 65, 45, 38, 35, 32, 30], // D1 to D7
        revenue: {
            total: 154000,
            thisMonth: 12500,
            projected: 18000
        },
        conversionRate: 4.2, // %
    };
};

export const trackEvent = (eventName: string, properties: Record<string, any> = {}) => {
    const event: AnalyticsEvent = {
        name: eventName,
        properties,
        timestamp: new Date().toISOString()
    };
    
    console.log(`[ANALYTICS] ${eventName}`, properties);
    
    // In production, this would send to Mixpanel/Amplitude
    // logToMixpanel(event);
};

export const getRecentEvents = (): AnalyticsEvent[] => {
    // Return fake stream for "Live View"
    return [
        { name: 'level_complete', properties: { level: 5, time: 120 }, timestamp: new Date().toISOString() },
        { name: 'purchase_item', properties: { item: 'streak_freeze', cost: 500 }, timestamp: new Date(Date.now() - 5000).toISOString() },
        { name: 'app_open', properties: { platform: 'ios' }, timestamp: new Date(Date.now() - 10000).toISOString() },
        { name: 'stock_trade', properties: { symbol: 'TSLA', type: 'buy' }, timestamp: new Date(Date.now() - 15000).toISOString() },
    ];
};
