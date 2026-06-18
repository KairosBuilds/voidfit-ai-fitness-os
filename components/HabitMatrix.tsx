import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Droplets, Book, Sparkles, Moon, Repeat, CheckCircle2, Circle, 
  Plus, Trash2, Pill, Zap, Flame, Shield, Footprints
} from 'lucide-react';
import { User, Habit, HabitLog, SupplementLog } from '../types';
import { useUserStore } from '../src/store/useUserStore';
import { useAuthStore } from '../src/store/useAuthStore';
import { useDatabase } from '../src/db/useDatabase';
import { reportEventToAi } from '../src/services/aiReactionService';
import { notificationService } from '../src/services/notificationService';

interface HabitMatrixProps {
  user?: User;
  habitLogs?: HabitLog[];
  supplementLogs?: SupplementLog[];
  onToggleHabit?: (habitId: string) => void;
  onToggleSupplement?: (name: string, dosage: string) => void;
  onAddSupplement?: (name: string, dosage: string) => void;
  onDeleteSupplement?: (name: string) => void;
  onAddHabit?: (habit: Habit) => void;
  onDeleteHabit?: (habitId: string) => void;
}

const HabitMatrix: React.FC<HabitMatrixProps> = ({ 
  user: propUser, 
  habitLogs: propHabitLogs, 
  supplementLogs: propSupplementLogs, 
  onToggleHabit: propOnToggleHabit, 
  onToggleSupplement: propOnToggleSupplement, 
  onAddSupplement: propOnAddSupplement, 
  onDeleteSupplement: propOnDeleteSupplement, 
  onAddHabit: propOnAddHabit, 
  onDeleteHabit: propOnDeleteHabit
}) => {
  // Always call hooks unconditionally (React Rules of Hooks)
  const storeUser = useUserStore(state => state.user);
  const addHabit = useUserStore(state => state.addHabit);
  const deleteHabit = useUserStore(state => state.deleteHabit);
  const addSupplement = useUserStore(state => state.addSupplement);

  const { 
    habitLogs: dbHabitLogs, 
    supplementLogs: dbSupplementLogs,
    addHabitLog,
    addSupplementLog,
  } = useDatabase();
  const { apiKey } = useAuthStore();

  // Derive final values — prop takes precedence over store
  const user = propUser ?? storeUser;

  if (!user) {
    return null;
  }

  const habitLogs = propHabitLogs || dbHabitLogs || [];
  const supplementLogs = propSupplementLogs || dbSupplementLogs || [];
  const [activeTab, setActiveTab] = useState<'habits' | 'supplements'>('habits');
  const [showAddSupp, setShowAddSupp] = useState(false);
  const [newSuppName, setNewSuppName] = useState('');
  const [newSuppDosage, setNewSuppDosage] = useState('');

  const [showAddHabit, setShowAddHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState('other');

  const habits = user.habits || [];
  const supplementProtocol = user.supplementProtocol || [];

  const getIcon = (category: string) => {
    switch(category) {
      case 'water': return <Droplets size={20} />;
      case 'reading': return <Book size={20} />;
      case 'skincare': return <Sparkles size={20} />;
      case 'sleep': return <Moon size={20} />;
      default: return <Footprints size={20} />;
    }
  };

  const getColor = (category: string) => {
    switch(category) {
      case 'water': return 'text-accent-blue';
      case 'reading': return 'text-secondary-action';
      case 'skincare': return 'text-accent-purple';
      case 'sleep': return 'text-accent-yellow';
      default: return 'text-accent-green';
    }
  };

  const isCompleted = (habitId: string) => {
    const today = new Date().toISOString().split('T')[0];
    return (habitLogs || []).some(log => log.habitId === habitId && log.date === today && log.completed);
  };

  const isSuppTaken = (name: string) => {
    const today = new Date().toISOString().split('T')[0];
    return (supplementLogs || []).some(log => log.name === name && log.date === today && log.taken);
  };

  return (
    <div className="space-y-8 pb-20 max-w-4xl mx-auto relative z-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-main-text tracking-tight drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">Daily Habits</h2>
          <p className="text-sub-text text-sm font-bold uppercase tracking-widest">Track your daily habits and supplements.</p>
        </div>
        <div className="horizontal-scroll p-1 bg-surface/50 rounded-2xl border border-glass-border shadow-[inset_0_0_5px_rgba(0,0,0,0.5)] custom-scrollbar touch-pan-x">
          <div className="flex gap-1">
            <button 
              onClick={() => setActiveTab('habits')} 
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${activeTab === 'habits' ? 'bg-[var(--plush-gradient,var(--dragon-scale))] bg-accent text-white shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))]' : 'text-sub-text hover:text-main-text'}`}
            >
              Habits
            </button>
            <button 
              onClick={() => setActiveTab('supplements')} 
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${activeTab === 'supplements' ? 'bg-[var(--plush-gradient,var(--dragon-scale))] bg-accent text-white shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))]' : 'text-sub-text hover:text-main-text'}`}
            >
              Supplements
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'habits' ? (
          <motion.div 
            key="habits" 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {habits.map(habit => {
              const done = isCompleted(habit.id);
              const colorClass = getColor(habit.category);
              return (
                <div 
                  key={habit.id}
                  className={`relative overflow-hidden group p-6 rounded-[2.5rem] border-2 transition-all duration-300 flex items-center justify-between shadow-[0_10px_30px_var(--shadow-soft)] ${done ? 'bg-surface/80 border-accent shadow-[0_0_15px_var(--neon-glow,var(--teddy-glow))]' : 'glass-effect border-glass-border hover:border-accent hover:shadow-[0_0_20px_var(--neon-glow,var(--teddy-glow))]'}`}
                >
                  <div 
                    className="flex-1 flex items-center justify-between cursor-pointer"
                    onClick={() => {
                      if (propOnToggleHabit) {
                        propOnToggleHabit(habit.id);
                      } else {
                        const today = new Date().toISOString().split('T')[0];
                        addHabitLog({
                          id: `habit-${habit.id}-${today}`,
                          date: today,
                          habitId: habit.id,
                          completed: !done
                        });
                        if (apiKey && !done) {
                          reportEventToAi(apiKey, user, 'HABIT_COMPLETE', { habitName: habit.name });
                        }
                      }
                    }}
                  >
                    <div className="flex items-center gap-4 relative z-10">
                       <div className={`p-3 rounded-2xl bg-background/50 border border-glass-border shadow-[inset_0_0_5px_rgba(0,0,0,0.5)] ${done ? 'text-accent drop-shadow-[0_0_5px_currentColor]' : colorClass} group-hover:scale-110 transition-all`}>
                          {getIcon(habit.category)}
                       </div>
                       <div className="text-left">
                          <div className="text-[8px] font-black text-sub-text uppercase tracking-[0.2em] mb-1">{habit.frequency}</div>
                          <div className={`text-sm font-black tracking-tight drop-shadow-[0_0_2px_var(--teddy-glow,transparent)] ${done ? 'text-accent' : 'text-main-text'}`}>{habit.name}</div>
                       </div>
                    </div>
                    <div className={`transition-all duration-500 relative z-10 ${done ? 'text-accent scale-110 drop-shadow-[0_0_5px_currentColor]' : 'text-sub-text group-hover:text-accent'}`}>
                       {done ? <CheckCircle2 size={28} /> : <Circle size={28} />}
                    </div>
                  </div>
                  {done && (
                    <motion.div layoutId={`done-glow-${habit.id}`} className="absolute inset-0 bg-[var(--plush-gradient,var(--dragon-scale))] opacity-10 pointer-events-none" />
                  )}
                  <button onClick={(e) => { 
                    e.stopPropagation(); 
                    if (propOnDeleteHabit) {
                      propOnDeleteHabit(habit.id);
                    } else {
                      deleteHabit(habit.id);
                    }
                  }} className="absolute top-4 right-4 text-sub-text hover:text-accent-red opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}

            {/* Add Habit Input */}
            <AnimatePresence>
              {showAddHabit && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="col-span-full space-y-4">
                   <div className="grid grid-cols-2 gap-4 glass-effect p-6 rounded-[2.5rem] border-2 border-accent/30 shadow-[0_0_20px_rgba(217,70,239,0.1)]">
                      <div className="space-y-1">
                         <label className="text-[10px] font-black text-sub-text uppercase tracking-widest ml-1">Habit Name</label>
                         <input type="text" value={newHabitName} onChange={(e) => setNewHabitName(e.target.value)} className="w-full bg-background border border-glass-border rounded-xl px-4 py-3 text-main-text focus:outline-none focus:border-accent shadow-[inset_0_0_5px_rgba(0,0,0,0.5)] focus:shadow-[0_0_10px_rgba(217,70,239,0.3)]" placeholder="Meditation" />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-black text-sub-text uppercase tracking-widest ml-1">Category</label>
                         <select value={newHabitCategory} onChange={(e) => setNewHabitCategory(e.target.value)} className="w-full bg-background border border-glass-border rounded-xl px-4 py-3 text-main-text focus:outline-none focus:border-accent shadow-[inset_0_0_5px_rgba(0,0,0,0.5)] focus:shadow-[0_0_10px_rgba(217,70,239,0.3)]">
                           <option value="water">Water</option>
                           <option value="reading">Reading</option>
                           <option value="skincare">Skincare</option>
                           <option value="sleep">Rest</option>
                           <option value="other">Other</option>
                         </select>
                      </div>
                      <button 
                        onClick={() => {
                          if (newHabitName) {
                            const newHabit: Habit = { 
                                id: newHabitName.toLowerCase().replace(/\s+/g, '-'), 
                                name: newHabitName, 
                                category: newHabitCategory as any, 
                                frequency: 'daily' 
                            };
                            if (propOnAddHabit) {
                              propOnAddHabit(newHabit);
                            } else {
                              addHabit(newHabit);
                            }
                            notificationService.scheduleHabitReminder(newHabit.name, 20, 0);
                            setNewHabitName('');
                            setShowAddHabit(false);
                          }
                        }}
                        className="col-span-2 py-3 bg-[var(--plush-gradient,var(--dragon-scale))] bg-accent text-white font-black uppercase tracking-widest rounded-xl shadow-[0_0_15px_rgba(217,70,239,0.8)] active:scale-95 transition-all hover:shadow-[0_0_25px_rgba(217,70,239,1)] border border-glass-border"
                      >
                        Add Habit
                      </button>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              onClick={() => setShowAddHabit(!showAddHabit)}
              className="col-span-full py-6 bg-surface/30 border-2 border-dashed border-glass-border rounded-[2.5rem] flex flex-col items-center justify-center gap-2 hover:border-accent hover:bg-surface/50 hover:shadow-[inset_0_0_20px_rgba(217,70,239,0.1),0_0_15px_rgba(217,70,239,0.2)] transition-all group shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]"
            >
               <Plus className={`text-sub-text group-hover:text-accent transition-all group-hover:drop-shadow-[0_0_5px_currentColor] ${showAddHabit ? 'rotate-45' : ''}`} />
               <span className="text-[10px] font-black text-sub-text uppercase tracking-widest group-hover:text-main-text">Add New Habit</span>
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="supps" 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 gap-4">
               {supplementProtocol.map((supp, idx) => {
                 const taken = isSuppTaken(supp.name);
                 return (
                   <div key={idx} className={`p-6 rounded-[2.5rem] border-2 transition-all flex items-center justify-between shadow-[0_10px_30px_var(--shadow-soft)] ${taken ? 'bg-surface/80 border-secondary-action shadow-[0_0_15px_rgba(236,72,153,0.5)]' : 'glass-effect border-glass-border hover:border-secondary-action/50 hover:shadow-[0_0_20px_rgba(236,72,153,0.3)]'}`}>
                      <div className="flex items-center gap-4">
                         <div className={`p-3 rounded-2xl bg-background/50 border border-glass-border shadow-[inset_0_0_5px_rgba(0,0,0,0.5)] ${taken ? 'text-secondary-action drop-shadow-[0_0_5px_currentColor]' : 'text-sub-text'}`}>
                            <Pill size={24} />
                         </div>
                         <div>
                            <div className="text-lg font-black text-main-text drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">{supp.name}</div>
                            <div className="text-[10px] font-black text-sub-text uppercase tracking-widest">{supp.dosage}</div>
                         </div>
                      </div>
                      <button 
                        onClick={() => {
                          if (propOnToggleSupplement) {
                            propOnToggleSupplement(supp.name, supp.dosage);
                          } else {
                             const today = new Date().toISOString().split('T')[0];
                             addSupplementLog({
                               id: `supp-${supp.name}-${today}`,
                               date: today,
                               name: supp.name,
                               dosage: supp.dosage,
                               taken: !taken
                             });
                             if (apiKey && !taken) {
                               reportEventToAi(apiKey, user, 'SUPPLEMENT_TAKEN', { name: supp.name, dosage: supp.dosage });
                             }
                          }
                        }}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-glass-border ${taken ? 'bg-secondary-action text-white shadow-[0_0_10px_rgba(236,72,153,0.8)]' : 'bg-background text-sub-text hover:text-main-text hover:bg-surface/50 shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]'}`}
                      >
                        {taken ? 'Done' : 'To Do'}
                      </button>
                   </div>
                 );
               })}

               {/* Add Supplement Input */}
               <AnimatePresence>
                 {showAddSupp && (
                   <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 glass-effect p-6 rounded-[2.5rem] border-2 border-secondary-action/30 shadow-[0_0_20px_rgba(236,72,153,0.1)]">
                         <div className="space-y-1">
                            <label className="text-[10px] font-black text-sub-text uppercase tracking-widest ml-1">Supp Name</label>
                            <input type="text" value={newSuppName} onChange={(e) => setNewSuppName(e.target.value)} className="w-full bg-background border border-glass-border rounded-xl px-4 py-3 text-main-text focus:outline-none focus:border-secondary-action shadow-[inset_0_0_5px_rgba(0,0,0,0.5)] focus:shadow-[0_0_10px_rgba(236,72,153,0.3)]" placeholder="Creatine" />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[10px] font-black text-sub-text uppercase tracking-widest ml-1">Dosage</label>
                            <input type="text" value={newSuppDosage} onChange={(e) => setNewSuppDosage(e.target.value)} className="w-full bg-background border border-glass-border rounded-xl px-4 py-3 text-main-text focus:outline-none focus:border-secondary-action shadow-[inset_0_0_5px_rgba(0,0,0,0.5)] focus:shadow-[0_0_10px_rgba(236,72,153,0.3)]" placeholder="5g" />
                         </div>
                         <button 
                           onClick={() => {
                             if (newSuppName && newSuppDosage) {
                               if (propOnAddSupplement) {
                                 propOnAddSupplement(newSuppName, newSuppDosage);
                               } else {
                                 addSupplement({ name: newSuppName, dosage: newSuppDosage });
                               }
                               setNewSuppName('');
                               setNewSuppDosage('');
                               setShowAddSupp(false);
                             }
                           }}
                           className="col-span-2 py-3 bg-secondary-action text-white font-black uppercase tracking-widest rounded-xl shadow-[0_0_15px_rgba(236,72,153,0.8)] active:scale-95 transition-all hover:shadow-[0_0_25px_rgba(236,72,153,1)] border border-glass-border"
                         >
                           Add Supplement
                         </button>
                      </div>
                   </motion.div>
                 )}
               </AnimatePresence>

               <button 
                 onClick={() => setShowAddSupp(!showAddSupp)}
                 className="w-full py-6 bg-surface/30 border-2 border-dashed border-glass-border rounded-[2.5rem] flex flex-col items-center justify-center gap-2 hover:border-secondary-action hover:bg-surface/50 hover:shadow-[inset_0_0_20px_rgba(236,72,153,0.1),0_0_15px_rgba(236,72,153,0.2)] transition-all group shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]"
               >
                  <Plus className={`text-sub-text group-hover:text-secondary-action transition-all group-hover:drop-shadow-[0_0_5px_currentColor] ${showAddSupp ? 'rotate-45' : ''}`} />
                  <span className="text-[10px] font-black text-sub-text uppercase tracking-widest group-hover:text-main-text">Add New Supplement</span>
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HabitMatrix;
