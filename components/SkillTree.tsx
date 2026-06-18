import React from 'react';
import { User, Skill, Realm } from '../types';
import { Dumbbell, Footprints, Activity, Salad, Moon, Zap } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

import { useUserStore } from '../src/store/useUserStore';

interface SkillTreeProps {
  user?: User;
}

const realmConfig = {
  [Realm.Strength]: { icon: <Dumbbell size={20} />, color: "text-accent-red", bg: "bg-accent-red" },
  [Realm.Endurance]: { icon: <Footprints size={20} />, color: "text-accent-blue", bg: "bg-accent-blue" },
  [Realm.Flexibility]: { icon: <Activity size={20} />, color: "text-accent-green", bg: "bg-accent-green" },
  [Realm.Combat]: { icon: <Zap size={20} />, color: "text-accent-yellow", bg: "bg-accent-yellow" },
  [Realm.Nutrition]: { icon: <Salad size={20} />, color: "text-accent-green", bg: "bg-accent-green" },
  [Realm.Recovery]: { icon: <Moon size={20} />, color: "text-accent-tertiary", bg: "bg-accent-tertiary" },
};

const SkillCard: React.FC<{ skill: Skill }> = ({ skill }) => {
  const config = realmConfig[skill.realm] || realmConfig[Realm.Strength];
  const progress = (skill.xp / skill.xpToNextLevel) * 100;

  return (
    <motion.div 
      className="glass-effect p-5 rounded-[2rem] border-2 border-glass-border flex flex-col transition-all duration-300 shadow-[0_10px_30px_var(--shadow-soft)] hover:shadow-[0_0_20px_var(--neon-glow,var(--teddy-glow))] hover:border-accent"
      layout
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`flex items-center space-x-3 font-black text-xl tracking-tight ${config.color}`}>
          <div className="p-2 bg-background/50 rounded-xl border border-glass-border shadow-[inset_0_0_5px_rgba(0,0,0,0.5)] drop-shadow-[0_0_5px_currentColor]">{config.icon}</div>
          <h3 className="drop-shadow-[0_0_2px_currentColor]">{skill.name}</h3>
        </div>
        <span className="font-black text-lg bg-background/50 px-2 py-0.5 rounded-lg border border-glass-border text-main-text shadow-[inset_0_0_5px_rgba(0,0,0,0.5)] drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">Lvl {skill.level}</span>
      </div>
      
      <div className="mb-2">
        <div className="flex justify-between text-[11px] font-bold tracking-widest uppercase text-sub-text mb-1.5 items-center">
            <span>Progress</span>
            <span className="text-main-text drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">{Math.floor(progress)}%</span>
        </div>
        <div className="w-full bg-background rounded-full h-2.5 border border-glass-border p-px overflow-hidden shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className={`h-full ${config.bg} rounded-full relative shadow-[0_0_10px_currentColor]`}
          />
        </div>
      </div>
      <div className="text-[10px] text-sub-text font-bold uppercase tracking-tighter mt-1">
          {skill.xp} / {skill.xpToNextLevel} XP to Level {skill.level + 1}
      </div>
    </motion.div>
  );
};

const SkillTree: React.FC<SkillTreeProps> = ({ user: propUser }) => {
  const storeUser = useUserStore(state => state.user);
  const user = propUser || storeUser;

  if (!user) return null;

  const allSkills = Object.values(user.skill_tree) as Skill[];
  const radarData = Object.keys(realmConfig).map(realm => {
      const skillsInRealm = allSkills.filter(s => s.realm === realm);
      const avgLevel = skillsInRealm.length > 0 
        ? skillsInRealm.reduce((sum, s) => sum + s.level, 0) / skillsInRealm.length 
        : 1;
      return {
          subject: realm,
          A: avgLevel,
          fullMark: 100
      };
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div className="space-y-8 relative z-10" variants={containerVariants} initial="hidden" animate="visible">
      <div className='text-center'>
        <h2 className="text-3xl font-black mb-2 tracking-tight text-main-text drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">Your Skills</h2>
        <p className="text-sub-text mb-8 font-bold">Track your growth and progress in every area.</p>
        
        <motion.div variants={itemVariants} className="w-full max-w-2xl mx-auto h-[350px] glass-effect border-2 border-glass-border rounded-[2.5rem] p-4 shadow-[0_10px_30px_var(--shadow-soft)] mb-10 relative overflow-hidden group">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="var(--glass-border)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 900 }} />
                    <Radar
                        name="Skill Level"
                        dataKey="A"
                        stroke="var(--accent)"
                        fill="var(--accent)"
                        fillOpacity={0.4}
                        dot={{ r: 4, fill: 'var(--accent)', stroke: 'transparent', strokeWidth: 1 }}
                    />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '12px', border: '1px solid var(--glass-border)' }} />
                </RadarChart>
            </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allSkills.map(skill => (
            <motion.div key={skill.id} variants={itemVariants}>
                <SkillCard skill={skill} />
            </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default SkillTree;