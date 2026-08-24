const fs = require('fs');
const path = require('path');

function extractBracketedBlock(text, startIdx) {
    const braceStart = text.indexOf('{', startIdx);
    if (braceStart === -1) return null;
    
    let depth = 0;
    let inString = false;
    let inComment = false;
    let inMultilineComment = false;
    let stringChar = null;
    
    let i = braceStart;
    while (i < text.length) {
        const char = text[i];
        
        if (inComment) {
            if (char === '\n') {
                inComment = false;
            }
            i++;
            continue;
        }
        
        if (inMultilineComment) {
            if (char === '*' && text[i+1] === '/') {
                inMultilineComment = false;
                i += 2;
                continue;
            }
            i++;
            continue;
        }
        
        if (!inString) {
            if (char === '/' && text[i+1] === '/') {
                inComment = true;
                i += 2;
                continue;
            }
            if (char === '/' && text[i+1] === '*') {
                inMultilineComment = true;
                i += 2;
                continue;
            }
            
            if (char === "'" || char === '"' || char === '`') {
                inString = true;
                stringChar = char;
            } else if (char === '{') {
                depth++;
            } else if (char === '}') {
                depth--;
                if (depth === 0) {
                    return text.substring(startIdx, i + 1);
                }
            }
        } else {
            if (char === '\\') {
                i += 2;
                continue;
            }
            if (char === stringChar) {
                inString = false;
            }
        }
        i++;
    }
    return null;
}

const srcPath = path.join('c:', 'Users', 'HP', 'Desktop', 'argus', 'frontend', 'src', 'components', 'SettingsModal.tsx');
const content = fs.readFileSync(srcPath, 'utf8');

function getComp(name, isFunc = true) {
    const regex = isFunc ? new RegExp(`(?:export\\s+)?function\\s+${name}\\s*[\\(<]`) : new RegExp(`(?:export\\s+)?const\\s+${name}\\s*=\\s*`);
    const match = regex.exec(content);
    if (!match) {
        console.log(`NOT FOUND: ${name}`);
        return "";
    }
    const block = extractBracketedBlock(content, match.index);
    if (!block) return "";
    return block;
}

const sharedDir = path.join('c:', 'Users', 'HP', 'Desktop', 'argus', 'frontend', 'src', 'components', 'settings', 'shared');
const tabsDir = path.join('c:', 'Users', 'HP', 'Desktop', 'argus', 'frontend', 'src', 'components', 'settings', 'tabs');
const settingsDir = path.join('c:', 'Users', 'HP', 'Desktop', 'argus', 'frontend', 'src', 'components', 'settings');

fs.mkdirSync(sharedDir, { recursive: true });
fs.mkdirSync(tabsDir, { recursive: true });

// 1. PanelHeader
let panelHeader = getComp("PanelHeader");
fs.writeFileSync(path.join(sharedDir, "PanelHeader.tsx"), "import { Icon } from '../../Icon';\n\nexport " + panelHeader + "\n");

// 2. FormField
let formField = getComp("FormField");
fs.writeFileSync(path.join(sharedDir, "FormField.tsx"), "import React from 'react';\nimport { Icon } from '../../Icon';\n\nexport " + formField + "\n");

// 3. KeyRow
let keyRow = getComp("KeyRow");
fs.writeFileSync(path.join(sharedDir, "KeyRow.tsx"), "import { useState } from 'react';\nimport { Icon } from '../../Icon';\nimport { FormField } from './FormField';\n\nexport " + keyRow + "\n");

// TABS
let themeTab = getComp("ThemeTab");
let themePreview = getComp("ThemePreview");
fs.writeFileSync(path.join(tabsDir, "ThemeTab.tsx"), `import { THEMES, type ThemeId } from '@/hooks/useTheme';
import { useAppearance, type Density, type FontSize } from '@/hooks/useAppearance';
import { Icon } from '../../Icon';
import { PanelHeader } from '../shared/PanelHeader';

export ${themeTab}

${themePreview}
`);

let apiKeysTab = getComp("ApiKeysTab");
fs.writeFileSync(path.join(tabsDir, "ApiKeysTab.tsx"), `import { useEffect, useRef, useState } from 'react';
import { api } from '@/api/client';
import type { ConnectionTestResponse, ProviderName } from '@/types';
import { Icon } from '../../Icon';
import { PanelHeader } from '../shared/PanelHeader';
import { FormField } from '../shared/FormField';
import { KeyRow } from '../shared/KeyRow';

export ${apiKeysTab}
`);

let systemTab = getComp("SystemSettingsTab");
fs.writeFileSync(path.join(tabsDir, "SystemSettingsTab.tsx"), `import { useEffect, useRef, useState } from 'react';
import { api } from '@/api/client';
import { Icon } from '../../Icon';
import { PanelHeader } from '../shared/PanelHeader';
import { FormField } from '../shared/FormField';

export ${systemTab}
`);

let securityTab = getComp("SecuritySettingsTab");
fs.writeFileSync(path.join(tabsDir, "SecuritySettingsTab.tsx"), `import { useEffect, useRef, useState } from 'react';
import { api } from '@/api/client';
import { Icon } from '../../Icon';
import { PanelHeader } from '../shared/PanelHeader';
import { FormField } from '../shared/FormField';

export ${securityTab}
`);

let mediaTab = getComp("MediaSettingsTab");
fs.writeFileSync(path.join(tabsDir, "MediaSettingsTab.tsx"), `import { useEffect, useRef, useState } from 'react';
import { api } from '@/api/client';
import { Icon } from '../../Icon';
import { PanelHeader } from '../shared/PanelHeader';
import { FormField } from '../shared/FormField';

export ${mediaTab}
`);

let pluginsMcpTab = getComp("PluginsMcpTab");
fs.writeFileSync(path.join(tabsDir, "PluginsMcpTab.tsx"), `import { useEffect, useRef, useState } from 'react';
import { api } from '@/api/client';
import type { AvailablePlugin, McpServerConfig } from '@/types';
import { Icon } from '../../Icon';
import { PanelHeader } from '../shared/PanelHeader';
import { FormField } from '../shared/FormField';

export ${pluginsMcpTab}
`);

let agentsManagerTab = getComp("AgentsManagerTab");
fs.writeFileSync(path.join(tabsDir, "AgentsManagerTab.tsx"), `import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import type { AgentInfo } from '@/types';
import { Icon } from '../../Icon';
import { PanelHeader } from '../shared/PanelHeader';
import { getModelLogo } from '../../utils/modelHelper';

export ${agentsManagerTab}
`);

let resetTab = getComp("ResetTab");
fs.writeFileSync(path.join(tabsDir, "ResetTab.tsx"), `import { useState } from 'react';
import { Icon } from '../../Icon';
import { PanelHeader } from '../shared/PanelHeader';

export ${resetTab}
`);

let aboutTab = getComp("AboutTab");
let aboutSection = getComp("AboutSection");
let feat = getComp("Feat");
let infoRow = getComp("InfoRow");
fs.writeFileSync(path.join(tabsDir, "AboutTab.tsx"), `import { Icon } from '../../Icon';
import { PanelHeader } from '../shared/PanelHeader';

export ${aboutTab}

${aboutSection}
${feat}
${infoRow}
`);

fs.writeFileSync(path.join(settingsDir, "index.ts"), `import { SettingsModal } from '../SettingsModal';\nexport default SettingsModal;\n`);

const mainContent = `import { useEffect, useState } from 'react';
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
        style={{ height: \`\${contentHeight}px\` }}
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
      className={\`w-full h-9 px-3 inline-flex items-center gap-2.5 text-xs font-semibold rounded-md transition-all active:scale-[0.98] \${
        active
          ? danger
            ? 'bg-brand-danger/15 text-brand-danger'
            : 'bg-brand-accent/15 text-brand-accent'
          : 'text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt'
      }\`}
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
`;

fs.writeFileSync(srcPath, mainContent);

console.log("Extraction complete!");
