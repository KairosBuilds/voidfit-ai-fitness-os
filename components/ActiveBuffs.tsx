import React, { useState, useEffect } from 'react';
import { ActiveBuff } from '../types';
import { Zap, Shield, RefreshCw, ChevronsUp, Gift, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActiveBuffsProps {
  activeBuffs: ActiveBuff[];
}

const itemIcons: { [key: string]: React.ReactNode } = {
    'XP_BOOST': <Zap className="w-6 h-6 text-accent-secondary" />,
    'STREAK_SAVER': <Shield className="w-6 h-6 text-accent-primary" />,
    'QUEST_REROLL': <RefreshCw className="w-6 h-6 text-accent-green" />,
    'INSTANT_STREAK': <ChevronsUp className="w-6 h-6 text-accent-secondary" />,
    'REAL_WORLD_REWARD': <Gift className="w-6 h-6 text-accent-tertiary" />,
};

const BuffCountdown: React.FC<{ expiryTimestamp: number }> = ({ expiryTimestamp }) => {
    const [timeLeft, setTimeLeft] = useState(expiryTimestamp - Date.now());

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(expiryTimestamp - Date.now());
        }, 1000);

        return () => clearInterval(timer);
    }, [expiryTimestamp]);

    if (timeLeft <= 0) {
        return <span className="font-mono">Expired</span>;
    }
    
    const hours = Math.floor((timeLeft / (1000 * 60 * 60)));
    const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
    const seconds = Math.floor((timeLeft / 1000) % 60);

    return (
        <span className="font-mono">
            {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
    );
};


const ActiveBuffs: React.FC<ActiveBuffsProps> = ({ activeBuffs }) => {
  if (activeBuffs.length === 0) {
    return null;
  }

  const containerVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { opacity: 1, height: 'auto', transition: { duration: 0.3, staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } }
  };

  return (
    <motion.div 
        className="glass-effect p-5 sm:p-6 rounded-[2.5rem] border-2 border-glass-border shadow-[0_10px_30px_var(--shadow-soft)] relative overflow-hidden group z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
    >
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--plush-gradient,var(--dragon-scale))] bg-accent opacity-10 rounded-full filter blur-[40px] pointer-events-none group-hover:opacity-20 transition-all duration-700"></div>
        
        <div className="flex items-center gap-3 mb-5 relative z-10">
            <div className="p-2 bg-background/50 rounded-xl border border-glass-border text-accent shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
                <Sparkles size={20} className="animate-pulse drop-shadow-[0_0_5px_currentColor]" />
            </div>
            <h3 className="text-xl font-black text-main-text tracking-tight drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">Active Boosts</h3>
            <div className="flex-1 h-px bg-gradient-to-r from-glass-border to-transparent ml-2"></div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 relative z-10">
            <AnimatePresence>
            {activeBuffs.map(buff => {
                 const icon = itemIcons[buff.effect.type];
                 return (
                    <motion.div 
                        key={buff.itemId} 
                        variants={itemVariants}
                        layout
                        className="bg-surface/30 p-4 rounded-[1.5rem] border border-glass-border flex items-center space-x-4 hover:bg-surface/50 hover:border-accent transition-all duration-300 group/item hover:shadow-[0_0_15px_var(--neon-glow,var(--teddy-glow))] hover:-translate-y-1 shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]"
                    >
                        <div className="flex-shrink-0 p-2 bg-background/50 rounded-xl border border-glass-border group-hover/item:scale-110 transition-all duration-300 shadow-[inset_0_0_5px_rgba(0,0,0,0.5)] group-hover/item:drop-shadow-[0_0_5px_var(--neon-glow,var(--teddy-glow))]">{icon}</div>
                        <div className="flex-grow min-w-0">
                            <p className="font-black text-main-text tracking-wide truncate drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">{buff.itemName}</p>
                            <div className="flex items-center text-xs font-black text-accent bg-background/50 inline-flex px-2 py-0.5 rounded-lg border border-glass-border space-x-1.5 mt-1.5 shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
                                <Clock size={12} className="drop-shadow-[0_0_2px_currentColor]" />
                                <BuffCountdown expiryTimestamp={buff.expiryTimestamp} />
                            </div>
                        </div>
                    </motion.div>
                 )
            })}
            </AnimatePresence>
        </div>
    </motion.div>
  );
};

export default ActiveBuffs;