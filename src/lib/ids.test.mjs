import { test } from 'node:test'
import assert from 'node:assert/strict'
import { uuidv4, uuidv7, ulid, inspectId, nanoId } from './ids.js'

test('v4 and v7 shape', () => {
  assert.match(uuidv4(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  const v7 = uuidv7(1645557742000)
  assert.match(v7, /^017f22e2-79b0-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  assert.equal(inspectId(v7).date.toISOString(), '2022-02-22T19:22:22.000Z')
})

test('v7 and ULID stay sorted within one millisecond', () => {
  const t = 1_700_000_000_000
  const a = Array.from({ length: 3000 }, () => uuidv7(t))
  assert.deepEqual([...a].sort(), a)
  assert.equal(new Set(a).size, a.length)
  const u = Array.from({ length: 3000 }, () => ulid(t))
  assert.deepEqual([...u].sort(), u)
  assert.equal(u[0].slice(0, 10), '01HF7YAT00')
})

test('inspect RFC 9562 examples and ULID', () => {
  const v1 = inspectId('C232AB00-9414-11EC-B3C8-9F6BDECED846')
  assert.equal(v1.version, 1)
  assert.equal(v1.date.toISOString(), '2022-02-22T19:22:22.000Z')
  assert.equal(inspectId('1EC9414C-232A-6B00-B3C8-9F6BDECED846').date.toISOString(), '2022-02-22T19:22:22.000Z')
  const v7 = inspectId('urn:uuid:017F22E2-79B0-7CC3-98C4-DC0C0C07398F')
  assert.equal(v7.kind, 'UUID v7')
  assert.equal(v7.variant, 'RFC 9562 (the standard one)')
  assert.equal(inspectId('{00000000-0000-0000-0000-000000000000}').kind, 'Nil UUID')
  const u = inspectId('01ARZ3NDEKTSV4RRFFQ69G5FAV')
  assert.equal(u.kind, 'ULID')
  assert.equal(u.date.toISOString(), '2016-07-30T23:54:10.259Z')
  assert.equal(inspectId('xyz').valid, false)
  assert.equal(nanoId(10).length, 10)
})
