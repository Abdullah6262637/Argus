import type { CSSProperties } from 'react';
import { ArgusIcon } from './ArgusIcons';

export interface IconProps {
  /** Icon adi (snake_case). orn: "settings", "chat_bubble", "delete", "agent_master" */
  name: string;
  /** Piksel boyutu (varsayilan 20) */
  size?: number;
  /** Opsiyonel className - renk/positioning icin */
  className?: string;
  /** Dolu varyant (outline yerine) */
  filled?: boolean;
  /** Cizgi kalinligi 100-700 */
  weight?: number;
  /** Optik boyut 20-48 */
  opsz?: number;
  /** Inline style overrides */
  style?: CSSProperties;
  /** Aria label - ekran okuyuculari icin */
  'aria-label'?: string;
  /** Rounded variant (varsayilan outlined). */
  variant?: 'rounded' | 'outlined';
  /** Tiklama */
  onClick?: (e: React.MouseEvent) => void;
  title?: string;
}

export function Icon({
  name,
  size = 20,
  className = '',
  style,
  onClick,
  title,
}: IconProps) {
  return (
    <ArgusIcon
      name={name}
      size={size}
      className={className}
      style={style}
      onClick={onClick}
      title={title}
    />
  );
}