import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface XpBarProps {
  currentXp: number;
  xpToNextLevel: number;
}

const XpBar: React.FC<XpBarProps> = ({ currentXp, xpToNextLevel }) => {
  const percentage = Math.min((currentXp / Math.max(xpToNextLevel, 1)) * 100, 100);
  const displayXp = Math.max(0, currentXp);

  return (
    <div className="w-full space-y-1.5">
      {/* Label row */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-1.5">
          <Zap
            size={11}
            className="text-accent drop-shadow-[0_0_5px_var(--neon-glow,var(--teddy-glow))]"
          />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-sub-text">
            XP
          </span>
        </div>
        <span className="text-[9px] font-black text-accent tabular-nums drop-shadow-[0_0_4px_var(--neon-glow,var(--teddy-glow))]">
          {displayXp.toLocaleString()} / {xpToNextLevel.toLocaleString()}
        </span>
      </div>

      {/* Bar track */}
      <div className="relative h-2 bg-background rounded-full overflow-hidden border border-glass-border shadow-[inset_0_0_6px_rgba(0,0,0,0.5)]">
        {/* Animated fill */}
        <motion.div
          className="absolute top-0 left-0 h-full rounded-full"
          style={{
            background: 'var(--dragon-scale, var(--plush-gradient))',
            backgroundSize: '200% 100%',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Shimmer sweep */}
          <div
            className="absolute inset-0 rounded-full overflow-hidden"
            aria-hidden="true"
          >
            <div
              className="absolute top-0 h-full w-[40%]"
              style={{
                background:
                  'linear-gradient(to right, transparent, rgba(255,255,255,0.35), transparent)',
                animation: 'shimmerSweep 2.2s ease-in-out infinite',
              }}
            />
          </div>

          {/* Glow cap */}
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
            style={{
              background: 'var(--accent)',
              boxShadow:
                '0 0 8px var(--neon-glow, var(--teddy-glow)), 0 0 16px var(--neon-glow, var(--teddy-glow))',
            }}
          />
        </motion.div>

        {/* Milestone markers at 25%, 50%, 75% */}
        {[25, 50, 75].map((mark) => (
          <div
            key={mark}
            className="absolute top-0 h-full w-px bg-background/40"
            style={{ left: `${mark}%` }}
          />
        ))}
      </div>

      {/* Percentage label */}
      <div className="flex justify-end px-0.5">
        <span className="text-[8px] font-black text-sub-text/60 tabular-nums">
          {percentage.toFixed(1)}%
        </span>
      </div>
    </div>
  );
};

export default XpBar;