import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Heart, FileText, Activity, Shield, Upload, Loader2 } from 'lucide-react';
import { reportEventToAi } from '../../src/services/aiReactionService';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useUserStore } from '../../src/store/useUserStore';
import { db } from '../../src/db/database';
import { LabReport } from '../../types';
import { analyzeLabReport } from '../../services/geminiService';
import { useDatabase } from '../../src/db/useDatabase';
import { toast } from '../../src/store/useToastStore';

// Simplified Body Diagnostics component (replaces MedicalTracker)
// Focused on AI workout safety rather than full medical tracking

interface Injury {
  id: string;
  bodyPart: string;
  type: 'strain' | 'sprain' | 'chronic' | 'other';
  severity: 'mild' | 'moderate' | 'severe';
  status: 'active' | 'recovering' | 'resolved';
  limitations: string[];
}

interface BodyPartStatus {
  part: string;
  status: 'healthy' | 'caution' | 'injured';
  notes?: string;
}

export const BodyDiagnostics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'injuries' | 'medical' | 'safety'>('injuries');
  const { user, setUser } = useUserStore();
  
  const activeInjuries = user?.bodyMetrics?.injuries || [];

  // Map user store's string[] injuries to Injury[] structure
  const injuries: Injury[] = activeInjuries.map((part, idx) => ({
    id: `inj-${part}-${idx}`,
    bodyPart: part,
    type: 'chronic',
    severity: 'moderate',
    status: 'active',
    limitations: [],
  }));

  // Calculate dynamic safety profile
  const hasKneeFootAnkle = activeInjuries.some(i => /knee|foot|ankle/i.test(i));
  const hasShoulderWristArm = activeInjuries.some(i => /shoulder|wrist|arm/i.test(i));
  const hasBackHipKnee = activeInjuries.some(i => /back|hip|knee/i.test(i));
  const hasNeckBack = activeInjuries.some(i => /neck|back/i.test(i));

  const forbiddenExercises = [
    ...(hasKneeFootAnkle ? ['running'] : []),
    ...(hasShoulderWristArm ? ['pushups'] : []),
    ...(hasBackHipKnee ? ['squats'] : []),
    ...(hasNeckBack ? ['yoga'] : []),
  ];

  const allowedExercises = ['pushups', 'squats', 'running', 'yoga'].filter(
    ex => !forbiddenExercises.includes(ex)
  );

  const safetyProfile = {
    riskLevel: activeInjuries.length > 3 ? ('severe' as const) : activeInjuries.length > 0 ? ('moderate' as const) : ('low' as const),
    allowedExercises,
    forbiddenExercises,
    requiredModifications: activeInjuries.length > 0 ? ['Lower intensity workouts', 'Avoid training injured muscle groups'] : [],
  };

  const handleAddInjury = async (part: string) => {
    if (!user) return;
    const currentInjuries = user.bodyMetrics?.injuries || [];
    if (!currentInjuries.includes(part)) {
      setUser(prev => ({
        ...prev,
        bodyMetrics: {
          ...prev.bodyMetrics,
          injuries: [...currentInjuries, part]
        }
      }));
    }

    const { apiKey } = useAuthStore.getState();
    if (apiKey) {
      reportEventToAi(apiKey, user, 'INJURY_REPORT', { bodyPart: part, details: `Injury reported on: ${part}` });
    }
  };

  const handleResolveInjury = (part: string) => {
    if (!user) return;
    setUser(prev => ({
      ...prev,
      bodyMetrics: {
        ...prev.bodyMetrics,
        injuries: (prev.bodyMetrics?.injuries || []).filter(i => i !== part)
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main-text">Injury & Safety</h1>
          <p className="text-sm text-sub-text">AI workout safety check</p>
        </div>
        <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
          safetyProfile.riskLevel === 'low' ? 'bg-accent-green/20 text-accent-green' :
          safetyProfile.riskLevel === 'moderate' ? 'bg-accent-yellow/20 text-accent-yellow' :
          'bg-accent-red/20 text-accent-red'
        }`}>
          <Shield size={16} className="inline mr-2" />
          {safetyProfile.riskLevel.toUpperCase()} LEVEL
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['injuries', 'medical', 'safety'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab 
                ? 'bg-primary-action text-white' 
                : 'bg-surface text-sub-text hover:text-main-text'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="glass-effect rounded-2xl p-6 border border-glass-border">
        {activeTab === 'injuries' && (
          <InjuriesTab 
            injuries={injuries} 
            onAddInjury={handleAddInjury} 
            onResolveInjury={handleResolveInjury} 
          />
        )}
        {activeTab === 'medical' && <MedicalTab />}
        {activeTab === 'safety' && <SafetyTab profile={safetyProfile} />}
      </div>

      {/* AI Safety Notice */}
      <div className="p-4 rounded-xl bg-accent-yellow/10 border border-accent-yellow/30">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-accent-yellow mt-0.5" />
          <div>
            <p className="text-sm font-medium text-main-text">AI Safety Notice</p>
            <p className="text-sm text-sub-text">
              Your AI coach uses this data to generate safe workouts. 
              Always consult a doctor for serious medical conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const InjuriesTab: React.FC<{ 
  injuries: Injury[]; 
  onAddInjury: (part: string) => void;
  onResolveInjury: (part: string) => void;
}> = ({ injuries, onAddInjury, onResolveInjury }) => {
  const bodyParts = [
    'head', 'neck', 'shoulders', 'chest', 'back', 'arms', 
    'wrists', 'abs', 'hips', 'knees', 'ankles', 'feet'
  ];

  return (
    <div className="space-y-6">
      {injuries.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-main-text uppercase tracking-wider">Active Injuries</h3>
          {injuries.map((injury) => (
            <div key={injury.id} className="p-4 rounded-xl bg-surface border border-border flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-main-text capitalize">{injury.bodyPart}</span>
                  <span className="px-2 py-0.5 rounded bg-accent-yellow/20 text-accent-yellow text-xs font-semibold">
                    Active
                  </span>
                </div>
                <p className="text-xs text-sub-text">Avoid overloading this area during training.</p>
              </div>
              <button
                onClick={() => onResolveInjury(injury.bodyPart)}
                className="px-3 py-1.5 rounded-lg bg-accent-green/20 hover:bg-accent-green/30 text-accent-green text-xs font-semibold transition-colors"
              >
                Resolve
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <Heart size={48} className="mx-auto mb-4 text-accent-green opacity-50" />
          <h3 className="text-lg font-semibold text-main-text mb-2">No Active Injuries</h3>
          <p className="text-sm text-sub-text">
            Great! Your body is ready for full-intensity training.
          </p>
        </div>
      )}

      <div className="border-t border-glass-border pt-6">
        <h3 className="text-sm font-bold text-main-text uppercase tracking-wider mb-4">Report Pain Point</h3>
        <p className="text-xs text-sub-text mb-4">Tap on a body part to flag an active injury:</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-w-md">
          {bodyParts.map((part) => {
            const isActive = injuries.some(i => i.bodyPart === part);
            return (
              <button
                key={part}
                disabled={isActive}
                onClick={() => onAddInjury(part)}
                className={`p-3 rounded-xl text-xs font-bold transition-all capitalize border ${
                  isActive 
                    ? 'bg-accent-red/10 border-accent-red/30 text-accent-red cursor-not-allowed opacity-50'
                    : 'bg-surface border-glass-border hover:bg-primary-action/20 text-main-text hover:border-primary-action/50'
                }`}
              >
                {part}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const MedicalTab: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { apiKey } = useAuthStore();
  const { addLabReport } = useDatabase();
  const [busy, setBusy] = useState(false);

  const handleLabJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!apiKey?.trim()) {
      toast.error('Add your Gemini API key in Settings first.');
      return;
    }
    setBusy(true);
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as Partial<LabReport>;
      const report: LabReport = {
        id: `lab-${Date.now()}`,
        date: new Date().toISOString(),
        vitaminD: parsed.vitaminD,
        testosterone: parsed.testosterone,
        cholesterol: parsed.cholesterol,
        thyroid: parsed.thyroid,
        bloodSugar: parsed.bloodSugar,
        fileUrl: file.name,
      };
      const analysis = await analyzeLabReport(apiKey, report);
      await addLabReport({ ...report, analysis });
      toast.success('Lab values analyzed and saved locally.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not read lab JSON';
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleLabJson}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => fileInputRef.current?.click()}
        className="w-full flex items-center gap-3 p-4 rounded-xl bg-surface hover:bg-primary-action/10 transition-colors text-left border border-glass-border disabled:opacity-50"
      >
        {busy ? <Loader2 size={24} className="text-primary-action animate-spin" /> : <Upload size={24} className="text-primary-action" />}
        <div>
          <p className="font-medium text-main-text">Upload lab JSON</p>
          <p className="text-sm text-sub-text">
            JSON with optional numeric fields: vitaminD, testosterone, cholesterol, thyroid, bloodSugar
          </p>
        </div>
      </button>

      <div className="flex items-center gap-3 p-4 rounded-xl bg-surface opacity-70">
        <FileText size={24} className="text-primary-action" />
        <div>
          <p className="font-medium text-main-text">Health Reports Archive</p>
          <p className="text-sm text-sub-text">Future: sync cloud copies of PDF reports</p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 rounded-xl bg-surface">
        <Activity size={24} className="text-primary-action" />
        <div>
          <p className="font-medium text-main-text">Meds</p>
          <p className="text-sm text-sub-text">Track medications you are taking</p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-accent-yellow/10 border border-accent-yellow/30">
        <p className="text-sm text-sub-text">
          Health data helps your AI coach adjust workout intensity,
          but does not replace professional medical advice.
        </p>
      </div>
    </div>
  );
};

const SafetyTab: React.FC<{ profile: { riskLevel: string; allowedExercises: string[]; forbiddenExercises: string[] } }> = ({ profile }) => (
  <div className="space-y-4">
    <div>
      <h4 className="font-medium text-main-text mb-2">Allowed Exercises</h4>
      <div className="flex flex-wrap gap-2">
        {profile.allowedExercises.map((exercise) => (
          <span key={exercise} className="px-3 py-1 rounded-full bg-accent-green/20 text-accent-green text-sm">
            {exercise}
          </span>
        ))}
      </div>
    </div>
    
    {profile.forbiddenExercises.length > 0 && (
      <div>
        <h4 className="font-medium text-main-text mb-2">Restricted Exercises</h4>
        <div className="flex flex-wrap gap-2">
          {profile.forbiddenExercises.map((exercise) => (
            <span key={exercise} className="px-3 py-1 rounded-full bg-accent-red/20 text-accent-red text-sm">
              {exercise}
            </span>
          ))}
        </div>
      </div>
    )}
    
    <div className="p-4 rounded-xl bg-surface">
      <p className="text-sm text-sub-text">
        AI generates workouts based on your health info. 
        Updates automatically when you log injuries or recoveries.
      </p>
    </div>
  </div>
);

export default BodyDiagnostics;
