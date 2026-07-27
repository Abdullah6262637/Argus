import { type IconBaseProps, defaultSvgProps } from './types';

export function IconHub(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <circle cx="12" cy="12" r="3" fill="currentColor" opacity={0.3} />
      <circle cx="12" cy="12" r="3" />
      <circle cx="5" cy="6" r="2" />
      <circle cx="19" cy="6" r="2" />
      <circle cx="5" cy="18" r="2" />
      <circle cx="19" cy="18" r="2" />
      <line x1="6.7" y1="7.3" x2="9.8" y2="9.8" />
      <line x1="17.3" y1="7.3" x2="14.2" y2="9.8" />
      <line x1="6.7" y1="16.7" x2="9.8" y2="14.2" />
      <line x1="17.3" y1="16.7" x2="14.2" y2="14.2" />
    </svg>
  );
}

export function IconPsychology(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" />
      <path d="M9 21h6" />
      <circle cx="12" cy="9" r="2" fill="currentColor" opacity={0.4} />
    </svg>
  );
}

export function IconSchedule(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 6 12 12 16 14" strokeWidth={2} />
    </svg>
  );
}

export function IconAddCircle(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="16" strokeWidth={2} />
      <line x1="8" y1="12" x2="16" y2="12" strokeWidth={2} />
    </svg>
  );
}

export function IconError(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <circle cx="12" cy="12" r="9" strokeWidth={2} />
      <line x1="12" y1="8" x2="12" y2="12" strokeWidth={2} />
      <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth={2.5} />
    </svg>
  );
}

export function IconWarning(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" strokeWidth={2} />
      <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth={2.5} />
    </svg>
  );
}

export function IconCheckCircle(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" strokeWidth={2} />
    </svg>
  );
}

export function IconInfo(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" strokeWidth={2} />
      <line x1="12" y1="8" x2="12.01" y2="8" strokeWidth={2.5} />
    </svg>
  );
}

export function IconTune(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" strokeWidth={2} />
      <line x1="9" y1="8" x2="15" y2="8" strokeWidth={2} />
      <line x1="17" y1="16" x2="23" y2="16" strokeWidth={2} />
    </svg>
  );
}

export function IconBuild(props: IconBaseProps) {
  return (
    <svg {...defaultSvgProps(props)}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}
