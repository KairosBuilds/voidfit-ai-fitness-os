import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, X, Plus, Minus, CheckCircle2, Waves } from 'lucide-react';
import { useDatabase } from '../src/db/useDatabase';

interface WaterTrackerProps {
  isOpen: boolean;
  onClose: () => void;
}

const WaterTracker: React.FC<WaterTrackerProps> = ({ isOpen, onClose }) => {
  const [amount, setAmount] = useState(250);
  const { addWaterLog } = useDatabase();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleLog = async () => {
    try {
      await addWaterLog({
        id: `water-${Date.now()}`,
        date: new Date().toISOString(),
        amount_ml: amount
      });
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 1500);
    } catch (e) {
      console.error('[VoidFit] Water Log Failed:', e);
      // Optional: show error toast or notification
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-background/90 backdrop-blur-md"
      />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-sm glass-effect border-2 border-accent-blue/30 rounded-[3rem] overflow-hidden shadow-[0_20px_50px_rgba(59,130,246,0.2)]"
      >
        <div className="p-8 space-y-8">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="p-5 rounded-[2rem] bg-accent-blue/10 text-accent-blue border border-accent-blue/20 shadow-[0_0_30px_rgba(59,130,246,0.1)] relative">
                <div className="absolute inset-0 animate-pulse bg-accent-blue/5 rounded-[2rem] blur-xl" />
                <Droplets size={48} className="relative z-10" />
            </div>
            <div>
                <h2 className="text-2xl font-black text-main-text uppercase tracking-tight">Water Log</h2>
                <p className="text-[10px] text-sub-text font-black uppercase tracking-[0.3em] mt-1">Log your water intake</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-8">
            <button 
                onClick={() => setAmount(Math.max(50, amount - 50))}
                className="p-4 rounded-2xl bg-surface/50 border border-glass-border text-sub-text hover:text-accent-blue transition-all active:scale-90"
            >
                <Minus size={24} />
            </button>
            
            <div className="text-center min-w-[120px]">
                <div className="text-4xl font-black text-main-text tabular-nums">{amount}</div>
                <div className="text-[10px] font-black text-accent-blue uppercase tracking-widest">ml</div>
            </div>

            <button 
                onClick={() => setAmount(amount + 50)}
                className="p-4 rounded-2xl bg-surface/50 border border-glass-border text-sub-text hover:text-accent-blue transition-all active:scale-90"
            >
                <Plus size={24} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[250, 500, 750].map(val => (
                <button 
                    key={val}
                    onClick={() => setAmount(val)}
                    className={`py-2 rounded-xl text-[10px] font-black border transition-all ${amount === val ? 'bg-accent-blue/20 border-accent-blue text-accent-blue' : 'bg-surface/30 border-glass-border text-sub-text hover:border-accent-blue/50'}`}
                >
                    {val}ml
                </button>
            ))}
          </div>

          <button 
            onClick={handleLog}
            disabled={showSuccess}
            className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${showSuccess ? 'bg-accent-green text-white shadow-[0_0_20px_#10b981]' : 'bg-accent-blue text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:shadow-[0_0_30px_rgba(59,130,246,0.8)] active:scale-95'}`}
          >
             {showSuccess ? (
                <><CheckCircle2 size={20} /> LOGGED</>
            ) : (
                <><Waves size={20} /> ADD WATER</>
            )}
          </button>
        </div>

        <button onClick={onClose} className="absolute top-6 right-6 text-sub-text hover:text-main-text transition-colors">
            <X size={20} />
        </button>
      </motion.div>
    </div>
  );
};

export default WaterTracker;
