import React, { useEffect, useState } from 'react';
import { permissionManager } from '../../permissions/PermissionManager';
import { notificationService } from '../../services/notificationService';
import { useAuthStore } from '../../store/useAuthStore';
import { useUserStore } from '../../store/useUserStore';
import { BackgroundTaskManager } from '../../services/BackgroundTaskManager';
import { TerritorySystem } from '../../services/TerritorySystem';
import { db } from '../../db/database';

interface AppInitializerProps {
  children: React.ReactNode;
}

export const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      // 0. Purge any remaining seed/bot data from previous sessions
      try {
        const botIdPattern = /^bot-/;
        const guilds = await db.guilds.toArray();
        for (const guild of guilds) {
          const realMembers = guild.members.filter(m => !botIdPattern.test(m));
          if (realMembers.length !== guild.members.length) {
            if (realMembers.length === 0) {
              await db.guilds.delete(guild.id);
            } else {
              const memberSteps = { ...guild.memberSteps };
              for (const key of Object.keys(memberSteps)) {
                if (botIdPattern.test(key)) delete memberSteps[key];
              }
              const newLeader = botIdPattern.test(guild.leaderId)
                ? (realMembers[0] || '')
                : guild.leaderId;
              await db.guilds.update(guild.id, {
                members: realMembers,
                memberSteps,
                leaderId: newLeader
              });
            }
          }
        }
        await db.systemMessages.filter(m => m.id.startsWith('rival-')).delete();
        const botNames = ['S-Rank_Titan', 'Neon_Shadow', 'Iron_Vanguard', 'Cyber_Monk', 'Bio_Hacker'];
        await db.pvpMatches.filter(m =>
          m.player1Id.startsWith('bot-') ||
          m.player2Id.startsWith('bot-') ||
          botNames.includes(m.player1Id) ||
          botNames.includes(m.player2Id)
        ).delete();
      } catch (err) {
        console.warn('[AppInitializer] Seed data cleanup failed:', err);
      }

      // 0.5 Clean up removed Discipline/Lifestyle realms from persisted user
      try {
        const { user, setUser } = useUserStore.getState();
        if (user) {
          const s = user.stats as any;
          if ('Discipline' in s || 'Lifestyle' in s) {
            const clean = { ...s };
            delete clean.Discipline;
            delete clean.Lifestyle;
            setUser(prev => ({ ...prev, stats: clean }));
          }
        }
      } catch (err) {
        console.warn('[AppInitializer] Realm migration failed:', err);
      }

      // 1. Permissions — non-fatal
      try {
        await permissionManager.initialize();
        const results = await permissionManager.requestBulkPermissions(
          ['health_data', 'notifications'] as any[],
          false,
        );
        results.forEach((r: any) =>
          console.log(`Permission ${r.permission}: ${r.granted ? 'granted' : 'denied'}`),
        );
      } catch (err) {
        console.warn('[AppInitializer] Permissions unavailable:', err);
      }

      // 2. Notifications — optional
      try {
        const canNotify = await notificationService.requestPermissions();
        if (canNotify) {
          await notificationService.scheduleDailyReminder(8, 0, 'VoidFit', 'Your daily workout is ready!');
          await notificationService.scheduleWeeklyCheckInReminder();
        }
      } catch (err) {
        console.warn('[AppInitializer] Notifications failed:', err);
      }

      // 3. Start background tracking
      try {
        const { user } = useUserStore.getState();
        if (user) {
          await TerritorySystem.startTracking(user, 'walk');
        }
      } catch (err) {
        console.warn('[AppInitializer] Tracking start failed:', err);
      }

      // 4. Start AI-controllable background task manager
      //    This replaces ad‑hoc per‑task scheduling with a unified tick loop.
      //    Registered tasks: daily_genesis, ai_adaptation, compliance_check,
      //                      cloud_sync, step_flush, cleanup.
      await BackgroundTaskManager.start().catch(err => console.warn('[AppInitializer] Background tasks start failed:', err));

      setIsReady(true);
    };

    initialize().catch(err => console.error('[AppInitializer] Initialization failed:', err));

    return () => {
      BackgroundTaskManager.stop();
    };
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 border-4 border-primary-action/30 rounded-full" />
            <div className="absolute inset-0 border-4 border-primary-action border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-main-text font-semibold">Loading VoidFit...</p>
          <p className="text-sm text-sub-text mt-1">Setting things up</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
