
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Lesson, LevelData } from './gamification';

export type { Lesson, LevelData };
export type GameLevel = LevelData;

export const GET_WORLD_LEVELS = (worldId: string) => {
    // Return mock structure matching seed data (8 levels per world)
    // This is used for synchronous UI progress calculation
    return Array.from({ length: 8 }, (_, i) => ({
        id: `${worldId}_l${i + 1}`,
        levelNumber: i + 1
    }));
};

// --- MICRO-EXPLAINER DICTIONARY ---
// When these words appear in text, they become tappable "Knowledge Gems"
export const KNOWLEDGE_GEMS: Record<string, { id: string; title: string; video?: string; text: string; emoji: string }> = {
    "Inflation": {
        id: "gem_inflation",
        title: "Inflation",
        emoji: "🎈",
        text: "Why your Roblox gift card buys less today than in 2019. Money loses value over time. The silent allowance thief.",
    },
    "Compound Interest": {
        id: "gem_compound",
        title: "Compound Interest",
        emoji: "❄️",
        text: "Snowball effect. $100 today → $1,000 later without doing work. Magic math for lazy rich people.",
    },
    "Diversification": {
        id: "gem_div",
        title: "Diversification",
        emoji: "🧺",
        text: "Don't put all your V-Bucks in one skin. Buy different stuff so you don't go broke if one crashes.",
    },
    "Asset": {
        id: "gem_asset",
        title: "Asset",
        emoji: "💰",
        text: "Anything that puts money IN your pocket (like stocks or a rental house). If it doesn't pay you, it's just a toy.",
    },
    "Liability": {
        id: "gem_liability",
        title: "Liability",
        emoji: "💸",
        text: "Anything that takes money OUT of your pocket (like a fancy car that loses value). Avoid these.",
    },
    "Opportunity Cost": {
        id: "gem_oppcost",
        title: "Opportunity Cost",
        emoji: "🤔",
        text: "What you give up when you choose something. Buying a $50 game means giving up $50 that could have grown to $500.",
    },
    "Budget": {
        id: "gem_budget",
        title: "Budget",
        emoji: "📝",
        text: "A plan for your money so you're not broke by Friday. It's not a diet, it's a menu.",
    },
    "Needs vs Wants": {
        id: "gem_needs",
        title: "Needs vs Wants",
        emoji: "⚖️",
        text: "Needs = Food, Shelter. Wants = PS5, Jordans. Know the difference or stay broke.",
    },
    "Dollar-Cost Averaging": {
         id: "gem_dca",
         title: "Dollar-Cost Averaging",
         emoji: "📉",
         text: "Buying the dip automatically. Market crashes? You buy cheaper. Market moons? You rich.",
    },
    "Credit Score": {
        id: "gem_credit",
        title: "Credit Score",
        emoji: "🎮",
        text: "Your adulting rank. Low score = no house, no car, no fun. Keep it 750+.",
    },
    "Roth IRA": {
        id: "gem_roth",
        title: "Roth IRA",
        emoji: "👵",
        text: "Tax-free millionaire account. Put money in now, pull it out at 59½ totally tax free. The ultimate cheat code.",
    }
};
