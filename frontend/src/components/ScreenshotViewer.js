import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// ScreenshotViewer (FAZ 6.2): tool kartinda image preview + lightbox
import { useState } from 'react';
export function ScreenshotViewer({ imageB64, imagePath, alt = 'screenshot' }) {
    const [open, setOpen] = useState(false);
    if (!imageB64 && !imagePath)
        return null;
    const src = imageB64
        ? `data:image/png;base64,${imageB64}`
        : `file://${imagePath}`;
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "inline-block cursor-pointer hover:opacity-80 transition", onClick: () => setOpen(true), children: [_jsx("img", { src: src, alt: alt, className: "max-w-[200px] max-h-[150px] rounded border border-brand-border" }), imagePath && (_jsx("div", { className: "text-[10px] text-brand-mutedSoft mt-1 truncate max-w-[200px]", children: imagePath.split(/[\\/]/).pop() }))] }), open && (_jsxs("div", { className: "fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-zoom-out animate-backdrop-in", onClick: () => setOpen(false), children: [_jsx("img", { src: src, alt: alt, className: "max-w-full max-h-full object-contain rounded shadow-2xl animate-modal-in", onClick: (e) => e.stopPropagation() }), _jsx("button", { className: "absolute top-4 right-4 text-white bg-black/40 hover:bg-black/60 rounded-full w-10 h-10 flex items-center justify-center", onClick: () => setOpen(false), children: "\u2715" })] }))] }));
}
