import type { SVGProps } from 'react';

export interface CustomIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
  filled?: boolean;
}

/**
 * Argus Workflow / Nodal Automation Icon
 * Özel tasarım — Nodal akış, reaktif dallanma ve tetikleyici elmas merkezi.
 */
export function WorkflowIcon({ size = 15, className = '', ...props }: CustomIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Başlangıç düğümü */}
      <circle cx="4.5" cy="6" r="2.25" />
      {/* Üst akış hedefi */}
      <circle cx="19.5" cy="6" r="2.25" />
      {/* Alt akış hedefi */}
      <circle cx="19.5" cy="18" r="2.25" />
      {/* Reaktif kıvrımlı hatlar */}
      <path d="M6.75 6h4a4 4 0 0 1 4 4v4a4 4 0 0 0 4 4h-0.75" />
      <path d="M6.75 6h10.5" />
      {/* Merkez tetikleyici mikro elmas */}
      <polygon points="12,4.5 13.5,6 12,7.5 10.5,6" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * Argus Knowledge Graph / Neural Constellation Icon
 * Özel tasarım — Semantik çekirdek düğüm ve ilişkisel takımyıldızı.
 */
export function KnowledgeIcon({ size = 15, className = '', ...props }: CustomIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Semantik Çekirdek */}
      <circle cx="12" cy="12" r="2.75" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
      {/* Uydu Düğümleri */}
      <circle cx="19" cy="6.5" r="1.75" />
      <circle cx="5" cy="7.5" r="1.75" />
      <circle cx="6.5" cy="18" r="1.75" />
      <circle cx="18" cy="17.5" r="1.75" />
      {/* İlişkisel Bağlantı Hatları */}
      <line x1="14" y1="10" x2="17.5" y2="7.5" />
      <line x1="10" y1="10.2" x2="6.5" y2="8.5" />
      <line x1="10.2" y1="14" x2="7.8" y2="16.5" />
      <line x1="14" y1="13.8" x2="16.5" y2="16.2" />
      {/* Hafif çapraz bağ */}
      <path d="M6.8 7.5c4-1.5 8-1.2 10.5-0.5" strokeDasharray="1.5 2.5" strokeWidth="1.2" opacity="0.65" />
    </svg>
  );
}

/**
 * Argus File Preview / Code Inspector Lens Icon
 * Özel tasarım — Doküman formu ve odaklı optik tarama lensi.
 */
export function PreviewIcon({ size = 15, className = '', ...props }: CustomIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Doküman Gövdesi */}
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      {/* Merkez Odak Lensi */}
      <circle cx="12" cy="14.5" r="3" />
      <circle cx="12" cy="14.5" r="1" fill="currentColor" stroke="none" />
      {/* Yatay tarama ışıması */}
      <path d="M8 14.5c1.2-1.8 2.5-2.5 4-2.5s2.8 0.7 4 2.5c-1.2 1.8-2.5 2.5-4 2.5s-2.8-0.7-4-2.5z" strokeWidth="1.2" opacity="0.75" />
    </svg>
  );
}

/**
 * Argus Tasks & Logs / System Telemetry Icon
 * Özel tasarım — Terminal aktivite yığını ve canlı komut istemi.
 */
export function TasksLogsIcon({ size = 15, className = '', ...props }: CustomIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Terminal Kartı */}
      <rect x="3" y="3" width="18" height="18" rx="3.5" />
      {/* Komut istemi (Chevron) */}
      <polyline points="6.5 8 9.5 11 6.5 14" strokeWidth="1.75" />
      {/* Aktif komut çizgisi */}
      <line x1="12" y1="11" x2="17" y2="11" strokeWidth="1.75" />
      {/* Alt telemetri / log çizgisi */}
      <line x1="6.5" y1="16.5" x2="17.5" y2="16.5" strokeWidth="1.4" strokeDasharray="2 2" opacity="0.65" />
    </svg>
  );
}

/**
 * Argus Plus Icon
 * Özel tasarım — Keskin ve simetrik artı ikonu.
 */
export function PlusIcon({ size = 14, className = '', ...props }: CustomIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

/**
 * Argus Empty State Neural Chat Icon
 * Özel tasarım — Sade ve akıcı nöral diyalog formu ve 3 düşünce noktası.
 */
export function EmptyStateChatIcon({ size = 26, className = '', ...props }: CustomIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Ana diyalog formu */}
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      {/* 3 Düşünce noktası */}
      <circle cx="8.5" cy="11.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="11.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="11.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

