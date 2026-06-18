import { db } from '../db/database';
import { Territory, Trail, User, ActivityMode, ACTIVITY_SPEED_LIMITS, Coordinate, Realm } from '../../types';
import { useUserStore } from '../store/useUserStore';

/** Assign a consistent neon color to any player name */
export function playerColor(name: string): string {
    const colors = [
        '#22c55e', '#ef4444', '#3b82f6', '#eab308', '#a855f7',
        '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

export type TrackingState = {
    active: boolean;
    activityMode: ActivityMode;
    currentSpeed: number;
    avgSpeed: number;
    totalDistance: number;
    elapsedSeconds: number;
    isCheater: boolean;
    violationCount: number;
};

export class TerritorySystem {
    private static currentTrail: Trail | null = null;
    private static watchId: number | null = null;
    private static state: TrackingState = {
        active: false,
        activityMode: 'walk',
        currentSpeed: 0,
        avgSpeed: 0,
        totalDistance: 0,
        elapsedSeconds: 0,
        isCheater: false,
        violationCount: 0,
    };
    private static lastPointTime = 0;
    private static startTimestamp = 0;
    private static onStateChange: ((s: TrackingState) => void) | null = null;

    static getState(): TrackingState {
        return { ...this.state };
    }

    static onStateChangeCallback(cb: (s: TrackingState) => void) {
        this.onStateChange = cb;
    }

    static setActivityMode(mode: ActivityMode) {
        this.state.activityMode = mode;
        this.emitState();
    }

    private static emitState() {
        this.onStateChange?.({ ...this.state });
    }

    static async startTracking(user: User, mode: ActivityMode = 'walk') {
        if (this.watchId !== null) return;

        if (!navigator.geolocation) {
            console.error('[Territory] Geolocation not supported.');
            return;
        }

        this.state = {
            active: true,
            activityMode: mode,
            currentSpeed: 0,
            avgSpeed: 0,
            totalDistance: 0,
            elapsedSeconds: 0,
            isCheater: false,
            violationCount: 0,
        };
        this.lastPointTime = Date.now();
        this.startTimestamp = Date.now();
        this.emitState();

        this.watchId = navigator.geolocation.watchPosition(
            (position) => this.handleUpdate(position, user),
            (error) => console.error('[Territory] GPS error:', error),
            { enableHighAccuracy: true, distanceFilter: 2, maximumAge: 1000 } as any,
        );
    }

    static stopTracking() {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }

        // Close out the trail
        if (this.currentTrail) {
            this.currentTrail.endTime = new Date().toISOString();
            this.currentTrail.status = this.state.violationCount > 3 ? 'abandoned' : 'completed';
            this.currentTrail.avgSpeed = this.state.avgSpeed;
            this.currentTrail.maxSpeed = this.state.currentSpeed;
            this.currentTrail.totalDistance = this.state.totalDistance;
            this.currentTrail.isCheater = this.state.isCheater;
            db.trails.put(this.currentTrail);
            this.currentTrail = null;
        }

        this.state.active = false;
        this.emitState();
    }

    private static async handleUpdate(position: GeolocationPosition, user: User) {
        const { latitude, longitude, speed, accuracy } = position.coords;
        const now = Date.now();
        const point: Coordinate = [latitude, longitude];

        // ---- Anti-Cheat: Speed Validation ----
        const gpsSpeed = speed !== null && speed !== undefined ? speed : 0;
        const limit = ACTIVITY_SPEED_LIMITS[this.state.activityMode].maxMps;

        if (gpsSpeed > limit && accuracy !== null && accuracy < 50) {
            this.state.violationCount++;
            this.state.currentSpeed = gpsSpeed;
            this.state.isCheater = this.state.violationCount > 3;
            console.warn(
                `[Territory] SPEED VIOLATION: ${gpsSpeed.toFixed(1)}m/s exceeds ${limit}m/s for ${this.state.activityMode} (violation #${this.state.violationCount})`,
            );

            if (this.state.violationCount > 5) {
                this.stopTracking();
                console.warn('[Territory] Tracking stopped — excessive speed violations detected.');
                return;
            }
            this.emitState();
            return; // Don't record cheated point
        }

        // ---- Distance Tracking ----
        const dt = (now - this.lastPointTime) / 1000;
        let dist = 0;
        if (this.lastPointTime > 0 && this.currentTrail && this.currentTrail.points.length > 0) {
            const last = this.currentTrail.points[this.currentTrail.points.length - 1];
            dist = this.haversine(last[0], last[1], latitude, longitude);
        }

        // Skip noisy GPS jitter (sub-2m jumps)
        if (dist > 0 && dist < 2) {
            this.emitState();
            return;
        }

        this.state.totalDistance += dist;
        this.state.currentSpeed = dt > 0 ? dist / dt : 0;
        this.state.elapsedSeconds = (now - this.startTimestamp) / 1000;
        this.state.avgSpeed = this.state.elapsedSeconds > 0 ? this.state.totalDistance / this.state.elapsedSeconds : 0;
        this.lastPointTime = now;
        this.emitState();

        // Calculate and update steps dynamically based on height (stride length bounded between 0.5m and 1.0m)
        const userState = useUserStore.getState();
        const heightInM = (userState.user?.bodyMetrics?.height && userState.user.bodyMetrics.height > 0)
            ? userState.user.bodyMetrics.height / 100
            : 1.75;
        const strideLength = Math.max(0.5, Math.min(1.0, heightInM * 0.413));
        const newSteps = Math.floor(this.state.totalDistance / strideLength);
        if (newSteps > 0) {
            userState.updateSteps(newSteps, this.state.totalDistance);
        }

        // ---- Trail Management ----
        if (!this.currentTrail) {
            this.currentTrail = {
                id: `trail-${Date.now()}`,
                userId: user.id,
                points: [point],
                startTime: new Date().toISOString(),
                endTime: null,
                status: 'active',
                activityMode: this.state.activityMode,
                totalDistance: 0,
                avgSpeed: 0,
                maxSpeed: 0,
                isCheater: false,
            };
            await db.trails.put(this.currentTrail);
        } else {
            this.currentTrail.points.push(point);
            this.currentTrail.totalDistance = this.state.totalDistance;
            this.currentTrail.avgSpeed = this.state.avgSpeed;
            this.currentTrail.maxSpeed = Math.max(this.currentTrail.maxSpeed || 0, this.state.currentSpeed);
            await db.trails.put(this.currentTrail);

            // ---- Territory Capture Check ----
            if (this.currentTrail.points.length > 15) {
                const start = this.currentTrail.points[0];
                const distToStart = this.haversine(start[0], start[1], latitude, longitude);
                if (distToStart < 20) {
                    await this.captureTerritory(this.currentTrail, user);
                }
            }
        }
    }

    // ---- Territory Capture with XP Reward ----
    private static async captureTerritory(trail: Trail, user: User) {
        const area = this.polygonArea(trail.points);
        if (area < 10) return; // Ignore tiny captures

        const color = playerColor(user.name);

        const territory: Territory = {
            id: `territory-${Date.now()}`,
            ownerId: user.id,
            ownerName: user.name,
            polygon: trail.points,
            area: Math.round(area),
            capturedAt: new Date().toISOString(),
            lastDefendedAt: new Date().toISOString(),
            defenseStreak: 1,
            centerPoint: this.polygonCenter(trail.points),
            activityMode: this.state.activityMode,
            color,
        };

        await db.territories.put(territory);
        this.currentTrail = null;

        // XP reward: 1 XP per 10 sqm (min 10, max 500)
        const xpReward = Math.min(500, Math.max(10, Math.round(area / 10)));
        useUserStore.getState().handleGrantReward(xpReward, Realm.Endurance, `Territory Capture: ${area.toFixed(0)}sqm`);

        console.log(`[Territory] CAPTURED: ${area.toFixed(0)}sqm by ${user.name} (+${xpReward} XP)`);
    }

    // ---- Leaderboard: highest total area ----
    static async getLeaderboard(): Promise<{ name: string; totalArea: number; count: number; color: string }[]> {
        const all = await db.territories.toArray();
        const grouped = new Map<string, { totalArea: number; count: number; name: string }>();

        for (const t of all) {
            const entry = grouped.get(t.ownerName) || { totalArea: 0, count: 0, name: t.ownerName };
            entry.totalArea += t.area;
            entry.count++;
            grouped.set(t.ownerName, entry);
        }

        return [...grouped.entries()]
            .map(([name, data]) => ({ ...data, color: playerColor(name) }))
            .sort((a, b) => b.totalArea - a.totalArea);
    }

    // ---- Geometry Utilities ----
    private static haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371e3;
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;
        const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private static polygonArea(points: Coordinate[]): number {
        if (points.length < 3) return 0;
        let area = 0;
        for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length;
            area += points[i][0] * points[j][1];
            area -= points[j][0] * points[i][1];
        }
        const latRad = (points[0][0] * Math.PI) / 180;
        return Math.abs(area) * 111320 * 111320 * Math.cos(latRad) / 2;
    }

    private static polygonCenter(points: Coordinate[]): [number, number] {
        const lat = points.reduce((s, p) => s + p[0], 0) / points.length;
        const lng = points.reduce((s, p) => s + p[1], 0) / points.length;
        return [lat, lng];
    }
}
