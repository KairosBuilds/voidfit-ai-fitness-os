import React from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Brain } from 'lucide-react';

interface StatsRadarProps {
  data: any[];
  level: number;
  rank: string;
}

export const StatsRadar: React.FC<StatsRadarProps> = ({ data, level, rank }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }} 
    animate={{ opacity: 1, scale: 1 }}
    className="glass-effect border-2 border-glass-border rounded-[2.5rem] p-6 shadow-[0_10px_30px_var(--shadow-soft)] relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 p-6 opacity-5">
      <Brain size={120} className="text-accent drop-shadow-[0_0_5px_currentColor]" />
    </div>
    <h2 className="text-xl font-black text-main-text uppercase tracking-tight mb-8 flex items-center gap-3">
      <TrendingUp className="text-accent drop-shadow-[0_0_5px_currentColor]" />
      Your Stats
    </h2>
    
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="var(--glass-border)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 9, fontWeight: 900 }} />
          <Radar
            name="Attribute Balance"
            dataKey="A"
            stroke="var(--accent)"
            fill="var(--accent)"
            fillOpacity={0.2}
            dot={{ r: 4, fill: 'var(--accent)', stroke: 'transparent', strokeWidth: 2 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>

    <div className="grid grid-cols-2 gap-4 mt-8">
      <div className="p-4 rounded-2xl bg-surface/50 border border-glass-border shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
        <div className="text-[9px] font-black text-sub-text uppercase tracking-widest mb-1">Level</div>
        <div className="text-3xl font-black text-main-text tabular-nums">{level}</div>
      </div>
      <div className="p-4 rounded-2xl bg-surface/50 border border-glass-border shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
        <div className="text-[9px] font-black text-sub-text uppercase tracking-widest mb-1">Rank</div>
        <div className="text-3xl font-black text-accent tracking-tight">{rank.split(' ')[0]}</div>
      </div>
    </div>
  </motion.div>
);
