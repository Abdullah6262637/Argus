import React, { type CSSProperties } from 'react';

/**
 * Argus Özel SVG İkon Kütüphanesi (70+ Özel Benzersiz Vektör Çizimi)
 * Tasarım: Minimalist Slate & Emerald Uyumlu Her İkona Özel Vektör Çizimleri
 */

export interface ArgusIconProps {
  name: string;
  size?: number;
  className?: string;
  color?: string;
  onClick?: (e: React.MouseEvent) => void;
  style?: CSSProperties;
  title?: string;
}

export function ArgusIcon({
  name,
  size = 20,
  className = '',
  color = 'currentColor',
  onClick,
  style,
  title,
}: ArgusIconProps) {
  const iconProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: `inline-block transition-colors ${className}`,
    style: { verticalAlign: 'middle', userSelect: 'none' as const, ...style },
    onClick,
    title,
  };

  const normalized = name.toLowerCase().trim();

  switch (normalized) {
    // 1. Argus Logo / Brand Eye
    case 'argus_logo':
    case 'brand':
    case 'logo':
      return (
        <svg {...iconProps}>
          <path d="M12 3a9 9 0 0 0-9 9 9 9 0 0 0 9 9 9 9 0 0 0 9-9 9 9 0 0 0-9-9z" />
          <circle cx="12" cy="12" r="4" strokeWidth={2} className="text-emerald-400 fill-emerald-500/20" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <path d="M12 1v2m0 18v2M1 12h2m18 0h2" strokeWidth={1.5} opacity={0.6} />
        </svg>
      );

    // 2. Hub / Çoklu Sağlayıcı
    case 'hub':
    case 'multi_provider':
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="3" fill="currentColor" opacity={0.3} />
          <circle cx="12" cy="12" r="3" />
          <circle cx="5" cy="6" r="2" />
          <circle cx="19" cy="6" r="2" />
          <circle cx="5" cy="18" r="2" />
          <circle cx="19" cy="18" r="2" />
          <line x1="6.7" y1="7.3" x2="9.8" y2="9.8" />
          <line x1="17.3" y1="7.3" x2="14.2" y2="9.8" />
          <line x1="6.7" y1="16.7" x2="9.8" y2="14.2" />
          <line x1="17.3" y1="16.7" x2="14.2" y2="14.2" />
        </svg>
      );

    // 3. Psychology / Özel Persona (SOUL)
    case 'psychology':
    case 'persona':
    case 'mind':
      return (
        <svg {...iconProps}>
          <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" />
          <path d="M9 21h6" />
          <circle cx="12" cy="9" r="2" fill="currentColor" opacity={0.4} />
        </svg>
      );

    // 4. Schedule / Zamanlı Görevler (Clock Timer)
    case 'schedule':
    case 'clock':
    case 'cron':
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="9" />
          <polyline points="12 6 12 12 16 14" strokeWidth={2} />
        </svg>
      );

    // 5. Add Circle / Yeni Ajan Oluştur Butonu
    case 'add_circle':
    case 'plus_circle':
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="8" x2="12" y2="16" strokeWidth={2} />
          <line x1="8" y1="12" x2="16" y2="12" strokeWidth={2} />
        </svg>
      );

    // 6. Error Alert / Hata Kutusu
    case 'error':
    case 'error_outline':
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="9" strokeWidth={2} />
          <line x1="12" y1="8" x2="12" y2="12" strokeWidth={2} />
          <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth={2.5} />
        </svg>
      );

    // 7. Person Add / Yeni Ajan Üst Bar
    case 'person_add':
    case 'user_plus':
      return (
        <svg {...iconProps}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <line x1="20" y1="8" x2="20" y2="14" strokeWidth={2} />
          <line x1="17" y1="11" x2="23" y2="11" strokeWidth={2} />
        </svg>
      );

    // 8. Settings / Ayarlar (Gear)
    case 'settings':
    case 'gear':
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="3" strokeWidth={2} />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );

    // 9. Master Agent / Coordinator (Crown)
    case 'agent_master':
    case 'crown':
      return (
        <svg {...iconProps}>
          <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
          <circle cx="12" cy="19" r="1" fill="currentColor" />
        </svg>
      );

    // 10. Code Agent / Developer
    case 'agent_code':
    case 'code':
      return (
        <svg {...iconProps}>
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
          <line x1="14" y1="4" x2="10" y2="20" />
        </svg>
      );

    // 11. Security Agent / Shield
    case 'agent_security':
    case 'shield_check':
      return (
        <svg {...iconProps}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" strokeWidth={2} />
        </svg>
      );

    // 12. QA Agent / Target
    case 'agent_qa':
    case 'target':
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      );

    // 13. DB Agent / Database
    case 'agent_db':
    case 'database':
    case 'dns':
      return (
        <svg {...iconProps}>
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      );

    // 14. Network Check / Bağlantı Testi
    case 'network_check':
    case 'wifi':
      return (
        <svg {...iconProps}>
          <path d="M5 12.55a11 11 0 0 1 14.08 0" />
          <path d="M1.42 9a16 16 0 0 1 21.16 0" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth={3} />
        </svg>
      );

    // 15. Article / Dokümantasyon
    case 'article':
    case 'document':
      return (
        <svg {...iconProps}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      );

    // 16. Edit / Düzenle
    case 'edit':
    case 'pencil':
      return (
        <svg {...iconProps}>
          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        </svg>
      );

    // 17. Add Comment / Yorum Ekle
    case 'add_comment':
    case 'comment_plus':
      return (
        <svg {...iconProps}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <line x1="12" y1="8" x2="12" y2="14" strokeWidth={2} />
          <line x1="9" y1="11" x2="15" y2="11" strokeWidth={2} />
        </svg>
      );

    // 18. Visibility / Görüntüle
    case 'visibility':
    case 'eye':
      return (
        <svg {...iconProps}>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );

    // 19. Delete Sweep / Toplu Sil
    case 'delete_sweep':
    case 'sweep':
      return (
        <svg {...iconProps}>
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      );

    // 20. Content Copy / Kopyala
    case 'content_copy':
    case 'copy':
      return (
        <svg {...iconProps}>
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      );

    // 21. Download / İndir
    case 'download':
      return (
        <svg {...iconProps}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      );

    // 22. Delete / Sil
    case 'delete':
    case 'trash':
      return (
        <svg {...iconProps}>
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      );

    // 23. Add / Artı
    case 'add':
    case 'plus':
      return (
        <svg {...iconProps}>
          <line x1="12" y1="5" x2="12" y2="19" strokeWidth={2} />
          <line x1="5" y1="12" x2="19" y2="12" strokeWidth={2} />
        </svg>
      );

    // 24. Menu Open / Sol Menü Aç
    case 'menu_open':
    case 'side_navigation':
      return (
        <svg {...iconProps}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="9" y1="3" x2="9" y2="21" />
          <polyline points="14 9 17 12 14 15" />
        </svg>
      );

    // 25. Touch App / Hızlı İşlem
    case 'touch_app':
    case 'pointer':
      return (
        <svg {...iconProps}>
          <path d="M12 2a5 5 0 0 0-5 5v5a2 2 0 0 0 4 0V7a1 1 0 0 1 2 0v8a3 3 0 0 1-6 0V7" />
          <circle cx="12" cy="18" r="2" fill="currentColor" />
        </svg>
      );

    // 26. Build / Araç Testi (Wrench)
    case 'build':
    case 'wrench':
    case 'tool':
      return (
        <svg {...iconProps}>
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      );

    // 27. Data Object / JSON Schema
    case 'data_object':
    case 'json':
      return (
        <svg {...iconProps}>
          <path d="M8 3H7a2 2 0 0 0-2 2v3a2 2 0 0 1-2 2 2 2 0 0 1 2 2v3a2 2 0 0 0 2 2h1m8-14h1a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2 2 2 0 0 0-2 2v3a2 2 0 0 1-2 2h-1" />
        </svg>
      );

    // 28. Auto Stories / SOUL Rehberi
    case 'auto_stories':
    case 'book':
      return (
        <svg {...iconProps}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );

    // 29. Save / Kaydet
    case 'save':
      return (
        <svg {...iconProps}>
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <polyline points="17 21 17 13 7 13 7 21" />
          <polyline points="7 3 7 8 15 8" />
        </svg>
      );

    // 30. Tune / İzin Ayarları (Sliders)
    case 'tune':
    case 'sliders':
      return (
        <svg {...iconProps}>
          <line x1="4" y1="21" x2="4" y2="14" />
          <line x1="4" y1="10" x2="4" y2="3" />
          <line x1="12" y1="21" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12" y2="3" />
          <line x1="20" y1="21" x2="20" y2="16" />
          <line x1="20" y1="12" x2="20" y2="3" />
          <line x1="1" y1="14" x2="7" y2="14" strokeWidth={2} />
          <line x1="9" y1="8" x2="15" y2="8" strokeWidth={2} />
          <line x1="17" y1="16" x2="23" y2="16" strokeWidth={2} />
        </svg>
      );

    // 31. Bolt / Lightning / Workflow
    case 'bolt':
    case 'lightning':
    case 'zap':
      return (
        <svg {...iconProps}>
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" opacity={0.25} />
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );

    // 32. Info / Bilgilendirme
    case 'info':
    case 'info_circle':
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" strokeWidth={2} />
          <line x1="12" y1="8" x2="12.01" y2="8" strokeWidth={2.5} />
        </svg>
      );

    // 33. Analytics / Metrikler (Bar Chart)
    case 'analytics':
    case 'chart':
      return (
        <svg {...iconProps}>
          <line x1="18" y1="20" x2="18" y2="10" strokeWidth={2} />
          <line x1="12" y1="20" x2="12" y2="4" strokeWidth={2} />
          <line x1="6" y1="20" x2="6" y2="14" strokeWidth={2} />
        </svg>
      );

    // 34. Close / Kapat (X)
    case 'close':
    case 'cancel':
    case 'x':
      return (
        <svg {...iconProps}>
          <line x1="18" y1="6" x2="6" y2="18" strokeWidth={2} />
          <line x1="6" y1="6" x2="18" y2="18" strokeWidth={2} />
        </svg>
      );

    // 35. Menu / Hamburger
    case 'menu':
      return (
        <svg {...iconProps}>
          <line x1="3" y1="6" x2="21" y2="6" strokeWidth={2} />
          <line x1="3" y1="12" x2="21" y2="12" strokeWidth={2} />
          <line x1="3" y1="18" x2="21" y2="18" strokeWidth={2} />
        </svg>
      );

    // 36. Assignment / Görev Listesi (Clipboard)
    case 'assignment':
    case 'task':
      return (
        <svg {...iconProps}>
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" />
          <line x1="9" y1="12" x2="15" y2="12" strokeWidth={2} />
          <line x1="9" y1="16" x2="13" y2="16" strokeWidth={2} />
        </svg>
      );

    // 37. Stop / Durdur (Square)
    case 'stop':
      return (
        <svg {...iconProps}>
          <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
        </svg>
      );

    // 38. Arrow Upward / Yukarı Gönder Ok
    case 'arrow_upward':
    case 'send_up':
      return (
        <svg {...iconProps}>
          <line x1="12" y1="19" x2="12" y2="5" strokeWidth={2} />
          <polyline points="5 12 12 5 19 12" strokeWidth={2} />
        </svg>
      );

    // 39. Search / Büyüteç
    case 'search':
      return (
        <svg {...iconProps}>
          <circle cx="11" cy="11" r="8" strokeWidth={2} />
          <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth={2} />
        </svg>
      );

    // 40. Attach File / Ataş
    case 'attach_file':
    case 'paperclip':
      return (
        <svg {...iconProps}>
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
      );

    // 41. Auto Awesome / Sparkles
    case 'auto_awesome':
    case 'sparkles':
      return (
        <svg {...iconProps}>
          <path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4z" fill="currentColor" opacity={0.3} />
          <path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4z" />
        </svg>
      );

    // 42. Check Circle / Onaylı Çember
    case 'check_circle':
    case 'success':
      return (
        <svg {...iconProps}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" strokeWidth={2} />
        </svg>
      );

    // 43. Warning / Uyarı Üçgeni
    case 'warning':
    case 'alert_triangle':
      return (
        <svg {...iconProps}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" strokeWidth={2} />
          <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth={2.5} />
        </svg>
      );

    // 44. Progress Activity / Yükleniyor Spinner Ring
    case 'progress_activity':
    case 'spinner':
    case 'loading':
      return (
        <svg {...iconProps}>
          <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
        </svg>
      );

    // 45. Check / Tik İkonu
    case 'check':
      return (
        <svg {...iconProps}>
          <polyline points="20 6 9 17 4 12" strokeWidth={2.5} />
        </svg>
      );

    // 46. Refresh / Yenile Oku
    case 'refresh':
    case 'reload':
      return (
        <svg {...iconProps}>
          <polyline points="23 4 23 10 17 10" strokeWidth={2} />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
      );

    // 47. Chat Bubble / Sohbet Balonu
    case 'chat_bubble':
    case 'chat_bubble_outline':
    case 'chat':
    case 'message':
      return (
        <svg {...iconProps}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <line x1="8" y1="9" x2="16" y2="9" strokeWidth={2} />
          <line x1="8" y1="13" x2="13" y2="13" strokeWidth={2} />
        </svg>
      );

    // 48. Minus / Minimize Window
    case 'minus':
    case 'minimize':
      return (
        <svg {...iconProps}>
          <line x1="5" y1="12" x2="19" y2="12" strokeWidth={2} />
        </svg>
      );

    // 49. Square / Maximize Window
    case 'square':
    case 'crop_square':
    case 'maximize':
      return (
        <svg {...iconProps}>
          <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth={2} />
        </svg>
      );

    // 50-60. LLM Sağlayıcı İkonları
    case 'llm_openai':
    case 'openai':
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="4" fill="currentColor" opacity={0.3} />
        </svg>
      );

    case 'llm_anthropic':
    case 'anthropic':
    case 'claude':
      return (
        <svg {...iconProps}>
          <path d="M12 2L2 22h4l2-4h8l2 4h4L12 2zm-1.5 12l2.5-5 2.5 5h-5z" />
        </svg>
      );

    case 'llm_google':
    case 'google':
    case 'gemini':
      return (
        <svg {...iconProps}>
          <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z" />
        </svg>
      );

    case 'llm_groq':
    case 'groq':
      return (
        <svg {...iconProps}>
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <path d="M8 12h8m-4-4v8" strokeWidth={2} />
        </svg>
      );

    case 'llm_sambanova':
    case 'sambanova':
      return (
        <svg {...iconProps}>
          <polygon points="12 2 20 7 20 17 12 22 4 17 4 7 12 2" />
        </svg>
      );

    case 'llm_cerebras':
    case 'cerebras':
      return (
        <svg {...iconProps}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="8" y1="3" x2="8" y2="21" />
          <line x1="16" y1="3" x2="16" y2="21" />
          <line x1="3" y1="12" x2="21" y2="12" />
        </svg>
      );

    case 'llm_fireworks':
    case 'fireworks':
      return (
        <svg {...iconProps}>
          <path d="M12 2c-4 4-6 8.5-6 12a6 6 0 0 0 12 0c0-3.5-2-8-6-12z" />
        </svg>
      );

    case 'llm_together':
    case 'together':
      return (
        <svg {...iconProps}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
        </svg>
      );

    case 'llm_ollama':
    case 'ollama':
      return (
        <svg {...iconProps}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <circle cx="12" cy="12" r="3" fill="currentColor" opacity={0.3} />
        </svg>
      );

    // Herhangi bir tanımlanmamış ikon durumunda Özel Argus Vektör Çemberi (Yıldız Değil!)
    default:
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="3" fill="currentColor" opacity={0.4} />
        </svg>
      );
  }
}
