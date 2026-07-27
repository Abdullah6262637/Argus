import { Icon } from './Icon';

interface HeaderProps {
  wsConnected: boolean;
  onReloadAgents: () => void;
  onCreateAgent: () => void;
  onOpenSettings: () => void;
  onOpenWorkflows?: () => void;
  onOpenCommandPalette?: () => void;
}

/**
 * Sade ikon-buton (boyutu ve stili tutarli).
 * Tooltip + opsiyonel etiket destegi.
 */
function NavButton({
  icon,
  label,
  onClick,
  title,
  variant = 'ghost',
  filled = false}: {
  icon: string;
  label?: string;
  onClick: () => void;
  title: string;
  variant?: 'ghost' | 'primary';
  filled?: boolean;
}) {
  const base =
    'h-9 inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold transition-all duration-200 active:scale-95 select-none';
  const variants = {
    ghost:
      'px-2.5 border border-brand-border text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt hover:border-brand-borderStrong',
    primary:
      'px-3 bg-brand-accent text-brand-bg hover:bg-brand-accentDim shadow-sm hover:shadow-md'};
  return (
    <button
      onClick={onClick}
      title={title}
      className={`${base} ${variants[variant]}`}
    >
      <Icon name={icon} size={16} weight={550} filled={filled} />
      {label && <span className="hidden md:inline">{label}</span>}
    </button>
  );
}

export function Header({
  wsConnected,
  onReloadAgents,
  onCreateAgent,
  onOpenSettings,
  onOpenWorkflows,
  onOpenCommandPalette}: HeaderProps) {
  return (
    <header className="h-14 flex-shrink-0 flex items-center justify-between px-4 border-b border-brand-border bg-brand-panel animate-fade-in-down select-none" style={{ WebkitAppRegion: 'drag' } as any}>
      {/* Sol: Logo + isim + Canlı Statü */}
      <div className="flex items-center gap-2.5 min-w-0" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <img
          src="/logo.png"
          className="w-10 h-10 rounded-lg object-contain flex-shrink-0"
          alt="Argus Logo"
        />
        <div className="min-w-0 hidden sm:block">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-brand-text leading-tight tracking-tight">
              Argus
            </h1>
            <div
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-semibold tracking-wide ${
                wsConnected
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-rose-500/10 text-rose-400'
              }`}
              title={
                wsConnected
                  ? 'WebSocket bağlantısı aktif'
                  : 'WebSocket bağlantısı kopuk'
              }
            >
              <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-emerald-400' : 'bg-rose-500'}`} />
              <span>{wsConnected ? 'Canlı' : 'Kopuk'}</span>
            </div>
          </div>
          <p className="text-[10.5px] text-brand-mutedSoft leading-tight">
            Aynı anda her şeyi gören çoklu ajan sistemi
          </p>
        </div>
      </div>

      {/* Sağ: Komut paleti + aksiyon grubu + ayarlar + bağlantı */}
      <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
        {/* Komut paleti — özel kbd hint'li search-look */}
        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            title="Komut paleti (Ctrl+K)"
            className="h-9 inline-flex items-center gap-2 px-2.5 rounded-lg border border-brand-border text-brand-mutedSoft hover:text-brand-text hover:bg-brand-panelAlt hover:border-brand-borderStrong transition-all duration-200 active:scale-95 select-none"
          >
            <Icon name="search" size={15} weight={550} />
            <span className="hidden md:inline text-xs leading-none">Komut ara</span>
            <kbd
              className="hidden md:inline-flex items-center justify-center text-[10px] border border-brand-border rounded px-1.5 h-5 font-mono bg-brand-panelAlt text-brand-textSoft leading-none not-italic font-semibold tracking-tight"
              style={{ fontStyle: 'normal' }}
            >
              Ctrl+K
            </kbd>
          </button>
        )}

        {/* Aksiyon grubu — segmentlenmiş tek kapsül görünümü */}
        <div className="hidden sm:flex items-center bg-brand-bg/40 border border-brand-border rounded-lg p-0.5">
          <button
            onClick={onCreateAgent}
            title="Yeni ajan oluştur"
            className="h-8 px-2.5 inline-flex items-center gap-1.5 text-xs font-semibold rounded-md text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt transition-all duration-200 active:scale-95"
          >
            <Icon name="person_add" size={15} weight={550} />
            <span className="hidden lg:inline">Yeni Ajan</span>
          </button>
          <div className="w-px h-5 bg-brand-border" />
          <button
            onClick={onReloadAgents}
            title="agents.yaml dosyasını yeniden yükle"
            className="h-8 px-2.5 inline-flex items-center gap-1.5 text-xs font-semibold rounded-md text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt transition-all duration-200 active:scale-95"
          >
            <Icon name="refresh" size={15} weight={550} />
            <span className="hidden lg:inline">Yenile</span>
          </button>
          {onOpenWorkflows && (
            <>
              <div className="w-px h-5 bg-brand-border" />
              <button
                onClick={onOpenWorkflows}
                title="Workflow'ları yönet ve çalıştır"
                className="h-8 px-2.5 inline-flex items-center gap-1.5 text-xs font-semibold rounded-md text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt transition-all duration-200 active:scale-95"
              >
                <Icon name="bolt" size={15} weight={550} filled />
                <span className="hidden lg:inline">Workflow</span>
              </button>
            </>
          )}
        </div>

        {/* Mobile fallback (sm altında ayrı butonlar) */}
        <div className="sm:hidden flex items-center gap-1">
          <NavButton
            icon="person_add"
            onClick={onCreateAgent}
            title="Yeni ajan"
          />
          <NavButton
            icon="refresh"
            onClick={onReloadAgents}
            title="Yenile"
          />
          {onOpenWorkflows && (
            <NavButton
              icon="bolt"
              onClick={onOpenWorkflows}
              title="Workflow"
              filled
            />
          )}
        </div>

        {/* Ayarlar (ikon-buton, kare) */}
        <button
          onClick={onOpenSettings}
          className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-brand-border text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt hover:border-brand-borderStrong transition-all duration-200 active:scale-95"
          title="Ayarlar"
          aria-label="Ayarlar"
        >
          <Icon name="settings" size={17} weight={550} />
        </button>

        {/* Window Controls (Electron desktop mode) */}
        {typeof window !== 'undefined' && (window as any).openclaw?.windowControls && (
          <div className="flex items-center gap-1 ml-2 pl-2 border-l border-brand-border select-none" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <button
              onClick={() => (window as any).openclaw.windowControls.minimize()}
              title="Simge Durumuna Küçült (-)"
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt transition-all duration-150 active:scale-90"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="5.5" width="8" height="1.2" rx="0.6" fill="currentColor" />
              </svg>
            </button>
            <button
              onClick={() => (window as any).openclaw.windowControls.maximize()}
              title="Ekranı Kapla / Tam Ekran (□)"
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt transition-all duration-150 active:scale-90"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2.25" y="2.25" width="7.5" height="7.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
            <button
              onClick={() => (window as any).openclaw.windowControls.close()}
              title="Kapat (✕)"
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-brand-textSoft hover:text-white hover:bg-red-500/90 transition-all duration-150 active:scale-90"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.5 2.5L9.5 9.5M9.5 2.5L2.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}