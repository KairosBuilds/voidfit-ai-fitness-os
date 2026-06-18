import React from 'react';

export type Coordinate = [number, number]; // [lat, lng]

/** Activity modes for territory capture with anti-cheat speed limits */
export type ActivityMode = 'walk' | 'run' | 'cycle';

export const ACTIVITY_SPEED_LIMITS: Record<ActivityMode, { maxMps: number; label: string }> = {
  walk:  { maxMps: 3.0,  label: 'Walk' },
  run:   { maxMps: 8.0,  label: 'Run' },
  cycle: { maxMps: 15.0, label: 'Cycle' },
};


export enum Realm {
  Strength = "Strength",
  Endurance = "Endurance",
  Flexibility = "Flexibility",
  Combat = "Combat",
  Nutrition = "Nutrition",
  Recovery = "Recovery",
}

export enum Difficulty {
  Easy = "Easy",
  Medium = "Medium",
  Hard = "Hard",
}

export enum QuestStatus {
  Pending = "pending",
  InProgress = "in_progress",
  Completed = "completed",
  Failed = "failed",
}

export enum FitnessGoalType {
  FatLoss = "Fat Loss",
  MuscleGain = "Muscle Gain",
  Recomposition = "Body Recomposition",
  Strength = "Strength",
  Endurance = "Endurance",
  Flexibility = "Flexibility",
  AthleticPerformance = "Athletic Performance",
  GeneralFitness = "General Fitness",
}

export interface BodyMetrics {
  currentWeight: number;
  targetWeight: number;
  bodyFatPercentage?: number;
  height: number;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  injuries: string[];
  equipment: string[];
  availableTimeMinutes: number;
  gymAccess: boolean;
  stamina: number; // 1-10
  flexibility: number; // 1-10
  sleepSchedule: string;
  stressLevel: number; // 1-10
  foodPreferences: string[];
  allergies: string[];
  foodDislikes?: string[];
  dailySchedule: string;
  pushupsMax: number;
  pullupsMax: number;
  runningAbility: string;
  strengthLevel: number; // 1-10
}

export interface MedicalRecord {
  id: string;
  medications: string[];
  conditions: string[];
  allergies: string[];
  surgeries: string[];
  bloodPressureIssues: string;
}

export interface LabReport {
  id: string;
  date: string;
  vitaminD?: number;
  testosterone?: number;
  cholesterol?: number;
  thyroid?: number;
  bloodSugar?: number;
  fileUrl?: string; 
  analysis?: string;
}

export interface BodyPhoto {
  id: string;
  date: string;
  type: 'face' | 'body';
  imageUrl: string;
}

export interface MoodLog {
  id: string;
  date: string;
  stress: number;
  burnout: number;
  discipline: number;
  motivation: number;
  confidence: number;
}

export interface Habit {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly';
  category: 'water' | 'skincare' | 'reading' | 'sleep' | 'other';
}

export interface HabitLog {
  id: string;
  date: string;
  habitId: string;
  completed: boolean;
}

export interface SupplementLog {
  id: string;
  date: string;
  name: string;
  dosage: string;
  taken: boolean;
}

export interface ExpenseLog {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
}

export interface PostureLog {
  id: string;
  date: string;
  quality: number; // 1-10
  notes?: string;
}

export enum AiPersonality {
  Aggressive = "Aggressive",
  Disciplined = "Disciplined",
  Chill = "Chill",
  Military = "Military",
  BrutallyHonest = "Brutally Honest",
}

export type BackgroundTaskId = 'daily_genesis' | 'ai_adaptation' | 'compliance_check' | 'cloud_sync' | 'step_flush' | 'cleanup';

/** Parameters the AI can modify per user to personalize the app experience */
export interface AiAdaptationProfile {
  preferredWorkoutStyle: 'explosive' | 'endurance' | 'hybrid' | 'calisthenics' | 'weights';
  communicationStyle: 'direct' | 'encouraging' | 'educational' | 'brutal';
  reminderFrequency: 'low' | 'medium' | 'high';
  difficultyOffset: number; // -2 to +2, adjusts mission difficulty
  focusRealms: Realm[];     // Which realms to prioritise
  disabledFeatures: string[];
  customRules: string[];
  lastAdaptation: string;
  /** AI-controlled background task overrides */
  taskOverrides: { taskId: BackgroundTaskId; enabled: boolean; intervalMs?: number }[];
}

/** Behavioral patterns the AI tracks to personalise */
export interface AiBehavioralPatterns {
  preferredWorkoutTime: string;
  averageMissionCompletionRate: number; // 0-1
  strongestRealm: Realm;
  weakestRealm: Realm;
  consistencyTrend: 'improving' | 'stable' | 'declining';
  commonStruggles: string[];
  lastAnalysis: string;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string; // e.g., "10-12" or "Max"
  weight?: string;
  duration?: number; // seconds
  distance?: number; // km
  notes?: string;
}

export interface WorkoutSection {
  title: string;
  exercises: Exercise[];
}

export interface DailyMission {
  id: string;
  title: string;
  date: string;
  warmUp: WorkoutSection;
  coreWorkout: WorkoutSection;
  cardio?: WorkoutSection;
  cooldown: WorkoutSection;
  recovery: string[];
  status: QuestStatus;
  nutritionPlan?: {
    targetCalories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatsGrams: number;
    hydrationTargetMl: number;
  };
  xp_reward: number;
  difficulty: Difficulty;
  isLazyMode?: boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  realm: Realm;
  xp_reward: number;
  difficulty: Difficulty;
  duration_est_min: number;
  status: QuestStatus;
  deadline?: string;
  penalty?: {
      type: 'xp';
      amount: number;
  };
  isMystery?: boolean;
  source?: 'google_calendar' | 'user' | 'ai_coach';
}

export interface Skill {
  id: string;
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  realm: Realm;
  priority: number; // 1 to 5
  isActive: boolean;
  xpScale: number;
}

export interface FitnessGoal {
  id: string;
  title: string;
  description: string;
  type: FitnessGoalType;
  deadline: string;
  xp_reward: number;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  status: 'pending' | 'completed';
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    isGenerated?: boolean;
}

export interface ActiveTimedQuest {
  title: string;
  realm: Realm;
  estimatedMinutes: number;
  startTime: string;
}

export interface ActiveBuff {
  itemId: string;
  itemName: string;
  expiryTimestamp: number;
  effect: {
    type: string;
    value?: number;
  };
}

export interface User {
  uid: string;
  id: string;
  name: string;
  rank: string;
  level_overall: number;
  xp_total: number;
  xpToNextLevel: number;
  stat_points: number;
  stats: {
    [key in Realm]: number;
  };
  skill_tree: { [skill_id: string]: Skill };
  streaks: {
    daily_streak: number;
    lastQuestCompletionDate?: string | null;
    lastStepGoalDate?: string | null;
  };
  bodyMetrics: BodyMetrics;
  medicalRecord?: MedicalRecord;
  primaryGoal: FitnessGoalType;
  secondaryGoal?: FitnessGoalType;
  personalRecords: { [exercise: string]: string };
  completedGoals: FitnessGoal[];
  activeTimedQuest?: ActiveTimedQuest | null;
  activeBuffs: ActiveBuff[];
  isHomeMode: boolean;
  isLazyMode: boolean;
  isTravelMode: boolean;
  isInjuryMode: boolean;
  personality: AiPersonality;
  userState?: UserState;
  checkInHistory: WeeklyCheckIn[];
  lastCheckInDate?: string;
  lastWeeklyCheckIn?: string;
  waterIntakeGoal_ml: number;
  dailyStepGoal: number;
  dailyCalorieGoal?: number;
  combatStats: { wins: number; losses: number; draws: number };
  unlockedBadges: string[];
  completedMajorGoals: any[];
  habits?: Habit[];
  supplementProtocol?: { name: string; dosage: string }[];
  missionHistory: { date: string, status: 'completed' | 'failed' }[];
  currentSteps: number;
  currentDistance: number;
  lastStepSync?: string;
  lastPenaltyDate?: string; // Format: YYYY-MM-DD
  lastGenesisDate?: string; // Format: YYYY-MM-DD
  aiUsage: {
    mealScans: number;
    formScans: number;
    chatPrompts: number;
    lastUsageReset: string;
    scannedImageHashes: string[];
  };
  onboardingCompleted?: boolean;
  avatarUrl?: string;
  guildId?: string;
}


export interface JournalEntry {
  id: string;
  timestamp: string;
  majorGoalTitle: string;
  reflectionText: string;
  generatedChecklistQuestIds: string[];
}

export interface RewardNotification {
  id: string;
  type: 'xp' | 'cr';
  originalAmount: number;
  finalAmount: number;
}


export interface StoryLogEntry {
  id: string;
  date: string;
  title: string;
  narrative: string;
}

export interface SystemMessage {
    id: string;
    text: string;
    timestamp: string;
    type: 'info' | 'warning' | 'system' | 'reward';
}

export interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: string;
    imageUrl?: string;
}

export interface Territory {
    id: string;
    ownerId: string;
    ownerName: string;
    polygon: Coordinate[];
    area: number;
    capturedAt: string;
    lastDefendedAt: string;
    defenseStreak: number;
    centerPoint: [number, number];
    activityMode?: ActivityMode;
    color?: string;
}

export interface Trail {
    id: string;
    userId: string;
    points: Coordinate[];
    startTime: string;
    endTime: string | null;
    status: 'active' | 'completed' | 'abandoned';
    activityMode?: ActivityMode;
    totalDistance?: number;
    avgSpeed?: number;
    maxSpeed?: number;
    isCheater?: boolean;
}

export interface WeeklyProgress {
    day: string;
    xp: number;
}

export interface ActivityData {
    date: string;
    skillId: string;
    xp: number;
    reps?: number;
    duration_min?: number;
}

export interface NutritionLog {
  id: string;
  date: string;
  calories: number;
  protein: number;
  carbs?: number;
  fats?: number;
  hydration_ml: number;
  mealType?: string;
  meals: { name: string; calories: number; protein: number }[];
}

export interface RecoveryLog {
  id: string;
  date: string;
  sleepHours: number;
  sleepQuality: number; // 1-10
  soreness: number; // 1-10
  fatigue: number; // 1-10
  stress?: number; // 1-10, optional — sourced from bodyMetrics.stressLevel
}

export interface WeeklyCheckIn {
  id: string;
  date: string;
  weight: number;
  bodyFatEstimate?: number;
  workoutDifficulty: 'Too Easy' | 'Just Right' | 'Too Hard';
  sorenessLevel: number; // 1-10
  injuryUpdates: string;
  sleepQuality: number; // 1-10
  dietConsistency: number; // 1-10
  motivationLevel: number; // 1-10
  scheduleChanges: string;
  gymAvailabilityChanges: string;
  goalsChanged: boolean;
  newGoals?: FitnessGoalType;
  progressPhotos?: string[]; // URLs or Base64
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

export interface Integration {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  type: 'google_calendar' | 'firebase' | 'other';
}

export enum UserBodyState {
  SeverelyOverweight = "Severely Overweight",
  Overweight = "Overweight",
  SkinnyFat = "Skinny Fat",
  Underweight = "Underweight / Skinny",
  Athletic = "Athletic",
  AdvancedAthlete = "Advanced Athlete",
  Injured = "Injured",
  BurnedOut = "Burned Out / Overtrained",
  Beginner = "Beginner",
}

export interface UserState {
  coreMission: string;
  longTermGoals: string;
  shortTermGoals: string;
  transformationProtocol: string;
  sideQuests: string;
  bodyState: UserBodyState;
  recoveryScore: number;
  aiAdaptationProfile: AiAdaptationProfile;
  behavioralPatterns: AiBehavioralPatterns;
}

export interface Arc {
  id: string;
  title: string;
  description: string;
  effects: string[];
  isGenerated?: boolean;
}

export interface Guild {
    id: string;
    name: string;
    description: string;
    members: string[]; // User IDs
    leaderId: string;
    level: number;
    xp: number;
    territories: string[]; // Territory IDs
    type: 'Competitive' | 'Casual' | 'Hardcore';
    minLevel: number;
    createdAt: string;
    totalSteps: number;
    memberSteps: Record<string, number>;
    xpEarnedToday: number;
    lastStepSync?: string;
}

export interface PvPMatch {
    id: string;
    player1Id: string;
    player2Id: string;
    winnerId: string | null;
    status: 'pending' | 'active' | 'completed';
    startTime: string;
    endTime?: string;
    score: { p1: number; p2: number };
}