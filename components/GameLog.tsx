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
      case 'danger': return 'text-red-400 bg-red-950/30 border-l-2 border-red-500 pl-2';
      case 'success': return 'text-green-400 border-l-2 border-green-500 pl-2';
      case 'warning': return 'text-yellow-400 bg-yellow-950/30 border-l-2 border-yellow-500 pl-2';
      case 'story': return 'text-cyan-300 italic border-l-2 border-cyan-500 pl-2 bg-cyan-950/20 py-2';
      default: return 'text-zinc-400';
    }
  };

  return (
    <div className="bg-black/50 backdrop-blur border border-zinc-800 rounded-xl p-4 h-64 md:h-80 overflow-y-auto font-mono text-sm leading-relaxed relative shadow-inner">
      <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-black/80 to-transparent pointer-events-none sticky z-10"></div>
      
      {logs.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-zinc-600 space-y-2">
            <span className="animate-pulse">/// 等待系统初始化 ///</span>
            <span className="text-xs">请选择身份开始模拟</span>
        </div>
      )}
      
      <div className="flex flex-col space-y-3 mt-2">
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
