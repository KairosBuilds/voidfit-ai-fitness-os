import React, { useState } from 'react';
import { Wand2, Loader2, Send } from 'lucide-react';
import { generateShortText, QuotaExceededError } from '../services/geminiService';
import { useAuthStore } from '../src/store/useAuthStore';

interface AiTextGeneratorProps {
  context: string;
  onGenerated: (text: string) => void;
  className?: string;
  apiKey: string;
}

const AiTextGenerator: React.FC<AiTextGeneratorProps> = ({ context, onGenerated, className, apiKey }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const fullPrompt = `Generate ${context} based on the following idea: "${prompt}"`;
      const result = await generateShortText(apiKey, fullPrompt);
      onGenerated(result);
      setIsOpen(false);
      setPrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
      if (err instanceof QuotaExceededError || (err instanceof Error && (err.message.includes('429') || err.message.includes('quota')))) {
          useAuthStore.getState().setQuotaExceeded(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-accent-primary hover:text-opacity-80 p-1 rounded-full hover:bg-border-color"
        title="Generate with AI"
      >
        <Wand2 size={18} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-64 bg-primary border border-border-color rounded-lg shadow-xl p-3 z-10">
          <p className="text-[10px] font-black text-sub-text uppercase tracking-widest mb-3">Generate: {context}</p>
          <form onSubmit={handleGenerate}>
            <div className="relative">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter keywords..."
                    className="w-full bg-surface text-main-text rounded-xl p-3 pr-10 text-xs border border-border focus:outline-none focus:border-accent transition-all shadow-inner"
                    autoFocus
                />
                <button
                    type="submit"
                    disabled={isLoading || !prompt.trim()}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-accent text-white disabled:opacity-30 hover:shadow-glow-primary transition-all active:scale-90"
                >
                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
            </div>
          </form>
          {error && <p className="text-[9px] font-black text-accent-red uppercase tracking-tighter mt-3 flex items-center gap-1">
            <span className="w-1 h-1 bg-accent-red rounded-full animate-pulse" />
            {error}
          </p>}
        </div>
      )}
    </div>
  );
};

export default AiTextGenerator;