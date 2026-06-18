import React from 'react';
import { StoryLogEntry } from '../types';
import { BookMarked } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDatabase } from '../src/db/useDatabase';

interface StoryLogProps {
  logs?: StoryLogEntry[];
}

const StoryLog: React.FC<StoryLogProps> = ({ logs: propLogs }) => {
  const { storyLog } = useDatabase();
  const entries = propLogs || storyLog || [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <motion.div 
        className="space-y-10 max-w-4xl mx-auto relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
    >
      <div className="text-center group relative z-10">
        <h2 className="text-3xl sm:text-4xl font-black text-main-text tracking-tight mb-3 drop-shadow-[0_0_2px_var(--teddy-glow,transparent)] group-hover:drop-shadow-[0_0_15px_var(--neon-glow,var(--teddy-glow))] transition-all">Your Journey</h2>
        <p className="text-sub-text font-bold uppercase tracking-widest text-sm">A history of your progress and achievements.</p>
      </div>
      
      <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-glass-border before:to-transparent">
        {entries.map((entry, index) => (
          <motion.div 
            key={entry.id} 
            variants={itemVariants}
            className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
          >
            {/* Timeline Marker */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-[var(--plush-gradient,var(--dragon-scale))] bg-accent shadow-[0_0_15px_var(--neon-glow,var(--teddy-glow))] md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 shrink-0">
                <BookMarked className="w-4 h-4 text-white drop-shadow-[0_0_5px_currentColor]" />
            </div>
            
            {/* Content Card */}
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] glass-effect p-6 sm:p-8 rounded-[2.5rem] border-2 border-glass-border shadow-[0_10px_30px_var(--shadow-soft)] hover:shadow-[0_0_20px_var(--neon-glow,var(--teddy-glow))] hover:border-accent transition-all duration-300">
               <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-4 gap-2 sm:gap-0">
                <h3 className="text-xl sm:text-2xl font-black text-main-text tracking-tight leading-tight group-hover:text-accent transition-colors drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">{entry.title}</h3>
                <span className="text-xs font-bold uppercase tracking-widest text-sub-text bg-background/50 px-3 py-1.5 rounded-lg border border-glass-border shadow-[inset_0_0_5px_rgba(0,0,0,0.5)] shrink-0">{entry.date}</span>
              </div>
              <p className="text-main-text leading-relaxed whitespace-pre-line font-bold text-[15px] drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">{entry.narrative}</p>
            </div>
          </motion.div>
        ))}
        {entries.length === 0 && (
             <motion.div 
                variants={itemVariants}
                className="text-center py-20 px-6 bg-surface/30 rounded-[2.5rem] border-2 border-dashed border-glass-border shadow-[inset_0_0_15px_rgba(0,0,0,0.2)] max-w-2xl mx-auto"
            >
                <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full shadow-[0_0_20px_var(--neon-glow,var(--teddy-glow))]"></div>
                    <BookMarked className="w-16 h-16 text-sub-text relative z-10 drop-shadow-[0_0_5px_currentColor]" />
                </div>
                <h3 className="text-2xl font-black text-main-text mb-2 tracking-tight drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">No Story Yet</h3>
                <p className="text-sub-text font-bold max-w-sm mx-auto leading-relaxed">Your story is just beginning. Complete your goals to see a summary of your week here.</p>
            </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default StoryLog;