/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { 
    BanknotesIcon, 
    CalculatorIcon, 
    ScaleIcon, 
    BuildingLibraryIcon, 
    CreditCardIcon, 
    BriefcaseIcon, 
    PresentationChartLineIcon, 
    BuildingOffice2Icon,
    LockClosedIcon,
    CheckBadgeIcon
} from '@heroicons/react/24/outline';

interface ModuleGridProps {
  onSelectTopic: (topic: string, moduleId: string) => void;
  completedModules: string[];
  isGenerating: boolean;
}

const WORLDS = [
    {
        id: 'basics',
        title: "Money Basics Island",
        subtitle: "Start Here",
        icon: BanknotesIcon,
        color: "text-green-400",
        gradient: "from-green-500/20 to-emerald-900/20",
        border: "group-hover:border-green-500/50",
        prompt: "The history of money, inflation explained simply with pizza, and cash vs debit vs credit."
    },
    {
        id: 'budget',
        title: "Budget Beach",
        subtitle: "Needs vs Wants",
        icon: CalculatorIcon,
        color: "text-cyan-400",
        gradient: "from-cyan-500/20 to-blue-900/20",
        border: "group-hover:border-cyan-500/50",
        prompt: "Creating a budget using the 50/30/20 rule, tracking spending, and avoiding lifestyle creep."
    },
    {
        id: 'savings',
        title: "Savings Mountain",
        subtitle: "Compound Interest",
        icon: ScaleIcon,
        color: "text-indigo-400",
        gradient: "from-indigo-500/20 to-purple-900/20",
        border: "group-hover:border-indigo-500/50",
        prompt: "Emergency funds, paying yourself first, and the magic of compound interest."
    },
    {
        id: 'banking',
        title: "Banking Bay",
        subtitle: "Accounts & Safety",
        icon: BuildingLibraryIcon,
        color: "text-blue-400",
        gradient: "from-blue-500/20 to-sky-900/20",
        border: "group-hover:border-blue-500/50",
        prompt: "Checking vs savings accounts, interest rates, FDIC insurance, and how banks work."
    },
    {
        id: 'debt',
        title: "Debt Dungeon",
        subtitle: "Avoid the Trap",
        icon: CreditCardIcon,
        color: "text-red-400",
        gradient: "from-red-500/20 to-orange-900/20",
        border: "group-hover:border-red-500/50",
        prompt: "Good debt vs bad debt, credit card APR, student loans, and credit scores."
    },
    {
        id: 'income',
        title: "Income Jungle",
        subtitle: "Hustle & Taxes",
        icon: BriefcaseIcon,
        color: "text-orange-400",
        gradient: "from-orange-500/20 to-amber-900/20",
        border: "group-hover:border-orange-500/50",
        prompt: "Gross vs net income, taxes simplified, side hustles, and entrepreneurship basics."
    },
    {
        id: 'investing',
        title: "Investing City",
        subtitle: "Stocks & Risks",
        icon: PresentationChartLineIcon,
        color: "text-yellow-400",
        gradient: "from-yellow-500/20 to-orange-900/20",
        border: "group-hover:border-yellow-500/50",
        prompt: "What are stocks, ETFs, index funds, diversification, and risk vs reward."
    },
    {
        id: 'wealth',
        title: "Wealth Empire",
        subtitle: "Build Your Legacy",
        icon: BuildingOffice2Icon,
        color: "text-purple-400",
        gradient: "from-purple-500/20 to-pink-900/20",
        border: "group-hover:border-purple-500/50",
        prompt: "Net worth, assets vs liabilities, retirement accounts like Roth IRA, and long term wealth."
    }
];

export const InputArea: React.FC<ModuleGridProps> = ({ onSelectTopic, completedModules, isGenerating }) => {
  
  return (
    <div className="w-full max-w-5xl mx-auto px-4 mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {WORLDS.map((world, index) => {
                // Unlock logic: Previous module must be completed
                const isLocked = index > 0 && !completedModules.includes(WORLDS[index - 1].id);
                const isCompleted = completedModules.includes(world.id);
                const Icon = world.icon;

                return (
                    <button
                        key={world.id}
                        onClick={() => !isLocked && !isGenerating && onSelectTopic(world.prompt, world.id)}
                        disabled={isLocked || isGenerating}
                        className={`
                            relative group overflow-hidden rounded-2xl text-left transition-all duration-300
                            flex flex-col justify-between h-48 p-1
                            ${isLocked 
                                ? 'bg-zinc-900/40 border border-zinc-800 opacity-60 cursor-not-allowed' 
                                : 'bg-zinc-900 border border-zinc-800 cursor-pointer hover:-translate-y-1 hover:shadow-xl'
                            }
                            ${world.border}
                        `}
                    >
                        {/* Inner Content Container */}
                        <div className={`
                            relative z-10 flex flex-col justify-between h-full p-5 rounded-xl
                            bg-gradient-to-b from-transparent to-black/40
                        `}>
                            <div className="flex justify-between items-start">
                                <div className={`
                                    p-3 rounded-xl backdrop-blur-sm
                                    ${isLocked ? 'bg-zinc-800 text-zinc-500' : `bg-white/5 ${world.color}`}
                                `}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                
                                {isCompleted ? (
                                    <div className="bg-green-500 text-black p-1 rounded-full">
                                        <CheckBadgeIcon className="w-5 h-5" />
                                    </div>
                                ) : isLocked ? (
                                    <LockClosedIcon className="w-5 h-5 text-zinc-600" />
                                ) : null}
                            </div>

                            <div>
                                <h3 className={`font-bold text-lg mb-1 ${isLocked ? 'text-zinc-500' : 'text-white'}`}>
                                    {world.title}
                                </h3>
                                <p className={`text-xs font-medium ${isLocked ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                    {world.subtitle}
                                </p>
                            </div>
                        </div>

                        {/* Background Gradients */}
                        {!isLocked && (
                            <>
                                <div className={`absolute inset-0 bg-gradient-to-br ${world.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                                <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 ${world.color.replace('text-', 'bg-')}`}></div>
                            </>
                        )}

                        {/* Progress Bar for Card */}
                        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-zinc-950">
                             <div 
                                className={`h-full transition-all duration-1000 ease-out ${isCompleted ? 'bg-green-500 w-full' : 'w-0'}`}
                            ></div>
                        </div>
                    </button>
                );
            })}
        </div>
    </div>
  );
};