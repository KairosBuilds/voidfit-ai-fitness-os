import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Camera, Loader2, Sparkles, AlertCircle, Utensils, Dumbbell } from 'lucide-react';
import { analyzeMeal, analyzeForm } from '../services/geminiService';
import { reportEventToAi } from '../src/services/aiReactionService';
import { useUserStore } from '../src/store/useUserStore';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

interface VisionTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'meal' | 'form';
  apiKey: string;
  onAnalysisComplete: (result: string, data?: any) => void;
}

const VisionTracker: React.FC<VisionTrackerProps> = ({ isOpen, onClose, type, apiKey, onAnalysisComplete }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exerciseType, setExerciseType] = useState('Squat');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useUserStore();

  const handleCapture = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const photo = await CapCamera.getPhoto({
          quality: 70,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Prompt
        });
        const compressed = await compressImage(photo.dataUrl || '');
        setImage(compressed || null);
        setError(null);
      } catch (err) {
        console.warn('User cancelled or camera failed', err);
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  const compressImage = (dataUrl: string, maxWidth = 1024, maxSizeBytes = 3 * 1024 * 1024): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > maxWidth) { h = h * maxWidth / w; w = maxWidth; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        let quality = 0.85;
        let result = canvas.toDataURL('image/jpeg', quality);
        while (result.length > maxSizeBytes && quality > 0.2) {
          quality -= 0.15;
          result = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(result);
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setImage(compressed);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcess = async () => {
    if (!image) {
      setError('Please take a photo or upload an image first.');
      return;
    }
    if (!apiKey) {
      setError('Add your API key in Settings to use meal scanning.');
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      // Detect MIME type from data URL prefix (supports PNG, WebP, etc.)
      const mimeMatch = image.match(/^data:(image\/[a-zA-Z+]+);base64,/);
      const mimeType = (mimeMatch?.[1] || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
      const base64Data = image.split(',')[1];

      const result = type === 'meal' 
        ? await analyzeMeal(apiKey, base64Data, mimeType) 
        : await analyzeForm(apiKey, base64Data, exerciseType);
      
      // Check if meal scan returned an error JSON and surface it in the UI
      if (type === 'meal') {
        try {
          const parsed = JSON.parse(result);
          if (parsed.error && parsed.message) {
            setError(parsed.message);
            setIsProcessing(false);
            // Still report to chat so the message appears there too
            if (user) reportEventToAi(apiKey, user, 'MEAL_LOG', { name: 'Meal Scan', analysisResult: result }, image).catch(err => console.error('[Vision] Meal report failed:', err));
            return;
          }
        } catch {
          // Not JSON, treat as success text
        }
      }

      // Auto-report to Chat
      if (type === 'meal' && user) {
        reportEventToAi(apiKey, user, 'MEAL_LOG', { name: 'Meal Scan', analysisResult: result }, image).catch(err => console.error('[Vision] Meal report failed:', err));
      } else if (type === 'form' && user) {
        reportEventToAi(apiKey, user, 'FORM_SCAN', { exercise: exerciseType, analysisResult: result }, image).catch(err => console.error('[Vision] Form report failed:', err));
      }

      onAnalysisComplete(result);
      setImage(null);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-effect border-2 border-glass-border rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-[0_10px_30px_var(--shadow-soft)]"
      >
        <div className="p-6 border-b border-glass-border flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-background/50 text-accent shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
              {type === 'meal' ? <Utensils size={20} className="drop-shadow-[0_0_5px_currentColor]" /> : <Dumbbell size={20} className="drop-shadow-[0_0_5px_currentColor]" />}
            </div>
            <div>
              <h2 className="text-xl font-black text-main-text tracking-tight uppercase drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">
                {type === 'meal' ? 'Scan Your Meal' : 'Check Your Form'}
              </h2>
              <p className="text-[10px] text-sub-text font-black uppercase tracking-widest mt-0.5">AI Analysis Powered by Gemini</p>
            </div>
          </div>
          <button onClick={onClose} className="text-sub-text hover:text-main-text transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {!image ? (
            <div 
              onClick={handleCapture}
              className="aspect-video rounded-[2rem] border-2 border-dashed border-glass-border bg-surface/30 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-accent hover:bg-surface/50 transition-all group shadow-[inset_0_0_15px_rgba(0,0,0,0.2)]"
            >
              <div className="p-4 rounded-full bg-background/50 group-hover:scale-110 transition-transform border border-glass-border shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
                <Camera size={32} className="text-sub-text group-hover:text-accent transition-colors drop-shadow-[0_0_2px_currentColor]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-black text-main-text uppercase tracking-widest drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">Take Photo or Upload</p>
                <p className="text-[10px] text-sub-text font-bold uppercase mt-1">Waiting for image</p>
              </div>
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
            </div>
          ) : (
            <div className="relative aspect-video rounded-[2rem] overflow-hidden border-2 border-glass-border bg-background shadow-[inset_0_0_15px_rgba(0,0,0,0.2)]">
              <img src={image} className="w-full h-full object-cover" alt="Scan Input" />
              <button 
                onClick={() => setImage(null)}
                className="absolute top-4 right-4 p-2 bg-background/80 backdrop-blur-md rounded-xl text-main-text hover:bg-accent-red hover:text-white transition-colors border border-glass-border"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {error && (
            <div className="p-4 bg-accent-red/10 border border-accent-red/20 rounded-2xl flex items-center gap-3 text-accent-red">
              <AlertCircle size={18} />
              <p className="text-xs font-black uppercase tracking-tight">{error}</p>
            </div>
          )}

          {type === 'form' && image && (
            <div className="space-y-1">
               <label className="text-[10px] font-black text-sub-text uppercase tracking-widest ml-1">Exercise Type</label>
               <select 
                 value={exerciseType} 
                 onChange={(e) => setExerciseType(e.target.value)} 
                 className="w-full bg-background border border-glass-border rounded-xl px-4 py-3 text-main-text focus:outline-none focus:border-accent shadow-[inset_0_0_5px_rgba(0,0,0,0.5)] focus:shadow-[0_0_10px_rgba(217,70,239,0.3)]"
               >
                 <option value="Squat">Squat</option>
                 <option value="Deadlift">Deadlift</option>
                 <option value="Bench Press">Bench Press</option>
                 <option value="Overhead Press">Overhead Press</option>
                 <option value="Pull-up">Pull-up</option>
                 <option value="Push-up">Push-up</option>
                 <option value="Other">Other</option>
               </select>
            </div>
          )}

          <div className="flex gap-4">
            <button 
              onClick={onClose}
              className="flex-1 py-4 bg-surface/30 hover:bg-surface/50 border border-glass-border text-sub-text hover:text-main-text font-black rounded-2xl uppercase tracking-widest transition-all shadow-[inset_0_0_5px_rgba(0,0,0,0.2)]"
            >
              Cancel
            </button>
            <button 
              onClick={handleProcess}
              disabled={!image || isProcessing}
              className={`flex-1 py-4 font-black rounded-2xl uppercase tracking-widest flex items-center justify-center gap-2 transition-all bg-[var(--plush-gradient,var(--dragon-scale))] bg-accent text-white shadow-[0_0_15px_currentColor] border border-glass-border disabled:opacity-50 disabled:grayscale`}
            >
              {isProcessing ? (
                <><Loader2 size={18} className="animate-spin" /><span>Analyzing...</span></>
              ) : (
                <><Sparkles size={18} /><span>Analyze Now</span></>
              )}
            </button>
          </div>
        </div>


      </motion.div>
    </div>
  );
};

export default VisionTracker;
