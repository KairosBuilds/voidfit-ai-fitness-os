import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';

export const requestAllPermissions = async () => {
  const platform = Capacitor.getPlatform();
  console.log(`[VoidFit] Initiating permission sync for platform: ${platform}`);

  if (platform === 'web') {
    console.log('[VoidFit] Running in Browser/Electron. Skipping mobile permission requests.');
    try {
        // Request basic web geolocation if available
        if (navigator.geolocation) {
            await new Promise((resolve) => {
                navigator.geolocation.getCurrentPosition(resolve, resolve, { timeout: 5000 });
            });
        }
    } catch (e) {}
    return true;
  }

  try {
    // 1. Notifications
    const notifRes = await LocalNotifications.checkPermissions();
    if (notifRes.display !== 'granted') {
        await LocalNotifications.requestPermissions();
    }

    // 2. Camera
    const camRes = await Camera.checkPermissions();
    if (camRes.camera !== 'granted') {
        await Camera.requestPermissions();
    }

    // 3. Geolocation
    const geoRes = await Geolocation.checkPermissions();
    if (geoRes.location !== 'granted') {
        await Geolocation.requestPermissions();
    }

    // 4. Activity Recognition (Motion) 
    // This often needs to be triggered by a user gesture on iOS
    if (typeof DeviceMotionEvent !== 'undefined' && (DeviceMotionEvent as any).requestPermission) {
      await (DeviceMotionEvent as any).requestPermission();
    }

    return true;
  } catch (error) {
    console.warn('[VoidFit] Mobile permission request failed (continuing anyway):', error);
    return false;
  }
};
