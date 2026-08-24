import { Icon } from './Icon';
import type { ToolCallInfo, Plan } from '@/types';

interface ThinkingIndicatorProps {
  liveToolCalls: ToolCallInfo[];
  plan?: Plan | null;
}

export function ThinkingIndicator({ liveToolCalls, plan }: ThinkingIndicatorProps) {
  return (
    <div className="flex justify-start py-2 animate-fade-in-up">
      <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-brand-panelAlt/35 backdrop-blur-md select-none transition-all duration-300">
        {/* Minimalist Sparkle Luminous Icon */}
        <div className="relative flex items-center justify-center w-4 h-4 text-brand-accent">
          <Icon
            name="auto_awesome"
            size={13}
            weight={500}
            className="animate-spark-breathe"
          />
        </div>

        {/* Dinamik Düşünce / Durum Başlığı */}
        <span className="text-[12px] font-medium tracking-normal text-brand-textSoft animate-pulse-subtle">
          {liveToolCalls.some((tc) => !tc.output && !tc.error)
            ? 'Araç çalıştırılıyor...'
            : plan?.steps.find((s) => s.status === 'running')?.title
              ? plan.steps.find((s) => s.status === 'running')!.title
              : 'Düşünüyor...'}
        </span>

        {/* 3 Mikro Nefes Noktası */}
        <div className="flex items-center gap-1 ml-0.5">
          <span className="w-1 h-1 rounded-full bg-brand-accent animate-thinking-dot-1" />
          <span className="w-1 h-1 rounded-full bg-brand-accent animate-thinking-dot-2" />
          <span className="w-1 h-1 rounded-full bg-brand-accent animate-thinking-dot-3" />
        </div>
      </div>
    </div>
  );
}
