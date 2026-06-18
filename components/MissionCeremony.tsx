import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Sparkles, Trophy, Zap } from 'lucide-react';

interface MissionCeremonyProps {
  title: string;
  xpReward: number;
  onClose: () => void;
}

const MissionCeremony: React.FC<MissionCeremonyProps> = ({ title, xpReward, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: any[] = [];
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        size: Math.random() * 3 + 1,
        color: Math.random() > 0.5 ? '#D946EF' : '#8B5CF6',
        alpha: 1
      });
    }

    let animationFrame: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // gravity
        p.alpha -= 0.01;
        if (p.alpha <= 0) {
          particles.splice(i, 1);
        } else {
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      animationFrame = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl cursor-pointer"
      onClick={onClose}
    >
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
      
      <motion.div 
        initial={{ scale: 0.5, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 15 }}
        className="relative z-10 flex flex-col items-center text-center p-12 glass-effect rounded-[3rem] border-2 border-accent shadow-[0_0_50px_rgba(217,70,239,0.3)] max-w-md mx-4"
      >
        <div className="p-6 rounded-full bg-accent/20 border-2 border-accent mb-8 shadow-[0_0_20px_rgba(217,70,239,0.5)]">
          <CheckCircle2 size={64} className="text-accent drop-shadow-[0_0_10px_currentColor]" />
        </div>
        
        <h1 className="text-4xl font-black text-main-text uppercase tracking-tighter mb-2 drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]">
          Goal Complete
        </h1>
        <p className="text-sm font-black text-sub-text uppercase tracking-[0.3em] mb-8">
          Great Job!
        </p>
        
        <div className="bg-surface/50 border border-glass-border p-6 rounded-2xl w-full mb-8 shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]">
          <p className="text-[10px] font-black text-sub-text uppercase tracking-widest mb-2">You Finished</p>
          <p className="text-xl font-black text-main-text uppercase tracking-tight">{title}</p>
        </div>
        
        <div className="flex items-center gap-4 text-accent drop-shadow-[0_0_10px_currentColor]">
          <Zap size={32} />
          <span className="text-5xl font-black tabular-nums">+{xpReward} XP</span>
        </div>
        
        <motion.p 
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mt-12 text-[10px] font-black text-sub-text uppercase tracking-[0.2em]"
        >
          Click to go back
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

export default MissionCeremony;
