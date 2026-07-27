import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
export function ContextMenu({ x, y, items, onClose }) {
    const menuRef = useRef(null);
    // Disari tikladiginda kapat
    useEffect(() => {
        const onDoc = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };
        const onEsc = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onEsc);
        return () => {
            document.removeEventListener('mousedown', onDoc);
            document.removeEventListener('keydown', onEsc);
        };
    }, [onClose]);
    // Ekrandan tasmasini engelle
    const clampedX = Math.min(x, window.innerWidth - 220);
    const clampedY = Math.min(y, window.innerHeight - items.length * 36 - 10);
    return createPortal(_jsx("div", { ref: menuRef, className: "fixed z-[9999] min-w-[200px] rounded-md border border-brand-borderStrong bg-brand-panel shadow-2xl py-1 text-brand-text animate-context-menu-in", style: { left: clampedX, top: clampedY }, onContextMenu: (e) => e.preventDefault(), children: items.map((entry) => {
            if ('separator' in entry && entry.separator) {
                return (_jsx("div", { className: "my-1 mx-2 border-t border-brand-border" }, entry.id));
            }
            const item = entry;
            return (_jsxs("button", { disabled: item.disabled, onClick: () => {
                    if (item.disabled)
                        return;
                    setTimeout(() => {
                        item.onClick();
                        onClose();
                    }, 100);
                }, className: `w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-all duration-100 ease-out active:scale-[0.98] ${item.disabled
                    ? 'opacity-40 cursor-not-allowed'
                    : item.danger
                        ? 'hover:bg-brand-danger/10 text-brand-danger active:bg-brand-danger/20'
                        : 'hover:bg-brand-panelAlt active:bg-brand-accent/15'}`, children: [_jsx("span", { className: "w-4 h-4 flex items-center justify-center text-brand-muted", children: item.icon }), _jsx("span", { className: "flex-1", children: item.label }), item.shortcut && (_jsx("span", { className: "text-[10px] text-brand-mutedSoft font-mono", children: item.shortcut }))] }, item.id));
        }) }), document.body);
}
