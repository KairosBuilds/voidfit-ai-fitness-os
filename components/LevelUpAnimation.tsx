import React, { useRef, useEffect } from 'react';

interface LevelUpAnimationProps {
  level: number;
  rank: string;
  onClose?: () => void;
}

// =================================================================
// START: Generative Art Simulators
// =================================================================

const baseStyle = 'rgba(230, 237, 243, 0.8)'; // text-primary
const fadeStyle = 'rgba(13, 17, 23, 0.05)'; // background with low alpha for trails
const bgStyle = 'rgba(13, 17, 23, 1)'; // solid background

// --- Base Simulators ---

const lorenzAttractor = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    let x = 0.1, y = 0, z = 0;
    const a = 10, b = 28, c = 8 / 3;
    const dt = 0.01;
    const scale = Math.min(width, height) / 40;

    return () => {
        ctx.fillStyle = fadeStyle;
        ctx.fillRect(0, 0, width, height);

        ctx.save();
        ctx.translate(width / 2, height / 2);
        for (let i = 0; i < 100; i++) {
            const dx = a * (y - x) * dt;
            const dy = (x * (b - z) - y) * dt;
            const dz = (x * y - c * z) * dt;
            const prevX = x * scale;
            const prevY = y * scale;
            x += dx; y += dy; z += dz;
            ctx.beginPath();
            ctx.moveTo(prevX, prevY);
            ctx.lineTo(x * scale, y * scale);
            ctx.strokeStyle = baseStyle;
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }
        ctx.restore();
    };
};

const gameOfLife = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const cellSize = 12;
    const cols = Math.floor(width / cellSize);
    const rows = Math.floor(height / cellSize);
    let grid = new Array(cols).fill(null).map(() => new Array(rows).fill(null).map(() => Math.random() > 0.75));

    const countNeighbors = (x: number, y: number) => {
        let count = 0;
        for (let i = -1; i < 2; i++) {
            for (let j = -1; j < 2; j++) {
                if (i === 0 && j === 0) {
                    continue;
                }
                count += grid[(x + i + cols) % cols][(y + j + rows) % rows] ? 1 : 0;
            }
        }
        return count;
    };
    
    let frameCount = 0;
    return () => {
        ctx.fillStyle = bgStyle;
        ctx.fillRect(0, 0, width, height);
        if (frameCount % 5 === 0) {
            let nextGrid = grid.map(arr => [...arr]);
            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    const neighbors = countNeighbors(i, j);
                    if (grid[i][j] && (neighbors < 2 || neighbors > 3)) {
                        nextGrid[i][j] = false;
                    } else if (!grid[i][j] && neighbors === 3) {
                        nextGrid[i][j] = true;
                    }
                }
            }
            grid = nextGrid;
        }
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                if (grid[i][j]) {
                    const x = i * cellSize + cellSize / 2, y = j * cellSize + cellSize / 2, r = cellSize / 2 - 2;
                    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
                    g.addColorStop(0, 'rgba(230, 237, 243, 0.8)');
                    g.addColorStop(1, 'rgba(230, 237, 243, 0)');
                    ctx.fillStyle = g;
                    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
                }
            }
        }
        frameCount++;
    };
};

const particleConstellation = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const particles: {x: number, y: number, vx: number, vy: number, r: number}[] = Array.from({length: Math.floor(width/25)}, () => ({ x: Math.random() * width, y: Math.random() * height, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, r: Math.random() * 1.5 + 1 }));
    return () => {
        ctx.fillStyle = bgStyle;
        ctx.fillRect(0, 0, width, height);
        particles.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0 || p.x > width) {
                p.vx *= -1;
            }
            if (p.y < 0 || p.y > height) {
                p.vy *= -1;
            }
        });
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const d = Math.sqrt((particles[i].x - particles[j].x)**2 + (particles[i].y - particles[j].y)**2);
                if (d < 120) {
                    ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(230, 237, 243, ${0.8 - d / 150})`; ctx.lineWidth = 0.5; ctx.stroke();
                }
            }
            ctx.beginPath(); ctx.arc(particles[i].x, particles[i].y, particles[i].r, 0, Math.PI * 2); ctx.fillStyle = baseStyle; ctx.fill();
        }
    };
};

const generativeGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gap = 20, cols = Math.floor(width / gap), rows = Math.floor(height / gap); let time = 0;
    return () => {
        ctx.fillStyle = bgStyle;
        ctx.fillRect(0, 0, width, height);
        time += 0.02;
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                const n = (Math.sin(i * 0.2 + time) + Math.cos(j * 0.2 + time)), r = Math.max(0, (n + 1) * 1.5), o = Math.max(0, (n + 1) * 0.4);
                if (r > 0.1) { 
                    ctx.beginPath(); ctx.arc(i * gap + gap/2, j * gap + gap/2, r, 0, Math.PI*2); ctx.fillStyle = `rgba(230, 237, 243, ${o})`; ctx.fill(); 
                }
            }
        }
    };
};

// --- NEW SIMULATOR FACTORIES ---

const createSpirograph = (R: number, r: number, d: number) => (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    let t = 0; const scale = Math.min(width, height) / ((R - r) + d) / 1.5, speed = 0.01;
    return () => {
        ctx.fillStyle = fadeStyle; ctx.fillRect(0, 0, width, height); ctx.save(); ctx.translate(width / 2, height / 2);
        for (let i = 0; i < 10; i++) {
            const a = t, pX = scale*((R-r)*Math.cos(a)+d*Math.cos((R-r)*a/r)), pY = scale*((R-r)*Math.sin(a)-d*Math.sin((R-r)*a/r)); t += speed;
            const nA = t, x = scale*((R-r)*Math.cos(nA)+d*Math.cos((R-r)*nA/r)), y = scale*((R-r)*Math.sin(nA)-d*Math.sin((R-r)*nA/r));
            ctx.beginPath(); ctx.moveTo(pX, pY); ctx.lineTo(x, y); ctx.strokeStyle = baseStyle; ctx.lineWidth = 0.5; ctx.stroke();
        } ctx.restore();
    };
};

const createLissajous = (a: number, b: number, delta: number) => (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    let t = 0; const A = width / 3, B = height / 3, speed = 0.01;
    return () => {
        ctx.fillStyle = fadeStyle; ctx.fillRect(0, 0, width, height); ctx.save(); ctx.translate(width / 2, height / 2);
        for (let i = 0; i < 10; i++) {
            const pX = A * Math.sin(a * t + delta), pY = B * Math.sin(b * t); t += speed;
            const x = A * Math.sin(a * t + delta), y = B * Math.sin(b * t);
            ctx.beginPath(); ctx.moveTo(pX, pY); ctx.lineTo(x, y); ctx.strokeStyle = baseStyle; ctx.lineWidth = 0.5; ctx.stroke();
        } ctx.restore();
    };
};

const createParticleVortex = (attraction: number) => (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const particles = Array.from({length: 200}, () => ({ x: Math.random() * width, y: Math.random() * height, vx: 0, vy: 0, life: Math.random() * 100 }));
    return () => {
        ctx.fillStyle = fadeStyle; ctx.fillRect(0, 0, width, height);
        particles.forEach(p => {
            const dx = width / 2 - p.x, dy = height / 2 - p.y, dist = Math.sqrt(dx*dx + dy*dy);
            const ax = dx / dist, ay = dy / dist;
            p.vx += ax * attraction - p.vx * 0.01; p.vy += ay * attraction - p.vy * 0.01;
            p.x += p.vx; p.y += p.vy; p.life--;
            if (p.life <= 0) { 
                p.x = Math.random() * width; 
                p.y = Math.random() * height; 
                p.vx = 0; 
                p.vy = 0; 
                p.life = 100; 
            }
            ctx.beginPath(); ctx.arc(p.x, p.y, 1, 0, Math.PI * 2); ctx.fillStyle = baseStyle; ctx.fill();
        });
    };
};

const createParticleFountain = (gravity: number) => (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const particles = Array.from({length: 150}, () => ({ x: width/2, y: height, vx: (Math.random()-0.5)*8, vy: -Math.random()*15, life: 100 }));
    return () => {
        ctx.fillStyle = fadeStyle; ctx.fillRect(0, 0, width, height);
        particles.forEach(p => {
            p.vy += gravity; p.x += p.vx; p.y += p.vy;
            if (p.y > height) { 
                p.x = width/2; 
                p.y = height; 
                p.vx = (Math.random()-0.5)*8; 
                p.vy = -Math.random()*15; 
            }
            ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2); ctx.fillStyle = baseStyle; ctx.fill();
        });
    };
};

const createWaveLines = (numLines: number, speed: number, amplitude: number) => (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    let time = 0;
    return () => {
        ctx.fillStyle = bgStyle; ctx.fillRect(0, 0, width, height);
        for (let i = 0; i < numLines; i++) {
            ctx.beginPath();
            for (let x = 0; x < width; x++) {
                const y = height/2 + Math.sin(x * 0.02 + time + i*0.3) * amplitude * Math.sin(time + i);
                ctx.lineTo(x, y);
            }
            ctx.strokeStyle = `rgba(230, 237, 243, ${0.2 + (i/numLines)*0.6})`; ctx.lineWidth = 1; ctx.stroke();
        }
        time += speed;
    };
};

const createStringArt = (points: number, connections: number) => (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    let t = 0; const radius = Math.min(width, height) / 2.5;
    return () => {
        ctx.fillStyle = bgStyle; ctx.fillRect(0, 0, width, height); ctx.save(); ctx.translate(width/2, height/2);
        t += 0.5;
        for (let i = 0; i < points; i++) {
            const startAngle = (2 * Math.PI * i) / points;
            const endAngle = (2 * Math.PI * ((i * connections + t) % points)) / points;
            ctx.beginPath();
            ctx.moveTo(radius * Math.cos(startAngle), radius * Math.sin(startAngle));
            ctx.lineTo(radius * Math.cos(endAngle), radius * Math.sin(endAngle));
            ctx.strokeStyle = `rgba(230, 237, 243, 0.2)`; ctx.lineWidth = 0.5; ctx.stroke();
        } ctx.restore();
    };
};

const createRecursiveTree = (angle: number, depth: number) => (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    let frame = 0;
    const drawBranch = (x1: number, y1: number, ang: number, len: number, d: number) => {
        if (d === 0) return;
        const x2 = x1 + Math.cos(ang) * len, y2 = y1 + Math.sin(ang) * len;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        if (d < frame) {
          drawBranch(x2, y2, ang - angle, len * 0.75, d - 1);
          drawBranch(x2, y2, ang + angle, len * 0.75, d - 1);
        }
    };
    return () => {
        ctx.fillStyle = bgStyle; ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = baseStyle; ctx.lineWidth = 1;
        drawBranch(width / 2, height, -Math.PI / 2, height / 6, depth);
        if (frame < depth + 2) {
            frame += 0.1;
        }
    };
};

const createStarfield = (speed: number) => (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const stars = Array.from({length: 400}, () => ({ x: Math.random()*width, y: Math.random()*height, z: Math.random()*width }));
    return () => {
        ctx.fillStyle = bgStyle; ctx.fillRect(0, 0, width, height);
        ctx.save(); ctx.translate(width / 2, height / 2);
        stars.forEach(s => {
            s.z -= speed;
            if (s.z < 1) { 
                s.z = width; 
                s.x = Math.random()*width-width/2; 
                s.y = Math.random()*height-height/2; 
            }
            const k = 128 / s.z, px = s.x * k, py = s.y * k, r = (1 - s.z / width) * 2;
            ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI*2); ctx.fillStyle=baseStyle; ctx.fill();
        });
        ctx.restore();
    };
};

const createPulseWave = (speed: number, rings: number) => (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    let r = 0;
    return () => {
        ctx.fillStyle = bgStyle; ctx.fillRect(0, 0, width, height);
        r = (r + speed) % (width/rings);
        for(let i=0; i < rings; i++) {
            ctx.beginPath(); ctx.arc(width/2, height/2, r + i * (width/rings), 0, Math.PI*2);
            ctx.strokeStyle = `rgba(230, 237, 243, ${1 - (r + i*(width/rings))/(width*1.2)})`; ctx.lineWidth = 2; ctx.stroke();
        }
    };
};

const createRandomWalkers = (numWalkers: number) => (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const walkers = Array.from({length: numWalkers}, () => ({x: width/2, y: height/2}));
    ctx.fillStyle = bgStyle; ctx.fillRect(0,0,width,height);
    return () => {
        walkers.forEach(w => {
            ctx.beginPath(); ctx.moveTo(w.x, w.y);
            w.x += (Math.random() - 0.5) * 4; w.y += (Math.random() - 0.5) * 4;
            if (w.x < 0 || w.x > width || w.y < 0 || w.y > height) { 
                w.x = width/2; 
                w.y = height/2; 
            }
            ctx.lineTo(w.x, w.y); ctx.strokeStyle = baseStyle; ctx.lineWidth = 0.5; ctx.stroke();
        });
    };
};

const digitalRain = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const fontSize=16, cols=Math.floor(width/fontSize), drops=Array(cols).fill(1);
    return () => {
        ctx.fillStyle='rgba(13,17,23,0.1)'; ctx.fillRect(0,0,width,height);
        ctx.fillStyle=baseStyle; ctx.font=`${fontSize}px monospace`;
        for (let i = 0; i < drops.length; i++) {
            const text = String.fromCharCode(Math.random()*94 + 33);
            ctx.fillText(text, i*fontSize, drops[i]*fontSize);
            if (drops[i]*fontSize > height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    };
};

// =================================================================
// END: Generative Art Simulators
// =================================================================

const LevelUpAnimation: React.FC<LevelUpAnimationProps> = ({ level, rank, onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // FIX: Changed useRef type to be nullable and initialized with null.
    // Calling useRef<T>() with no argument implicitly initializes it with `undefined`, which is a type error if T is not assignable from `undefined`.
    const animationFrameId = useRef<number | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const simulations = [
            // Original 4
            lorenzAttractor, gameOfLife, particleConstellation, generativeGrid,
            // Spirographs (5)
            createSpirograph(80, 30, 50), createSpirograph(100, 50, 70), createSpirograph(150, 2, 80), createSpirograph(90, -40, 60), createSpirograph(70, 10, 10),
            // Lissajous (5)
            createLissajous(1, 2, Math.PI/2), createLissajous(3, 2, Math.PI/4), createLissajous(3, 4, 0), createLissajous(5, 4, Math.PI/2), createLissajous(5, 6, 0),
            // Particle Systems (6)
            createParticleVortex(0.05), createParticleVortex(0.1), createParticleVortex(-0.02),
            createParticleFountain(0.1), createParticleFountain(0.3), createParticleFountain(0.5),
            // Wave Lines (5)
            createWaveLines(10, 0.02, 50), createWaveLines(20, 0.03, 30), createWaveLines(5, 0.01, 100), createWaveLines(15, -0.02, 40), createWaveLines(30, 0.05, 20),
            // String Art (5)
            createStringArt(200, 2), createStringArt(150, 3), createStringArt(100, 4), createStringArt(200, 99), createStringArt(50, 20),
            // Recursive Trees (4)
            createRecursiveTree(Math.PI / 6, 8), createRecursiveTree(Math.PI / 4, 7), createRecursiveTree(Math.PI / 2.5, 9), createRecursiveTree(Math.PI / 9, 6),
            // Starfields (3)
            createStarfield(1), createStarfield(2.5), createStarfield(5),
            // Pulse Waves (3)
            createPulseWave(1, 5), createPulseWave(0.5, 10), createPulseWave(2, 3),
            // Random Walkers (3)
            createRandomWalkers(10), createRandomWalkers(50), createRandomWalkers(100),
            // Misc (3)
            digitalRain, digitalRain, digitalRain, // Add multiple times to increase chance
        ];

        const chosenSimulator = simulations[Math.floor(Math.random() * simulations.length)];
        const animate = chosenSimulator(ctx, canvas.width, canvas.height);

        const renderLoop = () => {
            animate();
            animationFrameId.current = requestAnimationFrame(renderLoop);
        };
        renderLoop();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, []);

  return (
    <>
      <style>{`
        @keyframes fade-in-backdrop {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-up-content {
          0% { transform: scale(0.5) translateY(50px); opacity: 0; }
          60%, 100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes text-glow {
          0%, 100% { text-shadow: 0 0 10px var(--neon-glow,var(--teddy-glow)), 0 0 20px var(--neon-glow,var(--teddy-glow)), 0 0 30px var(--neon-glow,var(--teddy-glow)); }
          50% { text-shadow: 0 0 20px var(--neon-glow,var(--teddy-glow)), 0 0 30px var(--neon-glow,var(--teddy-glow)), 0 0 40px var(--neon-glow,var(--teddy-glow)); }
        }
      `}</style>
      <div 
        className="fixed inset-0 flex items-center justify-center z-[1000] cursor-pointer bg-[var(--glass-bg)] backdrop-blur-md"
        style={{ animation: 'fade-in-backdrop 0.5s ease-out forwards' }}
        onClick={onClose}
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-50" />
        <div 
          className="relative flex flex-col items-center justify-center text-center p-8 w-full max-w-md m-4 pointer-events-none glass-effect rounded-[3rem] shadow-[0_20px_60px_var(--shadow-soft)] border-2 border-glass-border hover:border-accent hover:shadow-[0_0_25px_var(--neon-glow,var(--teddy-glow))] transition-all duration-500"
          style={{ 
            animation: 'scale-up-content 0.8s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards'
          }}
        >
          <h1 
            className="text-5xl md:text-6xl font-black text-accent uppercase tracking-wider drop-shadow-[0_0_5px_var(--neon-glow,var(--teddy-glow))]"
            style={{ animation: 'text-glow 2s infinite ease-in-out' }}
          >
            Level Up!
          </h1>
          <p 
            className="text-sub-text mt-4 text-lg font-black uppercase tracking-widest drop-shadow-[0_0_2px_rgba(0,0,0,0.5)]"
          >
            You have reached
          </p>
          <p 
            className="text-8xl font-black text-main-text my-2 drop-shadow-[0_0_10px_var(--teddy-glow,transparent)]"
          >
            {level}
          </p>
          <div className="mt-6 bg-card/50 backdrop-blur-sm p-6 rounded-[2rem] border border-glass-border shadow-[inset_0_0_15px_var(--shadow-soft)] group relative overflow-hidden">
             <div className="absolute inset-0 bg-[var(--plush-gradient,var(--dragon-scale))] opacity-10 group-hover:opacity-20 transition-opacity"></div>
            <p 
                className="text-sm font-black uppercase tracking-[0.2em] text-accent mb-2 drop-shadow-[0_0_2px_var(--neon-glow,var(--teddy-glow))]"
            >
                New Rank Unlocked
            </p>
            <p 
                className="text-2xl font-black text-main-text uppercase tracking-tight drop-shadow-[0_0_5px_var(--teddy-glow,transparent)]"
            >
                {rank}
            </p>
          </div>
          <p className="absolute bottom-[-3rem] text-[10px] font-black uppercase tracking-[0.2em] text-sub-text animate-pulse drop-shadow-[0_0_2px_rgba(0,0,0,0.5)]">
            Click anywhere to continue
          </p>
        </div>
      </div>
    </>
  );
};

export default LevelUpAnimation;
