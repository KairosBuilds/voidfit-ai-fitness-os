import React from 'react';
import { ThemeProvider } from '../theme/ThemeProvider';
import { AppInitializer } from '../initialization';
import { NotificationManager } from '../notifications';
import Header from '../../../components/Header';
import BottomNav from '../../../components/BottomNav';
import { ActionHub } from '../../../components/ActionHub';
import VisionTracker from '../../../components/VisionTracker';
import WaterTracker from '../../../components/WaterTracker';
import { VoiceCommandHUD } from '../../../components/VoiceCommandHUD';
import { ToastContainer } from '../../../components/ToastContainer';
import LevelUpAnimation from '../../../components/LevelUpAnimation';
import { motion, AnimatePresence } from 'framer-motion';
import { useUiStore } from '../../store/useUiStore';
import { useUserStore } from '../../store/useUserStore';
import { useAuthStore } from '../../store/useAuthStore';
import { spiderweb } from '../../services/AiSpiderwebService';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { view, isVisionOpen, visionType, setVisionOpen, isWaterOpen, setWaterOpen, isVoiceOpen, setVoiceOpen, isLevelUpOpen, levelUpData, closeLevelUp } = useUiStore();
  const { user } = useUserStore();
  const { apiKey } = useAuthStore();

  return (
    <ThemeProvider>
      <AppInitializer>
        <NotificationManager>
            <div className="app-shell min-h-[100dvh] bg-background text-text-primary flex flex-col overflow-hidden">
              {/* Ambient animated background */}
              <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_30%_20%,rgba(99,102,241,0.04),transparent_70%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_30%_at_70%_80%,rgba(129,140,248,0.03),transparent_60%)]" />
                <motion.div
                  className="absolute inset-0 opacity-30"
                  animate={{
                    background: [
                      'radial-gradient(800px at 20% 30%, rgba(99,102,241,0.04), transparent 70%)',
                      'radial-gradient(800px at 80% 60%, rgba(129,140,248,0.04), transparent 70%)',
                      'radial-gradient(800px at 40% 80%, rgba(99,102,241,0.04), transparent 70%)',
                      'radial-gradient(800px at 20% 30%, rgba(99,102,241,0.04), transparent 70%)',
                    ],
                  }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                />
              </div>

              <Header user={user} />
              
              <main className="flex-1 relative overflow-hidden z-10">
                <div className="absolute inset-0 px-4 sm:px-6 lg:px-8 overflow-y-auto scroll-smooth">
                  <div className="max-w-7xl mx-auto h-full pb-32">
                    {children}
                  </div>
                </div>
              </main>
               <BottomNav />
               <ActionHub />
               
               {/* Global System Modals */}
               <VisionTracker 
                 isOpen={isVisionOpen} 
                 onClose={() => setVisionOpen(false)} 
                 type={visionType} 
                 apiKey={apiKey || ''} 
                   onAnalysisComplete={async (result) => {
                      if (visionType === 'meal') {
                        try {
                          const parsed = JSON.parse(result);
                          const cals = parsed.total_calories_in_plate || 0;
                          const prot = parsed.total_protein || 0;
                          const items = Array.isArray(parsed.items_identified) ? parsed.items_identified : [];
                          const mealName = items[0]?.name || 'Scanned Meal';
                          const allNames = items.map((i: any) => i.name).join(', ') || 'Scanned Meal';
                          if (cals > 0) {
                            spiderweb.emit({ type: 'MEAL_SCAN', data: { calories: cals, protein: prot, carbs: items.reduce((s: number, i: any) => s + (i.carbs || 0), 0), fats: items.reduce((s: number, i: any) => s + (i.fats || 0), 0), mealName: allNames.slice(0, 80) } });
                          }
                        } catch { /* result is plain text or non-critical */ }
                      }
                   }} 
               />

               <WaterTracker 
                 isOpen={isWaterOpen} 
                 onClose={() => setWaterOpen(false)} 
               />
               <VoiceCommandHUD 
                 isOpen={isVoiceOpen} 
                 onClose={() => setVoiceOpen(false)} 
               />

               <AnimatePresence>
                 {isLevelUpOpen && levelUpData && (
                   <LevelUpAnimation 
                     level={levelUpData.level}
                     rank={levelUpData.rank}
                     onClose={closeLevelUp}
                   />
                 )}
               </AnimatePresence>

               {/* Global Toast Notifications */}
               <ToastContainer />
            </div>
        </NotificationManager>
      </AppInitializer>
    </ThemeProvider>
  );
};
