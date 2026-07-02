// AgentInspector: kurumsal sade ajan denetim paneli (Linear/Vercel tarzı)

import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import type { AgentInfo, LogEntry } from '@/types';
import { Icon } from './Icon';

interface AgentInspectorProps {
  agent: AgentInfo | null;
}

interface ToolStat {
  name: string;
  count: number;
  ok: number;
  error: number;
  avg_ms: number;
}

export function AgentInspector({ agent }: AgentInspectorProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agent) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .listLogs(agent.id, 200)
      .then((data) => {
        if (!cancelled) setLogs(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [agent?.id]);

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-10 gap-2">
        <Icon
          name="person_off"
          size={28}
          weight={300}
          className="text-brand-mutedSoft"
        />
        <div className="text-xs text-brand-muted">Bir ajan seçili değil</div>
      </div>
    );
  }

  // Tool stats
  const toolLogs = logs.filter((l) => l.event === 'tool_call');
  const stats: Record<string, ToolStat> = {};
  toolLogs.forEach((l) => {
    try {
      const p = JSON.parse(l.payload_json || '{}');
      const name = p.tool || 'unknown';
      if (!stats[name]) stats[name] = { name, count: 0, ok: 0, error: 0, avg_ms: 0 };
      stats[name].count++;
      if (p.ok) stats[name].ok++;
      else stats[name].error++;
      stats[name].avg_ms =
        (stats[name].avg_ms * (stats[name].count - 1) + (p.duration_ms || 0)) /
        stats[name].count;
    } catch {
      /* ignore */
    }
  });
  const sortedStats = Object.values(stats).sort((a, b) => b.count - a.count);
  const errorLogs = logs.filter((l) => l.level === 'error').slice(0, 5);
  const totalToolCalls = toolLogs.length;
  const okSum = sortedStats.reduce((acc, s) => acc + s.ok, 0);
  const successRate =
    totalToolCalls > 0 ? Math.round((okSum / totalToolCalls) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Üst meta: ajan adı + provider/model */}
      <div className="px-0.5">
        <div className="text-[12.5px] font-semibold text-brand-text leading-tight truncate">
          {agent.name}
        </div>
        <div className="text-[10px] font-mono text-brand-mutedSoft truncate mt-0.5">
          {agent.provider}/{agent.model}
        </div>
      </div>

      {/* Ana metrikler — tek satır kompakt sayı dizisi */}
      <div className="grid grid-cols-3 rounded-lg border border-brand-border bg-brand-panel/40 overflow-hidden">
        <Metric label="Log" value={logs.length} />
        <Metric label="Tool" value={totalToolCalls} divider />
        <Metric
          label="Hata"
          value={errorLogs.length}
          tone={errorLogs.length > 0 ? 'danger' : 'default'}
          divider
        />
      </div>

      {/* Başarı oranı (sadece tool kullanımı varsa) */}
      {totalToolCalls > 0 && (
        <div className="px-0.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9.5px] uppercase tracking-wider text-brand-mutedSoft font-bold">
              Başarı oranı
            </span>
            <span
              className={`text-[11px] font-mono font-bold tabular-nums ${
                successRate >= 90
                  ? 'text-brand-success'
                  : successRate >= 70
                    ? 'text-yellow-500'
                    : 'text-brand-danger'
              }`}
            >
              %{successRate}
            </span>
          </div>
          <div className="h-[3px] rounded-full bg-brand-border overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                successRate >= 90
                  ? 'bg-brand-success'
                  : successRate >= 70
                    ? 'bg-yellow-500'
                    : 'bg-brand-danger'
              }`}
              style={{ width: `${successRate}%` }}
            />
          </div>
        </div>
      )}

      {/* Tool kullanım listesi */}
      <Section title="Tool Kullanımı" count={sortedStats.length}>
        {loading ? (
          <SectionLoading />
        ) : error ? (
          <SectionError text={error} />
        ) : sortedStats.length === 0 ? (
          <SectionEmpty text="Henüz tool kullanımı yok" />
        ) : (
          <div className="rounded-md border border-brand-border bg-brand-panel/40 divide-y divide-brand-border/40 overflow-hidden">
            {sortedStats.slice(0, 8).map((s) => (
              <ToolStatRow key={s.name} stat={s} />
            ))}
          </div>
        )}
      </Section>

      {/* Son hatalar */}
      <Section title="Son Hatalar" count={errorLogs.length}>
        {errorLogs.length === 0 ? (
          <SectionEmpty text="Hata yok" />
        ) : (
          <div className="rounded-md border border-brand-border bg-brand-panel/40 divide-y divide-brand-border/40 overflow-hidden">
            {errorLogs.map((l) => (
              <ErrorRow key={l.id} log={l} />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

// ============================================================
// Yardımcı Bileşenler
// ============================================================

/** 3'lü metrik gridi için tek hücre. */
function Metric({
  label,
  value,
  tone = 'default',
  divider}: {
  label: string;
  value: number;
  tone?: 'default' | 'danger';
  divider?: boolean;
}) {
  const valueClass =
    tone === 'danger' && value > 0
      ? 'text-brand-danger'
      : 'text-brand-text';
  return (
    <div
      className={`px-2.5 py-2 text-center ${
        divider ? 'border-l border-brand-border' : ''
      }`}
    >
      <div
        className={`text-base font-bold font-mono tabular-nums ${valueClass} leading-none`}
      >
        {value}
      </div>
      <div className="text-[9.5px] text-brand-mutedSoft uppercase tracking-wider font-semibold mt-1">
        {label}
      </div>
    </div>
  );
}

/** Section başlığı: label + opsiyonel count badge */
function Section({
  title,
  count,
  children}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <h4 className="text-[9.5px] font-bold text-brand-mutedSoft uppercase tracking-wider">
          {title}
        </h4>
        {count !== undefined && count > 0 && (
          <span className="text-[9.5px] font-mono tabular-nums text-brand-mutedSoft">
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function SectionLoading() {
  return (
    <div className="flex items-center justify-center gap-1.5 text-[11px] text-brand-mutedSoft py-3">
      <Icon name="progress_activity" size={11} className="animate-spin-slow" />
      <span>Yükleniyor</span>
    </div>
  );
}

function SectionError({ text }: { text: string }) {
  return (
    <div className="text-[11px] text-brand-danger flex items-start gap-1.5 px-2 py-2 rounded-md border border-brand-danger/30 bg-brand-danger/5">
      <Icon
        name="error"
        size={11}
        weight={500}
        filled
        className="flex-shrink-0 mt-px"
      />
      <span className="leading-relaxed">{text}</span>
    </div>
  );
}

function SectionEmpty({ text }: { text: string }) {
  return (
    <div className="text-center text-[11px] text-brand-mutedSoft py-3">
      {text}
    </div>
  );
}

/** Tool kullanım satırı — tek satır + alt progress bar */
function ToolStatRow({ stat }: { stat: ToolStat }) {
  const okRatio = stat.count > 0 ? (stat.ok / stat.count) * 100 : 0;
  return (
    <div className="hover:bg-brand-panelAlt/50 transition-colors">
      <div className="flex items-center gap-2 px-2 py-1.5">
        <code className="text-[11px] font-mono text-brand-text truncate flex-1 font-medium">
          {stat.name}
        </code>
        <span className="text-[10px] font-mono tabular-nums font-bold text-brand-success">
          {stat.ok}
        </span>
        {stat.error > 0 && (
          <span className="text-[10px] font-mono tabular-nums font-bold text-brand-danger">
            {stat.error}
          </span>
        )}
        <span className="text-[10px] font-mono tabular-nums text-brand-mutedSoft">
          {Math.round(stat.avg_ms)}ms
        </span>
      </div>
      {/* İnce başarı oranı çubuğu */}
      <div className="h-[2px] bg-brand-border">
        <div
          className={`h-full transition-all ${
            okRatio === 100
              ? 'bg-brand-success'
              : okRatio >= 50
                ? 'bg-yellow-500'
                : 'bg-brand-danger'
          }`}
          style={{ width: `${okRatio}%` }}
        />
      </div>
    </div>
  );
}

/** Hata log satırı — tek satır kompakt */
function ErrorRow({ log }: { log: LogEntry }) {
  const time = new Date(log.created_at).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'});
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-brand-panelAlt/50 transition-colors">
      <span className="w-1.5 h-1.5 rounded-full bg-brand-danger flex-shrink-0" />
      <span className="text-[10px] font-mono tabular-nums text-brand-mutedSoft flex-shrink-0">
        {time}
      </span>
      <span className="flex-1 text-[11px] text-brand-text truncate">
        {log.event}
      </span>
    </div>
  );
}