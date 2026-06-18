import { db } from '../db/database';
import { QuestStatus, User } from '../../types';
import { reportEventToAi } from './aiReactionService';
import { useUserStore } from '../store/useUserStore';

export class PunishmentSystem {
    private static startupTime = Date.now();

    static async checkCompliance(user: User, apiKey: string) {
        // 60 second grace period to prevent penalty spam on startup/crashes
        if (Date.now() - this.startupTime < 60000) {
            console.log('[VoidFit] Punishment System: Grace period active.');
            return;
        }

        try {
            const today = new Date().toISOString().split('T')[0];
            
            // GLOBAL GUARD: Only one penalty allowed per calendar day
            if (user.lastPenaltyDate === today) {
                console.log('[VoidFit] Penalty already applied for today. skipping check.');
                return;
            }

            // Check if we already penalized for MISSION_FAILURE today
            const dailyMissions = await db.dailyMissions.get(today);
            if (dailyMissions && dailyMissions.status === QuestStatus.Failed) {
                await this.applyPenalty(user, apiKey, 'MISSION_FAILURE');
                return; // Stop after first penalty to avoid double-dipping
            }

            // Check for missed habits (Yesterday)
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            
            // Only check if user has habits defined and has been using the app for at least 2 days
            // (prevents false-positive penalties on fresh installs before habits can be logged)
            if (user.habits && user.habits.length > 0 && user.lastStepSync) {
                const daysSinceFirstSync = Math.floor((Date.now() - new Date(user.lastStepSync).getTime()) / 86400000);
                if (daysSinceFirstSync >= 2) {
                    const habitLogs = await db.habitLogs.where('date').equals(yesterdayStr).toArray();
                    if (habitLogs.length === 0) {
                        await this.applyPenalty(user, apiKey, 'TOTAL_DISCIPLINE_FAILURE');
                    }
                }
            }
        } catch (e) {
            console.error('[VoidFit] Compliance check failed (DB Busy):', e);
        }
    }

    private static async applyPenalty(user: User, apiKey: string, reason: string) {
        const xpDeduction = reason === 'MISSION_FAILURE' ? 500 : 1000;
        
        // Add Chat Notification
        await reportEventToAi(apiKey, user, 'PENALTY_PROTOCOL', { 
            reason, 
            xpDeducted: xpDeduction,
            message: "You've missed some commitments recently. That's okay — consistency is built over time. Let's reset and get back on track."
        });

        console.warn(`[VoidFit] Missed commitment: ${reason}. -${xpDeduction} XP deducted for ${user.name}.`);

        // Apply penalty in Zustand from outside React.
        useUserStore.getState().handlePenalty(xpDeduction, reason);
    }
}
