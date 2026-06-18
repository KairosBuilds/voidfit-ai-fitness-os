import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Activity, Scan, ArrowRight, Sparkles } from 'lucide-react';

interface QuickScanHUDProps {
  onOpenMealScanner: () => void;
  onOpenFormAnalyzer: () => void;
}

export const QuickScanHUD: React.FC<QuickScanHUDProps> = ({ onOpenMealScanner, onOpenFormAnalyzer }) => (
  <div className="grid grid-cols-2 gap-3">
    <ScanButton
      icon={<Camera size={17} />}
      title="Scan Meal"
      sub="AI nutrition analysis"
      accent="var(--primary-action)"
      glow="rgba(99,102,241,0.15)"
      onClick={onOpenMealScanner}
    />
    <ScanButton
      icon={<Activity size={17} />}
      title="Check Form"
      sub="AI movement analysis"
      accent="var(--accent)"
      glow="rgba(129,140,248,0.15)"
      onClick={onOpenFormAnalyzer}
    />
  </div>
);

const ScanButton: React.FC<{
  icon: React.ReactNode;
  title: string;
  sub: string;
  accent: string;
  glow: string;
  onClick: () => void;
}> = ({ icon, title, sub, accent, glow, onClick }) => {
  const [hovered, setHovered] = React.useState(false);

  return (
    <motion.button
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.97 }}
      className="card-premium p-3.5 flex items-center gap-3 transition-all relative overflow-hidden group"
      style={{ borderColor: hovered ? 'var(--glass-border-hover)' : undefined }}
    >
      {/* Ambient glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100"
        style={{ background: `radial-gradient(160px at 50% 0%, ${glow}, transparent)` }}
        animate={hovered ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.4 }}
      />

      {/* Scan line overlay */}
      <motion.div
        className="absolute left-0 right-0 h-[1px] pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
        initial={{ top: '0%', opacity: 0 }}
        animate={hovered ? { top: ['0%', '100%'], opacity: [0, 1, 1, 0] } : { opacity: 0 }}
        transition={{ duration: 1.5, repeat: hovered ? Infinity : 0, ease: 'linear' }}
      />

      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[${accent}]/20 to-[${accent}]/5 flex items-center justify-center shrink-0 relative">
        <motion.div
          animate={hovered ? { scale: [1, 1.15, 1], rotate: [0, -5, 0] } : {}}
          transition={{ duration: 0.6 }}
          className="relative z-10"
          style={{ color: accent }}
        >
          {icon}
        </motion.div>
      </div>

      <div className="text-left flex-1 relative z-10">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Scan size={10} style={{ color: accent }} />
          <span className="text-sm font-bold text-text-primary">{title}</span>
        </div>
        <div className="text-[9px] text-sub-text font-medium">{sub}</div>
      </div>

      <motion.div
        animate={hovered ? { x: 2, opacity: 1 } : { x: 0, opacity: 0.4 }}
        transition={{ duration: 0.2 }}
      >
        <ArrowRight size={14} className="text-sub-text shrink-0" />
      </motion.div>
    </motion.button>
  );
};
