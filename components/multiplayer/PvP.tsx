import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Shield, Zap, Trophy, User, Target, AlertCircle, Crosshair, X } from 'lucide-react';
import { useUserStore } from '../../src/store/useUserStore';
import { useMultiplayer } from '../../src/db/useDatabase';
import { MultiplayerService } from '../../src/services/MultiplayerService';
import { Realm } from '../../types';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../src/db/database';

export const PvP: React.FC = () => {
    const { user, setUser, handleGrantReward } = useUserStore();
    const { pvpMatches } = useMultiplayer();
    const [isSearching, setIsSearching] = useState(false);
    const [lastResult, setLastResult] = useState<any>(null);

    // Fetch rivals dynamically from the systemMessages database table
    const rivalMessages = useLiveQuery(() => 
        db.systemMessages.filter(m => m.id.startsWith('rival-')).toArray()
    ) || [];

    const dynamicRivals = rivalMessages.map(m => {
        try {
            const parsed = JSON.parse(m.text);
            return {
                id: parsed.id,
                name: parsed.name,
                level: parsed.level_overall || parsed.level || 1,
                type: parsed.type || 'Strength',
                stats: parsed.stats || {}
            };
        } catch {
            return null;
        }
    }).filter(Boolean) as any[];

    const initiateDuel = async (rival: any) => {
        if (!user) return;
        setIsSearching(true);
        
        // Simulation delay for "Finding biometric match"
        setTimeout(async () => {
            const match = await MultiplayerService.simulatePvP(user, rival);
            const playerWon = match.winnerId === user.id;

            // Update user stats
            setUser(prev => ({
                ...prev,
                combatStats: {
                    ...prev.combatStats,
                    wins: prev.combatStats.wins + (playerWon ? 1 : 0),
                    losses: prev.combatStats.losses + (playerWon ? 0 : 1),
                }
            }));

            if (playerWon) {
                handleGrantReward(250, Realm.Combat, `Won Duel against ${rival.name}`);
            }

            setLastResult({ ...match, opponentName: rival.name, won: playerWon });
            setIsSearching(false);
        }, 2000);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-main-text uppercase tracking-tighter flex items-center gap-2">
                        <Sword className="text-accent-red" />
                        Neural Arena
                    </h1>
                    <p className="text-[10px] text-sub-text font-black uppercase tracking-widest">Active Combat Protocol</p>
                </div>
            </div>

            {/* Arena Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="glass-effect p-6 rounded-3xl border border-glass-border">
                    <Trophy className="text-accent-yellow mb-3" size={24} />
                    <div className="text-2xl font-black text-main-text">
                        {user?.combatStats.wins}-{user?.combatStats.losses}
                    </div>
                    <div className="text-[10px] text-sub-text font-black uppercase tracking-widest">Duel Win/Loss</div>
                </div>
                <div className="glass-effect p-6 rounded-3xl border border-glass-border">
                    <Shield className="text-accent-blue mb-3" size={24} />
                    <div className="text-2xl font-black text-main-text uppercase truncate">
                        {user?.rank.split(' ')[0]}
                    </div>
                    <div className="text-[10px] text-sub-text font-black uppercase tracking-widest">Combat Tier</div>
                </div>
            </div>

            {/* Rivals to Challenge */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sub-text">
                    <Target size={16} />
                    <h2 className="text-xs font-black uppercase tracking-[0.2em]">Active Targets</h2>
                </div>
                
                {dynamicRivals.map(rival => (
                    <motion.div 
                        key={rival.id}
                        className="glass-effect p-6 rounded-[2.5rem] border border-glass-border flex items-center justify-between group hover:border-accent/50 transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-accent-red/10 border border-accent-red/30 flex items-center justify-center text-accent-red">
                                <User size={24} />
                            </div>
                            <div>
                                <div className="text-sm font-black text-main-text uppercase tracking-tight">{rival.name}</div>
                                <div className="text-[8px] text-sub-text font-bold uppercase">LVL {rival.level} • {rival.type} Specialist</div>
                            </div>
                        </div>
                        <button 
                            onClick={() => initiateDuel(rival)}
                            disabled={isSearching}
                            className="p-4 rounded-2xl bg-accent-red text-white hover:scale-110 transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] active:scale-95 disabled:opacity-50"
                        >
                            <Sword size={20} />
                        </button>
                    </motion.div>
                ))}
            </div>

            {/* Combat History */}
            <div className="space-y-4">
                <h2 className="text-[10px] text-sub-text font-black uppercase tracking-[0.2em]">Combat Logs</h2>
                <div className="space-y-2">
                    {pvpMatches.slice(0, 5).map(match => (
                        <div key={match.id} className="p-3 rounded-xl bg-surface/30 border border-glass-border flex justify-between items-center">
                            <div className="text-[10px] font-black text-main-text uppercase">
                                VS {match.player2Id.split('_').pop()}
                            </div>
                            <div className={`text-[10px] font-black uppercase ${match.winnerId === user?.id ? 'text-accent-green' : 'text-accent-red'}`}>
                                {match.winnerId === user?.id ? 'VICTORY' : 'DEFEAT'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Search Overlay */}
            <AnimatePresence>
                {isSearching && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center"
                        >
                            <div className="relative mb-6">
                                <Crosshair className="text-accent-red animate-spin-slow" size={80} />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Zap className="text-accent animate-pulse" size={32} />
                                </div>
                            </div>
                            <h3 className="text-xl font-black text-main-text uppercase tracking-widest">Biometric Duel in Progress</h3>
                            <p className="text-xs text-sub-text font-bold uppercase mt-2">Synchronizing metabolic output levels...</p>
                        </motion.div>
                    </div>
                )}

                {lastResult && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-background/90 backdrop-blur-xl" onClick={() => setLastResult(null)} />
                        <motion.div 
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`relative w-full max-w-sm p-10 rounded-[3rem] border-4 text-center ${lastResult.won ? 'border-accent-green bg-accent-green/10' : 'border-accent-red bg-accent-red/10'}`}
                        >
                            <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${lastResult.won ? 'bg-accent-green text-white' : 'bg-accent-red text-white shadow-[0_0_30px_rgba(239,68,68,0.5)]'}`}>
                                {lastResult.won ? <Trophy size={40} /> : <X size={40} />}
                            </div>
                            <h2 className="text-3xl font-black text-main-text uppercase tracking-tighter mb-2">
                                {lastResult.won ? 'Victory' : 'Defeated'}
                            </h2>
                            <p className="text-sm font-bold text-sub-text uppercase mb-8">
                                {lastResult.won ? `You dominated ${lastResult.opponentName}` : `${lastResult.opponentName} out-performed you`}
                            </p>
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <div className="text-2xl font-black text-main-text">{lastResult.score.p1}</div>
                                    <div className="text-[8px] text-sub-text font-black uppercase">Your Score</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <div className="text-2xl font-black text-main-text">{lastResult.score.p2}</div>
                                    <div className="text-[8px] text-sub-text font-black uppercase">Opponent</div>
                                </div>
                            </div>
                            <button 
                                onClick={() => setLastResult(null)}
                                className="w-full py-4 bg-main-text text-background font-black rounded-2xl uppercase tracking-widest hover:scale-105 transition-all"
                            >
                                Acknowledge
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

