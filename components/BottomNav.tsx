import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Shield, Bot, Zap, Plus } from 'lucide-react';
import { useUiStore, View } from '../src/store/useUiStore';
import { FEATURE_FLAGS } from '../src/config/featureFlags';

const tabs: { view: View; icon: React.ElementType; label: string; match?: View[] }[] = [
  { view: 'dashboard', icon: Home, label: 'Home' },
  { view: FEATURE_FLAGS.MULTIPLAYER ? 'guild' : 'evolution', icon: Shield, label: FEATURE_FLAGS.MULTIPLAYER ? 'Guild' : 'Progress', match: ['guild', 'pvp', 'leaderboard'] },
  { view: 'chatbot', icon: Bot, label: 'Coach' },
  { view: 'evolution', icon: Zap, label: 'Stats', match: ['evolution', 'growth', 'bodyscan', 'physiqueroadmap', 'skill_tree'] },
];

export const BottomNav: React.FC = () => {
  const { view, setView, isActionHubOpen, setActionHubOpen } = useUiStore();

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/85 backdrop-blur-xl border-t border-border pb-[env(safe-area-inset-bottom)]"
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="max-w-2xl mx-auto flex items-center justify-around px-2 pt-1.5 pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = view === tab.view || tab.match?.includes(view) || false;
          return (
            <motion.button
              key={tab.view}
              onClick={() => setView(tab.view)}
              className="flex flex-col items-center gap-0.5 px-3 py-0.5 relative min-w-[48px]"
              whileTap={{ scale: 0.9 }}
            >
              <AnimatePresence>
                {active && (
                  <motion.div
                    className="absolute -top-[5px] w-5 h-[2px] rounded-full bg-primary-action"
                    layoutId="nav-indicator"
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    exit={{ opacity: 0, scaleX: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
              </AnimatePresence>
              <motion.div
                animate={active ? { scale: [1, 1.15, 1], transition: { duration: 0.35, ease: 'easeOut' } } : { scale: 1 }}
              >
                <Icon size={20} className={active ? 'text-primary-action' : 'text-sub-text'} />
              </motion.div>
              <span className={`text-[8px] font-medium ${active ? 'text-text-primary' : 'text-sub-text'}`}>{tab.label}</span>
            </motion.button>
          );
        })}
        <motion.button
          onClick={() => setActionHubOpen(!isActionHubOpen)}
          className="flex flex-col items-center gap-0.5 px-3 py-0.5"
          animate={{ rotate: isActionHubOpen ? 45 : 0 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            animate={{ background: isActionHubOpen ? '#ef4444' : 'var(--primary-action)' }}
            transition={{ duration: 0.2 }}
          >
            <Plus size={18} className="text-white" />
          </motion.div>
          <span className="text-[8px] font-medium text-sub-text">More</span>
        </motion.button>
      </div>
    </motion.nav>
  );
};

export default BottomNav;
