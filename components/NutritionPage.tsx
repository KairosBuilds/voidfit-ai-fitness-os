import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Droplets, Beef, Wheat, Apple, UtensilsCrossed, Target, ArrowLeft, Pill, History, Zap, CircleCheckBig } from 'lucide-react';
import { useUserStore } from '../src/store/useUserStore';
import { useUiStore } from '../src/store/useUiStore';
import { useQuestStore } from '../src/store/useQuestStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../src/db/database';

const NutritionPage: React.FC = () => {
  const { setView } = useUiStore();
  const user = useUserStore(s => s.user);
  const dailyMission = useQuestStore(s => s.dailyMission);
  const nutritionLogs = useLiveQuery(() => db.nutritionLogs.orderBy('date').reverse().toArray()) || [];
  const waterLogs = useLiveQuery(() => db.waterLogs.orderBy('date').reverse().toArray()) || [];
  const supplementLogs = useLiveQuery(() => db.supplementLogs.orderBy('date').reverse().toArray()) || [];

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysRaw = nutritionLogs.filter(l => l.date?.startsWith(todayStr)) || [];

  const seen = new Set<string>();
  const todaysMeals = todaysRaw.filter(l => {
    const key = l.mealType || l.id || '';
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const todaysWater = waterLogs.filter(l => l.date?.startsWith(todayStr)) || [];
  const todaysSupps = supplementLogs.filter(l => l.date?.startsWith(todayStr)) || [];
  const weekMeals = nutritionLogs.filter(l => {
    const d = new Date(l.date);
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo && d <= now;
  }) || [];

  const totalCals = todaysMeals.reduce((s, l) => s + (l.calories || 0), 0);
  const totalProtein = todaysMeals.reduce((s, l) => s + (l.protein || 0), 0);
  const totalCarbs = todaysMeals.reduce((s, l) => s + (l.carbs || 0), 0);
  const totalFats = todaysMeals.reduce((s, l) => s + (l.fats || 0), 0);
  const totalHydration = todaysWater.reduce((s, l) => s + (l.amount_ml || 0), 0);
  const calTarget = dailyMission?.nutritionPlan?.targetCalories || 2200;
  const proteinTarget = dailyMission?.nutritionPlan?.proteinGrams || Math.round(calTarget * 0.3 / 4);
  const carbTarget = dailyMission?.nutritionPlan?.carbsGrams || Math.round(calTarget * 0.4 / 4);
  const fatTarget = dailyMission?.nutritionPlan?.fatsGrams || Math.round(calTarget * 0.3 / 9);
  const hydrationTarget = user?.waterIntakeGoal_ml || dailyMission?.nutritionPlan?.hydrationTargetMl || 2500;

  const mealTypeIcons: Record<string, string> = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍿' };
  const mealTypeLabels: Record<string, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };

  const weekCalories = [...new Set(weekMeals.map(m => m.date))].map(date => ({
    date: date?.slice(5) || date,
    cals: weekMeals.filter(m => m.date === date).reduce((s, m) => s + (m.calories || 0), 0),
  }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 max-w-2xl mx-auto pb-28 pt-4 px-4 sm:px-6">
      <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-sub-text hover:text-main-text text-xs font-medium mb-1">
        <ArrowLeft size={14} /> Back
      </button>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
          <UtensilsCrossed size={20} />
        </div>
        <div>
          <h1 className="text-xl font-black text-main-text tracking-tight">Nutrition</h1>
          <p className="text-[10px] text-sub-text tracking-wider">Daily intake, macros &amp; targets</p>
        </div>
        {calTarget > 0 && (
          <div className="ml-auto px-3 py-1.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-right">
            <div className="text-[9px] text-amber-400 font-bold uppercase tracking-wider">Target</div>
            <div className="text-sm font-black text-amber-400">{calTarget.toLocaleString()} <span className="text-[9px] font-medium">kcal</span></div>
          </div>
        )}
      </div>

      <div className="glass-effect p-5 rounded-[2rem] border border-glass-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-amber-500" />
            <span className="text-xs font-black text-main-text uppercase tracking-wider">Calories</span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${totalCals >= calTarget ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/15 text-amber-400'}`}>
            {totalCals >= calTarget ? '✓ Met' : `${calTarget - totalCals} kcal left`}
          </span>
        </div>
        <div className="text-3xl font-black text-main-text tracking-tight">{totalCals.toLocaleString()} <span className="text-sm font-medium text-sub-text">/ {calTarget.toLocaleString()} kcal</span></div>
        <div className="h-3 mt-2 bg-background/50 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min((totalCals / calTarget) * 100, 100)}%`,
              background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
              boxShadow: '0 0 10px rgba(245,158,11,0.3)',
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2.5">
        {[
          { label: 'Protein', value: totalProtein, target: proteinTarget, icon: Beef, color: 'red', unit: 'g' },
          { label: 'Carbs', value: totalCarbs, target: carbTarget, icon: Wheat, color: 'yellow', unit: 'g' },
          { label: 'Fats', value: totalFats, target: fatTarget, icon: Apple, color: 'green', unit: 'g' },
          { label: 'Water', value: (totalHydration / 1000).toFixed(1), target: (hydrationTarget / 1000).toFixed(1), icon: Droplets, color: 'blue', unit: 'L' },
        ].map(m => {
          const numVal = typeof m.value === 'string' ? parseFloat(m.value) : m.value;
          const numTarget = typeof m.target === 'string' ? parseFloat(m.target) : m.target;
          const pct = numTarget > 0 ? Math.min((numVal / numTarget) * 100, 100) : 0;
          const Icon = m.icon;
          const glowMap: Record<string, string> = { red: 'rgba(239,68,68,0.3)', yellow: 'rgba(234,179,8,0.3)', green: 'rgba(34,197,94,0.3)', blue: 'rgba(59,130,246,0.3)' };
          const barMap: Record<string, string> = { red: '#ef4444', yellow: '#eab308', green: '#22c55e', blue: '#3b82f6' };
          return (
            <div key={m.label} className="glass-effect p-3 rounded-[1.5rem] border border-glass-border">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon size={11} className={`text-${m.color}-400`} />
                <span className="text-[8px] font-black text-sub-text uppercase tracking-wider">{m.label}</span>
              </div>
              <div className="text-base font-black text-main-text">
                {m.value}{m.unit} <span className="text-[9px] text-sub-text font-medium">/ {m.target}{m.unit}</span>
              </div>
              <div className="h-1 mt-1.5 bg-background/50 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barMap[m.color], boxShadow: `0 0 6px ${glowMap[m.color]}` }} />
              </div>
            </div>
          );
        })}
      </div>

      {todaysMeals.length > 0 ? (
        <div className="glass-effect p-5 rounded-[2rem] border border-glass-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-black text-main-text uppercase tracking-wider flex items-center gap-2">
              <UtensilsCrossed size={14} className="text-amber-500" /> Today's Meals
            </h2>
            <span className="text-[10px] text-sub-text">{todaysMeals.length} entries</span>
          </div>
          <div className="space-y-3">
            {todaysMeals.sort((a, b) => (a.date || '').localeCompare(b.date || '')).map(meal => {
              const typeLabel = meal.mealType ? (mealTypeLabels[meal.mealType] || meal.mealType) : 'Meal';
              const typeIcon = meal.mealType ? (mealTypeIcons[meal.mealType] || '🍽️') : '🍽️';
              const items = meal.meals || [];
              return (
                <div key={meal.id} className="bg-background/30 rounded-2xl border border-glass-border overflow-hidden">
                  <div className="flex items-center justify-between p-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{typeIcon}</span>
                      <div>
                        <div className="text-sm font-bold text-main-text">{typeLabel}</div>
                        <div className="text-[10px] text-sub-text">{meal.date?.slice(11, 19) || ''} · {items.length} items</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black text-amber-400">{meal.calories} kcal</div>
                      {meal.protein > 0 && <div className="text-[10px] text-red-400 font-medium">{meal.protein}g protein</div>}
                    </div>
                  </div>
                  {items.length > 0 && (
                    <div className="px-3.5 pb-3 space-y-1">
                      {items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-background/30 rounded-xl">
                          <span className="text-[12px] text-main-text font-medium">{item.name}</span>
                          <span className="text-[11px] text-sub-text font-medium">{item.calories} kcal · {item.protein}g P</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="glass-effect p-5 rounded-[2rem] border border-glass-border text-center">
          <div className="text-3xl mb-2">🍽️</div>
          <p className="text-xs text-sub-text font-medium">No meals logged today</p>
          <p className="text-[10px] text-sub-text mt-1">Scan a meal to get started</p>
        </div>
      )}

      <div className="glass-effect p-5 rounded-[2rem] border border-glass-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-black text-main-text uppercase tracking-wider flex items-center gap-2">
            <Pill size={14} className="text-purple-400" /> Supplements
          </h2>
          <span className="text-[10px] text-sub-text">{todaysSupps.filter(s => s.taken).length} / {user?.supplementProtocol?.length || 0} taken</span>
        </div>
        {user?.supplementProtocol?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {user.supplementProtocol.map((sup, i) => {
              const taken = todaysSupps.find(s => s.name === sup.name && s.taken);
              return (
                <div key={i} className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border ${taken ? 'bg-green-500/5 border-green-500/20' : 'bg-background/20 border-glass-border'}`}>
                  <div className="flex items-center gap-2">
                    {taken ? <CircleCheckBig size={14} className="text-green-400" /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-sub-text/40" />}
                    <div>
                      <div className="text-sm font-semibold text-main-text">{sup.name}</div>
                      <div className="text-[9px] text-sub-text">{sup.dosage}</div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold ${taken ? 'text-green-400' : 'text-sub-text'}`}>{taken ? 'Taken' : '—'}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-sub-text text-center py-4">No supplement protocol set in your profile.</div>
        )}
      </div>

      <div className="glass-effect p-5 rounded-[2rem] border border-glass-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-black text-main-text uppercase tracking-wider flex items-center gap-2">
            <Zap size={14} className="text-indigo-400" /> Nutrition Summary
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-background/20 rounded-xl p-3">
            <div className="text-[9px] font-black text-sub-text uppercase tracking-wider">Meal Scans</div>
            <div className="text-lg font-black text-main-text mt-0.5">{user?.aiUsage?.mealScans || 0}</div>
          </div>
          <div className="bg-background/20 rounded-xl p-3">
            <div className="text-[9px] font-black text-sub-text uppercase tracking-wider">Hydration</div>
            <div className="text-lg font-black text-main-text mt-0.5">{(hydrationTarget / 1000).toFixed(1)}L</div>
          </div>
          <div className="bg-background/20 rounded-xl p-3">
            <div className="text-[9px] font-black text-sub-text uppercase tracking-wider">Balance</div>
            <div className={`text-lg font-black mt-0.5 ${totalCals > calTarget ? 'text-red-400' : 'text-green-400'}`}>
              {totalCals - calTarget >= 0 ? '+' : ''}{totalCals - calTarget}
            </div>
          </div>
          <div className="bg-background/20 rounded-xl p-3">
            <div className="text-[9px] font-black text-sub-text uppercase tracking-wider">Water Logs</div>
            <div className="text-lg font-black text-main-text mt-0.5">{todaysWater.length}</div>
          </div>
        </div>
      </div>

      {weekCalories.length > 0 && (
        <div className="glass-effect p-5 rounded-[2rem] border border-glass-border">
          <h2 className="text-xs font-black text-main-text mb-3 uppercase tracking-wider flex items-center gap-2">
            <History size={14} className="text-indigo-400" /> Last 7 Days — Calorie Summary
          </h2>
          <div className="space-y-2">
            {weekCalories.map(d => {
              const pct = Math.min((d.cals / calTarget) * 100, 100);
              return (
                <div key={d.date} className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-sub-text w-14">{d.date}</span>
                  <div className="flex-1 h-3.5 bg-background/30 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 100 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #6366f1, #8b5cf6)', boxShadow: `0 0 6px ${pct >= 100 ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.3)'}` }} />
                  </div>
                  <span className="text-[10px] font-bold text-main-text w-20 text-right">{d.cals.toLocaleString()} kcal</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {user?.bodyMetrics?.foodPreferences?.length > 0 || user?.bodyMetrics?.allergies?.length > 0 ? (
        <div className="glass-effect p-5 rounded-[2rem] border border-glass-border">
          <h2 className="text-xs font-black text-main-text mb-3 uppercase tracking-wider flex items-center gap-2">
            <Target size={14} className="text-blue-400" /> Preferences &amp; Restrictions
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {user?.bodyMetrics?.foodPreferences?.length > 0 && (
              <div>
                <div className="text-[9px] font-black text-sub-text uppercase tracking-wider mb-1.5">Food Preferences</div>
                <div className="flex flex-wrap gap-1.5">
                  {user.bodyMetrics.foodPreferences.map((p, i) => (
                    <span key={i} className="px-2.5 py-1 bg-background/30 rounded-lg text-[10px] text-amber-400 font-medium border border-amber-500/15">{p}</span>
                  ))}
                </div>
              </div>
            )}
            {user?.bodyMetrics?.allergies?.length > 0 && (
              <div>
                <div className="text-[9px] font-black text-sub-text uppercase tracking-wider mb-1.5">Allergies</div>
                <div className="flex flex-wrap gap-1.5">
                  {user.bodyMetrics.allergies.map((a, i) => (
                    <span key={i} className="px-2.5 py-1 bg-red-500/10 rounded-lg text-[10px] text-red-400 font-medium border border-red-500/15">{a}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </motion.div>
  );
};

export default NutritionPage;
