import { ShieldCheck, Lock, Cookie, BarChart3, HardDrive, Radio, Wifi, Search } from 'lucide-react'
import { PageHeader, Panel } from '../components/ui'

const ROWS = [
  {
    icon: Lock,
    title: 'What is processed locally',
    body: 'Every tool on DevPocket — JSON, XML, SQL and YAML formatting, JWT decoding, diffing, hashing, cron parsing, mock data generation, and the rest — runs as JavaScript in your tab. Your input is read into memory, transformed, and rendered back to the same page. It never leaves the browser process.',
  },
  {
    icon: Wifi,
    title: 'What is sent externally',
    body: 'Nothing you type or paste into a tool. The only network requests DevPocket itself makes are for the page shell: the JavaScript/CSS bundles and the Inter font from Google Fonts (fonts.googleapis.com, fonts.gstatic.com), fetched once per visit regardless of what you do afterward. No tool currently calls an external API — if one ever needs to, its page will carry a "Needs network" badge instead of "Runs locally" and state exactly what is sent and why.',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    body: 'None. DevPocket does not run Google Analytics, Plausible, PostHog or any other analytics script. There is no event tracking of any kind at this time.',
  },
  {
    icon: Cookie,
    title: 'Cookies',
    body: 'DevPocket sets no cookies. It is a static site with no server-side session, so there is nothing to store a cookie for.',
  },
  {
    icon: ShieldCheck,
    title: 'Error monitoring',
    body: 'None. There is no Sentry, Bugsnag or similar service wired in, so a JavaScript error in your browser is never reported anywhere — you would only see it in your own DevTools console.',
  },
  {
    icon: HardDrive,
    title: 'Local storage',
    body: 'A few small preferences live in your browser\'s localStorage, scoped to devpocket.in: your theme choice, the paths of your last few visited and favorited tools, and the sizes you\'ve dragged split panes to. None of it holds the text, tokens or files you paste into a tool — only UI state and tool paths. IndexedDB is not used. Clear it any time via your browser\'s site data settings.',
  },
  {
    icon: Radio,
    title: 'Service worker / offline',
    body: 'DevPocket does not currently register a service worker, so it is not yet installable or usable offline. This is on the roadmap — when added, it will cache application code only, never anything you type.',
  },
]

export default function Privacy() {
  return (
    <div>
      <PageHeader icon={ShieldCheck} title="Privacy" subtitle="How DevPocket actually handles your data — not a marketing claim." accent="emerald" isTool={false} />

      <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
        <Panel className="animate-fade-up">
          <p className="t-muted text-sm leading-relaxed">
            DevPocket is a static site with no backend server and no database. That is not a design choice made for
            this page — it is the actual architecture, and it is why the claims below can be specific instead of
            vague. Where a tool cannot honestly make the same claim, its page says so.
          </p>
        </Panel>

        <div className="stagger grid grid-cols-1 gap-4">
          {ROWS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="panel rounded-2xl border p-5">
              <div className="mb-2 flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <h2 className="t-main text-sm font-semibold">{title}</h2>
              </div>
              <p className="t-muted text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <Panel title="How to verify this yourself" className="animate-fade-up">
          <div className="flex items-start gap-2.5">
            <Search className="t-faint mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p className="t-muted text-sm leading-relaxed">
              Open your browser's DevTools (F12, or Cmd/Ctrl+Shift+I), switch to the <strong className="t-main">Network</strong> tab,
              and use any tool — paste a JSON payload, decode a JWT, generate a hash. Reload the tab list if it's
              filtered. You will see the page's own assets and fonts load once, and nothing else fire while you
              type, paste or click. No request will carry your input in its body, headers or URL. That is the claim,
              and it is checkable in under a minute without trusting this page at all.
            </p>
          </div>
        </Panel>

        <p className="t-faint pb-4 text-center text-xs">
          Found a tool that doesn't match this description? That would be a bug — please report it.
        </p>
      </div>
    </div>
  )
}
