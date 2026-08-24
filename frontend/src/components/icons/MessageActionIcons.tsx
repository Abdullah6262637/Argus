import type { SVGProps } from 'react';

export interface ActionIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
  filled?: boolean;
}

/**
 * Argus Token / Compute Metric Icon
 * Özel tasarım — Hassas heksagonal hesaplama çekirdeği ve mikro enerji merkezi.
 */
export function TokenIcon({ size = 11, className = '', filled = false, ...props }: ActionIconProps) {
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
      {/* Heksagonal token gövdesi */}
      <polygon points="8,1.5 14,5 14,11 8,14.5 2,11 2,5" fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.2 : 0} />
      {/* Merkez enerji ışını */}
      <line x1="8" y1="5" x2="8" y2="11" strokeWidth="1.6" />
      <line x1="5.5" y1="6.5" x2="10.5" y2="9.5" strokeWidth="1.2" opacity="0.75" />
    </svg>
  );
}

/**
 * Argus Like / Thumbs Up Icon
 * Özel tasarım — Ergonomik ve minimalist onay ikonu.
 */
export function LikeIcon({ size = 12, className = '', filled = false, ...props }: ActionIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M4.5 6.5V13.5H2C1.44772 13.5 1 13.0523 1 12.5V7.5C1 6.94772 1.44772 6.5 2 6.5H4.5ZM4.5 6.5L8.2 2.2C8.6 1.7 9.3 1.9 9.5 2.5L9.8 4.8C9.9 5.2 10.3 5.5 10.7 5.5H13.5C14.3 5.5 14.9 6.2 14.8 7L13.8 12C13.7 12.6 13.2 13 12.6 13H4.5" />
    </svg>
  );
}

/**
 * Argus Dislike / Thumbs Down Icon
 * Özel tasarım — Simetrik negatif değerlendirme ikonu.
 */
export function DislikeIcon({ size = 12, className = '', filled = false, ...props }: ActionIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M4.5 9.5V2.5H2C1.44772 2.5 1 2.94772 1 3.5V8.5C1 9.05228 1.44772 9.5 2 9.5H4.5ZM4.5 9.5L8.2 13.8C8.6 14.3 9.3 14.1 9.5 13.5L9.8 11.2C9.9 10.8 10.3 10.5 10.7 10.5H13.5C14.3 10.5 14.9 9.8 14.8 9L13.8 4C13.7 3.4 13.2 3 12.6 3H4.5" />
    </svg>
  );
}

/**
 * Argus Copy to Clipboard Icon
 * Özel tasarım — Katmanlı çift sayfa kopyalama geometrisi.
 */
export function CopyIcon({ size = 12, className = '', ...props }: ActionIconProps) {
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
      {/* Arka sayfa */}
      <path d="M4 3.5C4 2.67157 4.67157 2 5.5 2H12.5C13.3284 2 14 2.67157 14 3.5V10.5C14 11.3284 13.3284 12 12.5 12" />
      {/* Ön aktif kart */}
      <rect x="2" y="4.5" width="9.5" height="9.5" rx="1.75" />
    </svg>
  );
}

/**
 * Argus Checkmark / Copied State Icon
 * Özel tasarım — Başarılı kopyalama onay tıkı.
 */
export function CheckIcon({ size = 12, className = '', ...props }: ActionIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <polyline points="3.5 8.5 6.5 11.5 12.5 4.5" />
    </svg>
  );
}

/**
 * Argus Speaker / Text-to-Speech Icon
 * Özel tasarım — Akustik megafon ve ses dalgası.
 */
export function SpeakerIcon({ size = 12, className = '', filled = false, ...props }: ActionIconProps) {
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
      {/* Hoparlör gövdesi */}
      <path d="M7.5 2.5L4 5.5H2C1.44772 5.5 1 5.94772 1 6.5V9.5C1 10.0523 1.44772 10.5 2 10.5H4L7.5 13.5V2.5Z" fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.25 : 0} />
      {/* 1. Ses dalgası */}
      <path d="M10.5 5.5C11.3 6.3 11.8 7.1 11.8 8C11.8 8.9 11.3 9.7 10.5 10.5" />
      {/* 2. Ses dalgası */}
      <path d="M12.8 3.5C14.2 4.9 15 6.4 15 8C15 9.6 14.2 11.1 12.8 12.5" opacity="0.75" />
    </svg>
  );
}
