import { Icon } from './Icon';
import type { ReflectionInfo } from '@/hooks/useChat';

/**
 * Reflection (PASS/RETRY/REPLAN/FAIL) sonucu kartı.
 * Material Symbols ile profesyonel tasarım.
 */
export function ReflectionCard({ reflection }: { reflection: ReflectionInfo }) {
  const config: Record<
    string,
    { icon: string; label: string; cls: string; iconBg: string }
  > = {
    pass: {
      icon: 'task_alt',
      label: 'Adım Onaylandı',
      cls: 'border-brand-success/40 bg-brand-success/5',
      iconBg: 'bg-brand-success/15 text-brand-success'},
    retry: {
      icon: 'refresh',
      label: 'Yeniden Deneniyor',
      cls: 'border-yellow-500/40 bg-yellow-500/5',
      iconBg: 'bg-yellow-500/15 text-yellow-500'},
    replan: {
      icon: 'autorenew',
      label: 'Plan Güncelleniyor',
      cls: 'border-brand-accent/40 bg-brand-accent/5',
      iconBg: 'bg-brand-accent/15 text-brand-accent'},
    fail: {
      icon: 'error',
      label: 'Adım Başarısız',
      cls: 'border-brand-danger/40 bg-brand-danger/5',
      iconBg: 'bg-brand-danger/15 text-brand-danger'}};
  const c = config[reflection.verdict] || config.pass;

  return (
    <div
      className="flex items-start gap-3 rounded-xl bg-brand-panelAlt/60 px-3 py-2.5 shadow-none animate-reflection-in"
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${c.iconBg}`}
      >
        <Icon name={c.icon} size={18} weight={500} filled />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-brand-text">
            {c.label}
          </span>
          <span className="text-[9.5px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-panel-alt text-brand-mutedSoft font-mono">
            Adım #{reflection.step_id}
          </span>
        </div>
        <div className="text-[11.5px] text-brand-textSoft mt-1 leading-relaxed">
          {reflection.reason}
        </div>
        {reflection.suggested_fix && (
          <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-brand-textSoft italic">
            <Icon
              name="lightbulb"
              size={13}
              weight={500}
              filled
              className="text-yellow-500 flex-shrink-0 mt-px"
            />
            <span>{reflection.suggested_fix}</span>
          </div>
        )}
      </div>
    </div>
  );
}
