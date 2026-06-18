import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Every view that exists as a route in AppRouter.tsx */
export type View = 
  | 'dashboard' | 'skill_tree' | 'chatbot' | 'system_log' | 'analytics'
  | 'story_log' | 'badges' | 'journal' | 'timer' | 'system_mechanics'
  | 'progress_history' | 'menu' | 'medical' | 'habits' | 'psych'
  | 'brain_vault' | 'growth' | 'evolution' | 'bodyscan'
  | 'physiqueroadmap' | 'progress' | 'bodydiagnostics' | 'map'
  | 'territory' | 'leaderboard' | 'guild' | 'challenges' | 'pvp'
  | 'workout' | 'nutrition' | 'profile' | 'help' | 'settings' | 'diagnostics'
  | 'nutrition_page' | 'weight_page' | 'steps_page' | 'streak_page';

interface UiStoreState {
    view: View;
    setView: (view: View) => void;
    themeMode: 'dark' | 'light';
    setThemeMode: (mode: 'dark' | 'light') => void;
    error: string | null;
    setError: (error: string | null) => void;
    isOnboardingComplete: boolean;
    completeOnboarding: () => void;
    isActionHubOpen: boolean;
    setActionHubOpen: (isOpen: boolean) => void;
    isVisionOpen: boolean;
    setVisionOpen: (isOpen: boolean, type?: 'meal' | 'form') => void;
    visionType: 'meal' | 'form';
    isWaterOpen: boolean;
    setWaterOpen: (isOpen: boolean) => void;
    isVoiceOpen: boolean;
    setVoiceOpen: (isOpen: boolean) => void;
    isLevelUpOpen: boolean;
    levelUpData: { level: number, rank: string } | null;
    setLevelUp: (level: number, rank: string) => void;
    closeLevelUp: () => void;
}

export const useUiStore = create<UiStoreState>()(
    persist(
        (set) => ({
            view: 'dashboard',
            setView: (view) => set({ view }),
            themeMode: 'dark',
            setThemeMode: (themeMode) => set({ themeMode }),
            error: null,
            setError: (error) => set({ error }),
            isOnboardingComplete: false,
            completeOnboarding: () => set({ isOnboardingComplete: true }),
            isActionHubOpen: false,
            setActionHubOpen: (isActionHubOpen) => set({ isActionHubOpen }),
            isVisionOpen: false,
            visionType: 'meal',
            setVisionOpen: (isVisionOpen, visionType) => set((state) => ({ 
                isVisionOpen, 
                visionType: visionType || state.visionType 
            })),
            isWaterOpen: false,
            setWaterOpen: (isWaterOpen) => set({ isWaterOpen }),
            isVoiceOpen: false,
            setVoiceOpen: (isVoiceOpen) => set({ isVoiceOpen }),
            isLevelUpOpen: false,
            levelUpData: null,
            setLevelUp: (level, rank) => set({ isLevelUpOpen: true, levelUpData: { level, rank } }),
            closeLevelUp: () => set({ isLevelUpOpen: false }),
        }),
        {
            name: 'ui-storage',
            partialize: (state) => {
                const { view, ...rest } = state;
                return rest;
            },
        }
    )
);

