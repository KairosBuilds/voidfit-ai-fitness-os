import React from 'react';
import { User } from '../types';
import { Flame, TrendingUp, Target, Scale, Ruler, Dumbbell } from 'lucide-react';
import { motion } from 'framer-motion';

import { useUserStore } from '../src/store/useUserStore';

interface AnalyticsProps {
    user?: User;
}

const KpiCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number; color: string }> = ({ icon, title, value, color }) => (
    <div className="glass-effect p-6 rounded-[2.5rem] border-2 border-glass-border shadow-[0_10px_30px_var(--shadow-soft)] relative z-10">
        <div className={`p-3 w-fit rounded-2xl bg-background/50 ${color} mb-4 border border-glass-border shadow-[inset_0_0_5px_rgba(0,0,0,0.5)] drop-shadow-[0_0_5px_currentColor]`}>
            {icon}
        </div>
        <div className="text-[10px] font-black text-sub-text uppercase tracking-[0.2em] mb-1">{title}</div>
        <div className="text-2xl font-black text-main-text drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">{value}</div>
    </div>
);

const Analytics: React.FC<AnalyticsProps> = ({ user: propUser }) => {
    const storeUser = useUserStore(state => state.user);
    const user = propUser || storeUser;

    if (!user) return null;

    const bmi = Number(user.bodyMetrics.currentWeight) / (Number(user.bodyMetrics.height) / 100) ** 2;
    
    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-20 relative z-10">
            <div className="text-center relative z-10">
                <h2 className="text-3xl font-black text-main-text tracking-tight drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">Performance Analytics</h2>
                <p className="text-sub-text mt-1 uppercase text-[10px] font-black tracking-widest">Biometric Tracking & Protocol Efficiency</p>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard icon={<Flame size={20} />} title="Total XP" value={user.xp_total.toLocaleString()} color="text-accent-primary" />
                <KpiCard icon={<TrendingUp size={20} />} title="Active Streak" value={`${user.streaks.daily_streak} Days`} color="text-accent-secondary" />
                <KpiCard icon={<Scale size={20} />} title="BMI" value={bmi.toFixed(1)} color="text-accent-tertiary" />
                <KpiCard icon={<Target size={20} />} title="Goal Weight" value={`${user.bodyMetrics.targetWeight}kg`} color="text-accent-red" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Body Metrics */}
                <div className="glass-effect p-8 rounded-[3rem] border-2 border-glass-border shadow-[0_10px_30px_var(--shadow-soft)] relative z-10">
                    <h3 className="text-xl font-black text-main-text mb-6 flex items-center gap-3 drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">
                        <Ruler className="text-accent drop-shadow-[0_0_5px_currentColor]" />
                        Bio-Metrics
                    </h3>
                    <div className="space-y-6">
                        <div className="flex justify-between items-center py-3 border-b border-glass-border">
                            <span className="text-sm font-bold text-sub-text uppercase">Weight</span>
                            <span className="text-lg font-black text-main-text drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">{user.bodyMetrics.currentWeight} kg</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-glass-border">
                            <span className="text-sm font-bold text-sub-text uppercase">Height</span>
                            <span className="text-lg font-black text-main-text drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">{user.bodyMetrics.height} cm</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-glass-border">
                            <span className="text-sm font-bold text-sub-text uppercase">Age</span>
                            <span className="text-lg font-black text-main-text drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">{user.bodyMetrics.age} y/o</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-glass-border">
                            <span className="text-sm font-bold text-sub-text uppercase">Experience</span>
                            <span className="text-lg font-black text-accent drop-shadow-[0_0_2px_currentColor]">{user.bodyMetrics.experienceLevel}</span>
                        </div>
                    </div>
                </div>

                {/* Training Protocol */}
                <div className="glass-effect p-8 rounded-[3rem] border-2 border-glass-border shadow-[0_10px_30px_var(--shadow-soft)] relative z-10">
                    <h3 className="text-xl font-black text-main-text mb-6 flex items-center gap-3 drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">
                        <Dumbbell className="text-accent drop-shadow-[0_0_5px_currentColor]" />
                        Training Protocol
                    </h3>
                    <div className="space-y-4">
                        <div className="p-4 bg-surface/30 rounded-2xl border border-glass-border shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]">
                            <div className="text-[10px] font-black text-sub-text uppercase tracking-widest mb-1">Primary Objective</div>
                            <div className="text-sm font-black text-main-text drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">{user.primaryGoal}</div>
                        </div>
                        <div className="p-4 bg-surface/30 rounded-2xl border border-glass-border shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]">
                            <div className="text-[10px] font-black text-sub-text uppercase tracking-widest mb-1">Equipment Access</div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {user.bodyMetrics.equipment.map(item => (
                                    <span key={item} className="px-2 py-1 rounded-lg bg-background/50 border border-glass-border text-accent text-[10px] font-black uppercase shadow-[inset_0_0_5px_rgba(0,0,0,0.5)] drop-shadow-[0_0_2px_currentColor]">{item}</span>
                                ))}
                            </div>
                        </div>
                        <div className="p-4 bg-surface/30 rounded-2xl border border-glass-border shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]">
                            <div className="text-[10px] font-black text-sub-text uppercase tracking-widest mb-1">Session Duration</div>
                            <div className="text-sm font-black text-main-text drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">{user.bodyMetrics.availableTimeMinutes} Minutes</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Realm Balance */}
            <div className="glass-effect p-8 rounded-[3rem] border-2 border-glass-border shadow-[0_10px_30px_var(--shadow-soft)] relative z-10">
                <h3 className="text-xl font-black text-main-text mb-6 drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">Realm Distribution</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    {Object.entries(user.stats).map(([realm, value]) => {
                        const numVal = Number(value);
                        return (
                        <div key={realm} className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase text-sub-text">
                                <span>{realm}</span>
                                <span>{numVal}</span>
                            </div>
                            <div className="h-1.5 bg-background/50 rounded-full overflow-hidden border border-glass-border shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min((numVal / 100) * 100, 100)}%` }}
                                    className="h-full bg-[var(--plush-gradient,var(--dragon-scale))] bg-accent shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))]" 
                                />
                            </div>
                        </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Analytics;