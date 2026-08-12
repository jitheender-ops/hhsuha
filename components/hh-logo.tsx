export function HHLogo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        viewBox="0 0 32 32"
        className="h-6 w-6"
        role="img"
        aria-label="Hacker House Goa"
      >
        <defs>
          <linearGradient id="hh-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="oklch(0.86 0.15 80)" />
            <stop offset="1" stopColor="oklch(0.68 0.2 5)" />
          </linearGradient>
        </defs>
        <circle cx="16" cy="16" r="15" fill="oklch(0.24 0.05 168)" stroke="url(#hh-grad)" strokeWidth="1.5" />
        {/* sun */}
        <circle cx="16" cy="18" r="4.5" fill="url(#hh-grad)" />
        {/* horizon */}
        <path d="M6 22 H26" stroke="oklch(0.68 0.14 163)" strokeWidth="1.5" strokeLinecap="round" />
        {/* palm */}
        <path
          d="M11 22 C 10.6 18 11 15 12 12"
          stroke="oklch(0.86 0.15 80)"
          strokeWidth="1.3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M12 12 C 10 10.5 8.5 10.8 7.2 11.6 M12 12 C 13.8 10.5 15.2 10.8 16.4 11.8 M12 12 C 11 9.8 11.4 8.4 12 7"
          stroke="oklch(0.86 0.15 80)"
          strokeWidth="1.1"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      <span className="font-display text-sm font-semibold tracking-tight">
        Hacker House Goa
      </span>
    </span>
  )
}
