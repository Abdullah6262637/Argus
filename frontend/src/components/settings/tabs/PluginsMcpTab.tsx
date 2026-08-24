import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { Icon } from '../../Icon';
import { PanelHeader } from '../shared/PanelHeader';
import { ToggleSwitch } from '../shared/ToggleSwitch';

interface McpServerStatus {
  name: string;
  config_enabled: boolean;
  runtime_status: 'disconnected' | 'connecting' | 'connected' | 'error';
  tool_count: number;
  error: string | null;
  connected_at: string | null;
  description: string;
  command: string[];
}

interface PluginItem {
  id: string;
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  author?: string;
  skills_count?: number;
}

const STATUS_META: Record<string, { label: string; color: string; icon: string }> = {
  connected: { label: 'Bağlı', color: 'text-brand-success', icon: 'check_circle' },
  connecting: { label: 'Bağlanıyor', color: 'text-brand-accent', icon: 'progress_activity' },
  error: { label: 'Hata', color: 'text-brand-danger', icon: 'error' },
  disconnected: { label: 'Bağlı Değil', color: 'text-brand-mutedSoft', icon: 'circle' },
};

const MCP_ICONS: Record<string, string> = {
  filesystem: 'folder',
  github: 'code',
  sqlite: 'database',
  'brave-search': 'search',
  puppeteer: 'web',
  slack: 'forum',
  memory: 'psychology',
  fetch: 'download',
  postgres: 'database',
  sentry: 'bug_report',
  docker: 'directions_boat',
  aws: 'cloud',
};

export function PluginsMcpTab() {
  const [loading, setLoading] = useState(true);
  const [mcpServers, setMcpServers] = useState<McpServerStatus[]>([]);
  const [plugins, setPlugins] = useState<PluginItem[]>([]);
  const [togglingServer, setTogglingServer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const mcpRes = await api.listMcpServers();
      if (mcpRes && mcpRes.servers) {
        setMcpServers(
          mcpRes.servers.map((s) => ({
            ...s,
            runtime_status: s.runtime_status as McpServerStatus['runtime_status'],
          })),
        );
      } else {
        setMcpServers([]);
      }

      const plugRes = await api.listPlugins();
      if (Array.isArray(plugRes)) {
        setPlugins(plugRes.map((p) => ({
          id: p.name,
          name: p.name,
          version: '1.0.0',
          description: `${(p.loaded_tools || []).length} aktif araç yüklendi`,
          enabled: p.ok ?? true,
        })));
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? `MCP verileri yüklenemedi: ${err.message}`
          : 'MCP verileri yüklenemedi',
      );
      setMcpServers([]);
      setPlugins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleMcp = async (name: string, currentEnabled: boolean) => {
    setTogglingServer(name);
    setError(null);
    try {
      const res = await api.toggleMcpServer(name, !currentEnabled);

      setMcpServers((prev) =>
        prev.map((s) => {
          if (s.name !== name) return s;
          return {
            ...s,
            config_enabled: !currentEnabled,
            runtime_status: !currentEnabled
              ? (res.ok ? 'connected' : 'error')
              : 'disconnected',
            tool_count: res.tool_count || 0,
            error: res.error || null,
          };
        }),
      );

      if (res.error) {
        setError(`${name}: ${res.error}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setTogglingServer(null);
    }
  };

  const handleTogglePlugin = (id: string, current: boolean) => {
    setPlugins((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !current } : p)),
    );
  };

  if (loading) return <div className="text-center text-xs text-brand-muted py-10">Yükleniyor...</div>;

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Eklentiler & MCP Sunucuları"
        description="Model Context Protocol (MCP) bağlantılarını ve sistem eklentilerini yönetin."
        icon="extension"
      />

      {error && (
        <div className="p-2.5 rounded-lg bg-brand-danger/10 text-brand-danger text-xs flex items-center gap-2">
          <Icon name="error" size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* MCP Servers Section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Icon name="dns" size={16} className="text-brand-accent" />
          <h4 className="text-xs font-semibold text-brand-text">Model Context Protocol (MCP) Sunucuları</h4>
        </div>

        {mcpServers.length === 0 && !loading && (
          <div className="text-center py-6 text-xs text-brand-mutedSoft">
            <Icon name="hub" size={24} className="text-brand-mutedSoft/50 mb-2" />
            <p>Henüz yapılandırılmış MCP sunucusu yok.</p>
            <p className="mt-1 text-[10px]">agents/mcp_servers.yaml dosyasını düzenleyin.</p>
          </div>
        )}

        <div className="space-y-1">
          {mcpServers.map((srv) => {
            const isToggling = togglingServer === srv.name;
            const statusMeta = STATUS_META[srv.runtime_status] || STATUS_META.disconnected;
            const iconName = MCP_ICONS[srv.name] || 'hub';

            return (
              <div
                key={srv.name}
                className="py-2.5 px-2.5 rounded-lg hover:bg-brand-panelAlt/40 transition-all duration-200"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Server Icon */}
                    <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-brand-panelAlt/60">
                      <img
                        src={`/mcp/${srv.name}.png`}
                        alt={srv.name}
                        className="w-4.5 h-4.5 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fb = document.getElementById(`mcp-fb-${srv.name}`);
                          if (fb) fb.style.display = 'flex';
                        }}
                      />
                      <div
                        id={`mcp-fb-${srv.name}`}
                        style={{ display: 'none' }}
                        className="text-brand-accent flex items-center justify-center"
                      >
                        <Icon name={iconName} size={16} />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-brand-text capitalize">{srv.name}</span>

                        {/* Runtime Status Badge */}
                        <span className={`inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider font-bold ${statusMeta.color}`}>
                          <Icon
                            name={statusMeta.icon}
                            size={10}
                            filled={srv.runtime_status === 'connected'}
                            className={srv.runtime_status === 'connecting' ? 'animate-spin-slow' : ''}
                          />
                          {statusMeta.label}
                        </span>

                        {/* Tool Count */}
                        {srv.tool_count > 0 && (
                          <span className="text-[9px] font-mono text-brand-mutedSoft bg-brand-panelAlt/60 px-1.5 py-0.5 rounded">
                            {srv.tool_count} araç
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-brand-mutedSoft truncate mt-0.5">
                        {srv.error || srv.description || srv.command.join(' ')}
                      </div>
                    </div>
                  </div>

                  <ToggleSwitch
                    checked={srv.config_enabled}
                    disabled={isToggling}
                    onChange={() => handleToggleMcp(srv.name, srv.config_enabled)}
                    title={srv.config_enabled ? 'Devre dışı bırak' : 'Etkinleştir'}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Plugins Section */}
      {plugins.length > 0 && (
        <section className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <Icon name="extension" size={16} className="text-brand-accent" />
            <h4 className="text-xs font-semibold text-brand-text">Yüklü Sistem Eklentileri</h4>
          </div>

          <div className="space-y-1">
            {plugins.map((plg) => (
              <div
                key={plg.id}
                className="py-2 px-2 rounded-lg hover:bg-brand-panelAlt/40 transition-all duration-200"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-brand-accent">
                      <Icon name="bolt" size={16} filled />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-brand-text">{plg.name}</span>
                        <span className="text-[10px] font-mono text-brand-mutedSoft font-medium">
                          v{plg.version}
                        </span>
                      </div>
                      <div className="text-[11px] text-brand-mutedSoft truncate">{plg.description}</div>
                    </div>
                  </div>

                  <ToggleSwitch
                    checked={plg.enabled}
                    onChange={() => handleTogglePlugin(plg.id, plg.enabled)}
                    title={plg.enabled ? 'Devre dışı bırak' : 'Etkinleştir'}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
