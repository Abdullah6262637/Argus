import type { AgentInfo, ChatMessage } from '../types';

export interface UseChatActionsProps {
  chat: {
    messages: ChatMessage[];
    newConversation: () => void;
  };
  agents: AgentInfo[];
  selectedId: string | null;
  selectedAgent: AgentInfo | null;
  setSelectedId: (id: string | null) => void;
  openConfirm: (config: any) => void;
  closeConfirm: () => void;
}

export function useChatActions({
  chat,
  agents,
  selectedId,
  selectedAgent,
  setSelectedId,
  openConfirm,
  closeConfirm,
}: UseChatActionsProps) {
  
  const handleDeleteConversation = () => {
    openConfirm({
      title: 'Sohbeti Temizle',
      message: 'Mevcut sohbet gecmisinizi temizlemek istediginizden emin misiniz? Bu islem geri alinamaz.',
      confirmLabel: 'Evet, Temizle',
      variant: 'danger',
      onConfirm: () => {
        chat.newConversation();
        closeConfirm();
      }
    });
  };

  const handleExportChatMD = (id?: string) => {
    const targetId = id || selectedId;
    const targetAgent = agents.find((a) => a.id === targetId) || selectedAgent;
    if (!targetAgent || chat.messages.length === 0) return;
    let md = `# Sohbet Gecmisi — ${targetAgent.name} (${targetAgent.role || 'Uzman'})\n`;
    md += `Tarih: ${new Date().toLocaleDateString('tr-TR')}\n\n`;
    
    chat.messages.forEach((msg) => {
      const roleName = msg.role === 'user' ? 'Kullanici' : targetAgent.name;
      md += `### 👤 ${roleName}\n\n${msg.content}\n\n`;
      if (msg.tokens || msg.model) {
        md += `*Metadata: ${msg.model ? `Model: ${msg.model}` : ''} ${msg.tokens ? `| Token: ${msg.tokens}` : ''}*\n\n`;
      }
      md += `---\n\n`;
    });
    
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sohbet-${targetAgent.name}-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleClearConversations = (id: string) => {
    setSelectedId(id);
    openConfirm({
      title: 'Sohbeti Temizle',
      message: 'Bu ajanin mevcut sohbet oturumunu temizlemek istediginizden emin misiniz? Bu islem geri alinamaz.',
      confirmLabel: 'Evet, Temizle',
      variant: 'danger',
      onConfirm: () => {
        chat.newConversation();
        closeConfirm();
      }
    });
  };

  const handleNewConversation = (id: string) => {
    setSelectedId(id);
    chat.newConversation();
  };

  return {
    handleDeleteConversation,
    handleExportChatMD,
    handleClearConversations,
    handleNewConversation,
  };
}
