import { type IconBaseProps, defaultSvgProps } from './types';

export function IconSettings(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <circle cx="12" cy="12" r="3" strokeWidth={2} />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export function IconPersonAdd(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" strokeWidth={2} />
      <line x1="17" y1="11" x2="23" y2="11" strokeWidth={2} />
    </svg>
  );
}

export function IconRefresh(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <polyline points="23 4 23 10 17 10" strokeWidth={2} />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

export function IconSearch(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <circle cx="11" cy="11" r="8" strokeWidth={2} />
      <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth={2} />
    </svg>
  );
}

export function IconWorkflow(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" opacity={0.25} />
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

export function IconMenu(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <line x1="3" y1="6" x2="21" y2="6" strokeWidth={2} />
      <line x1="3" y1="12" x2="21" y2="12" strokeWidth={2} />
      <line x1="3" y1="18" x2="21" y2="18" strokeWidth={2} />
    </svg>
  );
}

export function IconSideNav(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <polyline points="14 9 17 12 14 15" />
    </svg>
  );
}

export function IconClose(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <line x1="18" y1="6" x2="6" y2="18" strokeWidth={2} />
      <line x1="6" y1="6" x2="18" y2="18" strokeWidth={2} />
    </svg>
  );
}
