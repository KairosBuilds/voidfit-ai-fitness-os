import React, { useState, useEffect, useCallback } from 'react';
import { Quest, Realm, Difficulty } from '../types';
import { CheckCircle, Star, DollarSign, Clock, AlertTriangle, Calendar, User as UserIcon, Bot, GitCommit, Cpu, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGlobalTime } from '../src/hooks/useGlobalTime';

interface QuestCardProps {
  quest: Quest;
  onComplete: (questId: string) => void;
  currentDate: Date;
  isElite?: boolean;
}

const difficultyColors = {
    [Difficulty.Easy]: 'text-accent-green drop-shadow-[0_0_2px_rgba(16,185,129,0.5)]',
    [Difficulty.Medium]: 'text-secondary-action drop-shadow-[0_0_2px_rgba(37,99,235,0.5)]',
    [Difficulty.Hard]: 'text-accent-red drop-shadow-[0_0_2px_rgba(239,68,68,0.5)]',
};

const Countdown: React.FC<{ deadline: string; onExpire: () => void }> = ({ deadline, onExpire }) => {
    const now = useGlobalTime();
    const timeLeftMs = +new Date(deadline) - now;
    const expiredRef = React.useRef(false);

    useEffect(() => {
        if (timeLeftMs <= 0 && !expiredRef.current) {
            onExpire();
            expiredRef.current = true;
        }
    }, [timeLeftMs, onExpire]);


    if (timeLeftMs <= 0) {
        return <span className="font-mono text-accent-red drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]">LATE</span>;
    }

    const days = Math.floor(timeLeftMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeftMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeftMs % (1000 * 60)) / 1000);

    return (
        <span className="font-mono tabular-nums drop-shadow-[0_0_2px_var(--neon-glow,var(--teddy-glow))]">
            {days > 0 && `${days}d `}{hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </span>
    );
};

const QuestCard: React.FC<QuestCardProps> = ({ quest, onComplete, currentDate, isElite }) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const [isFailed, setIsFailed] = useState(() => +new Date(quest.deadline) <= Date.now());

  const handleComplete = useCallback(() => {
    if (isCompleting || isFailed) return;
    setIsCompleting(true);
    setTimeout(() => {
      onComplete(quest.id);
    }, 1500);
  }, [isCompleting, isFailed, onComplete, quest.id]);

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={itemVariants}
      className={`relative group neural-card-accent border-2 ${isFailed ? 'border-accent-red/30 opacity-75 grayscale-[50%]' : isElite ? 'border-yellow-400/50 shadow-[0_0_20px_rgba(250,204,21,0.2)]' : 'border-glass-border hover:border-accent/40'} rounded-[2.5rem] overflow-hidden shadow-soft transition-all duration-500`}
    >
      {/* Tactical Scan Line */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10 z-0">
          <div className="w-full h-[1px] bg-accent shadow-[0_0_15px_var(--neon-glow)] absolute top-0 animate-[tacticalScan_8s_linear_infinite]" />
      </div>

      <div className="p-6 sm:p-7 relative z-10">
        <div className="flex items-start justify-between gap-4 mb-6">
           <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                 <div className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-lg bg-background/50 border border-glass-border shadow-[inset_0_0_5px_rgba(0,0,0,0.5)] ${difficultyColors[quest.difficulty]}`}>
                    {quest.difficulty}
                 </div>
                 {isFailed && (
                    <div className="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-lg bg-accent-red/20 border border-accent-red/30 text-accent-red shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                       FAILED
                    </div>
                 )}
              </div>
              <h3 className="text-base font-black text-main-text uppercase tracking-tight leading-tight group-hover:text-accent transition-colors">{quest.title}</h3>
           </div>
           <div className="p-3 bg-surface/40 border border-glass-border rounded-2xl text-sub-text group-hover:text-accent group-hover:border-accent/30 transition-all shadow-soft group-hover:scale-110">
              <Cpu size={18} className="group-hover:animate-dragonPulse" />
           </div>
        </div>

        <div className="space-y-6">
           <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-surface/30 px-3 py-1.5 rounded-xl border border-glass-border">
                 <Zap size={12} className="text-accent-yellow drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
                 <span className="text-[10px] font-black text-main-text">+{quest.xp_reward} <span className="text-[7px] text-sub-text opacity-70 tracking-widest uppercase">XP</span></span>
              </div>
              <div className="flex items-center gap-2 bg-surface/30 px-3 py-1.5 rounded-xl border border-glass-border">
                 <DollarSign size={12} className="text-accent-green drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                 <span className="text-[10px] font-black text-main-text">+{quest.gold_reward} <span className="text-[7px] text-sub-text opacity-70 tracking-widest uppercase">COINS</span></span>
              </div>
           </div>

           <div className="pt-6 border-t border-glass-border/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sub-text opacity-60">
                    <Clock size={12} />
                    <span className="text-[8px] font-black uppercase tracking-[0.2em]">Time Left</span>
                </div>
                {!isFailed && (
                    <div className="text-[10px] font-mono text-accent tabular-nums bg-accent/5 px-2 py-1 rounded-lg border border-accent/20 shadow-[inset_0_0_5px_var(--shadow-soft)]">
                        <Countdown deadline={quest.deadline} onExpire={useCallback(() => setIsFailed(true), [])} />
                    </div>
                )}
              </div>
              
              <button
                onClick={handleComplete}
                disabled={isFailed || isCompleting}
                className={`w-full flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-[0.3em] py-4 rounded-2xl transition-all relative overflow-hidden group/btn
                  ${(isFailed || isCompleting) 
                    ? 'bg-background border border-glass-border text-sub-text opacity-50 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]' 
                    : 'bg-[var(--plush-gradient,var(--dragon-scale))] bg-accent text-white shadow-[0_0_15px_var(--neon-glow,var(--teddy-glow))] active:scale-[0.98] hover:shadow-[0_0_25px_var(--neon-glow,var(--teddy-glow))]'
                  }
                `}
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform" />
                <span className="relative z-10">{isFailed ? 'Late' : isCompleting ? 'Completing...' : 'Done'}</span>
              </button>
           </div>
        </div>
      </div>
    </motion.div>
  );
};

export default QuestCard;