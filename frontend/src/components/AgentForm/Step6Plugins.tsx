import { useEffect, useState } from 'react';
import { Icon } from '../Icon';
import { StepHeading } from './FormComponents';
import { api } from '@/api/client';
import { getMcpLogo } from '../../utils/modelHelper';

export function Step6Plugins() {
  const [mcpServers, setMcpServers] = useState<any[]>([]);
  const [plugins, setPlugins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.listMcpServers(), api.listPlugins()])
      .then(([serversResp, plugs]) => {
        const mcpList = Array.isArray(serversResp)
          ? serversResp
          : (serversResp && Array.isArray(serversResp.servers) ? serversResp.servers : []);
        setMcpServers(mcpList.filter((s: any) => s.enabled));
        setPlugins(plugs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-brand-muted">
        <Icon name="progress_activity" size={20} className="animate-spin mr-2" />
        <span>Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-xl mx-auto animate-step-in">
      <StepHeading
        title="Plugins ve MCP Yetenekleri"
        desc="Bu ajanin kullanabilecegi eklenti (plugin) ve MCP sunucu listesi."
      />

      <div className="rounded border border-brand-accent/20 bg-brand-accent/5 p-3 text-xs flex items-start gap-2">
        <Icon name="info" size={16} className="text-brand-accent flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-brand-accent">Bilgi:</strong> Eklentiler ve MCP sunucuları globaldir. Bunları etkinleştirmek veya devre dışı bırakmak için üst menüdeki <strong>Ayarlar &gt; Eklentiler &amp; MCP</strong> sekmesini kullanabilirsiniz.
        </div>
      </div>

      <div className="space-y-3">
        {/* MCP Ozet */}
        <div className="rounded border border-brand-border bg-brand-bg/30 p-3 space-y-2">
          <div className="text-[11px] font-bold text-brand-text uppercase tracking-wider">Aktif MCP Sunuculari</div>
          {mcpServers.length === 0 ? (
            <div className="text-[11px] text-brand-mutedSoft italic">Aktif MCP sunucusu bulunmamaktadir.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {mcpServers.map((s) => {
                const logo = getMcpLogo(s.name);
                return (
                  <span key={s.name} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border border-brand-border bg-brand-panel text-brand-text shadow-sm transition-all hover:border-brand-accent/20">
                    {logo ? (
                      <img src={logo} alt={s.name} className="w-3.5 h-3.5 object-contain" />
                    ) : (
                      <Icon name="dns" size={11} className="text-brand-accent" />
                    )}
                    {s.name}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Plugins Ozet */}
        <div className="rounded border border-brand-border bg-brand-bg/30 p-3 space-y-2">
          <div className="text-[11px] font-bold text-brand-text uppercase tracking-wider">Sistem Eklentileri (Python Plugins)</div>
          {plugins.length === 0 ? (
            <div className="text-[11px] text-brand-mutedSoft italic">Eklenti bulunmamaktadir.</div>
          ) : (
            <div className="space-y-1.5">
              {plugins.map((p) => (
                <div key={p.name} className="text-[11px] flex items-center justify-between text-brand-textSoft font-mono">
                  <span>{p.name}</span>
                  <span className="text-[10px] text-brand-mutedSoft font-sans">({p.loaded_tools.length} tool)</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
