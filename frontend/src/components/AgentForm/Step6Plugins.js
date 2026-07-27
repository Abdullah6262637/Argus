import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Icon } from '../Icon';
import { StepHeading } from './FormComponents';
import { api } from '@/api/client';
import { getMcpLogo } from '../../utils/modelHelper';
export function Step6Plugins() {
    const [mcpServers, setMcpServers] = useState([]);
    const [plugins, setPlugins] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        Promise.all([api.listMcpServers(), api.listPlugins()])
            .then(([serversResp, plugs]) => {
            const mcpList = Array.isArray(serversResp)
                ? serversResp
                : (serversResp && Array.isArray(serversResp.servers) ? serversResp.servers : []);
            setMcpServers(mcpList.filter((s) => s.enabled));
            setPlugins(plugs);
        })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);
    if (loading) {
        return (_jsxs("div", { className: "flex items-center justify-center h-32 text-brand-muted", children: [_jsx(Icon, { name: "progress_activity", size: 20, className: "animate-spin mr-2" }), _jsx("span", { children: "Y\u00FCkleniyor..." })] }));
    }
    return (_jsxs("div", { className: "space-y-4 max-w-xl mx-auto animate-step-in", children: [_jsx(StepHeading, { title: "Plugins ve MCP Yetenekleri", desc: "Bu ajanin kullanabilecegi eklenti (plugin) ve MCP sunucu listesi." }), _jsxs("div", { className: "rounded border border-brand-accent/20 bg-brand-accent/5 p-3 text-xs flex items-start gap-2", children: [_jsx(Icon, { name: "info", size: 16, className: "text-brand-accent flex-shrink-0 mt-0.5" }), _jsxs("div", { children: [_jsx("strong", { className: "text-brand-accent", children: "Bilgi:" }), " Eklentiler ve MCP sunucular\u0131 globaldir. Bunlar\u0131 etkinle\u015Ftirmek veya devre d\u0131\u015F\u0131 b\u0131rakmak i\u00E7in \u00FCst men\u00FCdeki ", _jsx("strong", { children: "Ayarlar > Eklentiler & MCP" }), " sekmesini kullanabilirsiniz."] })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "rounded border border-brand-border bg-brand-bg/30 p-3 space-y-2", children: [_jsx("div", { className: "text-[11px] font-bold text-brand-text uppercase tracking-wider", children: "Aktif MCP Sunuculari" }), mcpServers.length === 0 ? (_jsx("div", { className: "text-[11px] text-brand-mutedSoft italic", children: "Aktif MCP sunucusu bulunmamaktadir." })) : (_jsx("div", { className: "flex flex-wrap gap-2", children: mcpServers.map((s) => {
                                    const logo = getMcpLogo(s.name);
                                    return (_jsxs("span", { className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border border-brand-border bg-brand-panel text-brand-text shadow-sm transition-all hover:border-brand-accent/20", children: [logo ? (_jsx("img", { src: logo, alt: s.name, className: "w-3.5 h-3.5 object-contain" })) : (_jsx(Icon, { name: "dns", size: 11, className: "text-brand-accent" })), s.name] }, s.name));
                                }) }))] }), _jsxs("div", { className: "rounded border border-brand-border bg-brand-bg/30 p-3 space-y-2", children: [_jsx("div", { className: "text-[11px] font-bold text-brand-text uppercase tracking-wider", children: "Sistem Eklentileri (Python Plugins)" }), plugins.length === 0 ? (_jsx("div", { className: "text-[11px] text-brand-mutedSoft italic", children: "Eklenti bulunmamaktadir." })) : (_jsx("div", { className: "space-y-1.5", children: plugins.map((p) => (_jsxs("div", { className: "text-[11px] flex items-center justify-between text-brand-textSoft font-mono", children: [_jsx("span", { children: p.name }), _jsxs("span", { className: "text-[10px] text-brand-mutedSoft font-sans", children: ["(", p.loaded_tools.length, " tool)"] })] }, p.name))) }))] })] })] }));
}
