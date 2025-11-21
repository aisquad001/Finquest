
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserState } from './gamification';

export interface ParentAccount {
    name: string;
    email: string;
    linkedChildren: string[]; // IDs
    role: 'parent' | 'teacher';
}

export interface BankingState {
    balance: number;
    savingsBalance: number;
    investingBalance: number;
    allowanceSplit: { spend: number; save: number; invest: number };
    transactions: BankTransaction[];
    cardActive: boolean;
}

export interface BankTransaction {
    id: string;
    merchant: string;
    amount: number;
    date: string;
    category: 'spend' | 'save' | 'invest';
    educationalNote?: string;
}

// Mock Educational Interventions (Red Flags)
export const getInterventions = (user: UserState) => {
    const alerts = [];
    
    // Check Portfolio Risk
    const riskyHoldings = Object.keys(user.portfolio.holdings).filter(sym => ['GME', 'AMC', 'DOGE', 'SHIB'].includes(sym));
    if (riskyHoldings.length > 0) {
        alerts.push({
            type: 'warning',
            title: 'High Volatility Detected',
            message: `Attempted to concentrate 40% of portfolio in Meme Stocks (${riskyHoldings.join(', ')}).`,
            actionTaken: 'Educational module "Diversification 101" assigned.',
            date: new Date().toISOString()
        });
    }

    // Check Streak
    if (user.streak > 7) {
        alerts.push({
            type: 'success',
            title: 'Habit Forming',
            message: 'Logged in for 7 consecutive days. Consistency score is up.',
            actionTaken: 'Bonus XP awarded.',
            date: new Date().toISOString()
        });
    }

    return alerts;
};

export const MOCK_BANKING: BankingState = {
    balance: 42.50,
    savingsBalance: 120.00,
    investingBalance: 55.00,
    allowanceSplit: { spend: 50, save: 30, invest: 20 },
    cardActive: false,
    transactions: [
        { id: '1', merchant: 'Starbucks', amount: -5.45, date: '2023-10-24', category: 'spend', educationalNote: 'From "Wants" bucket.' },
        { id: '2', merchant: 'Allowance', amount: 20.00, date: '2023-10-23', category: 'save', educationalNote: 'Auto-saved 30%.' },
        { id: '3', merchant: 'Steam Games', amount: -14.99, date: '2023-10-20', category: 'spend', educationalNote: 'Budget remaining: $12.40' },
    ]
};

export const generateLinkCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const MOCK_CERTIFICATE = {
    title: 'Certified Money Ninja',
    level: 'Level 21 Mastery',
    description: 'Has demonstrated proficiency in Budgeting, Compound Interest, and Stock Market Basics.',
    date: new Date().toLocaleDateString()
};
