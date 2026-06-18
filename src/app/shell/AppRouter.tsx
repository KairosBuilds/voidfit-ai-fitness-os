import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUiStore } from '../../store/useUiStore';
import { useUserStore } from '../../store/useUserStore';
import { FEATURE_FLAGS } from '../../config/featureFlags';

// Core Views
import Dashboard from '../../../components/Dashboard';
import ComingSoon from '../../../components/ComingSoon';

const lazyWithError = <T extends React.ComponentType>(factory: () => Promise<{ default: T }>, name: string) =>
  React.lazy(() =>
    factory().catch(err => {
      console.error(`[Router] Failed to load ${name}:`, err);
      return { default: (() => null) as unknown as T };
    })
  );

const ProgressJournal = lazyWithError(() => import('../../../components/journal/ProgressJournal').then(m => ({ default: m.ProgressJournal })), 'ProgressJournal');
const SkillTree = lazyWithError(() => import('../../../components/SkillTree'), 'SkillTree');
const Chatbot = lazyWithError(() => import('../../../components/Chatbot'), 'Chatbot');
const EvolutionCenter = lazyWithError(() => import('../../../components/EvolutionCenter'), 'EvolutionCenter');
const GrowthCenter = lazyWithError(() => import('../../../components/GrowthCenter'), 'GrowthCenter');
const BodyAnatomy = lazyWithError(() => import('../../../components/BodyAnatomy'), 'BodyAnatomy');
const TerritoryMap = lazyWithError(() => import('../../../components/territory/TerritoryMap').then(m => ({ default: m.TerritoryMap })), 'TerritoryMap');
const Leaderboard = lazyWithError(() => import('../../../components/multiplayer/Leaderboard').then(m => ({ default: m.Leaderboard })), 'Leaderboard');
const Guilds = lazyWithError(() => import('../../../components/multiplayer/Guilds').then(m => ({ default: m.Guilds })), 'Guilds');
const PvP = lazyWithError(() => import('../../../components/multiplayer/PvP').then(m => ({ default: m.PvP })), 'PvP');
const Challenges = lazyWithError(() => import('../../../components/challenges/Challenges').then(m => ({ default: m.Challenges })), 'Challenges');
const SettingsModal = lazyWithError(() => import('../../../components/SettingsModal'), 'SettingsModal');
const Menu = lazyWithError(() => import('../../../components/Menu'), 'Menu');
const BodyDiagnostics = lazyWithError(() => import('../../../components/diagnostics/BodyDiagnostics').then(m => ({ default: m.BodyDiagnostics })), 'BodyDiagnostics');
const Analytics = lazyWithError(() => import('../../../components/Analytics'), 'Analytics');
const Badges = lazyWithError(() => import('../../../components/Badges'), 'Badges');
const BrainVault = lazyWithError(() => import('../../../components/BrainVault'), 'BrainVault');
const HabitMatrix = lazyWithError(() => import('../../../components/HabitMatrix'), 'HabitMatrix');
const HealthArchiver = lazyWithError(() => import('../../../components/HealthArchiver'), 'HealthArchiver');
const Journal = lazyWithError(() => import('../../../components/Journal'), 'Journal');
const ProgressHistory = lazyWithError(() => import('../../../components/ProgressHistory'), 'ProgressHistory');
const StoryLog = lazyWithError(() => import('../../../components/StoryLog'), 'StoryLog');
const SystemLog = lazyWithError(() => import('../../../components/SystemLog'), 'SystemLog');
const SystemMechanics = lazyWithError(() => import('../../../components/SystemMechanics'), 'SystemMechanics');
const Timer = lazyWithError(() => import('../../../components/Timer'), 'Timer');
const NutritionPage = lazyWithError(() => import('../../../components/NutritionPage'), 'NutritionPage');
const WeightPage = lazyWithError(() => import('../../../components/WeightPage'), 'WeightPage');
const StepsPage = lazyWithError(() => import('../../../components/StepsPage'), 'StepsPage');
const StreakPage = lazyWithError(() => import('../../../components/StreakPage'), 'StreakPage');
const ProfilePage = lazyWithError(() => import('../../../components/ProfilePage'), 'ProfilePage');

// Loading fallback
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-[0_0_15px_var(--accent)]" />
  </div>
);

class AppRouteErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-2xl mx-auto py-20 px-6">
          <div className="glass-effect rounded-[2rem] p-8 border border-glass-border text-center">
            <h2 className="text-xl font-black text-main-text mb-2">View failed to load</h2>
            <p className="text-sub-text mb-4">Something went wrong while rendering this section.</p>
          </div>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

const SafeRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AppRouteErrorBoundary>{children}</AppRouteErrorBoundary>
);

export const AppRouter: React.FC = () => {
  const { view, setView } = useUiStore();
  const { user } = useUserStore();

  const routes: Record<string, React.ReactNode> = {
    dashboard: <SafeRoute><Dashboard /></SafeRoute>,
    chatbot: <SafeRoute><Chatbot /></SafeRoute>,
    growth: <SafeRoute><GrowthCenter /></SafeRoute>,
    evolution: <SafeRoute><EvolutionCenter /></SafeRoute>,
    skill_tree: <SafeRoute><SkillTree /></SafeRoute>,
    menu: <SafeRoute><Menu /></SafeRoute>,
    settings: <SafeRoute><SettingsModal isOpen={true} onClose={() => setView('dashboard')} /></SafeRoute>,
    
    // MMORPG Route mappings
    territory: <SafeRoute><TerritoryMap /></SafeRoute>,
    map: <SafeRoute><TerritoryMap /></SafeRoute>,
    leaderboard: FEATURE_FLAGS.MULTIPLAYER ? <SafeRoute><Leaderboard /></SafeRoute> : <ComingSoon feature="Leaderboard" />,
    guild: FEATURE_FLAGS.MULTIPLAYER ? <SafeRoute><Guilds /></SafeRoute> : <ComingSoon feature="Guilds" />,
    pvp: FEATURE_FLAGS.MULTIPLAYER ? <SafeRoute><PvP /></SafeRoute> : <ComingSoon feature="PvP Arena" />,
    challenges: <SafeRoute><Challenges /></SafeRoute>,
    bodyscan: <SafeRoute><BodyDiagnostics /></SafeRoute>,
    bodydiagnostics: <SafeRoute><BodyDiagnostics /></SafeRoute>,
    progress: <SafeRoute><ProgressJournal /></SafeRoute>,
    
    // Additional System Routes
    analytics: <SafeRoute><Analytics /></SafeRoute>,
    badges: <SafeRoute><Badges /></SafeRoute>,
    brain_vault: <SafeRoute><BrainVault /></SafeRoute>,
    habits: <SafeRoute><HabitMatrix /></SafeRoute>,
    psych: <SafeRoute><HealthArchiver /></SafeRoute>,
    journal: <SafeRoute><Journal /></SafeRoute>,
    progress_history: <SafeRoute><ProgressHistory /></SafeRoute>,
    story_log: <SafeRoute><StoryLog /></SafeRoute>,
    system_log: <SafeRoute><SystemLog /></SafeRoute>,
    system_mechanics: <SafeRoute><SystemMechanics /></SafeRoute>,
    timer: <SafeRoute><Timer /></SafeRoute>,
    physiqueroadmap: <SafeRoute><BodyAnatomy user={user} /></SafeRoute>,
    medical: <SafeRoute><BodyDiagnostics /></SafeRoute>,
    workout: <SafeRoute><Dashboard /></SafeRoute>,
    nutrition: <SafeRoute><HabitMatrix /></SafeRoute>,
    nutrition_page: <SafeRoute><NutritionPage /></SafeRoute>,
    weight_page: <SafeRoute><WeightPage /></SafeRoute>,
    steps_page: <SafeRoute><StepsPage /></SafeRoute>,
    streak_page: <SafeRoute><StreakPage /></SafeRoute>,
    profile: <SafeRoute><ProfilePage /></SafeRoute>,
    help: <SafeRoute><SystemMechanics /></SafeRoute>,
  };

  const currentRoute = routes[view] || routes.dashboard;

  const pageVariants: Record<string, { initial: any; animate: any; exit: any }> = {
    dashboard: {
      initial: { opacity: 0, y: 12, scale: 0.98 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: -8, scale: 0.98 },
    },
    default: {
      initial: { opacity: 0, x: 24, scale: 0.97 },
      animate: { opacity: 1, x: 0, scale: 1 },
      exit: { opacity: 0, x: -16, scale: 0.98 },
    },
  };

  const pageVariant = pageVariants[view] || pageVariants.default;

  return (
    <React.Suspense fallback={<PageLoader />}>
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={pageVariant.initial}
          animate={pageVariant.animate}
          exit={pageVariant.exit}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-full h-full"
        >
          {currentRoute}
        </motion.div>
      </AnimatePresence>
    </React.Suspense>
  );
};

export default AppRouter;
