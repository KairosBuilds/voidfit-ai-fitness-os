import React from 'react';
import { motion } from 'framer-motion';
import { Utensils, Brain, Sparkles, Loader2 } from 'lucide-react';
import { AiPersonality } from '../../types';

interface OnboardingStep6Props {
  foodPreferences: string;
  setFoodPreferences: (val: string) => void;
  allergies: string;
  setAllergies: (val: string) => void;
  personality: AiPersonality;
  setPersonality: (val: AiPersonality) => void;
  onBack: () => void;
  onFinish: () => void;
  isProcessing: boolean;
  slideVariants: any;
}

export const OnboardingStep6: React.FC<OnboardingStep6Props> = ({
  foodPreferences, setFoodPreferences, allergies, setAllergies, personality, setPersonality, onBack, onFinish, isProcessing, slideVariants
}) => (
  <motion.div key="step6" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
    <div className="flex items-center space-x-3">
      <Utensils className="text-accent-green" />
      <h2 className="text-xl font-black uppercase tracking-tight">Fuel & Recovery</h2>
    </div>
    <div className="space-y-4">
       <div className="space-y-2">
          <label className="text-[10px] font-black text-sub-text uppercase tracking-widest ml-1">Food Preferences</label>
          <input type="text" placeholder="e.g. High protein, Vegan, Keto" value={foodPreferences} onChange={(e) => setFoodPreferences(e.target.value)} className="w-full bg-background border border-glass-border rounded-xl px-4 py-3 text-main-text focus:outline-none focus:border-accent-green focus:shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all" />
       </div>
       <div className="space-y-2">
          <label className="text-[10px] font-black text-sub-text uppercase tracking-widest ml-1">Allergies / Intolerances</label>
          <input type="text" placeholder="e.g. Dairy, Peanuts" value={allergies} onChange={(e) => setAllergies(e.target.value)} className="w-full bg-background border border-glass-border rounded-xl px-4 py-3 text-main-text focus:outline-none focus:border-accent-green focus:shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all" />
       </div>
       <div className="space-y-3 p-4 bg-accent-green/5 border border-accent-green/10 rounded-xl">
          <h3 className="text-[10px] font-black text-accent-green uppercase tracking-[0.2em] mb-2 flex items-center gap-2"><Brain size={14} /> Coach Personality</h3>
          <div className="grid grid-cols-2 gap-2">
             {Object.values(AiPersonality).map(p => (
               <button key={p} onClick={() => setPersonality(p)} className={`px-3 py-2 text-[8px] font-black uppercase tracking-widest rounded-lg border transition-all ${personality === p ? 'bg-accent-green border-accent-green text-background shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-surface/50 border-glass-border text-sub-text hover:text-main-text'}`}>{p}</button>
             ))}
          </div>
       </div>
    </div>
    <div className="flex gap-4 mt-8">
      <button onClick={onBack} className="px-6 py-4 bg-surface/50 hover:bg-surface text-main-text font-black rounded-xl transition-all active:scale-95 uppercase tracking-widest">Back</button>
      <motion.button 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onFinish} 
        disabled={isProcessing} 
        className="flex-1 py-4 bg-primary-action text-main-text font-black rounded-xl flex items-center justify-center space-x-2 transition-all uppercase tracking-widest shadow-[0_0_15px_var(--neon-glow,var(--teddy-glow))] hover:shadow-[0_0_25px_var(--neon-glow,var(--teddy-glow))]"
      >
        {isProcessing ? (
          <><Loader2 className="animate-spin" size={18} /><span>Initializing...</span></>
        ) : (
          <><Sparkles size={18} className="animate-pulse" /><span>MEET MY COACH</span></>
        )}
      </motion.button>
    </div>
  </motion.div>
);
