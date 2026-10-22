export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="var(--brand-600)" />
      <path
        d="M10 29V15M10 19a5 5 0 0 1 10 0v10M20 19a5 5 0 0 1 10 0v10"
        fill="none"
        stroke="#fff"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="10" r="3" fill="#fff" />
    </svg>
  )
}

export function Logo({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span className="font-display text-2xl font-extrabold tracking-tight">Mio</span>
    </span>
  )
}
