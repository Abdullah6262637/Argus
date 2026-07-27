import React, { type CSSProperties } from 'react';

/**
 * Argus Özel SVG İkon Kütüphanesi (60 Özel Vektör İkonu)
 * Tasarım: Minimalist Slate & Emerald Uyumlu Vektör Çizimleri
 */

export interface ArgusIconProps {
  name: string;
  size?: number;
  className?: string;
  color?: string;
  onClick?: (e: React.MouseEvent) => void;
  style?: CSSProperties;
  title?: string;
}

export function ArgusIcon({
  name,
  size = 20,
  className = '',
  color = 'currentColor',
  onClick,
  style,
  title,
}: ArgusIconProps) {
  const iconProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: `inline-block transition-colors ${className}`,
    style: { verticalAlign: 'middle', userSelect: 'none' as const, ...style },
    onClick,
    title,
  };

  const normalized = name.toLowerCase().trim();

  switch (normalized) {
    // 1. Argus Logo / Brand Eye
    case 'argus_logo':
    case 'brand':
    case 'logo':
      return (
        <svg {...iconProps}>
          <path d="M12 3a9 9 0 0 0-9 9 9 9 0 0 0 9 9 9 9 0 0 0 9-9 9 9 0 0 0-9-9z" />
          <circle cx="12" cy="12" r="4" strokeWidth={2} className="text-emerald-400 fill-emerald-500/20" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <path d="M12 1v2m0 18v2M1 12h2m18 0h2" strokeWidth={1.5} opacity={0.6} />
        </svg>
      );

    // 2. Master Agent / Coordinator
    case 'agent_master':
    case 'crown':
      return (
        <svg {...iconProps}>
          <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
          <circle cx="12" cy="19" r="1" fill="currentColor" />
        </svg>
      );

    // 3. Code Agent / Developer
    case 'agent_code':
    case 'code':
      return (
        <svg {...iconProps}>
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
          <line x1="14" y1="4" x2="10" y2="20" />
        </svg>
      );

    // 4. Security / Sentinel Auditor
    case 'agent_security':
    case 'shield_check':
      return (
        <svg {...iconProps}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" strokeWidth={2} />
        </svg>
      );

    // 5. QA Tester Auditor
    case 'agent_qa':
    case 'target':
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      );

    // 6. DB / Storage Agent
    case 'agent_db':
    case 'database':
      return (
        <svg {...iconProps}>
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      );

    // 7. Research / Search Agent
    case 'agent_research':
    case 'microscope':
      return (
        <svg {...iconProps}>
          <path d="M6 18h8m-4-8h.01M6 21a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H6z" />
          <path d="M10 13V6a3 3 0 0 1 6 0v7" />
        </svg>
      );

    // 8. Refactor Specialist
    case 'agent_refactor':
    case 'wand':
      return (
        <svg {...iconProps}>
          <path d="M15 4l5 5L7 21l-5-5L15 4z" />
          <path d="M18 2v3m0 0v3m0-3h3m-3 0h-3" strokeWidth={1.5} />
        </svg>
      );

    // 9. Analytics Agent
    case 'agent_analytics':
    case 'chart':
      return (
        <svg {...iconProps}>
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      );

    // 10. Workflow Agent
    case 'agent_workflow':
    case 'workflow':
      return (
        <svg {...iconProps}>
          <rect x="3" y="3" width="6" height="6" rx="1.5" />
          <rect x="15" y="3" width="6" height="6" rx="1.5" />
          <rect x="9" y="15" width="6" height="6" rx="1.5" />
          <path d="M6 9v3a3 3 0 0 0 3 3h3m6-6v3a3 3 0 0 1-3 3h-3" />
        </svg>
      );

    // 11. Bot / AI Character
    case 'agent_bot':
    case 'bot':
      return (
        <svg {...iconProps}>
          <rect x="3" y="11" width="18" height="10" rx="2" />
          <circle cx="8.5" cy="16" r="1.5" fill="currentColor" />
          <circle cx="15.5" cy="16" r="1.5" fill="currentColor" />
          <path d="M12 2v5m-4 4V8a4 4 0 0 1 8 0v3" />
        </svg>
      );

    // 12. Chat Bubble
    case 'chat_bubble':
    case 'chat':
    case 'message':
      return (
        <svg {...iconProps}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );

    // 13. Send Message
    case 'chat_send':
    case 'send':
      return (
        <svg {...iconProps}>
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      );

    // 14. Stop Generation
    case 'chat_stop':
    case 'stop':
      return (
        <svg {...iconProps}>
          <rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor" />
        </svg>
      );

    // 15. Sparkles / AI Magic
    case 'chat_sparkles':
    case 'sparkles':
      return (
        <svg {...iconProps}>
          <path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4z" fill="currentColor" opacity={0.2} />
          <path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4z" />
          <path d="M19 15l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" />
        </svg>
      );

    // 16. Neural Brain / Thinking
    case 'chat_thinking':
    case 'brain':
      return (
        <svg {...iconProps}>
          <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04z" />
          <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04z" />
        </svg>
      );

    // 17. Chat History
    case 'chat_history':
    case 'history':
      return (
        <svg {...iconProps}>
          <polyline points="12 8 12 12 14 14" />
          <path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" />
        </svg>
      );

    // 18. New Chat
    case 'chat_new':
    case 'plus_circle':
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      );

    // 19. Trash / Clear Chat
    case 'chat_clear':
    case 'trash':
    case 'delete':
      return (
        <svg {...iconProps}>
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      );

    // 20. Terminal / CLI Tool
    case 'tool_terminal':
    case 'terminal':
      return (
        <svg {...iconProps}>
          <polyline points="4 17 10 11 4 5" />
          <line x1="12" y1="19" x2="20" y2="19" />
        </svg>
      );

    // 21. File Tool
    case 'tool_file':
    case 'file':
      return (
        <svg {...iconProps}>
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
          <polyline points="13 2 13 9 20 9" />
        </svg>
      );

    // 22. Search Tool
    case 'tool_search':
    case 'globe':
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );

    // 23. Code Execute Tool
    case 'tool_code':
    case 'terminal_window':
      return (
        <svg {...iconProps}>
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <line x1="2" y1="8" x2="22" y2="8" />
          <polyline points="6 12 9 15 6 18" />
        </svg>
      );

    // 24. Python Tool
    case 'tool_python':
    case 'python':
      return (
        <svg {...iconProps}>
          <path d="M12 2v4a2 2 0 0 0 2 2h4M6 12h4a2 2 0 0 0 2-2V6" />
          <rect x="3" y="3" width="18" height="18" rx="4" />
        </svg>
      );

    // 25. Node JS Tool
    case 'tool_node':
    case 'nodejs':
      return (
        <svg {...iconProps}>
          <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
          <line x1="12" y1="22" x2="12" y2="12" />
          <polyline points="22 8.5 12 12 2 8.5" />
        </svg>
      );

    // 26. Docker Tool
    case 'tool_docker':
    case 'container':
    case 'box':
      return (
        <svg {...iconProps}>
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );

    // 27. Git Tool
    case 'tool_git':
    case 'git_branch':
      return (
        <svg {...iconProps}>
          <line x1="6" y1="3" x2="6" y2="15" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <path d="M18 9a9 9 0 0 1-9 9" />
        </svg>
      );

    // 28. GitHub Tool
    case 'tool_github':
    case 'github':
      return (
        <svg {...iconProps}>
          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
        </svg>
      );

    // 29. Database SQL Tool
    case 'tool_database':
    case 'sql':
      return (
        <svg {...iconProps}>
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      );

    // 30. Playwright Browser Tool
    case 'tool_browser':
    case 'browser':
      return (
        <svg {...iconProps}>
          <rect x="2" y="3" width="20" height="18" rx="2" />
          <line x1="2" y1="8" x2="22" y2="8" />
          <circle cx="5" cy="5.5" r="1" fill="currentColor" />
          <circle cx="8" cy="5.5" r="1" fill="currentColor" />
          <circle cx="11" cy="5.5" r="1" fill="currentColor" />
        </svg>
      );

    // 31. REST/GraphQL API Tool
    case 'tool_api':
    case 'api':
    case 'network':
      return (
        <svg {...iconProps}>
          <rect x="16" y="16" width="6" height="6" rx="1" />
          <rect x="2" y="16" width="6" height="6" rx="1" />
          <rect x="9" y="2" width="6" height="6" rx="1" />
          <path d="M5 16v-3a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3" />
          <line x1="12" y1="8" x2="12" y2="10" />
        </svg>
      );

    // 32. Vector Memory
    case 'vector_memory':
    case 'layers':
      return (
        <svg {...iconProps}>
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      );

    // 33. Knowledge Graph
    case 'knowledge_graph':
    case 'share_2':
      return (
        <svg {...iconProps}>
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      );

    // 34-42. Provider Icons
    case 'llm_openai':
    case 'openai':
      return (
        <svg {...iconProps}>
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </svg>
      );

    case 'llm_anthropic':
    case 'anthropic':
    case 'claude':
      return (
        <svg {...iconProps}>
          <path d="M12 2L2 22h4l2-4h8l2 4h4L12 2zm-1.5 12l2.5-5 2.5 5h-5z" />
        </svg>
      );

    case 'llm_google':
    case 'google':
    case 'gemini':
      return (
        <svg {...iconProps}>
          <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z" />
        </svg>
      );

    case 'llm_groq':
    case 'groq':
      return (
        <svg {...iconProps}>
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <path d="M8 12h8m-4-4v8" strokeWidth={2} />
        </svg>
      );

    case 'llm_sambanova':
    case 'sambanova':
      return (
        <svg {...iconProps}>
          <polygon points="12 2 20 7 20 17 12 22 4 17 4 7 12 2" />
          <polygon points="12 6 16 9 16 15 12 18 8 15 8 9 12 6" fill="currentColor" opacity={0.3} />
        </svg>
      );

    case 'llm_cerebras':
    case 'cerebras':
      return (
        <svg {...iconProps}>
          <rect x="2" y="2" width="20" height="20" rx="3" />
          <line x1="7" y1="2" x2="7" y2="22" strokeWidth={1} />
          <line x1="12" y1="2" x2="12" y2="22" strokeWidth={1} />
          <line x1="17" y1="2" x2="17" y2="22" strokeWidth={1} />
          <line x1="2" y1="7" x2="22" y2="7" strokeWidth={1} />
          <line x1="2" y1="12" x2="22" y2="12" strokeWidth={1} />
          <line x1="2" y1="17" x2="22" y2="17" strokeWidth={1} />
        </svg>
      );

    case 'llm_fireworks':
    case 'fireworks':
    case 'flame':
      return (
        <svg {...iconProps}>
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.38 0 2.5-1.12 2.5-2.5 0-.69-.28-1.31-.73-1.77L11 11l-1.77 1.73c-.45.46-.73 1.08-.73 1.77z" />
          <path d="M12 2c-4 4-6 8.5-6 12a6 6 0 0 0 12 0c0-3.5-2-8-6-12z" />
        </svg>
      );

    case 'llm_together':
    case 'together':
    case 'users':
      return (
        <svg {...iconProps}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );

    case 'llm_ollama':
    case 'ollama':
    case 'cpu':
      return (
        <svg {...iconProps}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <rect x="9" y="9" width="6" height="6" fill="currentColor" opacity={0.3} />
          <line x1="9" y1="1" x2="9" y2="4" />
          <line x1="15" y1="1" x2="15" y2="4" />
          <line x1="9" y1="20" x2="9" y2="23" />
          <line x1="15" y1="20" x2="15" y2="23" />
          <line x1="20" y1="9" x2="23" y2="9" />
          <line x1="20" y1="15" x2="23" y2="15" />
          <line x1="1" y1="9" x2="4" y2="9" />
          <line x1="1" y1="15" x2="4" y2="15" />
        </svg>
      );

    // 43. Settings / Gear
    case 'settings':
    case 'gear':
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );

    // 44. Security Shield
    case 'security_shield':
    case 'lock':
      return (
        <svg {...iconProps}>
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      );

    // 45. Bolt / LPU Speed
    case 'bolt':
    case 'zap':
      return (
        <svg {...iconProps}>
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" opacity={0.2} />
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );

    // 46. Check Circle / Success
    case 'check_circle':
    case 'success':
      return (
        <svg {...iconProps}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );

    // 47. Alert Triangle / Warning
    case 'alert_triangle':
    case 'warning':
      return (
        <svg {...iconProps}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );

    // 48. Info Circle
    case 'info_circle':
    case 'info':
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      );

    // 49. Plus
    case 'plus':
    case 'add':
      return (
        <svg {...iconProps}>
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      );

    // 50. Minus / Minimize
    case 'minus':
    case 'minimize':
      return (
        <svg {...iconProps}>
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      );

    // 51. Square / Maximize
    case 'square':
    case 'maximize':
      return (
        <svg {...iconProps}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      );

    // 52. Close / Modal Close
    case 'close':
    case 'x':
      return (
        <svg {...iconProps}>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      );

    // 53. Refresh / Reload
    case 'refresh':
    case 'reload':
      return (
        <svg {...iconProps}>
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
      );

    // 54. Copy
    case 'copy':
      return (
        <svg {...iconProps}>
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      );

    // 55. Checkmark Copied
    case 'check':
      return (
        <svg {...iconProps}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );

    // 56. Chevron Right
    case 'chevron_right':
    case 'arrow_right':
      return (
        <svg {...iconProps}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      );

    // 57. Chevron Down
    case 'chevron_down':
    case 'arrow_down':
      return (
        <svg {...iconProps}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      );

    // 58. Search Glass
    case 'search':
      return (
        <svg {...iconProps}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );

    // 59. Command Palette / Ctrl+K
    case 'command':
      return (
        <svg {...iconProps}>
          <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
        </svg>
      );

    // 60. Sparkle Star / Favorite
    case 'sparkle_star':
    case 'star':
    default:
      return (
        <svg {...iconProps}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
  }
}
