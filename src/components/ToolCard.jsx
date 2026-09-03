import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { ACCENTS } from '../lib/nav'
import { FavoriteButton, PrivacyBadge } from './ui'

/**
 * The one card design every tool listing (categories, favorites, recent,
 * search) renders — so favoriting, the privacy tag and hover treatment stay
 * identical no matter where a tool is discovered from.
 *
 * The favorite `<button>` is a sibling of the `<Link>` (`<a>`), not nested
 * inside it — a button inside an anchor is invalid HTML and unreliable for
 * screen readers, even though most browsers render it without complaint.
 */
export default function ToolCard({ item }) {
  const { to, label, icon: Icon, description, accent, network } = item
  const a = ACCENTS[accent] || ACCENTS.emerald
  return (
    <div className={`panel will-lift group relative overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl ${a.glow}`}>
      <div
        className={`pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full bg-gradient-to-br ${a.grad} opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-25`}
      />
      <FavoriteButton path={to} size="sm" className="absolute top-3 right-3 z-10" />
      <Link to={to} className="relative flex flex-col justify-between p-5">
        <div className="pr-8">
          <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${a.grad} text-white shadow-md ${a.glow}`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="t-main text-sm font-semibold">{label}</h3>
          <p className="t-muted mt-1.5 text-xs leading-relaxed">{description}</p>
        </div>
        <div className="mt-5 flex items-center justify-between gap-2">
          <PrivacyBadge privacy={network ? 'network' : 'local'} />
          <div className={`t-muted flex items-center gap-1 text-xs font-medium transition-colors ${a.groupHoverText}`}>
            Open
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </div>
        </div>
      </Link>
    </div>
  )
}
