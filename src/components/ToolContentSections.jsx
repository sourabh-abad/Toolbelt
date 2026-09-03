import { useLocation } from 'react-router-dom'
import { Panel } from './ui'
import ToolCard from './ToolCard'
import { navItems } from '../lib/nav'
import { seoFor } from '../lib/seo'

/**
 * "How it works" / "Common use cases" / FAQ / "Related tools" for tool pages
 * that have this content in their src/lib/seo.js entry. Pulls from seo.js
 * rather than a second data file, since that's already the per-route
 * metadata source of truth and scripts/prerender.mjs reads the same object
 * to emit matching FAQPage structured data.
 */
export default function ToolContentSections() {
  const { pathname } = useLocation()
  const { howItWorks, useCases, faq, related } = seoFor(pathname)

  if (!howItWorks && !useCases && !faq && !related) return null

  const relatedItems = (related || []).map((to) => navItems.find((n) => n.to === to)).filter(Boolean)

  return (
    <>
      {howItWorks && (
        <Panel title="How it works">
          <ol className="space-y-2.5">
            {howItWorks.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed">
                <span className="t-faint mono shrink-0">{i + 1}.</span>
                <span className="t-muted">{step}</span>
              </li>
            ))}
          </ol>
        </Panel>
      )}

      {useCases && (
        <Panel title="Common use cases">
          <ul className="space-y-1.5">
            {useCases.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed">
                <span className="t-faint shrink-0">•</span>
                <span className="t-muted">{item}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {faq && (
        <Panel title="FAQ">
          <div className="space-y-4">
            {faq.map(({ q, a }, i) => (
              <div key={i}>
                <h3 className="t-main text-sm font-medium">{q}</h3>
                <p className="t-muted mt-1 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {relatedItems.length > 0 && (
        <div>
          <h2 className="t-muted mb-2.5 px-0.5 text-[11px] font-semibold tracking-wider uppercase">Related tools</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {relatedItems.map((item) => (
              <ToolCard key={item.to} item={item} />
            ))}
          </div>
        </div>
      )}
    </>
  )
}
