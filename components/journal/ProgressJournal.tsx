import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Flame, Target, Calendar, Sparkles, Loader2 } from 'lucide-react';
import { useDatabase } from '../../src/db/useDatabase';
import { ProgressJournalEntry } from '../../src/types/app';
import { summarizeWeeklyJourney } from '../../services/geminiService';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useUserStore } from '../../src/store/useUserStore';
import { toast } from '../../src/store/useToastStore';

export const ProgressJournal: React.FC = () => {
  const { journalEntries } = useDatabase();
  const { apiKey } = useAuthStore();
  const { user } = useUserStore();
  const [aiSummary, setAiSummary] = useState('');
  const [summaryBusy, setSummaryBusy] = useState(false);

  const entries = journalEntries || [];

  const runAiWeeklySummary = async () => {
    if (!apiKey?.trim()) {
      toast.error('Configure your API key in Settings to run AI summaries.');
      return;
    }
    if (!user) return;
    setSummaryBusy(true);
    try {
      const logs = entries.map((e) => ({
        date: new Date(e.timestamp).toISOString().split('T')[0],
        content: `${e.title}: ${e.description}`,
      }));
      const text = await summarizeWeeklyJourney(apiKey, user, logs);
      setAiSummary(text);
    } catch {
      toast.error('Could not generate summary.');
    } finally {
      setSummaryBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main-text">Progress Journal</h1>
          <span className="text-sm text-sub-text">{entries.length} milestones</span>
        </div>
        <button
          type="button"
          disabled={summaryBusy || entries.length === 0}
          onClick={() => void runAiWeeklySummary()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent/15 border border-accent/40 text-accent text-xs font-black uppercase tracking-widest hover:bg-accent/25 transition-colors disabled:opacity-40"
        >
          {summaryBusy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          AI week recap
        </button>
      </div>

      {aiSummary && (
        <div className="glass-effect rounded-2xl p-5 border border-glass-border">
          <h2 className="text-xs font-black text-accent uppercase tracking-widest mb-2">Coach summary</h2>
          <p className="text-sm text-main-text whitespace-pre-wrap leading-relaxed">{aiSummary}</p>
        </div>
      )}

      <div className="space-y-4">
        {entries.length === 0 ? (
          <EmptyState />
        ) : (
          entries.map((entry, index) => (
            <JournalCard 
              key={entry.id} 
              entry={entry}
              index={index}
            />
          ))
        )}
      </div>
    </div>
  );
};

const JournalCard: React.FC<{ entry: ProgressJournalEntry; index: number }> = ({ 
  entry, 
  index 
}) => {
  const Icon = getIconForType(entry.type);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="glass-effect rounded-2xl p-5 border border-glass-border"
    >
      <div className="flex items-start gap-4">
        <div 
          className="p-3 rounded-xl"
          style={{ 
            background: 'var(--primary-action)20',
            color: 'var(--primary-action)'
          }}
        >
          <Icon size={24} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">
              {entry.type.replace('_', ' ')}
            </span>
            <span className="text-xs text-sub-text">
              {new Date(entry.timestamp).toLocaleDateString()}
            </span>
          </div>
          
          <h3 className="text-lg font-semibold text-main-text mb-2">
            {entry.title}
          </h3>
          
          <p className="text-sm text-sub-text mb-3">
            {entry.description}
          </p>
          
          {entry.metricChange && (
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp size={16} className="text-accent-green" />
              <span className="text-main-text">
                {entry.metricChange.metric}: {entry.metricChange.previous} → {entry.metricChange.current} {entry.metricChange.unit}
              </span>
            </div>
          )}
          
          {entry.xpAward && entry.xpAward > 0 && (
            <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent-yellow/20 text-accent-yellow text-sm font-semibold">
              <Trophy size={14} />
              +{entry.xpAward} XP
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const EmptyState: React.FC = () => (
  <div className="text-center py-12">
    <Calendar size={48} className="mx-auto mb-4 text-sub-text opacity-50" />
    <h3 className="text-lg font-semibold text-main-text mb-2">No milestones yet</h3>
    <p className="text-sm text-sub-text">
      Complete workouts, hit goals, and level up to see your progress here.
    </p>
  </div>
);

function getIconForType(type: string) {
  const icons: Record<string, React.ElementType> = {
    milestone: Trophy,
    weight: TrendingUp,
    streak: Flame,
    strength: Target,
    transformation: Trophy,
  };
  return icons[type] || Trophy;
}
