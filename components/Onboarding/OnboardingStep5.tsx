import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Construction, ArrowRight } from 'lucide-react';

interface OnboardingStep5Props {
  sleepSchedule: string;
  setSleepSchedule: (val: string) => void;
  stress: number;
  setStress: (val: number) => void;
  gymAccess: boolean;
  setGymAccess: (val: boolean) => void;
  equipment: string;
  setEquipment: (val: string) => void;
  dailySchedule: string;
  setDailySchedule: (val: string) => void;
  onBack: () => void;
  onNext: () => void;
  slideVariants: any;
}

export const OnboardingStep5: React.FC<OnboardingStep5Props> = ({
  sleepSchedule, setSleepSchedule, stress, setStress, gymAccess, setGymAccess, equipment, setEquipment, dailySchedule, setDailySchedule, onBack, onNext, slideVariants
}) => (
  <motion.div key="step5" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
    <div className="flex items-center space-x-3">
      <Clock className="text-accent-yellow" />
      <h2 className="text-xl font-black uppercase tracking-tight">Lifestyle & Access</h2>
    </div>
    <div className="space-y-4">
       <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-sub-text uppercase tracking-widest ml-1">Sleep Schedule</label>
            <input type="text" placeholder="e.g. 11PM-7AM" value={sleepSchedule} onChange={(e) => setSleepSchedule(e.target.value)} className="w-full bg-background border border-glass-border rounded-xl px-4 py-3 text-main-text focus:outline-none focus:border-accent-yellow focus:shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-sub-text uppercase tracking-widest ml-1">Stress (1-10)</label>
            <input type="number" min="1" max="10" value={stress} onChange={(e) => setStress(parseInt(e.target.value))} className="w-full bg-background border border-glass-border rounded-xl px-4 py-3 text-main-text focus:outline-none focus:border-accent-yellow focus:shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all" />
          </div>
       </div>
       <div className="flex items-center justify-between p-4 bg-background/50 rounded-xl border border-glass-border">
          <span className="text-xs font-black uppercase tracking-widest text-main-text">Gym Access</span>
          <button onClick={() => setGymAccess(!gymAccess)} className={`w-12 h-6 rounded-full transition-all relative ${gymAccess ? 'bg-accent-yellow shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-surface border border-glass-border'}`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-main-text transition-all ${gymAccess ? 'left-7' : 'left-1'}`} />
          </button>
       </div>
       <div className="space-y-1">
          <label className="text-[10px] font-black text-sub-text uppercase tracking-widest ml-1 flex items-center gap-1"><Construction size={12} className="text-accent-yellow" /> Home Equipment (Comma separated)</label>
          <input type="text" placeholder="Dumbbells, Pullup bar, etc." value={equipment} onChange={(e) => setEquipment(e.target.value)} className="w-full bg-background border border-glass-border rounded-xl px-4 py-3 text-main-text focus:outline-none focus:border-accent-yellow focus:shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all" />
       </div>
       <div className="space-y-1">
          <label className="text-[10px] font-black text-sub-text uppercase tracking-widest ml-1">Daily Schedule Context</label>
          <textarea placeholder="e.g. Busy mornings, workouts best at 6PM" value={dailySchedule} onChange={(e) => setDailySchedule(e.target.value)} className="w-full h-16 bg-background border border-glass-border rounded-xl px-4 py-3 text-main-text focus:outline-none focus:border-accent-yellow focus:shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all resize-none" />
       </div>
    </div>
    <div className="flex gap-4">
      <button onClick={onBack} className="px-6 py-4 bg-surface/50 hover:bg-surface text-main-text font-black rounded-xl transition-all active:scale-95 uppercase tracking-widest">Back</button>
      <button onClick={onNext} className="flex-1 py-4 bg-accent-yellow text-background font-black rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 uppercase tracking-widest shadow-[0_0_15px_rgba(245,158,11,0.5)]">
        <span>Nutrition</span>
        <ArrowRight size={18} />
      </button>
    </div>
  </motion.div>
);
