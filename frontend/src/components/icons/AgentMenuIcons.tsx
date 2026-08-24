import type { SVGProps } from 'react';

export interface CustomIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

/**
 * Yeni Sohbet Başlat İkonu
 * Özel tasarım: Mesaj balonu ve merkezinde canlı yeni konuşma artısı.
 */
export function MenuNewChatIcon({ size = 15, className = '', ...props }: CustomIconProps) {
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
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      <line x1="12" y1="8.5" x2="12" y2="14.5" />
      <line x1="9" y1="11.5" x2="15" y2="11.5" />
    </svg>
  );
}

/**
 * Geçmiş Sohbetler İkonu
 * Özel tasarım: Geriye dönük zaman halkası ve saat ibreleri.
 */
export function MenuHistoryIcon({ size = 15, className = '', ...props }: CustomIconProps) {
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
      <path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" />
      <polyline points="12 7 12 12 15 14" />
    </svg>
  );
}

/**
 * Ajanı Düzenle İkonu
 * Özel tasarım: Hassas teknik düzenleme kalemi ve odak ucu.
 */
export function MenuEditIcon({ size = 15, className = '', ...props }: CustomIconProps) {
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
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

/**
 * Ajan Durumu Toggle İkonu (Aktif / Pasif)
 * Özel tasarım: Kapsüllü anahtar düğmesi ve durum noktası.
 */
export function MenuToggleIcon({ active = true, size = 15, className = '', ...props }: CustomIconProps & { active?: boolean }) {
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
      <rect x="2" y="6" width="20" height="12" rx="6" />
      {active ? (
        <circle cx="16" cy="12" r="3.5" fill="currentColor" />
      ) : (
        <circle cx="8" cy="12" r="3.5" />
      )}
    </svg>
  );
}

/**
 * Bağlantıyı Test Et İkonu
 * Özel tasarım: Kablosuz dalga sinyali ve veri rezonans halkası.
 */
export function MenuTestConnectionIcon({ size = 15, className = '', ...props }: CustomIconProps) {
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
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <circle cx="12" cy="20" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * Markdown Olarak İndir İkonu
 * Özel tasarım: M↓ stilize markdown dokümanı ve indirme oku.
 */
export function MenuExportMdIcon({ size = 15, className = '', ...props }: CustomIconProps) {
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
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      {/* Markdown 'M' Harfi */}
      <path d="M8 17v-4l2 2 2-2v4" strokeWidth="1.5" />
      {/* İndirme Oku */}
      <polyline points="14 14 16 16 18 14" strokeWidth="1.5" />
      <line x1="16" y1="12" x2="16" y2="16" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * Sohbet Geçmişini Temizle İkonu
 * Özel tasarım: Süpürme dalgası ve temizleme fırçası.
 */
export function MenuClearHistoryIcon({ size = 15, className = '', ...props }: CustomIconProps) {
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
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

/**
 * Ajanı Kopyala (Çoğalt) İkonu
 * Özel tasarım: Katmanlı çift ajan kartı.
 */
export function MenuDuplicateIcon({ size = 15, className = '', ...props }: CustomIconProps) {
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
      <rect x="8" y="8" width="13" height="13" rx="2.5" />
      <path d="M5 16H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

/**
 * JSON Olarak Dışa Aktar İkonu
 * Özel tasarım: { } kod parantezleri ve dışa aktarma oku.
 */
export function MenuExportJsonIcon({ size = 15, className = '', ...props }: CustomIconProps) {
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
      <path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
      <polyline points="7 9 12 14 17 9" />
      <line x1="12" y1="14" x2="12" y2="2" />
    </svg>
  );
}

/**
 * Ajanı Sistemden Sil İkonu
 * Özel tasarım: Çöp kutusu ve uyarı çaprazı.
 */
export function MenuDeleteIcon({ size = 15, className = '', ...props }: CustomIconProps) {
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
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <line x1="10" y1="11" x2="14" y2="17" />
      <line x1="14" y1="11" x2="10" y2="17" />
    </svg>
  );
}
