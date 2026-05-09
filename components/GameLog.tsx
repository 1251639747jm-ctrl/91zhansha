import React, { useEffect, useRef, useState, useMemo } from 'react';
import { LogEntry } from '../types';
import { TerminalSquare, Filter, ChevronUp, ChevronDown } from 'lucide-react';

interface Props {
  logs: LogEntry[];
  /**
   * 'fixed' 固定高度；'flex' 填满父容器；'collapsible' 头部可折叠（展开/收起）
   * 默认改为 'collapsible' 以匹配新的 UI 组织方式
   */
  heightMode?: 'fixed' | 'flex' | 'collapsible';
  defaultOpen?: boolean;
}

type FilterKey = 'all' | LogEntry['type'];

const typeStyle = (type: LogEntry['type']) => {
  switch (type) {
    case 'danger':
      return 'border-red-500/30 bg-red-500/10 text-red-200';
    case 'success':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
    case 'warning':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
    case 'story':
      return 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200 italic';
    default:
      return 'border-white/10 bg-white/[0.04] text-zinc-300';
  }
};

const typeDot = (type: LogEntry['type']) => {
  switch (type) {
    case 'danger':  return 'bg-red-400';
    case 'success': return 'bg-emerald-400';
    case 'warning': return 'bg-amber-400';
    case 'story':   return 'bg-fuchsia-400';
    default:        return 'bg-zinc-400';
  }
};

const filterChipClass = (active: boolean, color: string) =>
  `text-[10px] px-2.5 py-1 rounded-full border font-semibold tracking-wide transition-all ${
    active
      ? `${color} scale-105`
      : 'text-zinc-500 border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:text-zinc-300'
  }`;

const GameLog: React.FC<Props> = ({ logs, heightMode = 'collapsible', defaultOpen = true }) => {
  const endRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(defaultOpen);
  const [filter, setFilter] = useState<FilterKey>('all');

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, open]);

  const filtered = useMemo(
    () => (filter === 'all' ? logs : logs.filter((l) => l.type === filter)),
    [logs, filter]
  );

  const counts = useMemo(() => {
    const c = { all: logs.length, info: 0, danger: 0, success: 0, warning: 0, story: 0 } as Record<string, number>;
    logs.forEach((l) => (c[l.type] = (c[l.type] || 0) + 1));
    return c;
  }, [logs]);

  const isCollapsible = heightMode === 'collapsible';
  const rootHeightClass = heightMode === 'flex' ? 'h-full' : '';

  return (
    <section className={`glass-card rounded-3xl overflow-hidden flex flex-col ${rootHeightClass}`}>
      {/* Header */}
      <button
        type="button"
        onClick={() => isCollapsible && setOpen((v) => !v)}
        className={`w-full px-5 py-3.5 flex items-center justify-between bg-white/[0.02] border-b border-white/10 shrink-0 text-left ${
          isCollapsible ? 'hover:bg-white/[0.05] transition-colors' : 'cursor-default'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center shrink-0">
            <TerminalSquare className="w-4 h-4 text-indigo-300" />
          </div>
          <div className="min-w-0">
            <div className="panel-title">System Log</div>
            <div className="text-sm font-semibold text-white">人生事件流</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="chip text-indigo-200 border-indigo-400/20 bg-indigo-500/10">
            {logs.length} entries
          </span>
          {isCollapsible && (
            <span className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
              {open ? (
                <ChevronDown className="w-4 h-4 text-zinc-300" />
              ) : (
                <ChevronUp className="w-4 h-4 text-zinc-300" />
              )}
            </span>
          )}
        </div>
      </button>

      {/* Body */}
      {(!isCollapsible || open) && (
        <>
          {/* 筛选条 */}
          <div className="px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.015] shrink-0 flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-zinc-500">
              <Filter className="w-3 h-3" /> Filter
            </div>

            <button
              onClick={() => setFilter('all')}
              className={filterChipClass(filter === 'all', 'text-white border-white/30 bg-white/[0.08]')}
            >
              All · {counts.all}
            </button>
            <button
              onClick={() => setFilter('story')}
              className={filterChipClass(
                filter === 'story',
                'text-fuchsia-200 border-fuchsia-400/30 bg-fuchsia-500/15'
              )}
            >
              剧情 · {counts.story || 0}
            </button>
            <button
              onClick={() => setFilter('success')}
              className={filterChipClass(
                filter === 'success',
                'text-emerald-200 border-emerald-400/30 bg-emerald-500/15'
              )}
            >
              成功 · {counts.success || 0}
            </button>
            <button
              onClick={() => setFilter('warning')}
              className={filterChipClass(
                filter === 'warning',
                'text-amber-200 border-amber-400/30 bg-amber-500/15'
              )}
            >
              警告 · {counts.warning || 0}
            </button>
            <button
              onClick={() => setFilter('danger')}
              className={filterChipClass(
                filter === 'danger',
                'text-red-200 border-red-400/30 bg-red-500/15'
              )}
            >
              危险 · {counts.danger || 0}
            </button>
          </div>

          {/* 日志列表 */}
          <div
            className={`${
              heightMode === 'flex'
                ? 'flex-1 min-h-0'
                : heightMode === 'collapsible'
                ? 'max-h-[360px]'
                : 'h-64 md:h-72'
            } overflow-y-auto px-4 py-3 space-y-2 font-mono text-[13px]`}
          >
            {filtered.length === 0 && (
              <div className="text-zinc-600 text-center py-12 text-sm">
                &gt;&gt;&gt; 暂无记录
              </div>
            )}

            {filtered.map((log) => (
              <div
                key={log.id}
                className={`rounded-xl border pl-3 pr-3 py-2.5 leading-relaxed flex items-start gap-2.5 transition-colors ${typeStyle(
                  log.type
                )}`}
              >
                <span
                  className={`mt-[7px] w-1.5 h-1.5 rounded-full shrink-0 ${typeDot(log.type)}`}
                />
                <span className="flex-1">{log.text}</span>
              </div>
            ))}
            <div ref={endRef} />
          </div>
        </>
      )}
    </section>
  );
};

export default GameLog;
