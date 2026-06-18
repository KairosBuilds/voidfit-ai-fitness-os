import React from 'react';
import { motion } from 'framer-motion';
import { User } from '../types';
import { Settings, Flame } from 'lucide-react';
import { useUserStore } from '../src/store/useUserStore';
import { useUiStore } from '../src/store/useUiStore';

interface HeaderProps {
  user?: User;
}

export const Header: React.FC<HeaderProps> = ({ user: propUser }) => {
  const storeUser = useUserStore(s => s.user);
  const setView = useUiStore(s => s.setView);
  const user = propUser || storeUser;
  if (!user) return null;

  const xpPct = Math.min(100, (user.xp_total / user.xpToNextLevel) * 100);
  const streak = user.streaks?.daily_streak || 0;

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: -8 },
    animate: { opacity: 1, y: 0, transition: { delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  });

  return (
    <motion.header
      className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border pt-[calc(0.5rem+env(safe-area-inset-top))]"
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="px-4 py-2.5 max-w-2xl mx-auto flex items-center justify-between gap-2">
        
        <motion.button onClick={() => setView('profile')} className="flex items-center gap-2.5 shrink-0" {...fadeUp(0.1)}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-action to-accent p-[1.5px]">
            <div className="w-full h-full rounded-[7px] bg-background flex items-center justify-center">
              <span className="text-xs font-bold text-text-primary">{user.name[0]?.toUpperCase() || 'A'}</span>
            </div>
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-sm font-semibold text-text-primary leading-tight">{user.name}</div>
            <div className="text-[9px] text-sub-text font-medium">{user.rank}</div>
          </div>
        </motion.button>

        <motion.div className="flex-1 max-w-[120px]" {...fadeUp(0.15)}>
          <div className="flex justify-between text-[8px] text-sub-text mb-0.5">
            <span>Lv.{user.level_overall}</span>
            <span>{xpPct.toFixed(0)}%</span>
          </div>
          <div className="h-1 rounded-full bg-border overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary-action to-accent"
              initial={{ width: 0 }}
              animate={{ width: `${xpPct}%` }}
              transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </motion.div>

        <motion.div className="flex items-center gap-1" {...fadeUp(0.2)}>
          {streak > 0 && (
            <motion.div
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, type: 'spring', stiffness: 300, damping: 12 }}
            >
              <Flame size={10} className="text-amber-400" />
              <span className="text-[10px] font-semibold text-amber-400">{streak}</span>
            </motion.div>
          )}
          <motion.button onClick={() => setView('menu')} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-surface text-sub-text hover:text-text-primary transition-colors" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </motion.button>
          <motion.button onClick={() => setView('settings')} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-surface text-sub-text hover:text-text-primary transition-colors" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Settings size={14} />
          </motion.button>
        </motion.div>
      </div>
    </motion.header>
  );
};

export default Header;
