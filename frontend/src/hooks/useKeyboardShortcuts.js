import { useEffect } from 'react';
export function useKeyboardShortcuts(actions, dependencies) {
    useEffect(() => {
        const onKey = (e) => {
            const isMod = e.ctrlKey || e.metaKey;
            const isAlt = e.altKey;
            const isShift = e.shiftKey;
            const key = e.key.toLowerCase();
            // Ctrl+K -> Komut paleti
            if (isMod && key === 'k') {
                e.preventDefault();
                actions.togglePalette();
            }
            // Ctrl+Shift+N -> Yeni Ajan
            else if (isMod && isShift && key === 'n') {
                e.preventDefault();
                actions.openCreateForm();
            }
            // Ctrl+N -> Yeni sohbet
            else if (isMod && !isShift && key === 'n') {
                e.preventDefault();
                actions.newConversation();
            }
            // Ctrl+Shift+U -> Ajanları yeniden yükle
            else if (isMod && isShift && key === 'u') {
                e.preventDefault();
                actions.reloadAgents();
            }
            // Ctrl+Shift+E -> Dışa aktar
            else if (isMod && isShift && key === 'e') {
                e.preventDefault();
                actions.exportAgentJson();
            }
            // Ctrl+Shift+M -> Markdown Dışa Aktar
            else if (isMod && isShift && key === 'm') {
                e.preventDefault();
                actions.exportChatMd();
            }
            // Ctrl+Shift+Backspace -> Sohbeti Temizle
            else if (isMod && isShift && key === 'backspace') {
                e.preventDefault();
                actions.deleteConversation();
            }
            // Ctrl+Alt+L -> Sistem/Log Panelini Göster/Gizle
            else if (isMod && isAlt && key === 'l') {
                e.preventDefault();
                actions.toggleSystemPanel();
            }
            // Ctrl+Alt+M -> Ajan Havuzu/Yönetim Panelini Aç
            else if (isMod && isAlt && key === 'm') {
                e.preventDefault();
                actions.openSettings('agents');
            }
            // Ctrl+Shift+D -> API Dokümantasyonu
            else if (isMod && isShift && key === 'd') {
                e.preventDefault();
                window.open('http://127.0.0.1:8000/docs', '_blank');
            }
            // Ctrl+Shift+G -> GitHub
            else if (isMod && isShift && key === 'g') {
                e.preventDefault();
                window.open('https://github.com/Abdullah6262637/Argus', '_blank');
            }
            // Ctrl+Shift+H -> Kılavuz (About)
            else if (isMod && isShift && key === 'h') {
                e.preventDefault();
                actions.openSettings('about');
            }
            // Ctrl+Alt+A -> API Anahtarları
            else if (isMod && isAlt && key === 'a') {
                e.preventDefault();
                actions.openSettings('apikeys');
            }
            // Ctrl+Alt+P -> Eklentiler & MCP
            else if (isMod && isAlt && key === 'p') {
                e.preventDefault();
                actions.openSettings('plugins_mcp');
            }
            // Ctrl+Alt+R -> Reset
            else if (isMod && isAlt && key === 'r') {
                e.preventDefault();
                actions.openSettings('reset');
            }
            // Ctrl+Alt+I -> Sürüm & Hakkında
            else if (isMod && isAlt && key === 'i') {
                e.preventDefault();
                actions.openSettings('about');
            }
            // Ctrl+Alt+W -> Workflow Panel
            else if (isMod && isAlt && key === 'w') {
                e.preventDefault();
                actions.openWorkflows();
            }
            // Ctrl+, -> Ayarlar (Görünüm)
            else if (isMod && key === ',') {
                e.preventDefault();
                actions.openSettings('theme');
            }
            // Temalar: Ctrl+Shift+1 - Ctrl+Shift+4
            else if (isMod && isShift && key === '1') {
                e.preventDefault();
                actions.setTheme('midnight');
            }
            else if (isMod && isShift && key === '2') {
                e.preventDefault();
                actions.setTheme('sunset');
            }
            else if (isMod && isShift && key === '3') {
                e.preventDefault();
                actions.setTheme('forest');
            }
            else if (isMod && isShift && key === '4') {
                e.preventDefault();
                actions.setTheme('mono');
            }
            // Density: Ctrl+Shift+5 - Ctrl+Shift+7
            else if (isMod && isShift && key === '5') {
                e.preventDefault();
                actions.setDensity('cozy');
            }
            else if (isMod && isShift && key === '6') {
                e.preventDefault();
                actions.setDensity('compact');
            }
            else if (isMod && isShift && key === '7') {
                e.preventDefault();
                actions.setDensity('comfortable');
            }
            // Font sizes: Ctrl+Shift+8 - Ctrl+Shift+0
            else if (isMod && isShift && key === '8') {
                e.preventDefault();
                actions.setFontSize('sm');
            }
            else if (isMod && isShift && key === '9') {
                e.preventDefault();
                actions.setFontSize('md');
            }
            else if (isMod && isShift && key === '0') {
                e.preventDefault();
                actions.setFontSize('lg');
            }
            // Ajan Seçimi: Ctrl+1 - Ctrl+9
            else if (isMod && !isAlt && /^[1-9]$/.test(e.key)) {
                e.preventDefault();
                const idx = Number(e.key) - 1;
                actions.selectAgentByIndex(idx);
            }
            // Ajan Düzenleme: Ctrl+Alt+1 - Ctrl+Alt+9
            else if (isMod && isAlt && /^[1-9]$/.test(e.key)) {
                e.preventDefault();
                const idx = Number(e.key) - 1;
                actions.editAgentByIndex(idx);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, dependencies);
}
