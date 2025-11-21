
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserState } from './gamification';

// Mock User Database for Admin Panel
export const MOCK_USERS: Partial<UserState & { id: string; status: string; email: string }>[] = [
    { id: 'u_1', nickname: 'Elon Tusk', email: 'elon@mars.com', level: 42, xp: 99000, status: 'active', joinedAt: '2023-01-15' },
    { id: 'u_2', nickname: 'Jeff Bazookas', email: 'jeff@amazon.forest', level: 38, xp: 85000, status: 'active', joinedAt: '2023-02-20' },
    { id: 'u_3', nickname: 'Scammer_99', email: 'not_sus@aol.com', level: 2, xp: 100, status: 'banned', joinedAt: '2023-10-25' },
    { id: 'u_4', nickname: 'Newbie_Dave', email: 'dave@gmail.com', level: 5, xp: 2500, status: 'active', joinedAt: '2023-10-26' },
];

export const banUser = (userId: string) => {
    console.log(`[ADMIN] Banning user ${userId}`);
    // In real app: await firebase.users.doc(userId).update({ status: 'banned' });
};

export const giftCoins = (userId: string, amount: number) => {
    console.log(`[ADMIN] Gifting ${amount} coins to ${userId}`);
};

export const updateGlobalConfig = (configKey: string, value: any) => {
    console.log(`[ADMIN] Config Update: ${configKey} = ${value}`);
    // Example: Change XP multiplier globally
};

export const getContentStats = () => {
    return [
        { id: 'basics', title: 'Moola Basics', completions: 45000, rating: 4.8 },
        { id: 'budget', title: 'Budget Beach', completions: 32000, rating: 4.6 },
        { id: 'investing', title: 'Stony Stocks', completions: 12000, rating: 4.9 },
        { id: 'crypto', title: 'Crypto Cave', completions: 5000, rating: 3.2 }, // Low rating, needs fix
    ];
};
