import React, { useEffect, useState } from 'react';
import { RewardNotification } from '../types';
import { Star, DollarSign, ArrowRight } from 'lucide-react';

interface RewardToastProps {
  notifications: RewardNotification[];
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<{ notification: RewardNotification; onRemove: (id: string) => void; }> = ({ notification, onRemove }) => {
    const [isVisible, setIsVisible] = useState(false);
    
    useEffect(() => {
        setIsVisible(true);
        const removeTimer = setTimeout(() => {
            setIsVisible(false);
        }, 3500);

        const destroyTimer = setTimeout(() => {
            onRemove(notification.id);
        }, 4000);

        return () => {
            clearTimeout(removeTimer);
            clearTimeout(destroyTimer);
        };
    }, [notification.id, onRemove]);
    
    const isXp = notification.type === 'xp';
    const Icon = isXp ? Star : DollarSign;
    const color = isXp ? 'text-accent-secondary' : 'text-accent-green';

    return (
        <div className={`
            flex items-center space-x-3 bg-primary border border-border-color shadow-lg rounded-lg p-3
            transition-all duration-500 ease-in-out
            ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        `}>
            <Icon className={`w-6 h-6 ${color}`} />
            <div className="flex items-center space-x-2 text-text-primary font-semibold">
                <span className="relative">
                    +{notification.originalAmount}
                    <span className="absolute left-0 right-0 top-1/2 h-0.5 bg-accent-red transform -rotate-6"></span>
                </span>
                <ArrowRight size={16} className="text-text-secondary" />
                <span className={`font-bold ${color}`}>+{notification.finalAmount} {isXp ? 'XP' : 'CR'}</span>
            </div>
        </div>
    );
};


const RewardToast: React.FC<RewardToastProps> = ({ notifications, onRemove }) => {
  return (
    <div className="fixed top-24 right-4 z-[100] space-y-2 w-64">
      {notifications.map(notif => (
        <ToastItem key={notif.id} notification={notif} onRemove={onRemove} />
      ))}
    </div>
  );
};

export default RewardToast;