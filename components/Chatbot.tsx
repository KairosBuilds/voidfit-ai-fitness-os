import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Bot, User, Send, Zap, Activity, TrendingUp, Loader2, Sparkles, Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '../src/store/useUserStore';
import { useAuthStore } from '../src/store/useAuthStore';
import { useDatabase } from '../src/db/useDatabase';
import { getAiChatResponse, predictTransformationTimeline, generateDailyMission } from '../services/geminiService';
import { toast } from '../src/store/useToastStore';
import { useVoiceCommand } from '../src/hooks/useVoiceCommand';
import { useUiStore } from '../src/store/useUiStore';
import { useQuestStore } from '../src/store/useQuestStore';
import { useStepCounter } from '../src/services/stepService';

interface ChatbotProps {
    history?: ChatMessage[];
    onSendMessage?: (message: string) => void;
    isLoading?: boolean;
    onGenerateMission?: () => void;
    onPredictRoadmap?: () => void;
}

const MarkdownText: React.FC<{ text: string }> = ({ text }) => {
    // Basic markdown-to-JSX parser
    const lines = text.split('\n');
    return (
        <div className="space-y-2">
            {lines.map((line, i) => {
                // Horizontal Rule
                if (line.trim() === '---') return <hr key={i} className="border-glass-border my-4" />;
                
                // Headers
                if (line.startsWith('### ')) return <h3 key={i} className="text-base font-black text-accent uppercase tracking-tight mt-4 mb-2 drop-shadow-[0_0_5px_var(--neon-glow)]">{line.replace('### ', '')}</h3>;
                if (line.startsWith('#### ')) return <h4 key={i} className="text-sm font-black text-main-text uppercase tracking-tight mt-3 mb-1">{line.replace('#### ', '')}</h4>;
                
                // Bullet points
                if (line.trim().startsWith('* ')) return <div key={i} className="flex gap-2 text-sm ml-2"><span className="text-accent">•</span><span>{renderBold(line.trim().substring(2))}</span></div>;
                
                // Regular lines with bold support
                return <p key={i} className="text-sm leading-relaxed">{renderBold(line)}</p>;
            })}
        </div>
    );
};

const renderBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-black text-accent drop-shadow-[0_0_2px_var(--neon-glow)]">{part.slice(2, -2)}</strong>;
        }
        return part;
    });
};

const timeAgo = (timestamp: string) => {
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isUser = message.sender === 'user';
    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
        >
            <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${isUser ? 'bg-secondary-action/20 border-secondary-action/30 text-secondary-action shadow-[0_0_10px_rgba(37,99,235,0.3)]' : 'bg-accent/20 border-accent/30 text-accent shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))]'}`}>
                {isUser ? <User size={20} /> : <Bot size={20} />}
            </div>
            <div className={`p-4 rounded-2xl max-w-[85%] sm:max-w-[90%] border transition-all duration-300 ${isUser ? 'bg-secondary-action/10 border-secondary-action/20 text-main-text rounded-tr-none shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]' : 'bg-surface/80 border-glass-border text-main-text rounded-tl-none shadow-[0_15px_40px_var(--shadow-soft)]'}`}>
                {message.imageUrl && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-3 rounded-xl overflow-hidden border border-glass-border shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                    >
                        <img src={message.imageUrl} alt="Shared photo" className="w-full h-auto max-h-64 object-cover" />
                    </motion.div>
                )}
                {isUser ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                ) : (
                    <MarkdownText text={message.text} />
                )}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-glass-border/30">
                    <span className="text-[9px] text-sub-text font-medium tracking-wide">{isUser ? 'You' : 'Coach'}</span>
                    <span className="text-[9px] text-sub-text">{timeAgo(message.timestamp)}</span>
                </div>
            </div>
        </motion.div>
    )
};

const Chatbot: React.FC<ChatbotProps> = ({ 
    history: propHistory, 
    onSendMessage: propOnSendMessage, 
    isLoading: propIsLoading, 
    onGenerateMission, 
    onPredictRoadmap 
}) => {
    const { user } = useUserStore();
    const { apiKey } = useAuthStore();
    const { chatHistory, addChatMessage, nutritionLogs, recoveryLogs, habitLogs, supplementLogs, waterLogs, checkInLogs } = useDatabase();
    const { setView } = useUiStore();
    const { setDailyMission } = useQuestStore();
    const { steps } = useStepCounter();
    
    const [input, setInput] = useState('');
    const [internalLoading, setInternalLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { isListening, transcript, startListening, stopListening, setTranscript } = useVoiceCommand();

    useEffect(() => {
        if (transcript) {
            setInput(transcript);
        }
    }, [transcript]);

    const history = propHistory || chatHistory || [];
    const isLoading = propIsLoading || internalLoading;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [history, isLoading]);

    const handleChatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const messageText = input.trim();
        if (!messageText || isLoading) return;

        setInput('');

        if (propOnSendMessage) {
            propOnSendMessage(messageText);
            return;
        }

        if (!user || !apiKey) {
            console.error("User or API Key missing for chat");
            return;
        }

        const userMsg: ChatMessage = {
            id: `chat-${Date.now()}`,
            text: messageText,
            sender: 'user',
            timestamp: new Date().toISOString()
        };

        await addChatMessage(userMsg);
        setInternalLoading(true);

        try {
            const rawResponse = await getAiChatResponse(apiKey, user, messageText, history);

            let displayText = rawResponse;
            const actionMatch = rawResponse.match(/\[CHANGE\]({.*?})/);
            let updates: Record<string, any> = {};
            let labels: string[] = [];
            const blockedFields = new Set(['currentSteps','currentDistance','lastStepSync','xp_total','xpToNextLevel','level_overall','stat_points','combatStats','unlockedBadges','completedMajorGoals','aiUsage','uid','id','missionHistory','checkInHistory','streaks']);

            const applyUpdates = () => {
                const clean: Record<string, any> = {};
                const cleanLabels: string[] = [];
                for (const [key, val] of Object.entries(updates)) {
                    if (!blockedFields.has(key) && val !== (user as any)[key]) {
                        clean[key] = val;
                        cleanLabels.push(`${key.replace(/([A-Z])/g, ' $1').toLowerCase()} → ${val}`);
                    }
                }
                if (cleanLabels.length > 0) {
                    useUserStore.getState().applyAiAdaptation(clean);
                    toast.success(`Updated: ${cleanLabels.join(', ')}`);
                }
            };

            if (actionMatch) {
                try {
                    const actions = JSON.parse(actionMatch[1]);
                    updates = actions;
                } catch (e) {
                    console.warn('Failed to parse AI action:', e);
                }
                displayText = rawResponse.replace(/\[CHANGE\]{.*?}\s*/, '').trim();
            }

            const parseNum = (s: string): number | null => {
                const cleaned = s.replace(/,/g, '').toLowerCase().trim();
                const m = cleaned.match(/^(\d+(?:\.\d+)?)k$/);
                return m ? Math.round(parseFloat(m[1]) * 1000) : null;
            };

            // Fallback: parse user's own message for change patterns
            if (Object.keys(updates).length === 0) {
                const stepMatch = messageText.match(/(?:step|walking|daily step)\s*(?:goal|target)?\s*\D*(\d[\d,]*\.?\d*k?)/i);
                const calMatch = messageText.match(/(?:calor|cal|kcal)\w*\s*(?:goal|target|intake|instake)?\s*\D*(\d[\d,]*\.?\d*k?)/i);
                const waterMatch = messageText.match(/(?:water|hydration)\s*(?:goal|target|intake)?\s*\D*(\d[\d,]*\.?\d*k?)\s*(?:ml|mls)?/i);
                if (stepMatch) { updates.dailyStepGoal = parseNum(stepMatch[1]) ?? parseInt(stepMatch[1].replace(/,/g, '')); }
                if (calMatch) { updates.dailyCalorieGoal = parseNum(calMatch[1]) ?? parseInt(calMatch[1].replace(/,/g, '')); }
                if (waterMatch) { updates.waterIntakeGoal_ml = parseNum(waterMatch[1]) ?? parseInt(waterMatch[1].replace(/,/g, '')); }
            }

            applyUpdates();

            const botMsg: ChatMessage = {
                id: `chat-${Date.now() + 1}`,
                text: displayText,
                sender: 'ai',
                timestamp: new Date().toISOString()
            };
            await addChatMessage(botMsg);
        } catch (error: any) {
            console.error("AI Chat failed", error);
            const errMsg = error?.message?.includes('429') 
              ? 'The AI is busy right now. Please wait a moment and try again.'
              : 'The AI coach is unavailable. Check your API key in Settings.';
            toast.error(errMsg);
            // Also add error message into chat thread so user sees it in context
            const errChatMsg: ChatMessage = {
                id: `chat-err-${Date.now()}`,
                text: `⚠️ ${errMsg}`,
                sender: 'ai',
                timestamp: new Date().toISOString()
            };
            await addChatMessage(errChatMsg);
        } finally {
            setInternalLoading(false);
        }
    };

    const handlePredictRoadmap = async () => {
        if (onPredictRoadmap) {
            onPredictRoadmap();
            return;
        }

        if (!user || !apiKey) return;
        setInternalLoading(true);
        try {
            const prediction = await predictTransformationTimeline(apiKey, user);
            const botMsg: ChatMessage = {
                id: `chat-${Date.now()}`,
                text: prediction,
                sender: 'ai',
                timestamp: new Date().toISOString()
            };
            await addChatMessage(botMsg);
        } catch (error) {
            console.error("Prediction failed", error);
            toast.error('Could not generate progress prediction. Please try again.');
        } finally {
            setInternalLoading(false);
        }
    };

    const handleGenerateMission = async () => {
        if (onGenerateMission) {
            onGenerateMission();
            return;
        }

        if (!apiKey) {
            toast.info("Add your API key in Settings to get a personalized plan.");
            setView('settings');
            return;
        }

        setInternalLoading(true);
        try {
            const latestCheckIn = checkInLogs?.[0];
            const mission = await generateDailyMission(
                apiKey,
                user!,
                user!.missionHistory || [],
                nutritionLogs || [],
                recoveryLogs || [],
                habitLogs || [],
                supplementLogs || [],
                waterLogs || [],
                steps || 0,
                latestCheckIn
            );
            setDailyMission(mission);
            // Detect if a local fallback plan was used (id starts with 'mission-local-')
            if (mission.id?.startsWith('mission-local-')) {
                toast.success("Here's your training plan for today — personalized AI plan will load once your connection is ready.");
            } else {
                toast.success("Your coach just built your daily plan!");
            }
            setView('dashboard');
        } catch (error) {
            console.error("AI Generation failed:", error);
            toast.error("Something went wrong. Please check your API key in Settings and try again.");
        } finally {
            setInternalLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full max-h-full max-w-4xl mx-auto w-full overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-accent/10 rounded-xl text-accent border border-accent/20 shadow-[0_0_15px_var(--neon-glow,var(--teddy-glow))]">
                        <Activity size={24} className="drop-shadow-[0_0_5px_currentColor]" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-main-text tracking-tight drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">My Coach</h2>
                        <p className="text-xs text-sub-text font-medium">Personalize anything — training, nutrition, habits, your whole plan</p>
                    </div>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
                    <span className="text-[10px] font-medium text-accent-green">Here with you</span>
                </div>
            </div>

            <div className="flex-1 min-h-0 glass-effect rounded-[2.5rem] border-2 border-glass-border flex flex-col overflow-hidden shadow-[0_20px_60px_var(--shadow-soft)] relative">
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-accent/5 to-transparent pointer-events-none" />

                {/* Action Bar */}
                <div className="flex p-2 gap-2 border-b border-glass-border bg-surface/50 relative z-10 shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]">
                    <button
                        onClick={handleGenerateMission}
                        disabled={isLoading}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent/10 hover:bg-accent/20 text-accent border border-accent/20 transition-all active:scale-[0.98] group hover:shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))] disabled:opacity-50"
                    >
                        <Zap size={16} className="group-hover:animate-pulse" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">{isLoading ? 'Thinking...' : 'Plan a workout'}</span>
                    </button>
                    <button
                        onClick={handlePredictRoadmap}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary-action/10 hover:bg-secondary-action/20 text-secondary-action border border-secondary-action/20 transition-all active:scale-[0.98] group hover:shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                    >
                        <TrendingUp size={16} className="group-hover:translate-y-[-2px] transition-transform" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">Show my roadmap</span>
                    </button>
                </div>

                <div className="flex-grow p-6 space-y-6 overflow-y-auto relative z-10 custom-scrollbar">
                    <AnimatePresence initial={false}>
                        {history.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="h-full flex flex-col items-center justify-center text-center p-8"
                            >
                                <Sparkles className="w-12 h-12 text-accent/30 mb-4 drop-shadow-[0_0_5px_currentColor]" />
                                <h3 className="text-lg font-semibold text-main-text">Tell me what you need</h3>
                                <p className="text-sm text-sub-text mt-2 max-w-xs">Custom workouts, meal plans, recovery adjustments, daily goals — just ask. Everything here adapts to you.</p>
                            </motion.div>
                        )}
                        {history.map(msg => <ChatBubble key={msg.id} message={msg} />)}
                        {isLoading && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-accent/10 border border-accent/20 text-accent shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))]">
                                    <Bot size={20} />
                                </div>
                                <div className="p-4 rounded-2xl bg-surface/60 border border-glass-border rounded-tl-none shadow-[0_10px_30px_var(--shadow-soft)]">
                                    <div className="flex items-center space-x-1.5">
                                        <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.3s] shadow-[0_0_5px_currentColor]"></div>
                                        <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.15s] shadow-[0_0_5px_currentColor]"></div>
                                        <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce shadow-[0_0_5px_currentColor]"></div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-surface/50 border-t border-glass-border relative z-10 shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]">
                    <form onSubmit={handleChatSubmit} className="relative group">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isListening ? "Listening..." : "Customize anything — workouts, meals, goals..."}
                            disabled={isLoading}
                            className={`w-full bg-background/50 backdrop-blur-md text-main-text rounded-2xl p-4 pr-24 border transition-all placeholder:text-sub-text/50 ${isListening ? 'border-accent shadow-[0_0_15px_var(--neon-glow)]' : 'border-glass-border focus:outline-none focus:border-accent focus:shadow-[0_0_10px_var(--neon-glow,var(--teddy-glow))]'}`}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <button
                                type="button"
                                onClick={isListening ? stopListening : startListening}
                                className={`p-2.5 rounded-xl transition-all active:scale-90 ${isListening ? 'bg-accent-red text-white animate-pulse' : 'text-sub-text hover:text-accent hover:bg-accent/10'}`}
                            >
                                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className="p-2.5 rounded-xl bg-accent text-white disabled:opacity-30 hover:shadow-[0_0_15px_var(--neon-glow,var(--teddy-glow))] transition-all active:scale-90"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Chatbot;