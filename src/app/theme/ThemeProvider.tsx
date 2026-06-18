import React, { useEffect, useMemo, useState } from 'react';
import { ThemeConfig, HealthStatus } from '../../types/app';
import { useUserStore } from '../../store/useUserStore';
import { useUiStore } from '../../store/useUiStore';
import { dragonTheme, teddyTheme } from '../../app/theme/themes';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUserStore();
  const { themeMode } = useUiStore();
  
  // Health status state - defaults to healthy
  // TODO: Connect to punishment system when implemented
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('healthy');

  const theme = useMemo<ThemeConfig>(() => {
    const isFemale = user.bodyMetrics.gender === 'Female';
    const isDark = themeMode === 'dark';
    const baseTheme = isFemale 
      ? teddyTheme[isDark ? 'dark' : 'light']
      : dragonTheme[isDark ? 'dark' : 'light'];
    
    // Apply punishment visual effects
    if (healthStatus === 'weakened') {
      return applyWeakenedEffect(baseTheme);
    }
    if (healthStatus === 'critical' || healthStatus === 'near_death') {
      return applyCriticalEffect(baseTheme);
    }
    
    return baseTheme;
  }, [user.bodyMetrics.gender, themeMode, healthStatus]);

  useEffect(() => {
    // Apply CSS variables
    const root = document.documentElement;
    Object.entries(theme.cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value as string);
    });
    
    // Set data attributes for selectors
    root.setAttribute('data-theme', theme.id);
    // TODO: Add avatar stage to User type
    root.setAttribute('data-avatar-stage', 'novice');
    root.setAttribute('data-health', healthStatus);
  }, [theme, healthStatus]);

  return (
    <div className={`theme-${theme.id}`}>
      {children}
    </div>
  );
};

function applyWeakenedEffect(theme: ThemeConfig): ThemeConfig {
  return {
    ...theme,
    cssVariables: {
      ...theme.cssVariables,
      '--primary-action': desaturate(theme.cssVariables['--primary-action']),
      '--accent': desaturate(theme.cssVariables['--accent']),
      '--neon-glow': 'transparent',
      '--teddy-glow': 'rgba(100, 100, 100, 0.3)',
    }
  };
}

function applyCriticalEffect(theme: ThemeConfig): ThemeConfig {
  return {
    ...theme,
    cssVariables: {
      ...theme.cssVariables,
      '--background': '#0a0000',
      '--surface': '#150505',
      '--primary-action': '#ff0000',
      '--accent': '#990000',
      '--neon-glow': 'transparent',
    }
  };
}

function desaturate(hexColor: string): string {
  // Simple desaturation - convert to grayscale
  const rgb = hexToRgb(hexColor);
  if (!rgb) return hexColor;
  const gray = Math.round((rgb.r + rgb.g + rgb.b) / 3);
  return rgbToHex(gray, gray, gray);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
