import { useEffect, useState } from 'react';
import { type ThemeId } from '@/hooks/useTheme';
import { Icon } from './Icon';

// Tabs
import { ThemeTab } from './settings/tabs/ThemeTab';
import { ApiKeysTab } from './settings/tabs/ApiKeysTab';
import { SystemSettingsTab } from './settings/tabs/SystemSettingsTab';
import { SecuritySettingsTab } from './settings/tabs/SecuritySettingsTab';
import { MediaSettingsTab } from './settings/tabs/MediaSettingsTab';
import { PluginsMcpTab } from './settings/tabs/PluginsMcpTab';
import { AgentsManagerTab } from './settings/tabs/AgentsManagerTab';
import { ResetTab } from './settings/tabs/ResetTab';
import { AboutTab } from './settings/tabs/AboutTab';

interface SettingsModalProps {
  theme: ThemeId;
  onChangeTheme: (t: ThemeId) => void;
  onClose: () => void;
  onRequestReset: () => void;
  initialTab?: TabId;
  onEditAgent?: (id: string) => void;
  onDeleteAgent?: (id: string) => void;
  onDuplicateAgent?: (id: string) => void;
  onReloadAgents?: () => void;
}

export type TabId = 'agents' | 'theme' | 'apikeys' | 'system' | 'security' | 'media' | 'plugins_mcp' | 'reset' | 'about';

const TAB_CONFIG: Record<TabId, { icon: string; label: string }> = {
  agents: { icon: 'smart_toy', label: 'Ajan Havuzu' },
  theme: { icon: 'palette', label: 'Görünüm' },
  apikeys: { icon: 'vpn_key', label: 'API Anahtarları' },
  system: { icon: 'settings', label: 'Sistem & Limitler' },
  security: { icon: 'security', label: 'Güvenlik & Sandbox' },
  media: { icon: 'volume_up', label: 'Ses & Tarayıcı' },
  plugins_mcp: { icon: 'extension', label: 'Eklentiler & MCP' },
  reset: { icon: 'restart_alt', label: 'Sıfırla' },
  about: { icon: 'info', label: 'Hakkında' }
};

export function SettingsModal({
  theme,
  onChangeTheme,
  onClose,
  onRequestReset,
  initialTab,
  onEditAgent,
  onDeleteAgent,
  onDuplicateAgent,
  onReloadAgents}: SettingsModalProps) {
  const [tab, setTab] = useState<TabId>(initialTab ?? 'agents');

  const [initialTheme] = useState<ThemeId>(theme);
  const [pendingTheme, setPendingTheme] = useState<ThemeId>(theme);
  const isDirty = pendingTheme !== initialTheme;

  const [contentHeight] = useState<number>(620);

  useEffect(() => {
    onChangeTheme(pendingTheme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingTheme]);

  const handleSave = () => onClose();
  const handleCancel = () => {
    onChangeTheme(initialTheme);
    onClose();
  };

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancel();
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-backdrop-in">
      <div 
        style={{ height: `${contentHeight}px` }}
        className="w-full max-w-3xl max-h-[92vh] flex rounded-2xl bg-brand-panel shadow-2xl overflow-hidden animate-modal-in transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
      >
        {/* ---------- Sol Sidebar ---------- */}
        <aside className="w-56 flex-shrink-0 bg-brand-bg/40 flex flex-col">
          {/* Sidebar Header */}
          <div className="px-4 py-4 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-accent/15 flex items-center justify-center text-brand-accent shadow-sm">
              <Icon name="settings" size={17} weight={550} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-brand-text leading-tight">
                Ayarlar
              </h2>
              <p className="text-[10px] text-brand-mutedSoft mt-0.5">
                Tercihler & yapılandırma
              </p>
            </div>
          </div>

          {/* Tab Listesi */}
          <nav className="flex-1 p-2 space-y-0.5">
            {(Object.keys(TAB_CONFIG) as TabId[]).map((t) => (
              <SidebarTab
                key={t}
                active={tab === t}
                onClick={() => setTab(t)}
                icon={TAB_CONFIG[t].icon}
                label={TAB_CONFIG[t].label}
                danger={t === 'reset'}
              />
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 text-[10px] text-brand-mutedSoft">
            <div className="flex items-center gap-1.5">
              <Icon name="verified" size={11} weight={500} />
              <span>Argus v0.4.0</span>
            </div>
          </div>
        </aside>

        {/* ---------- Sağ İçerik ---------- */}
        <div className="flex-1 flex flex-col min-w-0 bg-brand-panel">
          {/* Üst başlık çubuğu */}
          <div className="h-12 px-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-brand-text">
                {TAB_CONFIG[tab].label}
              </h3>
            </div>
            <button
              onClick={handleCancel}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-brand-mutedSoft hover:text-brand-text hover:bg-brand-panelAlt transition-all active:scale-95"
              aria-label="Kapat"
              title="Kapat (ESC)"
            >
              <Icon name="close" size={18} weight={550} />
            </button>
          </div>

          {/* İçerik */}
          <div className="flex-1 overflow-y-auto px-6 py-2">
            <div key={tab} className="animate-step-in">
              {tab === 'agents' && (
                <AgentsManagerTab
                  onEditAgent={(id) => {
                    onEditAgent?.(id);
                    onClose();
                  }}
                  onDeleteAgent={onDeleteAgent}
                  onDuplicateAgent={onDuplicateAgent}
                  onReloadAgents={onReloadAgents}
                />
              )}
              {tab === 'theme' && (
                <ThemeTab
                  theme={pendingTheme}
                  onChangeTheme={setPendingTheme}
                  initialTheme={initialTheme}
                />
              )}
              {tab === 'apikeys' && <ApiKeysTab />}
              {tab === 'system' && <SystemSettingsTab />}
              {tab === 'security' && <SecuritySettingsTab />}
              {tab === 'media' && <MediaSettingsTab />}
              {tab === 'plugins_mcp' && <PluginsMcpTab />}
              {tab === 'reset' && (
                <ResetTab
                  onRequestReset={() => {
                    onClose();
                    onRequestReset();
                  }}
                />
              )}
              {tab === 'about' && <AboutTab />}
            </div>
          </div>

          {/* Alt eylem çubuğu */}
          <div className="h-14 px-6 flex items-center justify-between">
            <div className="text-[11px] text-brand-mutedSoft flex items-center gap-1.5 font-mono">
              {isDirty ? (
                <span className="text-brand-accent font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
                  Kaydedilmemiş tema değişikliği
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Icon name="check" size={12} weight={600} className="text-brand-success" />
                  Tüm değişiklikler güncel
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                className="h-9 px-3.5 inline-flex items-center gap-1 text-xs font-semibold rounded-lg text-brand-mutedSoft hover:text-brand-text hover:bg-brand-panelAlt transition-all active:scale-95"
              >
                <Icon name="close" size={14} weight={550} />
                İptal
              </button>
              <button
                onClick={handleSave}
                disabled={!isDirty}
                className="h-9 px-4 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg bg-brand-accent text-brand-bg hover:bg-brand-accentDim disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
              >
                <Icon name="save" size={14} weight={650} filled />
                Kaydet
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarTab({
  active,
  onClick,
  icon,
  label,
  danger = false}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full h-9 px-3 inline-flex items-center gap-2.5 text-xs font-semibold rounded-lg transition-all active:scale-[0.98] ${
        active
          ? danger
            ? 'bg-brand-danger/15 text-brand-danger'
            : 'bg-brand-accent/15 text-brand-accent'
          : 'text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt/60'
      }`}
    >
      <Icon
        name={icon}
        size={15}
        weight={active ? 600 : 500}
        filled={active}
      />
      <span className="flex-1 text-left">{label}</span>
      {active && (
        <Icon
          name="chevron_right"
          size={14}
          weight={550}
          className="opacity-70"
        />
      )}
    </button>
  );
}

export default SettingsModal;
