import React, { useState } from 'react';
import { X, Target, Zap, Clock, Shield } from 'lucide-react';
import { Quest, Realm, Difficulty, QuestStatus } from '../types';
import AiTextGenerator from './AiTextGenerator';
import { motion, AnimatePresence } from 'framer-motion';

interface AddQuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddQuest: (questData: Omit<Quest, 'id' | 'status' | 'source'>) => void;
  apiKey: string;
}

const AddQuestModal: React.FC<AddQuestModalProps> = ({ isOpen, onClose, onAddQuest, apiKey }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [realm, setRealm] = useState<Realm>(Realm.Strength);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.Easy);
  const [xp, setXp] = useState(50);
  const [duration, setDuration] = useState(30);

  if (!isOpen) return null;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddQuest({
        title,
        description,
        realm,
        difficulty,
        xp_reward: Number(xp),
        duration_est_min: Number(duration),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg bg-[var(--glass-bg)] border border-glass-border rounded-3xl overflow-hidden shadow-[0_20px_60px_var(--shadow-soft)] backdrop-blur-3xl"
      >
        <div className="p-6 border-b border-glass-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/20 rounded-xl text-accent border border-accent/30 shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))]">
              <Target size={24} className="drop-shadow-[0_0_5px_currentColor]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-main-text tracking-tight drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">Add Goal</h2>
              <p className="text-[10px] text-sub-text font-black uppercase tracking-widest">Add a custom goal or workout</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface/50 rounded-xl transition-colors">
            <X size={20} className="text-sub-text hover:text-main-text transition-colors" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-sub-text mb-2 block">Title</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  required 
                  className="w-full bg-surface/50 border border-glass-border rounded-xl px-4 py-3 text-main-text focus:outline-none focus:border-accent focus:shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))] transition-all"
                  placeholder="e.g. 5km Zone 2 Run"
                />
                <AiTextGenerator
                  apiKey={apiKey}
                  context="a title for a personal fitness quest"
                  onGenerated={setTitle}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-sub-text mb-2 block">Description</label>
              <div className="relative">
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  rows={3} 
                  className="w-full bg-surface/50 border border-glass-border rounded-xl px-4 py-3 text-main-text focus:outline-none focus:border-accent focus:shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))] transition-all resize-none"
                  placeholder="Details of the exercise or mission parameters..."
                />
                <AiTextGenerator
                  apiKey={apiKey}
                  context="a short description for a personal fitness quest"
                  onGenerated={setDescription}
                  className="absolute right-2 top-3"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-sub-text">Category</label>
              <select 
                value={realm} 
                onChange={e => setRealm(e.target.value as Realm)} 
                className="w-full bg-surface/50 border border-glass-border rounded-xl px-4 py-3 text-main-text focus:outline-none focus:border-accent focus:shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))] transition-all appearance-none"
              >
                {Object.values(Realm).map(r => <option key={r} value={r} className="bg-background text-main-text">{r}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-sub-text">Difficulty</label>
              <select 
                value={difficulty} 
                onChange={e => setDifficulty(e.target.value as Difficulty)} 
                className="w-full bg-surface/50 border border-glass-border rounded-xl px-4 py-3 text-main-text focus:outline-none focus:border-accent focus:shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))] transition-all appearance-none"
              >
                {Object.values(Difficulty).map(d => <option key={d} value={d} className="bg-background text-main-text">{d}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-sub-text">XP Reward</label>
              <div className="relative">
                <input 
                  type="number" 
                  min={0}
                  max={5000}
                  value={xp} 
                  onChange={e => setXp(Math.min(Math.max(0, Number(e.target.value)), 5000))} 
                  className="w-full bg-surface/50 border border-glass-border rounded-xl px-4 py-3 text-main-text focus:outline-none focus:border-accent focus:shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))] transition-all"
                />
                <Zap size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-accent-yellow drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-sub-text">Est. Duration (Min)</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={duration} 
                  onChange={e => setDuration(Number(e.target.value))} 
                  className="w-full bg-surface/50 border border-glass-border rounded-xl px-4 py-3 text-main-text focus:outline-none focus:border-accent focus:shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))] transition-all"
                />
                <Clock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-accent drop-shadow-[0_0_5px_var(--neon-glow,var(--teddy-glow))]" />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-[var(--plush-gradient,var(--dragon-scale))] bg-accent hover:opacity-90 text-white font-black rounded-2xl shadow-[0_0_15px_var(--neon-glow,var(--teddy-glow))] transition-all active:scale-[0.98] uppercase tracking-widest mt-4 flex items-center justify-center gap-2 group"
          >
            Add Goal
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AddQuestModal;