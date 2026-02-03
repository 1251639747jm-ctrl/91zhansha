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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      {/* 限制模态框最大高度，防止超出屏幕 */}
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-md max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col relative">
        
        {/* 顶部彩色装饰条 */}
        <div className="h-2 bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 w-full shrink-0" />
        
        {/* 内容区域：增加 overflow-y-auto 允许内部滚动 */}
        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex flex-col items-center">
          
          <div className="mb-4 bg-zinc-800 p-4 rounded-full shadow-inner border border-zinc-700 shrink-0">
            {getIcon()}
          </div>
          
          <h2 className="text-xl md:text-2xl font-black text-white mb-3 tracking-tight text-center">
            {config.title}
          </h2>
          
          <p className="text-zinc-400 leading-relaxed text-sm mb-6 text-center whitespace-pre-wrap">
            {config.description}
          </p>
          
          {/* 按钮区域：改为 2 列网格布局，大幅节省垂直空间 */}
          <div className="w-full grid grid-cols-2 gap-2 md:gap-3">
            {config.actions.map((action, idx) => {
              // 逻辑：如果是最后一个按钮（通常是退出）或者是危险操作，让它占满两列
              const isFullWidth = 
                idx === config.actions.length - 1 || 
                action.style === 'danger' || 
                config.actions.length === 1;

              return (
                <button
                  key={idx}
                  onClick={action.onClick}
                  className={`py-3 px-3 rounded-lg font-bold text-xs md:text-sm transition-all transform active:scale-95 flex items-center justify-center text-center
                    ${isFullWidth ? 'col-span-2' : 'col-span-1'}
                    ${action.style === 'danger' ? 'bg-red-900/40 text-red-200 hover:bg-red-800/60 border border-red-800' : 
                      action.style === 'secondary' ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-zinc-700' :
                      'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg'
                    }`}
                >
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3f3f46;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #52525b;
        }
      `}</style>
    </div>
  );
};

export default EventModal;
