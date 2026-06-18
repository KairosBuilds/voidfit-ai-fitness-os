import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, Cpu, Command, AlertCircle, Sparkles } from 'lucide-react';
import { useVoiceCommand } from '../src/hooks/useVoiceCommand';
import { useUiStore } from '../src/store/useUiStore';
import { useUserStore } from '../src/store/useUserStore';

interface VoiceCommandHUDProps {
    isOpen: boolean;
    onClose: () => void;
}

export const VoiceCommandHUD: React.FC<VoiceCommandHUDProps> = ({ isOpen, onClose }) => {
    const { isListening, transcript, error, startListening, stopListening, setTranscript } = useVoiceCommand();
    const { setView, setVisionOpen } = useUiStore();
    const { user } = useUserStore();
    const [status, setStatus] = useState<'listening' | 'processing' | 'success' | 'error'>('listening');
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
        if (isOpen) {
            startListening();
            setStatus('listening');
            setFeedback('Listening for command...');
        } else {
            stopListening();
        }
    }, [isOpen, startListening, stopListening]);

    useEffect(() => {
        if (!isListening && transcript && isOpen) {
            processCommand(transcript.toLowerCase());
        }
    }, [isListening, transcript, isOpen]);

    const processCommand = (cmd: string) => {
        setStatus('processing');
        setFeedback(`Analyzing: "${cmd}"`);

        // Tactical delay for "processing" feel
        setTimeout(() => {
            if (cmd.includes('dashboard') || cmd.includes('home')) {
                setView('dashboard');
                handleSuccess('Navigating to Command Center');
            } else if (cmd.includes('map') || cmd.includes('territory') || cmd.includes('world')) {
                setView('map');
                handleSuccess('Engaging Orbital Surveillance');
            } else if (cmd.includes('scan') || cmd.includes('meal') || cmd.includes('food')) {
                setVisionOpen(true, 'meal');
                handleSuccess('Initializing Nutrition Scanner');
            } else if (cmd.includes('form') || cmd.includes('check') || cmd.includes('posture')) {
                setVisionOpen(true, 'form');
                handleSuccess('Initializing Biokinetic Analyzer');
            } else if (cmd.includes('guild') || cmd.includes('faction') || cmd.includes('arena')) {
                setView('guild');
                handleSuccess('Accessing Syndicate Hub');
            } else if (cmd.includes('stats') || cmd.includes('progress') || cmd.includes('evolution')) {
                setView('evolution');
                handleSuccess('Synchronizing Evolutionary Data');
            } else if (cmd.includes('chat') || cmd.includes('coach') || cmd.includes('talk')) {
                setView('chatbot');
                handleSuccess('Establishing Link with AI Coach');
            } else if (cmd.includes('steps') || cmd.includes('walk')) {
                handleSuccess(`Current steps: ${user?.currentSteps || 0}`);
            } else {
                setStatus('error');
                setFeedback("Command not recognized by system protocol.");
            }
        }, 800);
    };

    const handleSuccess = (msg: string) => {
        setStatus('success');
        setFeedback(msg);
        setTimeout(() => {
            onClose();
            setTranscript('');
        }, 1500);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-background/80 backdrop-blur-xl"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-sm glass-effect rounded-[3rem] border border-glass-border p-8 shadow-[0_30px_100px_rgba(0,0,0,0.5)] overflow-hidden"
                >
                    {/* Ambient Glow */}
                    <div className={`absolute -top-24 -left-24 w-48 h-48 rounded-full opacity-20 blur-[80px] transition-colors duration-500 ${status === 'listening' ? 'bg-accent' : status === 'error' ? 'bg-accent-red' : 'bg-accent-green'}`} />

                    <div className="flex flex-col items-center text-center space-y-6">
                        {/* Visualizer Circle */}
                        <div className="relative">
                            <motion.div 
                                animate={status === 'listening' ? { 
                                    scale: [1, 1.2, 1],
                                    opacity: [0.3, 0.6, 0.3]
                                } : { scale: 1, opacity: 0.3 }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className={`absolute inset-0 rounded-full blur-2xl ${status === 'listening' ? 'bg-accent' : status === 'error' ? 'bg-accent-red' : 'bg-accent-green'}`}
                            />
                            <div className={`relative w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${status === 'listening' ? 'bg-accent/20 border-accent shadow-[0_0_30px_var(--neon-glow)]' : status === 'error' ? 'bg-accent-red/20 border-accent-red' : 'bg-accent-green/20 border-accent-green shadow-[0_0_30px_rgba(34,197,94,0.3)]'}`}>
                                {status === 'listening' ? <Mic size={32} className="text-white animate-pulse" /> : 
                                 status === 'processing' ? <Cpu size={32} className="text-white animate-spin-slow" /> :
                                 status === 'error' ? <AlertCircle size={32} className="text-white" /> :
                                 <Sparkles size={32} className="text-white" />}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h2 className="text-sm font-black text-main-text tracking-[0.5em] uppercase">Neural Listen</h2>
                            <p className={`text-[10px] font-black tracking-widest uppercase transition-colors duration-500 ${status === 'listening' ? 'text-accent' : status === 'error' ? 'text-accent-red' : 'text-accent-green'}`}>
                                {status}
                            </p>
                        </div>

                        <div className="w-full min-h-[60px] flex items-center justify-center px-4">
                            <p className="text-sm font-medium text-main-text italic opacity-90 leading-relaxed">
                                {transcript ? `"${transcript}"` : feedback}
                            </p>
                        </div>

                        {/* Tactical Tips */}
                        <div className="w-full pt-6 border-t border-glass-border">
                            <div className="flex items-center justify-center gap-2 text-sub-text mb-3">
                                <Command size={12} />
                                <span className="text-[8px] font-black uppercase tracking-[0.2em]">Supported Directives</span>
                            </div>
                            <div className="flex flex-wrap justify-center gap-2">
                                {['"Dashboard"', '"Scan Meal"', '"Check Form"', '"Arena"'].map(tip => (
                                    <span key={tip} className="text-[7px] font-black text-sub-text/60 uppercase tracking-widest px-2 py-1 rounded-md bg-surface/30 border border-white/5">
                                        {tip}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 text-sub-text hover:text-main-text transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
