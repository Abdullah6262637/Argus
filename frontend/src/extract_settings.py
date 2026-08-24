import os
import re

def extract_bracketed_block(text, start_idx):
    brace_start = text.find('{', start_idx)
    if brace_start == -1: return None, -1
    
    depth = 0
    in_string = False
    in_comment = False
    in_multiline_comment = False
    string_char = None
    i = brace_start
    while i < len(text):
        char = text[i]
        
        if in_comment:
            if char == '\n':
                in_comment = False
            i += 1
            continue
            
        if in_multiline_comment:
            if char == '*' and i + 1 < len(text) and text[i+1] == '/':
                in_multiline_comment = False
                i += 2
                continue
            i += 1
            continue
            
        if not in_string:
            if char == '/' and i + 1 < len(text) and text[i+1] == '/':
                in_comment = True
                i += 2
                continue
            if char == '/' and i + 1 < len(text) and text[i+1] == '*':
                in_multiline_comment = True
                i += 2
                continue
                
            if char in ["'", '"', '`']:
                in_string = True
                string_char = char
            elif char == '{':
                depth += 1
            elif char == '}':
                depth -= 1
                if depth == 0:
                    return text[start_idx:i+1]
        else:
            if char == '\\':
                i += 2
                continue
            if char == string_char:
                in_string = False
                
        i += 1
    return None

if __name__ == '__main__':
    src_path = r"c:\Users\HP\Desktop\argus\frontend\src\components\SettingsModal.tsx"
    with open(src_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    def get_comp(name, is_func=True):
        if is_func:
            pattern = re.compile(r'((?:export\s+)?function\s+' + name + r'\s*[\(<])')
        else:
            pattern = re.compile(r'((?:export\s+)?const\s+' + name + r'\s*=\s*)')
            
        match = pattern.search(content)
        if not match:
            print(f"NOT FOUND: {name}")
            return ""
        
        # We need to find the full type annotations for props which might be before the `{`
        block = extract_bracketed_block(content, match.start())
        if not block: return ""
        
        # if it's a const component, we might have a trailing semicolon that extract_bracketed_block didn't catch, but for functions it's fine.
        return block

    shared_dir = r"c:\Users\HP\Desktop\argus\frontend\src\components\settings\shared"
    tabs_dir = r"c:\Users\HP\Desktop\argus\frontend\src\components\settings\tabs"
    settings_dir = r"c:\Users\HP\Desktop\argus\frontend\src\components\settings"
    
    os.makedirs(shared_dir, exist_ok=True)
    os.makedirs(tabs_dir, exist_ok=True)

    # 1. PanelHeader
    panel_header = get_comp("PanelHeader")
    with open(os.path.join(shared_dir, "PanelHeader.tsx"), "w", encoding="utf-8") as f:
        f.write("import { Icon } from '../../Icon';\n\n")
        f.write("export " + panel_header.replace("function PanelHeader", "function PanelHeader") + "\n")

    # 2. FormField
    form_field = get_comp("FormField")
    with open(os.path.join(shared_dir, "FormField.tsx"), "w", encoding="utf-8") as f:
        f.write("import React from 'react';\nimport { Icon } from '../../Icon';\n\n")
        f.write("export " + form_field + "\n")

    # 3. KeyRow
    key_row = get_comp("KeyRow")
    with open(os.path.join(shared_dir, "KeyRow.tsx"), "w", encoding="utf-8") as f:
        f.write("import { useState } from 'react';\nimport { Icon } from '../../Icon';\nimport { FormField } from './FormField';\n\n")
        f.write("export " + key_row + "\n")

    # TABS
    
    # 4. ThemeTab
    theme_tab = get_comp("ThemeTab")
    theme_preview = get_comp("ThemePreview")
    with open(os.path.join(tabs_dir, "ThemeTab.tsx"), "w", encoding="utf-8") as f:
        f.write("import { THEMES, type ThemeId } from '@/hooks/useTheme';\n")
        f.write("import { useAppearance, type Density, type FontSize } from '@/hooks/useAppearance';\n")
        f.write("import { Icon } from '../../Icon';\n")
        f.write("import { PanelHeader } from '../shared/PanelHeader';\n\n")
        f.write("export " + theme_tab + "\n\n" + theme_preview + "\n")

    # 5. ApiKeysTab
    api_keys_tab = get_comp("ApiKeysTab")
    with open(os.path.join(tabs_dir, "ApiKeysTab.tsx"), "w", encoding="utf-8") as f:
        f.write("import { useEffect, useRef, useState } from 'react';\n")
        f.write("import { api } from '@/api/client';\n")
        f.write("import type { ConnectionTestResponse, ProviderName } from '@/types';\n")
        f.write("import { Icon } from '../../Icon';\n")
        f.write("import { PanelHeader } from '../shared/PanelHeader';\n")
        f.write("import { FormField } from '../shared/FormField';\n")
        f.write("import { KeyRow } from '../shared/KeyRow';\n\n")
        f.write("export " + api_keys_tab + "\n")

    # 6. SystemSettingsTab
    system_tab = get_comp("SystemSettingsTab")
    with open(os.path.join(tabs_dir, "SystemSettingsTab.tsx"), "w", encoding="utf-8") as f:
        f.write("import { useEffect, useRef, useState } from 'react';\n")
        f.write("import { api } from '@/api/client';\n")
        f.write("import { Icon } from '../../Icon';\n")
        f.write("import { PanelHeader } from '../shared/PanelHeader';\n")
        f.write("import { FormField } from '../shared/FormField';\n\n")
        f.write("export " + system_tab + "\n")

    # 7. SecuritySettingsTab
    security_tab = get_comp("SecuritySettingsTab")
    with open(os.path.join(tabs_dir, "SecuritySettingsTab.tsx"), "w", encoding="utf-8") as f:
        f.write("import { useEffect, useRef, useState } from 'react';\n")
        f.write("import { api } from '@/api/client';\n")
        f.write("import { Icon } from '../../Icon';\n")
        f.write("import { PanelHeader } from '../shared/PanelHeader';\n")
        f.write("import { FormField } from '../shared/FormField';\n\n")
        f.write("export " + security_tab + "\n")

    # 8. MediaSettingsTab
    media_tab = get_comp("MediaSettingsTab")
    with open(os.path.join(tabs_dir, "MediaSettingsTab.tsx"), "w", encoding="utf-8") as f:
        f.write("import { useEffect, useRef, useState } from 'react';\n")
        f.write("import { api } from '@/api/client';\n")
        f.write("import { Icon } from '../../Icon';\n")
        f.write("import { PanelHeader } from '../shared/PanelHeader';\n")
        f.write("import { FormField } from '../shared/FormField';\n\n")
        f.write("export " + media_tab + "\n")

    # 9. PluginsMcpTab
    plugins_mcp_tab = get_comp("PluginsMcpTab")
    plugin_item = get_comp("PluginItem")
    mcp_item = get_comp("McpItem")
    add_mcp_modal = get_comp("AddMcpServerModal")
    with open(os.path.join(tabs_dir, "PluginsMcpTab.tsx"), "w", encoding="utf-8") as f:
        f.write("import { useEffect, useRef, useState } from 'react';\n")
        f.write("import { api } from '@/api/client';\n")
        f.write("import type { AvailablePlugin, McpServerConfig } from '@/types';\n")
        f.write("import { Icon } from '../../Icon';\n")
        f.write("import { PanelHeader } from '../shared/PanelHeader';\n")
        f.write("import { FormField } from '../shared/FormField';\n\n")
        f.write("export " + plugins_mcp_tab + "\n\n" + plugin_item + "\n\n" + mcp_item + "\n\n" + add_mcp_modal + "\n")

    # 10. AgentsManagerTab
    agents_manager_tab = get_comp("AgentsManagerTab")
    with open(os.path.join(tabs_dir, "AgentsManagerTab.tsx"), "w", encoding="utf-8") as f:
        f.write("import { useEffect, useState } from 'react';\n")
        f.write("import { api } from '@/api/client';\n")
        f.write("import type { AgentInfo } from '@/types';\n")
        f.write("import { Icon } from '../../Icon';\n")
        f.write("import { PanelHeader } from '../shared/PanelHeader';\n")
        f.write("import { getModelLogo } from '../../utils/modelHelper';\n\n")
        f.write("export " + agents_manager_tab + "\n")

    # 11. ResetTab
    reset_tab = get_comp("ResetTab")
    with open(os.path.join(tabs_dir, "ResetTab.tsx"), "w", encoding="utf-8") as f:
        f.write("import { useState } from 'react';\n")
        f.write("import { Icon } from '../../Icon';\n")
        f.write("import { PanelHeader } from '../shared/PanelHeader';\n\n")
        f.write("export " + reset_tab + "\n")

    # 12. AboutTab
    about_tab = get_comp("AboutTab")
    with open(os.path.join(tabs_dir, "AboutTab.tsx"), "w", encoding="utf-8") as f:
        f.write("import { Icon } from '../../Icon';\n")
        f.write("import { PanelHeader } from '../shared/PanelHeader';\n\n")
        f.write("export " + about_tab + "\n")

    # 13. Index file
    with open(os.path.join(settings_dir, "index.ts"), "w", encoding="utf-8") as f:
        f.write("import { SettingsModal } from '../SettingsModal';\nexport default SettingsModal;\n")

    # Write the modified SettingsModal.tsx
    # We will just write a hardcoded version of SettingsModal.tsx since it's only 200-250 lines as requested
    
    main_content = """import { useEffect, useState } from 'react';
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
  onReloadAgents
}: SettingsModalProps) {
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
        className="w-full max-w-3xl max-h-[92vh] flex rounded-xl border border-brand-borderStrong bg-brand-panel shadow-2xl overflow-hidden animate-modal-in transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
      >
        {/* ---------- Sol Sidebar ---------- */}
        <aside className="w-56 flex-shrink-0 border-r border-brand-border bg-brand-bg/40 flex flex-col">
          {/* Sidebar Header */}
          <div className="px-4 py-4 border-b border-brand-border flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-accent to-brand-accentDim flex items-center justify-center text-brand-bg shadow-sm">
              <Icon name="settings" size={19} weight={550} filled />
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
          <div className="p-3 border-t border-brand-border text-[10px] text-brand-mutedSoft">
            <div className="flex items-center gap-1.5">
              <Icon name="verified" size={11} weight={500} />
              <span>Argus v0.4.0</span>
            </div>
          </div>
        </aside>

        {/* ---------- Sağ İçerik ---------- */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Üst başlık çubuğu */}
          <div className="h-12 px-5 flex items-center justify-between border-b border-brand-border bg-brand-panel">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-brand-text">
                {TAB_CONFIG[tab].label}
              </h3>
            </div>
            <button
              onClick={handleCancel}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-brand-muted hover:text-brand-text hover:bg-brand-panelAlt transition-all active:scale-95"
              aria-label="Kapat"
              title="Kapat (ESC)"
            >
              <Icon name="close" size={18} weight={550} />
            </button>
          </div>

          {/* İçerik */}
          <div className="flex-1 overflow-y-auto p-5">
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
              {tab === 'reset' && <ResetTab onRequestReset={onRequestReset} />}
              {tab === 'about' && <AboutTab />}
            </div>
          </div>

          {/* Alt bar */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-brand-border bg-brand-bg/40">
            <div className="text-[11px]">
              {isDirty ? (
                <span className="inline-flex items-center gap-1.5 text-brand-accent font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
                  Kaydedilmemiş değişiklikler
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-brand-mutedSoft">
                  <Icon name="check_circle" size={12} weight={500} filled />
                  Tüm değişiklikler güncel
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                className="h-9 px-3.5 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg border border-brand-border text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt hover:border-brand-borderStrong transition-all active:scale-95"
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
  danger = false
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full h-9 px-3 inline-flex items-center gap-2.5 text-xs font-semibold rounded-md transition-all active:scale-[0.98] ${
        active
          ? danger
            ? 'bg-brand-danger/15 text-brand-danger'
            : 'bg-brand-accent/15 text-brand-accent'
          : 'text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt'
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
"""

    with open(src_path, "w", encoding="utf-8") as f:
        f.write(main_content)

    print("Success")
