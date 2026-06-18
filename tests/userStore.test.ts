import { describe, expect, it, beforeEach } from 'vitest';
import { Realm, AiPersonality, FitnessGoalType, User } from '../types';
import { useUserStore } from '../src/store/useUserStore';

const INITIAL_USER_STATE: User = {
  uid: '0000000000',
  id: 'test-user',
  name: 'Athlete',
  rank: 'Recruit',
  level_overall: 1,
  xp_total: 0,
  xpToNextLevel: 1000,
  stat_points: 0,
  stats: {
    [Realm.Strength]: 10,
    [Realm.Endurance]: 10,
    [Realm.Flexibility]: 10,
    [Realm.Combat]: 10,
    [Realm.Nutrition]: 10,
    [Realm.Recovery]: 10,
  },
  skill_tree: {},
  streaks: { daily_streak: 0 },
  bodyMetrics: {
    currentWeight: 80,
    targetWeight: 75,
    height: 180,
    age: 25,
    gender: 'Male' as const,
    experienceLevel: 'Beginner' as const,
    injuries: [],
    equipment: [],
    availableTimeMinutes: 60,
    gymAccess: true,
    stamina: 5,
    flexibility: 5,
    sleepSchedule: '11PM-7AM',
    stressLevel: 5,
    foodPreferences: [],
    allergies: [],
    dailySchedule: '',
    pushupsMax: 0,
    pullupsMax: 0,
    runningAbility: 'Beginner',
    strengthLevel: 5,
  },
  primaryGoal: FitnessGoalType.GeneralFitness,
  personalRecords: {},
  completedGoals: [],
  activeTimedQuest: null,
  activeBuffs: [],
  isHomeMode: false,
  isLazyMode: false,
  isTravelMode: false,
  isInjuryMode: false,
  personality: AiPersonality.Disciplined,
  checkInHistory: [],
  waterIntakeGoal_ml: 2000,
  dailyStepGoal: 10000,
  unlockedBadges: [],
  completedMajorGoals: [],
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
  combatStats: { wins: 0, losses: 0, draws: 0 }
};

describe('User Store Actions', () => {
  beforeEach(() => {
    // Reset store to initial state
    useUserStore.setState({ user: INITIAL_USER_STATE });
  });

  it('should correctly handle XP rewards without buffs', () => {
    const { handleGrantReward } = useUserStore.getState();
    const initialXp = useUserStore.getState().user.xp_total;
    const initialStrength = useUserStore.getState().user.stats[Realm.Strength];
    
    handleGrantReward(100, Realm.Strength, 'Test');
    
    expect(useUserStore.getState().user.xp_total).toBe(initialXp + 100);
    expect(useUserStore.getState().user.stats[Realm.Strength]).toBe(initialStrength + 1);
  });

  it('should correctly handle XP rewards with active buffs', () => {
    const { handleGrantReward } = useUserStore.getState();
    const initialXp = useUserStore.getState().user.xp_total;
    
    // Add a 2x buff
    useUserStore.setState((state) => ({
      user: {
        ...state.user,
        activeBuffs: [{
          itemId: 'test-buff',
          itemName: 'Double XP',
          expiryTimestamp: Date.now() + 10000,
          effect: { type: 'xp_boost', value: 2 }
        }]
      }
    }));
    
    handleGrantReward(100, Realm.Strength, 'Test');
    
    // 100 * 2 = 200
    expect(useUserStore.getState().user.xp_total).toBe(initialXp + 200);
  });
});
