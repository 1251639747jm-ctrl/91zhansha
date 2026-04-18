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

  const themeMap = {
    DEATH: {
      icon: <Skull className="w-10 h-10 text-red-400" />,
      glow: 'from-red-500/20 via-red-500/5 to-transparent',
      ring: 'border-red-500/20'
    },
    DISEASE: {
      icon: <AlertTriangle className="w-10 h-10 text-amber-400" />,
      glow: 'from-amber-500/20 via-amber-500/5 to-transparent',
      ring: 'border-amber-500/20'
    },
    LOVE: {
      icon: <HeartCrack className="w-10 h-10 text-pink-400" />,
      glow: 'from-pink-500/20 via-pink-500/5 to-transparent',
      ring: 'border-pink-500/20'
    },
    WORK: {
      icon: <Briefcase className="w-10 h-10 text-cyan-400" />,
      glow: 'from-cyan-500/20 via-cyan-500/5 to-transparent',
      ring: 'border-cyan-500/20'
    },
    EVENT: {
      icon: <PartyPopper className="w-10 h-10 text-violet-400" />,
      glow: 'from-violet-500/20 via-violet-500/5 to-transparent',
      ring: 'border-violet-500/20'
    }
  };

  const theme = themeMap[config.type];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className={`relative w-full max-w-xl max-h-[90vh] overflow-hidden rounded-3xl glass-card border ${theme.ring}`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${theme.glow} pointer-events-none`} />
        <div className="relative">
          <div className="h-1.5 bg-gradient-to-r from-white/20 via-white/60 to-white/20" />
          
          <div className="p-6 md:p-8 overflow-y-auto max-h-[90vh]">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-3xl bg-white/[0.04] border border-white/10 flex items-center justify-center shadow-inner mb-5">
                {theme.icon}
              </div>

              <div className="panel-title mb-2">{config.type}</div>

              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-4">
                {config.title}
              </h2>

              <p className="text-zinc-300 leading-7 text-sm md:text-base whitespace-pre-wrap mb-8 max-w-lg">
                {config.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {config.actions.map((action, idx) => {
                const classes =
                  action.style === 'danger'
                    ? 'bg-red-500/10 text-red-200 border-red-500/20 hover:bg-red-500/20'
                    : action.style === 'secondary'
                    ? 'bg-white/[0.04] text-zinc-300 border-white/10 hover:bg-white/[0.08]'
                    : 'bg-indigo-500/20 text-white border-indigo-400/20 hover:bg-indigo-500/30';

                return (
                  <button
                    key={idx}
                    onClick={action.onClick}
                    className={`rounded-2xl border px-4 py-4 font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${classes} ${
                      config.actions.length === 1 ? 'sm:col-span-2' : ''
                    }`}
                  >
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
