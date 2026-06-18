import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Salad, Droplets, Zap, X, Plus, Trash2 } from 'lucide-react';
import { NutritionLog } from '../types';
import { reportEventToAi } from '../src/services/aiReactionService';
import { useAuthStore } from '../src/store/useAuthStore';
import { useUserStore } from '../src/store/useUserStore';

interface LogNutritionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (log: Partial<NutritionLog>) => void;
}

const LogNutritionModal: React.FC<LogNutritionModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [hydration, setHydration] = useState('');
  const [meals, setMeals] = useState<{ name: string; calories: number; protein: number }[]>([]);
  const [newMealName, setNewMealName] = useState('');
  const [newMealCals, setNewMealCals] = useState('');
  const [newMealProtein, setNewMealProtein] = useState('');
  const { apiKey } = useAuthStore();
  const { user } = useUserStore();

  const handleAddMeal = () => {
    if (newMealName && newMealCals) {
      const meal = {
        name: newMealName,
        calories: parseInt(newMealCals),
        protein: parseInt(newMealProtein) || 0
      };
      setMeals([...meals, meal]);
      setCalories(prev => (parseInt(prev || '0') + meal.calories).toString());
      setProtein(prev => (parseInt(prev || '0') + meal.protein).toString());
      setNewMealName('');
      setNewMealCals('');
      setNewMealProtein('');
    }
  };

  const handleRemoveMeal = (index: number) => {
    const meal = meals[index];
    setCalories(prev => (parseInt(prev || '0') - meal.calories).toString());
    setProtein(prev => (parseInt(prev || '0') - meal.protein).toString());
    setMeals(meals.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      date: new Date().toISOString(),
      calories: parseInt(calories) || 0,
      protein: parseInt(protein) || 0,
      hydration_ml: parseInt(hydration) || 0,
      meals
    });
    
    if (apiKey && user) {
      reportEventToAi(apiKey, user, 'MEAL_LOG', { 
        calories: parseInt(calories) || 0, 
        protein: parseInt(protein) || 0,
        mealCount: meals.length 
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg glass-effect border-2 border-glass-border rounded-3xl overflow-hidden shadow-[0_20px_60px_var(--shadow-soft)]"
      >
        <div className="p-6 border-b border-glass-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-green/10 rounded-xl text-accent-green">
              <Salad size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-main-text tracking-tight drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">Nutrition Log</h2>
              <p className="text-[10px] text-sub-text font-black uppercase tracking-widest">Track your food and water</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface/50 rounded-xl transition-colors">
            <X size={20} className="text-sub-text hover:text-main-text transition-colors" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-sub-text">Calories</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={calories} 
                  onChange={e => setCalories(e.target.value)}
                  className="w-full bg-surface/50 border border-glass-border rounded-xl px-4 py-3 text-main-text focus:outline-none focus:border-accent-green focus:shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all"
                  placeholder="2000"
                />
                <Zap size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-accent-yellow" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-sub-text">Protein (g)</label>
              <input 
                type="number" 
                value={protein} 
                onChange={e => setProtein(e.target.value)}
                className="w-full bg-surface/50 border border-glass-border rounded-xl px-4 py-3 text-main-text focus:outline-none focus:border-accent-green focus:shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all"
                placeholder="150"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-sub-text">Water (ml)</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={hydration} 
                  onChange={e => setHydration(e.target.value)}
                  className="w-full bg-surface/50 border border-glass-border rounded-xl px-4 py-3 text-main-text focus:outline-none focus:border-accent-blue focus:shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all"
                  placeholder="2000"
                />
                <Droplets size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-accent-blue" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-main-text drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">Meals Today</h3>
              <span className="text-[10px] text-sub-text font-bold">{meals.length} items logged</span>
            </div>
            
            <div className="space-y-3">
              {meals.map((meal, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-surface/50 rounded-xl border border-glass-border shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]">
                  <div>
                    <div className="text-sm font-bold text-main-text">{meal.name}</div>
                    <div className="text-[10px] text-sub-text">{meal.calories} kcal • {meal.protein}g protein</div>
                  </div>
                  <button type="button" onClick={() => handleRemoveMeal(i)} className="text-sub-text hover:text-accent-red transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-12 gap-2 p-3 bg-surface/50 rounded-2xl border border-glass-border shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]">
              <div className="col-span-6">
                <input 
                  type="text" 
                  value={newMealName}
                  onChange={e => setNewMealName(e.target.value)}
                  placeholder="Meal name"
                  className="w-full bg-transparent border-none text-sm text-main-text focus:outline-none placeholder:text-sub-text"
                />
              </div>
              <div className="col-span-2">
                <input 
                  type="number" 
                  value={newMealCals}
                  onChange={e => setNewMealCals(e.target.value)}
                  placeholder="Cal"
                  className="w-full bg-transparent border-none text-sm text-main-text focus:outline-none placeholder:text-sub-text"
                />
              </div>
              <div className="col-span-2">
                <input 
                  type="number" 
                  value={newMealProtein}
                  onChange={e => setNewMealProtein(e.target.value)}
                  placeholder="Pro"
                  className="w-full bg-transparent border-none text-sm text-main-text focus:outline-none placeholder:text-sub-text"
                />
              </div>
              <div className="col-span-2 flex justify-end">
                <button 
                  type="button" 
                  onClick={handleAddMeal}
                  className="p-2 bg-accent-green text-background rounded-lg transition-transform active:scale-90 hover:shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        </form>

        <div className="p-6 bg-surface/50 border-t border-glass-border shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]">
          <button 
            onClick={handleSubmit}
            className="w-full py-4 bg-accent-green hover:opacity-90 text-background font-black rounded-2xl shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all active:scale-[0.98] uppercase tracking-widest"
          >
            Save Entry
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default LogNutritionModal;
