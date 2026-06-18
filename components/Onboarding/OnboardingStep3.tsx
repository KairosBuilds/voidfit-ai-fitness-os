import React from 'react';
import { motion } from 'framer-motion';
import { HeartPulse, ShieldAlert, Gauge, ArrowRight } from 'lucide-react';

interface OnboardingStep3Props {
  injuries: string;
  setInjuries: (val: string) => void;
  experience: 'Beginner' | 'Intermediate' | 'Advanced';
  setExperience: (val: 'Beginner' | 'Intermediate' | 'Advanced') => void;
  stamina: number;
  setStamina: (val: number) => void;
  flexibility: number;
  setFlexibility: (val: number) => void;
  onBack: () => void;
  onNext: () => void;
  slideVariants: any;
}

export const OnboardingStep3: React.FC<OnboardingStep3Props> = ({
  injuries, setInjuries, experience, setExperience, stamina, setStamina, flexibility, setFlexibility, onBack, onNext, slideVariants
}) => (
  <motion.div key="step3" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
    <div className="flex items-center space-x-3">
      <HeartPulse className="text-accent-red" />
      <h2 className="text-xl font-black uppercase tracking-tight">Physical State</h2>
    </div>
    <div className="space-y-4">
       <div className="space-y-2">
          <label className="text-[10px] font-black text-sub-text uppercase tracking-widest ml-1 flex items-center gap-1"><ShieldAlert size={12} className="text-accent-red" /> Active Injuries / Limitations</label>
          <textarea placeholder="e.g. Lower back pain, Rotator cuff" value={injuries} onChange={(e) => setInjuries(e.target.value)} className="w-full h-20 bg-background border border-glass-border rounded-xl px-4 py-3 text-main-text focus:outline-none focus:border-accent-red focus:shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-all resize-none" />
       </div>
       <div className="space-y-2">
          <label className="text-[10px] font-black text-sub-text uppercase tracking-widest ml-1 flex items-center gap-1"><Gauge size={12} className="text-accent-red" /> Current Experience</label>
          <div className="flex gap-2">
            {(['Beginner', 'Intermediate', 'Advanced'] as const).map(exp => (
              <button key={exp} onClick={() => setExperience(exp)} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl border transition-all ${experience === exp ? 'bg-accent-red border-accent-red text-main-text shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-surface/50 border-glass-border text-sub-text hover:border-accent-red/50'}`}>{exp}</button>
            ))}
          </div>
       </div>
       <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-sub-text uppercase tracking-widest ml-1">Stamina (1-10)</label>
            <input type="range" min="1" max="10" value={stamina} onChange={(e) => setStamina(parseInt(e.target.value))} className="w-full accent-accent-red" />
            <div className="flex justify-between text-[8px] font-black text-sub-text uppercase"><span>Weak</span><span>Tier {stamina}</span><span>Elite</span></div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-sub-text uppercase tracking-widest ml-1">Flexibility (1-10)</label>
            <input type="range" min="1" max="10" value={flexibility} onChange={(e) => setFlexibility(parseInt(e.target.value))} className="w-full accent-accent-red" />
            <div className="flex justify-between text-[8px] font-black text-sub-text uppercase"><span>Stiff</span><span>Tier {flexibility}</span><span>Limber</span></div>
          </div>
       </div>
    </div>
    <div className="flex gap-4 mt-8">
      <button onClick={onBack} className="px-6 py-4 bg-surface/50 hover:bg-surface text-main-text font-black rounded-xl transition-all active:scale-95 uppercase tracking-widest">Back</button>
      <button onClick={onNext} className="flex-1 py-4 bg-accent-red text-main-text font-black rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 uppercase tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.5)]">
        <span>Continue</span>
        <ArrowRight size={18} />
      </button>
    </div>
  </motion.div>
);
