import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';
import { TerminalSquare } from 'lucide-react';

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
      case 'danger':
        return 'border-red-500/40 bg-red-500/10 text-red-300';
      case 'success':
        return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
      case 'warning':
        return 'border-amber-500/40 bg-amber-500/10 text-amber-300';
      case 'story':
        return 'border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-200 italic';
      default:
        return 'border-white/10 bg-white/[0.03] text-zinc-300';
    }
  };

  return (
    <section className="glass-card rounded-3xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <TerminalSquare className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="panel-title">System Log</div>
            <div className="text-sm text-zinc-300">人生事件流 / 生存记录</div>
          </div>
        </div>
        <div className="text-xs text-zinc-500 font-mono">
          {logs.length} entries
        </div>
      </div>

      <div className="h-64 md:h-72 overflow-y-auto px-4 py-4 space-y-2 font-mono text-sm">
        {logs.length === 0 && (
          <div className="text-zinc-600 text-center mt-16">
            &gt;&gt;&gt; 系统初始化完成...
          </div>
        )}

        {logs.map((log) => (
          <div
            key={log.id}
            className={`rounded-2xl border px-4 py-3 leading-relaxed transition-all hover:translate-x-0.5 ${getLogStyle(log.type)}`}
          >
            {log.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </section>
  );
};

export default GameLog;
