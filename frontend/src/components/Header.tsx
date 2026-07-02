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
    <header className="h-14 flex-shrink-0 flex items-center justify-between px-4 border-b border-brand-border bg-brand-panel animate-fade-in-down">
      {/* Sol: Logo + isim */}
      <div className="flex items-center gap-2.5 min-w-0">
        <img
          src="/logo.png"
          className="w-10 h-10 rounded-lg object-contain flex-shrink-0"
          alt="Argus Logo"
        />
        <div className="min-w-0 hidden sm:block">
          <h1 className="text-sm font-semibold text-brand-text leading-tight tracking-tight">
            Argus
          </h1>
          <p className="text-[10.5px] text-brand-mutedSoft leading-tight">
            Aynı anda her şeyi gören çoklu ajan sistemi
          </p>
        </div>
      </div>

      {/* Sağ: Komut paleti + aksiyon grubu + ayarlar + bağlantı */}
      <div className="flex items-center gap-2">
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

        {/* Bağlantı durumu rozeti */}
        <div
          className={`hidden md:flex items-center gap-1.5 h-9 px-2.5 rounded-lg border ${
            wsConnected
              ? 'border-brand-success/30 bg-brand-success/5 text-brand-success'
              : 'border-brand-danger/30 bg-brand-danger/5 text-brand-danger'
          }`}
          title={
            wsConnected
              ? 'WebSocket bağlantısı aktif'
              : 'WebSocket bağlantısı kopuk'
          }
        >
          <span className="relative flex w-2 h-2">
            {wsConnected && (
              <span className="absolute inline-flex h-full w-full rounded-full bg-brand-success opacity-60 animate-ping" />
            )}
            <span
              className={`relative inline-flex w-2 h-2 rounded-full ${
                wsConnected ? 'bg-brand-success' : 'bg-brand-danger'
              }`}
            />
          </span>
          <span className="text-[10.5px] font-bold uppercase tracking-wider">
            {wsConnected ? 'Canlı' : 'Kopuk'}
          </span>
        </div>

        {/* Mobile bağlantı dot'ı */}
        <div
          className="md:hidden w-9 h-9 inline-flex items-center justify-center"
          title={wsConnected ? 'Bağlı' : 'Kopuk'}
        >
          <span className="relative flex w-2.5 h-2.5">
            {wsConnected && (
              <span className="absolute inline-flex h-full w-full rounded-full bg-brand-success opacity-60 animate-ping" />
            )}
            <span
              className={`relative inline-flex w-2.5 h-2.5 rounded-full ${
                wsConnected ? 'bg-brand-success' : 'bg-brand-danger'
              }`}
            />
          </span>
        </div>
      </div>
    </header>
  );
}