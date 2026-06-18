import React from 'react';
import { motion } from 'framer-motion';
import { User, WeeklyCheckIn, Realm } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { History, TrendingUp, TrendingDown, Minus, Calendar, Scale, Activity, Zap } from 'lucide-react';

import { useUserStore } from '../src/store/useUserStore';
import { useDatabase } from '../src/db/useDatabase';
import { notificationService } from '../src/services/notificationService';

interface ProgressHistoryProps {
  user?: User;
  checkInLogs?: WeeklyCheckIn[];
}

const ProgressHistory: React.FC<ProgressHistoryProps> = (props) => {
  const storeUser = useUserStore(state => state.user);
  const database = useDatabase();
  const dbLogs = database?.checkInLogs || [];
  
  const user = props?.user || storeUser;
  const checkInLogs = Array.isArray(props?.checkInLogs) 
    ? props.checkInLogs 
    : Array.isArray(dbLogs) 
      ? dbLogs 
      : [];

  React.useEffect(() => {
    notificationService.scheduleWeeklyCheckInReminder();
  }, []);

  if (!user) return null;
  
  // Defensive check for chart data
  const safeLogs = Array.isArray(checkInLogs) ? checkInLogs : [];
  const chartData = [...safeLogs].reverse().map(log => ({
    date: log.date ? new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown',
    weight: log.weight || 0,
    bodyFat: log.bodyFatEstimate,
    motivation: log.motivationLevel,
    soreness: log.sorenessLevel,
  }));

  const lastCheckIn = checkInLogs[0];
  const prevCheckIn = checkInLogs[1];

  const weightDiff = lastCheckIn && prevCheckIn ? lastCheckIn.weight - prevCheckIn.weight : 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="space-y-8 max-w-7xl mx-auto pb-24"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-main-text tracking-tight drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">Transformation History</h2>
          <p className="text-sub-text">Chronological analysis of your physical progression.</p>
        </div>
        <div className="p-3 bg-surface/50 rounded-2xl border border-glass-border shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]">
          <History className="text-accent drop-shadow-[0_0_5px_currentColor]" />
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="glass-effect p-6 rounded-3xl border border-glass-border shadow-[0_20px_60px_var(--shadow-soft)]">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-accent/10 rounded-2xl text-accent shadow-[0_0_15px_var(--neon-glow,var(--teddy-glow))]">
              <Scale size={24} />
            </div>
            {weightDiff !== 0 && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase ${weightDiff < 0 ? 'bg-accent-green/20 text-accent-green shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-accent-red/20 text-accent-red shadow-[0_0_10px_rgba(239,68,68,0.3)]'}`}>
                {weightDiff < 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                {Math.abs(weightDiff).toFixed(1)} KG
              </div>
            )}
          </div>
          <div className="text-[10px] font-black text-sub-text uppercase tracking-widest mb-1">Current Weight</div>
          <div className="text-3xl font-black text-main-text">{user.bodyMetrics.currentWeight} <span className="text-sm text-sub-text">KG</span></div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-effect p-6 rounded-3xl border border-glass-border shadow-[0_20px_60px_var(--shadow-soft)]">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-secondary-action/10 rounded-2xl text-secondary-action shadow-[0_0_15px_rgba(37,99,235,0.3)]">
              <Activity size={24} />
            </div>
            <div className="px-2 py-1 bg-surface/50 border border-glass-border rounded-lg text-[10px] font-black text-sub-text uppercase">Estimate</div>
          </div>
          <div className="text-[10px] font-black text-sub-text uppercase tracking-widest mb-1">Body Fat %</div>
          <div className="text-3xl font-black text-main-text">{lastCheckIn?.bodyFatEstimate || user.bodyMetrics.bodyFatPercentage || '--'} <span className="text-sm text-sub-text">%</span></div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-effect p-6 rounded-3xl border border-glass-border shadow-[0_20px_60px_var(--shadow-soft)]">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-accent-yellow/10 rounded-2xl text-accent-yellow shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <Zap size={24} />
            </div>
            <div className="px-2 py-1 bg-accent-yellow/20 rounded-lg text-[10px] font-black text-accent-yellow uppercase shadow-[0_0_10px_rgba(245,158,11,0.2)]">Active</div>
          </div>
          <div className="text-[10px] font-black text-sub-text uppercase tracking-widest mb-1">Daily Streak</div>
          <div className="text-3xl font-black text-main-text">{user.streaks.daily_streak} <span className="text-sm text-sub-text">DAYS</span></div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div variants={itemVariants} className="glass-effect p-6 sm:p-8 rounded-[2.5rem] border border-glass-border shadow-[0_20px_60px_var(--shadow-soft)] h-[400px] flex flex-col">
          <h3 className="text-lg font-black text-main-text mb-6 uppercase tracking-tight flex items-center gap-2 drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">
            <Scale size={18} className="text-accent drop-shadow-[0_0_5px_currentColor]" />
            Weight Progression
          </h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} fontWeight={900} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} fontWeight={900} tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-effect p-6 sm:p-8 rounded-[2.5rem] border border-glass-border shadow-[0_20px_60px_var(--shadow-soft)] h-[400px] flex flex-col">
          <h3 className="text-lg font-black text-main-text mb-6 uppercase tracking-tight flex items-center gap-2 drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">
            <Activity size={18} className="text-secondary-action drop-shadow-[0_0_5px_currentColor]" />
            Bio-Subjective Trends
          </h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} fontWeight={900} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} fontWeight={900} tickLine={false} axisLine={false} domain={[0, 10]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}
                />
                <Line type="monotone" dataKey="motivation" stroke="#fbbf24" strokeWidth={3} dot={{ r: 4, fill: '#fbbf24' }} />
                <Line type="monotone" dataKey="soreness" stroke="#ec4899" strokeWidth={3} dot={{ r: 4, fill: '#ec4899' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-4 justify-center">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent-yellow shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
                <span className="text-[10px] font-black uppercase text-sub-text">Motivation</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent-pink shadow-[0_0_5px_rgba(236,72,153,0.5)]" />
                <span className="text-[10px] font-black uppercase text-sub-text">Soreness</span>
             </div>
          </div>
        </motion.div>
      </div>

      {/* Log Feed */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h3 className="text-xl font-black text-main-text uppercase tracking-tight drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">Recalibration Logs</h3>
        <div className="space-y-4">
          {checkInLogs.map(log => (
            <div key={log.id} className="glass-effect p-6 rounded-3xl border border-glass-border flex flex-col md:flex-row gap-6 shadow-[0_10px_30px_var(--shadow-soft)]">
              <div className="md:w-48">
                <div className="flex items-center gap-2 text-accent mb-1">
                  <Calendar size={14} />
                  <span className="text-xs font-black uppercase tracking-widest">{new Date(log.date).toLocaleDateString()}</span>
                </div>
                <div className="text-2xl font-black text-main-text">{log.weight} KG</div>
              </div>
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-[8px] font-black text-sub-text uppercase mb-1">Difficulty</div>
                  <div className="text-xs font-bold text-main-text uppercase">{log.workoutDifficulty}</div>
                </div>
                <div>
                  <div className="text-[8px] font-black text-sub-text uppercase mb-1">Diet Consist.</div>
                  <div className="text-xs font-bold text-main-text">{log.dietConsistency}/10</div>
                </div>
                <div>
                  <div className="text-[8px] font-black text-sub-text uppercase mb-1">Injuries</div>
                  <div className="text-xs font-bold text-main-text truncate max-w-[100px]">{log.injuryUpdates || 'None'}</div>
                </div>
                <div>
                  <div className="text-[8px] font-black text-sub-text uppercase mb-1">Schedule</div>
                  <div className="text-xs font-bold text-main-text truncate max-w-[100px]">{log.scheduleChanges || 'Stable'}</div>
                </div>
              </div>
            </div>
          ))}
          {checkInLogs.length === 0 && (
            <div className="py-20 text-center border border-dashed border-glass-border rounded-[2.5rem]">
              <History className="w-12 h-12 text-sub-text mx-auto mb-4 opacity-20" />
              <p className="text-sub-text font-bold uppercase tracking-widest">No historical data available.</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProgressHistory;
