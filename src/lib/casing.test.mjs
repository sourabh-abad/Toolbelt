import { test } from 'node:test'
import assert from 'node:assert/strict'
import { splitWords, convertAll, convertLines, detectCase, stripAccents } from './casing.js'

const as = (input) => Object.fromEntries(convertAll(input).map((c) => [c.id, c.value]))

test('splits every common convention into the same words', () => {
  for (const s of ['userId', 'UserId', 'user_id', 'USER_ID', 'user-id', 'User ID', 'user.id', ' user  id ']) {
    assert.deepEqual(splitWords(s).map((w) => w.toLowerCase()), ['user', 'id'], s)
  }
})

test('keeps acronyms and digits sensible', () => {
  assert.deepEqual(splitWords('XMLHttpRequest'), ['XML', 'Http', 'Request'])
  assert.deepEqual(splitWords('parseJSONResponse'), ['parse', 'JSON', 'Response'])
  assert.deepEqual(splitWords('utf8Encoder'), ['utf8', 'Encoder'])
  assert.deepEqual(splitWords('getV2Items'), ['get', 'V2', 'Items'])
})

test('converts to every case', () => {
  const r = as('XMLHttpRequest')
  assert.equal(r.camel, 'xmlHttpRequest')
  assert.equal(r.pascal, 'XmlHttpRequest')
  assert.equal(r.snake, 'xml_http_request')
  assert.equal(r.screaming, 'XML_HTTP_REQUEST')
  assert.equal(r.kebab, 'xml-http-request')
  assert.equal(r.train, 'Xml-Http-Request')
  assert.equal(r.dot, 'xml.http.request')
  assert.equal(r.path, 'xml/http/request')
  assert.equal(r.title, 'Xml Http Request')
  assert.equal(r.sentence, 'Xml http request')
})

test('converts line by line and keeps blank lines', () => {
  assert.equal(convertLines('first_name\n\nlastName', 'kebab'), 'first-name\n\nlast-name')
})

test('detects the convention in use', () => {
  assert.equal(detectCase('userId'), 'camel')
  assert.equal(detectCase('UserId'), 'pascal')
  assert.equal(detectCase('user_id'), 'snake')
  assert.equal(detectCase('USER_ID'), 'screaming')
  assert.equal(detectCase('user-id'), 'kebab')
  assert.equal(detectCase('user id'), null)
})

test('keeps non-ASCII letters (acceptance)', () => {
  assert.equal(as('Ça va déjà').camel, 'çaVaDéjà')
  assert.equal(as('Ça va déjà').snake, 'ça_va_déjà')
  const stripped = Object.fromEntries(convertAll('Ça va déjà', { stripAccents: true }).map((c) => [c.id, c.value]))
  assert.equal(stripped.camel, 'caVaDeja')
  assert.equal(stripped.snake, 'ca_va_deja')
})

test('splits other scripts and cases', () => {
  assert.deepEqual(splitWords('größeÄnderung'), ['größe', 'Änderung'])
  assert.deepEqual(splitWords('ΑθήναΠόλη'), ['Αθήνα', 'Πόλη'])
  assert.deepEqual(splitWords('имя_пользователя'), ['имя', 'пользователя'])
  assert.equal(as('straße nummer').screaming, 'STRASSE_NUMMER')
  assert.equal(convertLines('Crème brûlée\nnaïve café', 'kebab', { stripAccents: true }), 'creme-brulee\nnaive-cafe')
})

test('decomposed input keeps its accents together', () => {
  const decomposed = 'de\u0301ja\u0300 vu' // é and à written as letter + combining mark
  assert.equal(as(decomposed).camel.normalize('NFC'), 'déjàVu')
  assert.equal(stripAccents(decomposed), 'deja vu')
})

test('detects conventions in other scripts', () => {
  assert.equal(detectCase('größeÄnderung'), 'camel')
  assert.equal(detectCase('ça_va'), 'snake')
})
