import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Props {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  accent?: 'rose' | 'cyan' | 'indigo' | 'emerald' | 'amber' | 'fuchsia' | 'zinc';
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  /** 受控模式：可以从外部控制开合。若传入，则忽略 defaultOpen 的初始值之后的变化。 */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const accentMap: Record<NonNullable<Props['accent']>, { icon: string; border: string; glow: string }> = {
  rose:    { icon: 'text-rose-300',    border: 'border-rose-400/20',    glow: 'bg-rose-500/10' },
  cyan:    { icon: 'text-cyan-300',    border: 'border-cyan-400/20',    glow: 'bg-cyan-500/10' },
  indigo:  { icon: 'text-indigo-300',  border: 'border-indigo-400/20',  glow: 'bg-indigo-500/10' },
  emerald: { icon: 'text-emerald-300', border: 'border-emerald-400/20', glow: 'bg-emerald-500/10' },
  amber:   { icon: 'text-amber-300',   border: 'border-amber-400/20',   glow: 'bg-amber-500/10' },
  fuchsia: { icon: 'text-fuchsia-300', border: 'border-fuchsia-400/20', glow: 'bg-fuchsia-500/10' },
  zinc:    { icon: 'text-zinc-300',    border: 'border-white/10',       glow: 'bg-white/[0.05]' },
};

const CollapsibleGroup: React.FC<Props> = ({
  title,
  subtitle,
  icon,
  accent = 'zinc',
  badge,
  defaultOpen = false,
  open,
  onOpenChange,
  children,
}) => {
  const isControlled = typeof open === 'boolean';
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = isControlled ? (open as boolean) : internalOpen;
  const toggle = () => {
    const next = !isOpen;
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const a = accentMap[accent];

  return (
    <div
      className={`glass-card rounded-2xl overflow-hidden ${a.border}`}
    >
      <button
        type="button"
        onClick={toggle}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-white/[0.04] transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <div className={`w-9 h-9 rounded-xl border ${a.border} ${a.glow} flex items-center justify-center shrink-0 ${a.icon}`}>
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-sm font-bold text-white truncate">{title}</div>
            {subtitle && <div className="text-[11px] text-zinc-500 truncate mt-0.5">{subtitle}</div>}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {badge}
          <ChevronDown
            className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-1 border-t border-white/[0.05]">
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleGroup;
