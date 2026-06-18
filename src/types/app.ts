// App-level types for MMORPG architecture

export type AppRoute =
  // Core
  | 'dashboard'
  | 'workout'
  | 'nutrition'
  | 'progress'
  | 'profile'
  // Avatar
  | 'avatar'
  | 'evolution'
  | 'customize'
  | 'rank'
  // Multiplayer
  | 'territory'
  | 'map'
  | 'leaderboard'
  | 'guild'
  | 'challenges'
  | 'pvp'
  // AI
  | 'coach'
  | 'bodyscan'
  | 'physiqueroadmap'
  // Tracking
  | 'bodydiagnostics'
  | 'habits'
  | 'measurements'
  | 'photos'
  // Social
  | 'friends'
  | 'feed'
  | 'invites'
  // System
  | 'settings'
  | 'help'
  | 'about';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    route: AppRoute;
  };
}

export interface ThemeConfig {
  id: string;
  name: string;
  cssVariables: Record<string, string>;
  isDark: boolean;
  avatarStage: AvatarStage;
  healthStatus: HealthStatus;
}

export type AvatarStage = 
  | 'novice'
  | 'initiate'
  | 'warrior'
  | 'veteran'
  | 'elite'
  | 'champion'
  | 'master'
  | 'legend'
  | 'transcendent';

export type HealthStatus = 'healthy' | 'weakened' | 'critical' | 'near_death';

export interface AppError {
  id: string;
  message: string;
  stack?: string;
  component?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ProgressJournalEntry {
  id: string;
  timestamp: string;
  type: 'milestone' | 'weight' | 'streak' | 'strength' | 'transformation';
  title: string;
  description: string;
  metricChange?: {
    metric: string;
    previous: number;
    current: number;
    unit: string;
  };
  xpAward?: number;
  rankChange?: {
    from: string;
    to: string;
  };
}
