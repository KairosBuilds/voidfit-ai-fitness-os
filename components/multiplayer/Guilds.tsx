import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Shield, Sword, Plus, Search, ChevronRight, Lock, MapPin, Target, X, UserCheck, LogOut, RefreshCw, Trophy, TrendingUp, Footprints, Zap, Crown, Medal, Swords } from 'lucide-react';
import { useUserStore } from '../../src/store/useUserStore';
import { useMultiplayer } from '../../src/db/useDatabase';
import { MultiplayerService } from '../../src/services/MultiplayerService';
import { Guild } from '../../types';

export const Guilds: React.FC = () => {
    const { user } = useUserStore();
    const { guilds } = useMultiplayer();
    const [search, setSearch] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [xpGained, setXpGained] = useState<number | null>(null);

    // Create Guild State
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newType, setNewType] = useState<Guild['type']>('Competitive');

    const myGuild = user?.guildId ? guilds.find(g => g.id === user.guildId) : null;

    const handleCreate = async () => {
        if (!user || !newName) return;
        try {
            await MultiplayerService.createGuild(user, newName, newDesc, newType);
            setIsCreateOpen(false);
            setNewName('');
            setNewDesc('');
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleJoin = async (guildId: string) => {
        if (!user) return;
        try {
            await MultiplayerService.joinGuild(user, guildId);
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleLeave = async () => {
        if (!user) return;
        try {
            await MultiplayerService.leaveGuild(user);
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleSync = useCallback(async () => {
        if (!user) return;
        setSyncing(true);
        setXpGained(null);
        try {
            await MultiplayerService.syncGuildSteps(user);
            const xp = await MultiplayerService.distributeGuildXp(user);
            if (xp > 0) {
                setXpGained(xp);
                setTimeout(() => setXpGained(null), 3000);
            }
        } catch (e) {
            console.error(e);
        }
        setSyncing(false);
    }, [user]);

    const filteredGuilds = guilds.filter(g =>
        g.name.toLowerCase().includes(search.toLowerCase()) && g.id !== user?.guildId
    );

    const getMemberName = (memberId: string) => {
        if (memberId === user?.id) return user.name;
        return memberId;
    };

    const getRankEmoji = (idx: number) => {
        if (idx === 0) return <Crown size={14} className="text-yellow-400" />;
        if (idx === 1) return <Medal size={14} className="text-gray-300" />;
        if (idx === 2) return <Medal size={14} className="text-amber-600" />;
        return null;
    };

    if (myGuild) {
        const ms = myGuild.memberSteps || {};
        const membersSorted = [...myGuild.members].sort((a, b) =>
            (ms[b] || 0) - (ms[a] || 0)
        );

        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-main-text uppercase tracking-tighter flex items-center gap-2">
                            <Shield className="text-accent" />
                            {myGuild.name}
                        </h1>
                        <p className="text-[10px] text-sub-text font-black uppercase tracking-widest">
                            {myGuild.type} Syndicate · LVL {myGuild.level}
                        </p>
                    </div>
                    <button
                        onClick={handleLeave}
                        className="p-3 rounded-2xl bg-accent-red/20 border border-accent-red/50 text-accent-red hover:bg-accent-red/30 transition-all active:scale-95"
                    >
                        <LogOut size={18} />
                    </button>
                </div>

                {/* Quote */}
                <p className="text-xs text-sub-text leading-relaxed italic opacity-80 glass-effect p-4 rounded-2xl border border-glass-border">
                    "{myGuild.description}"
                </p>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="glass-effect p-4 rounded-2xl border border-glass-border text-center">
                        <Footprints size={20} className="mx-auto text-accent mb-1" />
                        <div className="text-lg font-black text-main-text">{(myGuild.totalSteps || 0).toLocaleString()}</div>
                        <div className="text-[8px] text-sub-text font-black uppercase tracking-widest">Combined Steps</div>
                    </div>
                    <div className="glass-effect p-4 rounded-2xl border border-glass-border text-center">
                        <Zap size={20} className="mx-auto text-yellow-400 mb-1" />
                        <div className="text-lg font-black text-main-text">{myGuild.xp.toLocaleString()}</div>
                        <div className="text-[8px] text-sub-text font-black uppercase tracking-widest">Guild XP</div>
                    </div>
                    <div className="glass-effect p-4 rounded-2xl border border-glass-border text-center">
                        <Users size={20} className="mx-auto text-accent-green mb-1" />
                        <div className="text-lg font-black text-main-text">{myGuild.members.length}</div>
                        <div className="text-[8px] text-sub-text font-black uppercase tracking-widest">Members</div>
                    </div>
                </div>

                {/* XP from steps today */}
                {xpGained !== null && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-effect p-4 rounded-2xl border border-accent/50 text-center"
                    >
                        <div className="text-sm font-black text-accent flex items-center justify-center gap-2">
                            <Zap size={16} /> +{xpGained} Guild XP Earned from Combined Steps!
                        </div>
                    </motion.div>
                )}

                {/* Sync Button */}
                <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="w-full py-4 bg-accent text-white font-black rounded-2xl shadow-[0_10px_20px_var(--neon-glow)] active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
                    {syncing ? 'Syncing...' : 'Sync Steps & Distribute XP'}
                </button>

                {/* Member Rankings */}
                <div>
                    <h2 className="text-sm font-black text-main-text uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Trophy size={16} className="text-yellow-400" />
                        Member Rankings
                    </h2>
                    <div className="space-y-2">
                        {membersSorted.map((memberId, idx) => {
                            const steps = ms[memberId] || 0;
                            const maxSteps = Math.max(...membersSorted.map(m => ms[m] || 0), 1);
                            const pct = (steps / maxSteps) * 100;
                            const isLeader = memberId === myGuild.leaderId;
                            const isMe = memberId === user?.id;

                            return (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={memberId}
                                    className="glass-effect p-4 rounded-2xl border border-glass-border flex items-center gap-4"
                                >
                                    <div className="w-8 text-center">
                                        {getRankEmoji(idx)}
                                        {!getRankEmoji(idx) && (
                                            <span className="text-[10px] font-black text-sub-text">#{idx + 1}</span>
                                        )}
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                                        {isLeader ? <Crown size={18} /> : <Swords size={18} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-black text-main-text truncate">
                                                {getMemberName(memberId)}
                                            </span>
                                            {isLeader && (
                                                <span className="text-[8px] font-black text-yellow-400 uppercase tracking-widest">Leader</span>
                                            )}
                                            {isMe && (
                                                <span className="text-[8px] font-black text-accent uppercase tracking-widest">You</span>
                                            )}
                                        </div>
                                        <div className="mt-1 h-2 rounded-full bg-background/50 border border-glass-border overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                className={`h-full rounded-full ${idx === 0 ? 'bg-gradient-to-r from-yellow-400 to-amber-600' : 'bg-accent'}`}
                                            />
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-black text-main-text">{steps.toLocaleString()}</div>
                                        <div className="text-[8px] text-sub-text font-black uppercase tracking-widest">Steps</div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Level Progress */}
                <div className="glass-effect p-4 rounded-2xl border border-glass-border">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-sub-text uppercase tracking-widest">Guild Level Progress</span>
                        <span className="text-[10px] font-black text-accent">LVL {myGuild.level} → {myGuild.level + 1}</span>
                    </div>
                    <div className="h-3 rounded-full bg-background/50 border border-glass-border overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(myGuild.xp / (myGuild.level * 1000)) * 100}%` }}
                            className="h-full rounded-full bg-gradient-to-r from-accent to-purple-500"
                        />
                    </div>
                    <div className="text-[8px] text-sub-text font-black text-center mt-2 uppercase tracking-widest">
                        {myGuild.xp} / {myGuild.level * 1000} XP
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-main-text uppercase tracking-tighter flex items-center gap-2">
                        <Users className="text-accent" />
                        Syndicate Hub
                    </h1>
                    <p className="text-[10px] text-sub-text font-black uppercase tracking-widest">Join a faction or create your own</p>
                </div>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="p-3 rounded-2xl bg-accent text-white shadow-[0_0_15px_var(--neon-glow)] hover:scale-110 transition-all active:scale-95"
                >
                    <Plus size={20} />
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-sub-text" size={18} />
                <input
                    type="text"
                    placeholder="Search factions..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-surface/50 border border-glass-border rounded-2xl py-4 pl-12 pr-4 text-sm text-main-text focus:outline-none focus:border-accent transition-all shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]"
                />
            </div>

            {/* Faction Cards */}
            <div className="grid grid-cols-1 gap-4">
                {filteredGuilds.length === 0 && (
                    <div className="text-center py-12 glass-effect rounded-[2.5rem] border border-dashed border-glass-border">
                        <Users size={48} className="mx-auto text-sub-text opacity-20 mb-4" />
                        <p className="text-sm font-black text-sub-text uppercase">No Syndicates Found</p>
                        <button onClick={() => setIsCreateOpen(true)} className="mt-4 text-accent text-xs font-black uppercase">Create the first one</button>
                    </div>
                )}
                {filteredGuilds.map((guild, idx) => {
                    const isLocked = user && user.level_overall < guild.minLevel;

                    return (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            key={guild.id}
                            className="glass-effect p-6 rounded-[2.5rem] border border-glass-border hover:border-accent/50 transition-all group relative overflow-hidden"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-accent/10 border-2 border-accent/30 flex items-center justify-center text-accent group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(217,70,239,0.2)]">
                                        <Shield size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-main-text uppercase tracking-tight">{guild.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${guild.type === 'Hardcore' ? 'bg-accent-red/20 border-accent-red text-accent-red' : 'bg-accent/20 border-accent text-accent'}`}>
                                                {guild.type}
                                            </span>
                                            <span className="text-[8px] font-black text-sub-text uppercase tracking-widest">LVL {guild.level} Syndicate</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleJoin(guild.id)}
                                        disabled={isLocked}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${isLocked ? 'bg-sub-text/20 text-sub-text' : 'bg-accent text-white shadow-[0_0_10px_var(--neon-glow)] active:scale-95'}`}
                                    >
                                        {isLocked ? 'Locked' : 'Join'}
                                    </button>
                                </div>
                            </div>

                            <p className="text-xs text-sub-text leading-relaxed mb-6 italic opacity-80">
                                "{guild.description}"
                            </p>

                            <div className="grid grid-cols-3 gap-4 p-4 rounded-2xl bg-background/50 border border-glass-border shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]">
                                <div className="text-center">
                                    <div className="text-sm font-black text-main-text">{guild.members.length}</div>
                                    <div className="text-[8px] text-sub-text font-black uppercase tracking-widest mt-1">Warriors</div>
                                </div>
                                <div className="text-center border-x border-glass-border">
                                    <div className="text-sm font-black text-accent flex items-center justify-center gap-1">
                                        <Footprints size={12} /> {(guild.totalSteps || 0).toLocaleString()}
                                    </div>
                                    <div className="text-[8px] text-sub-text font-black uppercase tracking-widest mt-1">Total Steps</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-sm font-black text-main-text flex items-center justify-center gap-1">
                                        {isLocked ? <Lock size={12} className="text-accent-red" /> : <Target size={12} className="text-accent-green" />}
                                        MIN {guild.minLevel}
                                    </div>
                                    <div className="text-[8px] text-sub-text font-black uppercase tracking-widest mt-1">Required</div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Create Guild Modal */}
            <AnimatePresence>
                {isCreateOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCreateOpen(false)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md glass-effect border-2 border-glass-border rounded-[2.5rem] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-black text-main-text uppercase tracking-tight">Form New Syndicate</h2>
                                <button onClick={() => setIsCreateOpen(false)}><X size={24} className="text-sub-text" /></button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-sub-text uppercase tracking-widest block mb-2">Syndicate Name</label>
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="w-full bg-surface/50 border border-glass-border rounded-2xl p-4 text-main-text focus:outline-none focus:border-accent"
                                        placeholder="E.G. VOID_WALKERS"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-sub-text uppercase tracking-widest block mb-2">Mission Description</label>
                                    <textarea
                                        value={newDesc}
                                        onChange={(e) => setNewDesc(e.target.value)}
                                        className="w-full bg-surface/50 border border-glass-border rounded-2xl p-4 text-main-text focus:outline-none focus:border-accent h-24 resize-none"
                                        placeholder="Describe your syndicate's purpose..."
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-sub-text uppercase tracking-widest block mb-2">Faction Type</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['Casual', 'Competitive', 'Hardcore'] as const).map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setNewType(t)}
                                                className={`py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${newType === t ? 'bg-accent border-accent text-white shadow-[0_0_10px_var(--neon-glow)]' : 'border-glass-border text-sub-text hover:text-main-text'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    onClick={handleCreate}
                                    className="w-full py-4 bg-accent text-white font-black rounded-2xl shadow-[0_10px_20px_var(--neon-glow)] active:scale-95 transition-all uppercase tracking-widest mt-4"
                                >
                                    Establish Syndicate
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
