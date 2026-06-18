import { db } from '../db/database';
import { useUserStore } from '../store/useUserStore';
import { Realm } from '../../types';

// ─── Event Types ───────────────────────────────────────────────

export type SpiderwebEvent =
  | { type: 'MEAL_SCAN'; data: { calories: number; protein: number; carbs?: number; fats?: number; mealName: string } }
  | { type: 'STEP_UPDATE'; data: { steps: number; distance: number } }
  | { type: 'WORKOUT_COMPLETE'; data: { missionTitle: string; xpEarned: number; difficulty: string } }
  | { type: 'RECOVERY_LOG'; data: { sleepHours: number; sleepQuality: number; soreness: number; fatigue: number } }
  | { type: 'HABIT_DONE'; data: { habitName: string; habitId?: string } }
  | { type: 'MOOD_LOG'; data: { stress: number; motivation: number; burnout?: number; confidence?: number } }
  | { type: 'TERRITORY_CAPTURE'; data: { area: number; xpEarned: number; territoryId?: string } }
  | { type: 'WATER_LOG'; data: { amountMl: number } }
  | { type: 'NUTRITION_LOG'; data: { calories: number; protein: number; carbs?: number; fats?: number; hydrationMl?: number } }
  | { type: 'SUPPLEMENT_TAKEN'; data: { name: string; dosage: string } }
  | { type: 'POSTURE_LOG'; data: { quality: number } }
  | { type: 'EXPENSE_LOG'; data: { amount: number; category: string } }
  | { type: 'BODY_METRICS_UPDATE'; data: { weight?: number; bodyFat?: number; [key: string]: any } }
  | { type: 'ACHIEVEMENT_UNLOCK'; data: { badgeId: string; badgeName: string } }
  | { type: 'GOAL_PROGRESS'; data: { goalId: string; progress: number } };

// ─── Unified Daily State ───────────────────────────────────────

export interface DailySpiderwebState {
  date: string;
  calories: { consumed: number; target: number; remaining: number };
  protein: { consumed: number; target: number };
  steps: { current: number; goal: number };
  water: { currentMl: number; goalMl: number };
  recovery: { sleepHours: number; quality: number; soreness: number; fatigue: number } | null;
  habitsDone: string[];
  missionsCompleted: number;
  missionsFailed: number;
  territoryCaptures: number;
  territoryArea: number;
  xpEarnedToday: number;
  xpLostToday: number;
  aiChatsToday: number;
  mood: { stress: number; motivation: number; burnout: number; confidence: number } | null;
  supplements: { name: string; dosage: string }[];
  notableFlags: string[];
  lastEvent: string;
}

// ─── Audit Trail ──────────────────────────────────────────────

export interface AuditEntry {
  timestamp: string;
  eventType: string;
  summary: string;
  integrityHash: string;
}

// ─── Input Validation ─────────────────────────────────────────

function validateEvent(event: SpiderwebEvent): string | null {
  switch (event.type) {
    case 'MEAL_SCAN':
      if (event.data.calories < 0 || event.data.calories > 10000) return 'Invalid calories range';
      if (event.data.protein < 0 || event.data.protein > 1000) return 'Invalid protein range';
      return null;
    case 'STEP_UPDATE':
      if (event.data.steps < 0 || event.data.steps > 200000) return 'Invalid steps count';
      return null;
    case 'WORKOUT_COMPLETE':
      if (event.data.xpEarned < 0 || event.data.xpEarned > 10000) return 'Invalid XP reward';
      return null;
    case 'WATER_LOG':
      if (event.data.amountMl < 0 || event.data.amountMl > 5000) return 'Invalid water amount';
      return null;
    case 'RECOVERY_LOG':
      if (event.data.sleepHours < 0 || event.data.sleepHours > 24) return 'Invalid sleep hours';
      if (event.data.sleepQuality < 1 || event.data.sleepQuality > 10) return 'Invalid sleep quality';
      if (event.data.soreness < 1 || event.data.soreness > 10) return 'Invalid soreness';
      if (event.data.fatigue < 1 || event.data.fatigue > 10) return 'Invalid fatigue';
      return null;
    case 'MOOD_LOG':
      if (event.data.stress < 1 || event.data.stress > 10) return 'Invalid stress level';
      if (event.data.motivation < 1 || event.data.motivation > 10) return 'Invalid motivation';
      return null;
    case 'NUTRITION_LOG':
      if (event.data.calories < 0 || event.data.calories > 10000) return 'Invalid calories';
      return null;
    case 'TERRITORY_CAPTURE':
      if (event.data.area < 0) return 'Invalid area';
      return null;
    case 'SUPPLEMENT_TAKEN':
      if (!event.data.name) return 'Supplement name required';
      return null;
    case 'POSTURE_LOG':
      if (event.data.quality < 1 || event.data.quality > 10) return 'Invalid posture quality';
      return null;
    case 'EXPENSE_LOG':
      if (event.data.amount < 0) return 'Invalid expense amount';
      return null;
    default:
      return null;
  }
}

// ─── Integrity ────────────────────────────────────────────────

function computeStateHash(state: DailySpiderwebState): string {
  const relevant = `${state.date}|${state.calories.consumed}|${state.protein.consumed}|${state.steps.current}|${state.water.currentMl}|${state.recovery?.sleepHours ?? ''}|${state.habitsDone.length}|${state.missionsCompleted}|${state.xpEarnedToday}|${state.xpLostToday}`;
  let hash = 0;
  for (let i = 0; i < relevant.length; i++) {
    const char = relevant.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

// ─── The Spiderweb ─────────────────────────────────────────────

class AiSpiderwebServiceClass {
  private listeners: Array<(event: SpiderwebEvent) => void> = [];
  private _state: DailySpiderwebState | null = null;
  private auditLog: AuditEntry[] = [];
  private previousHash: string = '';

  on(cb: (event: SpiderwebEvent) => void) {
    this.listeners.push(cb);
    return () => { this.listeners = this.listeners.filter(l => l !== cb); };
  }

  async emit(event: SpiderwebEvent): Promise<void> {
    const validationError = validateEvent(event);
    if (validationError) {
      console.warn(`[Spiderweb] Rejected event ${event.type}: ${validationError}`);
      return;
    }

    this.listeners.forEach(cb => { try { cb(event); } catch { /* noop */ } });

    await this.handleCrossEffects(event);

    await db.systemMessages.put({
      id: `spider-${Date.now()}`,
      text: JSON.stringify(event),
      timestamp: new Date().toISOString(),
      type: 'system',
    });

    // Invalidate cached state so next getState() recomputes
    this._state = null;
  }

  async getState(): Promise<DailySpiderwebState> {
    if (this._state) return this._state;

    const { user } = useUserStore.getState();
    const today = new Date().toISOString().split('T')[0];

    const [nutritionLogs, waterLogs, moodLogs, habitLogs, activityLogs, suppLogs, recoveryLogs] = await Promise.all([
      db.nutritionLogs.where('date').startsWith(today).toArray(),
      db.waterLogs.where('date').startsWith(today).toArray(),
      db.moodLogs.where('date').equals(today).toArray(),
      db.habitLogs.where('date').equals(today).toArray(),
      db.activityLogs.where('date').equals(today).toArray(),
      db.supplementLogs.where('date').equals(today).toArray(),
      db.recoveryLogs.where('date').equals(today).toArray(),
    ]);

    const calories = nutritionLogs.reduce((s, l) => s + (l.calories || 0), 0);
    const protein = nutritionLogs.reduce((s, l) => s + (l.protein || 0), 0);
    const water = waterLogs.reduce((s, l) => s + (l.amount_ml || 0), 0);
    const xpToday = activityLogs.reduce((s, l) => s + (l.xp || 0), 0);
    const missionsToday = (user.missionHistory || []).filter(m => m.date === today);
    const latestMood = moodLogs.length > 0 ? moodLogs[moodLogs.length - 1] : null;
    const habitsDoneToday = habitLogs.filter(l => l.completed).map(l => l.habitId);
    const suppsToday = suppLogs.filter(l => l.taken).map(l => ({ name: l.name, dosage: l.dosage }));
    const latestRecovery = recoveryLogs.length > 0 ? recoveryLogs[recoveryLogs.length - 1] : null;

    const state: DailySpiderwebState = {
      date: today,
      calories: {
        consumed: calories,
        target: user.userState?.aiAdaptationProfile?.difficultyOffset
          ? 2000 + user.userState.aiAdaptationProfile.difficultyOffset * 200
          : 2000,
        remaining: 0,
      },
      protein: {
        consumed: protein,
        target: Math.round(user.bodyMetrics.currentWeight * 2),
      },
      steps: { current: user.currentSteps || 0, goal: user.dailyStepGoal },
      water: { currentMl: water, goalMl: user.waterIntakeGoal_ml },
      recovery: latestRecovery ? {
        sleepHours: latestRecovery.sleepHours,
        quality: latestRecovery.sleepQuality,
        soreness: latestRecovery.soreness,
        fatigue: latestRecovery.fatigue,
      } : null,
      habitsDone: habitsDoneToday,
      missionsCompleted: missionsToday.filter(m => m.status === 'completed').length,
      missionsFailed: missionsToday.filter(m => m.status === 'failed').length,
      territoryCaptures: 0,
      territoryArea: 0,
      xpEarnedToday: xpToday,
      xpLostToday: 0,
      aiChatsToday: user.aiUsage?.chatPrompts || 0,
      mood: latestMood ? {
        stress: latestMood.stress,
        motivation: latestMood.motivation,
        burnout: latestMood.burnout,
        confidence: latestMood.confidence,
      } : null,
      supplements: suppsToday,
      notableFlags: [],
      lastEvent: '-',
    };

    state.calories.remaining = state.calories.target - state.calories.consumed;

    if (state.calories.remaining < 0) state.notableFlags.push('Over calorie limit');
    if (protein < 100) state.notableFlags.push('Low protein');
    if (user.currentSteps < user.dailyStepGoal) state.notableFlags.push('Steps incomplete');
    if (water < user.waterIntakeGoal_ml * 0.7) state.notableFlags.push('Low hydration');
    if (user.activeBuffs && user.activeBuffs.length > 0) state.notableFlags.push(`Buff active: ${user.activeBuffs[0].itemName}`);
    if (user.isInjuryMode) state.notableFlags.push('Injury mode');
    if (user.isLazyMode) state.notableFlags.push('Lazy mode');
    if (user.isTravelMode) state.notableFlags.push('Travel mode');
    if (state.habitsDone.length === 0 && user.habits && user.habits.length > 0) state.notableFlags.push('No habits done');
    if (state.recovery && state.recovery.sleepHours < 6) state.notableFlags.push('Sleep deprived');
    if (state.recovery && state.recovery.quality < 4) state.notableFlags.push('Poor sleep quality');
    if (state.mood && state.mood.stress > 7) state.notableFlags.push('High stress');
    if (state.mood && state.mood.motivation < 3) state.notableFlags.push('Low motivation');

    this._state = state;
    return state;
  }

  async buildAiContext(): Promise<string> {
    const s = await this.getState();
    const { user } = useUserStore.getState();
    const flags = s.notableFlags.map(f => `⚠${f}`).join(' ') || 'Nominal';
    const realmStats = Object.entries(user.stats || {})
      .map(([r, v]) => `${r[0]}${v}`)
      .join('/');
    return (
      `[${s.date}|CAL:${s.calories.consumed}/${s.calories.target}(${s.calories.remaining >= 0 ? '+' : ''}${s.calories.remaining})` +
      `|PRO:${s.protein.consumed}/${s.protein.target}g` +
      `|STP:${s.steps.current}/${s.steps.goal}` +
      `|WTR:${s.water.currentMl}/${s.water.goalMl}ml` +
      `|MISS:${s.missionsCompleted}/${s.missionsFailed}` +
      `|XP:${s.xpEarnedToday}` +
      `|STR:${user.streaks.daily_streak}d` +
      `|RLM:${realmStats}` +
      `|HBT:${s.habitsDone.length}` +
      `|${flags}]`
    );
  }

  getAuditLog(): AuditEntry[] {
    return [...this.auditLog];
  }

  getLastIntegrityHash(): string {
    return this.previousHash;
  }

  verifyIntegrity(): { valid: boolean; expectedHash: string; actualHash: string } {
    if (!this._state) return { valid: true, expectedHash: '', actualHash: '' };
    const actualHash = computeStateHash(this._state);
    const valid = !this.previousHash || this.previousHash === actualHash;
    return { valid, expectedHash: this.previousHash, actualHash };
  }

  private appendAudit(event: SpiderwebEvent, summary: string) {
    const state = this._state;
    const integrityHash = state ? computeStateHash(state) : '';
    this.previousHash = integrityHash;
    this.auditLog.push({
      timestamp: new Date().toISOString(),
      eventType: event.type,
      summary,
      integrityHash,
    });
    if (this.auditLog.length > 500) {
      this.auditLog = this.auditLog.slice(-500);
    }
  }

  private async handleCrossEffects(event: SpiderwebEvent) {
    const { user, setUser, handleGrantReward, incrementStreak, handlePenalty } = useUserStore.getState();
    if (!user) return;

    switch (event.type) {
      case 'MEAL_SCAN': {
        const log = {
          id: `nutri-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          calories: event.data.calories,
          protein: event.data.protein,
          carbs: event.data.carbs || 0,
          fats: event.data.fats || 0,
          hydration_ml: 0,
          mealType: event.data.mealName,
          meals: [{ name: event.data.mealName, calories: event.data.calories, protein: event.data.protein }],
        };
        await db.nutritionLogs.put(log);
        this.appendAudit(event, `Meal logged: ${event.data.mealName} (${event.data.calories}cal)`);
        break;
      }

      case 'WATER_LOG': {
        await db.waterLogs.put({
          id: `water-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          amount_ml: event.data.amountMl,
        });
        this.appendAudit(event, `Water logged: ${event.data.amountMl}ml`);
        break;
      }

      case 'WORKOUT_COMPLETE': {
        handleGrantReward(event.data.xpEarned, Realm.Endurance, `Mission: ${event.data.missionTitle}`);
        incrementStreak();
        await db.activityLogs.put({
          date: new Date().toISOString().split('T')[0],
          skillId: 'endurance',
          xp: event.data.xpEarned,
          duration_min: 0,
        });
        this.appendAudit(event, `Workout complete: ${event.data.missionTitle} (+${event.data.xpEarned}xp)`);
        break;
      }

      case 'TERRITORY_CAPTURE': {
        handleGrantReward(event.data.xpEarned, Realm.Endurance, 'Territory Capture');
        await db.activityLogs.put({
          date: new Date().toISOString().split('T')[0],
          skillId: 'endurance',
          xp: event.data.xpEarned,
        });
        this.appendAudit(event, `Territory captured: ${event.data.area}m² (+${event.data.xpEarned}xp)`);
        break;
      }

      case 'RECOVERY_LOG': {
        await db.recoveryLogs.put({
          id: `rec-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          sleepHours: event.data.sleepHours,
          sleepQuality: event.data.sleepQuality,
          soreness: event.data.soreness,
          fatigue: event.data.fatigue,
        });
        this.appendAudit(event, `Recovery logged: ${event.data.sleepHours}h sleep`);
        break;
      }

      case 'STEP_UPDATE': {
        useUserStore.getState().updateSteps(event.data.steps, event.data.distance);
        this.appendAudit(event, `Steps updated: ${event.data.steps}`);
        break;
      }

      case 'HABIT_DONE': {
        const habitId = event.data.habitId || `habit-${Date.now()}`;
        await db.habitLogs.put({
          id: `hlog-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          habitId,
          completed: true,
        });
        useUserStore.getState().handleGrantReward(20, Realm.Strength, `Habit: ${event.data.habitName}`);
        this.appendAudit(event, `Habit done: ${event.data.habitName}`);
        break;
      }

      case 'MOOD_LOG': {
        await db.moodLogs.put({
          id: `mood-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          stress: event.data.stress,
          burnout: event.data.burnout || 5,
          discipline: user.userState?.behavioralPatterns ? 5 : 5,
          motivation: event.data.motivation,
          confidence: event.data.confidence || 5,
        });
        this.appendAudit(event, `Mood logged: stress=${event.data.stress}, motivation=${event.data.motivation}`);
        break;
      }

      case 'NUTRITION_LOG': {
        await db.nutritionLogs.put({
          id: `nutri-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          calories: event.data.calories,
          protein: event.data.protein,
          carbs: event.data.carbs || 0,
          fats: event.data.fats || 0,
          hydration_ml: event.data.hydrationMl || 0,
          meals: [{ name: 'Logged meal', calories: event.data.calories, protein: event.data.protein }],
        });
        this.appendAudit(event, `Nutrition logged: ${event.data.calories}cal, ${event.data.protein}g protein`);
        break;
      }

      case 'SUPPLEMENT_TAKEN': {
        await db.supplementLogs.put({
          id: `supp-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          name: event.data.name,
          dosage: event.data.dosage,
          taken: true,
        });
        this.appendAudit(event, `Supplement taken: ${event.data.name} ${event.data.dosage}`);
        break;
      }

      case 'POSTURE_LOG': {
        await db.postureLogs.put({
          id: `post-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          quality: event.data.quality,
        });
        this.appendAudit(event, `Posture logged: ${event.data.quality}/10`);
        break;
      }

      case 'EXPENSE_LOG': {
        await db.expenseLogs.put({
          id: `exp-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          amount: event.data.amount,
          category: event.data.category,
          description: '',
        });
        this.appendAudit(event, `Expense logged: $${event.data.amount} (${event.data.category})`);
        break;
      }

      case 'BODY_METRICS_UPDATE': {
        const updates: any = {};
        if (event.data.weight) updates.currentWeight = event.data.weight;
        if (event.data.bodyFat) updates.bodyFatPercentage = event.data.bodyFat;
        useUserStore.getState().updateBodyMetrics(updates);
        this.appendAudit(event, `Body metrics updated: weight=${event.data.weight}, bodyFat=${event.data.bodyFat}`);
        break;
      }

      case 'ACHIEVEMENT_UNLOCK': {
        const badges = [...(user.unlockedBadges || [])];
        if (!badges.includes(event.data.badgeId)) {
          badges.push(event.data.badgeId);
          setUser(prev => ({ ...prev, unlockedBadges: badges }));
        }
        this.appendAudit(event, `Achievement unlocked: ${event.data.badgeName}`);
        break;
      }

      case 'GOAL_PROGRESS': {
        setUser(prev => ({
          ...prev,
          completedGoals: (prev.completedGoals || []).map(g =>
            g.id === event.data.goalId ? { ...g, currentValue: event.data.progress } : g
          ),
        }));
        this.appendAudit(event, `Goal progress: ${event.data.goalId} → ${event.data.progress}`);
        break;
      }
    }
  }
}

export const spiderweb = new AiSpiderwebServiceClass();
