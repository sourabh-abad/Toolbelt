import { test } from 'node:test'
import assert from 'node:assert/strict'
import yaml from 'js-yaml'
import { propertiesToYaml, yamlToProperties, yamlComments } from './springconvert.js'

const PROPS = `# Server
server.port=8080
spring.application.name=orders
# Database
spring.datasource.url=jdbc:postgresql://\${DB_HOST:localhost}:5432/orders
spring.datasource.username=app
app.greeting=Caf\\u00e9 ouvert
app.servers[0].host=a.example.com
app.servers[0].port=9000
app.servers[1].host=b.example.com
app.flag=on
#---
spring.config.activate.on-profile=prod
server.port=80
`

test('properties → YAML: nesting, lists, placeholders, comments, documents', () => {
  const r = propertiesToYaml(PROPS)
  assert.equal(r.documents, 2)
  assert.equal(r.text, `# Server
server:
  port: 8080
spring:
  application:
    name: orders
  # Database
  datasource:
    url: jdbc:postgresql://\${DB_HOST:localhost}:5432/orders
    username: app
app:
  greeting: Café ouvert
  servers:
    - host: a.example.com
      port: 9000
    - host: b.example.com
  flag: 'on'
---
spring:
  config:
    activate:
      on-profile: prod
server:
  port: 80
`)
  const docs = yaml.loadAll(r.text)
  assert.equal(docs[0].app.servers[1].host, 'b.example.com')
  assert.equal(docs[1].spring.config.activate['on-profile'], 'prod')
  const four = propertiesToYaml('a.list[0].x=1\na.list[0].y=2', { indent: 4 }).text
  // y is a YAML 1.1 boolean, so the key is quoted
  assert.equal(four, "a:\n    list:\n        - x: 1\n          'y': 2\n")
  assert.deepEqual(yaml.load(four), { a: { list: [{ x: 1, y: 2 }] } })
  assert.match(propertiesToYaml('a=1\na.b=2').warnings[0], /stays a flat key/)
})

test('YAML → properties: flatten, comments, unicode, documents', () => {
  const r = yamlToProperties(propertiesToYaml(PROPS).text)
  assert.equal(r.text, `# Server
server.port=8080
spring.application.name=orders
# Database
spring.datasource.url=jdbc:postgresql://\${DB_HOST:localhost}:5432/orders
spring.datasource.username=app
app.greeting=Caf\\u00e9 ouvert
app.servers[0].host=a.example.com
app.servers[0].port=9000
app.servers[1].host=b.example.com
app.flag=on
#---
spring.config.activate.on-profile=prod
server.port=80
`)
  assert.equal(yamlToProperties('a: é', { escapeUnicode: false }).text, 'a=é\n')
  assert.throws(() => yamlToProperties('- a\n- b'), /a list/)
  assert.throws(() => yamlToProperties('a: [1'), /Line \d+/)
})

test('yamlComments tracks list items and block scalars', () => {
  const { map } = yamlComments('a:\n  # first item\n  - x: 1\n    # the y\n    y: |\n      # not a comment\n      text\n  # second\n  - 2\n')
  assert.deepEqual([...map.entries()], [['a[0].x', ['first item']], ['a[0].y', ['the y']], ['a[1]', ['second']]])
})
