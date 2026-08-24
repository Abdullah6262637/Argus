// TaskTimeline: Minimalist, Çerçevesiz & Modern Düşünce / Görev Adımları Paneli
//
// Tasarım felsefesi:
// - Mesaj akışına gömülü (inline), ekranı kaplamayan kompakt boyut
// - Tamamlandığında otomatik daralan, tıklanınca akıcı animasyonla açılan akıllı kart
// - Çizgisiz, çerçevesiz, modern cam efekti (frosted glass) ve mikro-etkileşimler

import { useState, useEffect } from 'react';
import type { Plan, PlanStep, StepStatus } from '@/types';
import { Icon } from './Icon';

interface TaskTimelineProps {
  plan: Plan | null;
  defaultExpanded?: boolean;
}

const STATUS_CONFIG: Record<
  StepStatus,
  { icon: string; color: string; bg: string; animated?: boolean }
> = {
  pending: {
    icon: 'circle',
    color: 'text-brand-mutedSoft/40',
    bg: 'bg-brand-panelAlt/40',
  },
  running: {
    icon: 'progress_activity',
    color: 'text-brand-accent',
    bg: 'bg-brand-accent/15',
    animated: true,
  },
  completed: {
    icon: 'check',
    color: 'text-brand-success',
    bg: 'bg-brand-success/15',
  },
  failed: {
    icon: 'close',
    color: 'text-brand-danger',
    bg: 'bg-brand-danger/15',
  },
  skipped: {
    icon: 'remove',
    color: 'text-brand-mutedSoft/30',
    bg: 'bg-transparent',
  },
  awaiting_approval: {
    icon: 'pause',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/15',
  },
};

/**
 * Tek satır step — Çerçevesiz, minimalist liste öğesi.
 */
function StepRow({ step }: { step: PlanStep }) {
  const cfg = STATUS_CONFIG[step.status] || STATUS_CONFIG.pending;
  const isActive = step.status === 'running';

  return (
    <div
      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl transition-all duration-200 ${
        isActive ? 'bg-brand-accent/8' : 'hover:bg-brand-panelAlt/50'
      }`}
    >
      {/* Sol: durum ikonu */}
      <div
        className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg} ${cfg.color}`}
      >
        <Icon
          name={cfg.icon}
          size={10}
          weight={600}
          className={cfg.animated ? 'animate-spin-slow' : ''}
        />
      </div>

      {/* Numara */}
      <span
        className={`text-[10.5px] font-mono font-medium tabular-nums w-4 text-right ${
          isActive ? 'text-brand-accent' : 'text-brand-mutedSoft'
        }`}
      >
        {String(step.id).padStart(2, '0')}
      </span>

      {/* Başlık */}
      <div className="flex-1 min-w-0">
        <div
          className={`text-[12px] truncate leading-snug ${
            isActive
              ? 'text-brand-text font-semibold'
              : step.status === 'pending'
                ? 'text-brand-mutedSoft'
                : 'text-brand-textSoft font-medium'
          }`}
        >
          {step.title}
        </div>
      </div>

      {/* Sağ rozetler */}
      <div className="flex items-center gap-2 flex-shrink-0 text-[10.5px] text-brand-mutedSoft font-mono tabular-nums">
        {step.attempts && step.attempts > 1 && (
          <span
            className="inline-flex items-center gap-0.5 text-yellow-500"
            title="Yeniden deneme sayısı"
          >
            <Icon name="refresh" size={10} weight={500} />
            {step.attempts}
          </span>
        )}
        {step.tool_calls && step.tool_calls.length > 0 && (
          <span className="text-[9.5px] px-1.5 py-0.5 rounded-md bg-brand-panelAlt text-brand-mutedSoft font-mono">
            {step.tool_calls.length} araç
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Expanded mode için detaylı kart.
 */
function StepDetail({ step }: { step: PlanStep }) {
  const hasDetails =
    (step.description && step.description !== step.title) ||
    step.error ||
    step.reflection ||
    (step.status === 'completed' && step.result);

  return (
    <div className="rounded-xl overflow-hidden transition-all duration-200">
      <StepRow step={step} />
      {hasDetails && (
        <div className="px-3 pb-2 pt-0.5 ml-6 space-y-1">
          {step.description && step.description !== step.title && step.status !== 'pending' && (
            <div className="text-[11px] text-brand-mutedSoft leading-relaxed">
              {step.description}
            </div>
          )}
          {step.status === 'completed' && step.result && (
            <div className="text-[11px] text-brand-textSoft leading-relaxed">
              {step.result}
            </div>
          )}
          {step.error && (
            <div className="flex items-start gap-1 text-[11px] text-brand-danger">
              <Icon
                name="error"
                size={12}
                weight={500}
                filled
                className="flex-shrink-0 mt-0.5"
              />
              <span className="leading-relaxed">{step.error}</span>
            </div>
          )}
          {step.reflection && (
            <div className="text-[10.5px] text-brand-mutedSoft italic leading-relaxed">
              {step.reflection}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TaskTimeline({ plan, defaultExpanded }: TaskTimelineProps) {
  const isRunning = plan?.status === 'running';
  const [expanded, setExpanded] = useState<boolean>(
    defaultExpanded !== undefined ? defaultExpanded : isRunning
  );

  // Çalışma durumu bittiğinde otomatik daraltma isteğe bağlı
  useEffect(() => {
    if (isRunning) {
      setExpanded(true);
    }
  }, [isRunning]);

  if (!plan || !plan.steps || plan.steps.length === 0) return null;

  const completedCount = plan.steps.filter((s) => s.status === 'completed').length;
  const totalCount = plan.steps.length;
  const failedCount = plan.steps.filter((s) => s.status === 'failed').length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const planStatus: Record<
    string,
    { color: string; bg: string; label: string; icon: string }
  > = {
    completed: {
      color: 'text-brand-success',
      bg: 'bg-brand-success/10',
      label: 'Tamamlandı',
      icon: 'task_alt',
    },
    failed: {
      color: 'text-brand-danger',
      bg: 'bg-brand-danger/10',
      label: 'Başarısız',
      icon: 'error',
    },
    running: {
      color: 'text-brand-accent',
      bg: 'bg-brand-accent/10',
      label: 'Çalışıyor',
      icon: 'auto_awesome',
    },
    draft: {
      color: 'text-brand-mutedSoft',
      bg: 'bg-brand-panelAlt',
      label: 'Taslak',
      icon: 'checklist',
    },
  };
  const sc = planStatus[plan.status] || planStatus.draft;

  // Toplam kullanılan tool sayısı
  const totalTools = plan.steps.reduce(
    (acc, s) => acc + (s.tool_calls?.length || 0),
    0
  );

  return (
    <div className="rounded-2xl bg-brand-panelAlt/30 backdrop-blur-md transition-all duration-300 overflow-hidden select-none hover:bg-brand-panelAlt/40">
      {/* ============ Tıklanabilir Minimal Başlık / Kapsül ============ */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-3 py-2.5 flex items-center gap-2.5 text-left transition-colors group"
      >
        {/* Sol: İkon & Durum */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${sc.bg} ${sc.color}`}
          >
            <Icon
              name={sc.icon}
              size={13}
              weight={500}
              className={isRunning ? 'animate-spark-breathe' : ''}
            />
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase ${sc.bg} ${sc.color}`}
          >
            {sc.label}
          </span>
        </div>

        {/* Orta: Hedef / Özet Başlık */}
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-medium text-brand-text truncate leading-snug">
            {plan.goal || 'Düşünce Süreci ve Görev Adımları'}
          </div>
        </div>

        {/* Sağ: Sayaç & Genişletme Oku */}
        <div className="flex items-center gap-2 flex-shrink-0 text-brand-mutedSoft">
          <div className="text-right flex items-center gap-1.5">
            <span className="text-[11px] font-mono font-medium text-brand-textSoft tabular-nums">
              {completedCount}
              <span className="text-brand-mutedSoft/60">/{totalCount}</span>
            </span>
            {totalTools > 0 && (
              <span className="hidden sm:inline-block text-[10px] text-brand-mutedSoft/80 font-mono">
                · {totalTools} araç
              </span>
            )}
            {failedCount > 0 && (
              <span className="text-[9.5px] font-mono text-brand-danger font-semibold tabular-nums">
                {failedCount} hata
              </span>
            )}
          </div>

          <div
            className={`w-5 h-5 rounded-md flex items-center justify-center text-brand-mutedSoft group-hover:text-brand-text transition-transform duration-300 ${
              expanded ? 'rotate-180 text-brand-text' : 'rotate-0'
            }`}
          >
            <Icon name="expand_more" size={16} weight={500} />
          </div>
        </div>
      </button>

      {/* ============ İnce İlerleme Çubuğu (Genişletildiğinde veya Çalışırken) ============ */}
      {(expanded || isRunning) && (
        <div className="px-3 pb-1">
          <div className="h-[2px] w-full bg-brand-panelAlt/60 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                plan.status === 'failed'
                  ? 'bg-brand-danger'
                  : 'bg-gradient-to-r from-brand-accent to-brand-accent/80'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* ============ Açılabilir Adım Listesi (Akordeon) ============ */}
      {expanded && (
        <div className="px-2.5 pb-2.5 pt-1 space-y-1 animate-accordion-open">
          <div className="max-h-[260px] overflow-y-auto space-y-0.5 pr-1 custom-scrollbar">
            {plan.steps.map((step) => (
              <StepDetail key={step.id} step={step} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}