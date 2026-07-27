import { type IconBaseProps, defaultSvgProps } from './types';

export function IconProviderOpenAI(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" fill="currentColor" opacity={0.3} />
    </svg>
  );
}

export function IconProviderAnthropic(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <path d="M12 2L2 22h4l2-4h8l2 4h4L12 2zm-1.5 12l2.5-5 2.5 5h-5z" />
    </svg>
  );
}

export function IconProviderGoogle(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z" />
    </svg>
  );
}

export function IconProviderGroq(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M8 12h8m-4-4v8" strokeWidth={2} />
    </svg>
  );
}

export function IconProviderSambaNova(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <polygon points="12 2 20 7 20 17 12 22 4 17 4 7 12 2" />
    </svg>
  );
}

export function IconProviderCerebras(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="8" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="16" y2="21" />
      <line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  );
}

export function IconProviderFireworks(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <path d="M12 2c-4 4-6 8.5-6 12a6 6 0 0 0 12 0c0-3.5-2-8-6-12z" />
    </svg>
  );
}

export function IconProviderTogether(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
    </svg>
  );
}

export function IconProviderOllama(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <circle cx="12" cy="12" r="3" fill="currentColor" opacity={0.3} />
    </svg>
  );
}
