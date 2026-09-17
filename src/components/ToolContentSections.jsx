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
 * Collapsed by default: the copy sits behind a closed disclosure so the page
 * stays given over to the tool, and only someone who wants the background opens
 * it. It is still in the HTML either way — crawlers read markup, not layout.
 * A route sets `collapsedContent: false` to render it open, which is right only
 * where the copy IS the page (About, Privacy) rather than notes about a tool.
 */
export default function ToolContentSections() {
  const { pathname } = useLocation()
  const { howItWorks, useCases, faq, aboutLabel, collapsedContent, deepDive } = seoFor(pathname)

  if (!howItWorks && !useCases && !faq && !deepDive) return null

  const sections = (
    <>
      {deepDive && <DeepDive {...deepDive} />}

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

  if (collapsedContent === false) {
    return <div className="space-y-4 px-4 pb-6 sm:px-6">{sections}</div>
  }

  return (
    <div className="px-4 pb-6 sm:px-6">
      <details className="group">
        <summary className="bd hover-surface t-muted hover:t-main inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium select-none">
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" aria-hidden="true" />
          About {aboutLabel || 'this tool'}
        </summary>
        <div className="mt-3 space-y-4">{sections}</div>
      </details>
    </div>
  )
}

/**
 * The part of a tool page that only makes sense for THIS tool: a worked
 * example with real input and output, a reference table, and the mistakes that
 * cost people an hour. "How it works" and the FAQ are the same four shapes on
 * every page, which is what makes a set of tool pages read as mass-produced;
 * this is where a page earns its own place in an index.
 *
 * Deliberately plain markup — no syntax highlighting — because
 * scripts/prerender.mjs has to emit byte-identical HTML for the static file.
 */
function DeepDive({ heading, body, example, table, gotchas }) {
  return (
    <Panel title={heading}>
      {body?.map((para, i) => (
        <p key={i} className="t-muted mt-2 text-sm leading-relaxed first:mt-0">
          {para}
        </p>
      ))}

      {example && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <h3 className="t-muted text-[11px] font-semibold tracking-wider uppercase">
              {example.inputLabel || 'Input'}
            </h3>
            <pre className="field mono mt-1.5 overflow-x-auto rounded-lg border p-3 text-xs leading-relaxed">
              {example.input}
            </pre>
          </div>
          <div>
            <h3 className="t-muted text-[11px] font-semibold tracking-wider uppercase">
              {example.outputLabel || 'Output'}
            </h3>
            <pre className="field mono mt-1.5 overflow-x-auto rounded-lg border p-3 text-xs leading-relaxed">
              {example.output}
            </pre>
          </div>
        </div>
      )}
      {example?.note && <p className="t-faint mt-2 text-xs leading-relaxed">{example.note}</p>}

      {table && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            {table.caption && (
              <caption className="t-muted mb-2 text-left text-xs">{table.caption}</caption>
            )}
            <thead>
              <tr className="bd border-b">
                {table.columns.map((c) => (
                  <th key={c} className="t-muted py-1.5 pr-4 font-semibold">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, i) => (
                <tr key={i} className="bd border-b last:border-0">
                  {row.map((cell, j) => (
                    <td key={j} className={`t-muted py-1.5 pr-4 align-top ${j === 0 ? 'mono t-main' : ''}`}>
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
        <div className="mt-4">
          <h3 className="t-main text-sm font-medium">Where people get caught</h3>
          <div className="mt-2 space-y-3">
            {gotchas.map(({ title, detail }, i) => (
              <div key={i}>
                <p className="t-main text-sm font-medium">{title}</p>
                <p className="t-muted mt-0.5 text-sm leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  )
}
