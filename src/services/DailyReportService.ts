/**
 * DailyReportService — aggregates ALL user activity for a 24h period
 * and feeds it to the AI for next-day blueprint generation.
 *
 * Called by BackgroundTaskManager at midnight (daily_genesis task).
 */
import { db } from '../db/database';
import { User } from '../../types';

export interface DailyReport {
  date: string;
  user: {
    name: string;
    level: number;
    rank: string;
    xpEarned: number;
    xpTotal: number;
    primaryGoal: string;
    streaks: number;
  };
  steps: { count: number; distance: number; goal: number };
  nutrition: { meals: number; totalCalories: number; totalProtein: number; totalHydration: number };
  recovery: { sleepHours: number; sleepQuality: number; avgSoreness: number; avgFatigue: number } | null;
  habits: { completed: number; total: number; list: string[] };
  missions: { completed: number; failed: number; totalXp: number };
  supplements: { taken: string[] };
  water: { totalMl: number; goalMl: number };
  moods: { avgStress: number; avgMotivation: number };
  territory: { captures: number; totalArea: number };
  aiChats: { count: number };
  bodyMetrics: { weight: number; injuries: string[] };
  notable: string[];
}

/**
 * Collect everything that happened today into a single structured report.
 */
export async function buildDailyReport(user: User, dateStr: string): Promise<DailyReport> {
  const dayStart = dateStr;
  const nextDay = new Date(new Date(dateStr).getTime() + 86400000).toISOString().split('T')[0];

  const [
    nutritionLogs,
    recoveryLogs,
    habitLogs,
    waterLogs,
    supplementLogs,
    moodLogs,
    activityLogs,
    chatLogs,
    trails,
    territories,
  ] = await Promise.all([
    db.nutritionLogs.where('date').between(dayStart, nextDay, true, false).toArray(),
    db.recoveryLogs.where('date').between(dayStart, nextDay, true, false).toArray(),
    db.habitLogs.where('date').between(dayStart, nextDay, true, false).toArray(),
    db.waterLogs.where('date').between(dayStart, nextDay, true, false).toArray(),
    db.supplementLogs.where('date').between(dayStart, nextDay, true, false).toArray(),
    db.moodLogs.where('date').between(dayStart, nextDay, true, false).toArray(),
    db.activityLogs.where('date').between(dayStart, nextDay, true, false).toArray(),
    db.chatLogs.where('timestamp').startsWith(dayStart).toArray(),
    db.trails.where('startTime').startsWith(dayStart).toArray(),
    db.territories.where('capturedAt').startsWith(dayStart).toArray(),
  ]);

  const missionsToday = (user.missionHistory || []).filter(m => m.date === dateStr);
  const habits = user.habits || [];
  const habitsCompletedToday = habitLogs.map(h => h.habitId);
  const habitNames = habits.filter(h => habitsCompletedToday.includes(h.id)).map(h => h.name);

  const notable: string[] = [];
  if (nutritionLogs.length === 0) notable.push('No meals logged');
  if (recoveryLogs.length === 0) notable.push('No recovery logged');
  if (user.currentSteps < user.dailyStepGoal * 0.5) notable.push('Step goal not met');
  if (missionsToday.filter(m => m.status === 'failed').length > 0) notable.push('Missions failed');
  if (territories.length > 0) notable.push(`Captured ${territories.length} territories`);

  if (nutritionLogs.length > 0) {
    const cals = nutritionLogs.reduce((s, l) => s + l.calories, 0);
    const prot = nutritionLogs.reduce((s, l) => s + l.protein, 0);
    if (cals > 3500) notable.push('High calorie day');
    if (prot < 100) notable.push('Low protein intake');
  }

  if (recoveryLogs.length > 0) {
    const avgSleep = recoveryLogs.reduce((s, l) => s + l.sleepHours, 0) / recoveryLogs.length;
    if (avgSleep < 6) notable.push('Sleep deprivation detected');
  }

  return {
    date: dateStr,
    user: {
      name: user.name,
      level: user.level_overall,
      rank: user.rank,
      xpEarned: 0, // computed from diffs — left for genesis
      xpTotal: user.xp_total,
      primaryGoal: user.primaryGoal,
      streaks: user.streaks.daily_streak,
    },
    steps: {
      count: user.currentSteps,
      distance: Math.round(user.currentDistance),
      goal: user.dailyStepGoal,
    },
    nutrition: {
      meals: nutritionLogs.length,
      totalCalories: nutritionLogs.reduce((s, l) => s + l.calories, 0),
      totalProtein: nutritionLogs.reduce((s, l) => s + l.protein, 0),
      totalHydration: nutritionLogs.reduce((s, l) => s + (l.hydration_ml || 0), 0),
    },
    recovery: recoveryLogs.length > 0
      ? {
          sleepHours: recoveryLogs.reduce((s, l) => s + l.sleepHours, 0) / recoveryLogs.length,
          sleepQuality: recoveryLogs.reduce((s, l) => s + l.sleepQuality, 0) / recoveryLogs.length,
          avgSoreness: recoveryLogs.reduce((s, l) => s + l.soreness, 0) / recoveryLogs.length,
          avgFatigue: recoveryLogs.reduce((s, l) => s + l.fatigue, 0) / recoveryLogs.length,
        }
      : null,
    habits: {
      completed: habitsCompletedToday.length,
      total: habits.length,
      list: habitNames,
    },
    missions: {
      completed: missionsToday.filter(m => m.status === 'completed').length,
      failed: missionsToday.filter(m => m.status === 'failed').length,
      totalXp: missionsToday.filter(m => m.status === 'completed').reduce((s, m) => s + (m as any).xp || 100, 0),
    },
    supplements: {
      taken: supplementLogs.filter(s => s.taken).map(s => s.name),
    },
    water: {
      totalMl: waterLogs.reduce((s, l) => s + (l.amount_ml || 0), 0),
      goalMl: user.waterIntakeGoal_ml,
    },
    moods: {
      avgStress: moodLogs.reduce((s, m) => s + m.stress, 0) / (moodLogs.length || 1),
      avgMotivation: moodLogs.reduce((s, m) => s + m.motivation, 0) / (moodLogs.length || 1),
    },
    territory: {
      captures: territories.length,
      totalArea: territories.reduce((s, t) => s + t.area, 0),
    },
    aiChats: {
      count: chatLogs.length,
    },
    bodyMetrics: {
      weight: user.bodyMetrics.currentWeight,
      injuries: user.bodyMetrics.injuries,
    },
    notable,
  };
}

/**
 * Build the AI prompt from a daily report.
 * Compressed format — ~400 tokens instead of raw JSON dump.
 */
export function buildRecapPrompt(report: DailyReport): string {
  const r = report;
  return `## DAILY RECAP — ${r.date}

**${r.user.name}** | LVL ${r.user.level} ${r.user.rank} | Goal: ${r.user.primaryGoal} | Streak: ${r.user.streaks}d

### Activity
- Steps: ${r.steps.count}/${r.steps.goal} (${r.steps.distance}m)
- Missions: ${r.missions.completed} done / ${r.missions.failed} failed
- Territory captures: ${r.territory.captures} (${r.territory.totalArea}m²)
- AI chats: ${r.aiChats.count}

### Nutrition
- Meals: ${r.nutrition.meals} | Calories: ${r.nutrition.totalCalories} | Protein: ${r.nutrition.totalProtein}g
- Water: ${r.water.totalMl}/${r.water.goalMl}ml
- Supplements: ${r.supplements.taken.join(', ') || 'none'}

### Recovery
${r.recovery ? `- Sleep: ${r.recovery.sleepHours.toFixed(1)}h (quality ${r.recovery.sleepQuality.toFixed(1)}/10)` : '- No recovery data'}
${r.recovery ? `- Soreness: ${r.recovery.avgSoreness.toFixed(1)}/10 | Fatigue: ${r.recovery.avgFatigue.toFixed(1)}/10` : ''}

### Habits
- Completed: ${r.habits.completed}/${r.habits.total} (${r.habits.list.join(', ') || 'none'})

### Body
- Weight: ${r.bodyMetrics.weight}kg | Injuries: ${r.bodyMetrics.injuries.join(', ') || 'none'}
- Mood — Stress: ${r.moods.avgStress.toFixed(1)}/10 | Motivation: ${r.moods.avgMotivation.toFixed(1)}/10

### Notable
${r.notable.map(n => `- ⚠ ${n}`).join('\n') || '- All systems nominal'}

Generate the next day's blueprint: adjust difficulty based on recovery, set nutrition targets based on yesterday's intake, plan workouts around injuries, and suggest focus areas.`;
}
