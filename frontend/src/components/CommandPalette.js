import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Sprint E.7: Komut Paleti (Ctrl+K) — fuzzy search ile hizli aksiyonlar
import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from './Icon';
export function CommandPalette({ open, onClose, agents, onSelectAgent, onCreateAgent, onNewConversation, onOpenSettings, onOpenWorkflows, onReloadAgents, onChangeTheme, onChangeDensity, onChangeFontSize, onEditAgent, onExportChat, onDeleteAgent, onDuplicateAgent, onToggleAgentActive, onExportAgentConfig, onDeleteConversation, onToggleSystemPanel, onExportChatMD, onShowShortcuts }) {
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef(null);
    // Modal acilinca odakla
    useEffect(() => {
        if (open) {
            setQuery('');
            setActiveIndex(0);
            setTimeout(() => inputRef.current?.focus(), 30);
        }
    }, [open]);
    // ESC ile kapat
    useEffect(() => {
        if (!open)
            return;
        const onKey = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);
    // Tum komutlar
    const allCommands = useMemo(() => {
        const list = [
            // --- Aksiyonlar ---
            {
                id: 'new-agent',
                label: 'Aksiyon: Yeni uzman ajan oluştur',
                shortcut: 'Ctrl+Shift+N',
                icon: 'add_circle',
                group: 'Aksiyon',
                run: onCreateAgent
            },
            {
                id: 'new-chat',
                label: 'Aksiyon: Yeni sohbet başlat (Sohbeti Temizle)',
                shortcut: 'Ctrl+N',
                icon: 'forum',
                group: 'Aksiyon',
                run: onNewConversation
            },
            {
                id: 'reload-agents',
                label: 'Aksiyon: Ajanları config dosyasından yeniden yükle',
                shortcut: 'Ctrl+Shift+U',
                icon: 'refresh',
                group: 'Aksiyon',
                run: onReloadAgents
            },
            {
                id: 'export-chat',
                label: 'Aksiyon: Sohbet geçmişini dışa aktar (JSON)',
                shortcut: 'Ctrl+Shift+E',
                icon: 'download',
                group: 'Aksiyon',
                run: () => onExportChat?.()
            },
            {
                id: 'export-chat-md',
                label: 'Aksiyon: Sohbet geçmişini Markdown (.md) olarak indir',
                shortcut: 'Ctrl+Shift+M',
                icon: 'article',
                group: 'Aksiyon',
                run: () => onExportChatMD?.()
            },
            {
                id: 'delete-conversation',
                label: 'Aksiyon: Mevcut sohbet geçmişini tamamen temizle ve sil',
                shortcut: 'Ctrl+Shift+Backspace',
                icon: 'delete_sweep',
                group: 'Aksiyon',
                run: () => onDeleteConversation?.()
            },
            {
                id: 'show-shortcuts',
                label: 'Aksiyon: Klavye Kısayolları yardım kılavuzunu görüntüle',
                shortcut: 'Ctrl+?',
                icon: 'keyboard',
                group: 'Aksiyon',
                run: () => onShowShortcuts?.()
            },
            {
                id: 'docs-api',
                label: 'Aksiyon: FastAPI API Dokümantasyonunu Aç (Docs)',
                shortcut: 'Ctrl+Shift+D',
                icon: 'api',
                group: 'Aksiyon',
                run: () => window.open('http://127.0.0.1:8000/docs', '_blank')
            },
            {
                id: 'github-repo',
                label: 'Aksiyon: Argus GitHub Kod Deposunu Ziyaret Et',
                shortcut: 'Ctrl+Shift+G',
                icon: 'code',
                group: 'Aksiyon',
                run: () => window.open('https://github.com/Abdullah6262637/Argus', '_blank')
            },
            {
                id: 'help-guide',
                label: 'Aksiyon: Kullanım kılavuzunu görüntüle (Hakkında)',
                shortcut: 'Ctrl+Shift+H',
                icon: 'help',
                group: 'Aksiyon',
                run: () => onOpenSettings('about')
            },
            // --- Sayfalar & Modallar ---
            {
                id: 'settings-agents',
                label: 'Navigasyon: Ajan Havuzu ve Yönetim panelini aç (Pasif Ajanları Aktifleştir)',
                shortcut: 'Ctrl+Alt+M',
                icon: 'smart_toy',
                group: 'Sayfa',
                run: () => onOpenSettings('agents')
            },
            {
                id: 'settings-theme',
                label: 'Navigasyon: Görünüm & Tema ayarlarını aç',
                shortcut: 'Ctrl+,',
                icon: 'palette',
                group: 'Sayfa',
                run: () => onOpenSettings('theme')
            },
            {
                id: 'settings-apikeys',
                label: 'Navigasyon: API Anahtarları ayarlarını aç',
                shortcut: 'Ctrl+Alt+A',
                icon: 'vpn_key',
                group: 'Sayfa',
                run: () => onOpenSettings('apikeys')
            },
            {
                id: 'settings-plugins',
                label: 'Navigasyon: Eklentiler & MCP sunucu yönetimini aç',
                shortcut: 'Ctrl+Alt+P',
                icon: 'extension',
                group: 'Sayfa',
                run: () => onOpenSettings('plugins_mcp')
            },
            {
                id: 'settings-reset',
                label: 'Navigasyon: Sistem sıfırlama panelini aç',
                shortcut: 'Ctrl+Alt+R',
                icon: 'restart_alt',
                group: 'Sayfa',
                run: () => onOpenSettings('reset')
            },
            {
                id: 'settings-about',
                label: 'Navigasyon: Sürüm & Hakkında sayfasını aç',
                shortcut: 'Ctrl+Alt+I',
                icon: 'info',
                group: 'Sayfa',
                run: () => onOpenSettings('about')
            },
            {
                id: 'toggle-system-panel',
                label: 'Navigasyon: Sistem Sağlık & Canlı Log Panelini Aç/Kapat',
                shortcut: 'Ctrl+Alt+L',
                icon: 'monitoring',
                group: 'Sayfa',
                run: () => onToggleSystemPanel?.()
            },
            // --- Temalar ---
            {
                id: 'theme-midnight',
                label: 'Tema: Koyu Midnight temasını seç',
                shortcut: 'Ctrl+Shift+1',
                icon: 'dark_mode',
                group: 'Sayfa',
                run: () => onChangeTheme?.('midnight')
            },
            {
                id: 'theme-sunset',
                label: 'Tema: Sunset (Turuncu) temasını seç',
                shortcut: 'Ctrl+Shift+2',
                icon: 'light_mode',
                group: 'Sayfa',
                run: () => onChangeTheme?.('sunset')
            },
            {
                id: 'theme-forest',
                label: 'Tema: Forest (Yeşil) temasını seç',
                shortcut: 'Ctrl+Shift+3',
                icon: 'forest',
                group: 'Sayfa',
                run: () => onChangeTheme?.('forest')
            },
            {
                id: 'theme-mono',
                label: 'Tema: Klasik Mono (Renksiz) temayı seç',
                shortcut: 'Ctrl+Shift+4',
                icon: 'contrast',
                group: 'Sayfa',
                run: () => onChangeTheme?.('mono')
            },
            // --- Görünüm & Düzen ---
            {
                id: 'density-normal',
                label: 'Görünüm: Normal arayüz yerleşimi (Cozy)',
                shortcut: 'Ctrl+Shift+5',
                icon: 'view_cozy',
                group: 'Sayfa',
                run: () => onChangeDensity?.('cozy')
            },
            {
                id: 'density-compact',
                label: 'Görünüm: Sıkışık/Yoğun arayüz yerleşimi (Compact)',
                shortcut: 'Ctrl+Shift+6',
                icon: 'view_comfy',
                group: 'Sayfa',
                run: () => onChangeDensity?.('compact')
            },
            {
                id: 'density-comfortable',
                label: 'Görünüm: Geniş arayüz yerleşimi (Comfortable)',
                shortcut: 'Ctrl+Shift+7',
                icon: 'table_rows',
                group: 'Sayfa',
                run: () => onChangeDensity?.('comfortable')
            },
            {
                id: 'font-sm',
                label: 'Görünüm: Küçük yazı boyutu (Small)',
                shortcut: 'Ctrl+Shift+8',
                icon: 'text_fields',
                group: 'Sayfa',
                run: () => onChangeFontSize?.('sm')
            },
            {
                id: 'font-md',
                label: 'Görünüm: Normal yazı boyutu (Medium)',
                shortcut: 'Ctrl+Shift+9',
                icon: 'format_size',
                group: 'Sayfa',
                run: () => onChangeFontSize?.('md')
            },
            {
                id: 'font-lg',
                label: 'Görünüm: Büyük yazı boyutu (Large)',
                shortcut: 'Ctrl+Shift+0',
                icon: 'text_increase',
                group: 'Sayfa',
                run: () => onChangeFontSize?.('lg')
            }
        ];
        if (onOpenWorkflows) {
            list.push({
                id: 'workflows',
                label: "Navigasyon: Workflow YAML Akış Panelini Aç",
                shortcut: 'Ctrl+Alt+W',
                icon: 'bolt',
                group: 'Sayfa',
                run: onOpenWorkflows
            });
        }
        // Ajanlar - Sohbet et
        agents.forEach((a, idx) => {
            const num = idx + 1;
            const selectShortcut = num <= 9 ? `Ctrl+${num}` : undefined;
            const editShortcut = num <= 9 ? `Ctrl+Alt+${num}` : undefined;
            list.push({
                id: `agent-select:${a.id}`,
                label: `Ajan: ${a.name} ile sohbet et (${a.role || 'Uzman'})`,
                shortcut: selectShortcut,
                icon: 'smart_toy',
                group: 'Ajan',
                run: () => onSelectAgent(a.id)
            });
            list.push({
                id: `agent-edit:${a.id}`,
                label: `Ajan: ${a.name} yetenek ve ayarlarını düzenle`,
                shortcut: editShortcut,
                icon: 'edit',
                group: 'Ajan',
                run: () => onEditAgent?.(a.id)
            });
            list.push({
                id: `agent-duplicate:${a.id}`,
                label: `Ajan: ${a.name} ajanı çoğalt (kopyasını oluştur)`,
                icon: 'content_copy',
                group: 'Ajan',
                run: () => onDuplicateAgent?.(a.id)
            });
            list.push({
                id: `agent-delete:${a.id}`,
                label: `Ajan: ${a.name} uzman ajanı sistemden sil`,
                icon: 'delete',
                group: 'Ajan',
                run: () => onDeleteAgent?.(a.id)
            });
            list.push({
                id: `agent-toggle-active:${a.id}`,
                label: `Ajan: ${a.name} durumunu değiştir (Aktif: ${a.is_active ? 'Evet' : 'Hayır'})`,
                icon: a.is_active ? 'toggle_on' : 'toggle_off',
                group: 'Ajan',
                run: () => onToggleAgentActive?.(a.id)
            });
            list.push({
                id: `agent-export-config:${a.id}`,
                label: `Ajan: ${a.name} prompt & ayarlarını dışa aktar (JSON)`,
                icon: 'cloud_download',
                group: 'Ajan',
                run: () => onExportAgentConfig?.(a.id)
            });
        });
        return list;
    }, [
        agents,
        onCreateAgent,
        onNewConversation,
        onReloadAgents,
        onOpenSettings,
        onOpenWorkflows,
        onSelectAgent,
        onChangeTheme,
        onChangeDensity,
        onChangeFontSize,
        onEditAgent,
        onExportChat,
        onDeleteAgent,
        onDuplicateAgent,
        onToggleAgentActive,
        onExportAgentConfig,
        onDeleteConversation,
        onToggleSystemPanel,
        onExportChatMD,
        onShowShortcuts
    ]);
    // Fuzzy filter (basit substring match, küçük harf duyarsız + Türkçe karakter normalize)
    const filtered = useMemo(() => {
        const q = normalize(query.trim());
        if (!q)
            return allCommands;
        return allCommands
            .map((cmd) => ({ cmd, score: scoreMatch(normalize(cmd.label), q) }))
            .filter((x) => x.score >= 0)
            .sort((a, b) => b.score - a.score)
            .map((x) => x.cmd);
    }, [allCommands, query]);
    // Navigation
    useEffect(() => {
        setActiveIndex(0);
    }, [query]);
    useEffect(() => {
        if (!open)
            return;
        const onKey = (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
            }
            else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((i) => Math.max(0, i - 1));
            }
            else if (e.key === 'Enter') {
                e.preventDefault();
                const cmd = filtered[activeIndex];
                if (cmd) {
                    onClose();
                    // mikro gecikme — modal kapansin
                    setTimeout(() => cmd.run(), 0);
                }
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, filtered, activeIndex, onClose]);
    if (!open)
        return null;
    // Group'a gore grupla
    const groups = {};
    filtered.forEach((c) => {
        if (!groups[c.group])
            groups[c.group] = [];
        groups[c.group].push(c);
    });
    return (_jsx("div", { className: "fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-start justify-center pt-24 px-4 animate-backdrop-in", onClick: onClose, children: _jsxs("div", { onClick: (e) => e.stopPropagation(), className: "w-full max-w-xl bg-brand-panel border border-brand-borderStrong rounded-lg shadow-2xl overflow-hidden animate-command-palette-in", children: [_jsxs("div", { className: "flex items-center gap-2 px-3 py-2.5 border-b border-brand-border", children: [_jsx(Icon, { name: "search", size: 18, className: "text-brand-accent" }), _jsx("input", { ref: inputRef, type: "text", value: query, onChange: (e) => setQuery(e.target.value), placeholder: "Komut ara... (\u00F6rn. yeni ajan, ayarlar)", className: "flex-1 bg-transparent border-none outline-none text-sm text-brand-text placeholder:text-brand-mutedSoft" }), _jsx("kbd", { className: "text-[10px] text-brand-mutedSoft border border-brand-border rounded px-1.5 py-0.5", children: "ESC" })] }), _jsxs("div", { className: "max-h-[60vh] overflow-y-auto py-1", children: [filtered.length === 0 && (_jsx("div", { className: "text-xs text-brand-mutedSoft text-center py-6", children: "E\u015Fle\u015Fen komut yok" })), Object.entries(groups).map(([groupName, cmds]) => (_jsxs("div", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-brand-mutedSoft px-3 py-1.5 sticky top-0 bg-brand-panel", children: groupName }), cmds.map((cmd) => {
                                    const idx = filtered.indexOf(cmd);
                                    const active = idx === activeIndex;
                                    return (_jsxs("button", { onClick: () => {
                                            onClose();
                                            setTimeout(() => cmd.run(), 0);
                                        }, onMouseEnter: () => setActiveIndex(idx), className: `w-full flex items-center gap-2.5 px-3 py-2 text-sm transition ${active
                                            ? 'bg-brand-accent/15 text-brand-text'
                                            : 'text-brand-textSoft hover:bg-brand-bg/40'}`, children: [_jsx(Icon, { name: cmd.icon, size: 16, className: active ? 'text-brand-accent' : 'text-brand-muted' }), _jsx("span", { className: "flex-1 text-left truncate", children: cmd.label }), cmd.shortcut && (_jsx("kbd", { className: "text-[10px] text-brand-mutedSoft border border-brand-border rounded px-1.5 py-0.5 font-mono", children: cmd.shortcut }))] }, cmd.id));
                                })] }, groupName)))] }), _jsxs("div", { className: "px-3 py-2 border-t border-brand-border bg-brand-bg/30 text-[10px] text-brand-mutedSoft flex items-center gap-3", children: [_jsxs("span", { className: "inline-flex items-center gap-1", children: [_jsx("kbd", { className: "border border-brand-border rounded px-1", children: "\u2191\u2193" }), " gez"] }), _jsxs("span", { className: "inline-flex items-center gap-1", children: [_jsx("kbd", { className: "border border-brand-border rounded px-1", children: "\u21B5" }), " se\u00E7"] }), _jsxs("span", { className: "inline-flex items-center gap-1", children: [_jsx("kbd", { className: "border border-brand-border rounded px-1", children: "ESC" }), " kapat"] }), _jsxs("span", { className: "ml-auto", children: [filtered.length, " komut"] })] })] }) }));
}
// ============================================================
// Yardimci: normalize + fuzzy score
// ============================================================
function normalize(s) {
    return s
        .toLowerCase()
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c');
}
/**
 * Basit fuzzy score: query'nin tüm karakterleri sırayla text'te
 * geçiyorsa pozitif skor; substring match ise daha yüksek.
 */
function scoreMatch(text, query) {
    if (!query)
        return 0;
    if (text.includes(query))
        return 100 - text.indexOf(query);
    let qi = 0;
    let last = -1;
    let score = 0;
    for (let i = 0; i < text.length && qi < query.length; i++) {
        if (text[i] === query[qi]) {
            // Bitisik harfler bonus
            if (last === i - 1)
                score += 5;
            else
                score += 1;
            last = i;
            qi++;
        }
    }
    if (qi < query.length)
        return -1;
    // Daha kisa text daha alakali
    return score - text.length * 0.1;
}
