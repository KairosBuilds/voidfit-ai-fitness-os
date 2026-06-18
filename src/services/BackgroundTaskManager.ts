/**
 * BackgroundTaskManager — AI-controllable periodic task scheduler.
 *
 * The AI can add, remove, or modify tasks via the adaptation profile.
 * Tasks survive page reload (persisted to Dexie) and run on a shared tick.
 */
import { db } from '../db/database';
import { useUserStore } from '../store/useUserStore';
import { useQuestStore } from '../store/useQuestStore';
import { useAuthStore } from '../store/useAuthStore';
import { PunishmentSystem } from './PunishmentSystem';
import { runAiAdaptation } from './aiAdaptationService';
import { syncDataToCloud } from './syncService';
import { getProvider } from './ai/providerFactory';
import { buildDailyReport, buildRecapPrompt } from './DailyReportService';
import { DailyMissionSchema } from '../../services/geminiService';
import { spiderweb } from './AiSpiderwebService';

export type BackgroundTaskId =
  | 'daily_genesis'
  | 'ai_adaptation'
  | 'compliance_check'
  | 'cloud_sync'
  | 'step_flush'
  | 'cleanup';

export interface BackgroundTask {
  id: BackgroundTaskId;
  name: string;
  intervalMs: number;
  lastRun: number | null;
  enabled: boolean;
  run: () => Promise<void>;
}

interface StoredTaskState {
  id: BackgroundTaskId;
  lastRun: number | null;
  enabled: boolean;
  intervalMs: number;
}

const DEFAULT_INTERVALS: Record<BackgroundTaskId, number> = {
  daily_genesis:    86_400_000,   // 24h
  ai_adaptation:     6_600_000,   // 6h  (6h + 10min buffer)
  compliance_check:  3_600_000,   // 1h
  cloud_sync:       30_000_000,   // 30min
  step_flush:         300_000,    // 5min
  cleanup:          86_400_000,   // 24h
};

export class BackgroundTaskManager {
  private static tasks = new Map<BackgroundTaskId, BackgroundTask>();
  private static tickTimer: ReturnType<typeof setInterval> | null = null;
  private static started = false;
  private static readonly TICK_MS = 60_000; // check every 60s

  // ---- Registration ----
  static registerAll() {
    this.register('daily_genesis', 'Daily Genesis', async () => {
      const { user, setUser } = useUserStore.getState();
      const { apiKey } = useAuthStore.getState();
      if (!user?.onboardingCompleted || !apiKey) return;

      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];

      // 1. Build full daily report from yesterday
      const report = await buildDailyReport(user, yesterday);

      // 1b. Spiderweb: get live cross-feature context
      const spiderwebCtx = await spiderweb.buildAiContext();

      // 2. Send recap + generation request to AI
      const recapPrompt = `${buildRecapPrompt(report)}\n\nLive Spiderweb Context: ${spiderwebCtx}`;
      const fullPrompt = `${recapPrompt}

Now generate today's daily mission as JSON matching this schema:
{
  "id": "mission-${today}",
  "date": "${today}",
  "title": "<short mission title>",
  "warmUp": { "title": "Warm-up", "exercises": [{"name": "<exercise>", "reps": "<count>", "sets": <n>}] },
  "coreWorkout": { "title": "Core", "exercises": [{"name": "<exercise>", "reps": "<count>", "sets": <n>}] },
  "cooldown": { "title": "Cooldown", "exercises": [] },
  "recovery": ["<tip>"],
  "nutritionPlan": { "targetCalories": <n>, "proteinGrams": <n>, "carbsGrams": <n>, "fatsGrams": <n>, "hydrationTargetMl": <n> },
  "xp_reward": <n>,
  "difficulty": "Easy|Medium|Hard",
  "status": "pending"
}`;

      try {
        const provider = getProvider(undefined, apiKey);
        const responseRaw = await provider.chat(
          [{ role: 'user', text: fullPrompt }],
          `You are VoidFit AI. PERSONALITY: ${user.personality}. Generate ONLY valid JSON. Adjust intensity based on yesterday's recovery. If soreness > 6, make it Easy. If sleep < 5h, reduce volume.`,
        );

        const cleaned = responseRaw.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        const validated = DailyMissionSchema.safeParse(parsed);

        if (validated.success) {
          useQuestStore.getState().setDailyMission(validated.data as any);
          console.log(`[DailyGenesis] Mission generated for ${today}: ${validated.data.title}`);
        } else {
          console.warn('[DailyGenesis] Schema mismatch, using partial:', validated.error.issues.slice(0, 2));
          useQuestStore.getState().setDailyMission(parsed);
        }

        // Stamp genesis date
        setUser(prev => ({ ...prev, lastGenesisDate: today }));
      } catch (err) {
        console.warn('[DailyGenesis] Failed:', err);
      }
    });

    this.register('ai_adaptation', 'AI Personalisation', async () => {
      const { apiKey } = useAuthStore.getState();
      if (apiKey) await runAiAdaptation(apiKey);
    });

    this.register('compliance_check', 'Compliance Audit', async () => {
      const { user } = useUserStore.getState();
      const { apiKey } = useAuthStore.getState();
      if (user && apiKey) await PunishmentSystem.checkCompliance(user, apiKey);
    });

    this.register('cloud_sync', 'Cloud Sync', async () => {
      const { apiKey } = useAuthStore.getState();
      if (apiKey) await syncDataToCloud();
    });

    this.register('step_flush', 'Step Counter Flush', async () => {
      // no-op: stepService already syncs every 5s via interval
    });

    this.register('cleanup', 'Old Data Cleanup', async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const tables = [db.chatLogs, db.activityLogs, db.nutritionLogs, db.recoveryLogs, db.habitLogs];
      await Promise.all(tables.map(t => t.where('date').below(thirtyDaysAgo).delete()));
    });
  }

  static register(id: BackgroundTaskId, name: string, handler: () => Promise<void>, intervalMs?: number) {
    this.tasks.set(id, {
      id,
      name,
      intervalMs: intervalMs ?? DEFAULT_INTERVALS[id],
      lastRun: null,
      enabled: true,
      run: handler,
    });
  }

  // ---- Persistence ----
  private static async persistState() {
    const states: StoredTaskState[] = [];
    this.tasks.forEach(t => states.push({ id: t.id, lastRun: t.lastRun, enabled: t.enabled, intervalMs: t.intervalMs }));
    await db.systemMessages.put({
      id: 'bg-task-state',
      text: JSON.stringify(states),
      timestamp: new Date().toISOString(),
      type: 'system',
    });
  }

  private static async loadState() {
    try {
      const stored = await db.systemMessages.get('bg-task-state');
      if (!stored) return;
      const states: StoredTaskState[] = JSON.parse(stored.text);
      for (const s of states) {
        const task = this.tasks.get(s.id);
        if (task) {
          task.lastRun = s.lastRun;
          task.enabled = s.enabled;
          task.intervalMs = s.intervalMs ?? DEFAULT_INTERVALS[s.id];
        }
      }
    } catch { /* first run — no state yet */ }
  }

  // ---- Lifecycle ----
  static async start() {
    if (this.started) return;
    this.started = true;

    this.registerAll();
    await this.loadState();

    // Immediate first-run for tasks that have never run
    const now = Date.now();
    for (const task of this.tasks.values()) {
      if (task.lastRun === null && task.enabled) {
        task.run().catch(e => console.warn(`[BG] ${task.name} first-run failed:`, e));
        task.lastRun = now;
      }
    }

    // Tick loop
    this.tickTimer = setInterval(() => this.tick(), this.TICK_MS);
    console.log(`[BackgroundTaskManager] Started with ${this.tasks.size} tasks (tick every ${this.TICK_MS / 1000}s)`);
  }

  static stop() {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    this.started = false;
    this.persistState();
    console.log('[BackgroundTaskManager] Stopped.');
  }

  private static async tick() {
    const now = Date.now();
    for (const task of this.tasks.values()) {
      if (!task.enabled) continue;
      if (task.lastRun !== null && now - task.lastRun < task.intervalMs) continue;

      try {
        await task.run();
        task.lastRun = now;
        console.log(`[BG] ${task.name} completed`);
      } catch (e) {
        console.warn(`[BG] ${task.name} failed:`, e);
      }
    }
    await this.persistState();
  }

  // ---- AI Control ----
  /** Called by the AI adaptation service to adjust task schedules. */
  static applyAiOverrides(overrides: { taskId: BackgroundTaskId; enabled?: boolean; intervalMs?: number }[]) {
    for (const o of overrides) {
      const task = this.tasks.get(o.taskId);
      if (!task) continue;
      if (o.enabled !== undefined) task.enabled = o.enabled;
      if (o.intervalMs !== undefined && o.intervalMs >= 60_000) task.intervalMs = o.intervalMs;
    }
    this.persistState();
  }

  static getTaskStatus(): { id: BackgroundTaskId; name: string; enabled: boolean; lastRun: number | null; nextRun: number | null }[] {
    const now = Date.now();
    const result: { id: BackgroundTaskId; name: string; enabled: boolean; lastRun: number | null; nextRun: number | null }[] = [];
    this.tasks.forEach(t => {
      const nextRun = t.lastRun !== null ? t.lastRun + t.intervalMs : now;
      result.push({ id: t.id, name: t.name, enabled: t.enabled, lastRun: t.lastRun, nextRun: t.enabled ? nextRun : null });
    });
    return result;
  }
}
