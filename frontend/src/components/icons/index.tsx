import type { IconBaseProps } from './types';
import {
  IconAgentDeveloper,
  IconAgentResearcher,
  IconAgentWriter,
  IconAgentDevops,
  IconAgentMaster,
  IconAgentSecurity,
  IconAgentQA,
} from './AgentIcons';
import {
  IconSettings,
  IconPersonAdd,
  IconRefresh,
  IconSearch,
  IconWorkflow,
  IconMenu,
  IconSideNav,
  IconClose,
} from './NavigationIcons';
import {
  IconHub,
  IconPsychology,
  IconSchedule,
  IconAddCircle,
  IconError,
  IconWarning,
  IconCheckCircle,
  IconInfo,
  IconTune,
  IconBuild,
} from './ActionIcons';
import {
  IconChatBubble,
  IconChatSend,
  IconAttachFile,
  IconSparkles,
  IconHistory,
  IconTrash,
  IconCopy,
  IconCheck,
  IconArrowUpward,
  IconStop,
} from './ChatIcons';
import {
  IconProviderOpenAI,
  IconProviderAnthropic,
  IconProviderGoogle,
  IconProviderGroq,
  IconProviderSambaNova,
  IconProviderCerebras,
  IconProviderFireworks,
  IconProviderTogether,
  IconProviderOllama,
} from './ProviderIcons';

export * from './types';
export * from './AgentIcons';
export * from './NavigationIcons';
export * from './ActionIcons';
export * from './ChatIcons';
export * from './ProviderIcons';

export interface ArgusIconProps extends IconBaseProps {
  name: string;
}

/**
 * Modüler SVG İkon Kaydı (Tüm ikonlar ayrı dosyalar halinde organize edilmiştir)
 */
export function DynamicArgusIcon({ name, ...props }: ArgusIconProps) {
  const norm = name.toLowerCase().trim();

  switch (norm) {
    // Agent İkonları
    case 'developer':
    case 'code':
    case 'agent_code':
      return <IconAgentDeveloper {...props} />;
    case 'researcher':
    case 'agent_research':
      return <IconAgentResearcher {...props} />;
    case 'writer':
    case 'edit_note':
    case 'writer_note':
      return <IconAgentWriter {...props} />;
    case 'devops':
    case 'smart_toy':
    case 'robot':
      return <IconAgentDevops {...props} />;
    case 'agent_master':
    case 'crown':
      return <IconAgentMaster {...props} />;
    case 'agent_security':
    case 'shield_check':
      return <IconAgentSecurity {...props} />;
    case 'agent_qa':
    case 'target':
      return <IconAgentQA {...props} />;

    // Navigasyon & Header İkonları
    case 'settings':
    case 'gear':
      return <IconSettings {...props} />;
    case 'person_add':
    case 'user_plus':
      return <IconPersonAdd {...props} />;
    case 'refresh':
    case 'reload':
      return <IconRefresh {...props} />;
    case 'search':
      return <IconSearch {...props} />;
    case 'bolt':
    case 'workflow':
    case 'lightning':
      return <IconWorkflow {...props} />;
    case 'menu':
      return <IconMenu {...props} />;
    case 'menu_open':
    case 'side_navigation':
      return <IconSideNav {...props} />;
    case 'close':
    case 'cancel':
    case 'x':
      return <IconClose {...props} />;

    // Aksiyon & Kart İkonları
    case 'hub':
      return <IconHub {...props} />;
    case 'psychology':
      return <IconPsychology {...props} />;
    case 'schedule':
    case 'clock':
      return <IconSchedule {...props} />;
    case 'add_circle':
    case 'plus_circle':
      return <IconAddCircle {...props} />;
    case 'error':
    case 'error_outline':
      return <IconError {...props} />;
    case 'warning':
    case 'alert_triangle':
      return <IconWarning {...props} />;
    case 'check_circle':
    case 'success':
      return <IconCheckCircle {...props} />;
    case 'info':
    case 'info_circle':
      return <IconInfo {...props} />;
    case 'tune':
    case 'sliders':
      return <IconTune {...props} />;
    case 'build':
    case 'wrench':
      return <IconBuild {...props} />;

    // Sohbet İkonları
    case 'chat_bubble':
    case 'chat_bubble_outline':
    case 'chat':
    case 'message':
      return <IconChatBubble {...props} />;
    case 'chat_send':
    case 'send':
      return <IconChatSend {...props} />;
    case 'attach_file':
    case 'paperclip':
      return <IconAttachFile {...props} />;
    case 'sparkles':
    case 'auto_awesome':
      return <IconSparkles {...props} />;
    case 'history':
      return <IconHistory {...props} />;
    case 'trash':
    case 'delete':
      return <IconTrash {...props} />;
    case 'copy':
    case 'content_copy':
      return <IconCopy {...props} />;
    case 'check':
      return <IconCheck {...props} />;
    case 'arrow_upward':
    case 'send_up':
      return <IconArrowUpward {...props} />;
    case 'stop':
      return <IconStop {...props} />;

    // LLM Sağlayıcı İkonları
    case 'llm_openai':
    case 'openai':
      return <IconProviderOpenAI {...props} />;
    case 'llm_anthropic':
    case 'anthropic':
      return <IconProviderAnthropic {...props} />;
    case 'llm_google':
    case 'google':
    case 'gemini':
      return <IconProviderGoogle {...props} />;
    case 'llm_groq':
    case 'groq':
      return <IconProviderGroq {...props} />;
    case 'llm_sambanova':
    case 'sambanova':
      return <IconProviderSambaNova {...props} />;
    case 'llm_cerebras':
    case 'cerebras':
      return <IconProviderCerebras {...props} />;
    case 'llm_fireworks':
    case 'fireworks':
      return <IconProviderFireworks {...props} />;
    case 'llm_together':
    case 'together':
      return <IconProviderTogether {...props} />;
    case 'llm_ollama':
    case 'ollama':
      return <IconProviderOllama {...props} />;

    // Varsayılan Argus Vektör Çemberi
    default:
      return (
        <svg
          width={props.size ?? 20}
          height={props.size ?? 20}
          viewBox="0 0 24 24"
          fill="none"
          stroke={props.color ?? 'currentColor'}
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`inline-block transition-colors ${props.className ?? ''}`}
          style={{ verticalAlign: 'middle', userSelect: 'none', ...props.style }}
          onClick={props.onClick}
        >
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="3" fill="currentColor" opacity={0.4} />
        </svg>
      );
  }
}
