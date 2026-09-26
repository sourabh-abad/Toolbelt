import { Component } from 'react'
import { RefreshCw } from 'lucide-react'
import { isChunkLoadError, reloadOnce } from '../lib/reload'

/**
 * Stops a failed chunk load (or any render error) from unmounting the whole
 * app and leaving a blank page.
 *
 * A chunk that 404s usually means a new version was deployed since this page
 * loaded, so the first time it reloads the page. If that has already happened
 * in the last minute, it shows a message with a Reload button instead of
 * looping.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, reloading: false }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error) {
    if (isChunkLoadError(error) && reloadOnce()) this.setState({ reloading: true })
  }

  render() {
    const { error, reloading } = this.state
    if (!error) return this.props.children
    if (reloading) return null

    const stale = isChunkLoadError(error)
    const compact = this.props.compact
    return (
      <div role="alert" className={compact ? 'p-4' : 'flex min-h-[50vh] items-center justify-center p-6'}>
        <div className="panel max-w-md rounded-2xl border p-5 text-center">
          <p className="t-main text-sm font-semibold">
            {stale ? 'A new version is available' : 'Something went wrong'}
          </p>
          <p className="t-muted mt-1 text-xs leading-relaxed">
            {stale
              ? 'DevPocket was updated since this page loaded. Reload to get the latest version.'
              : 'This part of the page failed to load. Reloading usually fixes it.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Reload
          </button>
        </div>
      </div>
    )
  }
}
