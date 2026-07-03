import { useEffect, useState } from 'react';

interface ResetScreenProps {
  onDone: () => void;
}

const RESET_STEPS = [
  { text: 'Tüm sohbet mesajları siliniyor...',    duration: 2200 },
  { text: 'Ajan profilleri temizleniyor...',        duration: 1800 },
  { text: 'Zamanlanmış görevler kaldırılıyor...',  duration: 1600 },
  { text: 'Loglar ve önbellekler temizleniyor...', duration: 1800 },
  { text: 'Veritabanı sıfırlanıyor...',            duration: 2000 },
  { text: 'Sistem yeniden başlatılıyor...',        duration: 1400 },
];

export function ResetScreen({ onDone }: ResetScreenProps) {
  const [stepIdx, setStepIdx]     = useState(0);   // currently active step
  const [completed, setCompleted] = useState<number[]>([]);
  const [exiting, setExiting]     = useState(false);
  const [progress, setProgress]   = useState(0);

  useEffect(() => {
    let current = 0;
    let elapsed = 0;
    const total = RESET_STEPS.reduce((acc, s) => acc + s.duration, 0) + 800;

    // step 0 starts active immediately
    setStepIdx(0);

    const advance = () => {
      // mark the current step as done
      const done = current;
      elapsed += RESET_STEPS[done].duration;
      setCompleted(prev => [...prev, done]);
      setProgress(Math.round((elapsed / total) * 100));
      current++;

      if (current < RESET_STEPS.length) {
        // next step becomes active, wait its duration then advance again
        setStepIdx(current);
        setTimeout(advance, RESET_STEPS[current].duration);
      } else {
        // all done
        setProgress(100);
        setTimeout(() => {
          setExiting(true);
          setTimeout(onDone, 700);
        }, 800);
      }
    };

    // wait the first step's duration before marking it complete
    const startTimer = setTimeout(advance, RESET_STEPS[0].duration);
    return () => clearTimeout(startTimer);
  }, [onDone]);

  return (
    <div
      className={`
        fixed inset-0 z-[9999] flex flex-col items-center justify-center
        bg-brand-bg transition-opacity duration-700
        ${exiting ? 'opacity-0 pointer-events-none' : 'opacity-100'}
      `}
    >
      <div className="flex flex-col items-center gap-8 w-80">
        {/* Logo + title */}
        <div className="flex flex-col items-center gap-4">
          <img
            src="/logo.png"
            alt="Argus"
            className="w-16 h-16 object-contain opacity-50"
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
              className="h-full rounded-full bg-brand-danger transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] text-brand-mutedSoft tabular-nums text-right">
            {progress}%
          </span>
        </div>

        {/* Step list */}
        <div className="w-full space-y-3">
          {RESET_STEPS.map((s, i) => {
            const isActive  = stepIdx === i && !completed.includes(i);
            const isDone    = completed.includes(i);
            const isPending = !isActive && !isDone;

            return (
              <div
                key={i}
                className={`
                  flex items-center gap-2.5 text-xs transition-all duration-500
                  ${isDone    ? 'text-brand-danger/50'       : ''}
                  ${isActive  ? 'text-brand-text font-medium' : ''}
                  ${isPending ? 'text-brand-mutedSoft/25'    : ''}
                `}
              >
                {isDone && (
                  <span
                    className="material-symbols-rounded text-brand-danger/50 flex-shrink-0"
                    style={{ fontSize: 13, fontVariationSettings: "'FILL' 1" }}
                  >
                    check
                  </span>
                )}
                {isActive && (
                  <span
                    className="material-symbols-rounded text-brand-danger animate-spin flex-shrink-0"
                    style={{ fontSize: 13 }}
                  >
                    progress_activity
                  </span>
                )}
                {isPending && (
                  <span className="w-3 h-3 rounded-full border border-brand-border/25 flex-shrink-0" />
                )}
                <span className={isDone ? 'line-through opacity-40' : ''}>{s.text}</span>
              </div>
            );
          })}
        </div>

        {/* Warning footer */}
        <p className="text-[10px] text-brand-mutedSoft/40 text-center border-t border-brand-border/20 pt-4 w-full">
          Bu işlem geri alınamaz. Lütfen uygulamayı kapatmayın.
        </p>
      </div>
    </div>
  );
}
