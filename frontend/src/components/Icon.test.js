import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Icon component smoke testleri.
 * Icon, Material Symbols font kullanan bir <span> render eder.
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Icon } from './Icon';
describe('Icon', () => {
    it('renders without crashing', () => {
        const { container } = render(_jsx(Icon, { name: "check" }));
        expect(container.firstChild).toBeTruthy();
    });
    it('renders icon name as text content', () => {
        const { container } = render(_jsx(Icon, { name: "settings" }));
        expect(container.textContent).toBe('settings');
    });
    it('applies size via inline style', () => {
        const { container } = render(_jsx(Icon, { name: "check", size: 32 }));
        const span = container.querySelector('span');
        expect(span).toBeTruthy();
        expect(span?.style.fontSize).toBe('32px');
    });
    it('uses material-symbols-rounded class by default', () => {
        const { container } = render(_jsx(Icon, { name: "home" }));
        const span = container.querySelector('span');
        expect(span?.className).toContain('material-symbols-rounded');
    });
    it('switches to outlined variant when requested', () => {
        const { container } = render(_jsx(Icon, { name: "home", variant: "outlined" }));
        const span = container.querySelector('span');
        expect(span?.className).toContain('material-symbols-outlined');
    });
});
