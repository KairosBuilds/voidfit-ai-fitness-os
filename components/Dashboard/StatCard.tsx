import React from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  label: string;
  value?: string | number;
  sub?: string;
  icon: React.ReactNode;
  onClick?: () => void;
  accent?: string;
  children?: React.ReactNode;
  progress?: number;
  ring?: boolean;
}

function useAnimatedNumber(target: number): string {
  const ref = React.useRef(0);
  const [display, setDisplay] = React.useState('0');
  const animRef = React.useRef<number>();

  React.useEffect(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    ref.current = 0;
    const start = performance.now();
    const duration = 800;

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = Math.round(eased * target);
      setDisplay(current.toLocaleString());
      if (t < 1) animRef.current = requestAnimationFrame(tick);
    }

    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [target]);

  return display;
}

const CIRCUMFERENCE = 220;
const RADIUS = 35;

const ProgressRing: React.FC<{ progress: number; accent: string; size?: number }> = ({ progress, accent, size = 44 }) => {
  const pct = Math.min(100, Math.max(0, progress));
  const strokeDashoffset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;
  const [offset, setOffset] = React.useState(CIRCUMFERENCE);

  React.useEffect(() => {
    const raf = requestAnimationFrame(() => setOffset(strokeDashoffset));
    return () => cancelAnimationFrame(raf);
  }, [strokeDashoffset]);

  return (
    <svg width={size} height={size} viewBox="0 0 80 80" className="shrink-0">
      <circle cx="40" cy="40" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="5" />
      <circle
        cx="40" cy="40" r={RADIUS} fill="none" stroke={accent} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        transform="rotate(-90 40 40)"
        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
      />
      <text x="40" y="42" textAnchor="middle" fill={accent} fontSize="13" fontWeight="800" fontFamily="'Inter',sans-serif">
        {Math.round(pct)}%
      </text>
    </svg>
  );
};

export const StatCard: React.FC<StatCardProps> = ({ label, value, sub, icon, onClick, accent, children, progress, ring }) => {
  const numValue = typeof value === 'number' ? value : null;
  const animatedDisplay = useAnimatedNumber(numValue ?? 0);
  const displayValue = numValue !== null ? animatedDisplay : value;
  const c = accent || 'var(--primary-action)';

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.97 }}
      className="card-premium p-3.5 text-left w-full relative overflow-hidden group"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(120px at 50% 0%, ${c}12, transparent)` }}
      />
      <div className="flex items-center justify-between mb-2 relative z-10">
        <span className="text-[9px] font-semibold text-sub-text uppercase tracking-[0.08em]">{label}</span>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
          style={{ background: `${c}18`, color: c }}
        >
          {icon}
        </div>
      </div>
      <div className="relative z-10">
        {children || (
          <div className="flex items-end gap-2">
            <div>
              {value !== undefined && (
                <motion.span
                  key={String(numValue ?? value)}
                  className="text-xl font-extrabold text-text-primary tracking-tight block"
                >
                  {displayValue}
                </motion.span>
              )}
              {sub && <div className="text-[9px] text-sub-text mt-0.5 font-medium">{sub}</div>}
            </div>
            {ring && typeof progress === 'number' && (
              <div className="ml-auto mb-0.5">
                <ProgressRing progress={progress} accent={c} />
              </div>
            )}
          </div>
        )}
      </div>
      {!ring && typeof progress === 'number' && (
        <div className="mt-2.5 h-1 rounded-full bg-white/[0.04] overflow-hidden relative z-10">
          <motion.div
            className="h-full rounded-full"
            style={{ background: c }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
      )}
    </motion.button>
  );
};
