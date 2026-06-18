import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Bell, Heart, MapPin, Footprints, HardDrive, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { permissionManager, AppPermission } from '../../permissions/PermissionManager';

interface PermissionsRequestProps {
  onComplete: () => void;
  onSkip: () => void;
}

interface PermissionItemProps {
  permission: AppPermission;
  status: 'pending' | 'loading' | 'granted' | 'denied';
  onRequest: () => void;
}

const permissionConfig: Record<AppPermission, { icon: React.ElementType; title: string; description: string; required: boolean }> = {
  health_data: {
    icon: Heart,
    title: 'Health Data',
    description: 'For accurate step counting and workout tracking',
    required: true,
  },
  notifications: {
    icon: Bell,
    title: 'Notifications',
    description: 'Workout reminders and streak warnings',
    required: true,
  },
  camera: {
    icon: Camera,
    title: 'Camera',
    description: 'Scan meals and take progress photos',
    required: false,
  },
  location: {
    icon: MapPin,
    title: 'Location',
    description: 'For territory capture and GPS tracking',
    required: false,
  },
  activity_recognition: {
    icon: Footprints,
    title: 'Activity Recognition',
    description: 'Better step detection and workout tracking',
    required: false,
  },
  storage: {
    icon: HardDrive,
    title: 'Storage',
    description: 'Save progress photos and offline data',
    required: false,
  },
  background_location: {
    icon: MapPin,
    title: 'Background Location',
    description: 'Territory capture while app is in background',
    required: false,
  },
  photos: {
    icon: Camera,
    title: 'Photo Library',
    description: 'Upload photos from your gallery',
    required: false,
  },
  microphone: {
    icon: Heart, // Placeholder
    title: 'Microphone',
    description: 'Future voice features',
    required: false,
  },
};

export const PermissionsRequest: React.FC<PermissionsRequestProps> = ({ onComplete, onSkip }) => {
  const [permissions, setPermissions] = useState<AppPermission[]>([
    'health_data', 'notifications', 'camera', 'location', 'activity_recognition', 'storage', 'photos', 'background_location', 'microphone'
  ]);
  const [statuses, setStatuses] = useState<Record<AppPermission, 'pending' | 'loading' | 'granted' | 'denied'>>({
    health_data: 'pending',
    notifications: 'pending',
    camera: 'pending',
    location: 'pending',
    activity_recognition: 'pending',
    storage: 'pending',
    background_location: 'pending',
    photos: 'pending',
    microphone: 'pending',
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showWarning, setShowWarning] = useState(false);

  const requestNext = async () => {
    if (currentIndex >= permissions.length) {
      onComplete();
      return;
    }

    const permission = permissions[currentIndex];
    setStatuses(prev => ({ ...prev, [permission]: 'loading' }));

    const result = await permissionManager.requestPermission(permission, { onboarding: true });
    
    setStatuses(prev => ({ 
      ...prev, 
      [permission]: result ? 'granted' : 'denied' 
    }));

    // If critical permission denied, show warning
    const config = permissionConfig[permission];
    if (!result && config.required) {
      setShowWarning(true);
      return;
    }

    // Move to next after short delay
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
    }, 500);
  };

  useEffect(() => {
    requestNext();
  }, [currentIndex]);

  const handleContinueAnyway = () => {
    setShowWarning(false);
    setCurrentIndex(prev => prev + 1);
  };

  const handleRetry = () => {
    setShowWarning(false);
    // Retry same permission
    requestNext();
  };

  const grantedCount = Object.values(statuses).filter(s => s === 'granted').length;
  const totalCount = permissions.length;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary-action/20 flex items-center justify-center">
            <span className="text-4xl">🔐</span>
          </div>
          <h1 className="text-2xl font-bold text-main-text mb-2">
            Setting Up Your Fitness OS
          </h1>
          <p className="text-sub-text">
            LevelUp needs a few permissions to track your transformation
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-sub-text mb-2">
            <span>Progress</span>
            <span>{grantedCount}/{totalCount}</span>
          </div>
          <div className="h-2 bg-surface rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-action transition-all duration-500"
              style={{ width: `${(grantedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>

        {/* Permission List */}
        <div className="space-y-3 mb-8">
          {permissions.map((permission, index) => {
            const config = permissionConfig[permission];
            const Icon = config.icon;
            const status = statuses[permission];
            const isCurrent = index === currentIndex;
            const isPast = index < currentIndex;
            const isFuture = index > currentIndex;

            return (
              <motion.div
                key={permission}
                initial={{ opacity: 0, x: -20 }}
                animate={{ 
                  opacity: isFuture ? 0.5 : 1,
                  x: 0,
                  scale: isCurrent ? 1.02 : 1,
                }}
                className={`p-4 rounded-xl border transition-all ${
                  status === 'granted' 
                    ? 'bg-accent-green/10 border-accent-green/30' 
                    : status === 'denied'
                    ? 'bg-accent-red/10 border-accent-red/30'
                    : isCurrent
                    ? 'bg-primary-action/10 border-primary-action'
                    : 'bg-surface border-glass-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    status === 'granted' 
                      ? 'bg-accent-green/20 text-accent-green' 
                      : status === 'denied'
                      ? 'bg-accent-red/20 text-accent-red'
                      : 'bg-primary-action/20 text-primary-action'
                  }`}>
                    {status === 'loading' ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Icon size={20} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-main-text">{config.title}</span>
                      {config.required && (
                        <span className="text-xs px-2 py-0.5 rounded bg-accent-yellow/20 text-accent-yellow">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-sub-text">{config.description}</p>
                  </div>
                  {status === 'granted' && <Check size={20} className="text-accent-green" />}
                  {status === 'denied' && <AlertTriangle size={20} className="text-accent-red" />}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Warning Modal */}
        {showWarning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <div className="glass-effect rounded-2xl p-6 max-w-sm w-full">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-accent-yellow/20 flex items-center justify-center">
                <AlertTriangle size={24} className="text-accent-yellow" />
              </div>
              <h3 className="text-lg font-bold text-main-text text-center mb-2">
                Important Permission Denied
              </h3>
              <p className="text-sm text-sub-text text-center mb-6">
                Without this permission, some features won't work properly. 
                You can enable it later in Settings.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleContinueAnyway}
                  className="flex-1 py-3 rounded-xl bg-surface text-main-text font-semibold hover:bg-surface/80 transition-colors"
                >
                  Continue Anyway
                </button>
                <button
                  onClick={handleRetry}
                  className="flex-1 py-3 rounded-xl bg-primary-action text-white font-semibold hover:opacity-90 transition-opacity"
                >
                  Retry
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Skip button */}
        {currentIndex < permissions.length && (
          <button
            onClick={onSkip}
            className="w-full py-3 text-sub-text hover:text-main-text transition-colors text-sm"
          >
            Skip for now →
          </button>
        )}
      </motion.div>
    </div>
  );
};
