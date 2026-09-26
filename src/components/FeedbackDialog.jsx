import { useEffect, useId, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { X, Send, Loader2, CheckCircle2, AlertTriangle, Bug, Wand2, Lightbulb, Info } from 'lucide-react'
import { TYPES, MAX_MESSAGE, FEEDBACK_TO, validate, sendFeedback, isConfigured } from '../lib/feedback'
import { normalizePath } from '../lib/seo'
import { Button, Input, TextArea, Checkbox } from './ui'

const ICONS = { bug: Bug, improvement: Wand2, suggestion: Lightbulb }
// Kept for the life of the tab, so closing the dialog by accident loses nothing.
let draft = { type: 'bug', message: '', email: '', includePage: true }

/**
 * The feedback form, in a native modal <dialog> (focus trap, Esc to close and
 * the backdrop come from the browser). Mounted only while open, so it adds
 * nothing to the prerendered pages.
 */
export default function FeedbackDialog({ initialType, onClose }) {
  const ref = useRef(null)
  const { pathname } = useLocation()
  const page = pathname === '/' ? '/' : `${normalizePath(pathname)}/`
  const [form, setForm] = useState(() => ({ ...draft, type: initialType || draft.type }))
  const [touched, setTouched] = useState(false)
  const [status, setStatus] = useState({ state: 'idle' })
  const [botcheck, setBotcheck] = useState('')
  const titleId = useId()
  const configured = isConfigured()

  useEffect(() => {
    const d = ref.current
    if (d && !d.open) d.showModal()
  }, [])
  useEffect(() => {
    draft = form
  }, [form])

  const errors = validate(form)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function submit(e) {
    e.preventDefault()
    setTouched(true)
    if (Object.keys(errors).length || status.state === 'sending') return
    setStatus({ state: 'sending' })
    try {
      await sendFeedback({ ...form, page: form.includePage ? page : '' }, { botcheck })
      draft = { type: 'bug', message: '', email: '', includePage: true }
      setStatus({ state: 'sent' })
    } catch (err) {
      setStatus({ state: 'error', message: err.message })
    }
  }

  const close = () => ref.current?.close()

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        // A click on the backdrop lands on the <dialog> itself.
        if (e.target === ref.current) close()
      }}
      aria-labelledby={titleId}
      className="panel t-main m-auto w-[min(34rem,calc(100vw-2rem))] max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border p-0 shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <div className="bd flex items-center justify-between gap-3 border-b px-5 py-4">
        <div>
          <h2 id={titleId} className="t-main text-base font-semibold">Send feedback</h2>
          <p className="t-muted text-xs">Report a bug, ask for an improvement or suggest a tool.</p>
        </div>
        <button type="button" onClick={close} aria-label="Close" className="hover-surface t-muted flex h-9 w-9 items-center justify-center rounded-lg">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {status.state === 'sent' ? (
        <div className="px-5 py-8 text-center" aria-live="polite">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" aria-hidden="true" />
          <p className="t-main mt-3 text-sm font-semibold">Thanks — your message was sent.</p>
          <p className="t-muted mt-1 text-sm">{form.email ? 'If a reply is needed, it will go to the address you gave.' : 'It went to the DevPocket inbox.'}</p>
          <div className="mt-5 flex justify-center gap-2">
            <Button type="button" variant="subtle" onClick={() => { setForm(draft); setTouched(false); setStatus({ state: 'idle' }) }}>Send another</Button>
            <Button type="button" onClick={close}>Close</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4 px-5 py-4">
          <fieldset>
            <legend className="t-muted mb-1.5 text-xs font-semibold">What kind of feedback?</legend>
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map((t) => {
                const Icon = ICONS[t.value]
                const on = form.type === t.value
                return (
                  <label
                    key={t.value}
                    className={`flex min-h-[44px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-center text-xs font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 ${
                      on ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bd t-muted hover-surface'
                    }`}
                    title={t.hint}
                  >
                    <input type="radio" name="feedback-type" value={t.value} checked={on} onChange={() => set('type', t.value)} className="sr-only" />
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {t.label}
                  </label>
                )
              })}
            </div>
          </fieldset>

          <div>
            <label htmlFor="feedback-message" className="t-muted mb-1.5 block text-xs font-semibold">
              {form.type === 'bug' ? 'What went wrong, and on which input?' : form.type === 'improvement' ? 'What should work better?' : 'What would you like to see?'}
            </label>
            <TextArea
              id="feedback-message"
              rows={6}
              autoFocus
              maxLength={MAX_MESSAGE}
              value={form.message}
              onChange={(e) => set('message', e.target.value)}
              aria-invalid={touched && errors.message ? true : undefined}
              aria-describedby="feedback-message-note"
              placeholder={form.type === 'bug' ? 'Steps, what you expected and what happened instead…' : 'Describe it in a few sentences…'}
            />
            <div id="feedback-message-note" className="mt-1 flex justify-between gap-2 text-xs">
              <span className={touched && errors.message ? 'text-rose-600 dark:text-rose-300' : 't-faint'}>
                {touched && errors.message ? errors.message : 'Describe the problem in words. Do not paste tokens, keys, passwords or private data.'}
              </span>
              <span className="t-faint shrink-0 tabular-nums">{form.message.length.toLocaleString()} / {MAX_MESSAGE.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label htmlFor="feedback-email" className="t-muted mb-1.5 block text-xs font-semibold">
              Your email <span className="font-normal">(optional — only if you want a reply)</span>
            </label>
            <Input id="feedback-email" type="email" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" aria-invalid={touched && errors.email ? true : undefined} />
            {touched && errors.email && <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">{errors.email}</p>}
          </div>

          <Checkbox checked={form.includePage} onChange={(e) => set('includePage', e.target.checked)} label={`Include the page I am on (${page})`} />

          {/* Honeypot: hidden from people and assistive tech; bots fill it in. */}
          <input type="text" name="botcheck" tabIndex={-1} autoComplete="off" value={botcheck} onChange={(e) => setBotcheck(e.target.value)} className="hidden" aria-hidden="true" />

          <div className="bd sunken t-muted flex items-start gap-2 rounded-xl border px-3 py-2 text-xs leading-relaxed">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              Pressing Send is the only time DevPocket sends anything: the fields above{form.includePage ? ' and the page address' : ''}, and nothing from the tool you were using. It is delivered to {FEEDBACK_TO} by Web3Forms, a free form-to-email service.
            </span>
          </div>

          <div aria-live="polite">
            {status.state === 'error' && (
              <p className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {status.message}
              </p>
            )}
            {!configured && status.state !== 'error' && (
              <p className="t-faint text-xs">Sending is not set up on this copy of the site yet; you can still email {FEEDBACK_TO}.</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pb-1">
            <Button type="button" variant="ghost" onClick={close}>Cancel</Button>
            <Button type="submit" disabled={status.state === 'sending'}>
              {status.state === 'sending' ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Send className="h-3.5 w-3.5" aria-hidden="true" />}
              {status.state === 'sending' ? 'Sending…' : 'Send'}
            </Button>
          </div>
        </form>
      )}
    </dialog>
  )
}
