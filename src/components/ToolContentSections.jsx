import { useLocation } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { seoFor, normalizePath } from '../lib/seo'
import { navItems, ACCENTS } from '../lib/nav'

/**
 * The written half of a tool page, rendered once from App.jsx under every
 * route so a route only needs copy in src/lib/seo.js to get it. Two parts:
 *
 * 1. The guide — the route's `deepDive`: a page-specific heading, a worked
 *    example, a reference table, the traps. Open, with a visible title and an
 *    accent bar, because it is the part of the page that is about THIS tool
 *    and nothing else. It used to sit behind a chip and nobody found it.
 *
 * 2. "About …" — how it works, common use cases, FAQ. The same three shapes
 *    on every page, so they stay behind a disclosure — but a full card header
 *    with a title and a line saying what is inside, not a text-xs chip. Still
 *    in the HTML either way: crawlers read markup, not layout.
 *
 * A route sets `collapsedContent: false` to render all of it open, which is
 * right only where the copy IS the page (About, Privacy).
 *
 * scripts/prerender.mjs writes the same copy into the static HTML. Change the
 * shape here and that mirror has to change with it.
 */
export default function ToolContentSections() {
  const { pathname } = useLocation()
  const route = normalizePath(pathname)
  const { howItWorks, useCases, faq, aboutLabel, collapsedContent, deepDive } = seoFor(route)
  const accent = ACCENTS[navItems.find((n) => n.to === route)?.accent] || ACCENTS.emerald

  if (!howItWorks && !useCases && !faq && !deepDive) return null

  const about = (howItWorks || useCases || faq) && (
    <div className="space-y-6">
      {howItWorks && (
        <section>
          <h2 className="t-main text-sm font-semibold">How it works</h2>
          <ol className="mt-3 space-y-2.5">
            {howItWorks.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed">
                <span className={`mono shrink-0 font-semibold ${accent.text}`}>{i + 1}.</span>
                <span className="t-muted">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {useCases && (
        <section>
          <h2 className="t-main text-sm font-semibold">Common use cases</h2>
          <ul className="mt-3 space-y-1.5">
            {useCases.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed">
                <span className="t-faint shrink-0">•</span>
                <span className="t-muted">{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {faq && (
        <section>
          <h2 className="t-main text-sm font-semibold">FAQ</h2>
          <div className="mt-3 space-y-4">
            {faq.map(({ q, a }, i) => (
              <div key={i}>
                <h3 className="t-main text-sm font-medium">{q}</h3>
                <p className="t-muted mt-1 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 px-4 pb-8 sm:px-6">
      {deepDive && <Guide accent={accent} {...deepDive} />}

      {about && collapsedContent === false && (
        <section className="panel rounded-2xl border p-5 sm:p-7">{about}</section>
      )}

      {about && collapsedContent !== false && (
        <details className="panel group rounded-2xl border">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 select-none [&::-webkit-details-marker]:hidden sm:px-6">
            <div className="min-w-0">
              <h2 className="t-main text-base font-semibold">About {aboutLabel || 'this tool'}</h2>
              <p className="t-muted mt-0.5 text-sm">{teaserFor({ howItWorks, useCases, faq })}</p>
            </div>
            <span
              className="bd hover-surface t-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-transform group-open:rotate-180"
              aria-hidden="true"
            >
              <ChevronDown className="h-4 w-4" />
            </span>
          </summary>
          <div className="bd border-t px-5 pt-5 pb-6 sm:px-6">{about}</div>
        </details>
      )}
    </div>
  )
}

/** The one line under the "About" title that says what opening it gets you. */
function teaserFor({ howItWorks, useCases, faq }) {
  const bits = []
  if (howItWorks) bits.push(`How it works in ${howItWorks.length} steps`)
  if (useCases) bits.push(`${useCases.length} common use cases`)
  if (faq) bits.push(`${faq.length} question${faq.length === 1 ? '' : 's'} answered`)
  return bits.join(' · ')
}

/**
 * The page-specific guide. Deliberately plain markup — no syntax highlighting
 * — because scripts/prerender.mjs emits the same HTML for the static file.
 */
function Guide({ accent, heading, body, example, table, gotchas }) {
  return (
    <section className="panel overflow-hidden rounded-2xl border">
      <div className={`h-1 bg-gradient-to-r ${accent.grad}`} aria-hidden="true" />
      <div className="p-5 sm:p-7">
        <span
          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wider uppercase ${accent.bg} ${accent.text}`}
        >
          Guide
        </span>
        <h2 className="t-main mt-3 text-xl font-bold tracking-tight sm:text-2xl">{heading}</h2>

        {body && (
          <div className="mt-4 space-y-3">
            {body.map((para, i) => (
              <p key={i} className="t-muted text-[15px] leading-relaxed">
                {para}
              </p>
            ))}
          </div>
        )}

        {example && (
          <div className="mt-6 grid items-start gap-3 sm:grid-cols-2">
            <div>
              <h3 className="t-faint text-[11px] font-semibold tracking-wider uppercase">
                {example.inputLabel || 'Input'}
              </h3>
              <pre className="sunken bd mono mt-1.5 overflow-x-auto rounded-xl border p-3.5 text-[13px] leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">
                {example.input}
              </pre>
            </div>
            <div>
              <h3 className="t-faint text-[11px] font-semibold tracking-wider uppercase">
                {example.outputLabel || 'Output'}
              </h3>
              <pre className="sunken bd mono mt-1.5 overflow-x-auto rounded-xl border p-3.5 text-[13px] leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">
                {example.output}
              </pre>
            </div>
          </div>
        )}
        {example?.note && <p className="t-faint mt-2.5 text-sm leading-relaxed">{example.note}</p>}

        {table && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm">
              {table.caption && (
                <caption className="t-muted mb-2.5 text-left text-sm">{table.caption}</caption>
              )}
              <thead>
                <tr className="bd-strong border-b">
                  {table.columns.map((c) => (
                    <th key={c} className="t-main py-2 pr-4 font-semibold">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, i) => (
                  <tr key={i} className="bd border-b last:border-0">
                    {row.map((cell, j) => (
                      <td key={j} className={`py-2 pr-4 align-top ${j === 0 ? 'mono t-main' : 't-muted'}`}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {gotchas && (
          <div className="mt-7">
            <h3 className="t-main text-base font-semibold">Where people get caught</h3>
            <div className="mt-3 space-y-4">
              {gotchas.map(({ title, detail }, i) => (
                <div key={i} className={`border-l-2 pl-4 ${accent.border}`}>
                  <p className="t-main text-[15px] font-semibold">{title}</p>
                  <p className="t-muted mt-1 text-sm leading-relaxed">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
