import { useEffect, useState } from 'react';

interface ResetScreenProps {
  onDone: () => void;
}

const RESET_STEPS = [
  { text: 'Tüm sohbet mesajları siliniyor...',    duration: 900 },
  { text: 'Ajan profilleri temizleniyor...',        duration: 800 },
  { text: 'Zamanlanmış görevler kaldırılıyor...',  duration: 700 },
  { text: 'Loglar ve önbellekler temizleniyor...', duration: 800 },
  { text: 'Veritabanı sıfırlanıyor...',            duration: 700 },
  { text: 'Sistem yeniden başlatılıyor...',        duration: 600 },
];

export function ResetScreen({ onDone }: ResetScreenProps) {
  const [stepIdx, setStepIdx]     = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);
  const [exiting, setExiting]     = useState(false);
  const [progress, setProgress]   = useState(0);

  useEffect(() => {
    let current = 0;
    let elapsed = 0;
    const total = RESET_STEPS.reduce((acc, s) => acc + s.duration, 0) + 500;

    const advance = () => {
      if (current >= RESET_STEPS.length) return;
      setCompleted(prev => [...prev, current]);
      current++;
      setStepIdx(current);
      elapsed += RESET_STEPS[current - 1]?.duration ?? 0;
      setProgress(Math.round((elapsed / total) * 100));

      if (current < RESET_STEPS.length) {
        setTimeout(advance, RESET_STEPS[current].duration);
      } else {
        setProgress(100);
        setTimeout(() => {
          setExiting(true);
          setTimeout(onDone, 600);
        }, 600);
      }
    };

    const startTimer = setTimeout(advance, RESET_STEPS[0].duration);
    return () => clearTimeout(startTimer);
  }, [onDone]);

  return (
    <div
      className={`
        fixed inset-0 z-[9999] flex flex-col items-center justify-center
        bg-brand-bg transition-opacity duration-600
        ${exiting ? 'opacity-0 pointer-events-none' : 'opacity-100'}
      `}
    >
      <div className="flex flex-col items-center gap-8 w-80">
        {/* Logo + title */}
        <div className="flex flex-col items-center gap-4">
          <img
            src="/logo.png"
            alt="Argus"
            className="w-16 h-16 object-contain opacity-60"
          />
          <div className="text-center">
            <h2 className="text-base font-bold text-brand-text">Sistem Sıfırlanıyor</h2>
            <p className="text-[11px] text-brand-mutedSoft mt-0.5">
              Lütfen bekleyin, veriler siliniyor...
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full flex flex-col gap-2">
          <div className="h-0.5 w-full rounded-full bg-brand-panelAlt overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-danger transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] text-brand-mutedSoft tabular-nums text-right">
            {progress}%
          </span>
        </div>

        {/* Step list */}
        <div className="w-full space-y-2.5">
          {RESET_STEPS.map((s, i) => {
            const isActive  = stepIdx === i;
            const isDone    = completed.includes(i);
            const isPending = !isActive && !isDone;

            return (
              <div
                key={i}
                className={`
                  flex items-center gap-2.5 text-xs transition-all duration-400
                  ${isDone    ? 'text-brand-danger/60'      : ''}
                  ${isActive  ? 'text-brand-text font-medium' : ''}
                  ${isPending ? 'text-brand-mutedSoft/30'   : ''}
                `}
              >
                {isDone && (
                  <span className="material-symbols-rounded text-brand-danger/60"
                    style={{ fontSize: 13, fontVariationSettings: "'FILL' 1" }}>
                    check
                  </span>
                )}
                {isActive && (
                  <span
                    className="material-symbols-rounded text-brand-danger animate-spin"
                    style={{ fontSize: 13 }}>
                    progress_activity
                  </span>
                )}
                {isPending && (
                  <span className="w-3 h-3 rounded-full border border-brand-border/30 flex-shrink-0" />
                )}
                <span className={isDone ? 'line-through opacity-50' : ''}>{s.text}</span>
              </div>
            );
          })}
        </div>

        {/* Warning footer */}
        <p className="text-[10px] text-brand-mutedSoft/50 text-center border-t border-brand-border/20 pt-4 w-full">
          Bu işlem geri alınamaz. Lütfen uygulamayı kapatmayın.
        </p>
      </div>
    </div>
  );
}
