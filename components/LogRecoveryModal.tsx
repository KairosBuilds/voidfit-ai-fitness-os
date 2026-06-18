import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Moon, Zap, X, Thermometer, Battery, Activity } from 'lucide-react';
import { RecoveryLog } from '../types';
import { reportEventToAi } from '../src/services/aiReactionService';
import { useAuthStore } from '../src/store/useAuthStore';
import { useUserStore } from '../src/store/useUserStore';

interface LogRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (log: Partial<RecoveryLog>) => void;
}

const LogRecoveryModal: React.FC<LogRecoveryModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [sleepHours, setSleepHours] = useState('8');
  const [sleepQuality, setSleepQuality] = useState(7);
  const [soreness, setSoreness] = useState(3);
  const [fatigue, setFatigue] = useState(4);
  const { apiKey } = useAuthStore();
  const { user } = useUserStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      date: new Date().toISOString(),
      sleepHours: parseFloat(sleepHours) || 0,
      sleepQuality,
      soreness,
      fatigue
    });

    if (apiKey && user) {
      reportEventToAi(apiKey, user, 'RECOVERY_LOG', {
        sleepHours: parseFloat(sleepHours) || 0,
        sleepQuality,
        soreness,
        fatigue
      });
    }
    onClose();
  };

  if (!isOpen) return null;

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
        className="relative w-full max-w-md glass-effect border-2 border-glass-border rounded-3xl overflow-hidden shadow-[0_20px_60px_var(--shadow-soft)]"
      >
        <div className="p-6 border-b border-glass-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary-action/10 rounded-xl text-secondary-action shadow-[0_0_15px_rgba(37,99,235,0.3)]">
              <Moon size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-main-text tracking-tight drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">How You Feel</h2>
              <p className="text-[10px] text-sub-text font-black uppercase tracking-widest">Log sleep and energy levels</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface/50 rounded-xl transition-colors">
            <X size={20} className="text-sub-text hover:text-main-text transition-colors" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-black uppercase tracking-widest text-main-text flex items-center gap-2">
                <Moon size={14} className="text-secondary-action" />
                Sleep Duration
              </label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  step="0.5"
                  value={sleepHours}
                  onChange={e => setSleepHours(e.target.value)}
                  className="w-16 bg-surface/50 border border-glass-border rounded-lg px-2 py-1 text-center text-main-text font-bold focus:outline-none focus:border-secondary-action focus:shadow-[0_0_10px_rgba(37,99,235,0.3)] transition-all"
                />
                <span className="text-[10px] text-sub-text font-bold uppercase">HRS</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-sub-text">Sleep Quality</span>
                <span className="text-secondary-action">{sleepQuality}/10</span>
              </div>
              <input 
                type="range" min="1" max="10" 
                value={sleepQuality} 
                onChange={e => setSleepQuality(parseInt(e.target.value))}
                className="w-full accent-secondary-action opacity-70 hover:opacity-100 transition-opacity"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-sub-text flex items-center gap-1.5">
                    <Thermometer size={10} className="text-accent-red" />
                    Muscle Soreness
                </span>
                <span className="text-accent-red">{soreness}/10</span>
              </div>
              <input 
                type="range" min="1" max="10" 
                value={soreness} 
                onChange={e => setSoreness(parseInt(e.target.value))}
                className="w-full accent-accent-red opacity-70 hover:opacity-100 transition-opacity"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-sub-text flex items-center gap-1.5">
                    <Battery size={10} className="text-accent-yellow" />
                    Energy Level
                </span>
                <span className="text-accent-yellow">{fatigue}/10</span>
              </div>
              <input 
                type="range" min="1" max="10" 
                value={fatigue} 
                onChange={e => setFatigue(parseInt(e.target.value))}
                className="w-full accent-accent-yellow opacity-70 hover:opacity-100 transition-opacity"
              />
            </div>
          </div>

          <div className="p-4 bg-surface/50 rounded-2xl border border-glass-border flex items-center gap-4 shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]">
            <div className={`p-3 rounded-xl ${soreness > 7 || fatigue > 7 ? 'bg-accent-red/20 text-accent-red shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-accent-green/20 text-accent-green shadow-[0_0_10px_rgba(16,185,129,0.3)]'}`}>
                <Activity size={20} />
            </div>
            <div>
                <div className="text-xs font-black text-main-text uppercase">Body Status</div>
                <div className="text-[10px] text-sub-text font-medium">
                    {soreness > 7 || fatigue > 7 
                        ? "You're very tired. We recommend light movement or rest." 
                        : "You're doing great! Ready for your next workout."}
                </div>
            </div>
          </div>
        </form>

        <div className="p-6 bg-surface/50 border-t border-glass-border shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]">
          <button 
            onClick={handleSubmit}
            className="w-full py-4 bg-secondary-action hover:opacity-90 text-background font-black rounded-2xl shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-all active:scale-[0.98] uppercase tracking-widest"
          >
            Save Entry
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default LogRecoveryModal;
