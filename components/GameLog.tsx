import React, { useEffect, useRef } from 'react';
import { LogEntry } from './types';

interface Props {
  logs: LogEntry[];
}

const GameLog: React.FC<Props> = ({ logs }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getLogStyle = (type: LogEntry['type']) => {
    switch (type) {
      case 'danger': return 'text-red-400 border-l-2 border-red-500 pl-3 bg-red-900/20';
      case 'success': return 'text-green-400 border-l-2 border-green-500 pl-3';
      case 'warning': return 'text-yellow-400 border-l-2 border-yellow-500 pl-3';
      case 'story': return 'text-purple-300 italic my-2 pl-3 border-l-2 border-purple-500';
      default: return 'text-zinc-400 pl-3 border-l-2 border-zinc-700';
    }
  };

  return (
    <div className="bg-black/50 border border-zinc-800 rounded-lg p-4 h-48 md:h-60 overflow-y-auto font-mono text-sm leading-relaxed relative scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
      {logs.length === 0 && <div className="text-zinc-600 text-center mt-10">>>> 系统初始化完成...</div>}
      
      <div className="flex flex-col space-y-2">
        {logs.map((log) => (
          <div key={log.id} className={`${getLogStyle(log.type)} py-1`}>
            {log.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
};

export default GameLog;
