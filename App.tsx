import React from 'react';
import { Capacitor } from '@capacitor/core';
import { AppShell } from './src/app/shell/AppShell';
import { AppRouter } from './src/app/shell/AppRouter';
import { useUiStore } from './src/store/useUiStore';
import { useUserStore } from './src/store/useUserStore';
import { useAuthStore } from './src/store/useAuthStore';
import OnboardingWizard from './components/OnboardingWizard';
import WeeklyCheckInModal from './components/WeeklyCheckInModal';
import { useFullscreen } from './src/hooks/useFullscreen';
import { WeeklyCheckIn } from './types';

import { requestAllPermissions } from './src/services/permissionService';
import { useDatabase } from './src/db/useDatabase';
import { finalizeWeeklyCheckIn } from './src/services/weeklyCheckInService';
import { toast } from './src/store/useToastStore';

const App: React.FC = () => {
  const { addCheckInLog } = useDatabase();
  const { isOnboardingComplete, setView, completeOnboarding } = useUiStore();
  const { markOnboardingComplete, setUser, user } = useUserStore();
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const { setApiKey } = useAuthStore();

  const [showWeeklyCheckIn, setShowWeeklyCheckIn] = React.useState(false);

  React.useEffect(() => {
    useUserStore.getState().checkDailyReset().catch(err => console.error('[VoidFit] Daily reset failed:', err));
  }, []);

  React.useEffect(() => {
    const isMobile = typeof window !== 'undefined' && (Capacitor.getPlatform() !== 'web' || /Mobi|Android|iPhone/i.test(window.navigator.userAgent));
    if (isMobile && !isFullscreen) {
      requestAllPermissions();
      toggleFullscreen();
    }
  }, []);

  // Always render this effect — must come before any conditional return
  React.useEffect(() => {
    const u = useUserStore.getState().user;
    if (!u) return;
    const lastCheckIn = u.lastWeeklyCheckIn;
    if (!lastCheckIn) { setShowWeeklyCheckIn(true); return; }
    const daysSince = (Date.now() - new Date(lastCheckIn).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince >= 7) setShowWeeklyCheckIn(true);
  }, []);

  if (!isOnboardingComplete) {
    return (
      <OnboardingWizard 
        onComplete={(apiKey, name, stats, personality) => {
          // 1. Save API key immediately
          if (apiKey) {
            setApiKey(apiKey, 'gemini');
          }

          // 2. Save user profile
          setUser((prev) => ({
            ...prev,
            name: name || prev.name || 'Athlete',
            personality: personality || prev.personality,
            bodyMetrics: { ...prev.bodyMetrics, ...stats },
          }));

          // 3. Mark completion in all stores
          markOnboardingComplete();
          completeOnboarding();

          // 4. Navigate to dashboard
          setView('dashboard');
        }} 
      />
    );
  }

  return (
    <AppShell>
      <AppRouter />

      {/* Weekly Check-In Modal */}
      <WeeklyCheckInModal
        isOpen={showWeeklyCheckIn}
        onClose={() => setShowWeeklyCheckIn(false)}
        onSubmit={async (data: WeeklyCheckIn) => {
          try {
            const { apiKey } = useAuthStore.getState();
            const currentUser = useUserStore.getState().user;
            const { systemMessage } = await finalizeWeeklyCheckIn({
              data,
              apiKey,
              user: currentUser,
              addCheckInLog,
              setUser,
            });
            setShowWeeklyCheckIn(false);
            if (systemMessage) {
              toast.success(systemMessage.length > 120 ? `${systemMessage.slice(0, 120)}…` : systemMessage);
            } else {
              toast.success('Weekly check-in saved.');
            }
          } catch (err) {
            console.error('[App] Weekly check-in failed:', err);
            toast.error('Weekly check-in failed. Please try again.');
          }
        }}
        currentWeight={user?.bodyMetrics?.currentWeight ?? 0}
      />

    </AppShell>
  );
};

export default App;
