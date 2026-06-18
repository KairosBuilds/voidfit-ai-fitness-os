import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
    User, DailyMission, QuestStatus, Realm, Difficulty, 
    BodyMetrics, LabReport, AiPersonality,
    NutritionLog, RecoveryLog, HabitLog, SupplementLog, WeeklyCheckIn, AiAdaptationProfile, AiBehavioralPatterns
} from "../types";
import { z } from "zod";
import { enforceRateLimit } from "../src/services/rateLimiter";
import { getProvider } from "../src/services/ai/providerFactory";
import { useUserStore } from "../src/store/useUserStore";
import { APP_KNOWLEDGE_PROMPT } from "../src/services/aiAdaptationService";

// --- VALIDATION SCHEMAS ---
const ExerciseSchema = z.object({
    name: z.string(),
    sets: z.number().optional(),
    reps: z.string().optional(),
    duration: z.number().optional(),
}).passthrough().partial().catch({ name: 'Exercise' });

const WorkoutSectionSchema = z.object({
    title: z.string(),
    exercises: z.array(ExerciseSchema),
}).passthrough().catch({ title: 'Workout', exercises: [] });

const NutritionPlanSchema = z.object({
    targetCalories: z.number(),
    proteinGrams: z.number(),
    carbsGrams: z.number(),
    fatsGrams: z.number(),
    hydrationTargetMl: z.number(),
}).passthrough().catch({ targetCalories: 2000, proteinGrams: 150, carbsGrams: 250, fatsGrams: 65, hydrationTargetMl: 2500 });

export const DailyMissionSchema = z.object({
    id: z.string(),
    date: z.string(),
    title: z.string(),
    warmUp: WorkoutSectionSchema,
    coreWorkout: WorkoutSectionSchema,
    cooldown: WorkoutSectionSchema,
    recovery: z.array(z.string()),
    nutritionPlan: NutritionPlanSchema,
    xp_reward: z.number(),
    difficulty: z.enum(["Easy", "Medium", "Hard"]).catch("Medium"),
    status: z.nativeEnum(QuestStatus).catch(QuestStatus.Pending),
}).passthrough();

export const GenesisBlueprintSchema = z.object({
    primary_goal: z.string(),
    daily_blueprint: z.object({
        workout_plan: z.object({
            exercises: z.array(z.object({ name: z.string() }).passthrough()).default([]),
        }).passthrough(),
        calories_target_kcal: z.number().optional(),
        protein_target_g: z.number().optional(),
        carbs_target_g: z.number().optional(),
        fats_target_g: z.number().optional(),
        hydration_target_ml: z.number().optional(),
        recovery_protocol: z.object({
            active_recovery: z.string().optional(),
        }).passthrough().optional(),
    }).passthrough(),
}).passthrough();

/** Schema for AI-driven personalisation responses */
export const AiAdaptationSchema = z.object({
    personality_change: z.string().nullable(),
    mode_changes: z.object({
        isHomeMode: z.boolean().nullable(),
        isLazyMode: z.boolean().nullable(),
        isInjuryMode: z.boolean().nullable(),
        isTravelMode: z.boolean().nullable(),
    }),
    goal_changes: z.object({
        primaryGoal: z.string().nullable(),
        secondaryGoal: z.string().nullable(),
    }),
    adaptation_profile: z.object({
        preferredWorkoutStyle: z.string(),
        communicationStyle: z.string(),
        reminderFrequency: z.enum(['low', 'medium', 'high']),
        difficultyOffset: z.number().min(-2).max(2),
        focusRealms: z.array(z.string()),
        disabledFeatures: z.array(z.string()),
        customRules: z.array(z.string()),
    }),
    behavioral_patterns: z.object({
        preferredWorkoutTime: z.string(),
        averageMissionCompletionRate: z.number().min(0).max(1),
        strongestRealm: z.string(),
        weakestRealm: z.string(),
        consistencyTrend: z.enum(['improving', 'stable', 'declining']),
        commonStruggles: z.array(z.string()),
    }),
    settings_adjustments: z.object({
        dailyStepGoal: z.number().nullable(),
        waterIntakeGoal_ml: z.number().nullable(),
    }),
    reasoning: z.string(),
}).passthrough();

export const MealAnalysisSchema = z.object({
    food: z.string(),
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fats: z.number(),
    analysis: z.string(),
    modifications: z.string(),
    nextMealSuggestion: z.string()
});

const safeParseJson = (text: string) => {
    try {
        const cleaned = text.replace(/```json|```/g, "").trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("Failed to parse AI JSON:", text);
        return null;
    }
};

export class QuotaExceededError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "QuotaExceededError";
    }
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 1000): Promise<T> {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (err: any) {
            if (err instanceof QuotaExceededError) throw err;
            // Don't retry on quota/rate-limit errors — it makes things worse
            const errMsg = err?.message || '';
            if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) throw err;
            if (attempt === retries) throw err;
            await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
        }
    }
    throw new Error("Unreachable");
}

/**
 * PRODUCTION FAILOVER CHAIN: Gemini -> OpenAI -> Anthropic -> Local
 * Uses Promise.any with per-provider timeout for faster failover.
 */
async function callWithFailover(
    user: User,
    prompt: string,
    tokenBudget: number,
    priority: number
): Promise<string> {
    const providers: ('gemini' | 'openai' | 'anthropic')[] = ['gemini', 'openai', 'anthropic'];
    
    // Check global quota (Priority 3 check - AI Chat)
    if (priority === 3 && user.aiUsage.chatPrompts >= 20) {
        return JSON.stringify({
            message: "Coach limit reached for today. Let's focus on your current plan and check in tomorrow!",
            actionSuggestion: "Continue with your active habits and workouts."
        });
    }

    // Rate limit: check once before fan-out (not per-provider)
    enforceRateLimit();

    const personality = user.personality;
    const instructions = getSystemInstructions(personality);

    // Fire all providers in parallel — use the first successful response
    const attempts = providers.map(async (pId) => {
        const provider = getProvider(pId);
        const response = await withRetry(() => provider.chat(
            [{ role: 'user', text: prompt }],
            instructions,
        ));
        if (!response) throw new Error(`Empty response from ${pId}`);
        return { pId, response };
    });

    try {
        const winner = await Promise.any(attempts);
        if (priority === 3) useUserStore.getState().incrementAiUsage('chatPrompts');
        if (priority === 2) useUserStore.getState().incrementAiUsage('mealScans');
        return winner.response;
    } catch {
        // All providers failed — local fallback
        return JSON.stringify({
            fallbackMode: true,
            uiMessage: { 
                title: "COACH OFFLINE", 
                message: "I'm having trouble connecting right now, but you can still track your progress offline." 
            }
        });
    }
}

const cleanCache = new Map<string, string>();
const clean = (key: string) => {
    const cached = cleanCache.get(key);
    if (cached !== undefined) return cached;
    const cleaned = (key || '').replace(/['"\s]/g, '').trim();
    cleanCache.set(key, cleaned);
    return cleaned;
};

const instructionsCache = new Map<AiPersonality, string>();
const getSystemInstructions = (personality: AiPersonality = AiPersonality.Disciplined, includeAppKnowledge = false) => {
    const cacheKey = `${personality}-${includeAppKnowledge}`;
    const cached = instructionsCache.get(personality);
    if (cached && !includeAppKnowledge) return cached;

    const appKnowledge = includeAppKnowledge ? APP_KNOWLEDGE_PROMPT : '';

    const instructions = `
ROLE: You are a knowledgeable, warm, direct fitness coach and mentor.
PERSONALITY: ${personality}.

CORE GUIDELINES:
1. Speak like a real human mentor, not a software terminal or robotic AI.
2. Use warm, direct, encouraging, conversational language. Avoid corporate jargon, robotic warnings, and excessive system terminology.
3. Never expose internal mechanics, JSON structures, raw protocols, system tags (like [SYSTEM INPUT]), or error/debug logs. Translate everything into natural coach-to-athlete dialogue.
4. Keep the gamification subtle (80% human coach, 20% light RPG/progression flavor). Encourage accountability and consistency.
5. Focus on the next 24 hours. Safety and injury prevention are top priorities.
${appKnowledge}
`;
    if (!includeAppKnowledge) instructionsCache.set(personality, instructions);
    return instructions;
};

/**
 * DAILY_GENESIS: Sent once per day at midnight.
 */
export const generateDailyGenesis = async (apiKey: string, snapshot: any): Promise<any> => {
    const { user } = useUserStore.getState();
    const prompt = `Request Type: DAILY_GENESIS\nSnapshot: ${JSON.stringify(snapshot)}`;
    const response = await callWithFailover(user, prompt, 1000, 1);
    const parsed = safeParseJson(response);
    if (!parsed) return { error: "Parse Failure", fallbackMode: true };
    const validated = GenesisBlueprintSchema.safeParse(parsed);
    if (!validated.success) {
        console.warn('[VoidFit] Genesis schema mismatch, using parsed fallback:', validated.error.issues);
        return parsed;
    }
    return validated.data;
};

/** Build a sensible offline fallback mission so the user always gets a plan */
const buildLocalFallbackMission = (user: User): DailyMission => {
    const today = new Date().toISOString().split('T')[0];
    const isInjury = user.isInjuryMode;
    const isHome = user.isHomeMode || user.isLazyMode;

    const warmUp = {
        title: 'Warm-Up',
        exercises: [
            { name: 'Light Jogging / Walking', duration: 5 },
            { name: 'Arm Circles', sets: 2, reps: '15' },
            { name: 'Hip Rotations', sets: 2, reps: '10 each side' },
        ]
    };

    const coreWorkout = isInjury
        ? { title: 'Recovery Session', exercises: [
            { name: 'Gentle Stretching', duration: 15 },
            { name: 'Deep Breathing', duration: 5 },
            { name: 'Foam Rolling', duration: 10 },
          ]}
        : isHome
        ? { title: 'Home Workout', exercises: [
            { name: 'Bodyweight Squats', sets: 3, reps: '15' },
            { name: 'Push-Ups', sets: 3, reps: '10' },
            { name: 'Glute Bridges', sets: 3, reps: '15' },
            { name: 'Plank Hold', sets: 3, reps: '30 seconds' },
          ]}
        : { title: 'Full Body Session', exercises: [
            { name: 'Squats', sets: 4, reps: '12' },
            { name: 'Push-Ups', sets: 3, reps: '12' },
            { name: 'Dumbbell Rows', sets: 3, reps: '12 each' },
            { name: 'Lunges', sets: 3, reps: '10 each leg' },
            { name: 'Plank', sets: 3, reps: '40 seconds' },
          ]};

    const cooldown = {
        title: 'Cool-Down',
        exercises: [
            { name: 'Full Body Stretch', duration: 5 },
            { name: 'Deep Breathing', duration: 3 },
        ]
    };

    return {
        id: `mission-local-${today}`,
        date: today,
        title: isInjury ? 'Recovery Day' : isHome ? 'Home Workout Day' : 'Daily Training Session',
        warmUp,
        coreWorkout,
        cooldown,
        recovery: ['Drink at least 2L of water', 'Sleep 7–8 hours', 'Light stretching before bed'],
        nutritionPlan: {
            targetCalories: 2200,
            proteinGrams: 150,
            carbsGrams: 220,
            fatsGrams: 65,
            hydrationTargetMl: 2500,
        },
        xp_reward: 100,
        difficulty: Difficulty.Medium,
        status: QuestStatus.Pending,
    } as DailyMission;
};

export const generateDailyMission = async (
    apiKey: string, 
    user: User, 
    recentHistory: { date: string, status: 'completed' | 'failed' }[], 
    nutritionLogs: NutritionLog[] = [], 
    recoveryLogs: RecoveryLog[] = [], 
    habitLogs: HabitLog[] = [],
    supplementLogs: SupplementLog[] = [],
    waterLogs: { id: string; date: string; amount_ml: number }[] = [],
    currentSteps: number = 0,
    latestCheckIn?: WeeklyCheckIn
): Promise<DailyMission> => {
    const recentNutrition = nutritionLogs.slice(-3);
    const recentRecovery = recoveryLogs.slice(-3);
    const recentSupplements = supplementLogs.slice(-5);
    const recentHabits = habitLogs.slice(-7);
    const recentWater = waterLogs.slice(-3);
    const isLazyMode = user.isLazyMode ? 'yes' : 'no';
    const streakDays = user.streaks?.daily_streak ?? 0;
    const primaryGoal = user.primaryGoal;

    const prompt = `
Request Type: DAILY_MISSION

USER CONTEXT:
- Level: ${user.level_overall}
- Primary goal: ${primaryGoal}
- Current mode: lazy=${isLazyMode}, home=${user.isHomeMode ? 'yes' : 'no'}, injury=${user.isInjuryMode ? 'yes' : 'no'}
- Daily streak: ${streakDays}
- Current steps today: ${currentSteps}
- Mission history (last 7): ${JSON.stringify(recentHistory.slice(-7))}
- Recent nutrition logs (last 3): ${JSON.stringify(recentNutrition)}
- Recent recovery logs (last 3): ${JSON.stringify(recentRecovery)}
- Recent habit logs (last 7): ${JSON.stringify(recentHabits)}
- Recent supplement logs (last 5): ${JSON.stringify(recentSupplements)}
- Recent water logs (last 3): ${JSON.stringify(recentWater)}
- Latest weekly check-in: ${latestCheckIn ? JSON.stringify(latestCheckIn) : 'none'}

Generate a personalized Daily Mission in strict JSON format matching the required schema.
Use the context above to adapt workout intensity, recovery needs, and nutrition targets.
Output ONLY valid JSON matching the DailyMission schema.
`;

    try {
        const response = await callWithFailover(user, prompt, 1000, 1);
        // If the response is a fallback/offline message, skip to local plan
        if (response.includes('fallbackMode') || response.includes('COACH OFFLINE') || response.includes('Coach limit')) {
            console.info('[VoidFit] AI offline — using local fallback mission.');
            return buildLocalFallbackMission(user);
        }
        const data = safeParseJson(response);
        if (!data) {
            console.warn('[VoidFit] generateDailyMission: could not parse AI response, using local plan.');
            return buildLocalFallbackMission(user);
        }
        const validated = DailyMissionSchema.safeParse(data);
        if (!validated.success) {
            console.warn('[VoidFit] generateDailyMission: schema mismatch, using local plan.', validated.error.issues);
            return buildLocalFallbackMission(user);
        }
        return validated.data as DailyMission;
    } catch (err) {
        console.warn('[VoidFit] generateDailyMission failed, using local plan:', err);
        return buildLocalFallbackMission(user);
    }
};

export const analyzeMeal = async (apiKey: string, base64Image: string, mimeTypeHint?: string): Promise<string> => {
    const cleanKey = clean(apiKey);
    if (!cleanKey) {
        return JSON.stringify({ error: 'NO_API_KEY', message: 'Please add your API key in Settings to enable meal scanning.' });
    }
    if (!base64Image || base64Image.length < 100) {
        return JSON.stringify({ error: 'NO_IMAGE', message: 'No image was captured. Please take a photo or upload an image first.' });
    }
    const genAI = new GoogleGenerativeAI(cleanKey);
    const model = genAI.getGenerativeModel({
        model: 'gemini-flash-latest',
        systemInstruction: 'You are a professional nutritionist AI. Always respond with valid JSON only — no markdown, no prose, no code fences.',
    });
    const prompt = `Look at this food image. Identify every food item visible and estimate nutritional values.
Return ONLY this exact JSON structure with no extra text:
{
  "items_identified": [{"name": "food item name", "calories": 0, "protein": 0}],
  "total_calories_in_plate": 0,
  "total_protein": 0,
  "advice_if_exceeded": "Brief, warm coaching feedback about this meal choice in 1-2 sentences."
}`;
    // Detect actual MIME type from the image data to support PNG, WebP, etc.
    const mimeType = (mimeTypeHint || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
    try {
        const result = await withRetry(() => model.generateContent([
            prompt,
            { inlineData: { data: base64Image, mimeType } },
        ]));
        useUserStore.getState().incrementAiUsage('mealScans');
        const text = (await result.response).text();
        // Strip any accidental markdown fences before returning
        return text.replace(/```json|```/g, '').trim();
    } catch (error: any) {
        const msg = (error?.message || error?.statusText || error?.status || '').toLowerCase();
        const status = error?.status || error?.response?.status || 0;
        console.error('[VoidFit] analyzeMeal error:', error?.message || error, `(status: ${status})`);
        if (msg.includes('429') || msg.includes('quota') || msg.includes('resource_exhausted') || status === 429) {
            return JSON.stringify({ error: 'QUOTA_EXCEEDED', message: 'Your AI quota is full for now. Try again in a few minutes or log the meal manually.' });
        }
        if (msg.includes('api_key') || msg.includes('api key') || msg.includes('invalid') || status === 403 || status === 400 || msg.includes('permission') || msg.includes('not found')) {
            return JSON.stringify({ error: 'INVALID_KEY', message: 'Your API key seems to have an issue. Head to Settings and double-check it.' });
        }
        if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout') || msg.includes('offline') || msg.includes('failed to fetch') || msg.includes('typeerror') || msg.includes('abort') || msg.includes('cors')) {
            return JSON.stringify({ error: 'NETWORK_ERROR', message: "Can't reach Google's AI servers. Check your internet or try a smaller image. Log the meal manually for now." });
        }
        return JSON.stringify({ error: 'SCAN_FAILED', message: `Could not analyze the image. ${msg.slice(0, 100)}. Try again or log the meal manually.` });
    }
};

export const analyzeForm = async (
    apiKey: string, 
    base64Image: string, 
    exercise: string,
    userInjuries: string[] = []
): Promise<string> => {
    enforceRateLimit();
    const cleanKey = clean(apiKey);
    if (!cleanKey) {
        return 'Please add your API key in Settings to enable form scanning.';
    }
    const genAI = new GoogleGenerativeAI(cleanKey);
    const model = genAI.getGenerativeModel({
        model: 'gemini-flash-latest',
        systemInstruction: getSystemInstructions(undefined),
    });
    
    const injuryNote = userInjuries.length > 0
        ? `The athlete has the following injuries or limitations to keep in mind: ${userInjuries.join(', ')}.`
        : '';
    const prompt = `You are a personal trainer reviewing an athlete's exercise form.
Exercise being performed: ${exercise}.
${injuryNote}
Look at this image and provide:
1. What they are doing well
2. Specific corrections needed (if any)
3. One key tip for their next set
Keep your feedback warm, specific, and under 150 words. Speak directly to the athlete.`;

    try {
        const result = await withRetry(() => model.generateContent([
            prompt,
            { inlineData: { data: base64Image, mimeType: 'image/jpeg' } }
        ]));
        useUserStore.getState().incrementAiUsage('formScans');
        return (await result.response).text();
    } catch (error: any) {
        const msg = (error?.message || '').toLowerCase();
        const status = error?.status || error?.response?.status || 0;
        if (msg.includes('429') || msg.includes('quota') || status === 429) {
            return 'Your AI quota is temporarily full. Focus on keeping your core tight and joints aligned — check back shortly.';
        }
        if (msg.includes('api_key') || msg.includes('api key') || msg.includes('invalid') || status === 403 || status === 400) {
            return 'Your API key has an issue — head to Settings and double-check it.';
        }
        if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout') || msg.includes('offline') || msg.includes('cors')) {
            return "Can't reach Google's AI servers right now. Check your connection.";
        }
        return 'I could not load your form analysis right now. Make sure you are moving through the full range of motion with controlled reps.';
    }
};

export const analyzeLabReport = async (apiKey: string, report: LabReport): Promise<string> => {
    enforceRateLimit();
    const genAI = new GoogleGenerativeAI(clean(apiKey));
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    try {
        const result = await withRetry(() => model.generateContent([`Analyze lab results: ${JSON.stringify(report)}`]));
        return (await result.response).text();
    } catch (error: any) {
        return "I'm having trouble analyzing your lab report right now. Let's check it again later.";
    }
};

export const predictTransformationTimeline = async (apiKey: string, user: User): Promise<string> => {
    enforceRateLimit();
    const genAI = new GoogleGenerativeAI(clean(apiKey));
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const result = await withRetry(() => model.generateContent([getSystemInstructions(user.personality), `Predict transformation for ${user.name}`]));
    return (await result.response).text();
};

/**
 * Inject a compressed user-context block so the AI knows who it's talking to
 * without bloating every message. Uses ~120 tokens instead of the full User object.
 */
function buildUserContext(user: User): string {
    const body = user.bodyMetrics;
    const today = new Date().toISOString().split('T')[0];
    const missionsToday = (user.missionHistory || []).filter(m => m.date === today);
    return `[USER:${user.name}|LVL:${user.level_overall}|${user.rank}|GOAL:${user.primaryGoal}|WT:${body.currentWeight}kg|STEPS:${user.currentSteps}|STREAK:${user.streaks.daily_streak}d|MODE:${user.isLazyMode?'lazy':user.isHomeMode?'home':user.isInjuryMode?'injured':'active'}|MISSIONS:${missionsToday.filter(m=>m.status==='completed').length}/${missionsToday.length}]`;
}

export const getAiChatResponse = async (apiKey: string, user: User, message: string, chatHistory: { sender: 'user' | 'ai'; text: string }[]): Promise<string> => {
    enforceRateLimit();
    const provider = getProvider(undefined, apiKey);

    // Token-efficient history: keep last 6 messages + bot context
    const recentHistory = chatHistory.slice(-6);
    const userCtx = buildUserContext(user);

    const coachPrompt = `You are the VoidFit AI Coach. Speak like a real human mentor texting their athlete, not like a game menu or system terminal.
Personality type: ${user.personality}.
Current user context: ${userCtx}

CONVERSATIONAL RULES:
- Be warm, supportive, and direct. Avoid overly motivational/cheesy clichés or robotic phrasing.
- NEVER use robotic phrases like "System observed", "Protocol initiated", "Neural link congested", "Objective failed", or "Processing user input".
- NEVER output raw JSON, system tags (e.g., [SYSTEM INPUT]), or debug symbols.
- Use game elements (XP, Streaks, Quests) sparingly (keep the ratio 80% coach, 20% game flavor).
- Format responses naturally (using **bold** for key metrics or actions when helpful, keep paragraphs short).
- Do NOT display a full status dashboard in chat.
- Keep responses concise and under 200 words.

YOU CAN MAKE REAL CHANGES — you control the whole app. When the user asks to change a setting and you agree, you MUST append this exact line at the very end of your response:
[CHANGE]{"field1":value1,"field2":value2}
This is NOT raw JSON in the conversational text — it's an invisible command the app reads. Do not skip it. The user never sees it.
You can change ANY setting on the User object. Common field names:
- dailyStepGoal (number) — step target
- dailyCalorieGoal (number) — calorie target
- waterIntakeGoal_ml (number) — water target
- isHomeMode (boolean) — home workouts
- isLazyMode (boolean) — lazy mode
- isTravelMode (boolean) — travel mode
- isInjuryMode (boolean) — injury mode
- primaryGoal (string) — LoseWeight, BuildMuscle, Endurance, GeneralFitness, Recomposition, Mobility, SportSpecific
- secondaryGoal (string) — same options
- personality (string) — Disciplined, Chill, Aggressive, Military, Brutally Honest
- name (string) — user's display name
Examples:
[CHANGE]{"dailyStepGoal":20000}
[CHANGE]{"dailyCalorieGoal":3000}
[CHANGE]{"dailyStepGoal":20000,"dailyCalorieGoal":3000,"isHomeMode":true}
IMPORTANT: You MUST include the [CHANGE] line whenever you change a setting. This is how the app actually applies the change. Without it, nothing happens.`;

    const history = recentHistory.map(m => ({
        role: m.sender === 'user' ? 'user' as const : 'model' as const,
        text: m.text.length > 500 ? m.text.slice(0, 500) + '...' : m.text,
    }));

    try {
        const responseRaw = await withRetry(() => provider.chat(
            [...history, { role: 'user', text: message }],
            coachPrompt,
        ));
        return responseRaw;
    } catch (error: any) {
        return "I'm having trouble connecting to the network right now. Keep showing up, stay consistent, and let's check in again soon.";
    }
};

/**
 * 4.3 WEEKLY_CHECKIN_ANALYSIS
 */
export const recalibrateFitnessPlan = async (apiKey: string, user: User, checkIn: WeeklyCheckIn): Promise<{ updatedMetrics: Partial<BodyMetrics>, systemMessage: string }> => {
    const genAI = new GoogleGenerativeAI(clean(apiKey));
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Send only fields relevant to check-in recalibration (cuts token cost ~60-80%)
    const trimmedUser = {
        level: user.level_overall,
        primaryGoal: user.primaryGoal,
        personality: user.personality,
        bodyMetrics: {
            currentWeight: user.bodyMetrics.currentWeight,
            targetWeight: user.bodyMetrics.targetWeight,
            height: user.bodyMetrics.height,
            age: user.bodyMetrics.age,
            gender: user.bodyMetrics.gender,
            injuries: user.bodyMetrics.injuries,
            experienceLevel: user.bodyMetrics.experienceLevel,
        },
    };
    const request = {
        request_type: "WEEKLY_CHECKIN_ANALYSIS",
        user_data: trimmedUser,
        checkin_fields: checkIn
    };

    try {
        const result = await withRetry(() => model.generateContent([
            getSystemInstructions(user.personality),
            JSON.stringify(request)
        ]));
        const text = (await result.response).text().replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(text);
        return {
            updatedMetrics: parsed.updated_metrics || { currentWeight: checkIn.weight },
            systemMessage: parsed.strategy_rebuild_message || "Recalibration complete."
        };
    } catch (error: unknown) {
        return { updatedMetrics: { currentWeight: checkIn.weight }, systemMessage: "I couldn't reach the AI right now, so I've kept your current targets. We'll recalibrate properly at your next check-in." };
    }
};

export const validateApiKey = async (apiKey: string, provider: 'gemini' | 'openai' | 'anthropic'): Promise<{ valid: boolean; error?: string; quotaExceeded?: boolean }> => {
    const cleanKey = clean(apiKey);
    if (!cleanKey) return { valid: false, error: "API key is empty." };
    try {
        const aiProvider = getProvider(provider, cleanKey);
        // validateKey already returns true for 429 errors
        const valid = await aiProvider.validateKey(cleanKey);
        return { valid: true };
    } catch (error: any) {
        const message = error?.message || "Connection failed.";
        if (message.includes('429') || message.includes('quota')) {
            return { valid: true, quotaExceeded: true };
        }
        return { valid: false, error: message };
    }
};

export const summarizeWeeklyJourney = async (apiKey: string, user: User, logs: { date: string; content: string }[]): Promise<string> => {
    const genAI = new GoogleGenerativeAI(clean(apiKey));
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const condensed = logs.slice(-14);
    const rawLines = condensed.map(e => `- ${e.date}: ${e.content.slice(0, 200)}`).join("\n");
    const logBlock = rawLines.length > 8000 ? rawLines.slice(0, 8000) + "\n...[truncated]" : rawLines || "(no journal entries logged this period)";
    const prompt = `Summarize this player's weekly training and mindset arc in 2 short sections: Wins, and Next focus. Use their journal lines as evidence.\n\n${logBlock}`;
    try {
        const result = await withRetry(() => model.generateContent([getSystemInstructions(user.personality), prompt]));
        return (await result.response).text();
    } catch (error) {
        return "I'm having trouble analyzing your logs right now. Let's review your progress together.";
    }
};

export const generateSystemReaction = async (apiKey: string, user: User, eventType: string, eventData: Record<string, unknown>): Promise<string> => {
    enforceRateLimit();
    const genAI = new GoogleGenerativeAI(clean(apiKey));
    const model = genAI.getGenerativeModel({ 
        model: "gemini-flash-latest", 
        systemInstruction: getSystemInstructions(user.personality) 
    });
    
    const prompt = `The athlete has logged an event: ${eventType}. Details: ${JSON.stringify(eventData)}.
React to this naturally as their coach.
- Use warm, direct, human language.
- Do not use robotic tags, jargon, or system logs.
- Keep the response short (1-2 sentences).`;

    try {
        const result = await withRetry(() => model.generateContent([prompt]));
        const responseText = (await result.response).text().trim();
        try {
            const parsed = JSON.parse(responseText.replace(/```json|```/g, "").trim());
            return parsed.message || responseText;
        } catch (e) {
            return responseText;
        }
    } catch (error: any) {
        const msg = error?.message || "";
        if (msg.includes('429') || msg.includes('quota')) {
            return "I'm experiencing higher traffic than usual right now, but keep pushing forward with your day!";
        }
        return "I'm having trouble connecting to the network right now. Keep showing up, stay consistent, and let's check in again soon.";
    }
};

export const generateShortText = async (apiKey: string, prompt: string): Promise<string> => {
    enforceRateLimit();
    const genAI = new GoogleGenerativeAI(clean(apiKey));
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    try {
        const result = await withRetry(() => model.generateContent([prompt]));
        return (await result.response).text().trim();
    } catch (error) {
        return "Offline.";
    }
};
