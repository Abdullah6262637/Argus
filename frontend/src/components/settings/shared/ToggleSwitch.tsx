interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  title?: string;
}

export function ToggleSwitch({ checked, onChange, disabled = false, title }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      title={title}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full transition-all duration-200 ease-in-out focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${
        checked
          ? 'bg-brand-accent'
          : 'bg-brand-panelAlt border border-brand-borderStrong hover:border-brand-textSoft/40'
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full shadow-sm ring-0 transition duration-200 ease-in-out ${
          checked
            ? 'translate-x-[18px] bg-brand-bg my-auto top-[2px] left-[1px]'
            : 'translate-x-[2px] bg-brand-muted hover:bg-brand-textSoft my-auto top-[2px] left-[1px]'
        }`}
        style={{ marginTop: '2px' }}
      />
    </button>
  );
}
