import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

interface TrainingModuleProps {
  module: { name: string, unit: string, xp: number };
  isSelected: boolean;
  onClick: () => void;
  realmColor: string;
}

export const TrainingModule: React.FC<TrainingModuleProps> = ({ module, isSelected, onClick, realmColor }) => (
  <button
    onClick={onClick}
    className={`p-4 rounded-2xl border transition-all duration-300 text-left group relative overflow-hidden ${
      isSelected 
        ? 'bg-surface border-accent shadow-[0_0_20px_rgba(217,70,239,0.15)]' 
        : 'bg-surface/30 border-glass-border hover:border-glass-border-hover'
    }`}
  >
    <div className="flex items-center justify-between mb-1 relative z-10">
      <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-accent' : 'text-main-text'}`}>{module.name}</span>
      <ArrowUpRight size={14} className={`transition-transform duration-300 ${isSelected ? 'rotate-45 text-accent' : 'text-sub-text group-hover:translate-x-0.5 group-hover:-translate-y-0.5'}`} />
    </div>
    <div className="text-[8px] font-bold text-sub-text uppercase relative z-10">+{module.xp} XP per {module.unit}</div>
    {isSelected && (
      <motion.div 
        layoutId="moduleGlow"
        className="absolute inset-0 bg-accent/5 pointer-events-none"
      />
    )}
  </button>
);
