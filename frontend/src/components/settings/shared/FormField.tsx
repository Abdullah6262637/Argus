import React from 'react';
import { Icon } from '../../Icon';

export function FormField({
  label,
  icon,
  children}: {
  label: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[9.5px] text-brand-mutedSoft uppercase tracking-wider font-bold inline-flex items-center gap-1">
        <Icon name={icon} size={10} weight={500} />
        {label}
      </span>
      {children}
    </label>
  );
}

// ============================================================
