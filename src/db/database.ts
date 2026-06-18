import Dexie, { type EntityTable } from 'dexie';
import { 
  ChatMessage, StoryLogEntry, SystemMessage, ActivityData, NutritionLog, RecoveryLog, 
  DailyMission, FitnessGoal, WeeklyCheckIn, LabReport, BodyPhoto, MoodLog, HabitLog, 
  SupplementLog, ExpenseLog, PostureLog, Territory, Trail, Guild, PvPMatch 
} from '../../types';
import { ProgressJournalEntry } from '../types/app';

interface DexieChatMessage extends ChatMessage { id: string; }
interface DexieStoryLogEntry extends StoryLogEntry { id: string; }
interface DexieSystemMessage extends SystemMessage { id: string; }
interface DexieActivityData extends ActivityData { id?: number; }
interface DexieNutritionLog extends NutritionLog { id: string; }
interface DexieRecoveryLog extends RecoveryLog { id: string; }
interface DexieDailyMission extends DailyMission { id: string; }
interface DexieFitnessGoal extends FitnessGoal { id: string; }
interface DexieCheckInLog extends WeeklyCheckIn { id: string; }

interface DexieMemoryEntry { id: string; date: string; category: string; content: string; metadata?: Record<string, unknown>; }
interface DexieJournalEntry extends ProgressJournalEntry { id: string; }

const db = new Dexie('LevelUpDatabase') as Dexie & {
  chatLogs: EntityTable<DexieChatMessage, 'id'>;
  storyLogs: EntityTable<DexieStoryLogEntry, 'id'>;
  systemMessages: EntityTable<DexieSystemMessage, 'id'>;
  activityLogs: EntityTable<DexieActivityData, 'id'>;
  nutritionLogs: EntityTable<DexieNutritionLog, 'id'>;
  recoveryLogs: EntityTable<DexieRecoveryLog, 'id'>;
  dailyMissions: EntityTable<DexieDailyMission, 'id'>;
  fitnessGoals: EntityTable<DexieFitnessGoal, 'id'>;
  checkInLogs: EntityTable<DexieCheckInLog, 'id'>;
  labReports: EntityTable<LabReport, 'id'>;
  bodyPhotos: EntityTable<BodyPhoto, 'id'>;
  moodLogs: EntityTable<MoodLog, 'id'>;
  habitLogs: EntityTable<HabitLog, 'id'>;
  supplementLogs: EntityTable<SupplementLog, 'id'>;
  expenseLogs: EntityTable<ExpenseLog, 'id'>;
  postureLogs: EntityTable<PostureLog, 'id'>;
  memoryVault: EntityTable<DexieMemoryEntry, 'id'>;
  waterLogs: EntityTable<{ id: string; date: string; amount_ml: number }, 'id'>;
  journalEntries: EntityTable<DexieJournalEntry, 'id'>;
  territories: EntityTable<Territory, 'id'>;
  trails: EntityTable<Trail, 'id'>;
  guilds: EntityTable<Guild, 'id'>;
  pvpMatches: EntityTable<PvPMatch, 'id'>;
};

db.version(8).stores({
  chatLogs: 'id, timestamp, sender',
  storyLogs: 'id, date',
  systemMessages: 'id, timestamp, type',
  activityLogs: '++id, date, skillId',
  nutritionLogs: 'id, date',
  recoveryLogs: 'id, date',
  dailyMissions: 'id, date, status',
  fitnessGoals: 'id, deadline, type',
  checkInLogs: 'id, date',
  labReports: 'id, date',
  bodyPhotos: 'id, date, type',
  moodLogs: 'id, date',
  habitLogs: 'id, date, habitId',
  supplementLogs: 'id, date, name',
  expenseLogs: 'id, date, category',
  postureLogs: 'id, date',
  memoryVault: 'id, date, category',
  waterLogs: 'id, date',
  journalEntries: 'id, timestamp, type',
  territories: 'id, ownerId, capturedAt',
  trails: 'id, userId, status',
  guilds: 'id, name, leaderId',
  pvpMatches: 'id, player1Id, player2Id, winnerId, startTime'
});

// Explicitly open the database and handle errors
db.open().catch(err => {
  console.error('[VoidFit] Database failed to open:', err.stack || err);
  // If the error is a version conflict, we may need to force a reset in dev mode
  if (err.name === 'VersionError' || err.name === 'SchemaError') {
    console.warn('[VoidFit] Schema mismatch detected. Resetting database...');
    db.delete().then(() => window.location.reload()).catch(err => console.error('[VoidFit] Failed to delete database:', err));
  }
});

export { db };

