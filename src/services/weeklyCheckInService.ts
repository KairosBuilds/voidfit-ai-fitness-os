import { User, WeeklyCheckIn } from '../../types';
import { recalibrateFitnessPlan } from '../../services/geminiService';

/**
 * Persist check-in, stamp lastWeeklyCheckIn, and optionally run AI body-metric recalibration.
 */
export async function finalizeWeeklyCheckIn(params: {
  data: WeeklyCheckIn;
  apiKey: string | undefined;
  user: User | null | undefined;
  addCheckInLog: (log: WeeklyCheckIn) => Promise<void>;
  setUser: (fn: (prev: User) => User) => void;
}): Promise<{ systemMessage?: string }> {
  const { data, apiKey, user, addCheckInLog, setUser } = params;

  await addCheckInLog(data);
  const stamp = new Date().toISOString();
  setUser(prev => ({ ...prev, lastWeeklyCheckIn: stamp }));

  if (!apiKey || !user) {
    return {};
  }

  try {
    const { updatedMetrics, systemMessage } = await recalibrateFitnessPlan(apiKey, user, data);
    setUser(prev => ({
      ...prev,
      bodyMetrics: { ...prev.bodyMetrics, ...updatedMetrics },
    }));
    return { systemMessage };
  } catch {
    return {};
  }
}
