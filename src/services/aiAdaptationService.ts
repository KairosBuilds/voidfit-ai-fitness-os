import { User, Realm, AiAdaptationProfile, AiBehavioralPatterns, AiPersonality, FitnessGoalType, Habit, ActiveBuff, BodyMetrics, MedicalRecord } from '../../types';
import { useUserStore } from '../store/useUserStore';
import { EvolutionEngine } from './evolutionEngine';
import { db } from '../db/database';
import { getProvider } from './ai/providerFactory';
import { BackgroundTaskManager } from './BackgroundTaskManager';
import { spiderweb } from './AiSpiderwebService';

export const APP_KNOWLEDGE_PROMPT = `
## VOIDFIT APP ARCHITECTURE — YOU HAVE FULL CONTROL

### USER MODEL (every field you can read and write):
- \`uid\` (10-digit unique ID), \`name\`, \`level_overall\`, \`xp_total\`, \`xpToNextLevel\`, \`rank\` (E→D→C→B→A→S→SS→SSS)
- \`stat_points\`: unallocated points (+5 per level-up)
- \`stats\`: {Strength, Endurance, Flexibility, Combat, Nutrition, Recovery} — each 0–99
- \`skill_tree\`: map of skill_id → {level, xp, xpToNextLevel, realm, priority, isActive}
  - Hidden skills auto-unlock at milestone levels
- \`streaks\`: {daily_streak, lastQuestCompletionDate, lastStepGoalDate}
- \`primaryGoal\` / \`secondaryGoal\`: FatLoss, MuscleGain, Recomposition, Strength, Endurance, Flexibility, AthleticPerformance, GeneralFitness
- \`bodyMetrics\`: {currentWeight, targetWeight, bodyFatPercentage?, height, age, gender, experienceLevel, injuries[], equipment[], availableTimeMinutes, gymAccess, stamina(1-10), flexibility(1-10), sleepSchedule, stressLevel(1-10), foodPreferences[], allergies[], foodDislikes?[], dailySchedule, pushupsMax, pullupsMax, runningAbility, strengthLevel(1-10)}
- \`medicalRecord\`?: {medications[], conditions[], allergies[], surgeries[], bloodPressureIssues}
- \`activeBuffs[]\`: each {itemId, itemName, expiryTimestamp, effect: {type: "xp_boost"|"stat_boost"|"shield", value?: number}}
- \`activeTimedQuest\`?: {title, realm, estimatedMinutes, startTime}
- \`habits[]\`?: each {id, name, frequency: "daily"|"weekly", category: "water"|"skincare"|"reading"|"sleep"|"other"}
- \`supplementProtocol[]\`?: each {name, dosage}
- \`personalRecords\`: {[exercise: string]: string}
- \`completedGoals[]\`: FitnessGoal objects
- \`unlockedBadges[]\`: string IDs
- \`combatStats\`: {wins, losses, draws}
- \`missionHistory[]\`: {date, status: "completed"|"failed"}
- \`lastPenaltyDate\`, \`lastGenesisDate\`, \`lastWeeklyCheckIn\`: ISO date or YYYY-MM-DD
- \`currentSteps\`, \`currentDistance\`, \`lastStepSync\`
- \`waterIntakeGoal_ml\`, \`dailyStepGoal\`
- \`aiUsage\`: {mealScans, formScans, chatPrompts, lastUsageReset, scannedImageHashes[]}
- \`personality\`: Aggressive | Disciplined | Chill | Military | BrutallyHonest
- \`isHomeMode\`, \`isLazyMode\`, \`isTravelMode\`, \`isInjuryMode\`: booleans
- \`userState\`?: {coreMission, longTermGoals, shortTermGoals, transformationProtocol, sideQuests, bodyState, recoveryScore, aiAdaptationProfile, behavioralPatterns}

### MODE FLAGS (you can toggle):
- \`isHomeMode\` — bodyweight-only exercises
- \`isLazyMode\` — halves XP gain, easier workouts
- \`isTravelMode\` — minimal equipment, hotel-friendly
- \`isInjuryMode\` — avoids injured body parts

### DAILY MISSIONS (generated every midnight via DAILY_GENESIS):
- You set: workout plan, nutrition targets (calories, protein, carbs, fats, hydration), XP reward, difficulty
- Streak bonus: +1% per streak day (max +50%)
- Mode penalties: Lazy/Injury = 50% XP
- Buff multipliers: active xp_boost buffs apply (1.5–3x)

### REWARD SYSTEM:
- Level-ups grant 5 stat points. Stats allocated to realms increase related XP gain.
- Badges unlock at milestones. Rank progression: E→D→C→B→A→S→SS→SSS.
- Hidden skills unlock when a realm skill reaches milestone level.

### SPIDERWEB STATE (live daily snapshot):
- Calories consumed/target/remaining, protein consumed/target
- Steps current/goal, water current/goal
- Recovery: sleep hours, quality, soreness, fatigue
- Habits done today, missions completed/failed, supplements taken
- XP earned/lost today, AI chats today
- Mood: stress, motivation, burnout, confidence
- Notable flags: over calories, low protein, steps incomplete, low hydration, active buffs, mode toggles, sleep deprived, high stress, low motivation

### CONSTRAINTS:
- MAX 1 DAILY_GENESIS per day (runs at midnight).
- 20 free chat prompts/day. Rate limit: 60 calls/minute.
- Never invent injuries, body metrics, or lab results you cannot verify.
- Always prioritise safety over intensity.
- Output ONLY valid JSON unless otherwise specified.
- When you change modes or apply buffs/penalties, explain why in the reaction message.
- Validate all numeric ranges: stats 0-99, XP >= 0, step goals 1000-100000, water 500-10000ml, sleep 0-24h, ratings 1-10.
`;

/**
 * Build a complete serialised snapshot of the entire app state.
 * Every field the AI can read — User model, spiderweb state, recent Dexie logs, all stores.
 */
export async function buildFullAppContext(user: User): Promise<string> {
  const webState = await spiderweb.getState();
  const today = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  const [recentNutrition, recentRecovery, recentMood, recentHabits, recentSupplements, recentChats] = await Promise.all([
    db.nutritionLogs.where('date').between(sevenDaysAgo, today, true, true).toArray(),
    db.recoveryLogs.where('date').between(sevenDaysAgo, today, true, true).toArray(),
    db.moodLogs.where('date').between(sevenDaysAgo, today, true, true).toArray(),
    db.habitLogs.where('date').between(sevenDaysAgo, today, true, true).toArray(),
    db.supplementLogs.where('date').between(sevenDaysAgo, today, true, true).toArray(),
    db.chatLogs.where('timestamp').between(sevenDaysAgo, today, true, true).toArray(),
  ]);

  const topSkills = Object.values(user.skill_tree)
    .sort((a, b) => b.level - a.level)
    .slice(0, 5)
    .map(s => `${s.name} Lv${s.level}`);

  const activeBuffsInfo = user.activeBuffs
    .filter(b => b.expiryTimestamp > Date.now())
    .map(b => `${b.itemName} (${b.effect.type}${b.effect.value ? ' x' + b.effect.value : ''})`);

  const snap = {
    user: {
      uid: user.uid,
      name: user.name,
      level: user.level_overall,
      rank: user.rank,
      xp: user.xp_total,
      xpToNext: user.xpToNextLevel,
      statPoints: user.stat_points,
      stats: user.stats,
      topSkills,
      streak: user.streaks.daily_streak,
      primaryGoal: user.primaryGoal,
      secondaryGoal: user.secondaryGoal,
      personality: user.personality,
      modes: { home: user.isHomeMode, lazy: user.isLazyMode, travel: user.isTravelMode, injury: user.isInjuryMode },
      bodyMetrics: user.bodyMetrics,
      medicalRecord: user.medicalRecord,
      activeBuffs: activeBuffsInfo.length > 0 ? activeBuffsInfo : 'none',
      habits: (user.habits || []).map(h => h.name),
      supplementProtocol: user.supplementProtocol || [],
      unlockedBadges: user.unlockedBadges?.length || 0,
      combatStats: user.combatStats,
      weeklyCheckInDue: user.lastWeeklyCheckIn || 'never',
      waterGoal: user.waterIntakeGoal_ml,
      stepGoal: user.dailyStepGoal,
      bodyState: user.userState?.bodyState,
    },
    spiderweb: webState,
    last7Days: {
      nutritionLogs: recentNutrition.length,
      avgCalories: recentNutrition.length > 0
        ? Math.round(recentNutrition.reduce((s, l) => s + l.calories, 0) / recentNutrition.length)
        : 0,
      recoveryLogs: recentRecovery.length,
      avgSleep: recentRecovery.length > 0
        ? Math.round((recentRecovery.reduce((s, l) => s + l.sleepHours, 0) / recentRecovery.length) * 10) / 10
        : 0,
      avgSleepQuality: recentRecovery.length > 0
        ? Math.round((recentRecovery.reduce((s, l) => s + l.sleepQuality, 0) / recentRecovery.length) * 10) / 10
        : 0,
      moodLogs: recentMood.length,
      habitsCompleted: recentHabits.filter(l => l.completed).length,
      supplementsTaken: recentSupplements.filter(l => l.taken).length,
      chatMessages: recentChats.length,
    },
    adaptationProfile: user.userState?.aiAdaptationProfile,
    behavioralPatterns: user.userState?.behavioralPatterns,
    protocol: user.userState?.transformationProtocol,
  };

  return JSON.stringify(snap, null, 2);
}

export function buildAdaptationPrompt(user: User, recentLogs: { nutrition: number; recovery: number; missionsCompleted: number; missionsFailed: number; avgSleep: number }): string {
    const profile = user.userState?.aiAdaptationProfile;
    const patterns = user.userState?.behavioralPatterns;
    return `
${APP_KNOWLEDGE_PROMPT}

## ADAPTATION REQUEST — Analyse this user and return personalised settings

### CURRENT USER SNAPSHOT:
- Name: ${user.name}
- Level: ${user.level_overall} | Rank: ${user.rank}
- Primary Goal: ${user.primaryGoal} | Secondary: ${user.secondaryGoal || 'none'}
- Personality: ${user.personality}
- Modes: lazy=${user.isLazyMode}, home=${user.isHomeMode}, injury=${user.isInjuryMode}, travel=${user.isTravelMode}
- Body State: ${EvolutionEngine.diagnoseBodyState(user)}
- Daily Step Goal: ${user.dailyStepGoal} | Water Goal: ${user.waterIntakeGoal_ml}ml
- Streak: ${user.streaks.daily_streak} days
- XP: ${user.xp_total} | Level: ${user.level_overall} | Stat Points: ${user.stat_points}
- Stats: ${JSON.stringify(user.stats)}
- Active Buffs: ${JSON.stringify(user.activeBuffs)}
- Habits: ${JSON.stringify((user.habits || []).map(h => h.name))}
- Supplements: ${JSON.stringify(user.supplementProtocol || [])}
- Badges: ${user.unlockedBadges?.length || 0} unlocked
- Medical Record: ${JSON.stringify(user.medicalRecord)}

### CURRENT ADAPTATION PROFILE:
${JSON.stringify(profile, null, 2)}

### BEHAVIORAL PATTERNS:
${JSON.stringify(patterns, null, 2)}

### RECENT PERFORMANCE (last 7 days):
- Nutrition logs: ${recentLogs.nutrition}
- Recovery logs: ${recentLogs.recovery}
- Missions completed: ${recentLogs.missionsCompleted}
- Missions failed: ${recentLogs.missionsFailed}
- Avg sleep: ${recentLogs.avgSleep}h

### RETURN FORMAT — strictly valid JSON with these fields:
{
  "personality_change": "<AiPersonality or null>",
  "mode_changes": {
    "isHomeMode": <bool or null>,
    "isLazyMode": <bool or null>,
    "isInjuryMode": <bool or null>,
    "isTravelMode": <bool or null>
  },
  "goal_changes": {
    "primaryGoal": "<FitnessGoalType or null>",
    "secondaryGoal": "<FitnessGoalType or null>"
  },
  "active_buffs": [
    {"itemId": "buff_1", "itemName": "Double XP", "durationHours": 24, "effect": {"type": "xp_boost", "value": 2}}
  ],
  "penalty": {"xp": <number 0-1000>, "reason": "<string>"},
  "habits": [
    {"action": "add|remove", "habit": {"name": "<string>", "frequency": "daily|weekly", "category": "water|skincare|reading|sleep|other"}}
  ],
  "supplements": [
    {"action": "add|remove", "supplement": {"name": "<string>", "dosage": "<string>"}}
  ],
  "badge_to_award": {"badgeId": "<string>", "badgeName": "<string>"},
  "body_metrics_update": {"currentWeight": <number or null>, "bodyFatPercentage": <number or null>},
  "medical_record_update": {"medications": ["<string>"], "conditions": ["<string>"]},
  "personal_record_update": {"<exercise>": "<string>"},
  "adaptation_profile": {
    "preferredWorkoutStyle": "<workout style>",
    "communicationStyle": "<style>",
    "reminderFrequency": "<low|medium|high>",
    "difficultyOffset": <number -2 to 2>,
    "focusRealms": ["<Realm>", ...],
    "disabledFeatures": ["<feature name>", ...],
    "customRules": ["<rule>", ...]
  },
  "behavioral_patterns": {
    "preferredWorkoutTime": "<string>",
    "averageMissionCompletionRate": <0-1>,
    "strongestRealm": "<Realm>",
    "weakestRealm": "<Realm>",
    "consistencyTrend": "<improving|stable|declining>",
    "commonStruggles": ["<string>", ...]
  },
  "settings_adjustments": {
    "dailyStepGoal": <number 1000-100000 or null>,
    "waterIntakeGoal_ml": <number 500-10000 or null>
  },
  "background_tasks": [
    {"taskId": "daily_genesis", "enabled": true, "intervalMs": 86400000},
    {"taskId": "cloud_sync", "enabled": false}
  ],
  "reasoning": "<short explanation of changes>"
}
`;
}

/**
 * Apply ALL adaptation decisions returned by the AI.
 * Every control surface is wired here.
 */
export function applyAdaptation(user: User, adaptation: any): Partial<User> {
    const updates: Partial<User> = {};

    // Personality change
    if (adaptation.personality_change && adaptation.personality_change !== user.personality) {
        const validPersonalities = Object.values(AiPersonality);
        if (validPersonalities.includes(adaptation.personality_change)) {
            updates.personality = adaptation.personality_change;
        }
    }

    // Mode changes
    if (adaptation.mode_changes) {
        const mc = adaptation.mode_changes;
        if (typeof mc.isHomeMode === 'boolean') updates.isHomeMode = mc.isHomeMode;
        if (typeof mc.isLazyMode === 'boolean') updates.isLazyMode = mc.isLazyMode;
        if (typeof mc.isInjuryMode === 'boolean') updates.isInjuryMode = mc.isInjuryMode;
        if (typeof mc.isTravelMode === 'boolean') updates.isTravelMode = mc.isTravelMode;
    }

    // Goal changes
    if (adaptation.goal_changes) {
        const validGoals = Object.values(FitnessGoalType);
        if (adaptation.goal_changes.primaryGoal && validGoals.includes(adaptation.goal_changes.primaryGoal)) {
            updates.primaryGoal = adaptation.goal_changes.primaryGoal;
        }
        if (adaptation.goal_changes.secondaryGoal && validGoals.includes(adaptation.goal_changes.secondaryGoal)) {
            updates.secondaryGoal = adaptation.goal_changes.secondaryGoal;
        } else if (adaptation.goal_changes.secondaryGoal === null) {
            updates.secondaryGoal = undefined;
        }
    }

    // Active buffs — wire the previously claimed-but-unimplemented control surface
    if (Array.isArray(adaptation.active_buffs)) {
        const now = Date.now();
        const newBuffs: ActiveBuff[] = adaptation.active_buffs.map((b: any) => ({
            itemId: b.itemId || `buff-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            itemName: b.itemName || 'AI Buff',
            expiryTimestamp: now + (b.durationHours || 24) * 3600000,
            effect: {
                type: b.effect?.type || 'xp_boost',
                value: b.effect?.value ?? 2,
            },
        }));
        updates.activeBuffs = [...(user.activeBuffs || []), ...newBuffs];
    }

    // Penalty — deduct XP within bounds
    if (adaptation.penalty && typeof adaptation.penalty.xp === 'number') {
        const xp = Math.max(0, Math.min(1000, adaptation.penalty.xp));
        updates.xp_total = Math.max(0, (user.xp_total || 0) - xp);
        updates.lastPenaltyDate = new Date().toISOString().split('T')[0];
    }

    // Settings adjustments — max delta ±500 per cycle to prevent ratcheting
    if (adaptation.settings_adjustments) {
        if (typeof adaptation.settings_adjustments.dailyStepGoal === 'number') {
            const proposed = adaptation.settings_adjustments.dailyStepGoal;
            const clamped = Math.max(1000, Math.min(100000, proposed));
            const delta = clamped - user.dailyStepGoal;
            updates.dailyStepGoal = user.dailyStepGoal + Math.max(-500, Math.min(500, delta));
        }
        if (typeof adaptation.settings_adjustments.waterIntakeGoal_ml === 'number') {
            const proposed = adaptation.settings_adjustments.waterIntakeGoal_ml;
            const clamped = Math.max(500, Math.min(10000, proposed));
            const delta = clamped - user.waterIntakeGoal_ml;
            updates.waterIntakeGoal_ml = user.waterIntakeGoal_ml + Math.max(-500, Math.min(500, delta));
        }
    }

    // Adaptation profile
    const existingProfile = user.userState?.aiAdaptationProfile;
    if (adaptation.adaptation_profile && existingProfile) {
        const newProfile: AiAdaptationProfile = {
            ...existingProfile,
            ...adaptation.adaptation_profile,
            lastAdaptation: new Date().toISOString(),
        };
        if (Array.isArray(adaptation.adaptation_profile.focusRealms)) {
            const validRealms = Object.values(Realm);
            newProfile.focusRealms = adaptation.adaptation_profile.focusRealms.filter((r: string) => validRealms.includes(r as Realm));
        }
        updates.userState = { ...user.userState!, aiAdaptationProfile: newProfile };
    }

    // Behavioral patterns
    const existingPatterns = user.userState?.behavioralPatterns;
    if (adaptation.behavioral_patterns && existingPatterns) {
        const newPatterns: AiBehavioralPatterns = {
            ...existingPatterns,
            ...adaptation.behavioral_patterns,
            lastAnalysis: new Date().toISOString(),
        };
        updates.userState = { ...(updates.userState || user.userState!), behavioralPatterns: newPatterns };
    }

    // Background task overrides
    if (Array.isArray(adaptation.background_tasks)) {
        BackgroundTaskManager.applyAiOverrides(adaptation.background_tasks);
        const existingProfile = updates.userState?.aiAdaptationProfile || user.userState?.aiAdaptationProfile;
        if (existingProfile) {
            const profileWithTasks = {
                ...existingProfile,
                taskOverrides: adaptation.background_tasks,
            };
            updates.userState = { ...(updates.userState || user.userState!), aiAdaptationProfile: profileWithTasks };
        }
    }

    // Habits — AI can add or remove
    if (Array.isArray(adaptation.habits)) {
        const currentHabits = [...(user.habits || [])];
        for (const hAction of adaptation.habits) {
            if (hAction.action === 'add' && hAction.habit) {
                const newHabit: Habit = {
                    id: `habit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    name: hAction.habit.name || 'New Habit',
                    frequency: hAction.habit.frequency || 'daily',
                    category: hAction.habit.category || 'other',
                };
                currentHabits.push(newHabit);
            } else if (hAction.action === 'remove' && hAction.habit?.name) {
                const idx = currentHabits.findIndex(h => h.name.toLowerCase() === hAction.habit.name.toLowerCase());
                if (idx >= 0) currentHabits.splice(idx, 1);
            }
        }
        updates.habits = currentHabits;
    }

    // Supplements — AI can add or remove
    if (Array.isArray(adaptation.supplements)) {
        const currentSupps = [...(user.supplementProtocol || [])];
        for (const sAction of adaptation.supplements) {
            if (sAction.action === 'add' && sAction.supplement) {
                currentSupps.push({
                    name: sAction.supplement.name || 'New Supplement',
                    dosage: sAction.supplement.dosage || '',
                });
            } else if (sAction.action === 'remove' && sAction.supplement?.name) {
                const idx = currentSupps.findIndex(s => s.name.toLowerCase() === sAction.supplement.name.toLowerCase());
                if (idx >= 0) currentSupps.splice(idx, 1);
            }
        }
        updates.supplementProtocol = currentSupps;
    }

    // Badge award
    if (adaptation.badge_to_award && adaptation.badge_to_award.badgeId) {
        const badges = [...(user.unlockedBadges || [])];
        if (!badges.includes(adaptation.badge_to_award.badgeId)) {
            badges.push(adaptation.badge_to_award.badgeId);
            updates.unlockedBadges = badges;
        }
    }

    // Body metrics update — merge into bodyMetrics on the updates object
    if (adaptation.body_metrics_update) {
        const bmu = adaptation.body_metrics_update;
        const newMetrics: Partial<BodyMetrics> = {};
        if (typeof bmu.currentWeight === 'number' && bmu.currentWeight > 20 && bmu.currentWeight < 500) {
            newMetrics.currentWeight = bmu.currentWeight;
        }
        if (typeof bmu.bodyFatPercentage === 'number' && bmu.bodyFatPercentage > 2 && bmu.bodyFatPercentage < 70) {
            newMetrics.bodyFatPercentage = bmu.bodyFatPercentage;
        }
        if (Object.keys(newMetrics).length > 0) {
            updates.bodyMetrics = { ...user.bodyMetrics, ...newMetrics };
        }
    }

    // Medical record update
    if (adaptation.medical_record_update) {
        const existing = user.medicalRecord || { id: `med-${user.uid}`, medications: [], conditions: [], allergies: [], surgeries: [], bloodPressureIssues: '' };
        const mru = adaptation.medical_record_update;
        updates.medicalRecord = {
            ...existing,
            ...(mru.medications ? { medications: mru.medications } : {}),
            ...(mru.conditions ? { conditions: mru.conditions } : {}),
        };
    }

    // Personal record update
    if (adaptation.personal_record_update) {
        const prs = { ...(user.personalRecords || {}) };
        for (const [exercise, value] of Object.entries(adaptation.personal_record_update)) {
            if (typeof value === 'string') {
                prs[exercise] = value;
            }
        }
        updates.personalRecords = prs;
    }

    return updates;
}

export async function computeRecentPerformance(user: User) {
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

    const [nutritionLogs, recoveryLogs] = await Promise.all([
        db.nutritionLogs.where('date').between(sevenDaysAgo, today, true, true).toArray(),
        db.recoveryLogs.where('date').between(sevenDaysAgo, today, true, true).toArray(),
    ]);

    const missionHistory = user.missionHistory?.slice(-7) || [];
    const avgSleep = recoveryLogs.length > 0
        ? recoveryLogs.reduce((s, l) => s + l.sleepHours, 0) / recoveryLogs.length
        : 7;

    return {
        nutrition: nutritionLogs.length,
        recovery: recoveryLogs.length,
        missionsCompleted: missionHistory.filter(m => m.status === 'completed').length,
        missionsFailed: missionHistory.filter(m => m.status === 'failed').length,
        avgSleep: Math.round(avgSleep * 10) / 10,
    };
}

export async function runAiAdaptation(apiKey: string): Promise<void> {
    const { user, applyAiAdaptation } = useUserStore.getState();

    if (!user || !user.onboardingCompleted) return;

    const profile = user.userState?.aiAdaptationProfile;
    if (profile?.lastAdaptation) {
        const hoursSince = (Date.now() - new Date(profile.lastAdaptation).getTime()) / 3600000;
        if (hoursSince < 6) return;
    }

    try {
        const recentLogs = await computeRecentPerformance(user);
        const prompt = buildAdaptationPrompt(user, recentLogs);

        const provider = getProvider(undefined, apiKey);
        const response = await provider.chat(
            [{ role: 'user', text: prompt }],
            `You are VoidFit AI, a fitness personalisation engine. PERSONALITY: ${user.personality}\n${APP_KNOWLEDGE_PROMPT}`,
        );

        const cleaned = response.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        if (!parsed.adaptation_profile) {
            console.warn('[AiAdaptation] AI returned malformed response, skipping.');
            return;
        }

        const updates = applyAdaptation(user, parsed);
        applyAiAdaptation(updates);

        console.log(`[AiAdaptation] Applied personalisation for ${user.name}: ${parsed.reasoning?.slice(0, 100)}`);
    } catch (err) {
        console.warn('[AiAdaptation] Failed:', err);
    }
}
