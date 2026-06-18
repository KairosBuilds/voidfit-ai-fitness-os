import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Camera } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';

export type AppPermission =
  | 'camera'
  | 'notifications'
  | 'health_data'
  | 'activity_recognition'
  | 'location'
  | 'background_location'
  | 'storage'
  | 'photos'
  | 'microphone';

interface PermissionState {
  status: 'granted' | 'denied' | 'prompt' | 'not_determined';
  askedCount: number;
  lastAsked: string | null;
  rationaleShown: boolean;
}

interface PermissionResult {
  permission: AppPermission;
  granted: boolean;
}

interface PermissionRationale {
  title: string;
  explanation: string;
  icon: string;
}

class PermissionManagerClass {
  private states: Map<AppPermission, PermissionState> = new Map();

  async initialize(): Promise<void> {
    // Initialize default states
    const permissions: AppPermission[] = [
      'camera', 'notifications', 'health_data', 'location',
      'activity_recognition', 'storage', 'photos', 'microphone'
    ];
    
    for (const permission of permissions) {
      if (!this.states.has(permission)) {
        this.states.set(permission, {
          status: 'not_determined',
          askedCount: 0,
          lastAsked: null,
          rationaleShown: false,
        });
      }
    }
  }

  async requestPermission(
    permission: AppPermission,
    context?: { onboarding?: boolean }
  ): Promise<boolean> {
    const platform = Capacitor.getPlatform();
    if (platform === 'web') {
      return true; // Bypass on Electron/Web
    }

    const state = this.states.get(permission);
    
    // Already granted
    if (state?.status === 'granted') return true;
    
    // Check current status
    const currentStatus = await this.checkNativeStatus(permission);
    
    if (currentStatus === 'granted') {
      this.states.set(permission, { ...state!, status: 'granted' });
      return true;
    }
    
    if (currentStatus === 'denied') {
      this.states.set(permission, { ...state!, status: 'denied' });
      if (context?.onboarding) {
        await this.showSettingsGuidance(permission);
      }
      return false;
    }
    
    // Request the permission
    const granted = await this.requestFromSystem(permission);
    
    this.states.set(permission, {
      status: granted ? 'granted' : 'denied',
      askedCount: (state?.askedCount || 0) + 1,
      lastAsked: new Date().toISOString(),
      rationaleShown: true,
    });
    
    return granted;
  }

  async requestBulkPermissions(
    permissions: AppPermission[],
    onboarding?: boolean
  ): Promise<PermissionResult[]> {
    const platform = Capacitor.getPlatform();
    if (platform === 'web') {
      return permissions.map(p => ({ permission: p, granted: true }));
    }

    const results: PermissionResult[] = [];
    const ordered = this.orderByImportance(permissions);
    
    for (const permission of ordered) {
      const granted = await this.requestPermission(permission, { onboarding });
      results.push({ permission, granted });
      
      // Small delay between requests
      if (onboarding) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return results;
  }

  private async checkNativeStatus(permission: AppPermission): Promise<string> {
    try {
      switch (permission) {
        case 'camera':
          const cameraStatus = await Camera.checkPermissions();
          return cameraStatus.camera;
        case 'notifications':
          const notifStatus = await LocalNotifications.checkPermissions();
          return notifStatus.display;
        case 'location':
        case 'background_location':
          const geoStatus = await Geolocation.checkPermissions();
          return geoStatus.location;
        default:
          return 'prompt';
      }
    } catch {
      return 'prompt';
    }
  }

  private async requestFromSystem(permission: AppPermission): Promise<boolean> {
    try {
      switch (permission) {
        case 'camera':
          const cameraResult = await Camera.requestPermissions();
          return cameraResult.camera === 'granted';
        case 'notifications':
          const notifResult = await LocalNotifications.requestPermissions();
          return notifResult.display === 'granted';
        case 'location':
        case 'background_location':
          const geoResult = await Geolocation.requestPermissions();
          return geoResult.location === 'granted';
        default:
          return true;
      }
    } catch {
      return false;
    }
  }

  private orderByImportance(permissions: AppPermission[]): AppPermission[] {
    const importance: Record<AppPermission, number> = {
      health_data: 1,
      notifications: 2,
      camera: 3,
      location: 4,
      activity_recognition: 5,
      storage: 6,
      photos: 7,
      background_location: 8,
      microphone: 9,
    };
    
    return [...permissions].sort((a, b) => importance[a] - importance[b]);
  }

  private async showSettingsGuidance(permission: AppPermission): Promise<void> {
    const rationales: Record<AppPermission, string> = {
      camera: 'Camera access is needed for meal scanning and body photos. Please enable it in Settings.',
      notifications: 'Notifications help keep you on track with workouts. Please enable them in Settings.',
      health_data: 'Health data access enables accurate step tracking. Please enable it in Settings.',
      location: 'Location is used for territory capture and GPS tracking. Please enable it in Settings.',
      activity_recognition: 'Activity recognition improves step counting. Please enable it in Settings.',
      storage: 'Storage access saves your progress photos. Please enable it in Settings.',
      photos: 'Photo access lets you upload progress pictures. Please enable it in Settings.',
      background_location: 'Background location enables territory capture while walking. Please enable it in Settings.',
      microphone: 'Microphone will be used for voice features in future updates.',
    };

    // Show alert with guidance
    alert(rationales[permission]);
  }

  getPermissionState(permission: AppPermission): PermissionState | undefined {
    return this.states.get(permission);
  }
}

export const permissionManager = new PermissionManagerClass();
