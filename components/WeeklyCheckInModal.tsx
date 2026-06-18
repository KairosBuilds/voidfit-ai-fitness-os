import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Scale, Activity, Brain, Shield, Target, Camera, Zap, CheckCircle2, AlertTriangle, Dumbbell } from 'lucide-react';
import { WeeklyCheckIn, FitnessGoalType } from '../types';

interface WeeklyCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WeeklyCheckIn) => void;
  currentWeight: number;
}

const STEPS = [
  { id: 'metrics', title: 'Body Stats', icon: Scale },
  { id: 'performance', title: 'Workouts', icon: Dumbbell },
  { id: 'subjective', title: 'Your Feel', icon: Brain },
  { id: 'lifestyle', title: 'Schedule', icon: Target },
  { id: 'summary', title: 'Finish', icon: Shield },
];

const WeeklyCheckInModal: React.FC<WeeklyCheckInModalProps> = ({ isOpen, onClose, onSubmit, currentWeight }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<WeeklyCheckIn>>({
    weight: currentWeight,
    bodyFatEstimate: undefined,
    workoutDifficulty: 'Just Right',
    sorenessLevel: 3,
    injuryUpdates: '',
    sleepQuality: 7,
    dietConsistency: 7,
    motivationLevel: 7,
    scheduleChanges: '',
    gymAvailabilityChanges: '',
    goalsChanged: false,
  });

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      const finalData: WeeklyCheckIn = {
        id: `checkin-${Date.now()}`,
        date: new Date().toISOString(),
        weight: formData.weight || currentWeight,
        bodyFatEstimate: formData.bodyFatEstimate,
        workoutDifficulty: formData.workoutDifficulty as any,
        sorenessLevel: formData.sorenessLevel || 0,
        injuryUpdates: formData.injuryUpdates || 'None',
        sleepQuality: formData.sleepQuality || 0,
        dietConsistency: formData.dietConsistency || 0,
        motivationLevel: formData.motivationLevel || 0,
        scheduleChanges: formData.scheduleChanges || 'None',
        gymAvailabilityChanges: formData.gymAvailabilityChanges || 'None',
        goalsChanged: formData.goalsChanged || false,
        newGoals: formData.newGoals,
      };
      onSubmit(finalData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const updateField = (field: keyof WeeklyCheckIn, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case 'metrics':
        return (
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-sub-text mb-4 block">Current Body Weight (kg)</label>
              <div className="flex items-center gap-4">
                <input 
                  type="number" 
                  value={formData.weight}
                  onChange={e => updateField('weight', parseFloat(e.target.value))}
                  className="w-full bg-surface/50 border border-glass-border rounded-2xl px-6 py-4 text-2xl font-black text-main-text focus:outline-none focus:border-accent focus:shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))] transition-all"
                />
                <div className="p-4 bg-accent/10 rounded-2xl text-accent shadow-[0_0_15px_var(--neon-glow,var(--teddy-glow))]">
                  <Scale size={32} className="drop-shadow-[0_0_5px_currentColor]" />
                </div>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-sub-text mb-4 block">Body Fat Estimate (%) - Optional</label>
              <input 
                type="number" 
                value={formData.bodyFatEstimate || ''}
                onChange={e => updateField('bodyFatEstimate', parseFloat(e.target.value))}
                placeholder="e.g. 15"
                className="w-full bg-surface/50 border border-glass-border rounded-2xl px-6 py-4 text-xl font-black text-main-text focus:outline-none focus:border-accent focus:shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))] transition-all"
              />
            </div>
          </div>
        );
      case 'performance':
        return (
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-sub-text mb-4 block">Workout Difficulty Feedback</label>
              <div className="grid grid-cols-3 gap-3">
                {['Too Easy', 'Just Right', 'Too Hard'].map(level => (
                  <button
                    key={level}
                    onClick={() => updateField('workoutDifficulty', level)}
                    className={`py-4 rounded-xl font-black text-xs transition-all ${formData.workoutDifficulty === level ? 'bg-accent text-white shadow-[0_0_15px_var(--neon-glow,var(--teddy-glow))]' : 'bg-surface/50 text-sub-text border border-glass-border'}`}
                  >
                    {level.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-sub-text mb-4 block">Injury / Pain Updates</label>
              <textarea 
                value={formData.injuryUpdates}
                onChange={e => updateField('injuryUpdates', e.target.value)}
                placeholder="Any new pains or injury improvements?"
                className="w-full bg-surface/50 border border-glass-border rounded-2xl px-4 py-3 text-main-text focus:outline-none focus:border-accent focus:shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))] transition-all resize-none h-32"
              />
            </div>
          </div>
        );
      case 'subjective':
        return (
          <div className="space-y-8">
            {[
              { field: 'sorenessLevel', label: 'Muscle Soreness', icon: Activity, min: 'Fresh', max: 'Destroyed' },
              { field: 'sleepQuality', label: 'Sleep Quality', icon: Zap, min: 'Exhausted', max: 'Restored' },
              { field: 'motivationLevel', label: 'Mental Drive', icon: Brain, min: 'Zero', max: 'Unstoppable' },
            ].map(slider => (
              <div key={slider.field}>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <slider.icon size={16} className="text-accent" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-main-text">{slider.label}</span>
                  </div>
                  <span className="text-xl font-black text-accent">{formData[slider.field as keyof WeeklyCheckIn]}</span>
                </div>
                <input 
                  type="range" min="1" max="10" step="1"
                  value={formData[slider.field as keyof WeeklyCheckIn] as number}
                  onChange={e => updateField(slider.field as any, parseInt(e.target.value))}
                  className="w-full h-2 bg-surface border border-glass-border rounded-lg appearance-none cursor-pointer accent-accent"
                />
                <div className="flex justify-between mt-2">
                  <span className="text-[8px] font-black text-sub-text uppercase">{slider.min}</span>
                  <span className="text-[8px] font-black text-sub-text uppercase">{slider.max}</span>
                </div>
              </div>
            ))}
          </div>
        );
      case 'lifestyle':
        return (
          <div className="space-y-6">
             <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-sub-text mb-4 block">Schedule or Availability Changes</label>
              <textarea 
                value={formData.scheduleChanges}
                onChange={e => updateField('scheduleChanges', e.target.value)}
                placeholder="Work trips? New commitments?"
                className="w-full bg-surface/50 border border-glass-border rounded-2xl px-4 py-3 text-main-text focus:outline-none focus:border-accent focus:shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))] transition-all resize-none h-24"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-sub-text mb-4 block">Gym / Equipment Changes</label>
              <textarea 
                value={formData.gymAvailabilityChanges}
                onChange={e => updateField('gymAvailabilityChanges', e.target.value)}
                placeholder="Access to new tools? Losing gym access?"
                className="w-full bg-surface/50 border border-glass-border rounded-2xl px-4 py-3 text-main-text focus:outline-none focus:border-accent focus:shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))] transition-all resize-none h-24"
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-surface/50 rounded-2xl border border-glass-border shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]">
              <div className="flex items-center gap-3">
                <Target size={20} className="text-accent" />
                <span className="text-xs font-black text-main-text uppercase tracking-wider">Change Primary Goal?</span>
              </div>
              <input 
                type="checkbox" 
                checked={formData.goalsChanged}
                onChange={e => updateField('goalsChanged', e.target.checked)}
                className="w-6 h-6 rounded-lg bg-surface border-glass-border text-accent focus:ring-0"
              />
            </div>
          </div>
        );
      case 'summary':
        return (
          <div className="flex flex-col items-center justify-center py-8 space-y-6 text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full animate-pulse" />
              <div className="relative p-6 bg-accent/10 rounded-full text-accent border border-accent/30 shadow-[0_0_15px_var(--neon-glow,var(--teddy-glow))]">
                <Shield size={64} className="drop-shadow-[0_0_10px_currentColor]" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-main-text tracking-tight mb-2 drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">Ready to Update</h3>
              <p className="text-sm text-sub-text max-w-xs mx-auto">
                Submitting this will let the AI adjust your workouts and nutrition for next week.
              </p>
            </div>
            <div className="w-full grid grid-cols-2 gap-3 pt-4">
              <div className="p-4 bg-surface/50 rounded-2xl border border-glass-border shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]">
                <p className="text-[8px] font-black text-sub-text uppercase mb-1">Status</p>
                <p className="text-xs font-black text-main-text">CHECK-IN COMPLETE</p>
              </div>
              <div className="p-4 bg-surface/50 rounded-2xl border border-glass-border shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]">
                <p className="text-[8px] font-black text-sub-text uppercase mb-1">Adjustment</p>
                <p className="text-xs font-black text-accent drop-shadow-[0_0_5px_currentColor]">AI UPDATE READY</p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-background/90 backdrop-blur-md"
      />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 40 }}
        className="relative w-full max-w-xl glass-effect border-2 border-glass-border rounded-[2.5rem] overflow-hidden shadow-[0_20px_60px_var(--shadow-soft)]"
      >
        {/* Progress Header */}
        <div className="p-8 pb-4">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-surface/50 rounded-2xl border border-glass-border shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]">
                <Zap size={24} className="text-accent drop-shadow-[0_0_5px_currentColor]" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-main-text tracking-tighter drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">WEEKLY UPDATE</h2>
                <p className="text-[10px] text-sub-text font-black uppercase tracking-[0.2em]">Check-In</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-surface/50 rounded-xl transition-colors">
              <X size={20} className="text-sub-text hover:text-main-text" />
            </button>
          </div>

          <div className="flex justify-between px-2">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = idx === currentStep;
              const isPast = idx < currentStep;
              return (
                <div key={step.id} className="flex flex-col items-center gap-2">
                  <div className={`p-2.5 rounded-xl transition-all duration-500 ${isActive ? 'bg-accent text-white shadow-[0_0_15px_var(--neon-glow,var(--teddy-glow))] scale-110' : isPast ? 'bg-accent/20 text-accent' : 'bg-surface/50 text-sub-text border border-glass-border'}`}>
                    <Icon size={16} />
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'text-accent' : 'text-sub-text'}`}>{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-8 pt-4">
          <div className="min-h-[320px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-8 flex gap-3">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="flex items-center justify-center w-16 py-4 bg-surface/50 hover:bg-surface text-main-text rounded-2xl transition-all border border-glass-border shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-grow flex items-center justify-center gap-2 py-4 bg-[var(--plush-gradient,var(--dragon-scale))] bg-accent hover:opacity-90 text-white font-black rounded-2xl shadow-[0_0_15px_var(--neon-glow,var(--teddy-glow))] transition-all active:scale-[0.98] uppercase tracking-widest"
            >
              <span>{currentStep === STEPS.length - 1 ? 'Update My Plan' : 'Continue'}</span>
              {currentStep < STEPS.length - 1 && <ChevronRight size={20} />}
              {currentStep === STEPS.length - 1 && <CheckCircle2 size={20} />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default WeeklyCheckInModal;
