export function AlfredAvatar({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background circle */}
      <circle cx="50" cy="50" r="50" fill="#1E3A5F" />

      {/* Face */}
      <circle cx="50" cy="56" r="22" fill="#F5D0A9" />

      {/* Hard hat - main */}
      <path d="M24 44 C24 28, 76 28, 76 44 L76 46 L24 46 Z" fill="#F59E0B" />
      {/* Hard hat - brim */}
      <rect x="18" y="43" width="64" height="5" rx="2.5" fill="#D97706" />
      {/* Hard hat - stripe */}
      <rect x="30" y="34" width="40" height="3" rx="1.5" fill="#FBBF24" />
      {/* Hard hat - top ridge */}
      <path d="M38 28 C38 24, 62 24, 62 28" stroke="#D97706" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* Eyes */}
      <ellipse cx="40" cy="54" rx="3.5" ry="4" fill="#1E3A5F" />
      <ellipse cx="60" cy="54" rx="3.5" ry="4" fill="#1E3A5F" />
      {/* Eye shine */}
      <circle cx="41.5" cy="52.5" r="1.2" fill="white" />
      <circle cx="61.5" cy="52.5" r="1.2" fill="white" />

      {/* Friendly smile */}
      <path d="M40 65 Q50 73 60 65" stroke="#C4956A" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* Mustache */}
      <path d="M38 62 Q44 66 50 62 Q56 66 62 62" stroke="#8B6914" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Safety glasses strap */}
      <path d="M26 50 L34 52" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M66 52 L74 50" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
