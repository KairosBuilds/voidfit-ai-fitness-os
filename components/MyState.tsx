import React, { useState } from 'react';
import { UserState } from '../types';
import { User, Save } from 'lucide-react';

interface MyStateProps {
  initialState: UserState;
  onSave: (newState: UserState) => void;
}

const StateTextarea: React.FC<{ label: string; sublabel?: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; rows?: number; placeholder: string; }> = ({ label, sublabel, value, onChange, rows = 2, placeholder }) => (
  <div>
    <label className="block text-md font-semibold text-text-primary mb-1">
      {label}
      {sublabel && <span className="text-sm font-normal text-text-secondary ml-2">{sublabel}</span>}
    </label>
    <textarea
      value={value}
      onChange={onChange}
      rows={rows}
      placeholder={placeholder}
      className="block w-full bg-background border border-border-color rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary sm:text-sm custom-scrollbar"
    />
  </div>
);

const MyState: React.FC<MyStateProps> = ({ initialState, onSave }) => {
  const [state, setState] = useState(initialState);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: keyof UserState) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setState(prevState => ({ ...prevState, [field]: e.target.value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(state);
    setHasChanges(false);
  };

  return (
    <div>
        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: #30363D;
            border-radius: 20px;
            border: 3px solid #161B22;
          }
        `}</style>
        <div className="flex items-center space-x-3 mb-2">
            <User className="w-6 h-6 text-text-secondary" />
            <h2 className="text-xl font-semibold text-text-primary">My State</h2>
        </div>
        <p className="text-sm text-text-secondary mb-6 ml-9">Define your mission and goals to help the AI generate relevant quests and provide better guidance.</p>
        
        <div className="space-y-6">
            <StateTextarea 
                label="Core Mission"
                value={state.coreMission}
                onChange={handleChange('coreMission')}
                rows={4}
                placeholder="What is your ultimate, long-term vision?"
            />
             <StateTextarea 
                label="Long-Term Goals"
                sublabel="(6-12 months)"
                value={state.longTermGoals}
                onChange={handleChange('longTermGoals')}
                placeholder="What are your high-level objectives for the next year?"
            />
            <StateTextarea 
                label="Short-Term Goals"
                sublabel="(1-3 months)"
                value={state.shortTermGoals}
                onChange={handleChange('shortTermGoals')}
                placeholder="What is your primary focus for the next quarter?"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StateTextarea 
                    label="Transformation Protocol"
                    value={state.transformationProtocol}
                    onChange={handleChange('transformationProtocol')}
                    placeholder="Specific training methods or nutritional rules (e.g. Keto, PPL, HIIT focus)."
                />
                <StateTextarea 
                    label="Habit Stacks"
                    value={state.sideQuests}
                    onChange={handleChange('sideQuests')}
                    placeholder="Secondary lifestyle habits (e.g. Cold showers, meditation)."
                />
            </div>
        </div>

        <div className="flex justify-end mt-6">
            <button 
                onClick={handleSave}
                disabled={!hasChanges}
                className="flex items-center space-x-2 text-sm font-semibold px-4 py-2 rounded-lg bg-border-color text-text-primary hover:bg-opacity-80 disabled:bg-border-color/50 disabled:text-text-muted disabled:cursor-not-allowed"
            >
                <Save size={16}/>
                <span>Save State</span>
            </button>
        </div>
    </div>
  );
};

export default MyState;