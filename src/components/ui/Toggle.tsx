'use client';

export function Toggle({
  checked, on, onChange, label, ariaLabel, disabled,
}: {
  checked?: boolean;
  on?: boolean;
  onChange?: (next: boolean) => void;
  label?: string;
  ariaLabel?: string;
  disabled?: boolean;
}) {
  const isOn = !!(checked ?? on);
  function fire(e: React.MouseEvent | React.KeyboardEvent) {
    e.stopPropagation();
    if (disabled) return;
    onChange?.(!isOn);
  }
  return (
    <span
      role="switch"
      aria-checked={isOn}
      aria-label={ariaLabel || label}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      onClick={fire}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(e); }
      }}
      className={`tg ${isOn ? 'on' : ''}`}
      style={{
        display: 'inline-block',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
      }}
    />
  );
}
