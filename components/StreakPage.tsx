import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Zap, Calendar, CheckCircle, ArrowLeft, Star, Medal, Crown, Sparkles, ScrollText, BadgeCheck, Dumbbell, Footprints, Droplets, Pill, Activity, UtensilsCrossed, Flame, Target, Gauge } from 'lucide-react';
import { useUserStore } from '../src/store/useUserStore';
import { useUiStore } from '../src/store/useUiStore';
import { useQuestStore } from '../src/store/useQuestStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../src/db/database';
import { getRankForLevel, getXpThresholdForLevel } from '../constants';

const StreakPage: React.FC = () => {
  const { setView } = useUiStore();
  const user = useUserStore(s => s.user);
  const dailyMission = useQuestStore(s => s.dailyMission);
  const habitLogs = useLiveQuery(() => db.habitLogs.orderBy('date').reverse().toArray()) || [];
  const checkInLogs = useLiveQuery(() => db.checkInLogs.orderBy('date').reverse().toArray()) || [];
  const nutritionLogs = useLiveQuery(() => db.nutritionLogs.orderBy('date').reverse().toArray()) || [];
  const supplementLogs = useLiveQuery(() => db.supplementLogs.orderBy('date').reverse().toArray()) || [];

  const streak = user?.streaks?.daily_streak || 0;
  const level = user?.level_overall || 1;
  const rank = user?.rank || 'E-Rank Beginner';
  const xpTotal = user?.xp_total || 0;
  const xpToNext = user?.xpToNextLevel || getXpThresholdForLevel(level);
  const xpPct = xpToNext > 0 ? Math.min(Math.round((xpTotal / xpToNext) * 100), 100) : 0;
  const completedMissions = user?.missionHistory?.filter(m => m.status === 'completed')?.length || 0;
  const totalMissions = user?.missionHistory?.length || 0;
  const totalXp = user?.xp_total || 0;
  const statPoints = user?.stat_points || 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const habitsToday = habitLogs.filter(h => h.date?.startsWith(todayStr)) || [];
  const hasMealsToday = nutritionLogs.some(l => l.date?.startsWith(todayStr));
  const supplementsToday = supplementLogs.filter(s => s.date?.startsWith(todayStr) && s.taken) || [];
  const lastCheckIn = checkInLogs[0] || null;
  const badges = user?.unlockedBadges || [];

  const habitTotal = user?.habits?.length || 0;
  const habitDone = habitsToday.length;
  const completedGoals = user?.completedGoals?.length || 0;
  const personalRecordsCount = Object.keys(user?.personalRecords || {}).length;
  const realmStats = user?.stats || {};

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 max-w-2xl mx-auto pb-28 pt-4 px-4 sm:px-6">
      <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-sub-text hover:text-main-text text-xs font-medium mb-1">
        <ArrowLeft size={14} /> Back
      </button>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
          <Trophy size={20} />
        </div>
        <div>
          <h1 className="text-xl font-black text-main-text tracking-tight">Streak &amp; Progress</h1>
          <p className="text-[10px] text-sub-text tracking-wider">Consistency, leveling &amp; achievements</p>
        </div>
        <div className="ml-auto px-3 py-1.5 bg-purple-500/10 rounded-xl border border-purple-500/20 text-right">
          <div className="text-[9px] text-purple-400 font-bold uppercase tracking-wider">Level</div>
          <div className="text-sm font-black text-purple-400">{level} <span className="text-[9px] font-medium text-sub-text">· {rank}</span></div>
        </div>
      </div>

      <div className="glass-effect p-6 rounded-[2rem] border border-glass-border text-center bg-gradient-to-b from-amber-500/5 to-transparent">
        <div className="text-6xl font-black text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.3)] tracking-tight">{streak}</div>
        <div className="text-xs font-bold text-amber-400 uppercase tracking-[0.15em] mt-1">Day Streak</div>
        <div className="flex items-center justify-center gap-4 mt-3 text-[10px]">
          <span className="flex items-center gap-1.5 text-main-text font-bold"><Zap size={12} className="text-amber-400" /> Level {level}</span>
          <span className="text-sub-text">·</span>
          <span className="text-sub-text font-medium">{rank}</span>
          <span className="text-sub-text">·</span>
          <span className="flex items-center gap-1.5 text-purple-400 font-bold"><Star size={12} /> {completedMissions} Missions</span>
        </div>
      </div>

      <div className="glass-effect p-5 rounded-[2rem] border border-glass-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-black text-main-text uppercase tracking-wider flex items-center gap-2">
            <Zap size={14} className="text-amber-400" /> XP Progress
          </h2>
          <span className="text-[10px] text-sub-text font-medium">{getRankForLevel(level + 1)}</span>
        </div>
        <div className="text-2xl font-black text-main-text tracking-tight">{xpTotal.toLocaleString()} <span className="text-sm font-medium text-sub-text">/ {xpToNext.toLocaleString()} XP</span></div>
        <div className="h-3 mt-2 bg-background/50 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${xpPct}%`,
              background: 'linear-gradient(90deg, #f59e0b, #a855f7)',
              boxShadow: '0 0 12px rgba(245,158,11,0.3)',
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] mt-1.5">
          <span className="text-sub-text">{xpPct}% to next level</span>
          <span className="text-purple-400 font-bold">{statPoints} stat points available</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { label: 'Level', value: level, icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Rank', value: rank, icon: Crown, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Missions Done', value: `${completedMissions}`, sub: `/${totalMissions}`, icon: Star, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { label: 'Goals Done', value: completedGoals, icon: BadgeCheck, color: 'text-green-400', bg: 'bg-green-500/10' },
        ].map(m => (
          <div key={m.label} className="glass-effect p-3.5 rounded-[1.5rem] border border-glass-border">
            <div className={`w-6 h-6 ${m.bg} rounded-lg flex items-center justify-center mb-1.5`}>
              <m.icon size={12} className={m.color} />
            </div>
            <div className="text-[8px] font-black text-sub-text uppercase tracking-wider">{m.label}</div>
            <div className="text-base font-black text-main-text">{m.value}<span className="text-[9px] text-sub-text font-medium">{m.sub || ''}</span></div>
          </div>
        ))}
      </div>

      <div className="glass-effect p-5 rounded-[2rem] border border-glass-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-black text-main-text uppercase tracking-wider flex items-center gap-2">
            <CheckCircle size={14} className="text-green-400" /> Today's Checklist
          </h2>
          <span className="text-[10px] text-sub-text">{[
            dailyMission?.status === 'completed',
            hasMealsToday,
            habitDone >= habitTotal && habitTotal > 0,
            supplementsToday.length >= (user?.supplementProtocol?.length || 0),
            (user?.currentSteps || 0) >= (user?.dailyStepGoal || 9000),
          ].filter(Boolean).length}/5 done</span>
        </div>
        <div className="space-y-1.5">
          {[
            { label: 'Daily Mission', icon: Dumbbell, color: 'text-orange-400', done: dailyMission?.status === 'completed', value: dailyMission?.status === 'completed' ? 'Done' : dailyMission ? 'Pending' : 'No plan' },
            { label: 'Meals Logged', icon: UtensilsCrossed, color: 'text-amber-400', done: hasMealsToday, value: hasMealsToday ? 'Done' : '—' },
            { label: 'Habits Tracked', icon: Activity, color: 'text-indigo-400', done: habitDone >= habitTotal && habitTotal > 0, value: `${habitDone}/${habitTotal}` },
            { label: 'Supplements Taken', icon: Pill, color: 'text-purple-400', done: supplementsToday.length >= (user?.supplementProtocol?.length || 0), value: `${supplementsToday.length}/${user?.supplementProtocol?.length || 0}` },
            { label: 'Step Goal', icon: Footprints, color: 'text-emerald-400', done: (user?.currentSteps || 0) >= (user?.dailyStepGoal || 9000), value: `${user?.currentSteps || 0} / ${user?.dailyStepGoal || 9000}` },
            { label: 'Water Goal', icon: Droplets, color: 'text-blue-400', done: false, value: `${user?.waterIntakeGoal_ml || 2500} ml goal` },
          ].map(item => (
            <div key={item.label} className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border ${item.done ? 'bg-green-500/5 border-green-500/20' : 'bg-background/20 border-glass-border'}`}>
              <div className="flex items-center gap-2.5">
                {item.done ? (
                  <CheckCircle size={14} className="text-green-400" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-sub-text/30" />
                )}
                <div className="flex items-center gap-2">
                  <item.icon size={12} className={item.color} />
                  <span className="text-sm font-medium text-main-text">{item.label}</span>
                </div>
              </div>
              <span className={`text-[10px] font-bold ${item.done ? 'text-green-400' : 'text-sub-text'}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {user?.habits?.length > 0 && (
        <div className="glass-effect p-5 rounded-[2rem] border border-glass-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-black text-main-text uppercase tracking-wider flex items-center gap-2">
              <ScrollText size={14} className="text-cyan-400" /> All Habits — Today
            </h2>
            <span className="text-[10px] text-sub-text">{habitDone}/{habitTotal} done</span>
          </div>
          <div className="space-y-1.5">
            {user.habits.map(h => {
              const done = habitsToday.some(l => l.habitId === h.id && l.completed);
              return (
                <div key={h.id} className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border ${done ? 'bg-green-500/5 border-green-500/15' : 'bg-background/20 border-glass-border'}`}>
                  <div className="flex items-center gap-2">
                    {done ? <CheckCircle size={12} className="text-green-400" /> : <div className="w-3 h-3 rounded-full border-2 border-sub-text/30" />}
                    <span className="text-sm font-medium text-main-text">{h.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-sub-text uppercase font-medium">{h.category}</span>
                    <span className={`text-[10px] font-bold ${done ? 'text-green-400' : 'text-sub-text'}`}>{done ? 'Done' : '—'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {Object.keys(realmStats).length > 0 && (
        <div className="glass-effect p-5 rounded-[2rem] border border-glass-border">
          <h2 className="text-xs font-black text-main-text mb-3 uppercase tracking-wider flex items-center gap-2">
            <Medal size={14} className="text-amber-400" /> Realm Stats
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(realmStats).map(([realm, val]) => {
              const numVal = Number(val);
              return (
                <div key={realm}>
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-sub-text capitalize font-medium">{realm}</span>
                    <span className="font-bold text-main-text">{numVal}</span>
                  </div>
                  <div className="h-1.5 bg-background/30 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-amber-500/70" style={{ width: `${Math.min(numVal, 100)}%`, boxShadow: '0 0 4px rgba(245,158,11,0.3)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {badges.length > 0 && (
        <div className="glass-effect p-5 rounded-[2rem] border border-glass-border">
          <h2 className="text-xs font-black text-main-text mb-3 uppercase tracking-wider flex items-center gap-2">
            <Sparkles size={14} className="text-yellow-400" /> Badges Unlocked
          </h2>
          <div className="flex flex-wrap gap-2">
            {badges.map(b => (
              <span key={b} className="px-3 py-1.5 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-xl text-[11px] font-bold text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
                <Sparkles size={10} />{b}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="glass-effect p-5 rounded-[2rem] border border-glass-border">
        <h2 className="text-xs font-black text-main-text mb-3 uppercase tracking-wider flex items-center gap-2">
          <Calendar size={14} className="text-blue-400" /> History &amp; Records
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Last Check-In', value: lastCheckIn ? new Date(lastCheckIn.date).toLocaleDateString() : 'Never' },
            { label: 'Personal Records', value: personalRecordsCount },
            { label: 'Total XP', value: `${totalXp.toLocaleString()}`, accent: true },
            { label: 'Total Missions', value: `${completedMissions}/${totalMissions}` },
          ].map(s => (
            <div key={s.label} className="bg-background/20 rounded-xl p-3">
              <div className="text-[8px] font-black text-sub-text uppercase tracking-wider">{s.label}</div>
              <div className={`text-sm font-black mt-0.5 ${s.accent ? 'text-purple-400' : 'text-main-text'}`}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default StreakPage;
