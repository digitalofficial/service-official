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
      {/* Background - dark gradient circle */}
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E3A5F" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id="hat" x1="25" y1="20" x2="75" y2="45" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="visor" x1="30" y1="48" x2="70" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="50%" stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>
      </defs>

      <circle cx="50" cy="50" r="50" fill="url(#bg)" />

      {/* Subtle grid pattern for tech feel */}
      <line x1="20" y1="80" x2="35" y2="90" stroke="#ffffff" strokeWidth="0.3" opacity="0.1" />
      <line x1="65" y1="80" x2="80" y2="90" stroke="#ffffff" strokeWidth="0.3" opacity="0.1" />

      {/* Head/face area - sleek robot-ish shape */}
      <rect x="30" y="46" width="40" height="30" rx="8" fill="#E2E8F0" />
      <rect x="32" y="48" width="36" height="26" rx="6" fill="#F1F5F9" />

      {/* Hard hat - modern angular design */}
      <path d="M22 46 L26 26 C28 20, 72 20, 74 26 L78 46 Z" fill="url(#hat)" />
      {/* Hat highlight stripe */}
      <path d="M32 30 L68 30" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" />
      {/* Hat brim - sharp and modern */}
      <path d="M18 44 Q18 42, 22 42 L78 42 Q82 42, 82 44 L82 47 Q82 49, 78 49 L22 49 Q18 49, 18 47 Z" fill="#B45309" />
      {/* Brim highlight */}
      <path d="M22 44 L78 44" stroke="#D97706" strokeWidth="1" />

      {/* Visor / smart glasses */}
      <rect x="32" y="50" width="36" height="12" rx="4" fill="#0F172A" />
      <rect x="34" y="52" width="32" height="8" rx="3" fill="url(#visor)" opacity="0.8" />
      {/* Visor scan line effect */}
      <line x1="36" y1="56" x2="64" y2="56" stroke="white" strokeWidth="0.5" opacity="0.4" />

      {/* LED eyes behind visor */}
      <circle cx="42" cy="56" r="2.5" fill="white" opacity="0.9" />
      <circle cx="58" cy="56" r="2.5" fill="white" opacity="0.9" />
      {/* Eye glow */}
      <circle cx="42" cy="56" r="4" fill="white" opacity="0.15" />
      <circle cx="58" cy="56" r="4" fill="white" opacity="0.15" />

      {/* Mouth - LED indicator bar */}
      <rect x="40" y="66" width="20" height="3" rx="1.5" fill="#0F172A" />
      <rect x="42" y="67" width="4" height="1" rx="0.5" fill="#34D399" />
      <rect x="48" y="67" width="4" height="1" rx="0.5" fill="#34D399" />
      <rect x="54" y="67" width="4" height="1" rx="0.5" fill="#34D399" />

      {/* Chin / jaw detail */}
      <path d="M34 72 Q50 80 66 72" stroke="#CBD5E1" strokeWidth="1" fill="none" />

      {/* Antenna / signal indicator on hat */}
      <circle cx="50" cy="22" r="2" fill="#34D399" />
      <circle cx="50" cy="22" r="4" fill="#34D399" opacity="0.2" />
    </svg>
  )
}
