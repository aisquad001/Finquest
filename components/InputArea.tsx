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
    CheckBadgeIcon,
    StarIcon
} from '@heroicons/react/24/solid';
import { playSound } from '../services/audio';

interface ModuleGridProps {
  onSelectTopic: (topic: string, moduleId: string) => void;
  completedModules: string[];
  isGenerating: boolean;
}

const WORLDS = [
    { id: 'basics', title: "MOOLA BASICS", icon: BanknotesIcon, color: "bg-neon-green", prompt: "History of money and inflation explained simply." },
    { id: 'budget', title: "BUDGET BEACH", icon: CalculatorIcon, color: "bg-neon-blue", prompt: "Budgeting with 50/30/20 rule." },
    { id: 'savings', title: "COMPOUND CLIFFS", icon: ScaleIcon, color: "bg-neon-purple", prompt: "Compound interest and emergency funds." },
    { id: 'banking', title: "BANK VAULT", icon: BuildingLibraryIcon, color: "bg-neon-pink", prompt: "Checking, savings, and safety." },
    { id: 'debt', title: "DEBT DUNGEON", icon: CreditCardIcon, color: "bg-orange-500", prompt: "Good vs bad debt and credit scores." },
    { id: 'income', title: "HUSTLE HUB", icon: BriefcaseIcon, color: "bg-yellow-400", prompt: "Taxes, gross vs net, side hustles." },
    { id: 'investing', title: "STONY STOCKS", icon: PresentationChartLineIcon, color: "bg-emerald-500", prompt: "Stocks, ETFs, and risk." },
    { id: 'wealth', title: "EMPIRE CITY", icon: BuildingOffice2Icon, color: "bg-indigo-500", prompt: "Net worth and long term wealth." }
];

export const InputArea: React.FC<ModuleGridProps> = ({ onSelectTopic, completedModules, isGenerating }) => {
  
  const handleInteraction = (world: any) => {
    if (isGenerating) return;
    playSound('pop');
    onSelectTopic(world.prompt, world.id);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 mb-24 relative">
        
        {/* Map Path Line (Dashed SVG) */}
        <svg className="absolute top-10 left-1/2 -translate-x-1/2 h-full w-24 pointer-events-none opacity-30" viewBox="0 0 100 800" preserveAspectRatio="none">
            <path d="M50,0 Q90,100 50,200 T50,400 T50,600 T50,800" fill="none" stroke="white" strokeWidth="4" strokeDasharray="10,10" />
        </svg>

        <div className="flex flex-col items-center gap-8 md:gap-12">
            {WORLDS.map((world, index) => {
                const isLocked = index > 0 && !completedModules.includes(WORLDS[index - 1].id);
                const isCompleted = completedModules.includes(world.id);
                const Icon = world.icon;
                
                // Stagger worlds left and right
                const isLeft = index % 2 === 0;

                return (
                    <button
                        key={world.id}
                        onClick={() => !isLocked && handleInteraction(world)}
                        disabled={isLocked || isGenerating}
                        className={`
                            relative w-full max-w-[300px] group transition-all duration-300
                            ${isLeft ? 'self-start md:self-center md:-translate-x-12' : 'self-end md:self-center md:translate-x-12'}
                        `}
                    >
                        <div className={`
                            relative z-10 flex items-center p-4 rounded-3xl border-4 border-black
                            ${isLocked 
                                ? 'bg-gray-800 grayscale cursor-not-allowed opacity-80' 
                                : `${world.color} cursor-pointer btn-3d hover:scale-105`
                            }
                        `}>
                            {/* Icon Container */}
                            <div className="w-14 h-14 bg-black/20 rounded-2xl flex items-center justify-center mr-4 text-white border-2 border-white/20">
                                {isLocked ? <LockClosedIcon className="w-6 h-6" /> : <Icon className="w-8 h-8" />}
                            </div>

                            {/* Text Info */}
                            <div className="text-left flex-1">
                                <h3 className="font-game text-xl text-white uppercase text-stroke-black tracking-wider leading-none mb-1">
                                    {world.title}
                                </h3>
                                
                                {isCompleted && (
                                    <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-full w-fit">
                                        <StarIcon className="w-3 h-3 text-yellow-400" />
                                        <StarIcon className="w-3 h-3 text-yellow-400" />
                                        <StarIcon className="w-3 h-3 text-yellow-400" />
                                    </div>
                                )}
                                {!isCompleted && !isLocked && <div className="text-xs font-bold text-black/60 uppercase">Tap to Start</div>}
                            </div>

                            {/* Completion Badge */}
                            {isCompleted && (
                                <div className="absolute -top-3 -right-3 bg-yellow-400 text-black p-1 rounded-full border-2 border-black animate-bounce">
                                    <CheckBadgeIcon className="w-8 h-8" />
                                </div>
                            )}
                        </div>

                        {/* Cloud/Platform Decoration beneath */}
                        {!isLocked && (
                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[90%] h-6 bg-black/40 blur-md rounded-full -z-10 group-hover:w-[80%] transition-all"></div>
                        )}
                    </button>
                );
            })}
        </div>
        
        {/* Bottom Spacer */}
        <div className="h-24"></div>
    </div>
  );
};