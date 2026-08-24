import type { ActionIconProps } from './MessageActionIcons';

/**
 * Argus Nodes Icon
 * Özel tasarım — Bilgi grafiği düğümleri.
 */
export function NodesIcon({ size = 12, className = '', filled = false, ...props }: ActionIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="4" cy="12" r="2" fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.2 : 0} />
      <circle cx="12" cy="12" r="2" fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.2 : 0} />
      <circle cx="8" cy="4" r="2" fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.2 : 0} />
      <line x1="5.5" y1="10.5" x2="6.5" y2="5.5" />
      <line x1="10.5" y1="10.5" x2="9.5" y2="5.5" />
    </svg>
  );
}

/**
 * Argus Edges Icon
 * Özel tasarım — İlişkileri temsil eden ok.
 */
export function EdgesIcon({ size = 12, className = '', filled = false, ...props }: ActionIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="3" cy="8" r="2" fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.2 : 0} />
      <circle cx="13" cy="8" r="2" fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.2 : 0} />
      <line x1="5" y1="8" x2="11" y2="8" />
      <polyline points="9 6 11 8 9 10" />
    </svg>
  );
}

/**
 * Argus Visual Graph Icon
 * Özel tasarım — Merkez ve uydu düğümler.
 */
export function VisualGraphIcon({ size = 12, className = '', filled = false, ...props }: ActionIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="8" cy="8" r="3" fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.2 : 0} />
      <circle cx="2" cy="4" r="1.5" />
      <circle cx="14" cy="4" r="1.5" />
      <circle cx="8" cy="14" r="1.5" />
      <line x1="3.2" y1="5.2" x2="5.8" y2="6.8" />
      <line x1="12.8" y1="5.2" x2="10.2" y2="6.8" />
      <line x1="8" y1="12.5" x2="8" y2="11" />
    </svg>
  );
}
