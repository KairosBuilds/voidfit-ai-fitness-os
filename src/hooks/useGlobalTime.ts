import { useState, useEffect } from 'react';

let globalTimer: NodeJS.Timeout | null = null;
const listeners = new Set<(time: number) => void>();

export const useGlobalTime = () => {
    const [time, setTime] = useState(Date.now());

    useEffect(() => {
        listeners.add(setTime);
        if (!globalTimer) {
            globalTimer = setInterval(() => {
                const now = Date.now();
                listeners.forEach(fn => fn(now));
            }, 1000);
        }

        return () => {
            listeners.delete(setTime);
            if (listeners.size === 0 && globalTimer) {
                clearInterval(globalTimer);
                globalTimer = null;
            }
        };
    }, []);

    return time;
};
