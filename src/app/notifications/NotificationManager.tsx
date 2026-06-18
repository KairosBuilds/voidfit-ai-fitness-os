import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import NotificationOverlay from '../../../components/NotificationOverlay';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'achievement';
  timestamp: number;
  duration?: number;
}

interface NotificationManagerProps {
  children: React.ReactNode;
}

const NotificationContext = React.createContext<{
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
}>({
  addNotification: () => {},
  removeNotification: () => {},
});

export const useNotifications = () => React.useContext(NotificationContext);

export const NotificationManager: React.FC<NotificationManagerProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const addNotification = useCallback((notification: Omit<AppNotification, 'id' | 'timestamp'>) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: AppNotification = {
      ...notification,
      id,
      timestamp: Date.now(),
      duration: notification.duration || 5000,
    };
    
    setNotifications(prev => [...prev, newNotification]);

    // Auto remove after duration
    setTimeout(() => {
      removeNotification(id);
    }, newNotification.duration);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'achievement': return Trophy;
      case 'success': return CheckCircle;
      case 'warning': return AlertTriangle;
      default: return Info;
    }
  };

  const getColors = (type: AppNotification['type']) => {
    switch (type) {
      case 'achievement':
        return 'bg-accent-yellow/20 border-accent-yellow/40 text-accent-yellow';
      case 'success':
        return 'bg-accent-green/20 border-accent-green/40 text-accent-green';
      case 'warning':
        return 'bg-accent-red/20 border-accent-red/40 text-accent-red';
      default:
        return 'bg-primary-action/20 border-primary-action/40 text-primary-action';
    }
  };

  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification }}>
      {children}
      
      <NotificationOverlay 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </NotificationContext.Provider>
  );
};
