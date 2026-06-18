import React, { useState, useEffect } from 'react';
import { Timer as TimerIcon, Play, CheckCircle } from 'lucide-react';
import { Realm, ActiveTimedQuest } from '../types';
import AiTextGenerator from './AiTextGenerator';

import { useUserStore } from '../src/store/useUserStore';
import { useAuthStore } from '../src/store/useAuthStore';

interface TimerProps {
  activeQuest?: ActiveTimedQuest | null;
  onStartQuest?: (title: string, realm: Realm, estimatedMinutes: number) => void;
  onCompleteQuest?: () => void;
  apiKey?: string;
}

const TimerDisplay: React.FC<{ startTime: string, targetMinutes: number }> = ({ startTime, targetMinutes }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const startTimestamp = new Date(startTime).getTime();
    const updateTimer = () => {
      const now = Date.now();
      setElapsedSeconds(Math.floor((now - startTimestamp) / 1000));
    };
    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);
    return () => clearInterval(intervalId);
  }, [startTime]);

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const targetSeconds = targetMinutes * 60;
  const isOvertime = elapsedSeconds > targetSeconds;

  return (
    <div className="text-center space-y-4">
      <p className={`font-mono text-7xl sm:text-9xl font-black tabular-nums tracking-tighter transition-colors drop-shadow-[0_0_15px_currentColor] ${isOvertime ? 'text-accent-red' : 'text-main-text'}`}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </p>
      <div className="flex items-center justify-center gap-3">
        <div className="px-3 py-1 bg-accent/10 border border-accent/30 rounded-full text-[10px] font-black text-accent uppercase tracking-widest shadow-[inset_0_0_5px_rgba(0,0,0,0.2)] drop-shadow-[0_0_2px_currentColor]">
            Protocol: {targetMinutes}:00
        </div>
        {isOvertime && (
          <div className="px-3 py-1 bg-accent-red/10 border border-accent-red/20 rounded-full text-[10px] font-black text-accent-red uppercase tracking-widest animate-pulse">
            Neural Overtime
          </div>
        )}
      </div>
    </div>
  );
};

const Timer: React.FC<TimerProps> = ({ 
  activeQuest: propActiveQuest, 
  onStartQuest: propOnStartQuest, 
  onCompleteQuest: propOnCompleteQuest, 
  apiKey: propApiKey 
}) => {
  const { user, startTimedQuest, completeTimedQuest } = useUserStore();
  const { apiKey: storeApiKey } = useAuthStore();
  
  const activeQuest = propActiveQuest !== undefined ? propActiveQuest : user?.activeTimedQuest;
  const apiKey = propApiKey || storeApiKey;

  const [title, setTitle] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(25);
  const [realm, setRealm] = useState<Realm>(Realm.Endurance);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && estimatedMinutes > 0) {
      if (propOnStartQuest) {
        propOnStartQuest(title, realm, estimatedMinutes);
      } else {
        startTimedQuest(title, realm, estimatedMinutes);
      }
    }
  };

  const handleComplete = () => {
    if (propOnCompleteQuest) {
      propOnCompleteQuest();
    } else {
      completeTimedQuest();
    }
  };

  if (activeQuest) {
    return (
      <div className="max-w-xl mx-auto flex flex-col items-center justify-center text-center py-8 px-4">
        <div className="glass-effect border-2 border-glass-border p-8 sm:p-12 rounded-[2.5rem] w-full shadow-[0_10px_30px_var(--shadow-soft)] relative overflow-hidden z-10">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-[var(--plush-gradient,var(--dragon-scale))] bg-accent shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))]" />
          <p className="text-sub-text text-[10px] font-black uppercase tracking-[0.3em] mb-2">Protocol in Execution</p>
          <h2 className="text-2xl sm:text-3xl font-black text-main-text mb-8 uppercase tracking-tight drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">{activeQuest.title}</h2>
          
          <TimerDisplay startTime={activeQuest.startTime} targetMinutes={activeQuest.estimatedMinutes} />
          
          <button
            onClick={handleComplete}
            className="mt-12 w-full flex items-center justify-center gap-3 bg-[var(--plush-gradient,var(--dragon-scale))] bg-accent hover:opacity-90 text-white font-black py-5 px-8 rounded-2xl transition-all shadow-[0_0_15px_currentColor] active:scale-95 uppercase tracking-widest text-sm border border-glass-border"
          >
            <CheckCircle size={22} />
            <span>Fulfill Directive</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 pb-20">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black flex items-center justify-center gap-4 text-main-text uppercase tracking-tight drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">
            <TimerIcon size={32} className="text-accent drop-shadow-[0_0_5px_currentColor]" />
            Ad-Hoc Session
        </h2>
        <p className="text-sub-text text-[10px] font-black uppercase tracking-[0.2em] mt-2">Initialize manual training protocol</p>
      </div>

      <div className="glass-effect p-6 sm:p-10 rounded-[2.5rem] border-2 border-glass-border shadow-[0_10px_30px_var(--shadow-soft)] relative z-10">
        <form onSubmit={handleStart} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="title" className="block text-[10px] font-black text-sub-text uppercase tracking-widest ml-1">Directive Name</label>
            <div className="relative">
              <input
                type="text"
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                placeholder="Enter objective..."
                className="block w-full bg-background border border-glass-border rounded-2xl py-4 px-5 text-main-text focus:outline-none focus:border-accent focus:shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))] transition-all pr-12 text-sm font-bold shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]"
              />
              <AiTextGenerator
                apiKey={apiKey}
                context="a title for a short, timed quest"
                onGenerated={setTitle}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="minutes" className="block text-[10px] font-black text-sub-text uppercase tracking-widest ml-1">Time Estimate (Min)</label>
              <input
                type="number"
                id="minutes"
                value={estimatedMinutes}
                onChange={e => setEstimatedMinutes(Number(e.target.value))}
                min="1"
                required
                className="block w-full bg-background border border-glass-border rounded-2xl py-4 px-5 text-main-text focus:outline-none focus:border-accent focus:shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))] transition-all text-sm font-bold shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="realm" className="block text-[10px] font-black text-sub-text uppercase tracking-widest ml-1">Operation Realm</label>
              <select
                id="realm"
                value={realm}
                onChange={e => setRealm(e.target.value as Realm)}
                className="block w-full bg-background border border-glass-border rounded-2xl py-4 px-5 text-main-text focus:outline-none focus:border-accent focus:shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))] transition-all text-sm font-bold shadow-[inset_0_0_5px_rgba(0,0,0,0.5)] appearance-none cursor-pointer"
              >
                {Object.values(Realm).map(r => <option key={r} value={r} className="bg-card">{r}</option>)}
              </select>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 bg-[var(--plush-gradient,var(--dragon-scale))] bg-accent hover:opacity-90 text-white font-black py-5 px-6 rounded-2xl transition-all shadow-[0_0_15px_currentColor] active:scale-95 uppercase tracking-[0.2em] text-xs border border-glass-border"
            >
              <Play size={20} />
              <span>Initialize Timer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Timer;