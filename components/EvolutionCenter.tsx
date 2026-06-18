import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, Target, TrendingUp, Info } from 'lucide-react';
import { useUserStore } from '../src/store/useUserStore';
import BodyAnatomy from './BodyAnatomy';
import SkillTree from './SkillTree';
import GrowthCenter from './GrowthCenter';

type EvoTab = 'biometrics' | 'skills' | 'training';

export const EvolutionCenter: React.FC = () => {
    const [activeTab, setActiveTab] = useState<EvoTab>('skills');
    const { user } = useUserStore();

    const tabs: { id: EvoTab; label: string; icon: React.ElementType }[] = [
        { id: 'biometrics', label: 'Body Stats', icon: Activity },
        { id: 'skills', label: 'Your Skills', icon: Zap },
        { id: 'training', label: 'Workouts', icon: Target },
    ];

    if (!user) return null;

    return (
        <div className="min-h-screen pb-32 pt-4 px-4 max-w-5xl mx-auto space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-main-text uppercase tracking-tight">Your Progress</h1>
                    <p className="text-sub-text font-bold text-sm">Track your body and skill growth</p>
                </div>
                <div className="flex items-center gap-4 bg-surface/30 p-4 rounded-2xl border border-glass-border">
                    <div className="flex flex-col items-center">
                        <span className="text-[8px] font-black text-sub-text uppercase tracking-widest">Rank</span>
                        <span className="text-xl font-black text-accent">{user.rank}</span>
                    </div>
                    <div className="w-px h-8 bg-glass-border" />
                    <div className="flex flex-col items-center">
                        <span className="text-[8px] font-black text-sub-text uppercase tracking-widest">Total Level</span>
                        <span className="text-xl font-black text-main-text">LVL {user.level_overall}</span>
                    </div>
                </div>
            </div>

            {/* Tab Selector */}
            <div className="horizontal-scroll p-1.5 glass-effect rounded-2xl border border-glass-border mb-8 custom-scrollbar touch-pan-x">
                <div className="flex min-w-full gap-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 min-w-[100px] flex-shrink-0 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 relative ${activeTab === tab.id ? 'text-white' : 'text-sub-text hover:text-main-text'}`}
                        >
                            {activeTab === tab.id && (
                                <motion.div 
                                    layoutId="evoTab"
                                    className="absolute inset-0 bg-primary-action shadow-[0_0_15px_rgba(157,0,255,0.4)] rounded-xl"
                                />
                            )}
                            <tab.icon size={16} className="relative z-10" />
                            <span className="text-[10px] font-black uppercase tracking-widest relative z-10 whitespace-nowrap">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Tactical Tip (Inline) */}
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-effect p-3 rounded-xl border border-glass-border mb-8 flex items-center gap-3 shadow-lg"
            >
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent">
                    <TrendingUp size={16} />
                </div>
                <div className="flex-1">
                    <p className="text-[9px] font-black text-main-text uppercase tracking-widest">Quick Tip</p>
                    <p className="text-[8px] font-bold text-sub-text uppercase">Strength training makes your goals 12% easier.</p>
                </div>
            </motion.div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {activeTab === 'biometrics' && (
                        <div className="space-y-6">
                            <div className="p-4 bg-accent/10 border border-accent/20 rounded-2xl flex items-center gap-3">
                                <Info size={18} className="text-accent" />
                                <p className="text-[10px] font-bold text-sub-text uppercase">Click muscle zones to see stats.</p>
                            </div>
                            <BodyAnatomy user={user} />
                        </div>
                    )}
                    {activeTab === 'skills' && (
                        <SkillTree user={user} />
                    )}
                    {activeTab === 'training' && (
                        <GrowthCenter user={user} />
                    )}
                </motion.div>
            </AnimatePresence>

        </div>
    );
};

export default EvolutionCenter;
