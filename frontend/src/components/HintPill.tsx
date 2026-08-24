/**
 * Klavye kısayol pill rozeti — composer altındaki yardım için.
 * Birden fazla tuş kombinasyonu desteği, hepsi aynı baseline'da.
 */
export function HintPill({ keys, label }: { keys: string[]; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10.5px] text-brand-mutedSoft">
      <span className="inline-flex items-center gap-1">
        {keys.map((k, i) => (
          <span key={i} className="inline-flex items-center gap-1">
            {i > 0 && (
              <span className="text-[9.5px] text-brand-mutedSoft/60 font-mono font-medium select-none">
                +
              </span>
            )}
            <kbd
              className="inline-flex items-center justify-center min-w-[18px] h-4 px-1.5 rounded-md bg-brand-panelAlt/80 font-mono text-[9.5px] font-semibold text-brand-textSoft select-none"
              style={{ fontStyle: 'normal' }}
            >
              {k}
            </kbd>
          </span>
        ))}
      </span>
      <span className="font-normal text-brand-mutedSoft">{label}</span>
    </span>
  );
}
