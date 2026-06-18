import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Sparkles, Trophy, Zap, Star, ShieldAlert } from 'lucide-react';

interface RankUpCeremonyProps {
  rank: string;
  onClose: () => void;
}

const RankUpCeremony: React.FC<RankUpCeremonyProps> = ({ rank, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: any[] = [];
    for (let i = 0; i < 200; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 2 + 1,
        color: '#D946EF',
        alpha: Math.random()
      });
    }

    let animationFrame: number;
    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
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
      className="fixed inset-0 z-[250] flex items-center justify-center bg-black cursor-pointer"
      onClick={onClose}
    >
      <canvas ref={canvasRef} className="absolute inset-0 opacity-40" />
      
      <div className="absolute inset-0 bg-gradient-to-t from-accent/20 to-transparent pointer-events-none" />

      <motion.div 
        initial={{ scale: 0.8, rotate: -5, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ duration: 1, type: "spring" }}
        className="relative z-10 flex flex-col items-center text-center p-16 glass-effect rounded-[4rem] border-4 border-accent shadow-[0_0_100px_rgba(217,70,239,0.5)] max-w-2xl mx-4 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[var(--dragon-scale)] opacity-5 pointer-events-none" />
        
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="p-8 rounded-full bg-accent/20 border-4 border-accent mb-12 shadow-[0_0_40px_rgba(217,70,239,0.6)]"
        >
          <ShieldAlert size={80} className="text-accent drop-shadow-[0_0_15px_currentColor]" />
        </motion.div>
        
        <h2 className="text-xl font-black text-accent uppercase tracking-[0.5em] mb-4 drop-shadow-[0_0_10px_currentColor]">
          New Rank Reached!
        </h2>
        
        <h1 className="text-6xl md:text-8xl font-black text-main-text uppercase tracking-tighter mb-8 drop-shadow-[0_0_20px_rgba(217,70,239,0.8)]">
          {rank}
        </h1>
        
        <div className="flex gap-4 mb-12">
          {[1, 2, 3, 4, 5].map(i => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + (i * 0.1) }}
            >
              <Star size={32} className="text-accent fill-accent drop-shadow-[0_0_10px_currentColor]" />
            </motion.div>
          ))}
        </div>
        
        <div className="space-y-4 max-w-sm">
          <p className="text-sub-text font-black text-sm uppercase tracking-widest leading-relaxed">
            Congratulations! Your hard work has paid off, and you've reached a new level.
          </p>
          <p className="text-accent font-black text-xs uppercase tracking-[0.3em]">
            You can now take on harder goals.
          </p>
        </div>
        
        <motion.p 
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mt-16 text-[10px] font-black text-sub-text uppercase tracking-[0.4em]"
        >
          Continue
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

export default RankUpCeremony;
