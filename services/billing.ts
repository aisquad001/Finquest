
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { playSound } from './audio';

export interface CoinPack {
    id: string;
    coins: number;
    price: number;
    bonus?: string;
}

export const COIN_PACKS: CoinPack[] = [
    { id: 'pack_tiny', coins: 1000, price: 0.99 },
    { id: 'pack_small', coins: 5500, price: 4.99, bonus: '+10%' },
    { id: 'pack_medium', coins: 12000, price: 9.99, bonus: '+20%' },
    { id: 'pack_whale', coins: 150000, price: 99.99, bonus: '+50%' },
];

export const PRO_PLAN = {
    monthly: 4.99,
    yearly: 39.99, // Save 33%
    features: [
        'Real-Money Debit Card (Physical)',
        '2x XP Boost Always Active',
        'Exclusive "Gold" Avatar Border',
        'Unlimited "Mistake Erasers" in Quizzes',
        'Ad-Free Experience'
    ]
};

export const simulatePurchase = async (productId: string): Promise<boolean> => {
    return new Promise((resolve) => {
        console.log(`[BILLING] Initiating purchase for ${productId}...`);
        
        // Simulate network delay
        setTimeout(() => {
            const success = Math.random() > 0.1; // 90% success rate
            if (success) {
                console.log(`[BILLING] Purchase successful: ${productId}`);
                playSound('kaching');
            } else {
                console.log(`[BILLING] Purchase failed.`);
                playSound('fail');
            }
            resolve(success);
        }, 1500);
    });
};
