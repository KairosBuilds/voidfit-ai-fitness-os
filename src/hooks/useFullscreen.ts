import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

export const useFullscreen = () => {
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = useCallback(async () => {
        try {
            if (Capacitor.isNativePlatform()) {
                // On native, we can't easily use document.requestFullscreen
                // but we can just toggle a local state for the UI to react
                setIsFullscreen(!isFullscreen);
                return;
            }

            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            } else {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                }
            }
        } catch (error) {
            console.error('Fullscreen Error:', error);
        }
    }, [isFullscreen]);

    return { isFullscreen, toggleFullscreen };
};
