import { Globe, ShieldCheck, Zap, Code2, Heart } from 'lucide-react'
import { LinkedinIcon, MediumIcon, InstagramIcon } from '../components/BrandIcons'
import { PROFILE, activeLinks } from '../lib/profile'
import { navItems } from '../lib/nav'
import { PageHeader, Panel } from '../components/ui'

const ICONS = { linkedin: LinkedinIcon, medium: MediumIcon, instagram: InstagramIcon, website: Globe }

const PRINCIPLES = [
  {
    icon: ShieldCheck,
    title: 'Nothing is uploaded',
    body: 'Every tool runs as JavaScript in your tab. There is no backend, no analytics and no network request — paste a production token or a customer payload without thinking twice.',
  },
  {
    icon: Zap,
    title: 'Fast, and stays fast',
    body: 'Routes are code-split, so opening the SQL formatter never slows down the JSON one. No ads, no cookie banners, no consent dialogs.',
  },
  {
    icon: Code2,
    title: 'Keyboard-first',
    body: 'Press ⌘K to jump to any tool, ⌘\\ to collapse the sidebar. Built for people who would rather not reach for the mouse mid-task.',
  },
]

export default function About() {
  const links = activeLinks()
  const toolCount = navItems.filter((n) => n.to !== '/').length

  return (
    <div>
      <PageHeader icon={Heart} title="About" subtitle={`DevPocket — ${toolCount} tools, built by one developer.`} accent="emerald" />

      <div className="mx-auto max-w-4xl space-y-4 p-4 sm:p-6">
        {/* Developer card */}
        <Panel className="animate-fade-up overflow-hidden">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="relative shrink-0 self-start">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 opacity-70 blur-sm" aria-hidden="true" />
              <picture>
                <source srcSet={PROFILE.avatar.webp} type="image/webp" />
                <img
                  src={PROFILE.avatar.jpg}
                  alt={`${PROFILE.name}, ${PROFILE.role}`}
                  width="96"
                  height="96"
                  loading="lazy"
                  decoding="async"
                  className="relative h-24 w-24 rounded-2xl object-cover shadow-lg shadow-emerald-500/25"
                />
              </picture>
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="t-main text-xl font-bold">{PROFILE.name}</h2>
              <p className="text-sm font-medium text-emerald-500">{PROFILE.role}</p>
              <p className="t-muted mt-2 text-sm leading-relaxed">{PROFILE.tagline}</p>

              {links.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {links.map((l) => {
                    const Icon = ICONS[l.id] || Globe
                    return (
                      <a
                        key={l.id}
                        href={l.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label={`${l.label}: ${l.handle}`}
                        className="field hover-surface t-muted group inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all hover:-translate-y-0.5 hover:text-emerald-500"
                      >
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        <span className="hidden sm:inline">{l.handle}</span>
                        <span className="sm:hidden">{l.label}</span>
                      </a>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </Panel>

        <Panel title="Why this exists" className="animate-fade-up">
          <p className="t-muted text-sm leading-relaxed whitespace-pre-line">{PROFILE.bio}</p>
        </Panel>

        <div className="stagger grid grid-cols-1 gap-4 md:grid-cols-3">
          {PRINCIPLES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="panel rounded-2xl border p-5">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <h3 className="t-main text-sm font-semibold">{title}</h3>
              <p className="t-muted mt-1.5 text-xs leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <Panel title="Built with" className="animate-fade-up">
          <div className="flex flex-wrap gap-2">
            {['React 19', 'Vite', 'Tailwind CSS v4', 'React Router', 'sql-formatter', 'js-yaml', 'cronstrue', 'lucide-react'].map((t) => (
              <span key={t} className="bd sunken t-muted mono rounded-lg border px-2.5 py-1 text-xs">
                {t}
              </span>
            ))}
          </div>
        </Panel>

        <p className="t-faint pb-4 text-center text-xs">
          Built by {PROFILE.name} in {PROFILE.location}. No trackers, no ads, no sign-up.
        </p>
      </div>
    </div>
  )
}
