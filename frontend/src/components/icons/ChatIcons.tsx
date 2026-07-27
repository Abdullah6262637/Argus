import { type IconBaseProps, defaultSvgProps } from './types';

export function IconChatBubble(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <line x1="8" y1="9" x2="16" y2="9" strokeWidth={2} />
      <line x1="8" y1="13" x2="13" y2="13" strokeWidth={2} />
    </svg>
  );
}

export function IconChatSend(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <line x1="22" y1="2" x2="11" y2="13" strokeWidth={2} />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

export function IconAttachFile(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

export function IconSparkles(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4z" fill="currentColor" opacity={0.3} />
      <path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4z" />
    </svg>
  );
}

export function IconHistory(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <polyline points="12 8 12 12 14 14" strokeWidth={2} />
      <path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" />
    </svg>
  );
}

export function IconTrash(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export function IconCopy(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function IconCheck(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <polyline points="20 6 9 17 4 12" strokeWidth={2.5} />
    </svg>
  );
}

export function IconArrowUpward(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <line x1="12" y1="19" x2="12" y2="5" strokeWidth={2} />
      <polyline points="5 12 12 5 19 12" strokeWidth={2} />
    </svg>
  );
}

export function IconStop(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
    </svg>
  );
}
