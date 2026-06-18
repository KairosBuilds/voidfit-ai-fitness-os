import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map as MapIcon, Navigation, Crosshair, Shield, Flag, Trophy, Zap, AlertCircle, Footprints, Bike, Timer, Gauge, Activity } from 'lucide-react';
import { useDatabase } from '../../src/db/useDatabase';
import { useUserStore } from '../../src/store/useUserStore';
import { TerritorySystem, playerColor, TrackingState } from '../../src/services/TerritorySystem';
import { Territory, ActivityMode, ACTIVITY_SPEED_LIMITS } from '../../types';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const ACTIVITY_ICONS: Record<ActivityMode, React.ReactNode> = {
    walk:  <Footprints size={16} />,
    run:   <Activity size={16} />,
    cycle: <Bike size={16} />,
};

export const TerritoryMap: React.FC = () => {
    const { territories, trails } = useDatabase();
    const { user } = useUserStore();
    const isTracking = true;
    const [trackState, setTrackState] = useState<TrackingState | null>(null);
    const [activityMode, setActivityMode] = useState<ActivityMode>('walk');
    const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);

    // Territory capture XP toast
    const [lastCapture, setLastCapture] = useState<{ area: number; xp: number } | null>(null);
    const prevTerritoryCountRef = useRef(0);

    const mapRef = useRef<any>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const playerMarkerRef = useRef<any>(null);
    const polygonsRef = useRef<any[]>([]);
    const activePolylineRef = useRef<any>(null);
    const historyPolylinesRef = useRef<any[]>([]);

    // ── Listen for tracking state changes ──────────────────────────────────
    useEffect(() => {
        TerritorySystem.onStateChangeCallback((state) => {
            setTrackState(state);
            // Keep currentPos in sync from tracking state (avoids dual watchPosition)
            // Position updates come through the GPS watcher inside TerritorySystem
        });
        return () => TerritorySystem.onStateChangeCallback(() => {});
    }, []);

    // ── Single GPS watcher for map centering (NOT for territory tracking) ──
    // TerritorySystem has its own watchPosition for territory logic.
    // We use a separate low-accuracy watcher ONLY to centre the map.
    useEffect(() => {
        if (!navigator.geolocation) return;

        // Get initial position once
        navigator.geolocation.getCurrentPosition(
            (pos) => setCurrentPos([pos.coords.latitude, pos.coords.longitude]),
            (err) => console.warn('[TerritoryMap] Initial position error:', err.message),
            { enableHighAccuracy: false, timeout: 10000 },
        );

        // Low-frequency watcher just for map panning — won't conflict with TerritorySystem
        const watchId = navigator.geolocation.watchPosition(
            (pos) => setCurrentPos([pos.coords.latitude, pos.coords.longitude]),
            (err) => console.warn('[TerritoryMap] Watch error:', err.message),
            { enableHighAccuracy: false, maximumAge: 5000 },
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    // ── Start/stop territory tracking (always active) ─────────────────────
    useEffect(() => {
        if (user) {
            TerritorySystem.startTracking(user, activityMode);
            TerritorySystem.setActivityMode(activityMode);
        }
    }, [user, activityMode]);

    // ── Detect new territory captures → fire toast ─────────────────────────
    useEffect(() => {
        if (!territories) return;
        const currentCount = territories.length;
        const prevCount = prevTerritoryCountRef.current;

        if (currentCount > prevCount && prevCount > 0) {
            // A new territory was just added
            const newest = territories[territories.length - 1];
            if (newest && newest.ownerId === user?.id) {
                const xpReward = Math.min(500, Math.max(10, Math.round(newest.area / 10)));
                setLastCapture({ area: newest.area, xp: xpReward });
                setTimeout(() => setLastCapture(null), 4000);
            }
        }

        prevTerritoryCountRef.current = currentCount;
    }, [territories, user?.id]);

    // ── Initialize Leaflet map ─────────────────────────────────────────────
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current || typeof L === 'undefined') return;

        mapRef.current = L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: false,
        }).setView([0, 0], 18);

        const primaryLayer = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            { maxZoom: 19 },
        );
        const fallbackLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors',
        });

        primaryLayer.addTo(mapRef.current);
        primaryLayer.on('tileerror', () => {
            if (mapRef.current && mapRef.current.hasLayer(primaryLayer)) {
                mapRef.current.removeLayer(primaryLayer);
                fallbackLayer.addTo(mapRef.current);
            }
        });

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // ── Update player marker & pan map ────────────────────────────────────
    useEffect(() => {
        if (!mapRef.current || !currentPos || typeof L === 'undefined') return;
        const [lat, lng] = currentPos;
        mapRef.current.panTo([lat, lng], { animate: true });

        const isCheater = trackState?.isCheater;
        const pulseColor = isCheater ? '#ef4444' : 'var(--accent)';

        if (playerMarkerRef.current) {
            playerMarkerRef.current.setLatLng([lat, lng]);
        } else {
            const playerIcon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="width:16px;height:16px;border-radius:50%;border:2px solid white;background:${pulseColor};box-shadow:0 0 15px ${pulseColor};animation:pulse 1s infinite"></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8],
            });
            playerMarkerRef.current = L.marker([lat, lng], { icon: playerIcon }).addTo(mapRef.current);
        }
    }, [currentPos, trackState?.isCheater]);

    // ── Draw territory polygons ────────────────────────────────────────────
    useEffect(() => {
        if (!mapRef.current || typeof L === 'undefined') return;

        polygonsRef.current.forEach((p: any) => p.remove());
        polygonsRef.current = [];

        territories.forEach((t: Territory) => {
            if (t.polygon.length < 3) return;
            const color = t.color || (t.ownerId === user?.id ? '#22c55e' : '#ef4444');
            const poly = L.polygon(t.polygon, {
                color,
                fillColor: color,
                fillOpacity: 0.25,
                weight: 2,
                dashArray: t.ownerId === user?.id ? '' : '5, 5',
            }).addTo(mapRef.current);
            polygonsRef.current.push(poly);
        });
    }, [territories, user]);

    // ── Draw active trail polyline (live walk path) ────────────────────────
    useEffect(() => {
        if (!mapRef.current || typeof L === 'undefined') return;

        // Find the currently active trail for this user
        const activeTrail = trails?.find(
            (t) => t.status === 'active' && t.userId === user?.id,
        );

        if (activeTrail && activeTrail.points.length > 1) {
            const accentColor = getComputedStyle(document.documentElement)
                .getPropertyValue('--accent').trim() || '#8b5cf6';

            if (activePolylineRef.current) {
                // Update existing polyline
                activePolylineRef.current.setLatLngs(activeTrail.points);
            } else {
                // Create new polyline
                activePolylineRef.current = L.polyline(activeTrail.points, {
                    color: accentColor || '#8b5cf6',
                    weight: 4,
                    opacity: 0.85,
                    dashArray: undefined,
                }).addTo(mapRef.current);
            }
        } else {
            // No active trail — remove the line
            if (activePolylineRef.current) {
                activePolylineRef.current.remove();
                activePolylineRef.current = null;
            }
        }
    }, [trails, user?.id, trackState?.totalDistance]); // re-run on each GPS update

    // ── Draw historical completed trail polylines ──────────────────────────
    useEffect(() => {
        if (!mapRef.current || typeof L === 'undefined') return;

        historyPolylinesRef.current.forEach((p: any) => p.remove());
        historyPolylinesRef.current = [];

        const completedTrails = trails?.filter(
            (t) => t.status === 'completed' && t.userId === user?.id && (t.points?.length ?? 0) > 1,
        ) ?? [];

        completedTrails.forEach((trail) => {
            const line = L.polyline(trail.points, {
                color: '#6366f1',
                weight: 2,
                opacity: 0.45,
                dashArray: '6, 4',
            }).addTo(mapRef.current);
            historyPolylinesRef.current.push(line);
        });
    }, [trails, user?.id]);

    const speedLimit = ACTIVITY_SPEED_LIMITS[activityMode].maxMps;
    const isCheater = trackState?.isCheater ?? false;
    const myTerritories = territories.filter((t: Territory) => t.ownerId === user?.id);
    const myTotalArea = myTerritories.reduce((acc: number, t: Territory) => acc + t.area, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-main-text uppercase tracking-tighter flex items-center gap-2">
                        <MapIcon className="text-accent" />
                        TERRITORY ARENA
                    </h1>
                    <p className="text-[10px] text-sub-text font-black uppercase tracking-widest">Walk · Run · Cycle — Claim Your Grid</p>
                </div>
                <div className="flex gap-2">
                    <div className={`px-3 py-1 rounded-full border flex items-center gap-2 ${isCheater ? 'bg-accent-red/20 border-accent-red/40 text-accent-red' : 'bg-surface/50 border-glass-border text-main-text'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isCheater ? 'bg-accent-red animate-pulse' : isTracking ? 'bg-green-500 animate-pulse' : 'bg-accent'}`} />
                        <span className="text-[10px] font-bold uppercase">
                            {isCheater ? 'CHEAT DETECTED' : isTracking ? 'TRACKING' : 'GPS LINK'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Map Container */}
            <div className="relative aspect-square w-full max-w-2xl mx-auto rounded-[3rem] overflow-hidden border-2 border-glass-border bg-background shadow-[0_20px_50px_rgba(0,0,0,0.5)] group">
                <div ref={mapContainerRef} className="w-full h-full z-0" />

                {/* HUD Overlay */}
                <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between z-10">
                    {/* Top HUD */}
                    <div className="flex justify-between items-start">
                        <div className="glass-effect p-4 rounded-2xl border border-glass-border space-y-2 backdrop-blur-md bg-background/40">
                            <div className="flex items-center gap-2 text-accent">
                                <Navigation size={14} />
                                <span className="text-[10px] font-black tracking-widest uppercase">Position</span>
                            </div>
                            <div className="font-mono text-[10px] text-main-text">
                                LAT: {currentPos?.[0].toFixed(6) || '---'}<br />
                                LNG: {currentPos?.[1].toFixed(6) || '---'}
                            </div>
                            {trackState?.active && (
                                <div className="pt-1 border-t border-glass-border space-y-1">
                                    <div className="flex items-center gap-1 text-accent-yellow">
                                        <Gauge size={12} />
                                        <span className="text-[9px] font-mono">{trackState.currentSpeed.toFixed(1)} m/s</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-accent-cyan">
                                        <Timer size={12} />
                                        <span className="text-[9px] font-mono">{trackState.elapsedSeconds.toFixed(0)}s</span>
                                    </div>
                                    {isCheater && (
                                        <div className="text-accent-red text-[9px] font-black uppercase tracking-wider">
                                            ⚠ {trackState.violationCount} speed violations
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="glass-effect p-4 rounded-2xl border border-glass-border space-y-2 text-right backdrop-blur-md bg-background/40">
                            <div className="flex items-center gap-2 text-accent-green justify-end">
                                <Shield size={14} />
                                <span className="text-[10px] font-black tracking-widest uppercase">My Sector</span>
                            </div>
                            <div className="text-xl font-black text-main-text tracking-tighter">{myTerritories.length}</div>
                            <div className="text-[8px] text-sub-text uppercase">{myTotalArea.toFixed(0)} sqm</div>
                        </div>
                    </div>

                    {/* Bottom Controls */}
                    <div className="flex justify-between items-end">
                        {/* Recent Territories */}
                        <div className="space-y-3">
                            {myTerritories.slice(0, 3).map((t: Territory) => (
                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    key={t.id}
                                    className="flex items-center gap-3 glass-effect px-4 py-2 rounded-xl border border-glass-border backdrop-blur-md bg-background/40"
                                >
                                    <Flag size={14} style={{ color: t.color || '#22c55e' }} />
                                    <div>
                                        <div className="text-[9px] font-black text-main-text uppercase tracking-tight">{t.ownerName}'s Sector</div>
                                        <div className="text-[8px] text-sub-text uppercase">{t.area.toFixed(0)} SQM · {t.activityMode || 'walk'}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Activity Mode + Track Button */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex gap-2 pointer-events-auto">
                                {(Object.keys(ACTIVITY_SPEED_LIMITS) as ActivityMode[]).map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setActivityMode(mode)}
                                        className={`p-3 rounded-xl border-2 transition-all ${
                                            activityMode === mode
                                                ? 'bg-accent border-white text-white shadow-[0_0_15px_var(--neon-glow)]'
                                                : 'bg-background/60 border-glass-border text-sub-text hover:border-accent/50'
                                        }`}
                                    >
                                        {ACTIVITY_ICONS[mode]}
                                    </button>
                                ))}
                            </div>

                            <div className="text-[8px] text-sub-text font-black uppercase tracking-widest pointer-events-auto">
                                Max {ACTIVITY_SPEED_LIMITS[activityMode].label}: {speedLimit} m/s
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scanline Overlay */}
                <div className="absolute inset-0 pointer-events-none z-20 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] border-[20px] border-transparent rounded-[3rem]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20 z-20" />
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-effect p-6 rounded-3xl border border-glass-border flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-accent/20 text-accent">
                        <Trophy size={20} />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-main-text tracking-tighter">{myTerritories.length}</div>
                        <div className="text-[10px] text-sub-text font-black uppercase tracking-widest">Sectors Controlled</div>
                    </div>
                </div>
                <div className="glass-effect p-6 rounded-3xl border border-glass-border flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-accent-green/20 text-accent-green">
                        <Flag size={20} />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-main-text tracking-tighter">{myTotalArea.toFixed(0)}</div>
                        <div className="text-[10px] text-sub-text font-black uppercase tracking-widest">Total Area (SQM)</div>
                    </div>
                </div>
                <div className="glass-effect p-6 rounded-3xl border border-glass-border flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-accent-cyan/20 text-accent-cyan">
                        <Zap size={20} />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-main-text tracking-tighter">{trackState?.totalDistance.toFixed(0) || '0'}m</div>
                        <div className="text-[10px] text-sub-text font-black uppercase tracking-widest">This Session</div>
                    </div>
                </div>
            </div>

            {/* Anti-Cheat Warning */}
            {isCheater && (
                <div className="p-4 rounded-2xl bg-accent-red/10 border border-accent-red/20 flex items-start gap-4">
                    <AlertCircle size={20} className="text-accent-red mt-1 flex-shrink-0" />
                    <div>
                        <p className="text-xs font-black text-main-text uppercase tracking-tight">ANTI-CHEAT VIOLATION</p>
                        <p className="text-[10px] text-sub-text uppercase leading-relaxed mt-1">
                            Speed limit exceeded for {activityMode} mode ({speedLimit} m/s). Territory capture disabled.
                            {trackState && trackState.violationCount >= 5
                                ? ' Tracking automatically stopped.'
                                : ` ${5 - (trackState?.violationCount || 0)} more violations will stop tracking.`}
                        </p>
                    </div>
                </div>
            )}

            {/* Territory Capture Toast */}
            <AnimatePresence>
                {lastCapture && (
                    <motion.div
                        initial={{ y: 50, opacity: 0, scale: 0.9 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: -50, opacity: 0, scale: 0.9 }}
                        className="fixed bottom-32 left-1/2 -translate-x-1/2 glass-effect px-6 py-4 rounded-2xl border border-accent/50 z-50 text-center"
                    >
                        <div className="text-accent font-black text-lg">🏴 TERRITORY CAPTURED</div>
                        <div className="text-main-text text-sm">{lastCapture.area} sqm claimed</div>
                        <div className="text-accent-yellow text-xs">+{lastCapture.xp} XP</div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Info Notice */}

        </div>
    );
};

export default TerritoryMap;
