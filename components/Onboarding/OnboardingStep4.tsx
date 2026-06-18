import React from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Dna, ArrowRight } from 'lucide-react';

interface OnboardingStep4Props {
  pushups: string;
  setPushups: (val: string) => void;
  pullups: string;
  setPullups: (val: string) => void;
  runningAbility: string;
  setRunningAbility: (val: string) => void;
  strengthLevel: number;
  setStrengthLevel: (val: number) => void;
  onBack: () => void;
  onNext: () => void;
  slideVariants: any;
}

export const OnboardingStep4: React.FC<OnboardingStep4Props> = ({
  pushups, setPushups, pullups, setPullups, runningAbility, setRunningAbility, strengthLevel, setStrengthLevel, onBack, onNext, slideVariants
}) => (
  <motion.div key="step4" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
    <div className="flex items-center space-x-3">
      <Dumbbell className="text-accent" />
      <h2 className="text-xl font-black uppercase tracking-tight">Fitness Ability</h2>
    </div>
    <div className="bg-accent/5 border border-accent/20 p-4 rounded-xl">
       <h3 className="text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><Dna size={14} /> Base Strength Profile</h3>
       <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
              <label className="text-[10px] font-black text-sub-text uppercase tracking-widest ml-1">Pushup Strength</label>
              <input type="number" value={pushups} onChange={(e) => setPushups(e.target.value)} className="w-full bg-background border border-glass-border rounded-xl px-4 py-3 text-main-text focus:outline-none focus:border-accent focus:shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))] transition-all" placeholder="Max reps" />
          </div>
          <div className="space-y-1">
              <label className="text-[10px] font-black text-sub-text uppercase tracking-widest ml-1">Pullup Strength</label>
              <input type="number" value={pullups} onChange={(e) => setPullups(e.target.value)} className="w-full bg-background border border-glass-border rounded-xl px-4 py-3 text-main-text focus:outline-none focus:border-accent focus:shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))] transition-all" placeholder="Max reps" />
          </div>
          <div className="col-span-2 space-y-2">
              <label className="text-[10px] font-black text-sub-text uppercase tracking-widest ml-1">Running Experience</label>
              <select value={runningAbility} onChange={(e) => setRunningAbility(e.target.value)} className="w-full bg-background border border-glass-border rounded-xl px-4 py-3 text-main-text focus:outline-none focus:border-accent focus:shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))] transition-all appearance-none">
                 <option value="Beginner">Low (can't run 1km)</option>
                 <option value="Casual">Moderate (1-5km)</option>
                 <option value="Runner">High (5-10km)</option>
                 <option value="Elite">Elite (Marathon focus)</option>
              </select>
          </div>
          <div className="col-span-2 space-y-2">
              <label className="text-[10px] font-black text-sub-text uppercase tracking-widest ml-1">Overall Fitness Level (1-10)</label>
              <input type="range" min="1" max="10" value={strengthLevel} onChange={(e) => setStrengthLevel(parseInt(e.target.value))} className="w-full accent-accent" />
              <div className="flex justify-between text-[8px] font-black text-sub-text uppercase"><span>Beginner</span><span>Level {strengthLevel}</span><span>Advanced</span></div>
          </div>
       </div>
    </div>
    <div className="flex gap-4 mt-8">
      <button onClick={onBack} className="px-6 py-4 bg-surface/50 hover:bg-surface text-main-text font-black rounded-xl transition-all active:scale-95 uppercase tracking-widest">Back</button>
      <button onClick={onNext} className="flex-1 py-4 bg-accent text-main-text font-black rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 uppercase tracking-widest shadow-[0_0_15px_var(--neon-glow,var(--teddy-glow))]">
        <span>Lifestyle</span>
        <ArrowRight size={18} />
      </button>
    </div>
  </motion.div>
);
