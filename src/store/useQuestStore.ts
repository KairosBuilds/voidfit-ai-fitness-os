import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Quest, FitnessGoal, DailyMission, QuestStatus } from '../../types';
import { INITIAL_QUESTS, createInitialFitnessGoals, INITIAL_WEEKLY_QUESTS } from '../../constants';

interface QuestStoreState {
    quests: Quest[];
    fitnessGoals: FitnessGoal[];
    dailyMission: DailyMission | null;
    weeklyQuests: Quest[];
    setQuests: (quests: Quest[] | ((prev: Quest[]) => Quest[])) => void;
    setFitnessGoals: (goals: FitnessGoal[] | ((prev: FitnessGoal[]) => FitnessGoal[])) => void;
    setDailyMission: (mission: DailyMission | null) => void;
    addQuest: (quest: Quest) => void;
    removeQuest: (id: string) => void;
    addFitnessGoal: (goal: FitnessGoal) => void;
    removeFitnessGoal: (id: string) => void;
    completeFitnessGoal: (id: string) => void;
    updateMissionStatus: (status: QuestStatus) => void;
    updateDailyMission: (mission: Partial<DailyMission>) => void;
    setWeeklyQuests: (quests: Quest[]) => void;
    addWeeklyQuest: (quest: Quest) => void;
    completeWeeklyQuest: (id: string) => void;
}

const getInitialWeeklyQuests = (): Quest[] => {
    try {
        const stored = typeof window !== 'undefined'
            ? window.localStorage.getItem('quest-storage')
            : null;
        if (stored) {
            const parsed = JSON.parse(stored);
            return parsed?.state?.weeklyQuests ?? INITIAL_WEEKLY_QUESTS;
        }
    } catch {
        // Fall back to defaults when localStorage is empty/corrupted.
    }
    return INITIAL_WEEKLY_QUESTS;
};

export const useQuestStore = create<QuestStoreState>()(
    persist(
        (set) => ({
            quests: INITIAL_QUESTS,
            fitnessGoals: createInitialFitnessGoals(),
            dailyMission: null,
            weeklyQuests: getInitialWeeklyQuests(),
            setQuests: (quests) => set((state) => ({ quests: typeof quests === 'function' ? quests(state.quests) : quests })),
            setFitnessGoals: (goals) => set((state) => ({ fitnessGoals: typeof goals === 'function' ? goals(state.fitnessGoals) : goals })),
            setDailyMission: (mission) => set({ dailyMission: mission }),
            addQuest: (quest) => set((state) => ({ quests: [quest, ...state.quests] })),
            removeQuest: (id) => set((state) => ({ quests: state.quests.filter(q => q.id !== id) })),
            addFitnessGoal: (goal) => set((state) => ({ fitnessGoals: [...state.fitnessGoals, goal] })),
            removeFitnessGoal: (id) => set((state) => ({ fitnessGoals: state.fitnessGoals.filter(g => g.id !== id) })),
            completeFitnessGoal: (id) => set((state) => ({ fitnessGoals: state.fitnessGoals.filter(g => g.id !== id) })),
            updateMissionStatus: (status) => set((state) => ({
                dailyMission: state.dailyMission ? { ...state.dailyMission, status } : null
            })),
            updateDailyMission: (mission) => set((state) => ({
                dailyMission: state.dailyMission ? { ...state.dailyMission, ...mission } : null
            })),
            setWeeklyQuests: (quests) => set({ weeklyQuests: quests }),
            addWeeklyQuest: (quest) => set((state) => ({ weeklyQuests: [quest, ...state.weeklyQuests] })),
            completeWeeklyQuest: (id) => set((state) => ({ 
                weeklyQuests: state.weeklyQuests.filter(q => q.id !== id) 
            })),
        }),
        {
            name: 'quest-storage',
        }
    )
);

