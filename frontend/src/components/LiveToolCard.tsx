import { Icon } from './Icon';
import type { ToolCallInfo } from '@/types';
import { getToolMeta } from './ToolMetaRegistry';

export function LiveToolCard({ tc, index }: { tc: ToolCallInfo; index: number }) {
  const finished = tc.duration_ms > 0 || !!tc.output || !!tc.error;
  const meta = getToolMeta(tc.name);

  return (
    <div
      className="animate-tool-card-enter flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl bg-brand-panelAlt/40 hover:bg-brand-panelAlt/70 transition-all duration-200"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Tool ikonu */}
      <div
        className={`flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-lg ${
          !finished
            ? 'bg-brand-accent/10 text-brand-accent'
            : tc.ok
              ? 'bg-brand-success/10 text-brand-success'
              : 'bg-brand-danger/10 text-brand-danger'
        }`}
      >
        <Icon name={meta.icon} size={13} weight={500} />
      </div>

      {/* Tool etiketi (Türkçe) + tool adı subtitle */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 truncate">
          <span className="text-[11.5px] font-medium text-brand-text truncate leading-snug">
            {meta.label}
          </span>
          <span className="text-[9.5px] font-mono text-brand-mutedSoft/60 truncate">
            {tc.name}
          </span>
        </div>
      </div>

      {/* Sağ: durum göstergesi */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {finished ? (
          <>
            <span
              className={`text-[10px] font-mono font-medium tabular-nums ${
                tc.ok ? 'text-brand-mutedSoft' : 'text-brand-danger'
              }`}
            >
              {tc.duration_ms > 0
                ? tc.duration_ms < 1000
                  ? `${tc.duration_ms}ms`
                  : `${(tc.duration_ms / 1000).toFixed(1)}s`
                : tc.ok
                  ? 'ok'
                  : 'hata'}
            </span>
            <div className="animate-tool-status-pop">
              <Icon
                name={tc.ok ? 'check' : 'close'}
                size={13}
                weight={600}
                className={tc.ok ? 'text-brand-success' : 'text-brand-danger'}
              />
            </div>
          </>
        ) : (
          <div className="flex items-center gap-1.5">
            <Icon
              name="progress_activity"
              size={12}
              weight={600}
              className="text-brand-accent animate-spin-slow"
            />
            <span className="text-[9.5px] font-mono text-brand-accent font-medium">
              çalışıyor
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
