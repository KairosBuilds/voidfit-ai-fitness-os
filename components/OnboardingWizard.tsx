import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Brain } from 'lucide-react';

import { BodyMetrics, AiPersonality } from '../types';
import { validateApiKey } from '../services/geminiService';
import * as GoogleAuth from '../auth/googleAuth';
import { calculateBMI, calculateIdealWeight } from '../src/utils/fitnessUtils';

// Steps
import { OnboardingStep1 } from './Onboarding/OnboardingStep1';
import { OnboardingStep2 } from './Onboarding/OnboardingStep2';
import { OnboardingStep3 } from './Onboarding/OnboardingStep3';
import { OnboardingStep4 } from './Onboarding/OnboardingStep4';
import { OnboardingStep5 } from './Onboarding/OnboardingStep5';
import { OnboardingStep6 } from './Onboarding/OnboardingStep6';
import { PermissionsRequest } from '../src/onboarding/steps/PermissionsRequest';

interface OnboardingWizardProps {
  onComplete: (apiKey: string, name: string, stats: Partial<BodyMetrics>, personality: AiPersonality) => void;
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [googleProfile, setGoogleProfile] = useState<GoogleAuth.UserProfile | null>(null);

  useEffect(() => {
    let mounted = true;
    GoogleAuth.init((profile) => {
        if (!mounted) return;
        setGoogleProfile(profile);
        setName(profile.name);
    }, () => {
        if (!mounted) return;
        setGoogleProfile(null);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (step === 1) {
        GoogleAuth.renderSignInButton('google-signin-btn');
    }
  }, [step]);

  // State
  const [apiKey, setApiKey] = useState('');
  const [name, setName] = useState('');
  const [personality, setPersonality] = useState<AiPersonality>(AiPersonality.Disciplined);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [age, setAge] = useState('25');
  const [weight, setWeight] = useState('80');
  const [targetWeight, setTargetWeight] = useState('75');
  const [height, setHeight] = useState('180');
  const [bodyFat, setBodyFat] = useState('');
  const [injuries, setInjuries] = useState('');
  const [experience, setExperience] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [stamina, setStamina] = useState(5);
  const [flexibility, setFlexibility] = useState(5);
  const [pushups, setPushups] = useState('0');
  const [pullups, setPullups] = useState('0');
  const [runningAbility, setRunningAbility] = useState('Beginner');
  const [strengthLevel, setStrengthLevel] = useState(5);
  const [sleepSchedule, setSleepSchedule] = useState('11PM - 7AM');
  const [stress, setStress] = useState(5);
  const [gymAccess, setGymAccess] = useState(true);
  const [equipment, setEquipment] = useState('');
  const [dailySchedule, setDailySchedule] = useState('');
  const [foodPreferences, setFoodPreferences] = useState('');
  const [allergies, setAllergies] = useState('');

  const bmi = useMemo(() => calculateBMI(parseFloat(weight), parseFloat(height)), [weight, height]);

  const idealWeight = useMemo(() => calculateIdealWeight(parseFloat(height), gender), [height, gender]);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingValidationResult, setPendingValidationResult] = useState<{ valid: boolean; error?: string } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleNext = async () => {
      if (step === 1 && apiKey) {
          setIsProcessing(true);
          const validation = await validateApiKey(apiKey, 'gemini');
          setIsProcessing(false);
          
          if (!validation.valid) {
              setPendingValidationResult(validation);
              setShowConfirmModal(true);
              return;
          }

          if (validation.quotaExceeded) {
              console.warn('[VoidFit AI] Neural link congested. Entering local-only mode.');
              setValidationError(null);
              setStep(prev => prev + 1);
              return;
          }

          setValidationError(null);
      }
      setStep(prev => prev + 1);
  };
  
  const handleBack = () => setStep(prev => prev - 1);
  const handleForceProceed = () => { setShowConfirmModal(false); setStep(prev => prev + 1); };
  const handleCancelProceed = () => { setShowConfirmModal(false); };

  const handleFinish = async () => {
    setIsProcessing(true);
    try {
      const metrics: Partial<BodyMetrics> = {
        gender, age: parseInt(age) || 25, currentWeight: parseFloat(weight) || 80,
        targetWeight: parseFloat(targetWeight) || 75, height: parseFloat(height) || 180,
        bodyFatPercentage: bodyFat ? parseFloat(bodyFat) : undefined,
        experienceLevel: experience,
        injuries: injuries.split(',').map(i => i.trim()).filter(i => i),
        equipment: equipment.split(',').map(e => e.trim()).filter(e => e),
        availableTimeMinutes: 60, gymAccess, stamina, flexibility, sleepSchedule, stressLevel: stress,
        foodPreferences: foodPreferences.split(',').map(f => f.trim()).filter(f => f),
        allergies: allergies.split(',').map(a => a.trim()).filter(a => a),
        dailySchedule, pushupsMax: parseInt(pushups) || 0, pullupsMax: parseInt(pullups) || 0,
        runningAbility, strengthLevel,
      };
      onComplete(apiKey, name || 'Athlete', metrics, personality);
    } catch (error) {
      console.error('Onboarding finish error:', error);
    } finally { setIsProcessing(false); }
  };

  const slideVariants = { initial: { x: 50, opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: -50, opacity: 0 } };

  const renderStep = () => {
    switch(step) {
      case 1: return <OnboardingStep1 apiKey={apiKey} setApiKey={setApiKey} name={name} setName={setName} validationError={validationError} googleProfile={googleProfile} onNext={handleNext} isProcessing={isProcessing} slideVariants={slideVariants} />;
      case 2: return <OnboardingStep2 gender={gender} setGender={setGender} age={age} setAge={setAge} height={height} setHeight={setHeight} weight={weight} setWeight={setWeight} targetWeight={targetWeight} setTargetWeight={setTargetWeight} bmi={bmi} idealWeight={idealWeight} onBack={handleBack} onNext={handleNext} slideVariants={slideVariants} />;
      case 3: return <OnboardingStep3 injuries={injuries} setInjuries={setInjuries} experience={experience} setExperience={setExperience} stamina={stamina} setStamina={setStamina} flexibility={flexibility} setFlexibility={setFlexibility} onBack={handleBack} onNext={handleNext} slideVariants={slideVariants} />;
      case 4: return <OnboardingStep4 pushups={pushups} setPushups={setPushups} pullups={pullups} setPullups={setPullups} runningAbility={runningAbility} setRunningAbility={setRunningAbility} strengthLevel={strengthLevel} setStrengthLevel={setStrengthLevel} onBack={handleBack} onNext={handleNext} slideVariants={slideVariants} />;
      case 5: return <OnboardingStep5 sleepSchedule={sleepSchedule} setSleepSchedule={setSleepSchedule} stress={stress} setStress={setStress} gymAccess={gymAccess} setGymAccess={setGymAccess} equipment={equipment} setEquipment={setEquipment} dailySchedule={dailySchedule} setDailySchedule={setDailySchedule} onBack={handleBack} onNext={handleNext} slideVariants={slideVariants} />;
      case 6: return <OnboardingStep6 foodPreferences={foodPreferences} setFoodPreferences={setFoodPreferences} allergies={allergies} setAllergies={setAllergies} personality={personality} setPersonality={setPersonality} onBack={handleBack} onFinish={() => setStep(7)} isProcessing={isProcessing} slideVariants={slideVariants} />;
      case 7: return <PermissionsRequest onComplete={handleFinish} onSkip={handleFinish} />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-4 overflow-y-auto no-scrollbar">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full" style={{ background: 'var(--primary-action)', opacity: 0.07, filter: 'blur(100px)' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full" style={{ background: 'var(--accent)', opacity: 0.05, filter: 'blur(120px)' }} />
      </div>

      <div className="w-full max-w-md relative z-10 py-8">
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-5">
            <div className="absolute inset-[-10px] rounded-full border-2 opacity-50" style={{ borderColor: 'var(--accent)', animation: 'dragonPulse 2.5s ease-in-out infinite' }} />
            <div className="absolute inset-[-4px] rounded-full" style={{ background: 'var(--dragon-scale, var(--plush-gradient))', opacity: 0.7 }} />
            <div className="w-20 h-20 rounded-3xl overflow-hidden relative border-2" style={{ borderColor: 'var(--background)' }}>
              <img src="/app_logo/logo.png" alt="VoidFit AI" className="w-full h-full object-cover" loading="lazy" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-center tracking-tighter text-main-text uppercase" style={{ textShadow: '0 0 20px var(--neon-glow, var(--teddy-glow))' }}>VOIDFIT <span style={{ color: 'var(--primary-action)' }}>AI</span></h1>
          <p className="text-[9px] font-black uppercase tracking-[0.35em] text-sub-text mt-1">Coach Setup & Calibration</p>
          <div className="flex items-center gap-1.5 mt-4">
            {[1,2,3,4,5,6,7].map(s => (
              <div key={s} className="relative h-1.5 rounded-full overflow-hidden transition-all duration-500" style={{ width: step >= s ? '2.5rem' : '1.5rem', background: 'var(--glass-border)' }}>
                {step >= s && <div className="absolute inset-0 rounded-full" style={{ background: s === 3 ? '#ef4444' : s === 5 ? '#f59e0b' : s === 6 ? '#10b981' : 'var(--dragon-scale, var(--plush-gradient))', boxShadow: s === 3 ? '0 0 6px rgba(239,68,68,0.8)' : s === 5 ? '0 0 6px rgba(245,158,11,0.8)' : '0 0 6px var(--neon-glow, var(--teddy-glow))' }} />}
              </div>
            ))}
          </div>
        </div>

        <div className="relative rounded-[2.5rem] overflow-hidden shadow-[0_25px_70px_var(--shadow-soft)]" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'var(--dragon-scale, var(--plush-gradient))' }} />
          <div className="absolute top-4 right-4 opacity-[0.04] pointer-events-none"><Brain size={110} className="text-main-text" /></div>
          <div className="p-8 backdrop-blur-3xl">
            <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>
          </div>
        </div>
        <p className="text-center text-[9px] text-sub-text font-black uppercase tracking-[0.3em] mt-6 opacity-40">Personal Coach Program v4.0</p>
      </div>

      {showConfirmModal && pendingValidationResult && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md glass-effect border-2 border-accent-red rounded-3xl p-6 shadow-[0_0_50px_rgba(239,68,68,0.3)]">
            <div className="flex items-center gap-3 mb-4 text-accent-red"><ShieldAlert size={24} /><h3 className="text-xl font-black uppercase tracking-tight">Connection Warning</h3></div>
            <p className="text-sm text-sub-text font-bold mb-4">{pendingValidationResult.error}</p>
            <p className="text-xs text-main-text font-black uppercase tracking-widest mb-6">Key appears invalid. Proceed anyway?</p>
            <div className="flex gap-3">
              <button onClick={handleCancelProceed} className="px-5 py-3 bg-surface border border-glass-border rounded-xl font-black uppercase tracking-widest text-sub-text hover:text-main-text transition-all text-xs">Cancel</button>
              <button onClick={handleForceProceed} className="flex-1 py-3 bg-accent-red text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all active:scale-95">Force Proceed</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default OnboardingWizard;
