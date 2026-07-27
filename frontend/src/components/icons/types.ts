import type { CSSProperties } from 'react';

export interface IconBaseProps {
  size?: number;
  className?: string;
  color?: string;
  onClick?: (e: React.MouseEvent) => void;
  style?: CSSProperties;
  title?: string;
}

export const defaultSvgProps = (props: IconBaseProps) => ({
  width: props.size ?? 20,
  height: props.size ?? 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: props.color ?? 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className: `inline-block transition-colors ${props.className ?? ''}`,
  style: { verticalAlign: 'middle', userSelect: 'none' as const, ...props.style },
  onClick: props.onClick,
});
