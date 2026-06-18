import { useState, useEffect, useRef } from 'react';
import { useUserStore } from '../store/useUserStore';

/**
 * StepDetector — gravity-projected velocity algorithm (Weinberg / MotionMate)
 * Works via the browser DeviceMotion API (Electron + Android Chrome + iOS Safari).
 */
export class StepDetector {
  private accelRingX: number[] = [];
  private accelRingY: number[] = [];
  private accelRingZ: number[] = [];
  private velRing: number[] = [];
  private lastStepTimeMs = 0;
  private oldVelocityEstimate = 0;
  private stepCount = 0;

  private readonly ACCEL_RING_SIZE = 50;
  private readonly VEL_RING_SIZE = 10;
  private readonly STEP_THRESHOLD = 10.0;
  private readonly STEP_DELAY_MS = 250;

  get steps(): number { return this.stepCount; }

  reset(): void {
    this.stepCount = 0;
    this.accelRingX = [];
    this.accelRingY = [];
    this.accelRingZ = [];
    this.velRing = [];
    this.oldVelocityEstimate = 0;
    this.lastStepTimeMs = 0;
  }

  updateAccel(x: number, y: number, z: number, timestampMs: number): void {
    this.accelRingX.push(x);
    this.accelRingY.push(y);
    this.accelRingZ.push(z);
    if (this.accelRingX.length > this.ACCEL_RING_SIZE) {
      this.accelRingX.shift();
      this.accelRingY.shift();
      this.accelRingZ.shift();
    }

    const len = this.accelRingX.length;
    const gx = this.accelRingX.reduce((a, b) => a + b, 0) / len;
    const gy = this.accelRingY.reduce((a, b) => a + b, 0) / len;
    const gz = this.accelRingZ.reduce((a, b) => a + b, 0) / len;
    const norm = Math.sqrt(gx * gx + gy * gy + gz * gz);
    if (norm === 0) return;

    const ugx = gx / norm;
    const ugy = gy / norm;
    const ugz = gz / norm;
    const currentZ = (x * ugx + y * ugy + z * ugz) - norm;

    this.velRing.push(currentZ);
    if (this.velRing.length > this.VEL_RING_SIZE) this.velRing.shift();
    const velocityEstimate = this.velRing.reduce((a, b) => a + b, 0);

    if (
      velocityEstimate > this.STEP_THRESHOLD &&
      this.oldVelocityEstimate <= this.STEP_THRESHOLD &&
      timestampMs - this.lastStepTimeMs > this.STEP_DELAY_MS
    ) {
      this.stepCount++;
      this.lastStepTimeMs = timestampMs;
    }
    this.oldVelocityEstimate = velocityEstimate;
  }
}

// ─── useStepCounter hook ────────────────────────────────────────────────────

export const useStepCounter = () => {
  const { user, updateSteps } = useUserStore();
  const detectorRef = useRef(new StepDetector());
  const distanceRef = useRef(0);
  const listenerActiveRef = useRef(false);
  const motionHandlerRef = useRef<((e: DeviceMotionEvent) => void) | null>(null);
  const geoWatchIdRef = useRef<number | null>(null);
  const lastCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  const [liveSteps, setLiveSteps] = useState(0);
  const [isTracking, setIsTracking] = useState(false);

  // Haversine distance (metres)
  const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const f1 = (lat1 * Math.PI) / 180;
    const f2 = (lat2 * Math.PI) / 180;
    const df = ((lat2 - lat1) * Math.PI) / 180;
    const dl = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(df / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const startMotionListener = () => {
    if (listenerActiveRef.current) return;

    const handler = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity ?? event.acceleration;
      if (!acc) return;
      const oldSteps = detectorRef.current.steps;
      detectorRef.current.updateAccel(
        acc.x ?? 0,
        acc.y ?? 0,
        acc.z ?? 0,
        Date.now(),
      );
      const newSteps = detectorRef.current.steps;
      if (newSteps !== oldSteps) {
        setLiveSteps(newSteps);
        updateSteps(newSteps, distanceRef.current);
      }
    };

    window.addEventListener('devicemotion', handler);
    motionHandlerRef.current = handler;
    listenerActiveRef.current = true;
    setIsTracking(true);
    console.log('[StepCounter] DeviceMotion listener started');
  };

  const startGeoTracking = () => {
    if (!navigator.geolocation || geoWatchIdRef.current !== null) return;
    geoWatchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        if (lastCoordsRef.current) {
          const d = haversine(lastCoordsRef.current.lat, lastCoordsRef.current.lng, lat, lng);
          if (d > 2 && d < 100) distanceRef.current += d;
        }
        lastCoordsRef.current = { lat, lng };
      },
      (err) => console.warn('[StepCounter] Geo error:', err.message),
      { enableHighAccuracy: true, maximumAge: 2000 },
    );
  };

  // Auto-start on mount — no user gesture needed on Electron / Android Chrome.
  // iOS Safari requires requestPermission(), so we skip auto-start there.
  useEffect(() => {
    const needsPermission =
      typeof DeviceMotionEvent !== 'undefined' &&
      typeof (DeviceMotionEvent as any).requestPermission === 'function';

    if (!needsPermission) {
      startMotionListener();
      startGeoTracking();
    }

    return () => {
      if (motionHandlerRef.current) {
        window.removeEventListener('devicemotion', motionHandlerRef.current);
        motionHandlerRef.current = null;
        listenerActiveRef.current = false;
      }
      if (geoWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
        geoWatchIdRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync detector → Zustand store every 5 s and update live state
  useEffect(() => {
    const timer = window.setInterval(() => {
      const steps = detectorRef.current.steps;
      const dist = distanceRef.current;
      setLiveSteps(steps);
      if (steps > 0 || dist > 0) {
        updateSteps(steps, dist);
      }
    }, 5000);

    return () => {
      clearInterval(timer);
      const finalSteps = detectorRef.current.steps;
      if (finalSteps > 0 || distanceRef.current > 0) {
        updateSteps(finalSteps, distanceRef.current);
      }
    };
  }, [updateSteps]);

  // iOS permission gate + non-iOS ensure-started
  const requestPermission = async (): Promise<boolean> => {
    if (
      typeof DeviceMotionEvent !== 'undefined' &&
      typeof (DeviceMotionEvent as any).requestPermission === 'function'
    ) {
      try {
        const result = await (DeviceMotionEvent as any).requestPermission();
        if (result === 'granted') {
          startMotionListener();
          startGeoTracking();
          return true;
        }
        return false;
      } catch {
        startMotionListener();
        startGeoTracking();
        return true;
      }
    }
    startMotionListener();
    startGeoTracking();
    return true;
  };

  const resetData = () => {
    detectorRef.current.reset();
    distanceRef.current = 0;
    setLiveSteps(0);
    updateSteps(0, 0);
  };

  // Combine live detector value and persisted store's steps/distance
  const displaySteps = Math.max(liveSteps, user?.currentSteps || 0);
  const displayDistance = Math.max(distanceRef.current, user?.currentDistance || 0);

  return {
    steps: displaySteps,
    distance: displayDistance,
    isTracking,
    requestPermission,
    resetData,
  };
};
