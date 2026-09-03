import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Check, Copy, Lock, Globe, Star } from 'lucide-react'
import { ACCENTS } from '../lib/nav'
import { useFavorites } from '../lib/favorites'

export function Panel({ title, description, actions, children, className = '' }) {
  return (
    <div className={`panel rounded-2xl border ${className}`}>
      {(title || actions) && (
        <div className="bd flex items-center justify-between gap-3 border-b px-4 py-3.5">
          <div>
            {title && <h2 className="t-main text-sm font-semibold">{title}</h2>}
            {description && <p className="t-muted mt-0.5 text-xs">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  )
}

export function Button({ children, variant = 'default', className = '', ...props }) {
  const base =
    'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
  const variants = {
    default: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30',
    subtle: 'field hover-surface t-muted border',
    ghost: 't-muted hover-surface hover:t-main',
    danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/30',
  }
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}

export function CopyButton({ text, label = 'Copy', onCopied }) {
  const [copied, setCopied] = useState(false)
  const doCopy = async () => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      onCopied?.()
      setTimeout(() => setCopied(false), 1200)
    } catch {
      // ignore clipboard failures silently
    }
  }
  return (
    <Button variant="subtle" onClick={doCopy} type="button" title="Copy to clipboard">
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : label}
    </Button>
  )
}

export function TextArea({ className = '', ...props }) {
  return (
    <textarea
      spellCheck={false}
      className={`field mono w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors focus:border-emerald-500/60 ${className}`}
      {...props}
    />
  )
}

export function Input({ className = '', ...props }) {
  return (
    <input
      spellCheck={false}
      className={`field mono w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors focus:border-emerald-500/60 ${className}`}
      {...props}
    />
  )
}

export function Select({ className = '', children, ...props }) {
  return (
    <select
      className={`field rounded-xl border px-3 py-2 text-sm outline-none focus:border-emerald-500/60 ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}

export function Checkbox({ checked, onChange, label }) {
  return (
    <label className="t-muted flex cursor-pointer items-center gap-2 text-sm select-none">
      <input type="checkbox" checked={checked} onChange={onChange} className="bd h-3.5 w-3.5 rounded accent-emerald-500" />
      {label}
    </label>
  )
}

export function Tabs({ options, value, onChange }) {
  return (
    <div className="sunken bd inline-flex gap-1 rounded-xl border p-1">
      {options.map((opt) => {
        const val = typeof opt === 'string' ? opt : opt.value
        const label = typeof opt === 'string' ? opt.toUpperCase() : opt.label
        const active = val === value
        return (
          <button
            key={val}
            type="button"
            onClick={() => onChange(val)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
              active ? 'panel t-main shadow-sm' : 't-muted hover:t-main'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

export function ErrorBanner({ children }) {
  if (!children) return null
  return (
    <div className="mono rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-300">
      {children}
    </div>
  )
}

export function OutputBlock({ html, text, placeholder = 'Output will appear here…', className = '' }) {
  const empty = !html && !text
  if (empty) {
    return (
      <div className={`bd sunken t-faint mono rounded-xl border border-dashed px-3 py-2.5 text-sm ${className}`}>
        {placeholder}
      </div>
    )
  }
  const shared = `bd sunken mono t-main max-h-[440px] overflow-auto rounded-xl border px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${className}`
  if (html) return <pre className={shared} dangerouslySetInnerHTML={{ __html: html }} />
  return <pre className={shared}>{text}</pre>
}

export function StatRow({ label, value, mono = true }) {
  return (
    <div className="bd sunken flex items-center justify-between gap-3 rounded-lg border px-3 py-1.5">
      <span className="t-muted shrink-0 text-xs">{label}</span>
      <span className={`t-main truncate text-sm ${mono ? 'mono' : ''}`}>{value}</span>
    </div>
  )
}

/**
 * Discloses whether a tool sends anything over the network. Defaults to
 * "local" because every current DevPocket tool runs entirely client-side —
 * a tool that genuinely needs the network should pass `privacy="network"`
 * explicitly rather than this component guessing.
 */
export function PrivacyBadge({ privacy = 'local', className = '' }) {
  if (privacy === 'network') {
    return (
      <span
        title="This tool makes a network request to work. Check its privacy notice for exactly what is sent."
        className={`inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400 ${className}`}
      >
        <Globe className="h-3 w-3" aria-hidden="true" />
        Needs network
      </span>
    )
  }
  return (
    <span
      title="Your input is processed locally and is not sent to DevPocket."
      className={`inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 ${className}`}
    >
      <Lock className="h-3 w-3" aria-hidden="true" />
      Runs locally
    </span>
  )
}

/** Star toggle backed by localStorage — works for any tool path, not just the current page. */
export function FavoriteButton({ path, size = 'md', className = '' }) {
  const { isFavorite, toggle } = useFavorites()
  const active = isFavorite(path)
  const dim = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8'
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle(path)
      }}
      aria-pressed={active}
      aria-label={active ? 'Remove from favorites' : 'Add to favorites'}
      title={active ? 'Remove from favorites' : 'Add to favorites'}
      className={`hover-surface flex ${dim} shrink-0 items-center justify-center rounded-lg transition-colors ${className}`}
    >
      <Star className={`h-4 w-4 ${active ? 'fill-amber-400 text-amber-400' : 't-faint'}`} aria-hidden="true" />
    </button>
  )
}

export function PageHeader({ icon: Icon, title, subtitle, accent = 'emerald', privacy = 'local', isTool = true, actions }) {
  const a = ACCENTS[accent] || ACCENTS.emerald
  const { pathname } = useLocation()
  return (
    <div className="bd sticky top-0 z-10 flex items-center gap-3 border-b px-4 py-4 backdrop-blur-md sm:px-6 sm:py-5"
         style={{ backgroundColor: 'color-mix(in srgb, var(--bg) 80%, transparent)' }}>
      {Icon && (
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${a.grad} text-white shadow-lg ${a.glow}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      )}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="t-main text-base font-semibold">{title}</h1>
          {isTool && <PrivacyBadge privacy={privacy} />}
        </div>
        {subtitle && <p className="t-muted truncate text-xs">{subtitle}</p>}
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        {actions}
        {isTool && <FavoriteButton path={pathname} />}
      </div>
    </div>
  )
}
