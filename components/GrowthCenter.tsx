import React, { useState } from 'react';
import { User, Realm } from '../types';
import { 
  Dumbbell, Footprints, Activity, Salad, Moon, Zap, 
  Trophy,
  Target, Zap as ZapIcon, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BodyAnatomy from './BodyAnatomy';

import { useUserStore } from '../src/store/useUserStore';
import { StatsRadar } from './GrowthCenter/StatsRadar';
import { RealmSelector } from './GrowthCenter/RealmSelector';
import { TrainingModule } from './GrowthCenter/TrainingModule';

interface GrowthCenterProps {
  user?: User;
  onLogProgress?: (realm: Realm, amount: number, metric?: string) => void;
  onAllocateStat?: (realm: Realm) => void;
}

const realmConfig = {
  [Realm.Strength]: { icon: <Dumbbell size={20} />, color: "text-accent-red", bg: "bg-accent-red", border: "border-accent-red/20", lightBg: "bg-accent-red/10" },
  [Realm.Endurance]: { icon: <Footprints size={20} />, color: "text-accent-blue", bg: "bg-accent-blue", border: "border-accent-blue/20", lightBg: "bg-accent-blue/10" },
  [Realm.Flexibility]: { icon: <Activity size={20} />, color: "text-accent-green", bg: "bg-accent-green", border: "border-accent-green/20", lightBg: "bg-accent-green/10" },
  [Realm.Combat]: { icon: <Zap size={20} />, color: "text-accent-yellow", bg: "bg-accent-yellow", border: "border-accent-yellow/20", lightBg: "bg-accent-yellow/10" },
  [Realm.Nutrition]: { icon: <Salad size={20} />, color: "text-accent-green", bg: "bg-accent-green", border: "border-accent-green/20", lightBg: "bg-accent-green/10" },
  [Realm.Recovery]: { icon: <Moon size={20} />, color: "text-accent-tertiary", bg: "bg-accent-tertiary", border: "border-accent-tertiary/20", lightBg: "bg-accent-tertiary/10" },
  "Bio-Map": { icon: <Target size={20} />, color: "text-accent", bg: "bg-accent", border: "border-accent/20", lightBg: "bg-accent/10" },
};

const trainingModules: Record<Realm, { name: string, unit: string, xp: number }[]> = {
  [Realm.Strength]: [
    { name: "Pushups", unit: "Reps", xp: 5 },
    { name: "Pullups", unit: "Reps", xp: 15 },
    { name: "Squats", unit: "Reps", xp: 8 },
    { name: "Deadlift", unit: "KG", xp: 50 },
    { name: "Bench Press", unit: "KG", xp: 30 },
    { name: "Overhead Press", unit: "KG", xp: 25 },
    { name: "Barbell Rows", unit: "KG", xp: 25 },
    { name: "Dips", unit: "Reps", xp: 10 },
    { name: "Lunges", unit: "Reps", xp: 7 },
    { name: "Plank", unit: "Mins", xp: 50 }
  ],
  [Realm.Endurance]: [
    { name: "Running", unit: "KM", xp: 100 },
    { name: "Cycling", unit: "KM", xp: 40 },
    { name: "Swimming", unit: "Meters", xp: 2 },
    { name: "Jump Rope", unit: "Mins", xp: 20 },
    { name: "Rowing", unit: "KM", xp: 80 },
    { name: "Hiking", unit: "KM", xp: 60 },
    { name: "Stair Climber", unit: "Floors", xp: 15 },
    { name: "Sprints", unit: "Reps", xp: 30 }
  ],
  [Realm.Flexibility]: [
    { name: "Deep Stretching", unit: "Mins", xp: 15 },
    { name: "Yoga Session", unit: "Mins", xp: 25 },
    { name: "Mobility Drills", unit: "Mins", xp: 20 },
    { name: "Foam Rolling", unit: "Mins", xp: 10 },
    { name: "Pilates", unit: "Mins", xp: 30 }
  ],
  [Realm.Combat]: [
    { name: "Shadow Boxing", unit: "Mins", xp: 30 },
    { name: "Heavy Bag", unit: "Mins", xp: 40 },
    { name: "Grappling", unit: "Mins", xp: 60 },
    { name: "Muay Thai", unit: "Mins", xp: 50 },
    { name: "BJJ Drills", unit: "Mins", xp: 45 }
  ],
  [Realm.Nutrition]: [
    { name: "Clean Meal", unit: "Meal", xp: 50 },
    { name: "Protein Intake", unit: "Grams", xp: 1 },
    { name: "Fasting", unit: "Hours", xp: 10 },
    { name: "Water Goal", unit: "Goal %", xp: 100 },
    { name: "Keto Day", unit: "Day", xp: 100 }
  ],
  [Realm.Recovery]: [
    { name: "Deep Sleep", unit: "Hours", xp: 100 },
    { name: "Cold Plunge", unit: "Mins", xp: 50 },
    { name: "Meditation", unit: "Mins", xp: 30 },
    { name: "Sauna", unit: "Mins", xp: 20 },
    { name: "Nap", unit: "Mins", xp: 10 }
  ],

};

const GrowthCenter: React.FC<GrowthCenterProps> = ({ 
  user: propUser, 
  onLogProgress: propOnLog, 
  onAllocateStat: propOnAllocate 
}) => {
  const storeUser = useUserStore(state => state.user);
  const storeOnLog = useUserStore(state => state.handleGrantReward);
  const storeOnAllocate = useUserStore(state => state.allocateStatPoint);
  
  const user = propUser || storeUser;
  const onLogProgress = propOnLog || ((realm: Realm, amount: number, metric?: string) => storeOnLog(amount, realm, metric || 'Manual Log'));
  const onAllocateStat = propOnAllocate || storeOnAllocate;

  const [activeTab, setActiveTab] = useState<Realm | 'Bio-Map'>(Realm.Strength);
  const [selectedModule, setSelectedModule] = useState<{ name: string, unit: string, xp: number } | null>(null);
  const [logValue, setLogValue] = useState('');

  if (!user) return null;

  const radarData = (Object.keys(Realm) as Array<keyof typeof Realm>).map(key => ({
    subject: Realm[key],
    A: user.stats[Realm[key]] || 0,
    fullMark: 100,
  }));

  const activeSkill = activeTab !== 'Bio-Map' ? user.skill_tree[activeTab] : null;

  const handleLog = () => {
    if (!selectedModule || !logValue) return;
    let amount = parseFloat(logValue);
    if (isNaN(amount) || amount <= 0) return;
    
    const module = selectedModule;
    let cap = 9999;
    if (module.unit === 'Reps') cap = 200;
    if (module.unit === 'KM') cap = 100;
    if (module.unit === 'Mins') cap = 300;
    
    if (amount > cap) amount = cap;
    
    const xpReward = Math.min(amount * module.xp, 2500);
    onLogProgress(activeTab as Realm, xpReward, `${amount} ${module.unit} of ${module.name}`);
    
    setLogValue('');
    setSelectedModule(null);
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto pb-32 px-4 sm:px-0 relative z-10">
      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 items-start">
        {/* Left: Stats & Radar */}
        <div className="w-full lg:w-[400px] space-y-6">
           <StatsRadar data={radarData} level={user.level_overall} rank={user.rank} />

            {/* Stat Allocation Section */}
            {user.stat_points > 0 && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-6 glass-effect border-2 border-accent/50 rounded-[2rem] shadow-[0_0_20px_rgba(217,70,239,0.11)] space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ZapIcon className="text-accent" size={20} />
                    <h3 className="text-sm font-black text-main-text uppercase tracking-widest">Points</h3>
                  </div>
                  <div className="text-2xl font-black text-accent">{user.stat_points}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(Realm) as Array<keyof typeof Realm>).map(key => {
                    const realm = Realm[key];
                    return (
                      <button 
                        key={realm}
                        onClick={() => onAllocateStat(realm)}
                        className="flex items-center justify-between p-3 rounded-xl bg-surface/50 border border-glass-border hover:border-accent transition-all group"
                      >
                        <span className="text-[9px] font-black text-sub-text uppercase group-hover:text-main-text">{realm}</span>
                        <Plus size={12} className="text-accent" />
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

           <div className="p-6 bg-accent/10 border border-accent/20 rounded-[2rem]">
              <div className="flex items-center gap-3 mb-4">
                 <Trophy size={18} className="text-accent" />
                 <h3 className="text-sm font-black text-main-text uppercase tracking-widest">How to Level Up</h3>
              </div>
              <p className="text-[11px] text-sub-text leading-relaxed font-bold">
                 Logging your workouts and habits directly helps you level up faster. Choose an exercise below to add progress.
              </p>
           </div>
        </div>

        {/* Right: Growth Tabs & Modules */}
        <div className="flex-1 space-y-6 w-full min-w-0">
           <RealmSelector 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              realmConfig={realmConfig} 
              setSelectedModule={setSelectedModule} 
           />

           {/* Active Tab Content */}
           <AnimatePresence mode="wait">
              <motion.div 
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                  {activeTab === 'Bio-Map' ? (
                     <BodyAnatomy user={user} />
                  ) : (
                    <>
                 {/* Skill Stats */}
                 {activeSkill && (
                   <div className="p-6 sm:p-8 glass-effect border-2 border-glass-border rounded-[2.5rem] shadow-[0_10px_30px_var(--shadow-soft)] relative overflow-hidden">
                      <div className={`absolute top-0 right-0 p-8 sm:p-12 opacity-10 ${realmConfig[activeTab].color}`}>
                         {React.cloneElement(realmConfig[activeTab].icon as React.ReactElement, { size: 100 })}
                      </div>
                      
                      <div className="flex items-center justify-between mb-8 relative z-10">
                         <div>
                            <div className="text-[10px] font-black text-sub-text uppercase tracking-[0.3em] mb-1">Active Specialization</div>
                            <h3 className="text-2xl sm:text-3xl font-black text-main-text tracking-tight uppercase">{activeSkill.name}</h3>
                         </div>
                         <div className={`px-4 py-2 rounded-2xl border ${realmConfig[activeTab].border} ${realmConfig[activeTab].lightBg} ${realmConfig[activeTab].color} font-black text-lg sm:text-xl tabular-nums`}>
                            LVL {activeSkill.level}
                         </div>
                      </div>

                      <div className="space-y-3 relative z-10">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-sub-text">
                          <span>Progress to Level {activeSkill.level + 1}</span>
                          <span className="tabular-nums">{activeSkill.xp} / {activeSkill.xpToNextLevel} XP</span>
                        </div>
                        <div className="h-4 bg-background/50 rounded-full overflow-hidden border border-glass-border p-0.5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(activeSkill.xp / activeSkill.xpToNextLevel) * 100}%` }}
                            className={`h-full rounded-full xp-bar-fill shadow-[0_0_10px_currentColor] ${realmConfig[activeTab].bg}`}
                          />
                        </div>
                      </div>
                   </div>
                 )}

                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                   {trainingModules[activeTab as Realm]?.map((module, idx) => (
                     <TrainingModule 
                       key={idx}
                       module={module}
                       isSelected={selectedModule?.name === module.name}
                       onClick={() => setSelectedModule(module)}
                       realmColor={realmConfig[activeTab].color}
                     />
                   ))}
                 </div>

                 {selectedModule && (
                   <motion.div 
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="glass-effect border-2 border-accent p-6 rounded-[2rem] shadow-[0_0_30px_rgba(217,70,239,0.2)]"
                   >
                     <div className="flex items-center justify-between mb-6">
                       <h4 className="text-sm font-black text-main-text uppercase tracking-widest">Logging: {selectedModule.name}</h4>
                       <span className="text-[10px] font-bold text-accent uppercase">+{selectedModule.xp} XP / {selectedModule.unit}</span>
                     </div>
                     <div className="flex gap-4">
                       <input 
                         type="number" 
                         value={logValue}
                         onChange={(e) => setLogValue(e.target.value)}
                         placeholder={`Amount in ${selectedModule.unit}`}
                         className="flex-1 bg-background/50 border-2 border-glass-border rounded-xl px-4 py-3 text-sm font-bold text-main-text focus:border-accent transition-all"
                       />
                       <button 
                         onClick={handleLog}
                         className="px-8 py-3 bg-primary-action text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-[0_0_15px_rgba(157,0,255,0.4)] active:scale-95 transition-all"
                       >
                         Log Progress
                       </button>
                     </div>
                   </motion.div>
                 )}
                    </>
                  )}
              </motion.div>
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default GrowthCenter;
