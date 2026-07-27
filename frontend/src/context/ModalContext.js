import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useCallback } from 'react';
const ModalContext = createContext(undefined);
export function ModalProvider({ children }) {
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [settingsTab, setSettingsTab] = useState('agents');
    const [workflowsOpen, setWorkflowsOpen] = useState(false);
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [inspectorOpen, setInspectorOpen] = useState(false);
    const [inspectorAgentId, setInspectorAgentId] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [editingAgent, setEditingAgent] = useState(null);
    const [confirmState, setConfirmState] = useState(null);
    const openSettings = useCallback((tab) => {
        const validTabs = ['agents', 'theme', 'apikeys', 'plugins_mcp', 'reset', 'about'];
        const selectedTab = (typeof tab === 'string' && validTabs.includes(tab))
            ? tab
            : 'agents';
        setSettingsTab(selectedTab);
        setSettingsOpen(true);
    }, []);
    const closeSettings = useCallback(() => {
        setSettingsOpen(false);
    }, []);
    const openWorkflows = useCallback(() => setWorkflowsOpen(true), []);
    const closeWorkflows = useCallback(() => setWorkflowsOpen(false), []);
    const openPalette = useCallback(() => setPaletteOpen(true), []);
    const closePalette = useCallback(() => setPaletteOpen(false), []);
    const openInspector = useCallback((agentId) => {
        setInspectorAgentId(agentId);
        setInspectorOpen(true);
    }, []);
    const closeInspector = useCallback(() => {
        setInspectorOpen(false);
        setInspectorAgentId(null);
    }, []);
    const openForm = useCallback((agent = null) => {
        setEditingAgent(agent);
        setFormOpen(true);
    }, []);
    const closeForm = useCallback(() => {
        setFormOpen(false);
        setEditingAgent(null);
    }, []);
    const openConfirm = useCallback((config) => {
        setConfirmState(config);
    }, []);
    const closeConfirm = useCallback(() => {
        if (confirmState?.onCancel) {
            confirmState.onCancel();
        }
        setConfirmState(null);
    }, [confirmState]);
    return (_jsx(ModalContext.Provider, { value: {
            settingsOpen,
            settingsTab,
            openSettings,
            closeSettings,
            workflowsOpen,
            openWorkflows,
            closeWorkflows,
            paletteOpen,
            setPaletteOpen,
            openPalette,
            closePalette,
            inspectorOpen,
            inspectorAgentId,
            openInspector,
            closeInspector,
            formOpen,
            editingAgent,
            openForm,
            closeForm,
            confirmState,
            openConfirm,
            closeConfirm,
        }, children: children }));
}
export function useModal() {
    const context = useContext(ModalContext);
    if (context === undefined) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
}
