import React from 'react';
import {
  BarChart2, BookOpen, Award, Timer, Dna, BotMessageSquare,
  HeartPulse, Zap, BrainCircuit, ChevronRight, Activity, Map as MapIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useUiStore, View } from '../src/store/useUiStore';
import { FEATURE_FLAGS } from '../src/config/featureFlags';

interface MenuProps {
  onNavigate?: (view: View) => void;
}

const buildMenuItems = (): {
  view: View; label: string; icon: React.ElementType;
  description: string; color: string; glowColor: string;
}[] => [
  { view: 'growth',           label: 'Growth',        icon: Zap,              description: 'Log progress & your stats.',        color: 'var(--accent)',           glowColor: 'var(--neon-glow, var(--teddy-glow))' },
  { view: 'bodyscan',         label: 'Safety Scan',   icon: HeartPulse,       description: 'Check if your body is ready.',      color: '#ef4444',                 glowColor: 'rgba(239,68,68,0.5)' },
  { view: 'physiqueroadmap',  label: 'Body Map',      icon: Activity,         description: 'Target specific muscles.',          color: 'var(--accent)',           glowColor: 'var(--neon-glow, var(--teddy-glow))' },
  ...(FEATURE_FLAGS.MULTIPLAYER ? [{ view: 'map' as View, label: 'World Map', icon: MapIcon, description: 'Capture local territories.', color: 'var(--accent)', glowColor: 'var(--neon-glow, var(--teddy-glow))' }] : []),
  { view: 'journal',          label: 'Journal',       icon: BookOpen,         description: 'Your logs and notes.',             color: 'var(--text-secondary)',   glowColor: 'var(--neon-glow, var(--teddy-glow))' },
  { view: 'progress_history', label: 'History',       icon: BarChart2,        description: 'View your past activity.',         color: '#10b981',                 glowColor: 'rgba(16,185,129,0.5)' },
  { view: 'chatbot',          label: 'AI Coach',      icon: BotMessageSquare, description: 'Talk to your AI coach.',           color: 'var(--accent)',           glowColor: 'var(--neon-glow, var(--teddy-glow))' },
  { view: 'medical',          label: 'Health',        icon: HeartPulse,       description: 'Your medical info.',               color: '#ef4444',                 glowColor: 'rgba(239,68,68,0.5)' },
  { view: 'habits',           label: 'Habits',        icon: Zap,              description: 'Log water and habits.',            color: 'var(--primary-action)',   glowColor: 'var(--neon-glow, var(--teddy-glow))' },
  { view: 'psych',            label: 'Mind & Body',   icon: BrainCircuit,     description: 'Track mood & photos.',             color: 'var(--accent)',           glowColor: 'var(--neon-glow, var(--teddy-glow))' },
  { view: 'analytics',        label: 'Body Stats',    icon: BarChart2,        description: 'Track your progress.',             color: '#10b981',                 glowColor: 'rgba(16,185,129,0.5)' },
  { view: 'timer',            label: 'Timer',         icon: Timer,            description: 'Workout timer.',                   color: '#f59e0b',                 glowColor: 'rgba(245,158,11,0.5)' },
  { view: 'system_mechanics', label: 'How It Works',  icon: Dna,              description: 'How the AI works.',                color: 'var(--text-secondary)',   glowColor: 'var(--neon-glow, var(--teddy-glow))' },
  { view: 'badges',           label: 'Achievements',  icon: Award,            description: 'See badges & ranks.',              color: '#f59e0b',                 glowColor: 'rgba(245,158,11,0.5)' },
  { view: 'brain_vault',      label: 'My Data',       icon: BrainCircuit,     description: 'Your stored info.',                color: 'var(--accent)',           glowColor: 'var(--neon-glow, var(--teddy-glow))' },
  { view: 'progress',         label: 'Old Logs',      icon: BookOpen,         description: 'Review your journey.',             color: 'var(--text-secondary)',   glowColor: 'var(--neon-glow, var(--teddy-glow))' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const Menu: React.FC<MenuProps> = ({ onNavigate: propOnNavigate }) => {
  const setView = useUiStore(state => state.setView);
  const onNavigate = propOnNavigate || setView;
  const menuItems = buildMenuItems();
  return (
    <motion.div
      className="space-y-10 max-w-lg mx-auto pb-32 px-4 relative"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Ambient neural haze */}
      <div
        className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[120%] h-[400px] rounded-full pointer-events-none opacity-20 blur-[100px]"
        style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)' }}
      />

      {/* Header Area */}
      <div className="text-center relative z-10 pt-4">
        <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-accent/10 border border-accent/20 shadow-[0_0_20px_rgba(224,64,251,0.1)]">
                <BrainCircuit size={40} className="text-accent animate-pulse" />
            </div>
            <div>
                <h2 className="text-2xl font-black text-main-text tracking-[0.5em] uppercase">All Apps</h2>
                <div className="flex items-center justify-center gap-3 mt-2">
                    <div className="h-px w-8 bg-gradient-to-r from-transparent to-accent/30" />
                    <p className="text-[10px] text-sub-text font-black uppercase tracking-[0.3em] opacity-60">
                        System Ready
                    </p>
                    <div className="h-px w-8 bg-gradient-to-l from-transparent to-accent/30" />
                </div>
            </div>
        </div>
      </div>

      {/* Tactical Grid */}
      <div className="grid grid-cols-2 gap-4 relative z-10">
        {menuItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.view}
              variants={cardVariants}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate(item.view)}
              className="group relative neural-card-accent p-5 rounded-[2rem] text-left transition-all duration-500 overflow-hidden shadow-soft hover:border-accent/40 hover:bg-accent/5"
            >
              {/* Tactical Scan Line (Internal) */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-10 z-0">
                  <div className="w-full h-[1px] bg-accent absolute top-0 animate-[tacticalScan_4s_linear_infinite]" />
              </div>

              <div className="relative z-10 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div
                    className="p-3 rounded-2xl border transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_15px_currentColor]"
                    style={{
                      background: `${item.color}15`,
                      borderColor: `${item.color}30`,
                      color: item.color,
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <ChevronRight size={14} className="text-sub-text opacity-40 group-hover:text-accent group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
                </div>

                <div>
                  <h3 className="text-[11px] font-black text-main-text tracking-widest uppercase mb-1">{item.label}</h3>
                  <p className="text-[8px] text-sub-text font-black uppercase tracking-widest opacity-40 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Footer Diagnostic */}
      <div className="flex justify-center pt-8 opacity-40">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-glass-border bg-surface/30">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse shadow-[0_0_5px_#10b981]" />
              <span className="text-[8px] font-black text-sub-text uppercase tracking-[0.3em]">All Modules Synced</span>
          </div>
      </div>
    </motion.div>
  );
};

export default Menu;