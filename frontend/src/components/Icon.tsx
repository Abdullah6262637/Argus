import type { CSSProperties } from 'react';
import { DynamicArgusIcon } from './icons';

export interface IconProps {
  name: string;
  size?: number;
  className?: string;
  color?: string;
  filled?: boolean;
  weight?: number;
  opsz?: number;
  style?: CSSProperties;
  'aria-label'?: string;
  variant?: 'rounded' | 'outlined';
  onClick?: (e: React.MouseEvent) => void;
  title?: string;
}

export function Icon({
  name,
  size = 20,
  className = '',
  color,
  style,
  onClick,
  title,
}: IconProps) {
  return (
    <DynamicArgusIcon
      name={name}
      size={size}
      className={className}
      color={color}
      style={style}
      onClick={onClick}
      title={title}
    />
  );
}