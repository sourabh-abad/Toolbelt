/**
 * The DevPocket mark — a pocket holding code chevrons.
 * Same artwork as public/favicon.svg so the tab icon and the in-app logo match.
 */
export default function Logo({ className = 'h-8 w-8', rounded = 'rounded-lg' }) {
  return (
    <svg viewBox="0 0 64 64" className={`${className} ${rounded}`} role="img" aria-label="DevPocket">
      <defs>
        <linearGradient id="dp-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#10b981" />
          <stop offset="1" stopColor="#0d9488" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill="url(#dp-logo)" />
      <path d="M13 18h38v19a12 12 0 0 1-12 12H25a12 12 0 0 1-12-12z" fill="#fff" />
      <path d="M13 18h38v6.5H13z" fill="#0f766e" fillOpacity="0.28" />
      <path
        d="M27.5 31.5 21 38l6.5 6.5M36.5 31.5 43 38l-6.5 6.5"
        fill="none"
        stroke="#0f766e"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
