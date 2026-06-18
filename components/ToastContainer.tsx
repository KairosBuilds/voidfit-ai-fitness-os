import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToastStore, ToastType } from '../src/store/useToastStore';

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={16} />,
  error:   <AlertCircle  size={16} />,
  warning: <AlertTriangle size={16} />,
  info:    <Info         size={16} />,
};

const COLORS: Record<ToastType, { border: string; bg: string; text: string; glow: string }> = {
  success: { border: 'border-emerald-500/40', bg: 'bg-emerald-500/10', text: 'text-emerald-400', glow: '0 0 12px rgba(16,185,129,0.4)' },
  error:   { border: 'border-red-500/40',     bg: 'bg-red-500/10',     text: 'text-red-400',     glow: '0 0 12px rgba(239,68,68,0.4)' },
  warning: { border: 'border-amber-500/40',   bg: 'bg-amber-500/10',   text: 'text-amber-400',   glow: '0 0 12px rgba(245,158,11,0.4)' },
  info:    { border: 'border-accent/40',      bg: 'bg-accent/10',      text: 'text-accent',       glow: '0 0 12px var(--neon-glow, rgba(224,64,251,0.4))' },
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-28 left-0 right-0 z-[500] flex flex-col items-center gap-2 px-4 pointer-events-none">
      <AnimatePresence mode="sync">
        {toasts.map((t) => {
          const c = COLORS[t.type];
          const icon = ICONS[t.type];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl w-full max-w-sm ${c.border} ${c.bg}`}
              style={{ boxShadow: `${c.glow}, 0 8px 32px rgba(0,0,0,0.4)` }}
            >
              <span className={`shrink-0 ${c.text}`}>{icon}</span>
              <p className={`flex-1 text-xs font-black uppercase tracking-wide ${c.text}`}>{t.message}</p>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 text-sub-text hover:text-main-text transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
