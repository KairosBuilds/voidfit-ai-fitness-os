import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Camera, Activity, Droplets, Zap, 
  Map, X, Menu, Mic, Trophy 
} from 'lucide-react';
import { useUiStore } from '../src/store/useUiStore';
import { FEATURE_FLAGS } from '../src/config/featureFlags';

export const ActionHub: React.FC = () => {
    const { setView, isActionHubOpen: isOpen, setActionHubOpen: setIsOpen, setVisionOpen, setWaterOpen, setVoiceOpen } = useUiStore();

    const actions = [
        ...(FEATURE_FLAGS.MULTIPLAYER ? [{ id: 'world', icon: Map, label: 'WORLD MAP', sub: 'Territory Map', color: 'text-emerald-400', glow: 'shadow-emerald-500/20', onClick: () => { setView('map'); setIsOpen(false); } }] : []),
        ...(FEATURE_FLAGS.VOICE_COMMANDS ? [{ id: 'voice', icon: Mic, label: 'VOICE COMMANDS', sub: 'Talk to Coach', color: 'text-accent-red', glow: 'shadow-accent-red/20', onClick: () => { setVoiceOpen(true); setIsOpen(false); } }] : []),
        { id: 'challenges', icon: Trophy, label: 'CHALLENGES', sub: 'Daily Challenges', color: 'text-accent-yellow', glow: 'shadow-yellow-500/20', onClick: () => { setView('challenges'); setIsOpen(false); } },
        { id: 'meal', icon: Camera, label: 'SCAN MEAL', sub: 'Analyze Food', color: 'text-accent', glow: 'shadow-accent/20', onClick: () => { setVisionOpen(true, 'meal'); setIsOpen(false); } },
        { id: 'form', icon: Activity, label: 'CHECK FORM', sub: 'Form Analysis', color: 'text-primary-action', glow: 'shadow-purple-500/20', onClick: () => { setVisionOpen(true, 'form'); setIsOpen(false); } },
        { id: 'apps', icon: Menu, label: 'ALL APPS', sub: 'Browse Apps', color: 'text-main-text', glow: 'shadow-white/10', onClick: () => { setView('menu'); setIsOpen(false); } },
        { id: 'water', icon: Droplets, label: 'LOG WATER', sub: 'Track Intake', color: 'text-blue-400', glow: 'shadow-blue-500/20', onClick: () => { setWaterOpen(true); setIsOpen(false); } },
        { id: 'zap', icon: Zap, label: 'DAILY PLAN', sub: 'View Workouts', color: 'text-yellow-400', glow: 'shadow-yellow-500/20', onClick: () => { setView('dashboard'); setIsOpen(false); } },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    {/* Background Overlay with Tactical Blur */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="absolute inset-0 bg-background/90 backdrop-blur-2xl"
                    >
                        {/* Scanning Line Effect */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                            <div className="w-full h-[1px] bg-accent shadow-[0_0_15px_var(--neon-glow)] absolute top-0 animate-[tacticalScan_4s_linear_infinite]" />
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking between buttons
                        className="relative w-full max-w-md z-10"
                    >
                        {/* Header Area */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="p-4 rounded-full bg-accent/10 border border-accent/20 mb-4 animate-pulse">
                                <Plus size={32} className="text-accent" />
                            </div>
                            <h2 className="text-sm font-black text-main-text tracking-[0.5em] uppercase">Quick Actions</h2>
                            <p className="text-[10px] font-black text-sub-text tracking-widest mt-1 opacity-60">What would you like to do?</p>
                        </div>

                        {/* Actions Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {actions.map((action, idx) => (
                                <motion.button
                                    key={action.id}
                                    initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={action.onClick}
                                    className={`group relative glass-effect rounded-[1.5rem] p-5 flex flex-col items-center text-center gap-3 border border-white/5 hover:border-accent/40 hover:bg-accent/5 transition-all active:scale-95 shadow-lg ${action.glow}`}
                                >
                                    <div className={`p-3 rounded-2xl bg-surface/50 ${action.color} group-hover:scale-110 transition-transform`}>
                                        <action.icon size={24} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-main-text tracking-widest uppercase mb-0.5">{action.label}</div>
                                        <div className="text-[8px] font-black text-sub-text tracking-widest uppercase opacity-40">{action.sub}</div>
                                    </div>
                                </motion.button>
                            ))}
                        </div>

                        {/* Close Button Footer */}
                        <div className="mt-12 flex justify-center">
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-4 rounded-full bg-surface/50 border border-white/10 text-sub-text hover:text-accent-red hover:border-accent-red/40 transition-all active:scale-90"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
