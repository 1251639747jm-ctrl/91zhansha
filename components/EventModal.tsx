import React from 'react';
import { Skull, AlertTriangle, PartyPopper, Briefcase, HeartCrack } from 'lucide-react';

export interface ModalAction {
  label: string;
  onClick: () => void;
  style?: 'primary' | 'danger' | 'secondary';
}

export interface ModalConfig {
  isOpen: boolean;
  title: string;
  description: string;
  type: 'DEATH' | 'EVENT' | 'WORK' | 'DISEASE' | 'LOVE';
  actions: ModalAction[];
}

interface Props {
  config: ModalConfig;
}

const EventModal: React.FC<Props> = ({ config }) => {
  if (!config.isOpen) return null;

  const getIcon = () => {
    switch (config.type) {
      case 'DEATH': return <Skull className="w-12 h-12 text-red-600 animate-pulse" />;
      case 'DISEASE': return <AlertTriangle className="w-12 h-12 text-yellow-500" />;
      case 'LOVE': return <HeartCrack className="w-12 h-12 text-pink-500" />;
      case 'WORK': return <Briefcase className="w-12 h-12 text-blue-400" />;
      default: return <PartyPopper className="w-12 h-12 text-purple-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col relative">
        {/* Header Graphic */}
        <div className="h-2 bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 w-full" />
        
        <div className="p-8 text-center flex flex-col items-center">
          <div className="mb-6 bg-zinc-800 p-4 rounded-full shadow-inner border border-zinc-700">
            {getIcon()}
          </div>
          
          <h2 className="text-2xl font-black text-white mb-4 tracking-tight">{config.title}</h2>
          <p className="text-zinc-300 leading-relaxed text-sm mb-8">{config.description}</p>
          
          <div className="w-full space-y-3">
            {config.actions.map((action, idx) => (
              <button
                key={idx}
                onClick={action.onClick}
                className={`w-full py-3.5 px-4 rounded-lg font-bold transition-all transform active:scale-95 flex items-center justify-center
                  ${action.style === 'danger' ? 'bg-red-900/50 text-red-200 hover:bg-red-800 border border-red-800' : 
                    action.style === 'secondary' ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-600' :
                    'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-900/20'
                  }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
