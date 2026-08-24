import { Icon } from '../../Icon';

export function PanelHeader({
  title,
  description,
  icon,
}: {
  title: string;
  description?: string;
  icon?: string;
}) {
  return (
    <div className="mb-4 pb-1">
      <h4 className="text-[13px] font-semibold text-brand-text inline-flex items-center gap-1.5">
        {icon && (
          <Icon name={icon} size={15} weight={550} className="text-brand-accent" />
        )}
        {title}
      </h4>
      {description && (
        <p className="text-[11px] text-brand-mutedSoft mt-0.5 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
