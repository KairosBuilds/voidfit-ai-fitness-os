import React from 'react';
import { RANKS, MISSION_XP_MAP } from '../constants';
import { Dna, TrendingUp, Zap, Flame, Shield, Dumbbell } from 'lucide-react';

const SystemMechanics: React.FC = () => {
  return (
    <div className="space-y-8 pb-10">
      <div className="text-center relative z-10">
        <h2 className="text-2xl sm:text-3xl font-black flex items-center justify-center gap-3 tracking-tight text-main-text drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">
          <Dna className="text-accent drop-shadow-[0_0_5px_currentColor]" />
          HOW THE APP WORKS
        </h2>
        <p className="text-sub-text font-bold mt-1 uppercase tracking-widest text-xs">The logic behind your training and progress.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Leveling Logic */}
        <section className="glass-effect border-2 border-glass-border p-6 rounded-[2.5rem] shadow-[0_10px_30px_var(--shadow-soft)] relative z-10">
          <h3 className="text-xl font-black mb-4 flex items-center gap-2 text-main-text uppercase tracking-tighter drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">
            <TrendingUp size={20} className="text-accent drop-shadow-[0_0_5px_currentColor]" />
            How You Level Up
          </h3>
          <div className="space-y-4">
            <div className="bg-surface/30 p-4 rounded-2xl border border-glass-border shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]">
              <p className="text-[10px] font-black text-sub-text uppercase tracking-widest mb-2">Experience Needed</p>
              <code className="text-accent text-xs font-mono bg-background/50 px-3 py-1 rounded-lg border border-glass-border shadow-[inset_0_0_5px_rgba(0,0,0,0.5)] drop-shadow-[0_0_2px_currentColor]">Next_XP = Math.floor(Current_XP * 1.1)</code>
              <p className="text-[10px] text-main-text font-bold mt-3 leading-relaxed">
                Each level needs 10% more experience than the last, making progress more challenging as you grow.
              </p>
            </div>
            <div className="bg-surface/30 p-4 rounded-2xl border border-glass-border shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]">
              <p className="text-[10px] font-black text-sub-text uppercase tracking-widest mb-3">Ranks</p>
              <div className="space-y-2">
                {RANKS.map((rank, index) => (
                  <div key={index} className="flex justify-between items-center text-[10px] font-black">
                    <span className="text-sub-text">LVL {rank.minLevel}+</span>
                    <span className="text-accent uppercase drop-shadow-[0_0_2px_currentColor]">{rank.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Reward Mechanics */}
        <section className="glass-effect border-2 border-glass-border p-6 rounded-[2.5rem] shadow-[0_10px_30px_var(--shadow-soft)] relative z-10">
          <h3 className="text-xl font-black mb-4 flex items-center gap-2 text-main-text uppercase tracking-tighter drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">
            <Zap size={20} className="text-accent drop-shadow-[0_0_5px_currentColor]" />
            Rewards
          </h3>
          <div className="space-y-4">
            <div className="bg-surface/30 p-4 rounded-2xl border border-glass-border shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]">
              <p className="text-[10px] font-black text-sub-text uppercase tracking-widest mb-3">Experience (XP)</p>
              <div className="space-y-2">
                 {Object.entries(MISSION_XP_MAP).map(([difficulty, xp]) => (
                   <div key={difficulty} className="flex justify-between text-[10px] font-black">
                     <span className="text-sub-text uppercase">{difficulty} PLAN</span>
                     <span className="text-accent drop-shadow-[0_0_2px_currentColor]">+{xp} XP</span>
                   </div>
                 ))}
              </div>
            </div>
            <div className="bg-surface/30 p-4 rounded-2xl border border-glass-border shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]">
              <p className="text-[10px] font-black text-sub-text uppercase tracking-widest mb-2">Daily Streaks</p>
              <p className="text-[10px] text-main-text leading-relaxed font-bold">
                Keep your streak alive to earn more XP. Every 7 days, you'll get double XP for your workout.
              </p>
            </div>
          </div>
        </section>

        {/* Skill Dynamics */}
        <section className="glass-effect border-2 border-glass-border p-6 rounded-[2.5rem] shadow-[0_10px_30px_var(--shadow-soft)] relative z-10">
          <h3 className="text-xl font-black mb-4 flex items-center gap-2 text-main-text uppercase tracking-tighter drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">
            <Dumbbell size={20} className="text-accent drop-shadow-[0_0_5px_currentColor]" />
            Skill Growth
          </h3>
          <div className="bg-surface/30 p-4 rounded-2xl border border-glass-border shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]">
            <p className="text-[10px] font-black text-sub-text uppercase tracking-widest mb-2">XP Rates</p>
            <p className="text-[10px] text-main-text leading-relaxed font-bold">
              Harder workouts and skills (like Strength) give you more XP because they take more effort.
            </p>
          </div>
        </section>

        {/* System Safeguards */}
        <section className="glass-effect border-2 border-glass-border p-6 rounded-[2.5rem] shadow-[0_10px_30px_var(--shadow-soft)] relative z-10">
          <h3 className="text-xl font-black mb-4 flex items-center gap-2 text-main-text uppercase tracking-tighter drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">
            <Shield size={20} className="text-accent drop-shadow-[0_0_5px_currentColor]" />
            Safety Rules
          </h3>
          <div className="space-y-4">
             <div className="flex items-start gap-4 p-4 bg-surface/30 rounded-2xl border border-glass-border shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]">
               <div className="p-2 rounded-xl bg-background/50 border border-glass-border text-accent-red mt-1 shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]"><Flame size={16} className="drop-shadow-[0_0_2px_currentColor]" /></div>
               <div>
                  <p className="text-[10px] font-black text-main-text uppercase tracking-widest mb-1 drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">Injury Mode</p>
                  <p className="text-[10px] text-main-text font-bold">If you report an injury, your plan will automatically switch to recovery and mobility exercises.</p>
               </div>
             </div>
             <div className="flex items-start gap-4 p-4 bg-surface/30 rounded-2xl border border-glass-border shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]">
               <div className="p-2 rounded-xl bg-background/50 border border-glass-border text-accent mt-1 shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]"><Zap size={16} className="drop-shadow-[0_0_2px_currentColor]" /></div>
               <div>
                  <p className="text-[10px] font-black text-main-text uppercase tracking-widest mb-1 drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">Fatigue Protection</p>
                  <p className="text-[10px] text-main-text font-bold">We track how sore you are. If you're too tired, the app will suggest a rest day.</p>
               </div>
             </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SystemMechanics;
