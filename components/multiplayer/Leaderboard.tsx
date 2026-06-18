import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, Star, TrendingUp, Users } from 'lucide-react';
import { useUserStore } from '../../src/store/useUserStore';
import { useMultiplayer } from '../../src/db/useDatabase';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../src/db/database';

interface LeaderboardEntry {
    id: string;
    rank: number;
    name: string;
    level: number;
    xp: number;
    guild?: string;
    status: 'online' | 'offline' | 'training';
}

export const Leaderboard: React.FC = () => {
    const { user } = useUserStore();
    const { guilds } = useMultiplayer();

    // Fetch rivals dynamically from systemMessages table
    const rivalMessages = useLiveQuery(() => 
        db.systemMessages.filter(m => m.id.startsWith('rival-')).toArray()
    ) || [];

    const dynamicRivals: Omit<LeaderboardEntry, 'rank'>[] = [];

    const userGuild = guilds.find(g => user && g.members.includes(user.id));

    const combinedData: LeaderboardEntry[] = [
        { 
            id: user?.id || 'player',
            name: `${user?.name || 'Player'} (You)`, 
            level: user?.level_overall || 1, 
            xp: user?.xp_total || 0, 
            guild: userGuild?.name || 'None', 
            status: 'online' as const
        }
    ]
    .sort((a, b) => b.xp - a.xp)
    .map((entry, idx) => ({ ...entry, rank: idx + 1 }));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-main-text uppercase tracking-tighter flex items-center gap-2">
                        <Trophy className="text-accent-yellow" />
                        Global Syndicate Rank
                    </h1>
                    <p className="text-[10px] text-sub-text font-black uppercase tracking-widest">Neural Ranking Protocol v1.2</p>
                </div>
                <div className="px-4 py-2 rounded-xl bg-accent/10 border border-accent/20 flex items-center gap-2">
                    <Users size={16} className="text-accent" />
                    <span className="text-xs font-bold text-main-text">SYNCHRONIZED HUB ACTIVE</span>
                </div>
            </div>

            {/* Top 3 Podium */}
            <div className="grid grid-cols-3 gap-4 h-48 items-end mb-8">
                <PodiumCard entry={combinedData[1]} height="h-[80%]" rank={2} color="#94a3b8" icon={<Medal size={24} />} />
                <PodiumCard entry={combinedData[0]} height="h-full" rank={1} color="#fbbf24" icon={<Crown size={32} />} />
                <PodiumCard entry={combinedData[2]} height="h-[70%]" rank={3} color="#b45309" icon={<Star size={24} />} />
            </div>

            {/* List */}
            <div className="space-y-3">
                {combinedData.map((entry, idx) => {
                    const isUser = entry.id === user?.id;
                    return (
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            key={entry.id}
                            className={`glass-effect p-4 rounded-2xl border flex items-center justify-between transition-all hover:scale-[1.02] ${isUser ? 'border-accent bg-accent/10 shadow-[0_0_15px_rgba(217,70,239,0.3)]' : 'border-glass-border'}`}
                        >
                            <div className="flex items-center gap-4">
                                <span className={`text-lg font-black w-8 text-center ${idx < 3 ? 'text-accent' : 'text-sub-text'}`}>#{entry.rank}</span>
                                <div className="relative">
                                    <div className={`w-10 h-10 rounded-xl bg-surface/80 border flex items-center justify-center font-black ${isUser ? 'text-accent border-accent' : 'text-sub-text border-glass-border'}`}>
                                        {entry.name[0]}
                                    </div>
                                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${entry.status === 'online' ? 'bg-accent-green' : entry.status === 'training' ? 'bg-accent' : 'bg-sub-text'}`} />
                                </div>
                                <div>
                                    <div className="text-sm font-black text-main-text uppercase tracking-tight">{entry.name}</div>
                                    <div className="text-[9px] text-sub-text font-bold uppercase">{entry.guild}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-black text-accent tracking-tighter">LVL {entry.level}</div>
                                <div className="text-[9px] text-sub-text font-black uppercase tracking-widest">{entry.xp.toLocaleString()} XP</div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* AI Insight */}
            <div className="p-4 rounded-2xl bg-surface/50 border border-glass-border flex items-center gap-4">
                <TrendingUp className="text-accent-green" />
                <p className="text-[10px] text-sub-text font-bold uppercase leading-relaxed">
                    System Note: Your ranking is calculated based on cumulative XP from Missions, Habits, and Territory Captures. Join a syndicate to boost your influence.
                </p>
            </div>
        </div>
    );
};

const PodiumCard: React.FC<{ entry: LeaderboardEntry; height: string; rank: number; color: string; icon: React.ReactNode }> = ({ entry, height, rank, color, icon }) => {
    if (!entry) return <div className={`relative ${height} glass-effect rounded-[2rem] border-2 border-glass-border`} />;
    return (
        <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`relative ${height} glass-effect rounded-[2rem] border-2 flex flex-col items-center justify-center gap-2 p-4 text-center shadow-[0_10px_30px_rgba(0,0,0,0.3)]`}
            style={{ borderColor: color }}
        >
            <div className="absolute -top-6 text-main-text drop-shadow-[0_0_10px_currentColor]" style={{ color }}>
                {icon}
            </div>
            <div className="w-16 h-16 rounded-2xl bg-surface/80 border-2 border-glass-border flex items-center justify-center text-2xl font-black text-main-text mb-2">
                {entry.name[0]}
            </div>
            <div className="text-xs font-black text-main-text uppercase tracking-tighter truncate w-full">{entry.name}</div>
            <div className="text-[9px] font-bold text-sub-text uppercase truncate w-full">{entry.guild}</div>
            <div className="mt-2 text-sm font-black tracking-tighter" style={{ color }}>LVL {entry.level}</div>
        </motion.div>
    );
};
