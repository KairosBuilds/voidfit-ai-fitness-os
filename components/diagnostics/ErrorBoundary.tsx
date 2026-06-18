import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, AlertTriangle, Zap } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[CRITICAL SYSTEM FAILURE]", error, errorInfo);
    
    // Automatic reboot after 3 seconds
    setTimeout(() => {
      window.location.href = '/'; // Force full browser reload to root
    }, 3000);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center p-8 overflow-hidden">
          {/* Cyberpunk Background Grid */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" 
               style={{ backgroundImage: 'linear-gradient(var(--glass-border) 1px, transparent 1px), linear-gradient(90deg, var(--glass-border) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center relative z-10"
          >
            <div className="relative inline-block mb-8">
              <RefreshCw className="text-accent animate-spin-slow" size={80} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap className="text-accent-red animate-pulse" size={32} />
              </div>
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="absolute -top-2 -right-2 p-2 bg-accent-red text-white rounded-lg"
              >
                <AlertTriangle size={20} />
              </motion.div>
            </div>

            <h1 className="text-4xl font-black text-main-text uppercase tracking-tighter mb-4">
              Something Went Wrong
            </h1>
            <p className="text-sm font-black text-accent-red uppercase tracking-widest mb-12 opacity-80">
              Error: {this.state.error?.name || 'Unexpected Error'}
            </p>

            <div className="space-y-6">
                <div className="flex items-center justify-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-accent animate-ping" />
                    <span className="text-[10px] font-black text-sub-text uppercase tracking-[0.5em]">Restarting App...</span>
                </div>
                
                <div className="w-64 h-1 bg-surface/30 rounded-full mx-auto overflow-hidden border border-glass-border">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 3, ease: "linear" }}
                        className="h-full bg-accent shadow-[0_0_15px_var(--neon-glow)]"
                    />
                </div>

                <p className="text-[9px] text-sub-text font-bold uppercase opacity-40 max-w-xs mx-auto leading-relaxed">
                    Saving your progress and reloading the app. Just a moment...
                </p>
            </div>
          </motion.div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
