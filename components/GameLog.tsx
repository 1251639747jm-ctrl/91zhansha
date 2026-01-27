import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

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
      case 'danger': return 'text-red-400 border-l-2 border-red-500 pl-2 bg-red-900/10';
      case 'success': return 'text-green-400 border-l-2 border-green-500 pl-2';
      case 'warning': return 'text-yellow-400 border-l-2 border-yellow-500 pl-2';
      case 'story': return 'text-indigo-300 italic my-2';
      default: return 'text-slate-300';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 h-64 md:h-80 overflow-y-auto mb-4 font-mono text-sm leading-relaxed relative">
      <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-slate-900 to-transparent pointer-events-none"></div>
      
      {logs.length === 0 && <div className="text-slate-500 text-center mt-10">游戏开始... 选择你的命运</div>}
      
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
