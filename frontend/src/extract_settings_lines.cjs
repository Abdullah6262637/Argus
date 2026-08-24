const fs = require('fs');
const path = require('path');

const srcPath = path.join('c:', 'Users', 'HP', 'Desktop', 'argus', 'frontend', 'src', 'components', 'SettingsModal.tsx');
const lines = fs.readFileSync(srcPath, 'utf8').split('\n');

function getLines(start, end) {
    return lines.slice(start - 1, end).join('\n');
}

const sharedDir = path.join('c:', 'Users', 'HP', 'Desktop', 'argus', 'frontend', 'src', 'components', 'settings', 'shared');
const tabsDir = path.join('c:', 'Users', 'HP', 'Desktop', 'argus', 'frontend', 'src', 'components', 'settings', 'tabs');
const settingsDir = path.join('c:', 'Users', 'HP', 'Desktop', 'argus', 'frontend', 'src', 'components', 'settings');

fs.mkdirSync(sharedDir, { recursive: true });
fs.mkdirSync(tabsDir, { recursive: true });

fs.writeFileSync(path.join(sharedDir, "PanelHeader.tsx"), "import { Icon } from '../../Icon';\n\nexport " + getLines(258, 281) + "\n");
fs.writeFileSync(path.join(sharedDir, "FormField.tsx"), "import React from 'react';\nimport { Icon } from '../../Icon';\n\nexport " + getLines(1395, 1414) + "\n");
fs.writeFileSync(path.join(sharedDir, "KeyRow.tsx"), "import { useState } from 'react';\nimport { Icon } from '../../Icon';\nimport { FormField } from './FormField';\n\nexport " + getLines(1284, 1391) + "\n");

fs.writeFileSync(path.join(tabsDir, "ThemeTab.tsx"), `import { THEMES, type ThemeId } from '@/hooks/useTheme';\nimport { useAppearance, type Density, type FontSize } from '@/hooks/useAppearance';\nimport { Icon } from '../../Icon';\nimport { PanelHeader } from '../shared/PanelHeader';\n\nexport ${getLines(287, 449)}\n\nexport ${getLines(451, 465)}\n`);

fs.writeFileSync(path.join(tabsDir, "ApiKeysTab.tsx"), `import { useEffect, useRef, useState } from 'react';\nimport { api } from '@/api/client';\nimport type { ConnectionTestResponse, ProviderName } from '@/types';\nimport { Icon } from '../../Icon';\nimport { PanelHeader } from '../shared/PanelHeader';\nimport { FormField } from '../shared/FormField';\nimport { KeyRow } from '../shared/KeyRow';\n\nexport ${getLines(471, 833)}\n`);

fs.writeFileSync(path.join(tabsDir, "SystemSettingsTab.tsx"), `import { useEffect, useRef, useState } from 'react';\nimport { api } from '@/api/client';\nimport { Icon } from '../../Icon';\nimport { PanelHeader } from '../shared/PanelHeader';\nimport { FormField } from '../shared/FormField';\n\nexport ${getLines(838, 992)}\n`);

fs.writeFileSync(path.join(tabsDir, "SecuritySettingsTab.tsx"), `import { useEffect, useRef, useState } from 'react';\nimport { api } from '@/api/client';\nimport { Icon } from '../../Icon';\nimport { PanelHeader } from '../shared/PanelHeader';\nimport { FormField } from '../shared/FormField';\n\nexport ${getLines(997, 1103)}\n`);

fs.writeFileSync(path.join(tabsDir, "MediaSettingsTab.tsx"), `import { useEffect, useRef, useState } from 'react';\nimport { api } from '@/api/client';\nimport { Icon } from '../../Icon';\nimport { PanelHeader } from '../shared/PanelHeader';\nimport { FormField } from '../shared/FormField';\n\nexport ${getLines(1108, 1280)}\n`);

fs.writeFileSync(path.join(tabsDir, "PluginsMcpTab.tsx"), `import { useEffect, useRef, useState } from 'react';\nimport { api } from '@/api/client';\nimport type { AvailablePlugin, McpServerConfig } from '@/types';\nimport { Icon } from '../../Icon';\nimport { PanelHeader } from '../shared/PanelHeader';\nimport { FormField } from '../shared/FormField';\n\nexport ${getLines(1689, 1943)}\n`);

fs.writeFileSync(path.join(tabsDir, "AgentsManagerTab.tsx"), `import { useEffect, useState } from 'react';\nimport { api } from '@/api/client';\nimport type { AgentInfo } from '@/types';\nimport { Icon } from '../../Icon';\nimport { PanelHeader } from '../shared/PanelHeader';\nimport { getModelLogo } from '../../utils/modelHelper';\n\nexport ${getLines(1947, 2111)}\n`);

fs.writeFileSync(path.join(tabsDir, "ResetTab.tsx"), `import { useState } from 'react';\nimport { Icon } from '../../Icon';\nimport { PanelHeader } from '../shared/PanelHeader';\n\nexport ${getLines(1418, 1496)}\n`);

fs.writeFileSync(path.join(tabsDir, "AboutTab.tsx"), `import { Icon } from '../../Icon';\nimport { PanelHeader } from '../shared/PanelHeader';\n\nexport ${getLines(1500, 1627)}\n\n${getLines(1628, 1653)}\n\n${getLines(1654, 1667)}\n\n${getLines(1668, 1685)}\n`);

fs.writeFileSync(path.join(settingsDir, "index.ts"), "import { SettingsModal } from '../SettingsModal';\nexport default SettingsModal;\n");

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

${getLines(35, 206)}

${getLines(212, 252)}

export default SettingsModal;
`;

fs.writeFileSync(srcPath, mainContent);

console.log("Extraction complete!");
