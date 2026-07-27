import { type IconBaseProps, defaultSvgProps } from './types';

export function IconAgentDeveloper(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <polyline points="16 18 22 12 16 6" strokeWidth={2} />
      <polyline points="8 6 2 12 8 18" strokeWidth={2} />
      <line x1="14" y1="4" x2="10" y2="20" />
    </svg>
  );
}

export function IconAgentResearcher(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <circle cx="11" cy="11" r="8" strokeWidth={2} />
      <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth={2} />
    </svg>
  );
}

export function IconAgentWriter(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth={2} />
    </svg>
  );
}

export function IconAgentDevops(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="8.5" cy="15.5" r="1.5" fill="currentColor" />
      <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" />
      <path d="M12 2v5m-4 4V8a4 4 0 0 1 8 0v3" />
      <line x1="9" y1="19" x2="15" y2="19" strokeWidth={2} />
    </svg>
  );
}

export function IconAgentMaster(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
      <circle cx="12" cy="19" r="1" fill="currentColor" />
    </svg>
  );
}

export function IconAgentSecurity(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" strokeWidth={2} />
    </svg>
  );
}

export function IconAgentQA(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}
