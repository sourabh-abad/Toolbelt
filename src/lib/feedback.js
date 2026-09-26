/**
 * The feedback form's delivery: a POST to Web3Forms (https://web3forms.com),
 * a free form-to-email service, which mails the message to info@devpocket.in.
 *
 * This is the one place DevPocket sends anything the user typed, so it only
 * happens when they press Send in the form, which says exactly what goes out.
 * Only the form's own fields are sent — never a tool's input, never storage.
 *
 * Setup: create a free access key at https://web3forms.com with the address
 * info@devpocket.in, then paste it between the quotes of KEY below (or set
 * VITE_WEB3FORMS_KEY when building). The key is designed to be public: it can
 * only deliver mail to the inbox it was created for.
 */
const KEY = 'b33ac70b-2aaf-4bf3-8c62-fa611629fadc'
export const ACCESS_KEY = KEY || (import.meta.env || {}).VITE_WEB3FORMS_KEY || ''

export const FEEDBACK_TO = 'info@devpocket.in'
const ENDPOINT = 'https://api.web3forms.com/submit'
const TIMEOUT_MS = 15_000

export const TYPES = [
  { value: 'bug', label: 'Bug', hint: 'Something is broken or wrong' },
  { value: 'improvement', label: 'Improvement', hint: 'Make an existing tool better' },
  { value: 'suggestion', label: 'Suggestion', hint: 'A new tool or an idea' },
]
export const MIN_MESSAGE = 10
export const MAX_MESSAGE = 5000

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const isConfigured = () => Boolean(ACCESS_KEY)

/** Field errors for the form; an empty object means it can be sent. */
export function validate({ type, message, email }) {
  const errors = {}
  if (!TYPES.some((t) => t.value === type)) errors.type = 'Choose bug, improvement or suggestion'
  const m = (message || '').trim()
  if (m.length < MIN_MESSAGE) errors.message = `Tell us a little more (at least ${MIN_MESSAGE} characters)`
  else if (m.length > MAX_MESSAGE) errors.message = `Keep it under ${MAX_MESSAGE.toLocaleString()} characters`
  if (email && !EMAIL.test(email.trim())) errors.email = 'That email address does not look right'
  return errors
}

/** The exact fields that are sent, so the form can show them before sending. */
export function payload({ type, message, email, page }) {
  const label = TYPES.find((t) => t.value === type)?.label || 'Feedback'
  const text = message.trim()
  const first = text.split('\n')[0].slice(0, 70)
  const fields = {
    subject: `[DevPocket] ${label}: ${first}${first.length < text.split('\n')[0].length ? '…' : ''}`,
    from_name: 'DevPocket feedback form',
    type: label,
    message: text,
  }
  if (page) fields.page = page
  if (email && email.trim()) fields.email = email.trim()
  return fields
}

export class FeedbackError extends Error {}

/**
 * Sends the feedback. `botcheck` is the hidden honeypot field; a person never
 * fills it, so a filled one is dropped here without a request.
 */
export async function sendFeedback(form, { botcheck = '', fetchImpl = globalThis.fetch, accessKey = ACCESS_KEY } = {}) {
  if (botcheck) return { ok: true, skipped: true }
  if (!accessKey) throw new FeedbackError(`The feedback form is not set up yet. Please email ${FEEDBACK_TO} instead.`)
  const errors = validate(form)
  if (Object.keys(errors).length) throw new FeedbackError(Object.values(errors)[0])

  // FormData, not JSON: a "simple" cross-origin request, so no CORS preflight.
  const body = new FormData()
  body.append('access_key', accessKey)
  for (const [k, v] of Object.entries(payload(form))) body.append(k, v)
  body.append('botcheck', '')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  let res
  try {
    res = await fetchImpl(ENDPOINT, { method: 'POST', body, headers: { Accept: 'application/json' }, signal: controller.signal })
  } catch {
    throw new FeedbackError(`Could not reach the mail service. Check your connection and try again, or email ${FEEDBACK_TO}.`)
  } finally {
    clearTimeout(timer)
  }
  if (res.status === 429) throw new FeedbackError('Too many messages were sent just now. Please try again in a few minutes.')
  let data = null
  try {
    data = await res.json()
  } catch {
    // fall through to the generic error
  }
  if (!res.ok || !data?.success) {
    const reason = data?.body?.message || data?.message
    throw new FeedbackError(`The message was not sent${reason ? ` (${reason})` : ''}. Please try again, or email ${FEEDBACK_TO}.`)
  }
  return { ok: true }
}

/** Opens the feedback dialog from anywhere: a button, a link, a page. */
export function openFeedback(type) {
  window.dispatchEvent(new CustomEvent('devpocket:feedback', { detail: { type } }))
}
