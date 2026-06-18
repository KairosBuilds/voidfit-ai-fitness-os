import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Zap, Crown, Shield, Heart, Dumbbell, Activity, Target, Award, Medal, Ruler, Weight, Droplets, Star, Sparkles, User as UserIcon, Camera, Swords } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useUserStore } from '../src/store/useUserStore';
import { useUiStore } from '../src/store/useUiStore';
import { getXpThresholdForLevel } from '../constants';
import { Realm } from '../types';

const realmColors: Record<string, string> = {
  [Realm.Strength]: '#ef4444',
  [Realm.Endurance]: '#f59e0b',
  [Realm.Flexibility]: '#22c55e',
  [Realm.Combat]: '#ef4444',
  [Realm.Nutrition]: '#eab308',
  [Realm.Recovery]: '#3b82f6',
};
const realmIcons: Record<string, React.ElementType> = {
  [Realm.Strength]: Dumbbell,
  [Realm.Endurance]: Activity,
  [Realm.Flexibility]: Target,
  [Realm.Combat]: Swords,
  [Realm.Nutrition]: Heart,
  [Realm.Recovery]: Shield,
};

const ProfilePage: React.FC = () => {
  const { setView } = useUiStore();
  const user = useUserStore(s => s.user);
  const setUser = useUserStore(s => s.setUser);
  const fileRef = useRef<HTMLInputElement>(null);

  const level = user?.level_overall || 1;
  const rank = user?.rank || 'E-Rank Beginner';
  const xpTotal = user?.xp_total || 0;
  const xpToNext = user?.xpToNextLevel || getXpThresholdForLevel(level);
  const xpPct = xpToNext > 0 ? Math.min(Math.round((xpTotal / xpToNext) * 100), 100) : 0;
  const statPoints = user?.stat_points || 0;
  const streak = user?.streaks?.daily_streak || 0;
  const realmStats = user?.stats || {};
  const knownRealms = new Set(Object.values(Realm));
  const filteredStats = Object.fromEntries(
    Object.entries(realmStats).filter(([k]) => knownRealms.has(k as Realm))
  );
  const badges = user?.unlockedBadges || [];
  const records = user?.personalRecords || {};

  const rankTier = rank.includes('S') ? 'S' : rank.includes('A') ? 'A' : rank.includes('B') ? 'B' : rank.includes('C') ? 'C' : rank.includes('D') ? 'D' : 'E';

  const radarData = Object.entries(filteredStats).map(([realm, val]) => ({
    subject: realm,
    A: Number(val),
    fullMark: 100,
  }));

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setUser(prev => ({ ...prev, avatarUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const sortedStats = Object.entries(filteredStats).sort(([, a], [, b]) => Number(b) - Number(a));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 max-w-2xl mx-auto pb-28 pt-4 px-4 sm:px-6">
      <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-sub-text hover:text-main-text text-xs font-medium mb-1">
        <ArrowLeft size={14} /> Back
      </button>

      <div className="glass-effect rounded-[2rem] border border-glass-border overflow-hidden">
        <div className="bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-black/20 p-6 text-center relative">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          <button onClick={() => fileRef.current?.click()} className="w-20 h-20 mx-auto rounded-[1.25rem] bg-gradient-to-br from-indigo-500 to-purple-600 p-[3px] shadow-[0_0_30px_rgba(99,102,241,0.35)] relative group cursor-pointer">
            <div className="w-full h-full rounded-[calc(1.25rem-3px)] bg-background flex items-center justify-center overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-black text-main-text">{user?.name[0]?.toUpperCase() || 'A'}</span>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[calc(1.25rem-3px)]">
                <Camera size={16} className="text-white" />
              </div>
            </div>
          </button>
          <h1 className="text-xl font-black text-main-text mt-3">{user?.name || 'Player'}</h1>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <Crown size={14} className={rankTier === 'S' ? 'text-yellow-400' : rankTier === 'A' ? 'text-red-400' : rankTier === 'B' ? 'text-purple-400' : 'text-sub-text'} />
            <span className={`text-sm font-black ${rankTier === 'S' ? 'text-yellow-400' : rankTier === 'A' ? 'text-red-400' : rankTier === 'B' ? 'text-purple-400' : rankTier === 'C' ? 'text-blue-400' : rankTier === 'D' ? 'text-green-400' : 'text-sub-text'}`}>
              {rank}
            </span>
          </div>

          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="px-4 py-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 min-w-[72px]">
              <div className="text-[8px] font-black text-indigo-300 uppercase tracking-widest">Level</div>
              <div className="text-2xl font-black text-main-text">{level}</div>
            </div>
            <div className="px-4 py-2 bg-amber-500/10 rounded-xl border border-amber-500/20 min-w-[72px]">
              <div className="text-[8px] font-black text-amber-300 uppercase tracking-widest">Stat Pts</div>
              <div className="text-2xl font-black text-amber-400">{statPoints}</div>
            </div>
            <div className="px-4 py-2 bg-rose-500/10 rounded-xl border border-rose-500/20 min-w-[72px]">
              <div className="text-[8px] font-black text-rose-300 uppercase tracking-widest">Streak</div>
              <div className="text-2xl font-black text-rose-400">{streak}</div>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 -mt-3">
          <div className="bg-background/60 rounded-2xl p-4 border border-glass-border">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-black text-sub-text uppercase tracking-wider flex items-center gap-1.5"><Zap size={10} className="text-amber-400" /> XP to next rank</span>
              <span className="text-[10px] text-amber-400 font-bold">{xpPct}%</span>
            </div>
            <div className="text-base font-black text-main-text">{xpTotal.toLocaleString()} <span className="text-xs text-sub-text">/ {xpToNext.toLocaleString()}</span></div>
            <div className="h-3 mt-1.5 bg-background/50 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${xpPct}%`, background: 'linear-gradient(90deg, #f59e0b, #a855f7)', boxShadow: '0 0 12px rgba(245,158,11,0.3)' }} />
            </div>
          </div>
        </div>
      </div>

      <div className="glass-effect p-5 rounded-[2rem] border border-glass-border">
        <h2 className="text-sm font-black text-main-text mb-1 tracking-tight">Attribute Balance</h2>
        <p className="text-[10px] text-sub-text mb-4">Stat distribution across all realms</p>
        {radarData.length > 0 ? (
          <>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="var(--glass-border)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 9, fontWeight: 900 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Stats" dataKey="A" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.15} dot={{ r: 3, fill: 'var(--accent)' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 mt-3">
              {sortedStats.map(([realm, val]) => {
                const color = realmColors[realm] || '#a855f7';
                const Icon = realmIcons[realm] || Star;
                const numVal = Number(val);
                return (
                  <div key={realm} className="flex items-center gap-2.5">
                    <div className="w-5 flex justify-center">
                      <Icon size={10} style={{ color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-0.5">
                        <span className="text-[10px] font-semibold text-main-text">{realm}</span>
                        <span className="text-[10px] font-black" style={{ color }}>{numVal}</span>
                      </div>
                      <div className="h-1.5 bg-background/30 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(numVal, 100)}%`, backgroundColor: color, boxShadow: `0 0 6px ${color}66` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-xs text-sub-text text-center py-8">No stats yet — start training!</div>
        )}
      </div>

      <div className="glass-effect p-5 rounded-[2rem] border border-glass-border">
        <h2 className="text-sm font-black text-main-text mb-3 tracking-tight flex items-center gap-2">
          <UserIcon size={14} className="text-primary-action" /> Body Profile
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Weight, label: 'Weight', value: user?.bodyMetrics?.currentWeight ? `${user.bodyMetrics.currentWeight} kg` : '—', color: 'text-blue-400' },
            { icon: Ruler, label: 'Height', value: user?.bodyMetrics?.height ? `${user.bodyMetrics.height} cm` : '—', color: 'text-green-400' },
            { icon: Heart, label: 'Age', value: user?.bodyMetrics?.age ? `${user.bodyMetrics.age}` : '—', color: 'text-rose-400' },
            { icon: Target, label: 'Goal', value: user?.primaryGoal || '—', color: 'text-amber-400' },
            { icon: Medal, label: 'Level', value: user?.bodyMetrics?.experienceLevel || '—', color: 'text-purple-400' },
            { icon: Droplets, label: 'Body Fat', value: user?.bodyMetrics?.bodyFatPercentage ? `${user.bodyMetrics.bodyFatPercentage}%` : '—', color: 'text-cyan-400' },
            { icon: Shield, label: 'Stamina', value: user?.bodyMetrics?.stamina ? `${user.bodyMetrics.stamina}/10` : '—', color: 'text-emerald-400' },
            { icon: Star, label: 'Gender', value: user?.bodyMetrics?.gender || '—', color: 'text-yellow-400' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2.5 bg-background/20 rounded-xl px-3 py-2.5">
              <div className="w-7 h-7 rounded-lg bg-background/40 flex items-center justify-center">
                <s.icon size={12} className={s.color} />
              </div>
              <div>
                <div className="text-[8px] font-black text-sub-text uppercase tracking-wider">{s.label}</div>
                <div className="text-xs font-bold text-main-text">{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {Object.keys(records).length > 0 && (
        <div className="glass-effect p-5 rounded-[2rem] border border-glass-border">
          <h2 className="text-sm font-black text-main-text mb-3 tracking-tight flex items-center gap-2">
            <Award size={14} className="text-amber-400" /> Personal Records
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(records).map(([ex, val]) => (
              <div key={ex} className="flex items-center justify-between px-3 py-2 bg-amber-500/5 rounded-xl border border-amber-500/10">
                <span className="text-[11px] text-sub-text">{ex}</span>
                <span className="text-xs font-black text-amber-400">{String(val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {badges.length > 0 && (
        <div className="glass-effect p-5 rounded-[2rem] border border-glass-border">
          <h2 className="text-sm font-black text-main-text mb-3 tracking-tight flex items-center gap-2">
            <Sparkles size={14} className="text-yellow-400" /> Badges
          </h2>
          <div className="flex flex-wrap gap-2">
            {badges.map(b => (
              <span key={b} className="px-3 py-1.5 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-xl text-[11px] font-bold text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
                <Award size={10} />{b}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ProfilePage;
