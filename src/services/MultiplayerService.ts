import { db } from '../db/database';
import { Guild, PvPMatch, User } from '../../types';
import { useUserStore } from '../store/useUserStore';

export class MultiplayerService {
    static async createGuild(user: User, name: string, description: string, type: Guild['type']) {
        if (user.guildId) throw new Error('Already in a guild');

        const newGuild: Guild = {
            id: `guild-${Date.now()}`,
            name: name.toUpperCase(),
            description,
            members: [user.id],
            leaderId: user.id,
            level: 1,
            xp: 0,
            territories: [],
            type,
            minLevel: 1,
            createdAt: new Date().toISOString(),
            totalSteps: user.currentSteps || 0,
            memberSteps: { [user.id]: user.currentSteps || 0 },
            xpEarnedToday: 0,
            lastStepSync: new Date().toISOString()
        };
        await db.guilds.put(newGuild);

        // Join the user to their new guild
        useUserStore.getState().setUser(prev => ({ ...prev, guildId: newGuild.id }));
        return newGuild;
    }

    static async joinGuild(user: User, guildId: string) {
        if (user.guildId) throw new Error('Already in a guild');

        const guild = await db.guilds.get(guildId);
        if (!guild) throw new Error('Guild not found');
        if (user.level_overall < guild.minLevel) throw new Error('Level too low');

        if (!guild.members.includes(user.id)) {
            await db.guilds.update(guildId, {
                members: [...guild.members, user.id],
                memberSteps: { ...(guild.memberSteps || {}), [user.id]: user.currentSteps || 0 }
            });
        }

        useUserStore.getState().setUser(prev => ({ ...prev, guildId }));
    }

    static async leaveGuild(user: User) {
        if (!user.guildId) throw new Error('Not in a guild');

        const guild = await db.guilds.get(user.guildId);
        if (!guild) throw new Error('Guild not found');

        const updatedMembers = guild.members.filter(m => m !== user.id);
        const memberSteps = guild.memberSteps || {};
        const { [user.id]: _, ...remainingSteps } = memberSteps;

        if (updatedMembers.length === 0) {
            await db.guilds.delete(user.guildId);
        } else {
            const newLeader = guild.leaderId === user.id ? updatedMembers[0] : guild.leaderId;
            await db.guilds.update(user.guildId, {
                members: updatedMembers,
                memberSteps: remainingSteps,
                leaderId: newLeader
            });
        }

        useUserStore.getState().setUser(prev => ({ ...prev, guildId: undefined }));
    }

    static async syncGuildSteps(user: User) {
        if (!user.guildId) return;

        const guild = await db.guilds.get(user.guildId);
        if (!guild) return;

        const updatedMemberSteps = {
            ...guild.memberSteps,
            [user.id]: user.currentSteps || 0
        };

        const totalSteps = Object.values(updatedMemberSteps).reduce((sum, s) => sum + s, 0);

        await db.guilds.update(user.guildId, {
            memberSteps: updatedMemberSteps,
            totalSteps,
            lastStepSync: new Date().toISOString()
        });
    }

    static async distributeGuildXp(user: User): Promise<number> {
        if (!user.guildId) return 0;

        const guild = await db.guilds.get(user.guildId);
        if (!guild) return 0;

        const totalSteps = Object.values(guild.memberSteps).reduce((sum, s) => sum + s, 0);
        const xpGain = Math.floor(totalSteps / 100);

        if (xpGain <= 0) return 0;

        const today = new Date().toISOString().split('T')[0];
        const lastSync = guild.lastStepSync?.split('T')[0];

        const newGuildXp = guild.xp + xpGain;
        let newLevel = guild.level;
        let remaining = newGuildXp;
        while (remaining >= newLevel * 1000) {
            remaining -= newLevel * 1000;
            newLevel++;
        }

        await db.guilds.update(user.guildId, {
            xp: remaining,
            level: newLevel,
            xpEarnedToday: lastSync === today ? guild.xpEarnedToday + xpGain : xpGain
        });

        return xpGain;
    }

    static async simulatePvP(player: User, opponent: { name: string, stats: any }) {
        // Combat simulation based on Realm stats
        const playerPower = (Object.values(player.stats) as any[]).reduce((acc: number, val: any) => acc + (Number(val) || 0), 0);
        const opponentPower = (Object.values(opponent.stats || {}) as any[]).reduce((acc: number, val: any) => acc + (Number(val) || 0), 0);

        const winChance = (Number(playerPower) + 1) / (Number(playerPower) + Number(opponentPower) + 2);
        const playerWins = Math.random() < winChance;

        const match: PvPMatch = {
            id: `pvp-${Date.now()}`,
            player1Id: player.id,
            player2Id: opponent.name,
            winnerId: playerWins ? player.id : opponent.name,
            status: 'completed',
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            score: { 
                p1: playerWins ? 100 : Math.floor(Math.random() * 50),
                p2: playerWins ? Math.floor(Math.random() * 50) : 100 
            }
        };

        await db.pvpMatches.put(match);
        return match;
    }
}
