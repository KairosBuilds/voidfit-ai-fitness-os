import React from 'react';
import { User, Badge, FitnessGoal } from '../types';
import { BADGE_DEFINITIONS } from '../constants';
import { PlusCircle, Edit, Trash2, Swords, Star, Award } from 'lucide-react';

import { useUserStore } from '../src/store/useUserStore';

interface BadgesProps {
  user?: User;
}

const Badges: React.FC<BadgesProps> = ({ user: propUser }) => {
  const storeUser = useUserStore(state => state.user);
  const user = propUser || storeUser;

  if (!user) return null;
  const allBadges = BADGE_DEFINITIONS;
  const unlockedBadges = user.unlockedBadges || [];
  const completedMajorGoals = user.completedMajorGoals || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      <div className="text-center relative z-10">
        <h2 className="text-3xl font-black text-main-text tracking-tight uppercase drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">Badges & Ranks</h2>
        <p className="text-sub-text mt-1 font-bold uppercase text-[10px] tracking-widest">Milestones you've reached</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 relative z-10">
        {allBadges.map(badge => {
          const isUnlocked = unlockedBadges.includes(badge.id);
          const Icon = Award;
          
          return (
            <div 
              key={badge.id} 
              className={`
                relative group glass-effect p-6 rounded-[2.5rem] border-2 border-glass-border
                flex flex-col items-center justify-center text-center 
                transition-all duration-300
                ${isUnlocked ? 'border-accent shadow-[0_0_20px_var(--neon-glow,var(--teddy-glow))]' : 'opacity-40 grayscale shadow-[0_10px_30px_var(--shadow-soft)]'}
              `}
            >
              <div 
                className={`
                  w-16 h-16 rounded-2xl flex items-center justify-center mb-4
                  ${isUnlocked ? 'bg-[var(--plush-gradient,var(--dragon-scale))] bg-accent shadow-[inset_0_0_5px_rgba(0,0,0,0.5)] shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))]' : 'bg-background/50 border border-glass-border shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]'}
                `}
              >
                <Icon 
                  className={`w-8 h-8 ${isUnlocked ? 'text-white drop-shadow-[0_0_5px_currentColor]' : 'text-sub-text'}`} 
                />
              </div>
              <h3 className={`font-black text-xs uppercase tracking-tight ${isUnlocked ? 'text-main-text drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]' : 'text-sub-text'}`}>
                {badge.name}
              </h3>
              <p className="text-[10px] text-sub-text mt-2 font-bold leading-tight">{badge.description}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-12 pt-12 border-t border-glass-border relative z-10">
        <h2 className="text-2xl font-black text-main-text tracking-tight uppercase text-center mb-8 drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">Past Victories</h2>
        {completedMajorGoals.length > 0 ? (
            <div className="space-y-4">
                {completedMajorGoals.map((goal: any) => (
                    <div key={goal.id} className="glass-effect p-6 rounded-[2.5rem] border-2 border-glass-border shadow-[0_10px_30px_var(--shadow-soft)] hover:border-accent hover:shadow-[0_0_20px_var(--neon-glow,var(--teddy-glow))] transition-all flex items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-background/50 rounded-xl border border-glass-border shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
                                <Swords className="w-8 h-8 text-accent drop-shadow-[0_0_5px_currentColor]" />
                            </div>
                            <div>
                                <h4 className="font-black text-main-text uppercase tracking-tight drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">{goal.title}</h4>
                                <p className="text-[10px] text-sub-text font-bold uppercase tracking-widest">{goal.type}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center space-x-1 text-accent font-black drop-shadow-[0_0_2px_currentColor]">
                                <Star size={14} className="drop-shadow-[0_0_5px_currentColor]" /> <span>{goal.xp_reward.toLocaleString()} XP</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-20 bg-surface/30 rounded-[2.5rem] border-2 border-dashed border-glass-border shadow-[inset_0_0_15px_rgba(0,0,0,0.2)]">
                <Award className="w-12 h-12 mx-auto text-sub-text mb-4 opacity-30 drop-shadow-[0_0_2px_currentColor]" />
                <p className="text-sub-text font-black uppercase tracking-widest text-xs drop-shadow-[0_0_2px_rgba(0,0,0,0.5)]">No goals completed yet.</p>
                <p className="text-sub-text opacity-60 text-[10px] mt-2 font-bold">Complete your main goals to see your history here.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Badges;