import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Flame, Footprints, Plus, Sparkles,
  Trophy, ChevronRight, Map, ClipboardCheck
} from 'lucide-react';

import { Quest, DailyMission, FitnessGoal, User, QuestStatus, Realm, WeeklyCheckIn } from '../types';
import QuestCard from './QuestCard';
import ActiveBuffs from './ActiveBuffs';
import AddQuestModal from './AddQuestModal';
import LogNutritionModal from './LogNutritionModal';
import LogRecoveryModal from './LogRecoveryModal';
import WeeklyCheckInModal from './WeeklyCheckInModal';

import { useStepCounter } from '../src/services/stepService';
import { useUserStore } from '../src/store/useUserStore';
import { useQuestStore } from '../src/store/useQuestStore';
import { useUiStore } from '../src/store/useUiStore';
import { useAuthStore } from '../src/store/useAuthStore';
import { useDatabase } from '../src/db/useDatabase';
import { generateDailyMission } from '../services/geminiService';
import { useToastStore } from '../src/store/useToastStore';
import { finalizeWeeklyCheckIn } from '../src/services/weeklyCheckInService';
import { spiderweb } from '../src/services/AiSpiderwebService';

// Sub-components
import { StatCard } from './Dashboard/StatCard';
import { MissionCard } from './Dashboard/MissionCard';
import { QuickScanHUD } from './Dashboard/QuickScanHUD';
import MissionCeremony from './MissionCeremony';

interface DashboardProps {
  user?: User;
  quests?: Quest[];
  dailyMission?: DailyMission | null;
  fitnessGoals?: FitnessGoal[];
  onCompleteQuest?: (questId: string) => void;
  onCompleteMission?: () => void;
  onAddQuestClick?: () => void;
  onLogNutrition?: () => void;
  onLogRecovery?: () => void;
  onAddFitnessGoal?: () => void;
  onCompleteFitnessGoal?: (goal: FitnessGoal) => void;
  onOpenMealScanner?: () => void;
  onOpenFormAnalyzer?: () => void;
  onUpdateWater?: (amount: number) => void;
  currentWater?: number;
  onGenerateMission?: () => void;
  isGeneratingMission?: boolean;
  weeklyQuests?: Quest[];
  onCompleteWeeklyQuest?: (quest: Quest) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  user: propUser, quests: propQuests, dailyMission: propDailyMission, fitnessGoals: propFitnessGoals,
  onCompleteQuest: propOnCompleteQuest, onCompleteMission: propOnCompleteMission, onAddQuestClick: propOnAddQuestClick,
  onLogNutrition: propOnLogNutrition, onLogRecovery: propOnLogRecovery, onOpenMealScanner: propOnOpenMealScanner, 
  onOpenFormAnalyzer: propOnOpenFormAnalyzer, onGenerateMission: propOnGenerateMission, isGeneratingMission: propIsGeneratingMission,
  weeklyQuests: propWeeklyQuests, onCompleteWeeklyQuest: propOnCompleteWeeklyQuest
}) => {
  const storeUser = useUserStore(state => state.user);
  const { 
    quests: storeQuests, 
    dailyMission: storeDailyMission, 
    fitnessGoals: storeFitnessGoals, 
    weeklyQuests: storeWeeklyQuests,
    removeQuest,
    updateMissionStatus,
    completeFitnessGoal,
    completeWeeklyQuest
  } = useQuestStore();
  const { setView, setVisionOpen } = useUiStore();
  const apiKey = useAuthStore(state => state.apiKey);
  const setUserStore = useUserStore(state => state.setUser);
  const { addToast } = useToastStore();

  const [isAddQuestOpen, setIsAddQuestOpen] = React.useState(false);
  const [isNutritionOpen, setIsNutritionOpen] = React.useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = React.useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [showCeremony, setShowCeremony] = React.useState(false);

  const db = useDatabase();

  const user = propUser || storeUser;
  const quests = propQuests || storeQuests || [];
  const dailyMission = propDailyMission !== undefined ? propDailyMission : storeDailyMission;
  const weeklyQuests = propWeeklyQuests || storeWeeklyQuests || [];

  const onCompleteQuest = propOnCompleteQuest || ((id: string) => removeQuest(id));
  const onCompleteMission = propOnCompleteMission || (() => {
    // Access latest store state directly to avoid closure stale-ness
    const currentMission = useQuestStore.getState().dailyMission;
    
    if (currentMission && currentMission.status !== QuestStatus.Completed) {
      try {
        // 1. Grant XP reward
        useUserStore.getState().handleGrantReward(
          currentMission.xp_reward || 100, 
          Realm.Strength, 
          `Daily Mission: ${currentMission.title}`
        );

        // 2. Update status in store
        updateMissionStatus(QuestStatus.Completed);

        // 3. Spiderweb: notify all connected features
        spiderweb.emit({
          type: 'WORKOUT_COMPLETE',
          data: {
            missionTitle: currentMission.title,
            xpEarned: currentMission.xp_reward || 100,
            difficulty: currentMission.difficulty,
          },
        });

        // 4. Trigger UI Feedback
        addToast("Mission Accomplished! XP Granted.", "success");
        
        // 5. Fire Ceremony
        setShowCeremony(true);
      } catch (error) {
        console.error('[VoidFit] Mission completion failed:', error);
        addToast("Failed to finalize mission. Try again.", "error");
      }
    } else {
      console.warn('[VoidFit] Mission already completed or missing.');
    }
  });
  const onCompleteWeeklyQuest = propOnCompleteWeeklyQuest || ((quest: Quest) => {
    useUserStore.getState().handleGrantReward(
        quest.xp_reward,
        quest.realm,
        `Weekly Goal: ${quest.title}`
    );
    completeWeeklyQuest(quest.id);
  });

  const onAddQuestClick = propOnAddQuestClick || (() => setIsAddQuestOpen(true));
  const onLogNutrition = propOnLogNutrition || (() => setIsNutritionOpen(true));
  const onLogRecovery = propOnLogRecovery || (() => setIsRecoveryOpen(true));

  const { steps, isTracking, requestPermission } = useStepCounter();

  const onGenerateMission = propOnGenerateMission || (async () => {
    if (!apiKey) { setView('settings'); return; }
    setIsGenerating(true);
    try {
      const latestCheckIn = db.checkInLogs?.[0];
      const mission = await generateDailyMission(
        apiKey,
        user,
        user.missionHistory || [],
        db.nutritionLogs || [],
        db.recoveryLogs || [],
        db.habitLogs || [],
        db.supplementLogs || [],
        db.waterLogs || [],
        steps,
        latestCheckIn,
      );
      useQuestStore.getState().setDailyMission(mission);
    } catch (error) { console.error("AI Generation failed:", error); } finally { setIsGenerating(false); }
  });

  const isGeneratingMission = propIsGeneratingMission || isGenerating;

  const onOpenMealScanner = propOnOpenMealScanner || (() => setVisionOpen(true, 'meal'));
  const onOpenFormAnalyzer = propOnOpenFormAnalyzer || (() => setVisionOpen(true, 'form'));

  const todayStr = new Date().toISOString().split('T')[0];
  const consumedCalories = React.useMemo(() => {
    const logs = db.nutritionLogs || [];
    return logs
      .filter((l: any) => l.date?.startsWith(todayStr))
      .reduce((sum: number, l: any) => sum + (l.calories || 0), 0);
  }, [db.nutritionLogs, todayStr]);

  const calTarget = user.dailyCalorieGoal || dailyMission?.nutritionPlan?.targetCalories;

  const stepProgress = user.dailyStepGoal > 0 ? (steps / user.dailyStepGoal) * 100 : 0;
  const calProgress = calTarget && calTarget > 0 ? (consumedCalories / calTarget) * 100 : 0;

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const staggerItem = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <motion.div
      className="space-y-5 max-w-2xl mx-auto pb-28 pt-4 px-4 sm:px-6 relative z-10"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-4 gap-2.5"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={staggerItem}>
          <StatCard label="Calories" value={`${consumedCalories.toLocaleString()} / ${calTarget?.toLocaleString() || '—'}`} sub="consumed / target" icon={<Flame size={14} />} accent="#f59e0b" progress={calProgress} onClick={() => setView('nutrition_page')} />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatCard label="Weight" value={`${user.bodyMetrics.currentWeight}`} sub={`Target ${user.bodyMetrics.targetWeight}kg`} icon={<Activity size={14} />} accent="#10b981" onClick={() => setView('weight_page')} />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatCard label="Steps" value={`${steps.toLocaleString()} / ${user.dailyStepGoal.toLocaleString()}`} sub={`${Math.round(stepProgress)}% of goal`} icon={<Footprints size={14} />} accent="#6366f1" progress={stepProgress} ring onClick={() => setView('steps_page')}>
            {!isTracking && (
              <div onClick={(e) => { e.stopPropagation(); requestPermission(); }} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); requestPermission(); } }} className="absolute inset-0 z-10 bg-background/60 backdrop-blur-sm flex items-center justify-center rounded-[15px] cursor-pointer">
                <span className="px-3 py-1.5 rounded-lg bg-primary-action text-white text-[10px] font-bold">Link Sensors</span>
              </div>
            )}
          </StatCard>
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatCard label="Streak" value={`${user.streaks.daily_streak}D`} sub="consecutive" icon={<Trophy size={14} />} accent="#f59e0b" onClick={() => setView('streak_page')} />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <QuickScanHUD onOpenMealScanner={onOpenMealScanner} onOpenFormAnalyzer={onOpenFormAnalyzer} />
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full bg-primary-action" />
            <h2 className="text-[10px] font-bold text-sub-text uppercase tracking-[0.1em]">Your Day</h2>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => setIsCheckInOpen(true)}
              className="btn-ghost text-[10px] font-semibold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ClipboardCheck size={12} /> Check-In
            </motion.button>
            {!dailyMission && (
              <motion.button
                onClick={onGenerateMission}
                disabled={isGeneratingMission}
                className="btn-primary text-[10px] font-bold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isGeneratingMission ? 'Thinking...' : 'Get Plan'}
              </motion.button>
            )}
          </div>
        </div>
        {dailyMission ? (
          <MissionCard mission={dailyMission} onComplete={onCompleteMission} />
        ) : (
          <motion.div
            className="card-premium p-10 flex flex-col items-center justify-center text-center"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-action/15 to-primary-action/5 flex items-center justify-center mb-3">
              <Sparkles size={24} className="text-primary-action/50 animate-icon-float" />
            </div>
            <p className="text-sm text-sub-text font-bold mb-1">No plan from AI coach</p>
            <p className="text-[10px] text-sub-text/60 mb-4">Generate a personalised daily mission</p>
            <motion.button
              onClick={onGenerateMission}
              disabled={isGeneratingMission}
              className="px-5 py-2.5 rounded-xl bg-primary-action text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              {isGeneratingMission ? 'Thinking...' : 'Generate Plan'}
            </motion.button>
          </motion.div>
        )}
      </motion.section>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <section className="flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full bg-accent" />
            <h2 className="text-[10px] font-bold text-sub-text uppercase tracking-[0.1em]">Weekly Goals</h2>
          </div>
          <div className="flex-1">
            {weeklyQuests.length > 0 ? (
              <div className="space-y-1.5">
                {weeklyQuests.map((q, i) => (
                  <motion.div key={q.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 + i * 0.05, duration: 0.3 }}>
                    <QuestCard quest={q} onComplete={() => onCompleteWeeklyQuest(q)} isElite={true} currentDate={new Date()} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="card-premium p-5 flex items-center justify-center rounded-xl h-[52px]"><span className="text-xs font-medium text-sub-text/60">No weekly goals</span></div>
            )}
          </div>
        </section>
        <section className="flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-primary-action" />
              <h2 className="text-[10px] font-bold text-sub-text uppercase tracking-[0.1em]">Extra Goals</h2>
            </div>
            <motion.button onClick={onAddQuestClick} className="btn-ghost text-[10px] font-semibold" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Plus size={12} /> Add
            </motion.button>
          </div>
          <div className="flex-1">
            {quests.length > 0 ? (
              <div className="space-y-1.5">
                {quests.map((q, i) => (
                  <motion.div key={q.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.05, duration: 0.3 }}>
                    <QuestCard quest={q} onComplete={onCompleteQuest} currentDate={new Date()} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="card-premium p-5 flex items-center justify-center rounded-xl h-[52px]"><span className="text-xs font-medium text-sub-text/60">No extra goals</span></div>
            )}
          </div>
        </section>
      </motion.div>

      {user.activeBuffs.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <ActiveBuffs activeBuffs={user.activeBuffs} />
        </motion.div>
      )}

      <motion.button
        onClick={() => setView('map')}
        className="card-premium p-4 flex items-center gap-4 w-full overflow-hidden relative group"
        whileHover={{ scale: 1.01, y: -1 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/[0.04] to-transparent pointer-events-none" />
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
          <Map size={18} className="text-emerald-500" />
        </div>
        <div className="text-left flex-1 relative z-10">
          <div className="text-sm font-bold text-text-primary">Your Region</div>
          <div className="text-[9px] font-medium text-sub-text">Territory map</div>
        </div>
        <ChevronRight size={16} className="text-sub-text group-hover:translate-x-0.5 transition-transform shrink-0" />
      </motion.button>

      <WeeklyCheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        onSubmit={(data: WeeklyCheckIn) => {
          (async () => {
            try {
              const { systemMessage } = await finalizeWeeklyCheckIn({
                data,
                apiKey,
                user,
                addCheckInLog: db.addCheckInLog,
                setUser: setUserStore,
              });
              setIsCheckInOpen(false);
              if (systemMessage) {
                addToast(systemMessage.length > 140 ? `${systemMessage.slice(0, 140)}…` : systemMessage, 'success');
              } else {
                addToast('Weekly check-in saved.', 'success');
              }
            } catch (err) {
              console.error('[Dashboard] Weekly check-in failed:', err);
              addToast('Weekly check-in failed. Please try again.', 'error');
            }
          })();
        }}
        currentWeight={(user?.bodyMetrics as any)?.currentWeight ?? (user?.bodyMetrics as any)?.weight ?? 0}
      />

      <AddQuestModal isOpen={isAddQuestOpen} onClose={() => setIsAddQuestOpen(false)} onAddQuest={(quest) => useQuestStore.getState().addQuest(quest)} />
      <LogNutritionModal isOpen={isNutritionOpen} onClose={() => setIsNutritionOpen(false)} onSubmit={(log) => db.addNutritionLog({ ...log, id: `nutri-${Date.now()}` } as any)} />
      <LogRecoveryModal isOpen={isRecoveryOpen} onClose={() => setIsRecoveryOpen(false)} onSubmit={(log) => db.addRecoveryLog({ ...log, id: `recov-${Date.now()}` } as any)} />
      
      <AnimatePresence>
        {showCeremony && dailyMission && (
          <MissionCeremony 
            title={dailyMission.title} 
            xpReward={dailyMission.xp_reward} 
            onClose={() => setShowCeremony(false)} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Dashboard;
