import type { SVGProps } from 'react';

export interface PermissionIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
  filled?: boolean;
}

/**
 * Salt-okunur (Readonly) Ikonu
 * Özel tasarım — Basit ve temiz asma kilit.
 */
export function ReadonlyIcon({ size = 16, className = '', filled = false, ...props }: PermissionIconProps) {
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
      <rect x="3" y="7" width="10" height="7" rx="1.5" fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.2 : 0} />
      <path d="M5.5 7V4.5a2.5 2.5 0 0 1 5 0V7" />
    </svg>
  );
}

/**
 * Araştırmacı (Researcher) Ikonu
 * Özel tasarım — Optik mercek ve global ağ çizgisi.
 */
export function ResearcherIcon({ size = 16, className = '', filled = false, ...props }: PermissionIconProps) {
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
      <circle cx="6.5" cy="6.5" r="3.5" fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.2 : 0} />
      <line x1="14" y1="14" x2="9" y2="9" strokeWidth="1.75" />
      <path d="M11 4.5a3.5 3.5 0 0 1 0 4" opacity="0.6" />
    </svg>
  );
}

/**
 * Yazar (Writer) Ikonu
 * Özel tasarım — Eğik tüylü kalem ve belge çizgisi.
 */
export function WriterIcon({ size = 16, className = '', filled = false, ...props }: PermissionIconProps) {
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
      <path d="M12 2.5a1.5 1.5 0 0 1 2 2L6.5 12 2.5 13l1-4L12 2.5Z" fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.15 : 0} />
      <line x1="6" y1="6" x2="10" y2="10" opacity="0.5" />
      <line x1="2.5" y1="13" x2="4.5" y2="11" />
    </svg>
  );
}

/**
 * Geliştirici (Developer) Ikonu
 * Özel tasarım — İki yönlü kod köşeli ayraçları ve terminal slash'i.
 */
export function DeveloperIcon({ size = 16, className = '', ...props }: PermissionIconProps) {
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
      <polyline points="5 5 2 8 5 11" />
      <polyline points="11 5 14 8 11 11" />
      <line x1="9.5" y1="4.5" x2="6.5" y2="11.5" strokeWidth="1.25" />
    </svg>
  );
}

/**
 * Tam Yetkili (Full Access) Ikonu
 * Özel tasarım — Güvenlik kalkanı ve merkez onay noktası.
 */
export function FullIcon({ size = 16, className = '', filled = false, ...props }: PermissionIconProps) {
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
      <path d="M8 1.5l5.5 2v4.5c0 3.8-2.3 7-5.5 8-3.2-1-5.5-4.2-5.5-8V3.5L8 1.5Z" fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.2 : 0} />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * Özel Yapılandırma (Custom) Ikonu
 * Özel tasarım — Yatay ayar sürgüleri.
 */
export function CustomIcon({ size = 16, className = '', ...props }: PermissionIconProps) {
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
      <line x1="2.5" y1="4.5" x2="13.5" y2="4.5" />
      <line x1="2.5" y1="11.5" x2="13.5" y2="11.5" />
      <circle cx="5.5" cy="4.5" r="1.5" fill="currentColor" />
      <circle cx="10.5" cy="11.5" r="1.5" fill="currentColor" />
    </svg>
  );
}
