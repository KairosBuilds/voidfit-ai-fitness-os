import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Trash2, Zap, User as UserIcon, Shield, Activity, Upload, RefreshCcw, Download, CheckCircle, AlertCircle, ExternalLink, Cpu, Moon, Sun } from 'lucide-react';
import { Integration, UserState, User, BodyMetrics, FitnessGoalType, AiPersonality } from '../types';
import MyState from './MyState';
import { validateApiKey } from '../services/geminiService';
import { useUiStore } from '../src/store/useUiStore';

import { useAuthStore, AiProvider } from '../src/store/useAuthStore';
import { useUserStore } from '../src/store/useUserStore';
import { db } from '../src/db/database';
import { useDatabase } from '../src/db/useDatabase';
import { restoreDataFromCloud } from '../src/services/syncService';
import { toast } from '../src/store/useToastStore';
import { permissionManager, AppPermission } from '../src/permissions/PermissionManager';

interface SettingsModalProps {
  isOpen?: boolean; 
  onClose?: () => void;
  apiKeys?: { [key in AiProvider]?: string }; 
  selectedProvider?: AiProvider;
  onSaveApiKey?: (key: string, provider: AiProvider) => void;
  onSelectProvider?: (provider: AiProvider) => void;
  userState?: UserState; 
  onUpdateUserState?: (state: UserState) => void;
  user?: User; 
  onUpdateMetrics?: (metrics: Partial<BodyMetrics>) => void;
  onUpdateUser?: (userData: Partial<User>) => void;
  onEmergencyRecalibrate?: () => void; 
  integrations?: Integration[];
  onDownloadBackup?: () => void; 
  onUploadBackup?: (file: File) => void;
  onResetData?: () => void; 
  onRestoreFromCloud?: () => void;
}

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; color?: string }> = ({ icon, title, color }) => (
  <div className="flex items-center gap-3 mb-5">
    <div className="w-1 h-6 rounded-full" style={{ background: color || 'var(--accent)' }} />
    <div className="flex items-center gap-2" style={{ color: color || 'var(--accent)' }}>
      {icon}
      <h3 className="text-base font-black text-main-text tracking-tight uppercase">{title}</h3>
    </div>
  </div>
);

const SettingsModal: React.FC<SettingsModalProps> = (props) => {
  // Use stores if props are missing
  const authStore = useAuthStore();
  const userStore = useUserStore();
  const uiStore = useUiStore();

  const isOpen = props.isOpen ?? true;
  const onClose = props.onClose ?? (() => uiStore.setView('dashboard'));
  
  const user = props.user ?? userStore.user;
  const apiKeys = props.apiKeys ?? authStore.apiKeys;
  const selectedProvider = props.selectedProvider ?? authStore.selectedProvider;
  const integrations = props.integrations ?? authStore.integrations;
  
  const onSaveApiKey = props.onSaveApiKey ?? authStore.setApiKey;
  const onSelectProvider = props.onSelectProvider ?? authStore.setSelectedProvider;
  const onUpdateUser = props.onUpdateUser ?? ((data) => userStore.setUser(prev => ({ ...prev, ...data })));
  const onUpdateMetrics = props.onUpdateMetrics ?? userStore.updateBodyMetrics;
  const { restoreData } = useDatabase();

  const [localKeys, setLocalKeys] = useState(apiKeys);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<{[key in AiProvider]?: { valid: boolean; error?: string }}>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { themeMode, setThemeMode } = uiStore;

  useEffect(() => { setLocalKeys(apiKeys); }, [apiKeys]);

  if (!isOpen) {
    return null;
  }

  const handleValidateAndSave = async (provider: AiProvider) => {
    const key = localKeys[provider]; 
    if (!key) {
      return;
    }
    setIsValidating(true);
    const result = await validateApiKey(key, provider as any);
    setValidationStatus(prev => ({ ...prev, [provider]: result }));
    setIsValidating(false);
    if (result.valid) {
      onSaveApiKey(key, provider);
    }
  };

  const providerLinks = {
    gemini:    { label: 'Google AI Studio', url: 'https://aistudio.google.com/app/apikey' },
    openai:    { label: 'OpenAI Platform',  url: 'https://platform.openai.com/api-keys' },
    anthropic: { label: 'Anthropic Console',url: 'https://console.anthropic.com/settings/keys' },
  };

  const handleDownloadBackup = async () => {
    if (props.onDownloadBackup) {
      return props.onDownloadBackup();
    }
    
    const backupData = {
      user: userStore.user,
      auth: {
        apiKeys: authStore.apiKeys,
        selectedProvider: authStore.selectedProvider
      },
      db: {
          dailyMissions: await db.dailyMissions.toArray(),
          nutritionLogs: await db.nutritionLogs.toArray(),
          activityLogs: await db.activityLogs.toArray(),
          habitLogs: await db.habitLogs.toArray()
      }
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voidfit_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleResetData = async () => {
    if (props.onResetData) {
      return props.onResetData();
    }
    if (!window.confirm("This will permanently delete all your data. This cannot be undone. Are you sure?")) {
      return;
    }
    try {
      await db.delete();
      localStorage.clear();
      toast.success('All data deleted. Reloading...');
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      toast.error('Failed to delete data. Please try again.');
    }
  };

  const handleEmergencyReplan = () => {
      if (props.onEmergencyRecalibrate) {
        return props.onEmergencyRecalibrate();
      }
      uiStore.setView('chatbot');
      // Logic would go here to trigger a specific prompt
  };

  const handleRestoreFromCloud = async () => {
    if (props.onRestoreFromCloud) {
      return props.onRestoreFromCloud();
    }
    try {
      const data = await restoreDataFromCloud();
      if (data) {
        await restoreData(data);
        toast.success('Data restored from cloud successfully.');
      } else {
        toast.warning('No cloud backup found.');
      }
    } catch (e) {
      toast.error('Cloud restore failed. Check your connection.');
    }
  };

  const inputCls = "w-full bg-surface/50 border border-glass-border rounded-2xl py-3 px-4 text-main-text focus:outline-none focus:border-accent transition-all font-black text-sm";
  const selectCls = `${inputCls} appearance-none`;

  return (
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bg-[var(--glass-bg)] backdrop-blur-3xl rounded-[2.5rem] p-8 w-full max-w-2xl relative border border-[var(--glass-border)] max-h-[90vh] overflow-y-auto custom-scrollbar shadow-[0_20px_70px_var(--shadow-soft)]"
        onClick={e => e.stopPropagation()}
      >
        {/* Top gradient strip */}
        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[2.5rem]"
          style={{ background: 'var(--dragon-scale, var(--plush-gradient))' }} />

        <button onClick={onClose} className="absolute top-5 right-5 p-2 rounded-xl border border-glass-border text-sub-text hover:text-main-text hover:border-accent/50 transition-all">
          <X size={18} />
        </button>

        {/* Title + Theme toggle */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl border border-glass-border bg-surface/50">
              <img src="/app_logo/logo.png" className="w-6 h-6 object-contain" alt="VoidFit" />
            </div>
            <div>
              <h2 className="text-xl font-black text-main-text tracking-tight uppercase">
                VoidFit <span style={{ color: 'var(--accent)', filter: 'drop-shadow(0 0 6px var(--neon-glow, var(--teddy-glow)))' }}>AI</span>
              </h2>
              <p className="text-[9px] text-sub-text font-black uppercase tracking-widest">App Settings</p>
            </div>
          </div>

          {/* Moon / Sun toggle */}
          <div className="flex items-center gap-1 p-1 rounded-2xl border border-glass-border bg-surface/50">
            {(['dark', 'light'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setThemeMode(mode)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                style={themeMode === mode ? {
                  background: 'var(--dragon-scale, var(--plush-gradient))',
                  color: '#fff',
                  boxShadow: '0 0 12px var(--neon-glow, var(--teddy-glow))',
                } : { color: 'var(--text-secondary)' }}
              >
                {mode === 'dark' ? <Moon size={12} /> : <Sun size={12} />}
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          {/* ── Neural Processor ── */}
          <div>
            <SectionHeader icon={<Cpu size={16} />} title="AI Settings" />
            <div className="grid grid-cols-3 gap-2 mb-4">
              {(['gemini', 'openai', 'anthropic'] as AiProvider[]).map(p => (
                <button key={p} onClick={() => onSelectProvider(p)}
                  className="py-2.5 px-3 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all border"
                  style={selectedProvider === p ? {
                    background: 'var(--dragon-scale, var(--plush-gradient))',
                    borderColor: 'var(--accent)', color: '#fff',
                    boxShadow: '0 0 14px var(--neon-glow, var(--teddy-glow))',
                  } : { borderColor: 'var(--glass-border)', color: 'var(--text-secondary)', background: 'var(--surface)' }}
                >{p}</button>
              ))}
            </div>
            <div className="bg-surface/30 p-5 rounded-[1.5rem] border border-glass-border">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-sub-text">{selectedProvider} API Key</p>
                <a href={providerLinks[selectedProvider]?.url || '#'} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest hover:underline"
                  style={{ color: 'var(--accent)' }}>
                  Get Key <ExternalLink size={9} />
                </a>
              </div>
              <div className="flex gap-2">
                <input type="password" value={localKeys[selectedProvider] || ''}
                  onChange={e => setLocalKeys(prev => ({ ...prev, [selectedProvider]: e.target.value }))}
                  placeholder={`Paste your ${selectedProvider} key`}
                  className={`${inputCls} flex-1`} />
                <button onClick={() => handleValidateAndSave(selectedProvider)} disabled={isValidating}
                  className="px-5 py-2 rounded-2xl font-black text-white text-xs uppercase tracking-widest disabled:opacity-50 transition-all active:scale-95"
                  style={{ background: 'var(--dragon-scale, var(--plush-gradient))', boxShadow: '0 0 14px var(--neon-glow, var(--teddy-glow))' }}>
                  {isValidating ? <RefreshCcw size={14} className="animate-spin" /> : 'Save'}
                </button>
              </div>
              {validationStatus[selectedProvider] && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className={`mt-4 p-3 rounded-2xl flex items-start gap-2 border text-[9px] font-bold uppercase tracking-wide
                    ${validationStatus[selectedProvider]?.valid ? 'bg-accent-green/15 border-accent-green/30 text-accent-green' : 'bg-accent-red/15 border-accent-red/30 text-accent-red'}`}>
                  {validationStatus[selectedProvider]?.valid ? <CheckCircle size={14} className="shrink-0 mt-0.5" /> : <AlertCircle size={14} className="shrink-0 mt-0.5" />}
                  {validationStatus[selectedProvider]?.valid ? '✅ AI is ready.' : `❌ ${validationStatus[selectedProvider]?.error}`}
                </motion.div>
              )}
            </div>
          </div>

          {/* ── Athlete Identity ── */}
          <div className="pt-6 border-t border-glass-border">
            <SectionHeader icon={<UserIcon size={16} />} title="Profile" color="#5B00C3" />
            <div className="glass-effect p-5 rounded-[1.5rem] flex items-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center font-black text-xl text-white shrink-0"
                style={{ background: 'var(--dragon-scale, var(--plush-gradient))', boxShadow: '0 0 16px var(--neon-glow, var(--teddy-glow))' }}>
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-sub-text mb-1">User</p>
                <p className="text-xl font-black text-main-text">{user.name}</p>
              </div>
            </div>
          </div>

          {/* ── My State ── */}
          <div className="pt-6 border-t border-glass-border">
            <MyState initialState={user.userState || { coreMission: '', longTermGoals: '', shortTermGoals: '', transformationProtocol: '', sideQuests: '' }} onSave={(s) => onUpdateUser({ userState: s })} />
          </div>

          {/* ── Bio-Profile ── */}
          <div className="pt-6 border-t border-glass-border">
            <SectionHeader icon={<Activity size={16} />} title="Body Settings" color="#ef4444" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-sub-text">Target Weight (kg)</label>
                <input type="number" value={user.bodyMetrics.targetWeight}
                  onChange={e => onUpdateMetrics({ targetWeight: parseFloat(e.target.value) })} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-sub-text">Main Goal</label>
                <select value={user.primaryGoal} onChange={e => onUpdateUser({ primaryGoal: e.target.value as any })} className={selectCls}>
                  {Object.values(FitnessGoalType).map(g => <option key={g} value={g} className="bg-surface">{g}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-sub-text">AI Personality</label>
                <select value={user.personality} onChange={e => onUpdateUser({ personality: e.target.value as AiPersonality })} className={selectCls}>
                  {Object.values(AiPersonality).map(p => <option key={p} value={p} className="bg-surface">{p}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-sub-text">Gym Access</label>
                <div className="flex gap-2">
                  {[true, false].map(v => (
                    <button key={String(v)} onClick={() => onUpdateMetrics({ gymAccess: v })}
                      className="flex-1 py-2.5 rounded-2xl font-black text-[9px] uppercase tracking-widest border transition-all"
                      style={user.bodyMetrics.gymAccess === v ? {
                        background: '#ef4444', borderColor: '#ef4444', color: '#fff',
                        boxShadow: '0 0 12px rgba(239,68,68,0.5)',
                      } : { borderColor: 'var(--glass-border)', color: 'var(--text-secondary)', background: 'var(--surface)' }}>
                      {v ? 'YES' : 'NO'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-sub-text">Current Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'isLazyMode',   label: 'TIRED',     color: '#f59e0b' },
                    { key: 'isTravelMode', label: 'TRAVEL',   color: '#5B00C3' },
                    { key: 'isInjuryMode', label: 'INJURY',   color: '#ef4444' },
                    { key: 'isHomeMode',   label: 'LOCATION', color: 'var(--primary-action)' },
                  ].map(m => {
                    const active = !!(user as any)[m.key];
                    return (
                      <button key={m.key} onClick={() => onUpdateUser({ [m.key]: !active } as Partial<User>)}
                        className="py-2.5 rounded-2xl font-black text-[9px] uppercase tracking-widest border transition-all"
                        style={active ? {
                          background: m.color, borderColor: m.color, color: '#fff',
                          boxShadow: `0 0 10px ${m.color}88`,
                        } : { borderColor: 'var(--glass-border)', color: 'var(--text-secondary)', background: 'var(--surface)' }}>
                        {m.label}: {m.key === 'isHomeMode' ? (active ? 'HOME' : 'GYM') : (active ? 'ON' : 'OFF')}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ── Emergency Replan ── */}
          <div className="pt-6 border-t border-glass-border">
            <SectionHeader icon={<Shield size={16} />} title="Update My Plan" color="var(--accent)" />
            <div className="p-5 rounded-[1.5rem] border border-accent-red/30 bg-accent-red/5">
                <p className="text-[10px] text-sub-text mb-4 leading-relaxed font-bold uppercase tracking-wide">
                  Instantly update your plan if you're injured, traveling, or busy.
                </p>
              <button onClick={handleEmergencyReplan}
                className="w-full py-3.5 text-white font-black rounded-2xl uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-xs"
                style={{ background: '#ef4444', boxShadow: '0 0 18px rgba(239,68,68,0.5)' }}>
                <Zap size={15} /> Update My Plan Now
              </button>
            </div>
          </div>

          {/* ── Permissions ── */}
          <div className="pt-6 border-t border-glass-border">
            <SectionHeader icon={<Shield size={16} />} title="App Permissions" color="#5B00C3" />
            <div className="grid grid-cols-3 gap-2">
              {(['health_data','notifications','camera','location','activity_recognition','storage','photos','background_location','microphone'] as AppPermission[]).map(p => (
                <button key={p} onClick={async () => {
                  const granted = await permissionManager.requestPermission(p);
                  toast.success(`${p.replace(/_/g,' ')}: ${granted ? 'Granted' : 'Denied'}`);
                }}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-glass-border bg-surface/50 gap-1.5 transition-all hover:border-accent/50 text-[9px] font-black uppercase tracking-wider text-main-text">
                  {p.replace(/_/g,' ')}
                </button>
              ))}
            </div>
          </div>

          {/* ── Data Management ── */}
          <div className="pt-6 border-t border-glass-border">
            <SectionHeader icon={<Download size={16} />} title="Manage My Data" color="#10b981" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { onClick: handleDownloadBackup, icon: <Download size={18} />, label: 'Backup', color: 'var(--primary-action)' },
                { onClick: handleRestoreFromCloud, icon: <RefreshCcw size={18} />, label: 'Cloud Sync', color: 'var(--accent)' },
              ].map(b => (
                <button key={b.label} onClick={b.onClick}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl border border-glass-border bg-surface/50 gap-2 transition-all hover:border-accent/50 hover:shadow-[0_0_12px_var(--neon-glow,var(--teddy-glow))] group"
                  style={{ color: b.color }}>
                  {b.icon}
                  <span className="text-[9px] font-black uppercase tracking-widest text-main-text">{b.label}</span>
                </button>
              ))}
              <label className="flex flex-col items-center justify-center p-4 rounded-2xl border border-glass-border bg-surface/50 gap-2 transition-all hover:border-accent/50 cursor-pointer" style={{ color: '#5B00C3' }}>
                <Upload size={18} />
                <span className="text-[9px] font-black uppercase tracking-widest text-main-text">Restore</span>
                <input type="file" accept=".json" className="hidden"
                  onChange={e => { 
                      if (e.target.files?.[0]) { 
                          const file = e.target.files[0];
                          if (props.onUploadBackup) {
                              props.onUploadBackup(file);
                          } else {
                              // Local JSON file restore
                              const reader = new FileReader();
                              reader.onloadend = async () => {
                                try {
                                  const parsed = JSON.parse(reader.result as string);
                                  if (parsed?.db) {
                                    await restoreData(parsed.db);
                                    if (parsed?.user) {
                                      onUpdateUser(parsed.user);
                                    }
                                    toast.success('Backup restored successfully!');
                                  } else {
                                    toast.error('Invalid backup file format.');
                                  }
                                } catch {
                                  toast.error('Could not read backup file.');
                                }
                              };
                              reader.readAsText(file);
                          }
                          e.target.value = ''; 
                      } 
                  }} />
              </label>
              <button onClick={handleResetData}
                className="flex flex-col items-center justify-center p-4 rounded-2xl border border-accent-red/30 bg-accent-red/5 gap-2 transition-all hover:bg-accent-red/10 hover:shadow-[0_0_12px_rgba(239,68,68,0.3)]"
                style={{ color: '#ef4444' }}>
                <Trash2 size={18} />
                <span className="text-[9px] font-black uppercase tracking-widest">Delete All</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SettingsModal;