import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validate, payload, sendFeedback, FeedbackError } from './feedback.js'

const form = { type: 'bug', message: 'The CSV download is empty\nwhen the input has one row.', email: ' ada@example.com ', page: '/json-to-csv/' }

test('validation', () => {
  assert.deepEqual(validate(form), {})
  assert.ok(validate({ ...form, message: 'short' }).message)
  assert.ok(validate({ ...form, email: 'nope' }).email)
  assert.ok(validate({ ...form, type: 'x' }).type)
  assert.deepEqual(validate({ ...form, email: '' }), {})
})

test('payload has only the form fields', () => {
  const p = payload(form)
  assert.deepEqual(Object.keys(p).sort(), ['email', 'from_name', 'message', 'page', 'subject', 'type'])
  assert.equal(p.subject, '[DevPocket] Bug: The CSV download is empty')
  assert.equal(p.email, 'ada@example.com')
  assert.equal(payload({ ...form, email: '', page: '' }).email, undefined)
})

test('sending', async () => {
  let sent
  const ok = async (url, init) => {
    sent = { url, fields: Object.fromEntries(init.body.entries()) }
    return { ok: true, status: 200, json: async () => ({ success: true }) }
  }
  assert.deepEqual(await sendFeedback(form, { fetchImpl: ok, accessKey: 'k' }), { ok: true })
  assert.equal(sent.url, 'https://api.web3forms.com/submit')
  assert.equal(sent.fields.access_key, 'k')
  assert.equal(sent.fields.page, '/json-to-csv/')
  // honeypot: no request
  sent = null
  assert.equal((await sendFeedback(form, { fetchImpl: ok, accessKey: 'k', botcheck: 'x' })).skipped, true)
  assert.equal(sent, null)
  await assert.rejects(sendFeedback(form, { fetchImpl: ok, accessKey: '' }), /not set up yet/)
  await assert.rejects(sendFeedback(form, { accessKey: 'k', fetchImpl: async () => ({ ok: false, status: 429 }) }), /Too many/)
  await assert.rejects(sendFeedback(form, { accessKey: 'k', fetchImpl: async () => ({ ok: false, status: 400, json: async () => ({ success: false, body: { message: 'Invalid access key' } }) }) }), /Invalid access key/)
  await assert.rejects(sendFeedback(form, { accessKey: 'k', fetchImpl: async () => { throw new TypeError('offline') } }), FeedbackError)
})
