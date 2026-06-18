import React from 'react';
import { SystemMessage, StoryLogEntry } from '../types';
import { Info, AlertTriangle, Gift, BookOpen } from 'lucide-react';

import { useDatabase } from '../src/db/useDatabase';

interface SystemLogProps {
  messages?: SystemMessage[];
}

const typeConfig = {
    info: { icon: <Info size={16} />, color: 'text-accent-primary' },
    warning: { icon: <AlertTriangle size={16} />, color: 'text-accent-secondary' },
    system: { icon: <BookOpen size={16} />, color: 'text-accent-green' },
    reward: { icon: <Gift size={16} />, color: 'text-accent-tertiary' },
}

const typeLabels = {
    info: 'Notice',
    warning: 'Alert',
    system: 'Coach',
    reward: 'Achievement'
};

const SystemLog: React.FC<SystemLogProps> = ({ messages: propMessages }) => {
  const { systemMessages } = useDatabase();
  const messages = propMessages || systemMessages || [];
  return (
    <div className="space-y-6 relative z-10">
      <h2 className="text-2xl sm:text-3xl font-black text-main-text text-center mb-6 uppercase tracking-tight drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">Recent Activity</h2>
      <div className="max-w-3xl mx-auto glass-effect p-4 sm:p-6 rounded-[2.5rem] border-2 border-glass-border shadow-[0_10px_30px_var(--shadow-soft)]">
        <div className="space-y-4">
          {messages.map((msg) => {
            const config = typeConfig[msg.type];
            return (
              <div key={msg.id} className="flex items-start space-x-3 text-sm p-4 bg-surface/30 rounded-2xl border border-glass-border shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]">
                <div className={`mt-0.5 ${config.color} drop-shadow-[0_0_2px_currentColor]`}>{config.icon}</div>
                <div className="flex-1">
                  <p className="text-main-text font-bold leading-relaxed">
                    <span className={`font-black uppercase tracking-widest ${config.color} drop-shadow-[0_0_2px_currentColor]`}>{typeLabels[msg.type] || 'Notice'}: </span>
                    {msg.text}
                  </p>
                  <p className="text-[10px] font-bold text-sub-text mt-1 uppercase tracking-widest">{msg.timestamp}</p>
                </div>
              </div>
            );
          })}
           {messages.length === 0 && (
             <div className="text-center py-10 px-4 bg-surface/30 rounded-[2.5rem] border-2 border-dashed border-glass-border shadow-[inset_0_0_15px_rgba(0,0,0,0.2)]">
                <BookOpen className="w-12 h-12 mx-auto text-sub-text mb-4 opacity-30 drop-shadow-[0_0_2px_currentColor]" />
                <p className="text-sub-text font-black uppercase tracking-widest drop-shadow-[0_0_2px_rgba(0,0,0,0.5)]">No recent activity.</p>
                <p className="text-sub-text text-[10px] font-bold mt-2 opacity-60">Recent updates will appear here.</p>
            </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default SystemLog;