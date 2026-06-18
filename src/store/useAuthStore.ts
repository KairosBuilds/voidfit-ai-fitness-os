import { create } from 'zustand';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';
import { Integration, SyncStatus } from '../../types';
import { INITIAL_INTEGRATIONS } from '../../constants';
import { Preferences } from '@capacitor/preferences';

export type AiProvider = 'gemini' | 'openai' | 'anthropic';

// Secure Capacitor Storage Wrapper
const capacitorStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const { value } = await Preferences.get({ key: name });
    return value;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await Preferences.set({ key: name, value });
  },
  removeItem: async (name: string): Promise<void> => {
    await Preferences.remove({ key: name });
  },
};

interface AuthStoreState {
    apiKey: string; // Legacy support
    apiKeys: { [key in AiProvider]?: string };
    selectedProvider: AiProvider;
    integrations: Integration[];
    syncStatus: SyncStatus;
    quotaExceeded: boolean;
    setApiKey: (key: string, provider?: AiProvider) => void;
    setSelectedProvider: (provider: AiProvider) => void;
    setIntegrations: (integrations: Integration[] | ((prev: Integration[]) => Integration[])) => void;
    setSyncStatus: (status: SyncStatus) => void;
    setQuotaExceeded: (exceeded: boolean) => void;
}

export const useAuthStore = create<AuthStoreState>()(
    persist(
        (set) => ({
            apiKey: '',
            apiKeys: { gemini: '', openai: '', anthropic: '' },
            selectedProvider: 'gemini',
            integrations: INITIAL_INTEGRATIONS,
            syncStatus: 'idle',
            quotaExceeded: false,
            setApiKey: (key, provider = 'gemini') => set((state) => ({ 
                apiKeys: { ...state.apiKeys, [provider]: key },
                apiKey: provider === 'gemini' ? key : state.apiKey // maintain legacy for now
            })),
            setSelectedProvider: (provider) => set({ selectedProvider: provider }),
            setIntegrations: (integrations) => set((state) => ({ integrations: typeof integrations === 'function' ? integrations(state.integrations) : integrations })),
            setSyncStatus: (status) => set({ syncStatus: status }),
            setQuotaExceeded: (exceeded) => set({ quotaExceeded: exceeded }),
        }),
        {
            name: 'auth-storage-secure',
            storage: createJSONStorage(() => capacitorStorage),
        }
    )
);

