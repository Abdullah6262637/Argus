import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
const BOOT_STEPS = [
    { icon: 'database', text: 'Veritabanı bağlantısı kuruluyor...' },
    { icon: 'smart_toy', text: 'Ajan profilleri yükleniyor...' },
    { icon: 'hub', text: 'Servisler başlatılıyor...' },
    { icon: 'check_circle', text: 'Sistem hazır!' },
];
export function SplashScreen({ onDone }) {
    const [phase, setPhase] = useState('enter');
    const [stepIdx, setStepIdx] = useState(-1);
    const [progress, setProgress] = useState(0);
    const [exiting, setExiting] = useState(false);
    useEffect(() => {
        const t0 = setTimeout(() => setPhase('boot'), 400);
        return () => clearTimeout(t0);
    }, []);
    useEffect(() => {
        if (phase !== 'boot')
            return;
        // Each step is spaced ~1-1.5 seconds apart so they're clearly readable
        const delays = [500, 1700, 3100, 4500];
        const timers = delays.map((d, i) => setTimeout(() => {
            setStepIdx(i);
            setProgress(Math.round(((i + 1) / BOOT_STEPS.length) * 100));
        }, d));
        const exitTimer = setTimeout(() => {
            setPhase('done');
            setExiting(true);
            setTimeout(onDone, 700);
        }, 6200);
        return () => {
            timers.forEach(clearTimeout);
            clearTimeout(exitTimer);
        };
    }, [phase, onDone]);
    return (_jsx("div", { className: `
        fixed inset-0 z-[9999] flex flex-col items-center justify-center
        bg-brand-bg transition-opacity duration-700
        ${exiting ? 'opacity-0 pointer-events-none' : 'opacity-100'}
      `, children: _jsxs("div", { className: `
          flex flex-col items-center gap-8
          transition-all duration-500
          ${phase === 'enter' ? 'opacity-0 translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100'}
        `, children: [_jsxs("div", { className: "flex flex-col items-center gap-4", children: [_jsx("img", { src: "/logo.png", alt: "Argus", className: "w-20 h-20 object-contain" }), _jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-2xl font-bold tracking-tight text-brand-text", children: "Argus" }), _jsx("p", { className: "text-xs text-brand-mutedSoft mt-1", children: "Ayn\u0131 anda her \u015Feyi g\u00F6ren \u00E7oklu ajan sistemi" })] })] }), _jsxs("div", { className: "w-64 flex flex-col gap-2", children: [_jsx("div", { className: "h-0.5 w-full rounded-full bg-brand-panelAlt overflow-hidden", children: _jsx("div", { className: "h-full rounded-full bg-brand-accent transition-all duration-500 ease-out", style: { width: `${progress}%` } }) }), _jsxs("span", { className: "text-[10px] text-brand-mutedSoft tabular-nums", children: [progress, "%"] })] }), _jsx("div", { className: "w-64 space-y-2", children: BOOT_STEPS.map((s, i) => {
                        const isActive = stepIdx === i;
                        const isCompleted = stepIdx > i;
                        const isPending = stepIdx < i;
                        return (_jsxs("div", { className: `
                  flex items-center gap-2.5 text-xs transition-all duration-400
                  ${isCompleted ? 'text-brand-success/80' : isActive ? 'text-brand-text font-medium' : 'text-brand-mutedSoft/40'}
                `, children: [isCompleted && (_jsx("span", { className: "material-symbols-rounded text-brand-success", style: { fontSize: 14, fontVariationSettings: "'FILL' 1" }, children: "check_circle" })), isActive && (_jsx("span", { className: "material-symbols-rounded text-brand-accent animate-spin", style: { fontSize: 14 }, children: "progress_activity" })), isPending && (_jsx("span", { className: "material-symbols-rounded opacity-30", style: { fontSize: 14 }, children: s.icon })), _jsx("span", { children: s.text })] }, i));
                    }) })] }) }));
}
