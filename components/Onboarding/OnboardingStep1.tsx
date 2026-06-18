import React from 'react';
import { motion } from 'framer-motion';
import { Key, ArrowRight, ShieldAlert, ShieldCheck } from 'lucide-react';
import { UserProfile } from '../../auth/googleAuth';

interface OnboardingStep1Props {
  apiKey: string;
  setApiKey: (val: string) => void;
  name: string;
  setName: (val: string) => void;
  validationError: string | null;
  googleProfile: UserProfile | null;
  onNext: () => void;
  isProcessing: boolean;
  slideVariants: any;
}

export const OnboardingStep1: React.FC<OnboardingStep1Props> = ({
  apiKey, setApiKey, name, setName, validationError, googleProfile, onNext, isProcessing, slideVariants
}) => (
  <motion.div key="step1" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
    <div className="flex items-center space-x-3">
      <Key className="text-primary-action" />
      <h2 className="text-xl font-black uppercase tracking-tight">AI Connection</h2>
    </div>
    <div className="bg-background/50 p-4 rounded-xl border border-glass-border space-y-2">
      <p className="text-xs text-sub-text font-bold leading-relaxed uppercase tracking-widest">Input Gemini API Key</p>
      <input 
        type="password"
        placeholder="AIzaSy..."
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        className="w-full bg-background border border-glass-border rounded-xl px-4 py-3 text-main-text focus:outline-none focus:border-primary-action focus:shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))] transition-all"
      />
    </div>
    <div className="bg-background/50 p-4 rounded-xl border border-glass-border space-y-2">
      <p className="text-xs text-sub-text font-bold uppercase tracking-widest">Your Name</p>
      <input 
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full bg-background border border-glass-border rounded-xl px-4 py-3 text-main-text focus:outline-none focus:border-primary-action focus:shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))] transition-all"
      />
    </div>
    {validationError && (
      <div className="p-3 bg-accent-red/10 border border-accent-red/20 rounded-xl flex items-center gap-2 text-accent-red text-[10px] font-bold uppercase tracking-tight">
        <ShieldAlert size={14} />
        <span>{validationError}</span>
      </div>
    )}
    <button onClick={onNext} disabled={!apiKey || !name || isProcessing} className="w-full py-4 bg-primary-action text-main-text font-black rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 uppercase tracking-widest disabled:opacity-50 shadow-[0_0_15px_var(--neon-glow,var(--teddy-glow))]">
      <span>{isProcessing ? 'Validating...' : 'Start Setup'}</span>
      <ArrowRight size={18} />
    </button>

    <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-glass-border"></div></div>
        <div className="relative flex justify-center text-[8px] uppercase font-black"><span className="bg-surface px-2 text-sub-text">Or Secure via Account</span></div>
    </div>

    <div id="google-signin-btn" className="flex justify-center"></div>
    
    {googleProfile && (
        <div className="flex items-center gap-3 p-3 bg-accent-green/10 border border-accent-green/20 rounded-xl">
            <img src={googleProfile.picture} alt="" className="w-8 h-8 rounded-full border border-accent-green/30" loading="lazy" />
            <div className="flex-1">
                <p className="text-[10px] font-black text-main-text">{googleProfile.name}</p>
                <p className="text-[8px] text-accent-green font-bold uppercase">Cloud Sync Active</p>
            </div>
            <ShieldCheck size={16} className="text-accent-green" />
        </div>
    )}
  </motion.div>
);
