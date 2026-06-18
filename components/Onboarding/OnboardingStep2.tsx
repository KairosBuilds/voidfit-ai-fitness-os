import React from 'react';
import { motion } from 'framer-motion';
import { Scale, ArrowRight } from 'lucide-react';

interface OnboardingStep2Props {
  gender: 'Male' | 'Female' | 'Other';
  setGender: (val: 'Male' | 'Female' | 'Other') => void;
  age: string;
  setAge: (val: string) => void;
  height: string;
  setHeight: (val: string) => void;
  weight: string;
  setWeight: (val: string) => void;
  targetWeight: string;
  setTargetWeight: (val: string) => void;
  bmi: number;
  idealWeight: number;
  onBack: () => void;
  onNext: () => void;
  slideVariants: any;
}

export const OnboardingStep2: React.FC<OnboardingStep2Props> = ({
  gender, setGender, age, setAge, height, setHeight, weight, setWeight, targetWeight, setTargetWeight, bmi, idealWeight, onBack, onNext, slideVariants
}) => (
  <motion.div key="step2" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
    <div className="flex items-center space-x-3">
      <Scale className="text-secondary-action" />
      <h2 className="text-xl font-black uppercase tracking-tight">Body Stats</h2>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2 flex p-1 bg-background/50 rounded-xl border border-glass-border">
        {(['Male', 'Female', 'Other'] as const).map(g => (
          <button key={g} onClick={() => setGender(g)} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${gender === g ? 'bg-secondary-action text-main-text shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))]' : 'text-sub-text hover:text-main-text'}`}>{g}</button>
        ))}
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-black text-sub-text uppercase tracking-widest ml-1">Age</label>
        <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-background border border-glass-border rounded-xl px-4 py-3 text-main-text focus:outline-none focus:border-secondary-action focus:shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))] transition-all" />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-black text-sub-text uppercase tracking-widest ml-1">Height (cm)</label>
        <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="w-full bg-background border border-glass-border rounded-xl px-4 py-3 text-main-text focus:outline-none focus:border-secondary-action focus:shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))] transition-all" />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-black text-sub-text uppercase tracking-widest ml-1">Weight (kg)</label>
        <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full bg-background border border-glass-border rounded-xl px-4 py-3 text-main-text focus:outline-none focus:border-secondary-action focus:shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))] transition-all" />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-black text-sub-text uppercase tracking-widest ml-1">Target (kg)</label>
        <input type="number" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} className="w-full bg-background border border-glass-border rounded-xl px-4 py-3 text-main-text focus:outline-none focus:border-secondary-action focus:shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))] transition-all" />
      </div>
    </div>
    <div className="p-4 bg-secondary-action/10 border border-secondary-action/20 rounded-xl flex items-center justify-between">
      <div>
        <p className="text-[10px] font-black text-secondary-action uppercase tracking-widest">Calculated BMI</p>
        <p className="text-2xl font-black text-main-text drop-shadow-[0_0_5px_var(--neon-glow,var(--teddy-glow))]">{bmi}</p>
      </div>
      <div className="text-right">
        <p className="text-[10px] font-black text-secondary-action uppercase tracking-widest">Ideal Weight</p>
        <p className="text-2xl font-black text-main-text drop-shadow-[0_0_5px_var(--neon-glow,var(--teddy-glow))]">{idealWeight} <span className="text-xs">KG</span></p>
      </div>
    </div>
    <div className="flex gap-4">
      <button onClick={onBack} className="px-6 py-4 bg-surface/50 hover:bg-surface text-main-text font-black rounded-xl transition-all active:scale-95 uppercase tracking-widest">Back</button>
      <button onClick={onNext} className="flex-1 py-4 bg-secondary-action text-main-text font-black rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 uppercase tracking-widest shadow-[0_0_15px_var(--neon-glow,var(--teddy-glow))]">
        <span>Physical State</span>
        <ArrowRight size={18} />
      </button>
    </div>
  </motion.div>
);
