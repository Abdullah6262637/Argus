// TaskTimeline: Kurumsal plan göstergesi
//
// Tasarım felsefesi:
// - Sade, az renkli, kurumsal (Linear / Vercel / Stripe tarzı)
// - Tek satır özet: durum + progress + meta
// - Collapsed: minimal numara dizisi
// - Expanded: temiz dikey liste, ikon + başlık + opsiyonel detay

import { useState } from 'react';
import type { Plan, PlanStep, StepStatus } from '@/types';
import { Icon } from './Icon';

interface TaskTimelineProps {
  plan: Plan | null;
}

const STATUS_CONFIG: Record<
  StepStatus,
  { icon: string; color: string; bg: string; border: string; animated?: boolean }
> = {
  pending: {
    icon: 'radio_button_unchecked',
    color: 'text-brand-mutedSoft',
    bg: 'bg-transparent',
    border: 'border-brand-border'},
  running: {
    icon: 'progress_activity',
    color: 'text-brand-accent',
    bg: 'bg-brand-accent/10',
    border: 'border-brand-accent/40',
    animated: true},
  completed: {
    icon: 'check_circle',
    color: 'text-brand-success',
    bg: 'bg-brand-success/10',
    border: 'border-brand-success/30'},
  failed: {
    icon: 'cancel',
    color: 'text-brand-danger',
    bg: 'bg-brand-danger/10',
    border: 'border-brand-danger/30'},
  skipped: {
    icon: 'remove',
    color: 'text-brand-mutedSoft',
    bg: 'bg-transparent',
    border: 'border-brand-border'},
  awaiting_approval: {
    icon: 'pause_circle',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30'}};

/**
 * Tek satır step — kurumsal liste tarzı.
 * Sol: küçük ikon + numara · Orta: başlık · Sağ: meta
 */
function StepRow({ step }: { step: PlanStep }) {
  const cfg = STATUS_CONFIG[step.status] || STATUS_CONFIG.pending;
  const isActive = step.status === 'running';

  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-2 transition-colors ${
        isActive ? 'bg-brand-accent/5' : 'hover:bg-brand-panelAlt/50'
      }`}
    >
      {/* Sol: durum ikonu */}
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg} ${cfg.color}`}
      >
        <Icon
          name={cfg.icon}
          size={13}
          weight={550}
          filled={step.status !== 'pending' && step.status !== 'skipped'}
          className={cfg.animated ? 'animate-spin-slow' : ''}
        />
      </div>

      {/* Numara */}
      <span
        className={`text-[10px] font-mono font-semibold tabular-nums w-5 text-right ${cfg.color}`}
      >
        {String(step.id).padStart(2, '0')}
      </span>

      {/* Başlık + opsiyonel meta */}
      <div className="flex-1 min-w-0">
        <div
          className={`text-[12px] truncate leading-tight ${
            isActive
              ? 'text-brand-text font-semibold'
              : step.status === 'pending'
                ? 'text-brand-mutedSoft'
                : 'text-brand-text font-medium'
          }`}
        >
          {step.title}
        </div>
      </div>

      {/* Sağ rozetler — sadece anlamlı olanlar */}
      <div className="flex items-center gap-2 flex-shrink-0 text-[10px] text-brand-mutedSoft font-mono tabular-nums">
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
          <span title="Tool çağrısı sayısı">
            {step.tool_calls.length} araç
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Expanded mode için detaylı kart — başlık altında description/error/reflection.
 */
function StepDetail({ step }: { step: PlanStep }) {
  const cfg = STATUS_CONFIG[step.status] || STATUS_CONFIG.pending;

  const hasDetails =
    (step.description && step.description !== step.title) ||
    step.error ||
    step.reflection ||
    (step.status === 'completed' && step.result);

  return (
    <div
      className={`border-l-2 ${cfg.border.replace('border-', 'border-l-')} pl-3`}
    >
      <StepRow step={step} />
      {hasDetails && (
        <div className="px-3 pb-2 space-y-1.5 -mt-1">
          {step.description && step.description !== step.title && step.status !== 'pending' && (
            <div className="text-[10.5px] text-brand-mutedSoft leading-relaxed line-clamp-2">
              {step.description}
            </div>
          )}
          {step.status === 'completed' && step.result && (
            <div className="text-[10.5px] text-brand-textSoft leading-relaxed line-clamp-2">
              {step.result}
            </div>
          )}
          {step.error && (
            <div className="flex items-start gap-1 text-[10.5px] text-brand-danger">
              <Icon
                name="error"
                size={11}
                weight={500}
                filled
                className="flex-shrink-0 mt-px"
              />
              <span className="leading-relaxed">{step.error}</span>
            </div>
          )}
          {step.reflection && (
            <div className="text-[10px] text-brand-mutedSoft italic leading-relaxed">
              {step.reflection}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TaskTimeline({ plan }: TaskTimelineProps) {
  const [expanded, setExpanded] = useState(false);

  if (!plan) return null;

  const completedCount = plan.steps.filter((s) => s.status === 'completed').length;
  const totalCount = plan.steps.length;
  const failedCount = plan.steps.filter((s) => s.status === 'failed').length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const planStatus: Record<
    string,
    { color: string; bg: string; label: string; dotPulse?: boolean }
  > = {
    completed: {
      color: 'text-brand-success',
      bg: 'bg-brand-success',
      label: 'Tamamlandı'},
    failed: {
      color: 'text-brand-danger',
      bg: 'bg-brand-danger',
      label: 'Başarısız'},
    running: {
      color: 'text-brand-accent',
      bg: 'bg-brand-accent',
      label: 'Çalışıyor',
      dotPulse: true},
    draft: {
      color: 'text-brand-mutedSoft',
      bg: 'bg-brand-mutedSoft',
      label: 'Taslak'}};
  const sc = planStatus[plan.status] || planStatus.draft;

  return (
    <div className="rounded-lg border border-brand-border bg-brand-panel overflow-hidden">
      {/* ============ ÜST: Başlık çubuğu — sade kurumsal ============ */}
      <header className="px-3.5 py-2.5 flex items-center gap-3 border-b border-brand-border">
        {/* Sol: durum noktası + etiket */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="relative flex w-2 h-2">
            {sc.dotPulse && (
              <span
                className={`absolute inline-flex h-full w-full rounded-full ${sc.bg} opacity-60 animate-ping`}
              />
            )}
            <span
              className={`relative inline-flex w-2 h-2 rounded-full ${sc.bg}`}
            />
          </span>
          <span
            className={`text-[10px] uppercase tracking-wider font-bold ${sc.color}`}
          >
            {sc.label}
          </span>
        </div>

        <div className="w-px h-3.5 bg-brand-border flex-shrink-0" />

        {/* Orta: hedef + sayaç */}
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-semibold text-brand-text truncate leading-tight">
            {plan.goal}
          </div>
        </div>

        {/* Sağ: progress sayacı + toggle */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right">
            <div className="text-[11px] font-mono font-semibold text-brand-text tabular-nums leading-none">
              {completedCount}
              <span className="text-brand-mutedSoft">/{totalCount}</span>
            </div>
            {failedCount > 0 && (
              <div className="text-[9px] font-mono text-brand-danger font-semibold tabular-nums leading-none mt-0.5">
                {failedCount} hata
              </div>
            )}
          </div>

          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-6 h-6 rounded flex items-center justify-center text-brand-muted hover:text-brand-text hover:bg-brand-panelAlt transition-colors"
            title={expanded ? 'Daralt' : 'Genişlet'}
            aria-label={expanded ? 'Daralt' : 'Genişlet'}
          >
            <Icon
              name={expanded ? 'expand_less' : 'expand_more'}
              size={16}
              weight={550}
            />
          </button>
        </div>
      </header>

      {/* ============ Progress bar — ince ve sade ============ */}
      <div className="relative h-[2px] bg-brand-border">
        <div
          className={`absolute inset-y-0 left-0 transition-all duration-500 ease-out ${
            plan.status === 'failed' ? 'bg-brand-danger' : 'bg-brand-accent'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ============ İçerik ============ */}
      {!expanded ? (
        // Collapsed: tüm step'ler tek satır liste
        <div className="divide-y divide-brand-border">
          {plan.steps.map((step) => (
            <StepRow key={step.id} step={step} />
          ))}
        </div>
      ) : (
        // Expanded: detaylı liste, her step açıklamalı
        <div className="divide-y divide-brand-border max-h-[360px] overflow-y-auto">
          {plan.steps.map((step) => (
            <StepDetail key={step.id} step={step} />
          ))}
        </div>
      )}
    </div>
  );
}