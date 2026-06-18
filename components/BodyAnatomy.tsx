import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Zap, Info, Activity, Dumbbell, RotateCcw, Edit3, Check, Copy } from 'lucide-react';
import { User } from '../types';

const IS_DEV = import.meta.env.DEV;

interface BodyPart {
  id: string; name: string; shortName: string;
  exercises: string[]; description: string; tip: string;
  color: string; massPct: number;
  /** SVG polygon points in 300×300 coordinate space */
  points: string;
}

interface BodyAnatomyProps { user: User; }

/* ── Coordinates mapped to 300×300 viewBox from the actual image ── */
const BODY_PARTS: BodyPart[] = [
  { id:'traps',     name:'Neck & Traps',    shortName:'TRAPS',   color:'#9D00FF', massPct:6,
    points:'139,50 160,50 164,60 154,70 143,69 135,60',
    description:'Cervical stability and upper trap hypertrophy.',
    tip:'Retract scapulae during shrugs to prevent cervical strain.',
    exercises:['Neck Curls','Shoulder Shrugs','Farmer Carries','Face Pulls'] },

  { id:'chest',     name:'Chest',           shortName:'PECS',    color:'#E040FB', massPct:14,
    points:'124,66 150,66 149,94 126,92',
    description:'Pectoral major and minor — horizontal push musculature.',
    tip:'Slow eccentric maximizes pec fiber recruitment.',
    exercises:['Bench Press','Incline Press','Cable Flys','Weighted Dips'] },

  { id:'shoulders', name:'Shoulders',       shortName:'DELTS',   color:'#FF2D78', massPct:10,
    points:'108,61 124,58 139,66 134,82 116,84 104,72',
    description:'Anterior, lateral, and posterior deltoids.',
    tip:'Prioritize rear delts — most athletes are anterior-dominant.',
    exercises:['Overhead Press','Lateral Raises','Arnold Press','Rear Delt Flys'] },

  { id:'back',      name:'Back & Lats',     shortName:'LATS',    color:'#9D00FF', massPct:18,
    points:'129,97 150,118 171,97 169,128 131,128',
    description:'Latissimus dorsi, rhomboids, erector spinae.',
    tip:'Drive elbows to hips on pulldowns, not hands to chest.',
    exercises:['Deadlifts','Pullups','Bent Rows','Cable Pulldowns'] },

  { id:'arms',      name:'Arms',            shortName:'ARMS',    color:'#E040FB', massPct:9,
    points:'102,72 120,84 118,118 114,154 98,156 94,112',
    description:'Biceps, triceps, brachialis, and forearms.',
    tip:'Triceps are ~2/3 of arm mass — prioritise for size.',
    exercises:['Barbell Curls','Skull Crushers','Hammer Curls','Tricep Pushdown'] },

  { id:'core',      name:'Core',            shortName:'ABS',     color:'#FF6EB4', massPct:6,
    points:'132,95 171,95 173,130 152,134 131,129',
    description:'Rectus abdominis, transverse core.',
    tip:'Bracing 360° is more effective than sucking in.',
    exercises:['Hanging Leg Raises','Cable Crunches','Ab Wheel','Plank'] },

  { id:'obliques',  name:'Obliques',        shortName:'OBLIQS',  color:'#FF2D78', massPct:2,
    points:'124,95 133,96 132,126 122,122',
    description:'External and internal obliques for core rotation.',
    tip:'Twisting motions and side bends target these fibers.',
    exercises:['Russian Twists','Woodchoppers','Side Planks'] },

  { id:'glutes',    name:'Glutes & Hips',   shortName:'GLUTES',  color:'#9D00FF', massPct:16,
    points:'128,132 150,132 149,160 126,157',
    description:'Gluteus maximus — largest, most powerful muscle.',
    tip:'Hip thrust is the best isolated glute builder.',
    exercises:['Hip Thrusts','Romanian Deadlifts','Sumo Squats','Bridges'] },

  { id:'quads',     name:'Quads',           shortName:'QUADS',   color:'#FF2D78', massPct:14,
    points:'123,160 151,160 147,205 124,206',
    description:'Quadriceps — primary knee extension and squat power.',
    tip:'Full depth squats give 40% more quad activation.',
    exercises:['Squats','Leg Press','Lunges','Leg Extensions'] },

  { id:'calves',    name:'Calves',          shortName:'CALVES',  color:'#FF6EB4', massPct:5,
    points:'124,208 145,208 142,262 126,266',
    description:'Gastrocnemius and soleus — explosive ankle power.',
    tip:'Full range of motion (heel below platform) is critical.',
    exercises:['Standing Calf Raises','Seated Calf Raises','Jump Rope','Box Jumps'] },
];

/* Mirror polygons for right-side limbs */
const MIRRORS: { forId:string; points:string }[] = [
  { forId:'chest',     points:'176,66 150,66 151,94 174,92' },
  { forId:'shoulders', points:'192,61 176,58 161,66 166,82 184,84 196,72' },
  { forId:'arms',      points:'198,72 180,84 182,118 186,154 202,156 206,112' },
  { forId:'obliques',  points:'176,95 167,96 168,126 178,122' },
  { forId:'glutes',    points:'172,132 150,132 151,160 174,157' },
  { forId:'quads',     points:'177,160 149,160 153,205 176,206' },
  { forId:'calves',    points:'176,208 155,208 158,262 174,266' },
];

/* Parse "x1,y1 x2,y2 ..." → [[x1,y1],[x2,y2],...] */
const parsePoints = (s: string): [number,number][] =>
  s.trim().split(/\s+/).map(p => { const [x,y]=p.split(','); return [+x,+y]; });

const serializePoints = (pts: [number,number][]): string =>
  pts.map(([x,y]) => `${Math.round(x)},${Math.round(y)}`).join(' ');

const BodyAnatomy: React.FC<BodyAnatomyProps> = ({ user }) => {
  const [selected, setSelected] = useState<BodyPart | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  /* ── Edit mode state ── */
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [allPoints, setAllPoints] = useState<Record<string,[number,number][]>>(() =>
    Object.fromEntries(BODY_PARTS.map(p => [p.id, parsePoints(p.points)]))
  );
  const [mirrorPoints, setMirrorPoints] = useState<Record<string,[number,number][]>>(() =>
    Object.fromEntries(MIRRORS.map(m => [m.forId+'_r', parsePoints(m.points)]))
  );
  const [copied, setCopied] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ vertexIdx:number|null; partKey:string; startMouse:[number,number]; startPts:[number,number][] } | null>(null);

  const getSvgXY = useCallback((e: React.MouseEvent|MouseEvent): [number,number] => {
    const svg = svgRef.current!;
    const r = svg.getBoundingClientRect();
    const sx = 300 / r.width, sy = 300 / r.height;
    return [Math.round((e.clientX - r.left)*sx), Math.round((e.clientY - r.top)*sy)];
  }, []);

  const startVertexDrag = (e: React.MouseEvent, partKey: string, vIdx: number) => {
    e.stopPropagation();
    const pts = (mirrorPoints[partKey] ?? allPoints[partKey]).map(p => [...p] as [number,number]);
    dragRef.current = { vertexIdx:vIdx, partKey, startMouse:getSvgXY(e), startPts:pts };
  };

  const startPolyDrag = (e: React.MouseEvent, partKey: string) => {
    if (!editMode) return;
    e.stopPropagation();
    const pts = (mirrorPoints[partKey] ?? allPoints[partKey]).map(p => [...p] as [number,number]);
    dragRef.current = { vertexIdx:null, partKey, startMouse:getSvgXY(e), startPts:pts };
  };

  const onSvgMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const { vertexIdx, partKey, startMouse, startPts } = dragRef.current;
    const [mx, my] = getSvgXY(e);
    const dx = mx - startMouse[0], dy = my - startMouse[1];
    const newPts: [number,number][] = startPts.map(([x,y],i) =>
      vertexIdx === null ? [x+dx, y+dy] : i===vertexIdx ? [x+dx, y+dy] : [x,y]
    );
    if (partKey.endsWith('_r')) {
      setMirrorPoints(p => ({ ...p, [partKey]: newPts }));
    } else {
      setAllPoints(p => ({ ...p, [partKey]: newPts }));
    }
  };

  const onSvgMouseUp = () => { dragRef.current = null; };

  const copyCoords = () => {
    const lines = [
      ...BODY_PARTS.map(p => `${p.id}: '${serializePoints(allPoints[p.id])}'`),
      ...MIRRORS.map(m => `${m.forId}_r: '${serializePoints(mirrorPoints[m.forId+'_r'])}'`),
    ].join('\n');
    navigator.clipboard.writeText(lines);
    setCopied(true); setTimeout(()=>setCopied(false), 2000);
  };

  const currentWeight = (user.bodyMetrics as any).currentWeight ?? (user.bodyMetrics as any).weight ?? 0;
  const bmi = user.bodyMetrics.height
    ? +(currentWeight / Math.pow(user.bodyMetrics.height / 100, 2)).toFixed(1) : 0;

  const statCards = [
    { label:'Weight',  value:`${currentWeight}`, unit:'kg', color:'var(--accent)' },
    { label:'Target',  value:`${user.bodyMetrics.targetWeight ?? '--'}`, unit:'kg', color:'#10b981' },
    { label:'Body Fat',value:`${(user.bodyMetrics as any).bodyFatPercentage ?? '--'}`, unit:'%', color:'#f59e0b' },
    { label:'BMI',     value:`${bmi || '--'}`, unit:'', color:'#ef4444' },
  ];

  const polyProps = (part: BodyPart, pts: [number,number][], isRight=false) => {
    const key = isRight ? part.id+'_r' : part.id;
    const sel = !editMode && selected?.id === part.id;
    const hov = !editMode && hoveredId === part.id;
    const isEditing = editMode && editId === key;
    return {
      points: serializePoints(pts),
      onClick: () => { 
        if (editMode) { 
          setEditId(key); 
        } else { 
          setSelected(part); 
        } 
      },
      onMouseDown: (e: React.MouseEvent) => { if(editMode) startPolyDrag(e, key); },
      onMouseEnter: () => { if(!editMode) setHoveredId(part.id); },
      onMouseLeave: () => { if(!editMode) setHoveredId(null); },
      className: editMode ? 'cursor-move' : 'cursor-pointer',
      style: {
        fill: isEditing ? `${part.color}40` : sel ? `${part.color}55` : hov ? `${part.color}30` : `${part.color}10`,
        stroke: isEditing ? part.color : sel||hov ? part.color : `${part.color}60`,
        strokeWidth: isEditing ? 2.5 : sel ? 2 : hov ? 1.4 : 0.8,
        filter: isEditing ? `drop-shadow(0 0 8px ${part.color})` : sel ? `drop-shadow(0 0 6px ${part.color})` : 'none',
        transition: editMode ? 'none' : 'all 0.18s ease',
      },
    };
  };

  return (
    <div className="glass-effect rounded-[2.5rem] overflow-hidden relative shadow-[0_10px_40px_var(--shadow-soft)]">
      <div className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: 'var(--dragon-scale, var(--plush-gradient))' }} />

      <div className="p-5 sm:p-7">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl border border-glass-border"
              style={{ background: 'rgba(157,0,255,0.12)', color: 'var(--accent)' }}>
              <Activity size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-main-text uppercase tracking-tight">Bio-Kinetics Map</h2>
              <p className="text-[9px] font-black text-sub-text uppercase tracking-[0.2em]">
                {editMode ? '✏️ Zone Editor — Drag vertices or whole zones' : 'Anatomical Targeting System'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!editMode && selected && (
              <motion.button initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }}
                onClick={() => setSelected(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-glass-border text-[9px] font-black uppercase tracking-widest text-sub-text hover:text-accent hover:border-accent/50 transition-all">
                <RotateCcw size={10} /> Reset
              </motion.button>
            )}
            {/* Zone editor only shown in development mode */}
            {IS_DEV && (
              <>
                {editMode && (
                  <button onClick={copyCoords}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-glass-border text-[9px] font-black uppercase tracking-widest transition-all"
                    style={{ color: copied ? '#10b981' : 'var(--text-secondary)' }}>
                    {copied ? <Check size={10}/> : <Copy size={10}/>}
                    {copied ? 'Copied!' : 'Copy Coords'}
                  </button>
                )}
                <button
                  onClick={() => { setEditMode(e => !e); setEditId(null); setSelected(null); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all"
                  style={editMode
                    ? { background:'var(--accent)', borderColor:'var(--accent)', color:'#fff', boxShadow:'0 0 12px var(--neon-glow,var(--teddy-glow))' }
                    : { borderColor:'var(--glass-border)', color:'var(--text-secondary)' }}>
                  <Edit3 size={10}/> {editMode ? 'Done' : 'Edit Zones'}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── SVG Map ── */}
          <div className="w-full max-w-[260px] mx-auto lg:mx-0 shrink-0 space-y-3">
            <div className="relative rounded-2xl overflow-hidden border border-glass-border bg-background/60">

              {/* Zone badge */}
              <div className="absolute top-2 left-2 z-10">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-glass-border bg-surface/90 backdrop-blur-sm text-[8px] font-black text-accent uppercase tracking-widest"
                  style={{ boxShadow:'0 0 8px var(--neon-glow, var(--teddy-glow))' }}>
                  <Target size={9} />
                  {selected ? selected.shortName : 'TAP A ZONE'}
                </div>
              </div>

              {/* SVG — square 300×300 matching image aspect ratio */}
              <svg ref={svgRef} viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"
                className="w-full h-auto block"
                style={{ cursor: editMode ? 'crosshair' : 'default' }}
                onMouseMove={onSvgMouseMove}
                onMouseUp={onSvgMouseUp}
                onMouseLeave={onSvgMouseUp}>
                <defs>
                  <filter id="bf-glow">
                    <feGaussianBlur stdDeviation="2.5" result="b"/>
                    <feComposite in="SourceGraphic" in2="b" operator="over"/>
                  </filter>
                </defs>

                {/* Body image */}
                <image href="/bio_kinetics_body.jpg"
                  x="0" y="0" width="300" height="300"
                  preserveAspectRatio="xMidYMid meet"
                  opacity="0.85" className="pointer-events-none" />

                {/* Scanline overlay */}
                <pattern id="sl" x="0" y="0" width="300" height="4" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="300" y2="0" stroke="rgba(255,255,255,0.015)" strokeWidth="1"/>
                </pattern>
                <rect x="0" y="0" width="300" height="300" fill="url(#sl)" className="pointer-events-none"/>

                {/* Main zones */}
                {BODY_PARTS.map(p => <polygon key={p.id} {...polyProps(p, allPoints[p.id])} />)}

                {/* Bilateral mirrors */}
                {MIRRORS.map(m => {
                  const part = BODY_PARTS.find(p => p.id === m.forId)!;
                  return <polygon key={`r-${m.forId}`} {...polyProps(part, mirrorPoints[m.forId + '_r'], true)} />;
                })}

                {/* Selected dot indicator */}
                {selected && !editMode && (
                  <circle
                    cx={150}
                    cy={
                      selected.id==='traps' ? 64 : selected.id==='chest' ? 98 :
                      selected.id==='core' ? 152 : selected.id==='glutes' ? 202 :
                      selected.id==='quads' ? 246 : selected.id==='calves' ? 285 :
                      selected.id==='shoulders' ? 82 : selected.id==='back' ? 82 :
                      selected.id==='arms' ? 140 : 150
                    }
                    r="4" fill={selected.color} className="pointer-events-none animate-pulse"
                    style={{ filter:`drop-shadow(0 0 8px ${selected.color})` }}
                  />
                )}

                {/* Vertex Handles for Reshaping */}
                {editMode && editId && (
                  (editId.endsWith('_r') ? mirrorPoints[editId] : allPoints[editId])?.map((pt, i) => {
                    const baseColor = editId.endsWith('_r') 
                      ? BODY_PARTS.find(p => p.id === editId.replace('_r',''))?.color 
                      : BODY_PARTS.find(p => p.id === editId)?.color;
                    return (
                      <circle
                        key={`handle-${i}`}
                        cx={pt[0]} cy={pt[1]} r="5"
                        fill="#fff" stroke={baseColor || '#fff'} strokeWidth="1.5"
                        className="cursor-crosshair hover:stroke-[3px]"
                        onMouseDown={(e) => startVertexDrag(e, editId, i)}
                      />
                    );
                  })
                )}
              </svg>
            </div>

            {/* Legend chips */}
            <div className="grid grid-cols-3 gap-1.5">
              {BODY_PARTS.map(p => (
                <button key={p.id} onClick={() => setSelected(p)}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-glass-border text-[8px] font-black uppercase tracking-wider transition-all hover:scale-105"
                  style={selected?.id===p.id
                    ? { borderColor:p.color, color:p.color, background:`${p.color}14`, boxShadow:`0 0 8px ${p.color}50` }
                    : { color:'var(--text-secondary)', background:'var(--surface)' }}>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background:p.color }}/>
                  {p.shortName}
                </button>
              ))}
            </div>
          </div>

          {/* ── Info Panel ── */}
          <div className="flex-1 w-full min-w-0">
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div key={selected.id}
                  initial={{ opacity:0, x:14 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-14 }}
                  transition={{ duration:0.22 }} className="space-y-5">

                  <div>
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.25em] mb-2"
                      style={{ color:selected.color }}>
                      <Zap size={11}/> Muscle Group
                    </div>
                    <h3 className="text-3xl font-black text-main-text tracking-tighter uppercase leading-none">{selected.name}</h3>
                    <p className="text-sm text-sub-text mt-2 leading-relaxed">{selected.description}</p>
                  </div>

                  {/* Mass bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                      <span className="text-sub-text">Relative Muscle Mass</span>
                      <span style={{ color:selected.color }}>{selected.massPct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-background border border-glass-border overflow-hidden">
                      <motion.div initial={{ width:0 }} animate={{ width:`${selected.massPct*5}%` }}
                        transition={{ duration:0.6, ease:[0.22,1,0.36,1] }}
                        className="h-full rounded-full"
                        style={{ background:selected.color, boxShadow:`0 0 8px ${selected.color}80` }}/>
                    </div>
                  </div>

                  {/* Exercises */}
                  <div className="space-y-2">
                    <h4 className="text-[9px] font-black text-sub-text uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full"
                        style={{ background:selected.color, boxShadow:`0 0 5px ${selected.color}` }}/>
                      Recommended Exercises
                    </h4>
                    {selected.exercises.map((ex,i) => (
                      <motion.div key={ex} initial={{ opacity:0, x:8 }} animate={{ opacity:1, x:0 }}
                        transition={{ delay:i*0.06 }}
                        className="flex items-center justify-between p-3.5 rounded-2xl border border-glass-border bg-surface/50 hover:border-accent/40 transition-all group">
                        <div className="flex items-center gap-2.5">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background:selected.color, opacity:0.7 }}/>
                          <span className="text-sm font-black text-main-text uppercase tracking-tight">{ex}</span>
                        </div>
                        <Dumbbell size={13} className="text-sub-text group-hover:text-accent transition-colors"/>
                      </motion.div>
                    ))}
                  </div>

                  {/* Tip */}
                  <div className="p-4 rounded-2xl border flex items-start gap-3"
                    style={{ background:`${selected.color}08`, borderColor:`${selected.color}25` }}>
                    <Info size={15} className="shrink-0 mt-0.5" style={{ color:selected.color }}/>
                    <p className="text-[11px] text-sub-text leading-relaxed">
                      <span className="font-black uppercase" style={{ color:selected.color }}>Pro Tip: </span>
                      {selected.tip}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="default" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="space-y-5">
                  {/* Stat grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {statCards.map(s => (
                      <div key={s.label} className="p-4 rounded-2xl border border-glass-border bg-surface/50 space-y-1">
                        <div className="text-[9px] font-black text-sub-text uppercase tracking-widest">{s.label}</div>
                        <div className="text-xl font-black text-main-text tabular-nums">
                          {s.value}{s.unit && <span className="text-[10px] text-sub-text ml-1">{s.unit}</span>}
                        </div>
                        <div className="h-0.5 rounded-full w-8" style={{ background:s.color }}/>
                      </div>
                    ))}
                  </div>

                  {/* Muscle distribution bars */}
                  <div className="space-y-3">
                    <h4 className="text-[9px] font-black text-sub-text uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_5px_var(--neon-glow,var(--teddy-glow))]"/>
                      Muscle Group Distribution
                    </h4>
                    {BODY_PARTS.map((p,i) => (
                      <motion.div key={p.id} initial={{ opacity:0, x:8 }} animate={{ opacity:1, x:0 }}
                        transition={{ delay:i*0.04 }}
                        className="space-y-1 cursor-pointer group" onClick={() => setSelected(p)}>
                        <div className="flex justify-between text-[9px] font-black uppercase tracking-wider">
                          <span className="text-sub-text group-hover:text-main-text transition-colors">{p.shortName}</span>
                          <span style={{ color:p.color }}>{p.massPct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-background border border-glass-border overflow-hidden">
                          <motion.div initial={{ width:0 }} animate={{ width:`${p.massPct*5}%` }}
                            transition={{ delay:i*0.05, duration:0.5 }}
                            className="h-full rounded-full"
                            style={{ background:p.color, boxShadow:`0 0 5px ${p.color}60` }}/>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-xl border border-glass-border bg-surface/30 text-[9px] font-black text-sub-text uppercase tracking-widest">
                    <Target size={11} style={{ color:'var(--accent)' }}/>
                    Tap a zone on the map or a bar above to view protocols
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BodyAnatomy;
