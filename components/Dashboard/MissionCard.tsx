import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DailyMission, QuestStatus } from '../../types';
import { Dumbbell, Droplets, Zap, ShieldCheck, Timer, Target, Activity, Check, Flame } from 'lucide-react';

interface MissionCardProps {
  mission: DailyMission;
  onComplete: () => void;
}

const difficultyColors: Record<string, string> = {
  easy: '#10b981', normal: '#6366f1', hard: '#f59e0b', extreme: '#ef4444',
};
const diffLabels: Record<string, string> = {
  easy: 'Casual', normal: 'Balanced', hard: 'Intense', extreme: 'Extreme',
};

const stagger = (i: number) => ({ initial: { opacity: 0, x: -8 }, animate: { opacity: 1, x: 0, transition: { delay: 0.05 * i, duration: 0.3 } } });

export const MissionCard: React.FC<MissionCardProps> = ({ mission, onComplete }) => {
  const [completing, setCompleting] = React.useState(false);
  const [checked, setChecked] = React.useState<Set<string>>(new Set());
  const done = mission.status === QuestStatus.Completed;

  const totalEx = (mission.warmUp?.exercises?.length || 0) + (mission.coreWorkout?.exercises?.length || 0);
  const doneEx = checked.size;
  const allDone = doneEx >= totalEx;

  const toggleCheck = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleComplete = () => {
    if (completing || done) return;
    setCompleting(true);
    setTimeout(() => { onComplete(); setCompleting(false); }, 800);
  };

  const diffColor = difficultyColors[mission.difficulty] || 'var(--primary-action)';

  return (
    <motion.div
      className="card-premium overflow-hidden relative"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary-action/30 to-transparent" />

      <div className="p-4 pb-3 border-b border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <motion.div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-action/20 to-primary-action/5 flex items-center justify-center shrink-0"
            animate={allDone ? { scale: [1, 1.15, 1], rotate: [0, 5, 0] } : {}}
            transition={{ duration: 0.5 }}
          >
            <Target size={18} className="text-primary-action" />
          </motion.div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[9px] font-semibold text-sub-text uppercase tracking-[0.08em]">Daily Mission</span>
              <span
                className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider"
                style={{ background: `${diffColor}20`, color: diffColor }}
              >
                {diffLabels[mission.difficulty] || mission.difficulty || 'normal'}
              </span>
            </div>
            <h3 className="text-sm font-bold text-text-primary truncate">{mission.title}</h3>
          </div>
        </div>
        <motion.div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl shrink-0 border border-amber-500/10"
          style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))' }}
          whileHover={{ scale: 1.05 }}
        >
          <Zap size={13} className="text-amber-400" />
          <span className="text-xs font-extrabold text-amber-400">+{mission.xp_reward}</span>
        </motion.div>
      </div>

      {/* Progress bar */}
      {!done && totalEx > 0 && (
        <div className="px-4 pt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-semibold text-sub-text uppercase tracking-[0.08em]">Progress</span>
            <span className="text-[9px] font-bold" style={{ color: diffColor }}>{doneEx}/{totalEx}</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${diffColor}, ${diffColor}88)` }}
              initial={{ width: 0 }}
              animate={{ width: `${(doneEx / totalEx) * 100}%` }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
        </div>
      )}

      <div className="p-4 space-y-5">
        <Section title="Warm Up" color="var(--primary-action)" icon={<Activity size={11} />}>
          <div className="space-y-1">
            {mission.warmUp.exercises.map((ex, i) => {
              const id = `warm-${i}`;
              return (
                <ExerciseRow
                  key={id}
                  name={ex.name}
                  detail={ex.reps || (ex.duration ? `${ex.duration}s` : '—')}
                  checked={checked.has(id)}
                  onToggle={() => toggleCheck(id)}
                  index={i}
                  accent="var(--primary-action)"
                />
              );
            })}
          </div>
        </Section>

        <Section title="Workout" color="var(--accent)" icon={<Dumbbell size={11} />}>
          <div className="grid grid-cols-1 gap-1.5">
            {mission.coreWorkout.exercises.map((ex, i) => {
              const id = `work-${i}`;
              return (
                <motion.div
                  key={id}
                  {...stagger(i)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${
                    checked.has(id) ? 'bg-accent/5 border-accent/20' : 'bg-surface border-border hover:border-white/10'
                  }`}
                  onClick={() => toggleCheck(id)}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${checked.has(id) ? 'bg-accent/20' : 'bg-accent/5'}`}>
                    {checked.has(id) ? <Check size={13} className="text-accent" /> : <Dumbbell size={12} className="text-accent/60" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm font-semibold truncate transition-colors ${checked.has(id) ? 'text-text-primary/50 line-through' : 'text-text-primary'}`}>
                      {ex.name}
                    </div>
                    <div className="text-[9px] text-sub-text font-medium">{ex.sets || '—'} × {ex.reps || (ex.duration ? `${ex.duration}s` : 'MAX')}</div>
                  </div>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                    checked.has(id) ? 'bg-accent border-accent' : 'border-border'
                  }`}>
                    {checked.has(id) && <Check size={10} className="text-white" />}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Section>

        {mission.recovery.length > 0 && (
          <Section title="Recovery" color="#10b981" icon={<Droplets size={11} />}>
            <div className="flex flex-wrap gap-1.5">
              {mission.recovery.map((item, i) => {
                const id = `rec-${i}`;
                return (
                  <motion.button
                    key={id}
                    {...stagger(i)}
                    onClick={() => toggleCheck(id)}
                    whileTap={{ scale: 0.95 }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                      checked.has(id)
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                        : 'bg-surface text-text-secondary border-border hover:border-emerald-500/20'
                    }`}
                  >
                    {checked.has(id) && <Check size={10} className="inline mr-1 -mt-0.5" />}
                    {item}
                  </motion.button>
                );
              })}
            </div>
          </Section>
        )}

        {mission.nutritionPlan && (
          <Section title="Nutrition" color="#f59e0b" icon={<Flame size={11} />}>
            <div className="grid grid-cols-4 gap-2">
              <Nutrient label="Cal" value={`${mission.nutritionPlan.targetCalories}`} />
              <Nutrient label="Pro" value={`${mission.nutritionPlan.proteinGrams}g`} accent="#10b981" />
              <Nutrient label="Carbs" value={`${mission.nutritionPlan.carbsGrams}g`} />
              <Nutrient label="Fats" value={`${mission.nutritionPlan.fatsGrams}g`} />
            </div>
          </Section>
        )}
      </div>

      <div className="p-4 pt-0">
        <motion.button
          onClick={handleComplete}
          disabled={done || completing}
          whileHover={!done && !completing ? { scale: 1.02 } : {}}
          whileTap={!done && !completing ? { scale: 0.98 } : {}}
          className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all relative overflow-hidden ${
            done
              ? 'bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 text-emerald-400 border border-emerald-500/20'
              : completing
                ? 'bg-primary-action/50 text-white cursor-wait'
                : allDone
                  ? 'bg-gradient-to-r from-primary-action to-primary-action/80 text-white shadow-lg shadow-primary-action/25 animate-breathe'
                  : 'bg-gradient-to-r from-primary-action/60 to-primary-action/40 text-white/70'
          }`}
        >
          {done ? (
            <><ShieldCheck size={16} /> Mission Complete</>
          ) : completing ? (
            <><Timer size={16} className="animate-spin" /> Finalizing...</>
          ) : allDone ? (
            <><ShieldCheck size={16} /> Complete Mission</>
          ) : (
            <><Target size={16} /> Mark exercises done above</>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};

const Section: React.FC<{ title: string; color: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, color, icon, children }) => (
  <div>
    <div className="flex items-center gap-2 mb-3">
      <div className="w-1 h-4 rounded-full" style={{ background: color }} />
      <div className="flex items-center gap-1.5" style={{ color }}>
        {icon}
        <span className="text-[9px] font-bold uppercase tracking-[0.1em]">{title}</span>
      </div>
    </div>
    {children}
  </div>
);

const ExerciseRow: React.FC<{ name: string; detail: string; checked: boolean; onToggle: () => void; index: number; accent: string }> = ({ name, detail, checked, onToggle, index, accent }) => (
  <motion.div
    {...stagger(index)}
    className={`flex items-center justify-between py-2 px-3 rounded-xl border transition-all cursor-pointer ${
      checked ? 'bg-primary-action/5 border-primary-action/20' : 'bg-surface border-border hover:border-white/10'
    }`}
    onClick={onToggle}
    whileTap={{ scale: 0.98 }}
  >
    <div className="flex items-center gap-2.5">
      <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all ${
        checked ? 'bg-primary-action border-primary-action' : 'border-border'
      }`}>
        {checked && <Check size={9} className="text-white" />}
      </div>
      <span className={`text-sm font-semibold transition-colors ${checked ? 'text-text-primary/40 line-through' : 'text-text-primary'}`}>{name}</span>
    </div>
    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md transition-colors ${checked ? 'bg-primary-action/10 text-primary-action/60' : 'bg-white/5 text-sub-text'}`}>{detail}</span>
  </motion.div>
);

const Nutrient: React.FC<{ label: string; value: string; accent?: string }> = ({ label, value, accent }) => (
  <motion.div
    className="p-2.5 rounded-xl bg-surface border border-border text-center"
    whileHover={{ y: -1, borderColor: 'rgba(255,255,255,0.1)' }}
    transition={{ duration: 0.15 }}
  >
    <div className="text-[8px] font-bold text-sub-text uppercase tracking-wider mb-0.5">{label}</div>
    <div className="text-xs font-extrabold" style={{ color: accent || 'var(--text-primary)' }}>{value}</div>
  </motion.div>
);
