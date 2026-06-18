import React from 'react';
import { motion } from 'framer-motion';
import { Scale, TrendingDown, TrendingUp, Flame, Dumbbell, ArrowLeft, Ruler, Heart, Brain, Activity, Moon, Stethoscope, Target, Timer, Zap, AlertTriangle, Clock, Award } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useUserStore } from '../src/store/useUserStore';
import { useUiStore } from '../src/store/useUiStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../src/db/database';
import { calculateBMI } from '../src/utils/fitnessUtils';

const WeightPage: React.FC = () => {
  const { setView } = useUiStore();
  const user = useUserStore(s => s.user);
  const checkInLogs = useLiveQuery(() => db.checkInLogs.orderBy('date').reverse().toArray()) || [];
  const activityLog = useLiveQuery(() => db.activityLogs.orderBy('date').toArray()) || [];
  const recoveryLogs = useLiveQuery(() => db.recoveryLogs.orderBy('date').reverse().toArray()) || [];
  const labReports = useLiveQuery(() => db.labReports.orderBy('date').reverse().toArray()) || [];
  const bodyPhotos = useLiveQuery(() => db.bodyPhotos.orderBy('date').reverse().toArray()) || [];

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysActivity = activityLog.filter((a: any) => a.date?.startsWith(todayStr)) || [];
  const calsBurnedToday = todaysActivity.reduce((s: number, a: any) => s + (a.caloriesBurned || a.estimatedCalories || 0), 0);
  const latestRecovery = recoveryLogs[0] || null;
  const latestLab = labReports[0] || null;
  const latestPhoto = bodyPhotos.filter((p: any) => p.type === 'body')[0] || null;

  const bmi = user ? calculateBMI(user.bodyMetrics.currentWeight, user.bodyMetrics.height) : 0;
  const chartData = [...checkInLogs].reverse().map(log => ({
    date: log.date ? new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
    weight: log.weight || 0,
  }));
  const lastCheckIn = checkInLogs[0] || null;
  const prevCheckIn = checkInLogs[1] || null;
  const weightDiff = (lastCheckIn && prevCheckIn) ? lastCheckIn.weight - prevCheckIn.weight : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 max-w-2xl mx-auto pb-28 pt-4 px-4 sm:px-6">
      <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-sub-text hover:text-main-text text-xs font-medium mb-1">
        <ArrowLeft size={14} /> Back
      </button>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
          <Scale size={20} />
        </div>
        <div>
          <h1 className="text-xl font-black text-main-text tracking-tight">Weight &amp; Body</h1>
          <p className="text-[10px] text-sub-text tracking-wider">Body composition, health &amp; training</p>
        </div>
        {user?.bodyMetrics?.targetWeight && (
          <div className="ml-auto px-3 py-1.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-right">
            <div className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Goal</div>
            <div className="text-sm font-black text-emerald-400">{user.bodyMetrics.targetWeight} <span className="text-[9px] font-medium">kg</span></div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { label: 'Current', value: `${user?.bodyMetrics?.currentWeight || '—'} kg`, icon: Scale, color: 'emerald' },
          { label: 'Target', value: `${user?.bodyMetrics?.targetWeight || '—'} kg`, icon: Target, color: 'amber' },
          { label: 'BMI', value: bmi.toFixed(1), icon: Ruler, color: 'blue' },
          { label: 'Burned Today', value: `${calsBurnedToday.toLocaleString()} kcal`, icon: Flame, color: 'orange' },
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

      {weightDiff !== 0 && (
        <div className={`glass-effect p-3.5 rounded-[1.5rem] border flex items-center gap-3 ${weightDiff < 0 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
          {weightDiff < 0 ? <TrendingDown size={18} className="text-emerald-400" /> : <TrendingUp size={18} className="text-red-400" />}
          <div>
            <div className="text-xs text-sub-text">Since last check-in</div>
            <div className={`text-base font-black ${weightDiff < 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {weightDiff < 0 ? '-' : '+'}{Math.abs(weightDiff).toFixed(1)} kg
            </div>
          </div>
          {user?.bodyMetrics?.bodyFatPercentage && (
            <div className="ml-auto text-right">
              <div className="text-[9px] text-sub-text">Body Fat</div>
              <div className="text-xs font-bold text-main-text">{user.bodyMetrics.bodyFatPercentage}%</div>
            </div>
          )}
          {lastCheckIn?.bodyFatEstimate && (
            <div className="text-right">
              <div className="text-[9px] text-sub-text">Est. BF</div>
              <div className="text-xs font-bold text-main-text">{lastCheckIn.bodyFatEstimate}%</div>
            </div>
          )}
        </div>
      )}

      <div className="glass-effect p-5 rounded-[2rem] border border-glass-border">
        <h2 className="text-xs font-black text-main-text mb-3 uppercase tracking-wider flex items-center gap-2">
          <TrendingDown size={14} className="text-emerald-400" /> Weight History
          {chartData.length > 0 && <span className="text-[9px] text-sub-text font-medium normal-case ml-auto">{checkInLogs.length} entries</span>}
        </h2>
        <div className="h-[260px]">
          {chartData.length < 2 ? (
            <div className="h-full flex flex-col items-center justify-center text-sub-text">
              <div className="text-3xl mb-2">📊</div>
              <div className="text-xs font-medium">Need at least 2 check-ins for a trend chart</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={10} fontWeight={700} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} fontWeight={700} tickLine={false} axisLine={false} domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                <Tooltip
                  contentStyle={{ background: 'rgba(15,23,42,0.95)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
                  itemStyle={{ color: '#10b981', fontSize: '13px', fontWeight: 700 }}
                  labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}
                />
                <Area type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#weightGrad)" dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#10b981', stroke: '#0f172a', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-effect p-5 rounded-[2rem] border border-glass-border">
          <h2 className="text-xs font-black text-main-text mb-3 uppercase tracking-wider flex items-center gap-2">
            <Activity size={14} className="text-blue-400" /> Body Profile
          </h2>
          <div className="space-y-2.5">
            {[
              { label: 'Height', value: `${user?.bodyMetrics?.height} cm` },
              { label: 'Age', value: `${user?.bodyMetrics?.age} y/o` },
              { label: 'Gender', value: user?.bodyMetrics?.gender },
              { label: 'Experience', value: user?.bodyMetrics?.experienceLevel },
              { label: 'Primary Goal', value: user?.primaryGoal },
              { label: 'Body Fat', value: user?.bodyMetrics?.bodyFatPercentage ? `${user.bodyMetrics.bodyFatPercentage}%` : lastCheckIn?.bodyFatEstimate ? `${lastCheckIn.bodyFatEstimate}%` : '—' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-[11px] text-sub-text">{s.label}</span>
                <span className="text-[12px] font-bold text-main-text">{s.value || '—'}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-effect p-5 rounded-[2rem] border border-glass-border">
          <h2 className="text-xs font-black text-main-text mb-3 uppercase tracking-wider flex items-center gap-2">
            <Zap size={14} className="text-purple-400" /> Fitness Levels
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Stamina', value: user?.bodyMetrics?.stamina, color: 'bg-purple-400' },
              { label: 'Flexibility', value: user?.bodyMetrics?.flexibility, color: 'bg-purple-400' },
              { label: 'Strength', value: user?.bodyMetrics?.strengthLevel, color: 'bg-purple-400' },
            ].map(s => (
              <div key={s.label}>
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className="text-sub-text">{s.label}</span>
                  <span className="font-bold text-main-text">{s.value}/10</span>
                </div>
                <div className="h-1.5 bg-background/30 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${s.color}`} style={{ width: `${(s.value || 0) * 10}%`, boxShadow: '0 0 6px rgba(168,85,247,0.3)' }} />
                </div>
              </div>
            ))}
            <div className="pt-1 space-y-1.5">
              {[
                { label: 'Pushups Max', value: user?.bodyMetrics?.pushupsMax },
                { label: 'Pullups Max', value: user?.bodyMetrics?.pullupsMax },
                { label: 'Running', value: user?.bodyMetrics?.runningAbility },
              ].map(s => (
                <div key={s.label} className="flex justify-between text-[11px]">
                  <span className="text-sub-text">{s.label}</span>
                  <span className="font-bold text-main-text">{s.value || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-effect p-5 rounded-[2rem] border border-glass-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-black text-main-text uppercase tracking-wider flex items-center gap-2">
            <Dumbbell size={14} className="text-orange-400" /> Today's Training
          </h2>
          {todaysActivity.length > 0 && (
            <span className="text-[10px] text-sub-text">{todaysActivity.length} activities</span>
          )}
        </div>
        {todaysActivity.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-sub-text">
            <div className="text-3xl mb-2">💪</div>
            <div className="text-xs font-medium">No activity recorded today</div>
          </div>
        ) : (
          <div className="space-y-2">
            {todaysActivity.map((a: any, i: number) => {
              const cals = a.caloriesBurned || a.estimatedCalories || 0;
              return (
                <div key={a.id || i} className="flex items-center justify-between px-3.5 py-2.5 bg-background/20 rounded-xl border border-glass-border">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <Dumbbell size={14} className="text-orange-400" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-main-text">{a.skillName || a.activity || 'Workout'}</div>
                      <div className="text-[10px] text-sub-text">
                        {a.date?.slice(0, 10)}
                        {a.duration ? ` · ${a.duration} min` : ''}
                        {a.reps ? ` · ${a.reps} reps` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {cals > 0 && <div className="text-sm font-bold text-orange-400">{cals} kcal</div>}
                    {a.xp > 0 && <div className="text-[10px] text-purple-400">+{a.xp} XP</div>}
                  </div>
                </div>
              );
            })}
            {todaysActivity.length > 1 && (
              <div className="flex justify-between pt-2 border-t border-glass-border text-xs px-1">
                <span className="text-sub-text">{todaysActivity.length} workouts</span>
                <span className="text-main-text font-bold">
                  {todaysActivity.reduce((s: number, a: any) => s + (a.caloriesBurned || a.estimatedCalories || 0), 0)} kcal · +{todaysActivity.reduce((s: number, a: any) => s + (a.xp || 0), 0)} XP
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="glass-effect p-5 rounded-[2rem] border border-glass-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-black text-main-text uppercase tracking-wider flex items-center gap-2">
            <Moon size={14} className="text-indigo-400" /> Recovery &amp; Wellbeing
          </h2>
        </div>
        {latestRecovery ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Sleep', value: `${latestRecovery.sleepHours}h`, sub: `Q${latestRecovery.sleepQuality}`, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
              { label: 'Soreness', value: `${latestRecovery.soreness}/10`, color: 'text-red-400', bg: 'bg-red-500/10' },
              { label: 'Fatigue', value: `${latestRecovery.fatigue}/10`, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
              { label: 'Stress', value: `${user?.bodyMetrics?.stressLevel || latestRecovery.stress || '—'}/10`, color: 'text-purple-400', bg: 'bg-purple-500/10' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl p-3 border border-glass-border`}>
                <div className="text-[8px] font-black text-sub-text uppercase tracking-wider">{s.label}</div>
                <div className="text-base font-black text-main-text mt-0.5">{s.value}</div>
                {s.sub && <div className="text-[9px] text-sub-text">{s.sub}</div>}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-sub-text">
            <div className="text-3xl mb-2">😴</div>
            <div className="text-xs font-medium">No recovery data logged</div>
          </div>
        )}
      </div>

      {user?.personalRecords && Object.keys(user.personalRecords).length > 0 && (
        <div className="glass-effect p-5 rounded-[2rem] border border-glass-border">
          <h2 className="text-xs font-black text-main-text mb-3 uppercase tracking-wider flex items-center gap-2">
            <Award size={14} className="text-yellow-400" /> Personal Records
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(user.personalRecords).map(([ex, val]) => (
              <div key={ex} className="flex items-center justify-between px-3 py-2 bg-amber-500/5 rounded-xl border border-amber-500/10">
                <span className="text-[11px] text-sub-text">{ex}</span>
                <span className="text-xs font-black text-amber-400">{String(val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {latestLab && (
        <div className="glass-effect p-5 rounded-[2rem] border border-glass-border">
          <h2 className="text-xs font-black text-main-text mb-3 uppercase tracking-wider flex items-center gap-2">
            <Stethoscope size={14} className="text-cyan-400" /> Lab Reports
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Vitamin D', value: latestLab.vitaminD },
              { label: 'Testosterone', value: latestLab.testosterone },
              { label: 'Cholesterol', value: latestLab.cholesterol },
              { label: 'Thyroid', value: latestLab.thyroid },
              { label: 'Blood Sugar', value: latestLab.bloodSugar },
            ].filter(l => l.value).map(l => (
              <div key={l.label} className="bg-cyan-500/5 rounded-xl px-3 py-2.5 border border-cyan-500/10">
                <div className="text-[9px] text-sub-text font-medium">{l.label}</div>
                <div className="text-sm font-black text-cyan-400">{l.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {user?.bodyMetrics?.injuries?.length > 0 && (
        <div className="glass-effect p-5 rounded-[2rem] border border-red-500/20">
          <h2 className="text-xs font-black text-main-text mb-3 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-400" /> Injuries
          </h2>
          <div className="flex flex-wrap gap-2">
            {user.bodyMetrics.injuries.map((inj, i) => (
              <span key={i} className="px-3 py-1.5 bg-red-500/10 rounded-lg text-[11px] text-red-400 font-medium border border-red-500/15">{inj}</span>
            ))}
          </div>
        </div>
      )}

      {checkInLogs.length > 0 && (
        <div className="glass-effect p-5 rounded-[2rem] border border-glass-border">
          <h2 className="text-xs font-black text-main-text mb-3 uppercase tracking-wider flex items-center gap-2">
            <Clock size={14} className="text-green-400" /> Check-In History
          </h2>
          <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar">
            {checkInLogs.slice(0, 15).map((log, i) => (
              <div key={log.id || i} className="flex items-center justify-between px-3.5 py-2 bg-background/20 rounded-xl">
                <span className="text-[11px] font-medium text-sub-text">{new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-emerald-400">{log.weight} kg</span>
                  <span className="text-[9px] text-sub-text">BF: {log.bodyFatEstimate || '—'}%</span>
                  <span className="text-[9px] text-sub-text">Diet: {log.dietConsistency}/10</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default WeightPage;
