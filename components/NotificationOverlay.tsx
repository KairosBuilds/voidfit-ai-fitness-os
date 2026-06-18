import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Info, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';

export type NotificationType = 'info' | 'success' | 'warning' | 'achievement';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
}

interface NotificationOverlayProps {
  notifications: AppNotification[];
  onRemove: (id: string) => void;
}

const NotificationOverlay: React.FC<NotificationOverlayProps> = ({ notifications = [], onRemove }) => {
  return (
    <div className="fixed bottom-32 right-6 z-[200] flex flex-col gap-3 pointer-events-none w-full max-w-[280px]">
      <AnimatePresence>
        {notifications?.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95, transition: { duration: 0.2 } }}
            className="pointer-events-auto"
          >
            <div className="glass-effect border border-glass-border rounded-2xl p-4 shadow-[0_10px_30px_var(--shadow-soft)] flex gap-4 relative overflow-hidden group">
              <div className={`absolute left-0 top-0 bottom-0 w-1 animate-pulse ${
                  n.type === 'success' ? 'bg-accent-green' :
                  n.type === 'warning' ? 'bg-accent-red' :
                  'bg-accent'
                }`} />

              <div className={`p-2 rounded-xl bg-background/50 border border-glass-border h-fit ${
                  n.type === 'success' ? 'text-accent-green' :
                  n.type === 'warning' ? 'text-accent-red' :
                  'text-accent'
                }`}>
                {n.type === 'success' && <CheckCircle2 size={16} />}
                {n.type === 'warning' && <AlertTriangle size={16} />}
                {n.type === 'achievement' && <Zap size={16} />}
                {n.type === 'info' && <Bell size={16} />}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-[9px] font-black text-main-text uppercase tracking-[0.2em] leading-none mb-1.5 opacity-80">{n.title}</h4>
                <p className="text-[10px] text-sub-text font-black uppercase tracking-widest leading-relaxed">{n.message}</p>
              </div>

              <button onClick={() => onRemove(n.id)} className="text-sub-text hover:text-main-text transition-colors p-1">
                <X size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationOverlay;
