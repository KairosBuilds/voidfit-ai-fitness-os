import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Download, Database, Shield, History, Cpu, FileText, Zap } from 'lucide-react';
import { User } from '../types';

import { useUserStore } from '../src/store/useUserStore';
import { useDatabase } from '../src/db/useDatabase';

interface BrainVaultProps {
  user?: User;
  chatHistory?: any[];
  memoryEntries?: any[];
  activityLogs?: any[];
  onExport?: (format: 'json' | 'markdown') => void;
}

const BrainVault: React.FC<BrainVaultProps> = ({ 
  user: propUser, 
  chatHistory: propChatHistory, 
  memoryEntries: propMemoryEntries, 
  activityLogs: propActivityLogs, 
  onExport: propOnExport 
}) => {
  const storeUser = useUserStore(state => state.user);
  const { chatHistory: dbChatHistory, memoryVault: dbMemoryEntries, activityLog: dbActivityLogs, clearAllData } = useDatabase();
  
  const user = propUser || storeUser;
  const chatHistory = propChatHistory || dbChatHistory || [];
  const memoryEntries = propMemoryEntries || dbMemoryEntries || [];
  const activityLogs = propActivityLogs || dbActivityLogs || [];
  
  if (!user) return null;

  const onExport = propOnExport || ((format: 'json' | 'markdown') => {
    const data = { user, chatHistory, memoryEntries, activityLogs };
    const blob = new Blob([format === 'json' ? JSON.stringify(data, null, 2) : 'Brain Vault Export'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voidfit_brain_vault.${format === 'json' ? 'json' : 'md'}`;
    a.click();
  });

  const stats = [
    { label: 'AI Chats', value: chatHistory.length, icon: Brain, color: 'text-accent-primary' },
    { label: 'Saved Notes', value: memoryEntries.length, icon: Database, color: 'text-accent-secondary' },
    { label: 'Activities', value: activityLogs.length, icon: Cpu, color: 'text-accent-tertiary' },
    { label: 'Progress', value: `${user.skill_tree ? Object.keys(user.skill_tree).length : 0}%`, icon: Shield, color: 'text-accent-green' },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 relative z-10">
      <div className="text-center relative z-10">
        <h2 className="text-3xl font-black text-main-text tracking-tight uppercase drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">My <span className="text-accent drop-shadow-[0_0_5px_currentColor]">Data</span></h2>
        <p className="text-[10px] text-sub-text mt-1 font-black uppercase tracking-[0.2em]">Your progress and history archive</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-effect p-6 rounded-[2.5rem] border-2 border-glass-border shadow-[0_10px_30px_var(--shadow-soft)]"
            >
              <div className={`p-3 rounded-2xl bg-background/50 w-fit ${stat.color} mb-4 border border-glass-border shadow-[inset_0_0_5px_rgba(0,0,0,0.5)] drop-shadow-[0_0_5px_currentColor]`}>
                <Icon size={20} />
              </div>
              <div className="text-2xl font-black text-main-text drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">{stat.value}</div>
              <div className="text-[9px] font-black text-sub-text uppercase tracking-widest mt-1">{stat.label}</div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <div className="glass-effect p-8 rounded-[3rem] border-2 border-glass-border shadow-[0_10px_30px_var(--shadow-soft)]">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-black text-main-text uppercase tracking-tight flex items-center gap-3 drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">
                        <History size={20} className="text-accent drop-shadow-[0_0_5px_currentColor]" />
                        Notes & Logs
                    </h3>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => onExport('markdown')}
                            className="flex items-center gap-2 px-4 py-2 bg-surface/50 hover:bg-surface/80 rounded-xl border border-glass-border text-[10px] font-black uppercase tracking-widest text-sub-text hover:text-main-text transition-all shadow-[inset_0_0_5px_rgba(0,0,0,0.5)] hover:shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))]"
                        >
                            <FileText size={14} />
                            Log.md
                        </button>
                        <button 
                            onClick={() => onExport('json')}
                            className="flex items-center gap-2 px-4 py-2 bg-accent/20 hover:bg-accent/40 rounded-xl border border-accent/50 text-[10px] font-black uppercase tracking-widest text-accent transition-all shadow-[inset_0_0_5px_rgba(0,0,0,0.5)] hover:shadow-[0_0_15px_var(--neon-glow,var(--teddy-glow))]"
                        >
                            <Download size={14} className="drop-shadow-[0_0_2px_currentColor]" />
                            <span className="drop-shadow-[0_0_2px_currentColor]">Export</span>
                        </button>
                    </div>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-4">
                    {memoryEntries.length > 0 ? memoryEntries.map((entry, i) => (
                        <div key={i} className="p-4 bg-surface/30 rounded-2xl border border-glass-border group hover:border-accent transition-all shadow-[inset_0_0_10px_rgba(0,0,0,0.2)] hover:shadow-[0_0_15px_var(--neon-glow,var(--teddy-glow))]">
                            <div className="flex items-center justify-between mb-2">
                                <span className="px-2 py-1 bg-accent/10 text-accent text-[8px] font-black uppercase rounded-md border border-accent/30 shadow-[inset_0_0_5px_rgba(0,0,0,0.2)]">
                                    {entry.category}
                                </span>
                                <span className="text-[8px] font-black text-sub-text uppercase">{entry.date}</span>
                            </div>
                            <p className="text-xs text-main-text font-bold leading-relaxed">{entry.content}</p>
                        </div>
                    )) : (
                        <div className="py-12 text-center border-2 border-dashed border-glass-border rounded-[2.5rem] bg-surface/30 shadow-[inset_0_0_15px_rgba(0,0,0,0.2)]">
                            <Brain size={48} className="text-sub-text opacity-30 mx-auto mb-4 drop-shadow-[0_0_2px_currentColor]" />
                            <p className="text-sub-text text-xs font-black uppercase tracking-widest opacity-50 drop-shadow-[0_0_2px_rgba(0,0,0,0.5)]">No notes recorded yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="space-y-6">
            <div className="glass-effect bg-[var(--plush-gradient,var(--dragon-scale))] p-8 rounded-[3rem] border-2 border-glass-border shadow-[0_10px_30px_var(--shadow-soft)] relative overflow-hidden bg-opacity-10">
                <div className="absolute inset-0 bg-background/80 mix-blend-overlay"></div>
                <div className="absolute -top-4 -right-4 p-8 opacity-20 relative z-10">
                    <Zap size={120} className="text-accent drop-shadow-[0_0_10px_currentColor]" />
                </div>
                <h3 className="text-lg font-black text-main-text uppercase tracking-tight mb-4 relative z-10 drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">Profile</h3>
                <div className="space-y-4 text-xs text-sub-text font-bold leading-relaxed relative z-10">
                    <p>Name: <span className="text-main-text font-black drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">{user.name}</span></p>
                    <p>Current Rank: <span className="text-accent font-black uppercase tracking-widest drop-shadow-[0_0_2px_currentColor]">{user.rank}</span></p>
                    <p>Main Goal: <span className="text-main-text font-black drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">{user.primaryGoal}</span></p>
                    <div className="pt-4 border-t border-glass-border">
                        <p className="text-[10px] text-sub-text font-black uppercase mb-2">AI Coach Style:</p>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 bg-background/50 rounded-lg border border-glass-border text-accent font-black shadow-[inset_0_0_5px_rgba(0,0,0,0.5)] drop-shadow-[0_0_2px_currentColor]">{user.personality}</span>
                            <span className="px-2 py-1 bg-background/50 rounded-lg border border-glass-border text-main-text font-black tracking-widest shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">ACTIVE</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 bg-surface/30 border-2 border-glass-border rounded-3xl shadow-[inset_0_0_15px_rgba(0,0,0,0.2)]">
                <div className="flex items-center gap-4 text-accent-red">
                    <Shield size={20} className="drop-shadow-[0_0_5px_currentColor]" />
                    <span className="text-[10px] font-black uppercase tracking-widest drop-shadow-[0_0_2px_currentColor]">Delete All Data</span>
                </div>
                <p className="text-[10px] text-sub-text mt-3 font-bold">Warning: This will permanently delete all your data, chats, and progress.</p>
                <button 
                  onClick={() => {
                    if (window.confirm("This will permanently delete all your local chat logs, progress history, and profile data. Are you sure you want to proceed?")) {
                      clearAllData();
                    }
                  }}
                  className="w-full mt-4 py-3 bg-background border border-glass-border text-accent-red rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-accent-red hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]"
                >
                    Delete Everything
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BrainVault;
