import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import type {
  AgentInfo,
  LogEntry,
  ScheduledTask,
  ScheduledTaskCreate} from '@/types';
import { Icon } from './Icon';

interface SystemPanelProps {
  agents: AgentInfo[];
  selectedAgentId: string | null;
  refreshSignal?: number;
  isOpen: boolean;
  onToggle: () => void;
  defaultTab?: Tab;
}

// --------- Cron çözümleyici ---------
function describeCron(expr: string): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return 'Özel cron ifadesi';
  const [min, hour, dom, mon, dow] = parts;

  if (min === '*' && hour === '*' && dom === '*' && mon === '*' && dow === '*')
    return 'Her dakika';
  if (min !== '*' && hour === '*' && dom === '*' && mon === '*' && dow === '*')
    return `Her saatin ${min.padStart(2, '0')}. dakikasında`;
  if (
    /^\d+$/.test(min) &&
    /^\d+$/.test(hour) &&
    dom === '*' &&
    mon === '*' &&
    dow === '*'
  ) {
    return `Her gün ${hour.padStart(2, '0')}:${min.padStart(2, '0')}`;
  }
  if (
    /^\d+$/.test(min) &&
    /^\d+$/.test(hour) &&
    dom === '*' &&
    mon === '*' &&
    /^\d+$/.test(dow)
  ) {
    const days = [
      'Pazar',
      'Pazartesi',
      'Salı',
      'Çarşamba',
      'Perşembe',
      'Cuma',
      'Cumartesi'];
    const d = Number(dow) % 7;
    return `Her ${days[d]} ${hour.padStart(2, '0')}:${min.padStart(2, '0')}`;
  }
  return `${min} ${hour} ${dom} ${mon} ${dow}`;
}

type Tab = 'tasks' | 'logs';

const TAB_CONFIG: Record<Tab, { icon: string; label: string }> = {
  tasks: { icon: 'event_repeat', label: 'Görevler' },
  logs: { icon: 'receipt_long', label: 'Loglar' }};

export function SystemPanel({
  agents,
  selectedAgentId,
  refreshSignal = 0,
  isOpen,
  onToggle,
  defaultTab}: SystemPanelProps) {
  const [tab, setTab] = useState<Tab>(defaultTab ?? 'tasks');
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [runningId, setRunningId] = useState<number | null>(null);

  useEffect(() => {
    if (defaultTab) {
      setTab(defaultTab);
    }
  }, [defaultTab]);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, l] = await Promise.all([
        api.listTasks(),
        api.listLogs(undefined, 50)]);
      setTasks(t);
      setLogs(l);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal]);

  const handleToggleTask = async (task: ScheduledTask) => {
    try {
      const updated = await api.updateTask(task.id, { enabled: !task.enabled });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDeleteTask = async (task: ScheduledTask) => {
    if (!confirm(`"${task.name}" silinsin mi?`)) return;
    try {
      await api.deleteTask(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleRunTask = async (task: ScheduledTask) => {
    setRunningId(task.id);
    try {
      const updated = await api.runTaskNow(task.id);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunningId(null);
    }
  };

  const handleCreateTask = async (payload: ScheduledTaskCreate) => {
    try {
      const created = await api.createTask(payload);
      setTasks((prev) => [created, ...prev]);
      setShowNewTask(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const activeCount = tasks.filter((t) => t.enabled).length;
  const errorCount = logs.filter((l) => l.level === 'error').length;

  return (
    <aside className={`relative h-full flex-shrink-0 border-l bg-brand-panel flex flex-col transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${isOpen ? 'w-80 border-brand-border opacity-100' : 'w-0 border-transparent opacity-0'}`}>
      <div className={`w-80 h-full flex flex-col transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? 'translate-x-0' : 'translate-x-8'}`}>
      {/* ---------- Tab Bar ---------- */}
      <div className="border-b border-brand-border bg-brand-panel">
        <div className="flex items-stretch px-2 pt-2 gap-1">
          {(Object.keys(TAB_CONFIG) as Tab[]).map((t) => {
            const cfg = TAB_CONFIG[t];
            const isActive = tab === t;
            const badge =
              t === 'tasks'
                ? tasks.length > 0
                  ? `${activeCount}/${tasks.length}`
                  : null
                : t === 'logs'
                  ? errorCount > 0
                    ? `${errorCount}!`
                    : logs.length > 0
                      ? `${logs.length}`
                      : null
                  : null;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 h-9 inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold rounded-md transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'bg-brand-accent/15 text-brand-accent'
                    : 'text-brand-mutedSoft hover:text-brand-text hover:bg-brand-panelAlt'
                }`}
              >
                <Icon
                  name={cfg.icon}
                  size={15}
                  weight={550}
                  filled={isActive}
                />
                <span className="hidden md:inline">{cfg.label}</span>
                {badge && (
                  <span
                    className={`text-[9.5px] px-1.5 py-0.5 rounded-md font-mono font-bold ${
                      t === 'logs' && errorCount > 0
                        ? 'bg-brand-danger/20 text-brand-danger'
                        : isActive
                          ? 'bg-brand-accent/25 text-brand-accent'
                          : 'bg-brand-panelAlt text-brand-mutedSoft'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
          {/* Collapse Button */}
          <button
            onClick={onToggle}
            title="Sistem Panelini Kapat"
            className="w-9 h-9 inline-flex items-center justify-center text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt rounded-md transition-all duration-200 active:scale-95 flex-shrink-0"
          >
            <Icon name="arrow_forward" size={16} />
          </button>
        </div>
      </div>
      {/* ---------- İçerik ---------- */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading && (
          <div className="flex items-center justify-center gap-2 text-xs text-brand-muted py-8 animate-pulse">
            <Icon name="progress_activity" size={13} className="animate-spin-slow" />
            <span>Yükleniyor...</span>
          </div>
        )}
        {error && (
          <div className="p-3 text-xs text-brand-danger bg-brand-danger/5 rounded-md border border-brand-danger/25">
            {error}
          </div>
        )}

        {/* TASKS */}
        {tab === 'tasks' && (
          <>
            <div key={showNewTask ? 'form' : 'btn'} className="animate-step-in">
              {!showNewTask ? (
                <button
                  onClick={() => setShowNewTask(true)}
                  disabled={agents.length === 0}
                  className="w-full h-10 inline-flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg border border-dashed border-brand-border text-brand-mutedSoft hover:text-brand-accent hover:border-brand-accent/60 hover:bg-brand-accent/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  <Icon name="add_circle" size={15} weight={550} filled />
                  {agents.length === 0
                    ? 'Önce bir ajan oluştur'
                    : 'Yeni Zamanlı Görev'}
                </button>
              ) : (
                <NewTaskForm
                  agents={agents}
                  defaultAgentId={selectedAgentId}
                  onCreate={handleCreateTask}
                  onCancel={() => setShowNewTask(false)}
                />
              )}
            </div>

            {!loading && tasks.length === 0 && !showNewTask && (
              <div className="flex flex-col items-center justify-center text-center py-10 gap-2">
                <Icon
                  name="schedule"
                  size={32}
                  weight={300}
                  className="text-brand-mutedSoft"
                />
                <div className="text-xs text-brand-muted">Henüz görev yok</div>
                <div className="text-[10px] text-brand-mutedSoft max-w-[200px]">
                  Cron ifadeleri ile ajanı otomatik tetikleyebilirsin.
                </div>
              </div>
            )}
            {tasks.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                agentName={
                  agents.find((a) => a.id === t.agent_id)?.name ?? t.agent_id
                }
                running={runningId === t.id}
                onRun={() => handleRunTask(t)}
                onToggle={() => handleToggleTask(t)}
                onDelete={() => handleDeleteTask(t)}
              />
            ))}
          </>
        )}

        {/* LOGS */}
        {tab === 'logs' && (
          <>
            {logs.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center text-center py-10 gap-2">
                <Icon
                  name="inbox"
                  size={32}
                  weight={300}
                  className="text-brand-mutedSoft"
                />
                <div className="text-xs text-brand-muted">Log yok</div>
              </div>
            )}
            {logs.length > 0 && <LogList logs={logs} />}
          </>
        )}
      </div>

      {/* ---------- Alt Bar: Yenile ---------- */}
      <div className="p-2 border-t border-brand-border">
        <button
          onClick={loadAll}
          disabled={loading}
          className="w-full h-8 inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold rounded-md border border-brand-border text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt hover:border-brand-borderStrong disabled:opacity-50 transition-all active:scale-95"
        >
          <Icon
            name="refresh"
            size={13}
            weight={550}
            className={loading ? 'animate-spin-slow' : ''}
          />
          Yenile
        </button>
      </div>
    </div>
  </aside>
);
}

// ============================================================
// Bileşenler
// ============================================================

function TaskCard({
  task,
  agentName,
  running,
  onRun,
  onToggle,
  onDelete}: {
  task: ScheduledTask;
  agentName: string;
  running: boolean;
  onRun: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`rounded-lg border bg-brand-panelAlt p-2.5 space-y-2 transition-all hover:border-brand-borderStrong ${
        task.enabled
          ? 'border-brand-border'
          : 'border-brand-border opacity-60'
      }`}
    >
      {/* Başlık + durum */}
      <div className="flex items-start gap-2">
        <div
          className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
            task.enabled
              ? 'bg-brand-success/15 text-brand-success'
              : 'bg-brand-panelAlt text-brand-mutedSoft'
          }`}
        >
          <Icon
            name={task.enabled ? 'play_arrow' : 'pause'}
            size={15}
            weight={600}
            filled
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] font-semibold text-brand-text truncate leading-tight">
            {task.name}
          </div>
          <div className="text-[10px] text-brand-mutedSoft mt-0.5 flex items-center gap-1">
            <Icon name="smart_toy" size={10} weight={500} />
            <span className="truncate">{agentName}</span>
            <span className="text-brand-border">·</span>
            <span
              className={`font-semibold ${
                task.enabled ? 'text-brand-success' : 'text-brand-mutedSoft'
              }`}
            >
              {task.enabled ? 'aktif' : 'duraklatıldı'}
            </span>
          </div>
        </div>
      </div>

      {/* Cron rozet */}
      <div className="rounded-md bg-brand-bg border border-brand-border px-2 py-1.5">
        <div className="flex items-center gap-1.5">
          <Icon
            name="schedule"
            size={11}
            weight={500}
            className="text-brand-accent"
          />
          <code className="text-[11px] font-mono text-brand-text tracking-wide">
            {task.cron_expr}
          </code>
        </div>
        <div className="text-[10px] text-brand-mutedSoft mt-0.5 ml-4">
          {describeCron(task.cron_expr)}
        </div>
      </div>

      {/* Prompt önizleme */}
      <div className="text-[11px] text-brand-textSoft line-clamp-2 leading-snug px-0.5">
        {task.prompt}
      </div>

      {/* Son çalışma */}
      {task.last_run_at && (
        <div className="text-[10px] text-brand-mutedSoft flex items-center gap-1">
          <Icon name="history" size={11} weight={500} />
          <span>Son:</span>
          <span className="font-mono">
            {new Date(task.last_run_at).toLocaleString('tr-TR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit'})}
          </span>
        </div>
      )}
      {task.last_result && (
        <div className="text-[10px] text-brand-mutedSoft italic line-clamp-2 px-2 py-1 border-l-2 border-brand-accent/40 bg-brand-bg/40 rounded-r">
          “{task.last_result}”
        </div>
      )}

      {/* Aksiyonlar */}
      <div className="flex gap-1 pt-0.5">
        <button
          onClick={onRun}
          disabled={running}
          title="Şimdi çalıştır"
          className="flex-1 h-7 inline-flex items-center justify-center gap-1 text-[10.5px] font-semibold rounded-md bg-brand-accent text-brand-bg hover:bg-brand-accentDim disabled:opacity-40 transition-all active:scale-95"
        >
          {running ? (
            <Icon
              name="progress_activity"
              size={11}
              className="animate-spin-slow"
            />
          ) : (
            <Icon name="play_arrow" size={12} weight={650} filled />
          )}
          {running ? 'Çalışıyor' : 'Çalıştır'}
        </button>
        <button
          onClick={onToggle}
          title={task.enabled ? 'Duraklat' : 'Etkinleştir'}
          className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-brand-border text-brand-textSoft hover:text-brand-text hover:bg-brand-panel transition-all active:scale-95"
        >
          <Icon
            name={task.enabled ? 'pause' : 'play_arrow'}
            size={13}
            weight={550}
            filled
          />
        </button>
        <button
          onClick={onDelete}
          title="Sil"
          className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-brand-danger/30 text-brand-danger hover:bg-brand-danger/10 transition-all active:scale-95"
        >
          <Icon name="delete" size={13} weight={550} />
        </button>
      </div>
    </div>
  );
}

/**
 * Log satırı — kurumsal tek satır + opsiyonel JSON detay (Datadog/Vercel tarzı).
 *   ● 14:32:05  ERR  agent_loop_error                 sd          ⌄
 */
function LogCard({ log }: { log: LogEntry }) {
  const [open, setOpen] = useState(false);

  const cfg: Record<string, { dot: string; text: string; label: string }> = {
    error: { dot: 'bg-brand-danger', text: 'text-brand-danger', label: 'ERR' },
    warning: { dot: 'bg-yellow-500', text: 'text-yellow-500', label: 'WRN' },
    info: { dot: 'bg-brand-mutedSoft', text: 'text-brand-mutedSoft', label: 'INF' },
    debug: { dot: 'bg-brand-mutedSoft/60', text: 'text-brand-mutedSoft', label: 'DBG' }};
  const c = cfg[log.level] ?? cfg.info;

  const time = new Date(log.created_at).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'});
  const fullDate = new Date(log.created_at).toLocaleString('tr-TR');

  let parsedPayload: Record<string, unknown> | null = null;
  try {
    if (log.payload_json) parsedPayload = JSON.parse(log.payload_json);
  } catch {
    /* ignore */
  }
  const hasPayload = parsedPayload && Object.keys(parsedPayload).length > 0;

  return (
    <div
      className={`group transition-colors ${
        open ? 'bg-brand-panelAlt/40' : 'hover:bg-brand-panelAlt/60'
      }`}
    >
      <button
        type="button"
        onClick={() => hasPayload && setOpen((v) => !v)}
        disabled={!hasPayload}
        className="w-full flex items-center gap-2 px-2 py-1.5 text-left disabled:cursor-default"
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${c.dot} flex-shrink-0`}
          title={log.level}
        />
        <span
          className="text-[10px] font-mono tabular-nums text-brand-mutedSoft flex-shrink-0"
          title={fullDate}
        >
          {time}
        </span>
        <span
          className={`text-[9px] font-mono font-bold uppercase tracking-wider w-7 flex-shrink-0 ${c.text}`}
        >
          {c.label}
        </span>
        <span className="flex-1 text-[11px] text-brand-text truncate min-w-0">
          {log.event}
        </span>
        {log.agent_id && (
          <code className="text-[9.5px] font-mono text-brand-mutedSoft flex-shrink-0 truncate max-w-[80px]">
            {log.agent_id}
          </code>
        )}
        {hasPayload && (
          <Icon
            name={open ? 'expand_less' : 'expand_more'}
            size={12}
            weight={500}
            className="text-brand-mutedSoft flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          />
        )}
      </button>
      {open && hasPayload && (
        <div className="px-2 pb-2 pl-7 animate-fade-in-up">
          <pre className="text-[10px] font-mono text-brand-textSoft bg-brand-bg/60 border border-brand-border rounded-md px-2 py-1.5 overflow-x-auto whitespace-pre-wrap break-words max-h-40">
            {JSON.stringify(parsedPayload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

/**
 * Log seviyesi filtre segmenti — segmentli kapsül grubunda yer alır.
 * Datadog/Linear tarzı: dot + label + sabit genişlik counter.
 */
function FilterSegment({
  active,
  onClick,
  label,
  count,
  dotColor}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  dotColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-7 px-2.5 inline-flex items-center gap-1.5 rounded-md text-[10.5px] font-semibold transition-all active:scale-95 flex-1 min-w-0 justify-center ${
        active
          ? 'bg-brand-accent/15 text-brand-accent shadow-sm'
          : 'text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt'
      }`}
    >
      {dotColor && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColor} flex-shrink-0`}
        />
      )}
      <span className="truncate">{label}</span>
      <span
        className={`text-[9.5px] font-mono tabular-nums font-bold flex-shrink-0 ${
          active ? 'opacity-90' : 'opacity-60'
        }`}
      >
        {count}
      </span>
    </button>
  );
}

/** Loglari filtreli + aranabilir liste halinde gosterir. */
function LogList({ logs }: { logs: LogEntry[] }) {
  const [levelFilter, setLevelFilter] = useState<
    'all' | 'error' | 'warning' | 'info' | 'debug'
  >('all');
  const [search, setSearch] = useState('');

  const counts = {
    error: logs.filter((l) => l.level === 'error').length,
    warning: logs.filter((l) => l.level === 'warning').length,
    info: logs.filter((l) => l.level === 'info').length,
    debug: logs.filter((l) => l.level === 'debug').length};

  const filtered = logs.filter((l) => {
    if (levelFilter !== 'all' && l.level !== levelFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matches =
        l.event?.toLowerCase().includes(q) ||
        l.agent_id?.toLowerCase().includes(q) ||
        l.payload_json?.toLowerCase().includes(q);
      if (!matches) return false;
    }
    return true;
  });

  // Sadece sayisi >0 olan seviyeleri filtre olarak goster
  const segments: Array<{
    key: typeof levelFilter;
    label: string;
    count: number;
    dot?: string;
  }> = [
    { key: 'all', label: 'Tümü', count: logs.length },
    ...(counts.error > 0
      ? ([{ key: 'error', label: 'Hata', count: counts.error, dot: 'bg-brand-danger' }] as const)
      : []),
    ...(counts.warning > 0
      ? ([{ key: 'warning', label: 'Uyarı', count: counts.warning, dot: 'bg-yellow-500' }] as const)
      : []),
    ...(counts.info > 0
      ? ([{ key: 'info', label: 'Info', count: counts.info, dot: 'bg-brand-mutedSoft' }] as const)
      : []),
    ...(counts.debug > 0
      ? ([{ key: 'debug', label: 'Debug', count: counts.debug, dot: 'bg-brand-mutedSoft/60' }] as const)
      : [])];

  return (
    <div className="space-y-2">
      {/* Segmentli filtre kapsülü — Header.tsx aksiyon grubu tarzı */}
      <div className="flex items-center bg-brand-bg/40 border border-brand-border rounded-lg p-0.5 gap-0.5">
        {segments.map((s) => (
          <FilterSegment
            key={s.key}
            active={levelFilter === s.key}
            onClick={() => setLevelFilter(s.key)}
            label={s.label}
            count={s.count}
            dotColor={s.dot}
          />
        ))}
      </div>

      {/* Arama (sadece 5+ log varsa) */}
      {logs.length > 5 && (
        <div className="relative">
          <Icon
            name="search"
            size={12}
            weight={500}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-brand-mutedSoft pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Log ara..."
            className="w-full h-7 bg-brand-bg border border-brand-border rounded-md pl-7 pr-2 text-[11px] text-brand-text placeholder:text-brand-mutedSoft focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/20 transition-all"
          />
        </div>
      )}

      {/* Liste container */}
      <div className="rounded-md border border-brand-border bg-brand-panel/40 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center text-[11px] text-brand-mutedSoft py-6">
            Eşleşen log yok
          </div>
        ) : (
          <div className="divide-y divide-brand-border/40">
            {filtered.map((l) => (
              <LogCard key={l.id} log={l} />
            ))}
          </div>
        )}
      </div>

      {/* Alt sayaç */}
      {filtered.length > 0 && (
        <div className="text-[9.5px] text-brand-mutedSoft text-center font-mono tabular-nums">
          {filtered.length}
          {filtered.length !== logs.length && <span> / {logs.length}</span>}{' '}
          kayıt
        </div>
      )}
    </div>
  );
}

// ---- Yeni görev formu ----

const CRON_PRESETS: { label: string; expr: string; icon: string }[] = [
  { label: 'Her dakika', expr: '* * * * *', icon: 'timer' },
  { label: 'Saat başı', expr: '0 * * * *', icon: 'schedule' },
  { label: 'Sabah 09:00', expr: '0 9 * * *', icon: 'wb_sunny' },
  { label: 'Akşam 21:00', expr: '0 21 * * *', icon: 'dark_mode' },
  { label: 'Pzt 08:30', expr: '30 8 * * 1', icon: 'event' },
  { label: 'Ay başı', expr: '0 0 1 * *', icon: 'calendar_month' }];

function NewTaskForm({
  agents,
  defaultAgentId,
  onCreate,
  onCancel}: {
  agents: AgentInfo[];
  defaultAgentId: string | null;
  onCreate: (payload: ScheduledTaskCreate) => void;
  onCancel: () => void;
}) {
  const [agentId, setAgentId] = useState(defaultAgentId ?? agents[0]?.id ?? '');
  const [name, setName] = useState('');
  const [cron, setCron] = useState('0 9 * * *');
  const [prompt, setPrompt] = useState('');

  const canSubmit = agentId && name.trim() && cron.trim() && prompt.trim();

  const submit = () => {
    if (!canSubmit) return;
    onCreate({
      agent_id: agentId,
      name: name.trim(),
      cron_expr: cron.trim(),
      prompt: prompt.trim(),
      enabled: true});
  };

  return (
    <div className="rounded-lg border border-brand-accent/40 bg-brand-panelAlt p-3 space-y-2.5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] uppercase tracking-wider text-brand-accent font-bold inline-flex items-center gap-1.5">
          <Icon name="add_task" size={13} weight={600} filled />
          Yeni Görev
        </h4>
        <button
          type="button"
          onClick={onCancel}
          className="w-6 h-6 rounded-md flex items-center justify-center text-brand-muted hover:text-brand-text hover:bg-brand-bg/40 transition-all"
          title="İptal"
          aria-label="İptal"
        >
          <Icon name="close" size={14} weight={500} />
        </button>
      </div>

      <Field label="Ajan" icon="smart_toy">
        <select
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
          className="w-full bg-brand-bg border border-brand-border rounded-md px-2 py-1.5 text-xs text-brand-text focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all"
        >
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.provider}/{a.model})
            </option>
          ))}
        </select>
      </Field>

      <Field label="Görev Adı" icon="label">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="örn. Günlük özet"
          className="w-full bg-brand-bg border border-brand-border rounded-md px-2 py-1.5 text-xs text-brand-text placeholder:text-brand-mutedSoft focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all"
        />
      </Field>

      <Field label="Cron İfadesi" icon="schedule">
        <input
          value={cron}
          onChange={(e) => setCron(e.target.value)}
          placeholder="0 9 * * *"
          className="w-full bg-brand-bg border border-brand-border rounded-md px-2 py-1.5 text-xs font-mono text-brand-text placeholder:text-brand-mutedSoft focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all"
        />
        <div className="text-[10px] text-brand-mutedSoft mt-1 italic">
          {describeCron(cron)}
        </div>
        <div className="grid grid-cols-2 gap-1 mt-1.5">
          {CRON_PRESETS.map((p) => (
            <button
              key={p.expr}
              type="button"
              onClick={() => setCron(p.expr)}
              className={`text-[10px] px-1.5 py-1 rounded-md border transition-all inline-flex items-center gap-1 ${
                cron === p.expr
                  ? 'border-brand-accent bg-brand-accent/10 text-brand-accent'
                  : 'border-brand-border text-brand-mutedSoft hover:text-brand-text hover:border-brand-borderStrong'
              }`}
            >
              <Icon name={p.icon} size={10} weight={500} />
              <span className="truncate">{p.label}</span>
            </button>
          ))}
        </div>
      </Field>

      <Field label="Prompt" icon="chat">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ajanın yapacağı görev..."
          rows={3}
          className="w-full bg-brand-bg border border-brand-border rounded-md px-2 py-1.5 text-xs text-brand-text placeholder:text-brand-mutedSoft focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all resize-none"
        />
      </Field>

      <div className="flex gap-2 pt-1">
        <button
          onClick={submit}
          disabled={!canSubmit}
          className="flex-1 h-8 inline-flex items-center justify-center gap-1.5 text-xs font-semibold rounded-md bg-brand-accent text-brand-bg hover:bg-brand-accentDim disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
        >
          <Icon name="check" size={14} weight={650} />
          Oluştur
        </button>
        <button
          onClick={onCancel}
          className="h-8 px-3 inline-flex items-center justify-center gap-1.5 text-xs font-semibold rounded-md border border-brand-border text-brand-textSoft hover:text-brand-text hover:bg-brand-bg/40 transition-all active:scale-95"
        >
          İptal
        </button>
      </div>
    </div>
  );
}

/** Form alanı: ikon + etiket + içerik */
function Field({
  label,
  icon,
  children}: {
  label: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[10px] text-brand-mutedSoft uppercase tracking-wider font-bold inline-flex items-center gap-1">
        <Icon name={icon} size={10} weight={500} />
        {label}
      </span>
      {children}
    </label>
  );
}