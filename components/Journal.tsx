import React from 'react';
import { JournalEntry, Quest } from '../types';
import { BookText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QuestCard from './QuestCard';

import { useDatabase } from '../src/db/useDatabase';
import { useQuestStore } from '../src/store/useQuestStore';

interface JournalProps {
  journalEntries?: JournalEntry[];
  quests?: Quest[];
  onCompleteQuest?: (questId: string) => void;
  currentDate?: Date;
}

const Journal: React.FC<JournalProps> = ({ 
  journalEntries: propJournalEntries, 
  quests: propQuests, 
  onCompleteQuest: propOnCompleteQuest, 
  currentDate = new Date() 
}) => {
  const { journalEntries: dbJournalEntries } = useDatabase();
  const { quests: storeQuests, removeQuest } = useQuestStore();
  
  const journalEntries = propJournalEntries || dbJournalEntries || [];
  const quests = propQuests || storeQuests || [];
  const onCompleteQuest = propOnCompleteQuest || ((id: string) => removeQuest(id));
  
  const safeEntries = Array.isArray(journalEntries) ? journalEntries : [];
  const sortedEntries = [...safeEntries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div 
        className="space-y-10 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
    >
      <div className="text-center group relative z-10">
        <h2 className="text-3xl sm:text-4xl font-black text-main-text tracking-tight mb-3 drop-shadow-[0_0_2px_var(--teddy-glow,transparent)] group-hover:drop-shadow-[0_0_15px_var(--neon-glow,var(--teddy-glow))] transition-all">Your Journal</h2>
        <p className="text-sub-text font-bold uppercase tracking-widest text-sm">Reflections on your past progress and future goals.</p>
      </div>
      
      <div className="max-w-4xl mx-auto space-y-8">
        <AnimatePresence>
        {sortedEntries.length > 0 ? sortedEntries.map(entry => {
          const checklistQuests = entry.generatedChecklistQuestIds
            .map(id => quests.find(q => q.id === id))
            .filter((q): q is Quest => !!q);

          return (
            <motion.div 
                key={entry.id} 
                variants={itemVariants}
                layout
                className="glass-effect p-6 sm:p-8 rounded-[2.5rem] border-2 border-glass-border shadow-[0_10px_30px_var(--shadow-soft)] hover:shadow-[0_0_20px_var(--neon-glow,var(--teddy-glow))] hover:border-accent transition-all duration-300"
            >
              <div className="border-b border-glass-border pb-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2 sm:gap-0">
                  <h3 className="text-2xl font-black text-main-text tracking-tight flex items-center gap-3 drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">
                      <div className="p-2 bg-background/50 rounded-xl border border-glass-border text-accent shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
                          <BookText size={20} className="drop-shadow-[0_0_5px_currentColor]" />
                      </div>
                      LOG: {entry.majorGoalTitle}
                  </h3>
                  <span className="text-xs font-bold uppercase tracking-widest text-sub-text bg-background/50 px-3 py-1.5 rounded-lg border border-glass-border shadow-[inset_0_0_5px_rgba(0,0,0,0.5)] shrink-0">{new Date(entry.timestamp).toLocaleDateString()}</span>
                </div>
                <p className="text-main-text leading-relaxed whitespace-pre-wrap font-bold text-[15px] drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">{entry.reflectionText}</p>
              </div>
              <div>
                <h4 className="text-lg font-black text-main-text mb-4 tracking-tight drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">Tasks to Improve</h4>
                {checklistQuests.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {checklistQuests.map(quest => (
                      <QuestCard key={quest.id} quest={quest} onComplete={onCompleteQuest} currentDate={currentDate} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-surface/30 p-4 rounded-xl border-2 border-dashed border-glass-border text-center shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]">
                      <p className="text-sm text-sub-text font-black uppercase tracking-widest drop-shadow-[0_0_2px_rgba(0,0,0,0.5)]">All sequential improvements completed.</p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        }) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 px-6 bg-surface/30 border-2 border-dashed border-glass-border rounded-[2.5rem] flex flex-col items-center justify-center shadow-[inset_0_0_15px_rgba(0,0,0,0.2)] max-w-2xl mx-auto"
          >
            <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full shadow-[0_0_20px_var(--neon-glow,var(--teddy-glow))]"></div>
                <BookText className="w-16 h-16 text-sub-text relative z-10 drop-shadow-[0_0_5px_currentColor]" />
            </div>
            <h3 className="text-2xl font-black text-main-text mb-2 tracking-tight drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">No Entries Yet</h3>
            <p className="text-sub-text max-w-sm mx-auto leading-relaxed font-bold">Your journal is currently empty. Start logging your thoughts and goals to see them here.</p>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Journal;
