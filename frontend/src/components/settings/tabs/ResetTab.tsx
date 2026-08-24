import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../Icon';
import { PanelHeader } from '../shared/PanelHeader';

export function ResetTab({ onRequestReset }: { onRequestReset: () => void }) {
  const impacts = [
    'Tüm sohbet geçmişi ve mesaj kayıtları',
    'Özel oluşturulan ajanlar ve API anahtarları',
    'Zamanlanmış görevler ve iş akışları',
    'Vektör hafıza, bilgi grafiği ve sistem günlükleri',
    'Uygulama ilk kurulum sihirbazı durumuna döner'
  ];

  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const HOLD_DURATION = 1500; // 1.5 saniye akıcı süre

  const startHold = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsHolding(true);
    startTimeRef.current = performance.now();

    const update = (now: number) => {
      if (!startTimeRef.current) return;
      const elapsed = now - startTimeRef.current;
      const pct = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setProgress(pct);

      if (pct < 100) {
        animRef.current = requestAnimationFrame(update);
      } else {
        // 100% doldu
        startTimeRef.current = null;
        setIsHolding(false);
        setProgress(0);
        onRequestReset();
      }
    };

    animRef.current = requestAnimationFrame(update);
  };

  const cancelHold = () => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    startTimeRef.current = null;
    setIsHolding(false);
    setProgress(0);
  };

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div className="space-y-6 max-w-xl">
      <PanelHeader
        title="Fabrika Ayarlarına Sıfırla"
        description="Argus veritabanını ve yerel yapılandırmayı tamamen temizleyin."
        icon="restart_alt"
      />

      <div className="space-y-4 pt-1">
        <p className="text-xs text-brand-textSoft leading-relaxed">
          Sıfırlama işlemi gerçekleştirdiğinizde aşağıdaki tüm veriler cihazınızdan kalıcı olarak silinir ve geri alınamaz:
        </p>

        <ul className="space-y-2 text-xs text-brand-mutedSoft pl-1">
          {impacts.map((item, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-mutedSoft/60 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="pt-3 flex flex-col gap-2.5">
          {/* Kompakt, çerçevesiz, anında kırmızı dolan modern buton */}
          <div>
            <button
              type="button"
              onMouseDown={startHold}
              onMouseUp={cancelHold}
              onMouseLeave={cancelHold}
              onTouchStart={startHold}
              onTouchEnd={cancelHold}
              onContextMenu={(e) => e.preventDefault()}
              className="relative inline-flex items-center justify-center h-9 px-5 rounded-lg overflow-hidden bg-brand-panelAlt text-brand-danger select-none cursor-pointer active:scale-[0.98] transition-transform shadow-sm"
            >
              {/* Kırmızı dolum katmanı */}
              <div
                className="absolute inset-y-0 left-0 bg-red-500 pointer-events-none"
                style={{
                  width: `${progress}%`,
                  transition: isHolding ? 'none' : 'width 0.2s ease-out',
                }}
              />

              {/* Buton içeriği */}
              <div className="relative z-10 flex items-center gap-2">
                <Icon
                  name={progress >= 100 ? 'check' : 'delete_forever'}
                  size={16}
                  className={`transition-colors duration-150 ${
                    progress > 45 ? 'text-white' : 'text-brand-danger'
                  } ${isHolding ? 'animate-pulse' : ''}`}
                />
                <span
                  className={`text-xs font-semibold whitespace-nowrap transition-colors duration-150 ${
                    progress > 45 ? 'text-white font-bold' : 'text-brand-danger'
                  }`}
                >
                  {isHolding
                    ? `Bırakma... %${Math.round(progress)}`
                    : 'Basılı Tut: Sistemi Sıfırla'}
                </span>
              </div>
            </button>
          </div>

          <p className="text-[11px] text-brand-mutedSoft leading-normal">
            Kazara silinmeleri önlemek için butona basılı tutunuz. Bıraktığınızda işlem anında iptal edilir.
          </p>
        </div>
      </div>
    </div>
  );
}
