import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface Props {
  logs: LogEntry[];
}

const GameLog: React.FC<Props> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [logs]);

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto space-y-3 mb-6 pr-2 scrollbar-hide"
      style={{ maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)' }}
    >
      {logs.map((log) => (
        <div 
          key={log.id} 
          className={`text-sm p-4 rounded-2xl border leading-relaxed animate-in fade-in slide-in-from-left-4 duration-500 ${
            log.type === 'danger' ? 'bg-rose-500/5 border-rose-500/20 text-rose-400' :
            log.type === 'story' ? 'bg-indigo-500/5 border-indigo-500/20 text-indigo-300 italic' :
            log.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' :
            'bg-slate-800/20 border-slate-800/50 text-slate-400'
          }`}
        >
          {log.text}
        </div>
      ))}
    </div>
  );
};

export default GameLog;
