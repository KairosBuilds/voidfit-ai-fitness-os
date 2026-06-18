import React from 'react';
import { Realm } from '../../types';

interface RealmSelectorProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  realmConfig: any;
  setSelectedModule: (module: any) => void;
}

export const RealmSelector: React.FC<RealmSelectorProps> = ({ activeTab, setActiveTab, realmConfig, setSelectedModule }) => (
  <div className="horizontal-scroll gap-2 p-2 glass-effect rounded-[2rem] border-2 border-glass-border custom-scrollbar touch-pan-x scroll-smooth shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
    {(Object.keys(realmConfig) as (Realm | 'Bio-Map')[]).map(realm => {
      const active = activeTab === realm;
      const config = realmConfig[realm];
      return (
        <button
          key={realm}
          onClick={() => { setActiveTab(realm); setSelectedModule(null); }}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap active:scale-95 flex-shrink-0 ${
            active ? `${config.bg} text-white shadow-[0_0_15px_currentColor] scale-105 border border-glass-border` : 'text-sub-text hover:bg-surface border border-transparent hover:border-glass-border hover:shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]'
          }`}
        >
          {config.icon}
          <span className={active ? 'drop-shadow-[0_0_2px_currentColor]' : ''}>{realm}</span>
        </button>
      );
    })}
  </div>
);
