import React, { useRef, useState, useEffect } from 'react';
import { Upload, Sparkles, Shield, LogIn, Database } from 'lucide-react';
import { renderSignInButton } from '../auth/googleAuth';

interface LoginModalProps {
  onRestoreFromFile: (file: File) => void;
  error?: string | null;
}

const LoginModal: React.FC<LoginModalProps> = ({ onRestoreFromFile, error }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    renderSignInButton('google-signin-button');
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          onRestoreFromFile(file);
      }
  };

  const handleUploadClick = () => {
      fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      {/* Decorative background glow */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[100px]"></div>
      </div>

      <div className={`relative z-10 w-full max-w-md glass-effect border-2 border-glass-border rounded-2xl shadow-[0_20px_60px_var(--shadow-soft)] p-8 text-center transition-all duration-700 transform ${mounted ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'}`}>
        
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-accent/10 rounded-2xl border border-accent/20 shadow-[0_0_15px_var(--neon-glow,var(--teddy-glow))]">
            <Sparkles className="w-10 h-10 text-accent drop-shadow-[0_0_5px_currentColor]" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-main-text mb-2 tracking-tight drop-shadow-[0_0_2px_var(--teddy-glow,transparent)]">Welcome Back</h1>
        <p className="text-sub-text mb-8">Sign in with your Google account to continue your journey.</p>
        
        {error && (
          <div className="bg-accent-red/10 border border-accent-red/30 text-accent-red px-4 py-3 rounded-xl mb-6 flex items-start text-left">
            <Shield className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <strong className="font-semibold block text-sm">Sign-in Error</strong>
              <span className="text-sm opacity-90">{error}</span>
            </div>
          </div>
        )}

        <div className="space-y-5">
            {/* Google Identity Services Container */}
            <div className="flex justify-center bg-surface/50 py-3 rounded-xl border border-glass-border hover:bg-surface transition-colors shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]">
              <div id="google-signin-button" className="min-h-[44px]"></div>
            </div>

            <div className="relative flex py-3 items-center">
                <div className="flex-grow border-t border-glass-border"></div>
                <span className="flex-shrink mx-4 text-sub-text text-xs font-semibold uppercase tracking-wider">Or</span>
                <div className="flex-grow border-t border-glass-border"></div>
            </div>

            <button
                onClick={handleUploadClick}
                className="w-full bg-surface/50 text-main-text font-medium py-3.5 px-4 rounded-xl flex items-center justify-center space-x-3 transition-all hover:bg-surface border border-glass-border group shadow-[inset_0_0_10px_rgba(0,0,0,0.2)] hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]"
            >
                <Database className="w-5 h-5 text-sub-text group-hover:text-secondary-action transition-colors" />
                <span>Load from Local Save</span>
            </button>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".json,application/json"
                onChange={handleFileChange}
            />
        </div>
        
        <p className="text-xs text-sub-text mt-8">
            By signing in, you are granting access to sync your progress securely.
        </p>
      </div>
    </div>
  );
};

export default LoginModal;