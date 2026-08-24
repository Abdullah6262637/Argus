import { Icon } from './Icon';

interface HeaderProps {
  wsConnected: boolean;
  onReloadAgents: () => void;
  onCreateAgent: () => void;
  onOpenSettings: () => void;
  onOpenWorkflows?: () => void;
  onOpenCommandPalette?: () => void;
}

function WindowControls() {
  const isElectron = typeof window !== 'undefined' && (!!(window as any).argus || !!(window as any).openclaw);
  if (!isElectron) return null;

  const handleMinimize = () => {
    try {
      (window as any).argus?.minimize?.() ||
      (window as any).argus?.windowControls?.minimize?.() ||
      (window as any).openclaw?.windowControls?.minimize?.();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMaximize = () => {
    try {
      (window as any).argus?.maximize?.() ||
      (window as any).argus?.windowControls?.maximize?.() ||
      (window as any).openclaw?.windowControls?.maximize?.();
    } catch (e) {
      console.error(e);
    }
  };

  const handleClose = () => {
    try {
      (window as any).argus?.close?.() ||
      (window as any).argus?.windowControls?.close?.() ||
      (window as any).openclaw?.windowControls?.close?.();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
      {/* Minimize */}
      <button
        type="button"
        onClick={handleMinimize}
        title="Simge Durumuna Küçült (-)"
        className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt transition-all duration-150 active:scale-90"
      >
        <svg width="10" height="2" viewBox="0 0 10 2" fill="currentColor">
          <rect width="10" height="2" rx="1" />
        </svg>
      </button>

      {/* Maximize / Restore */}
      <button
        type="button"
        onClick={handleMaximize}
        title="Ekranı Kapla / Geri Yükle (□)"
        className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt transition-all duration-150 active:scale-90"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.3">
          <rect x="0.65" y="0.65" width="8.7" height="8.7" rx="1.5" />
        </svg>
      </button>

      {/* Close */}
      <button
        type="button"
        onClick={handleClose}
        title="Kapat (✕)"
        className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-brand-textSoft hover:text-white hover:bg-red-500/90 transition-all duration-150 active:scale-90"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.3">
          <line x1="1.5" y1="1.5" x2="8.5" y2="8.5" strokeLinecap="round" />
          <line x1="8.5" y1="1.5" x2="1.5" y2="8.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

export function Header({
  wsConnected,
  onReloadAgents,
  onCreateAgent,
  onOpenSettings,
  onOpenWorkflows,
  onOpenCommandPalette,
}: HeaderProps) {
  return (
    <header
      className="h-12 flex-shrink-0 flex items-center justify-between px-3 border-b border-brand-border bg-brand-panel animate-fade-in-down select-none"
      style={{ WebkitAppRegion: 'drag' } as any}
      onDoubleClick={() => {
        (window as any).argus?.maximize?.() ||
        (window as any).argus?.windowControls?.maximize?.();
      }}
    >
      {/* Sol: Komut paleti + Aksiyon grubu + Bağlantı Durumu */}
      <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
        {/* Komut paleti — özel kbd hint'li search-look */}
        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            title="Komut paleti (Ctrl+K)"
            className="h-8 inline-flex items-center gap-2 px-2.5 rounded-xl bg-brand-panelAlt/50 text-brand-mutedSoft hover:text-brand-text hover:bg-brand-panelAlt transition-all duration-200 active:scale-95 select-none"
          >
            <Icon name="search" size={14} />
            <span className="hidden md:inline text-xs leading-none">Komut ara</span>
            <kbd
              className="hidden md:inline-flex items-center justify-center text-[10px] rounded px-1.5 h-4.5 font-mono bg-brand-bg/60 text-brand-textSoft leading-none not-italic font-semibold tracking-tight"
              style={{ fontStyle: 'normal' }}
            >
              Ctrl+K
            </kbd>
          </button>
        )}

        {/* Aksiyon grubu */}
        <div className="hidden sm:flex items-center bg-brand-panelAlt/50 rounded-xl p-0.5 gap-0.5">
          <button
            onClick={onCreateAgent}
            title="Yeni ajan oluştur"
            className="h-7.5 px-3 inline-flex items-center text-xs font-semibold rounded-lg text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt transition-all duration-200 active:scale-95"
          >
            <span>Yeni Ajan</span>
          </button>
          <button
            onClick={onReloadAgents}
            title="agents.yaml dosyasını yeniden yükle"
            className="h-7.5 px-3 inline-flex items-center text-xs font-semibold rounded-lg text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt transition-all duration-200 active:scale-95"
          >
            <span>Yenile</span>
          </button>
          {onOpenWorkflows && (
            <button
              onClick={onOpenWorkflows}
              title="Workflow'ları yönet ve çalıştır"
              className="h-7.5 px-3 inline-flex items-center text-xs font-semibold rounded-lg text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt transition-all duration-200 active:scale-95"
            >
              <span>Workflow</span>
            </button>
          )}
          <button
            onClick={onOpenSettings}
            title="Sistem ayarlarını aç"
            className="h-7.5 px-3 inline-flex items-center text-xs font-semibold rounded-lg text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt transition-all duration-200 active:scale-95"
          >
            <span>Ayarlar</span>
          </button>
        </div>

        {/* Mobile fallback */}
        <div className="sm:hidden flex items-center bg-brand-panelAlt/50 rounded-xl p-0.5 gap-0.5">
          <button
            onClick={onCreateAgent}
            title="Yeni ajan"
            className="h-7 px-2 text-xs font-semibold rounded text-brand-textSoft hover:text-brand-text"
          >
            Ajan
          </button>
          <button
            onClick={onReloadAgents}
            title="Yenile"
            className="h-7 px-2 text-xs font-semibold rounded text-brand-textSoft hover:text-brand-text"
          >
            Yenile
          </button>
          {onOpenWorkflows && (
            <button
              onClick={onOpenWorkflows}
              title="Workflow"
              className="h-7 px-2 text-xs font-semibold rounded text-brand-textSoft hover:text-brand-text"
            >
              Workflow
            </button>
          )}
          <button
            onClick={onOpenSettings}
            title="Ayarlar"
            className="h-7 px-2 text-xs font-semibold rounded text-brand-textSoft hover:text-brand-text"
          >
            Ayarlar
          </button>
        </div>

        {/* Bağlantı durumu — Sadece kopukken kırmızı uyarı */}
        {!wsConnected && (
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-brand-danger/10 text-brand-danger select-none animate-pulse"
            title="WebSocket bağlantısı kopuk — Sunucuya bağlanılamıyor"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand-danger flex-shrink-0" />
            <span className="text-[11px] font-semibold tracking-wide">Bağlantı Yok</span>
          </div>
        )}
      </div>

      {/* Sağ: Pencere Kontrolleri (Küçült, Büyüt/Geri Yükle, Kapat) */}
      <div className="flex items-center" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <WindowControls />
      </div>
    </header>
  );
}