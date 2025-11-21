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
        text: "Imagine your favorite pizza costs $10 today. Next year, it's $10.50. That's inflation! Your money buys slightly less stuff over time.",
    },
    "Compound Interest": {
        id: "gem_compound",
        title: "Compound Interest",
        emoji: "❄️",
        text: "It's like a snowball rolling down a hill. You earn interest on your money, AND interest on your interest. It gets huge!",
    },
    "Diversification": {
        id: "gem_div",
        title: "Diversification",
        emoji: "🧺",
        text: "Don't put all your eggs in one basket! If you drop the basket, you lose everything. Spread your money out to stay safe.",
    },
    "Asset": {
        id: "gem_asset",
        title: "Asset",
        emoji: "💰",
        text: "Anything that puts money IN your pocket (like stocks or a rental house).",
    },
    "Liability": {
        id: "gem_liability",
        title: "Liability",
        emoji: "💸",
        text: "Anything that takes money OUT of your pocket (like a fancy car that loses value).",
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
        text: "A plan for your money. It's not about restricting yourself, it's about telling your money where to go so you don't wonder where it went.",
    },
    "Needs vs Wants": {
        id: "gem_needs",
        title: "Needs vs Wants",
        emoji: "⚖️",
        text: "Needs are things you die without (food, shelter). Wants are things you cry without (PS5, Jordans). Know the difference!",
    }
};