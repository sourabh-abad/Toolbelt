import { useState } from 'react'
import { PROFILE } from '../lib/profile'

/**
 * Profile photo with a WebP source and a JPEG fallback. If both fail to load
 * (offline, asset missing, blocked), it falls back to the initials block
 * rather than leaving a broken-image icon in the layout.
 */
export default function Avatar({ size = 96, className = '', rounded = 'rounded-2xl', decorative = false }) {
  const [failed, setFailed] = useState(false)
  const initials = PROFILE.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')

  if (failed) {
    return (
      <div
        aria-hidden={decorative ? 'true' : undefined}
        role={decorative ? undefined : 'img'}
        aria-label={decorative ? undefined : PROFILE.name}
        style={{ width: size, height: size, fontSize: Math.max(10, size * 0.38) }}
        className={`flex shrink-0 items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 font-bold text-white ${rounded} ${className}`}
      >
        {initials}
      </div>
    )
  }

  return (
    <picture>
      <source srcSet={PROFILE.avatar.webp} type="image/webp" />
      <img
        src={PROFILE.avatar.jpg}
        alt={decorative ? '' : `${PROFILE.name}, ${PROFILE.role}`}
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        style={{ width: size, height: size }}
        className={`shrink-0 object-cover ${rounded} ${className}`}
      />
    </picture>
  )
}
