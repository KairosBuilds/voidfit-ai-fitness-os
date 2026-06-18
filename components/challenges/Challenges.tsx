import React from 'react';
import { Target, Clock, Star, AlertCircle } from 'lucide-react';

export const Challenges: React.FC = () => {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-black text-main-text uppercase tracking-tighter flex items-center gap-2">
                    <Target className="text-accent-red" />
                    Coaching Challenges
                </h1>
                <p className="text-[10px] text-sub-text font-black uppercase tracking-widest">Daily & Elite Missions</p>
            </div>

            {/* Daily Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-accent">
                    <Clock size={16} />
                    <h2 className="text-xs font-black uppercase tracking-[0.2em]">Active Daily Challenges</h2>
                </div>
                <div className="glass-effect p-10 rounded-[2.5rem] border border-dashed border-glass-border text-center">
                    <p className="text-sm font-black text-sub-text uppercase tracking-tight">No Active Challenges</p>
                    <p className="text-[10px] text-sub-text font-medium uppercase leading-relaxed opacity-70 mt-2">
                        Complete more daily activities for the AI coach to generate personalized challenges.
                    </p>
                </div>
            </div>

            {/* Elite Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-accent-yellow">
                    <Star size={16} />
                    <h2 className="text-xs font-black uppercase tracking-[0.2em]">Weekly Goals</h2>
                </div>
                <div className="glass-effect p-10 rounded-[2.5rem] border border-dashed border-glass-border text-center">
                    <p className="text-sm font-black text-sub-text uppercase tracking-tight">No Elite Missions</p>
                    <p className="text-[10px] text-sub-text font-medium uppercase leading-relaxed opacity-70 mt-2">
                        Reach higher milestones to unlock elite weekly missions.
                    </p>
                </div>
            </div>

            {/* AI Warning */}
            <div className="p-6 rounded-[2.5rem] bg-accent/5 border border-glass-border flex items-start gap-4">
                <AlertCircle className="text-accent mt-1" size={24} />
                <div>
                    <h4 className="text-xs font-black text-main-text uppercase tracking-tight">Challenge Guidelines</h4>
                    <p className="text-[10px] text-sub-text font-medium uppercase leading-relaxed mt-1">
                        Challenges are personalized based on your progress. Complete elite missions to level up faster and unlock milestones.
                    </p>
                </div>
            </div>
        </div>
    );
};
