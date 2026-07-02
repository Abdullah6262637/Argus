/**
 * Google Material Symbols icon bileseni.
 *
 * Kullanim:
 *   <Icon name="settings" />
 *   <Icon name="delete" size={18} />
 *   <Icon name="check_circle" filled weight={500} />
 *
 * Icon adlari: https://fonts.google.com/icons
 */

import type { CSSProperties } from 'react';

export interface IconProps {
  /** Material Symbols icon adi (snake_case). orn: "settings", "chat_bubble", "delete" */
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
  filled = false,
  weight = 400,
  opsz,
  style,
  variant = 'rounded',
  onClick,
  title,
  ...rest
}: IconProps) {
  const baseCls =
    variant === 'rounded'
      ? 'material-symbols-rounded'
      : 'material-symbols-outlined';
  const mergedStyle: CSSProperties = {
    fontSize: size,
    lineHeight: 1,
    verticalAlign: 'middle',
    userSelect: 'none',
    fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${weight}, 'GRAD' 0, 'opsz' ${opsz ?? size}`,
    ...style,
  };

  return (
    <span
      className={`${baseCls} ${className}`.trim()}
      style={mergedStyle}
      onClick={onClick}
      aria-label={rest['aria-label']}
      title={title}
      role={onClick ? 'button' : undefined}
    >
      {name}
    </span>
  );
}