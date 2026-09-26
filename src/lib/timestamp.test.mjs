import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseEpoch, parseDateString, isoIn, rfc2822In, relative, convertBatch, batchCsv, offsetOf } from './timestamp.js'

test('unit detection by digit count', () => {
  assert.equal(parseEpoch('1700000000').unit, 's')
  assert.equal(parseEpoch('1700000000123').unit, 'ms')
  assert.equal(parseEpoch('1700000000123456').unit, 'us')
  assert.equal(parseEpoch('1700000000123456789').unit, 'ns')
  assert.equal(parseEpoch('1700000000123456789').date.toISOString(), '2023-11-14T22:13:20.123Z')
  assert.equal(parseEpoch('1700000000123456789').subMs, '456789')
  assert.equal(parseEpoch('1700000000.5').date.toISOString(), '2023-11-14T22:13:20.500Z')
  assert.equal(parseEpoch('-1').date.toISOString(), '1969-12-31T23:59:59.000Z')
  assert.equal(parseEpoch('2147483648').beyond2038, true)
  assert.equal(parseEpoch('2147483647').beyond2038, false)
  assert.ok(parseEpoch('12ab').error)
  assert.equal(parseEpoch('1700000000', 'ms').date.toISOString(), '1970-01-20T16:13:20.000Z')
})

test('date strings', () => {
  assert.equal(parseDateString('2024-01-15T09:30:00Z').date.toISOString(), '2024-01-15T09:30:00.000Z')
  assert.equal(parseDateString('2024-01-15T15:00:00+05:30').date.toISOString(), '2024-01-15T09:30:00.000Z')
  assert.equal(parseDateString('2024-01-15').assumed, 'utc-date')
  assert.equal(parseDateString('2024-01-15T09:30').assumed, 'local')
  assert.equal(parseDateString('Mon, 15 Jan 2024 09:30:00 +0000').date.toISOString(), '2024-01-15T09:30:00.000Z')
  assert.ok(parseDateString('2024-13-01').error)
  assert.ok(parseDateString('not a date').error)
})

test('formatting in zones', () => {
  const d = new Date('2024-01-15T09:30:00Z')
  assert.equal(isoIn(d, 'Asia/Kolkata'), '2024-01-15T15:00:00.000+05:30')
  assert.equal(isoIn(d, 'UTC'), '2024-01-15T09:30:00.000Z')
  assert.equal(rfc2822In(d, 'Asia/Kolkata'), 'Mon, 15 Jan 2024 15:00:00 +0530')
  assert.equal(rfc2822In(d, 'America/New_York'), 'Mon, 15 Jan 2024 04:30:00 -0500')
  assert.equal(offsetOf(d, 'Africa/Johannesburg'), '+02:00')
  assert.equal(relative(new Date(0), 3 * 864e5), '3 days ago')
  assert.equal(relative(new Date(2 * 36e5), 0), 'in 2 hours')
})

test('batch', () => {
  const rows = convertBatch('1700000000\n\n2024-01-15T09:30:00Z\nnope')
  assert.equal(rows.length, 3)
  assert.equal(rows[0].iso, '2023-11-14T22:13:20.000Z')
  assert.equal(rows[1].seconds, 1705311000)
  assert.ok(rows[2].error)
  assert.equal(batchCsv(rows).split('\n')[1], '1700000000,1700000000,1700000000000,2023-11-14T22:13:20.000Z')
})
