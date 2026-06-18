import React from 'react';
import { FitnessGoal, FitnessGoalType } from '../types';
import { Target, Calendar, CheckCircle, TrendingUp, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useQuestStore } from '../src/store/useQuestStore';

interface FitnessGoalsProps {
  goals?: FitnessGoal[];
  onAddGoal?: () => void;
  onDeleteGoal?: (id: string) => void;
  onCompleteGoal?: (goal: FitnessGoal) => void;
}

const FitnessGoals: React.FC<FitnessGoalsProps> = ({ 
  goals: propGoals, 
  onAddGoal: propOnAddGoal, 
  onDeleteGoal: propOnDeleteGoal, 
  onCompleteGoal: propOnCompleteGoal 
}) => {
  const { fitnessGoals: storeGoals, completeFitnessGoal, removeFitnessGoal } = useQuestStore();
  
  const goals = propGoals || storeGoals || [];
  const onAddGoal = propOnAddGoal || (() => {
    const goal: FitnessGoal = {
      id: `goal-${Date.now()}`,
      title: 'New Goal',
      description: 'Track your progress',
      type: FitnessGoalType.GeneralFitness,
      deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
      xp_reward: 100,
      targetValue: 1,
      currentValue: 0,
      unit: 'days',
      status: 'pending',
    };
    useQuestStore.getState().addFitnessGoal(goal);
  });
  const onDeleteGoal = propOnDeleteGoal || ((id: string) => removeFitnessGoal(id));
  const onCompleteGoal = propOnCompleteGoal || ((goal: FitnessGoal) => completeFitnessGoal(goal.id));
  return (
    <div className="space-y-6 relative z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-background/50 rounded-xl text-accent border border-glass-border shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
            <Target size={24} className="drop-shadow-[0_0_5px_currentColor]" />
          </div>
          <div>
            <h2 className="text-xl font-black text-main-text tracking-tight drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">Active Directives</h2>
            <p className="text-[10px] text-sub-text font-black uppercase tracking-widest">Long-term Objectives</p>
          </div>
        </div>
        <button 
          onClick={onAddGoal}
          className="p-2 bg-surface/50 hover:bg-surface/80 rounded-xl border border-glass-border text-sub-text hover:text-accent hover:border-accent/50 transition-all shadow-[inset_0_0_5px_rgba(0,0,0,0.2)] hover:shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))] group"
        >
          <Plus size={20} className="group-hover:drop-shadow-[0_0_5px_currentColor]" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {goals.map((goal) => {
            const progress = goal.targetValue && goal.currentValue 
              ? Math.min((goal.currentValue / goal.targetValue) * 100, 100) 
              : 0;
            
            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-effect p-5 rounded-[2rem] border-2 border-glass-border shadow-[0_10px_30px_var(--shadow-soft)] group hover:border-accent hover:shadow-[0_0_20px_var(--neon-glow,var(--teddy-glow))] transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded bg-surface/50 text-accent text-[8px] font-black uppercase tracking-widest border border-glass-border shadow-[inset_0_0_5px_rgba(0,0,0,0.2)]">
                        {goal.type}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-sub-text font-bold">
                        <Calendar size={10} />
                        {new Date(goal.deadline).toLocaleDateString()}
                      </div>
                    </div>
                    <h3 className="text-lg font-black text-main-text tracking-tight drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">{goal.title}</h3>
                    <p className="text-xs text-sub-text mt-1 font-bold">{goal.description}</p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => onCompleteGoal(goal)}
                      className="p-1.5 bg-background border border-glass-border text-accent-green rounded-lg hover:bg-accent-green hover:border-accent-green hover:text-white transition-all shadow-[inset_0_0_5px_rgba(0,0,0,0.5)] hover:shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    >
                      <CheckCircle size={16} />
                    </button>
                    <button 
                      onClick={() => onDeleteGoal(goal.id)}
                      className="p-1.5 bg-background border border-glass-border text-accent-red rounded-lg hover:bg-accent-red hover:border-accent-red hover:text-white transition-all shadow-[inset_0_0_5px_rgba(0,0,0,0.5)] hover:shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {goal.targetValue && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase">
                      <span className="text-sub-text">Progress</span>
                      <span className="text-accent drop-shadow-[0_0_2px_currentColor]">{goal.currentValue} / {goal.targetValue} {goal.unit}</span>
                    </div>
                    <div className="h-2 bg-background rounded-full overflow-hidden border border-glass-border shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-[var(--plush-gradient,var(--dragon-scale))] bg-accent shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))]"
                      />
                    </div>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between pt-4 border-t border-glass-border">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-accent-yellow uppercase tracking-widest drop-shadow-[0_0_2px_currentColor]">
                    <TrendingUp size={12} className="drop-shadow-[0_0_5px_currentColor]" />
                    <span>+{goal.xp_reward} XP Reward</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {goals.length === 0 && (
          <div className="py-12 text-center border-2 border-dashed border-glass-border rounded-3xl bg-surface/30 shadow-[inset_0_0_15px_rgba(0,0,0,0.2)]">
            <p className="text-sub-text text-sm font-black uppercase tracking-widest drop-shadow-[0_0_2px_rgba(0,0,0,0.5)]">No active directives. Define a goal to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FitnessGoals;
