/**
 * Data utilities — export user data + secure key-value storage.
 */
import { Preferences } from '@capacitor/preferences';
import { db } from '../db/database';
import { useUserStore } from '../store/useUserStore';
import { useQuestStore } from '../store/useQuestStore';
import { useUiStore } from '../store/useUiStore';

// ---- Secure KV Storage (used by useAuthStore) ----
export const secureStorage = {
  async get(key: string): Promise<string | null> {
    const { value } = await Preferences.get({ key });
    return value;
  },
  async set(key: string, value: string): Promise<void> {
    await Preferences.set({ key, value });
  },
  async remove(key: string): Promise<void> {
    await Preferences.remove({ key });
  },
  async clear(): Promise<void> {
    await Preferences.clear();
  }
};

// ---- Data Export (gives users full control of their data) ----
export async function exportAllUserData(): Promise<{ json: string; blob: Blob; filename: string }> {
  const userState = useUserStore.getState().user;
  const questState = {
    quests: useQuestStore.getState().quests,
    fitnessGoals: useQuestStore.getState().fitnessGoals,
    dailyMission: useQuestStore.getState().dailyMission,
    weeklyQuests: useQuestStore.getState().weeklyQuests,
  };
  const uiState = {
    view: useUiStore.getState().view,
    themeMode: useUiStore.getState().themeMode,
  };

  // Gather all Dexie tables
  const dexieData: Record<string, unknown[]> = {};
  for (const table of db.tables) {
    dexieData[table.name] = await table.toArray();
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    appVersion: '3.1.0',
    user: userState,
    quests: questState,
    ui: uiState,
    dexie: dexieData,
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const filename = `voidfit-export-${new Date().toISOString().split('T')[0]}.json`;

  return { json, blob, filename };
}

export function downloadAsFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Clear ALL local data (user, quests, Dexie) */
export async function resetAllData(): Promise<void> {
  const tables = db.tables.map(t => t.name);
  for (const name of tables) {
    await db.table(name).clear();
  }
  useUserStore.getState().setUser(() => useUserStore.getState().user); // triggers persist reset
  useQuestStore.persist.clearStorage();
  useUiStore.persist.clearStorage();
  await Preferences.clear();
}
