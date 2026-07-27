import { jsx as _jsx } from "react/jsx-runtime";
export function Icon({ name, size = 20, className = '', filled = false, weight = 400, opsz, style, variant = 'rounded', onClick, title, ...rest }) {
    const baseCls = variant === 'rounded'
        ? 'material-symbols-rounded'
        : 'material-symbols-outlined';
    const mergedStyle = {
        fontSize: size,
        lineHeight: 1,
        verticalAlign: 'middle',
        userSelect: 'none',
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${weight}, 'GRAD' 0, 'opsz' ${opsz ?? size}`,
        ...style,
    };
    return (_jsx("span", { className: `${baseCls} ${className}`.trim(), style: mergedStyle, onClick: onClick, "aria-label": rest['aria-label'], title: title, role: onClick ? 'button' : undefined, children: name }));
}
