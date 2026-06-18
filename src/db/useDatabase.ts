import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './database';
import { 
  ChatMessage, StoryLogEntry, SystemMessage, ActivityData, NutritionLog, RecoveryLog, 
  DailyMission, FitnessGoal, WeeklyCheckIn, LabReport, BodyPhoto, MoodLog, HabitLog, 
  SupplementLog, ExpenseLog, PostureLog, Territory, Trail, Guild, PvPMatch 
} from '../../types';
import { ProgressJournalEntry } from '../types/app';

// --- GRANULAR HOOKS ---

export const useChatLogs = () => {
  const chatHistory = useLiveQuery(() => db.chatLogs.orderBy('timestamp').toArray()) || [];
  const addChatMessage = async (msg: ChatMessage) => { await db.chatLogs.put({ ...msg, id: msg.id || `chat-${Date.now()}` }); };
  const clearChatHistory = async () => { await db.chatLogs.clear(); };
  return { chatHistory, addChatMessage, clearChatHistory };
};

export const useNutritionLogs = () => {
  const nutritionLogs = useLiveQuery(() => db.nutritionLogs.orderBy('date').reverse().toArray()) || [];
  const waterLogs = useLiveQuery(() => db.waterLogs.orderBy('date').reverse().toArray()) || [];
  const addNutritionLog = async (log: NutritionLog) => { await db.nutritionLogs.put(log); };
  const addWaterLog = async (log: { id: string; date: string; amount_ml: number }) => { await db.waterLogs.put(log); };
  return { nutritionLogs, waterLogs, addNutritionLog, addWaterLog };
};

export const useActivityLogs = () => {
  const activityLog = useLiveQuery(() => db.activityLogs.orderBy('date').toArray()) || [];
  const dailyMissions = useLiveQuery(() => db.dailyMissions.orderBy('date').reverse().toArray()) || [];
  const habitLogs = useLiveQuery(() => db.habitLogs.orderBy('date').reverse().toArray()) || [];
  const addActivityData = async (data: ActivityData) => { await db.activityLogs.add(data); };
  const addDailyMission = async (mission: DailyMission) => { await db.dailyMissions.put(mission); };
  const addHabitLog = async (log: HabitLog) => { await db.habitLogs.put(log); };
  return { activityLog, dailyMissions, habitLogs, addActivityData, addDailyMission, addHabitLog };
};

export const useRecoveryLogs = () => {
  const recoveryLogs = useLiveQuery(() => db.recoveryLogs.orderBy('date').reverse().toArray()) || [];
  const supplementLogs = useLiveQuery(() => db.supplementLogs.orderBy('date').reverse().toArray()) || [];
  const addRecoveryLog = async (log: RecoveryLog) => { await db.recoveryLogs.put(log); };
  const addSupplementLog = async (log: SupplementLog) => { await db.supplementLogs.put(log); };
  return { recoveryLogs, supplementLogs, addRecoveryLog, addSupplementLog };
};

export const useMedicalLogs = () => {
  const labReports = useLiveQuery(() => db.labReports.orderBy('date').reverse().toArray()) || [];
  const checkInLogs = useLiveQuery(() => db.checkInLogs.orderBy('date').reverse().toArray()) || [];
  const bodyPhotos = useLiveQuery(() => db.bodyPhotos.orderBy('date').reverse().toArray()) || [];
  const addLabReport = async (report: LabReport) => { await db.labReports.put(report); };
  const addCheckInLog = async (log: WeeklyCheckIn) => { await db.checkInLogs.put(log); };
  const addBodyPhoto = async (photo: BodyPhoto) => { await db.bodyPhotos.put(photo); };
  const deleteBodyPhoto = async (id: string) => { await db.bodyPhotos.delete(id); };
  return { labReports, checkInLogs, bodyPhotos, addLabReport, addCheckInLog, addBodyPhoto, deleteBodyPhoto };
};

export const useSystemLogs = () => {
  const systemMessages = useLiveQuery(() => db.systemMessages.orderBy('timestamp').reverse().toArray()) || [];
  const storyLog = useLiveQuery(() => db.storyLogs.orderBy('date').toArray()) || [];
  const addSystemMessage = async (msg: SystemMessage) => { await db.systemMessages.put({ ...msg, id: msg.id || `sys-${Date.now()}` }); };
  const addStoryLog = async (entry: StoryLogEntry) => { await db.storyLogs.put({ ...entry, id: entry.id || `story-${Date.now()}` }); };
  return { systemMessages, storyLog, addSystemMessage, addStoryLog };
};

export const useMultiplayer = () => {
  const guilds = useLiveQuery(() => db.guilds.toArray()) || [];
  const pvpMatches = useLiveQuery(() => db.pvpMatches.orderBy('startTime').reverse().toArray()) || [];
  const addGuild = async (guild: Guild) => { await db.guilds.put(guild); };
  const joinGuild = async (guildId: string, userId: string) => {
    const guild = await db.guilds.get(guildId);
    if (guild && !guild.members.includes(userId)) {
      await db.guilds.update(guildId, { members: [...guild.members, userId] });
    }
  };
  const leaveGuild = async (guildId: string, userId: string) => {
    const guild = await db.guilds.get(guildId);
    if (!guild) return;
    const updated = guild.members.filter(m => m !== userId);
    const memberSteps = guild.memberSteps || {};
    const { [userId]: _, ...remainingSteps } = memberSteps;
    if (updated.length === 0) {
      await db.guilds.delete(guildId);
    } else {
      const newLeader = guild.leaderId === userId ? updated[0] : guild.leaderId;
      await db.guilds.update(guildId, { members: updated, memberSteps: remainingSteps, leaderId: newLeader });
    }
  };
  const getGuild = async (id: string) => db.guilds.get(id);
  const addPvPMatch = async (match: PvPMatch) => { await db.pvpMatches.put(match); };
  return { guilds, pvpMatches, addGuild, joinGuild, leaveGuild, getGuild, addPvPMatch };
};

// --- COMPOSITE HOOK (Legacy Support) ---

export const useDatabase = () => {
  const chat = useChatLogs();
  const nutrition = useNutritionLogs();
  const activity = useActivityLogs();
  const recovery = useRecoveryLogs();
  const medical = useMedicalLogs();
  const system = useSystemLogs();
  const multiplayer = useMultiplayer();

  const fitnessGoals = useLiveQuery(() => db.fitnessGoals.orderBy('deadline').toArray()) || [];
  const expenseLogs = useLiveQuery(() => db.expenseLogs.orderBy('date').reverse().toArray()) || [];
  const postureLogs = useLiveQuery(() => db.postureLogs.orderBy('date').reverse().toArray()) || [];
  const memoryVault = useLiveQuery(() => db.memoryVault.orderBy('date').reverse().toArray()) || [];
  const journalEntries = useLiveQuery(() => db.journalEntries?.orderBy('timestamp').reverse().toArray()) || [];
  const territories = useLiveQuery(() => db.territories?.toArray()) || [];
  const trails = useLiveQuery(() => db.trails?.toArray()) || [];

  return {
    ...chat, ...nutrition, ...activity, ...recovery, ...medical, ...system, ...multiplayer,
    chatHistory: chat.chatHistory,
    fitnessGoals, expenseLogs, postureLogs, memoryVault, journalEntries, territories, trails,
    moodLogs: useLiveQuery(() => db.moodLogs.orderBy('date').reverse().toArray()) || [],
    addFitnessGoal: async (goal: FitnessGoal) => { await db.fitnessGoals.put(goal); },
    addExpenseLog: async (log: ExpenseLog) => { await db.expenseLogs.put(log); },
    addPostureLog: async (log: PostureLog) => { await db.postureLogs.put(log); },
    addMoodLog: async (log: MoodLog) => { await db.moodLogs.put(log); },
    addMemoryEntry: async (entry: Record<string, unknown>) => { await db.memoryVault.put(entry as any); },
    addJournalEntry: async (entry: ProgressJournalEntry) => { await db.journalEntries.put({ ...entry, id: entry.id || `journal-${Date.now()}` }); },
    addTerritory: async (t: Territory) => { await db.territories.put(t); },
    addTrail: async (trail: Trail) => { await db.trails.put(trail); },
    clearAllData: async () => {
      const tables = [
        db.chatLogs, db.storyLogs, db.systemMessages, db.activityLogs, db.nutritionLogs,
        db.recoveryLogs, db.dailyMissions, db.fitnessGoals, db.checkInLogs, db.labReports,
        db.bodyPhotos, db.moodLogs, db.habitLogs, db.supplementLogs, db.expenseLogs,
        db.postureLogs, db.memoryVault, db.waterLogs
      ];
      await Promise.all(tables.map(t => t.clear()));
    },
    restoreData: async (data: Record<string, unknown[]>) => {
      await db.transaction('rw', db.tables, async () => {
        for (const [tableName, records] of Object.entries(data)) {
          const table = db.table(tableName);
          if (!table || !Array.isArray(records)) {
            continue;
          }

          await table.clear();
          if (records.length > 0) {
            await table.bulkPut(records as any[]);
          }
        }
      });
    }
  };
};


