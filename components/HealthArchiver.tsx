import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smile, Frown, Zap, Shield, Flame, Camera, 
  Trash2, Image as ImageIcon, ChevronRight, ChevronLeft,
  Plus, History, Maximize2
} from 'lucide-react';
import { User, MoodLog, BodyPhoto } from '../types';

import { useUserStore } from '../src/store/useUserStore';
import { useDatabase } from '../src/db/useDatabase';

interface HealthArchiverProps {
  user?: User;
  moodLogs?: MoodLog[];
  bodyPhotos?: BodyPhoto[];
  onAddMoodLog?: (log: MoodLog) => void;
  onAddPhoto?: (photo: BodyPhoto) => void;
  onDeletePhoto?: (id: string) => void;
}

const HealthArchiver: React.FC<HealthArchiverProps> = ({ 
  user: propUser, 
  moodLogs: propMoodLogs, 
  bodyPhotos: propBodyPhotos, 
  onAddMoodLog: propOnAddMoodLog, 
  onAddPhoto: propOnAddPhoto, 
  onDeletePhoto: propOnDeletePhoto 
}) => {
  const { user: storeUser } = useUserStore();
  const { moodLogs: dbMoodLogs, bodyPhotos: dbBodyPhotos, addMoodLog, addBodyPhoto, deleteBodyPhoto } = useDatabase();
  
  const user = propUser || storeUser;
  const moodLogs = propMoodLogs || dbMoodLogs || [];
  const bodyPhotos = propBodyPhotos || dbBodyPhotos || [];
  
  if (!user) return null;

  const onAddMoodLog = propOnAddMoodLog || addMoodLog;
  const onAddPhoto = propOnAddPhoto || addBodyPhoto;
  const onDeletePhoto = propOnDeletePhoto || deleteBodyPhoto;
  const [activeTab, setActiveTab] = useState<'mood' | 'photos'>('mood');
  const [selectedPhoto, setSelectedPhoto] = useState<BodyPhoto | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  /** Compress an image data URL to max 800px at 0.75 JPEG quality */
  const compressImage = (dataUrl: string): Promise<string> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 800;
        const ratio = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = dataUrl;
    });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        onAddPhoto({
          id: `photo-${Date.now()}`,
          date: new Date().toISOString(),
          imageUrl: compressed,
          type: 'Front',
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Mood State
  const [stress, setStress] = useState(5);
  const [burnout, setBurnout] = useState(5);
  const [discipline, setDiscipline] = useState(5);
  const [motivation, setMotivation] = useState(5);
  const [confidence, setConfidence] = useState(5);

  const moodItems = [
    { label: 'Stress Level', value: stress, setter: setStress, color: 'accent-red' },
    { label: 'Burnout Risk', value: burnout, setter: setBurnout, color: 'accent-purple' },
    { label: 'Discipline', value: discipline, setter: setDiscipline, color: 'secondary-action' },
    { label: 'Motivation', value: motivation, setter: setMotivation, color: 'accent-yellow' },
    { label: 'Confidence', value: confidence, setter: setConfidence, color: 'accent-green' },
  ];

  const handleMoodSubmit = () => {
    const log: MoodLog = {
      id: `mood-${Date.now()}`,
      date: new Date().toISOString(),
      stress,
      burnout,
      discipline,
      motivation,
      confidence
    };
    onAddMoodLog(log);
  };

  return (
    <div className="space-y-8 pb-20 max-w-4xl mx-auto relative z-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-main-text tracking-tight drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">Mind & Body</h2>
          <p className="text-sub-text text-sm font-bold uppercase tracking-widest">Track your mood and progress photos.</p>
        </div>
        <div className="flex p-1 bg-surface/50 rounded-2xl border border-glass-border shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
          <button 
            onClick={() => setActiveTab('mood')} 
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'mood' ? 'bg-accent text-white shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))]' : 'text-sub-text hover:text-main-text'}`}
          >
            Mood
          </button>
          <button 
            onClick={() => setActiveTab('photos')} 
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'photos' ? 'bg-accent text-white shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))]' : 'text-sub-text hover:text-main-text'}`}
          >
            Photos
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'mood' ? (
          <motion.div 
            key="mood" 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="glass-effect p-8 rounded-[2.5rem] shadow-[0_10px_30px_var(--shadow-soft)] transition-all hover:border-accent hover:shadow-[0_0_20px_var(--neon-glow,var(--teddy-glow))]">
               <h3 className="text-xl font-black text-main-text mb-8 uppercase tracking-tight flex items-center gap-2 drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">
                  <Shield size={20} className="text-accent drop-shadow-[0_0_5px_var(--neon-glow,var(--teddy-glow))]" />
                  How are you feeling?
               </h3>
               
               <div className="space-y-8">
                  {moodItems.map(item => (
                    <div key={item.label} className="space-y-3">
                       <div className="flex justify-between items-center px-1">
                          <label className="text-xs font-black text-sub-text uppercase tracking-widest">{item.label}</label>
                          <span className={`text-sm font-black text-${item.color} drop-shadow-[0_0_5px_currentColor]`}>LVL {item.value}</span>
                       </div>
                       <input 
                         type="range" 
                         min="1" 
                         max="10" 
                         value={item.value} 
                         onChange={(e) => item.setter(parseInt(e.target.value))}
                         className={`w-full h-2 bg-background border border-glass-border rounded-full appearance-none cursor-pointer accent-${item.color} shadow-[inset_0_0_5px_rgba(0,0,0,0.5)] focus:outline-none focus:shadow-[0_0_10px_currentColor]`}
                       />
                    </div>
                  ))}
               </div>

               <button 
                 onClick={handleMoodSubmit}
                 className="w-full mt-12 py-4 bg-[var(--plush-gradient,var(--dragon-scale))] bg-accent text-white font-black uppercase tracking-widest rounded-2xl shadow-[0_0_15px_var(--neon-glow,var(--teddy-glow))] active:scale-95 transition-all hover:shadow-[0_0_25px_var(--neon-glow,var(--teddy-glow))] hover:opacity-90 border border-glass-border"
               >
                 Save Entry
               </button>
            </div>

            {/* Mood History Chart (Placeholder/Simple) */}
            <div className="glass-effect p-6 rounded-[2rem] shadow-[0_10px_30px_var(--shadow-soft)] overflow-hidden">
               <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[10px] font-black text-sub-text uppercase tracking-widest">Mood History</h4>
                  <History size={14} className="text-sub-text" />
               </div>
               <div className="h-24 flex items-end gap-1 px-1">
                  {moodLogs.slice(-14).map((log, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                       <div 
                         className="w-full bg-accent/20 border-t-2 border-accent rounded-t-sm transition-all shadow-[0_0_5px_var(--neon-glow,var(--teddy-glow))]"
                         style={{ height: `${(log.discipline + log.motivation) * 4}%` }}
                       />
                       <div className="text-[6px] text-sub-text font-black">{new Date(log.date).getDate()}</div>
                    </div>
                  ))}
               </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="photos" 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
               <h3 className="text-xl font-black text-main-text uppercase tracking-tight drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">Visual Progress</h3>
               <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-[var(--plush-gradient,var(--dragon-scale))] bg-accent text-white rounded-2xl shadow-[0_0_15px_var(--neon-glow,var(--teddy-glow))] hover:scale-105 transition-all hover:shadow-[0_0_25px_var(--neon-glow,var(--teddy-glow))] border border-glass-border">
                  <Camera size={24} className="drop-shadow-[0_0_5px_currentColor]" />
               </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
               {bodyPhotos.map(photo => (
                 <motion.div 
                   key={photo.id}
                   layoutId={photo.id}
                   onClick={() => setSelectedPhoto(photo)}
                   className="aspect-[3/4] glass-effect border-2 border-glass-border rounded-3xl overflow-hidden relative group cursor-pointer shadow-[0_10px_20px_var(--shadow-soft)] hover:border-accent hover:shadow-[0_0_15px_var(--neon-glow,var(--teddy-glow))]"
                 >
                    <img src={photo.imageUrl} alt="Progress" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                       <div className="text-[8px] font-black text-white uppercase tracking-widest mb-1 drop-shadow-[0_0_2px_rgba(0,0,0,0.8)]">{photo.type}</div>
                       <div className="text-[10px] font-black text-accent uppercase tracking-[0.2em] drop-shadow-[0_0_5px_var(--neon-glow,var(--teddy-glow))]">{new Date(photo.date).toLocaleDateString()}</div>
                    </div>
                 </motion.div>
               ))}
               
               <button onClick={() => fileInputRef.current?.click()} className="aspect-[3/4] bg-surface/30 border-2 border-dashed border-glass-border rounded-3xl flex flex-col items-center justify-center gap-3 hover:bg-surface/50 hover:border-accent hover:shadow-[0_0_15px_var(--neon-glow,var(--teddy-glow))] transition-all group relative overflow-hidden">
                  <input type="file" accept="image/*" capture="user" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                  <div className="p-4 bg-background border border-glass-border rounded-2xl group-hover:bg-accent group-hover:text-white transition-all shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] z-10">
                    <Plus size={24} className="group-hover:drop-shadow-[0_0_5px_currentColor]" />
                  </div>
                  <span className="text-[10px] font-black text-sub-text uppercase tracking-widest group-hover:text-main-text z-10">New Photo</span>
               </button>
            </div>

            {bodyPhotos.length === 0 && (
               <div className="py-20 text-center border-2 border-dashed border-glass-border bg-surface/30 rounded-[2.5rem] shadow-[inset_0_0_15px_rgba(0,0,0,0.2)]">
                  <ImageIcon className="w-12 h-12 text-sub-text mx-auto mb-4 opacity-50 drop-shadow-[0_0_5px_rgba(0,0,0,0.5)]" />
                  <p className="text-sub-text font-black uppercase tracking-widest text-xs drop-shadow-[0_0_2px_rgba(0,0,0,0.5)]">No Photos Yet</p>
               </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Detail Modal */}
      <AnimatePresence>
        {selectedPhoto && (
           <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedPhoto(null)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
              <motion.div layoutId={selectedPhoto.id} className="relative glass-effect border-2 border-glass-border rounded-[2.5rem] shadow-[0_20px_60px_var(--shadow-soft)] w-full max-w-xl overflow-hidden">
                 <img src={selectedPhoto.imageUrl} alt="Progress Large" className="w-full aspect-[3/4] object-cover" />
                 <div className="p-8 flex items-center justify-between bg-surface/50 backdrop-blur-md border-t border-glass-border">
                    <div>
                      <h4 className="text-2xl font-black text-main-text uppercase tracking-tight drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">{selectedPhoto.type}</h4>
                      <p className="text-sub-text font-black uppercase tracking-widest text-xs mt-1">{new Date(selectedPhoto.date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => onDeletePhoto(selectedPhoto.id)} className="p-4 bg-background border border-glass-border hover:bg-accent-red hover:border-accent-red hover:text-white text-sub-text rounded-2xl transition-all shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                          <Trash2 size={24} />
                       </button>
                       <button onClick={() => setSelectedPhoto(null)} className="p-4 bg-[var(--plush-gradient,var(--dragon-scale))] bg-accent text-white rounded-2xl font-black uppercase tracking-widest shadow-[0_0_15px_var(--neon-glow,var(--teddy-glow))] transition-all active:scale-95 border border-glass-border hover:shadow-[0_0_25px_var(--neon-glow,var(--teddy-glow))]">
                          Close
                       </button>
                    </div>
                 </div>
              </motion.div>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HealthArchiver;
