type Props = { tier: string; size?: number };

const COLORS: Record<string, string> = {
  identity: '#8a8a8a',
  professional: '#1d9bf0',
  organisation: '#c9a227',
};

export function VerifiedSeal({ tier, size = 18 }: Props) {
  const color = COLORS[tier];
  if (!color) return null;

  if (tier === 'identity') {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        role="img"
        aria-label="Identity verified"
        style={{ verticalAlign: '-.2em', marginLeft: 5, flexShrink: 0 }}
      >
        <path
          d="M12 2.8l7.2 2.9v5.4c0 4.6-3 8.3-7.2 10.1-4.2-1.8-7.2-5.5-7.2-10.1V5.7z"
          fill={color}
        />
        <path
          d="M8.4 12.2l2.5 2.5 4.7-5"
          fill="none"
          stroke="#fff"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role="img"
      aria-label={tier === 'professional' ? 'Verified professional' : 'Verified organisation'}
      style={{ verticalAlign: '-.2em', marginLeft: 5, flexShrink: 0 }}
    >
      <g fill={color}>
        <rect x={4} y={4} width={16} height={16} rx={4.5} />
        <rect x={4} y={4} width={16} height={16} rx={4.5} transform="rotate(45 12 12)" />
      </g>
      <path
        d="M8.4 12.2l2.5 2.5 4.7-5"
        fill="none"
        stroke="#fff"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
