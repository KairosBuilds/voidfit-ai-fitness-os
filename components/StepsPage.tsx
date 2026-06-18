import React from 'react';
import { motion } from 'framer-motion';
import { Footprints, MapPin, Target, Clock, Dumbbell, TrendingUp, ArrowLeft, Zap, Activity, Mountain, Flame, Route, Map, Gauge, Heart } from 'lucide-react';
import { useUserStore } from '../src/store/useUserStore';
import { useUiStore } from '../src/store/useUiStore';
import { useStepCounter } from '../src/services/stepService';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../src/db/database';
import { TerritorySystem } from '../src/services/TerritorySystem';

const StepsPage: React.FC = () => {
  const { setView } = useUiStore();
  const user = useUserStore(s => s.user);
  const { steps, distance, isTracking, requestPermission } = useStepCounter();
  const activityLog = useLiveQuery(() => db.activityLogs.orderBy('date').toArray()) || [];

  const dailyGoal = user?.dailyStepGoal || 9000;
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysWorkouts = activityLog.filter((a: any) => a.date?.startsWith(todayStr)) || [];
  const streak = user?.streaks?.daily_streak || 0;
  const pct = dailyGoal > 0 ? Math.min(Math.round((steps / dailyGoal) * 100), 100) : 0;

  const territoryState = TerritorySystem.getState();
  const territoryDistance = territoryState?.totalDistance || 0;
  const territorySpeed = territoryState?.currentSpeed || 0;
  const territoryAvgSpeed = territoryState?.avgSpeed || 0;
  const territoryElapsed = territoryState?.elapsedSeconds || 0;
  const territoryMode = territoryState?.activityMode || 'walk';
  const isTerritoryActive = territoryState?.active || false;

  const weekActivities = activityLog.filter((a: any) => {
    const d = new Date(a.date); const now = new Date(); const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo && d <= now && a.skillId === 'endurance';
  }) || [];

  const totalWorkoutMinutes = todaysWorkouts.reduce((s: number, a: any) => s + (a.duration || a.duration_min || 0), 0);
  const totalWorkoutXp = todaysWorkouts.reduce((s: number, a: any) => s + (a.xp || 0), 0);

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60); const s = Math.floor(sec % 60);
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const progressGlow = pct >= 100 ? 'rgba(34,197,94,0.4)' : 'rgba(99,102,241,0.4)';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 max-w-2xl mx-auto pb-28 pt-4 px-4 sm:px-6">
      <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-sub-text hover:text-main-text text-xs font-medium mb-1">
        <ArrowLeft size={14} /> Back
      </button>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/10 flex items-center justify-center text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.15)]">
          <Footprints size={20} />
        </div>
        <div>
          <h1 className="text-xl font-black text-main-text tracking-tight">Steps &amp; Movement</h1>
          <p className="text-[10px] text-sub-text tracking-wider">Walking, workouts &amp; territory tracking</p>
        </div>
        <div className="ml-auto px-3 py-1.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-right">
          <div className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">{pct >= 100 ? 'Goal Met' : `${100 - pct}% left`}</div>
          <div className="text-sm font-black text-indigo-400">{steps.toLocaleString()}<span className="text-[9px] font-medium text-sub-text">/{dailyGoal.toLocaleString()}</span></div>
        </div>
      </div>

      <div className="glass-effect p-5 rounded-[2rem] border border-glass-border text-center">
        <div className="text-5xl font-black text-main-text tracking-tight">{steps.toLocaleString()}</div>
        <div className="text-xs text-sub-text mt-1">steps today</div>
        <div className="h-3 mt-3 bg-background/50 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: pct >= 100 ? 'linear-gradient(90deg, #6366f1, #22c55e)' : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
              boxShadow: `0 0 12px ${progressGlow}`,
            }}
          />
        </div>
        <div className="flex items-center justify-center gap-5 mt-3 text-[10px]">
          <span className="font-bold text-indigo-400">{pct}% completed</span>
          <span className="text-sub-text">·</span>
          <span className="text-sub-text">Distance: {(distance / 1000).toFixed(2)} km</span>
          <span className="text-sub-text">·</span>
          <span className={`font-bold ${isTracking ? 'text-green-400' : 'text-sub-text'}`}>{isTracking ? 'Sensors active' : 'No sensors'}</span>
        </div>
        {!isTracking && (
          <button onClick={requestPermission} className="mt-3 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-bold shadow-lg hover:shadow-indigo-500/30 transition-all">
            Link Sensors — Enable Step Tracking
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { label: 'Distance', value: `${(distance / 1000).toFixed(2)} km`, icon: MapPin, color: 'emerald' },
          { label: 'Progress', value: `${pct}%`, icon: Gauge, color: 'amber' },
          { label: 'Workouts', value: `${todaysWorkouts.length} today`, icon: Clock, color: 'blue' },
          { label: 'Streak', value: `${streak} days`, icon: Flame, color: 'purple' },
        ].map(m => (
          <div key={m.label} className="glass-effect p-3.5 rounded-[1.5rem] border border-glass-border">
            <div className="flex items-center gap-1.5 mb-1">
              <m.icon size={11} className={`text-${m.color}-400`} />
              <span className="text-[8px] font-black text-sub-text uppercase tracking-wider">{m.label}</span>
            </div>
            <div className="text-base font-black text-main-text">{m.value}</div>
          </div>
        ))}
      </div>

      {isTerritoryActive && (
        <div className="glass-effect p-4 rounded-[1.5rem] border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-purple-500/5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-black text-sub-text uppercase tracking-wider">Live Territory Session</span>
            <span className="ml-auto text-[9px] bg-indigo-500/20 text-indigo-400 px-2.5 py-0.5 rounded-full font-bold uppercase">{territoryMode}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Distance', value: `${(territoryDistance / 1000).toFixed(2)} km`, icon: Route },
              { label: 'Duration', value: formatDuration(territoryElapsed), icon: Clock },
              { label: 'Speed', value: `${territorySpeed.toFixed(1)} m/s`, icon: Gauge },
              { label: 'Avg Speed', value: `${territoryAvgSpeed.toFixed(1)} m/s`, icon: Activity },
            ].map(s => (
              <div key={s.label}>
                <div className="flex items-center gap-1 mb-0.5"><s.icon size={10} className="text-indigo-400" /><span className="text-[8px] text-sub-text uppercase tracking-wider">{s.label}</span></div>
                <div className="text-sm font-black text-main-text">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {weekActivities.length > 0 && (
        <div className="glass-effect p-5 rounded-[2rem] border border-glass-border">
          <h2 className="text-xs font-black text-main-text mb-3 uppercase tracking-wider flex items-center gap-2">
            <Activity size={14} className="text-indigo-400" /> Weekly Endurance
          </h2>
          <div className="space-y-2">
            {[...new Set(weekActivities.map((a: any) => a.date?.slice(0, 10)))].slice(0, 7).map(date => {
              const dayActs = weekActivities.filter((a: any) => a.date?.startsWith(date));
              const daySteps = dayActs.reduce((s: number, a: any) => s + (a.reps || 0), 0);
              const dayXp = dayActs.reduce((s: number, a: any) => s + (a.xp || 0), 0);
              const barPct = Math.min((daySteps / dailyGoal) * 100, 100);
              return (
                <div key={date} className="flex items-center gap-3 py-0.5">
                  <span className="text-[9px] font-bold text-sub-text w-20">{new Date(date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  <div className="flex-1 h-2.5 bg-background/30 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${barPct}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', boxShadow: '0 0 6px rgba(99,102,241,0.3)' }} />
                  </div>
                  <span className="text-[10px] font-bold text-main-text w-20 text-right">{daySteps.toLocaleString()} steps</span>
                  {dayXp > 0 && <span className="text-[10px] text-purple-400 font-medium w-14 text-right">+{dayXp}xp</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="glass-effect p-5 rounded-[2rem] border border-glass-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-black text-main-text uppercase tracking-wider flex items-center gap-2">
            <Dumbbell size={14} className="text-orange-400" /> Today's Workouts
          </h2>
          {todaysWorkouts.length > 0 && (
            <span className="text-[10px] text-sub-text">{totalWorkoutMinutes} min · +{totalWorkoutXp} XP</span>
          )}
        </div>
        {todaysWorkouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-sub-text">
            <div className="text-3xl mb-2">🏋️</div>
            <div className="text-xs font-medium">No workouts today</div>
          </div>
        ) : (
          <div className="space-y-2">
            {todaysWorkouts.map((w: any, i: number) => (
              <div key={w.id || i} className="flex items-center justify-between px-3.5 py-2.5 bg-background/20 rounded-xl border border-glass-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Zap size={14} className="text-orange-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-main-text">{w.skillName || w.activity || 'Workout'}</div>
                    <div className="text-[10px] text-sub-text">
                      {w.date?.slice(0, 10)}
                      {w.reps ? ` · ${w.reps} reps` : ''}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-indigo-400">{w.duration || w.duration_min || 0} min</div>
                  {w.xp > 0 && <div className="text-[10px] text-purple-400">+{w.xp} XP</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-effect p-5 rounded-[2rem] border border-glass-border">
        <h2 className="text-xs font-black text-main-text mb-3 uppercase tracking-wider flex items-center gap-2">
          <Heart size={14} className="text-teal-400" /> Daily Movement Summary
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Step Goal', value: dailyGoal.toLocaleString() },
            { label: 'Distance', value: `${(distance / 1000).toFixed(2)} km` },
            { label: 'Last Sync', value: user?.lastStepSync ? new Date(user.lastStepSync).toLocaleTimeString() : '—' },
            { label: 'Streak Status', value: user?.streaks?.lastStepGoalDate === todayStr ? '✓ Met today' : 'Not yet' },
          ].map(s => (
            <div key={s.label} className="bg-background/20 rounded-xl p-3">
              <div className="text-[8px] font-black text-sub-text uppercase tracking-wider">{s.label}</div>
              <div className={`text-sm font-black mt-0.5 ${s.value === '✓ Met today' ? 'text-green-400' : 'text-main-text'}`}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default StepsPage;
