import { useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Panel } from './ui'
import { seoFor } from '../lib/seo'

/**
 * "How it works" / "Common use cases" / FAQ for tool pages that carry this
 * copy in their src/lib/seo.js entry. Rendered once from App.jsx for every
 * route rather than per page, so a route only needs copy in seo.js to get
 * these sections. Pulling from seo.js rather than a second data file keeps
 * one source of truth: scripts/prerender.mjs reads the same object to write
 * matching static HTML and FAQPage structured data.
 *
 * A route can set `collapsedContent: true` to have the whole thing rendered
 * closed behind a disclosure. The copy is still in the HTML — crawlers read
 * markup, not layout — but the page stays given over to the tool. That is the
 * right trade on pages where the tool wants the whole viewport.
 */
export default function ToolContentSections() {
  const { pathname } = useLocation()
  const { howItWorks, useCases, faq, heading, collapsedContent } = seoFor(pathname)

  if (!howItWorks && !useCases && !faq) return null

  const sections = (
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
    </>
  )

  if (collapsedContent) {
    return (
      <div className="px-4 pb-6 sm:px-6">
        <details className="group">
          <summary className="t-muted hover:t-main flex cursor-pointer items-center gap-1.5 text-xs font-medium select-none">
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" aria-hidden="true" />
            About {heading ? heading.toLowerCase() : 'this tool'}
          </summary>
          <div className="mt-3 space-y-4">{sections}</div>
        </details>
      </div>
    )
  }

  return <div className="space-y-4 px-4 pb-6 sm:px-6">{sections}</div>
}
