import type { ElementType } from 'react';
import { User, Skill, Realm, Quest, Difficulty, QuestStatus, StoryLogEntry, Badge, WeeklyProgress, ActivityData, FitnessGoal, FitnessGoalType, SystemMessage, Integration, Arc, AiPersonality, UserBodyState, AiAdaptationProfile, AiBehavioralPatterns } from './types';
import { Award, Star, Crown, Swords, Target, BrainCircuit, Heart, Zap, Sparkles, Coins, ShieldCheck, TrendingUp, ClipboardList, BookMarked, Shield, RefreshCw, ChevronsUp, Gift, Code, FlaskConical, Milestone, BookOpen, Repeat, BookText, Timer, Flame, Dumbbell, Footprints, Moon, Activity, ShieldAlert, Brain, Gauge, Dna } from 'lucide-react';

export const ICON_MAP: { [key: string]: ElementType } = {
    Award, Star, Crown, Swords, Target, BrainCircuit, Heart, Zap, Sparkles, Coins, ShieldCheck,
    TrendingUp, ClipboardList, BookMarked, Shield, RefreshCw, ChevronsUp, Gift, Code, FlaskConical, Milestone, BookOpen, Repeat, BookText, Timer, Flame, Dumbbell, Footprints, Moon, Activity, ShieldAlert, Brain, Gauge, Dna
};

export const SKILL_XP_BASE = 100;
export const SKILL_XP_MULTIPLIER = 1.2;

export const LEVEL_XP_BASE = 1000;
export const LEVEL_XP_MULTIPLIER = 1.1;

export const RANKS = [
    { minLevel: 1, title: 'E-Rank Beginner' },
    { minLevel: 5, title: 'D-Rank Consistent' },
    { minLevel: 10, title: 'C-Rank Athlete' },
    { minLevel: 20, title: 'B-Rank Iron Will' },
    { minLevel: 35, title: 'A-Rank Disciplined Warrior' },
    { minLevel: 50, title: 'S-Rank Peak Human' },
    { minLevel: 75, title: 'SS-Rank Legendary Beast' },
    { minLevel: 100, title: 'SSS-Rank Ascended' },
];

export const MISSION_XP_MAP: { [key in Difficulty]: number } = {
    [Difficulty.Easy]: 50,
    [Difficulty.Medium]: 100,
    [Difficulty.Hard]: 200,
};

export const getRankForLevel = (level: number): string => {
    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (level >= RANKS[i].minLevel) {
            return RANKS[i].title;
        }
    }
    return RANKS[0].title;
};

const skillXpThresholdCache = new Map<string, number>();
export const getXpThresholdForSkillLevel = (level: number, xpScale: number = 1.0): number => {
    const cacheKey = `${level}-${xpScale}`;
    if (skillXpThresholdCache.has(cacheKey)) {
        return skillXpThresholdCache.get(cacheKey)!;
    }
    if (level < 1) return Math.floor(SKILL_XP_BASE * xpScale);
    if (level === 1) return Math.floor(SKILL_XP_BASE * xpScale);
    
    const threshold = Math.floor(getXpThresholdForSkillLevel(level - 1, xpScale) * SKILL_XP_MULTIPLIER);
    skillXpThresholdCache.set(cacheKey, threshold);
    return threshold;
};

const xpThresholdCache = new Map<number, number>();
export const getXpThresholdForLevel = (level: number): number => {
    if (xpThresholdCache.has(level)) {
        return xpThresholdCache.get(level)!;
    }
    if (level < 1) return LEVEL_XP_BASE;
    if (level === 1) return LEVEL_XP_BASE;
    
    const threshold = Math.floor(getXpThresholdForLevel(level - 1) * LEVEL_XP_MULTIPLIER);
    xpThresholdCache.set(level, threshold);
    return threshold;
};

export const SKILL_DEFINITIONS: { [id: string]: Omit<Skill, 'level' | 'xp' | 'xpToNextLevel'> } = {
    'strength': { id: 'strength', name: 'Strength', realm: Realm.Strength, priority: 5, isActive: true, xpScale: 1.2 },
    'endurance': { id: 'endurance', name: 'Endurance', realm: Realm.Endurance, priority: 5, isActive: true, xpScale: 1.2 },
    'flexibility': { id: 'flexibility', name: 'Flexibility', realm: Realm.Flexibility, priority: 3, isActive: true, xpScale: 1.0 },
    'combat': { id: 'combat', name: 'Combat', realm: Realm.Combat, priority: 2, isActive: true, xpScale: 1.5 },
    'nutrition': { id: 'nutrition', name: 'Nutrition Mastery', realm: Realm.Nutrition, priority: 4, isActive: true, xpScale: 1.1 },
    'recovery': { id: 'recovery', name: 'Recovery & Sleep', realm: Realm.Recovery, priority: 4, isActive: true, xpScale: 1.0 },

};

export const HIDDEN_SKILLS: { [id: string]: Omit<Skill, 'level' | 'xp' | 'xpToNextLevel'> & { unlockRealm: Realm, unlockLevel: number } } = {
    'titan_physique': { 
        id: 'titan_physique', 
        name: 'Titan Physique', 
        realm: Realm.Strength, 
        priority: 7, 
        isActive: true, 
        xpScale: 2.5,
        unlockRealm: Realm.Strength,
        unlockLevel: 15
    },
    'shadow_step': { 
        id: 'shadow_step', 
        name: 'Shadow Step', 
        realm: Realm.Endurance, 
        priority: 6, 
        isActive: true, 
        xpScale: 1.8,
        unlockRealm: Realm.Endurance,
        unlockLevel: 12
    }
};

const initialSkillTree: { [skill_id: string]: Skill } = {};
Object.keys(SKILL_DEFINITIONS).forEach(id => {
    initialSkillTree[id] = {
        ...SKILL_DEFINITIONS[id],
        level: 1,
        xp: 0,
        xpToNextLevel: getXpThresholdForSkillLevel(1, SKILL_DEFINITIONS[id].xpScale),
    };
});

export const createDefaultAdaptationProfile = (): AiAdaptationProfile => ({
  preferredWorkoutStyle: 'hybrid',
  communicationStyle: 'direct',
  reminderFrequency: 'medium',
  difficultyOffset: 0,
  focusRealms: [Realm.Strength, Realm.Endurance, Realm.Nutrition],
  disabledFeatures: [],
  customRules: [],
  lastAdaptation: new Date().toISOString(),
  taskOverrides: [],
});

export const createDefaultBehavioralPatterns = (): AiBehavioralPatterns => ({
  preferredWorkoutTime: 'morning',
  averageMissionCompletionRate: 0,
  strongestRealm: Realm.Strength,
  weakestRealm: Realm.Flexibility,
  consistencyTrend: 'stable',
  commonStruggles: [],
  lastAnalysis: new Date().toISOString(),
});

const generateUid = (): string =>
    String(Math.floor(1000000000 + Math.random() * 9000000000));

export const createInitialUser = (): User => ({
    uid: generateUid(),
    id: 'user-001',
    name: "Athlete",
    rank: RANKS[0].title,
    level_overall: 1,
    xp_total: 0,
    xpToNextLevel: LEVEL_XP_BASE,
    stat_points: 0,
    stats: {
        [Realm.Strength]: 0,
        [Realm.Endurance]: 0,
        [Realm.Flexibility]: 0,
        [Realm.Combat]: 0,
        [Realm.Nutrition]: 0,
        [Realm.Recovery]: 0,
    },
    skill_tree: initialSkillTree,
    streaks: {
        daily_streak: 0,
        lastQuestCompletionDate: null,
        lastStepGoalDate: null,
    },
    bodyMetrics: {
        currentWeight: 80,
        targetWeight: 75,
        height: 180,
        age: 25,
        gender: 'Male',
        experienceLevel: 'Beginner',
        injuries: [],
        equipment: ['Dumbbells', 'Jump Rope'],
        availableTimeMinutes: 60,
        gymAccess: false,
        stamina: 5,
        flexibility: 5,
        sleepSchedule: '11PM - 7AM',
        stressLevel: 3,
        foodPreferences: [],
        allergies: [],
        dailySchedule: 'Work 9-5',
        pushupsMax: 0,
        pullupsMax: 0,
        runningAbility: 'Beginner',
        strengthLevel: 3,
    },
    primaryGoal: FitnessGoalType.GeneralFitness,
    personalRecords: {},
    completedGoals: [],
    activeBuffs: [],
    isHomeMode: true,
    isLazyMode: false,
    isTravelMode: false,
    isInjuryMode: false,
    personality: AiPersonality.Disciplined,
    dailyStepGoal: 10000,
    dailyCalorieGoal: 2200,
    combatStats: { wins: 0, losses: 0, draws: 0 },
    unlockedBadges: [],
    completedMajorGoals: [],
    checkInHistory: [],
    waterIntakeGoal_ml: 2500,
    activeTimedQuest: null,
    missionHistory: [],
    currentSteps: 0,
    currentDistance: 0,
    lastStepSync: new Date().toISOString(),
    lastPenaltyDate: undefined,
    lastGenesisDate: undefined,
    aiUsage: {
        mealScans: 0,
        formScans: 0,
        chatPrompts: 0,
        lastUsageReset: new Date().toISOString().split('T')[0],
        scannedImageHashes: []
    },
    onboardingCompleted: false,
    userState: {
        coreMission: 'Establish consistency',
        longTermGoals: 'Build sustainable fitness habits',
        shortTermGoals: 'Complete daily missions',
        transformationProtocol: 'General Performance Protocol',
        sideQuests: 'Explore all features',
        bodyState: UserBodyState.Beginner,
        recoveryScore: 70,
        aiAdaptationProfile: createDefaultAdaptationProfile(),
        behavioralPatterns: createDefaultBehavioralPatterns(),
    },
    habits: [
        { id: 'water', name: 'Hydration Goal', category: 'water', frequency: 'daily' },
        { id: 'skincare', name: 'Skincare Routine', category: 'skincare', frequency: 'daily' },
        { id: 'reading', name: 'Knowledge Intake', category: 'reading', frequency: 'daily' },
        { id: 'sleep', name: 'Rest Protocol', category: 'sleep', frequency: 'daily' },
        { id: 'steps', name: 'Step Objective', category: 'other', frequency: 'daily' },
    ],
    supplementProtocol: [
        { name: 'Creatine Monohydrate', dosage: '5g' },
        { name: 'Whey Protein', dosage: '30g' },
        { name: 'Omega-3', dosage: '1000mg' }
    ]
});

export const INITIAL_QUESTS: Quest[] = [
    {
        id: 'init-1',
        title: 'Morning Mobility',
        description: 'Complete a 10-minute mobility routine to start your day.',
        realm: Realm.Flexibility,
        xp_reward: 50,
        difficulty: Difficulty.Easy,
        duration_est_min: 10,
        status: QuestStatus.Pending,
        source: 'ai_coach',
    },
    {
        id: 'init-2',
        title: 'Hydration Goal',
        description: 'Drink 3 liters of water throughout the day.',
        realm: Realm.Nutrition,
        xp_reward: 30,
        difficulty: Difficulty.Easy,
        duration_est_min: 5,
        status: QuestStatus.Pending,
        source: 'ai_coach',
    }
];

export const createInitialFitnessGoals = (): FitnessGoal[] => [
    {
        id: 'goal-1',
        title: 'Transformation Kickstart',
        description: 'Consistent workout habit for 7 days.',
        type: FitnessGoalType.GeneralFitness,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        xp_reward: 500,
        targetValue: 7,
        currentValue: 0,
        unit: 'days',
        status: 'pending',
    }
];

export const BADGE_DEFINITIONS: Badge[] = [
    { id: 'level_10', name: 'Level 10', description: 'Reached overall level 10.', icon: 'Crown' },
    { id: 'level_50', name: 'Peak Human', description: 'Reached overall level 50.', icon: 'Zap' },
    { id: 'first_workout', name: 'First Drop of Sweat', description: 'Completed your first workout mission.', icon: 'Flame' },
    { id: 'strength_master', name: 'Iron Disciple', description: 'Reached level 10 in Strength Training.', icon: 'Dumbbell' },
    { id: 'cardio_king', name: 'Marathoner', description: 'Reached level 10 in Endurance.', icon: 'Footprints' },
    { id: 'consistency_streak', name: 'Unstoppable', description: 'Maintained a 30-day streak.', icon: 'Flame' },
];

export const createInitialStoryLog = (): StoryLogEntry[] => [
    {
        id: 'log1',
        date: new Date().toISOString(),
        title: "The Awakening",
        narrative: "The System has recalibrated for physical optimization. Your body is the primary vessel. The path to peak performance begins now."
    }
];

export const createInitialSystemMessages = (): SystemMessage[] => [
    { id: 'sys1', text: 'Fitness OS Initialized. Welcome, Athlete.', timestamp: new Date().toISOString(), type: 'system' }
];

export const INITIAL_WEEKLY_PROGRESS: WeeklyProgress[] = [
    { day: 'Mon', xp: 0 },
    { day: 'Tue', xp: 0 },
    { day: 'Wed', xp: 0 },
    { day: 'Thu', xp: 0 },
    { day: 'Fri', xp: 0 },
    { day: 'Sat', xp: 0 },
    { day: 'Sun', xp: 0 },
];

export const INITIAL_INTEGRATIONS: Integration[] = [
    { id: 'google_calendar', name: 'Google Calendar', description: 'Schedule missions around your life.', connected: false, type: 'google_calendar' },
    { id: 'firebase', name: 'Firebase Backup', description: 'Secure remote data synchronization.', connected: false, type: 'firebase' },
];

export const INITIAL_ARCS: Arc[] = [
    { id: 'arc-1', title: 'The Awakening', description: 'Initial transformation sequence. Focus on consistency.', effects: ['+10% Discipline XP'] },
];

export const INITIAL_WEEKLY_QUESTS: Quest[] = [
    {
        id: 'weekly-1',
        title: 'Endurance Architect',
        description: 'Amass 50,000 total steps over the next 7 days.',
        realm: Realm.Endurance,
        xp_reward: 500,
        difficulty: Difficulty.Hard,
        duration_est_min: 480,
        status: QuestStatus.Pending,
        source: 'ai_coach',
    },
    {
        id: 'weekly-2',
        title: 'Strength Foundations',
        description: 'Complete 3 dedicated weight-training sessions.',
        realm: Realm.Strength,
        xp_reward: 450,
        difficulty: Difficulty.Medium,
        duration_est_min: 180,
        status: QuestStatus.Pending,
        source: 'ai_coach',
    }
];