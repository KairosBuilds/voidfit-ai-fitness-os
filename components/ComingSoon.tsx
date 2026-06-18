import React from 'react';
import { Sparkles, Home, ChevronRight, Activity, Target, Bot, Map } from 'lucide-react';
import { useUiStore } from '../src/store/useUiStore';

interface ComingSoonProps {
  feature: string;
}

const SUGGESTIONS: Record<string, { label: string; view: string; icon: React.ElementType }[]> = {
  'Leaderboard': [
    { label: 'Capture Territory', view: 'map', icon: Map },
    { label: 'Dashboard', view: 'dashboard', icon: Home },
  ],
  'Guilds': [
    { label: 'PvP Arena', view: 'pvp', icon: Target },
    { label: 'Dashboard', view: 'dashboard', icon: Home },
  ],
  'PvP Arena': [
    { label: 'View Leaderboard', view: 'leaderboard', icon: Activity },
    { label: 'AI Coach', view: 'chatbot', icon: Bot },
  ],
};

const ComingSoon: React.FC<ComingSoonProps> = ({ feature }) => {
  const setView = useUiStore(s => s.setView);
  const suggestions = SUGGESTIONS[feature] || [
    { label: 'Dashboard', view: 'dashboard', icon: Home },
    { label: 'AI Coach', view: 'chatbot', icon: Bot },
  ];

  return (
    <div className="max-w-3xl mx-auto py-20 px-6">
      <div className="glass-effect rounded-[2rem] border border-glass-border p-8 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center bg-accent/10 border border-accent/30 text-accent mb-4">
          <Sparkles size={22} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-sub-text mb-2">Coming Soon</p>
        <h2 className="text-2xl font-black text-main-text mb-2">{feature}</h2>
        <p className="text-sm text-sub-text mb-8">This feature is being prepared. Try these while you wait:</p>

        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
          {suggestions.map(s => {
            const Icon = s.icon;
            return (
              <button
                key={s.view}
                onClick={() => setView(s.view as any)}
                className="flex items-center gap-2 p-4 rounded-2xl bg-surface/50 border border-glass-border hover:border-accent/40 hover:bg-accent/5 transition-all group text-left"
              >
                <Icon size={18} className="text-accent group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black text-main-text uppercase tracking-wider">{s.label}</span>
                <ChevronRight size={14} className="text-sub-text ml-auto group-hover:translate-x-1 transition-transform" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;

