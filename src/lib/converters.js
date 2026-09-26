/**
 * The four format converters as data: each direction's options, samples and
 * conversion, consumed by src/components/ConverterTool.jsx. One page per
 * direction so each can rank for its own query; this file keeps them in step.
 */
import { readJson, jsonToCsv, csvToJson, jsonToYaml, yamlToJson, toJsonText } from './convert.js'
import { propertiesToYaml, yamlToProperties } from './springconvert.js'

const indentOpt = (dflt = '2') => ({
  key: 'indent',
  label: 'Indent',
  type: 'select',
  default: dflt,
  options: [
    ['2', '2 spaces'],
    ['4', '4 spaces'],
  ],
})
const jsonIndent = {
  key: 'indent',
  label: 'Indent',
  type: 'select',
  default: '2',
  options: [
    ['2', '2 spaces'],
    ['4', '4 spaces'],
    ['0', 'Minified'],
  ],
}

const ORDERS = `[
  { "id": 1001, "customer": { "name": "Ada Lovelace", "city": "London" }, "items": ["keyboard", "mouse"], "total": 113.5, "paid": true },
  { "id": 1002, "customer": { "name": "Linus Pauling", "city": "Portland" }, "items": ["monitor"], "total": 249, "paid": false, "coupon": "SPRING10" }
]`

const PROPS_SAMPLE = `# Spring Boot application.properties
spring.application.name=orders
server.port=8080

# Datasource — the placeholder is resolved by Spring at startup
spring.datasource.url=jdbc:postgresql://\${DB_HOST:localhost}:5432/orders
spring.datasource.username=orders_app
spring.jpa.open-in-view=false

app.greeting=Caf\\u00e9 ouvert
app.cors.allowed-origins[0]=https://app.example.com
app.cors.allowed-origins[1]=https://admin.example.com
#---
spring.config.activate.on-profile=prod
server.port=80
logging.level.root=warn
`

const SPRING_YAML_SAMPLE = `spring:
  application:
    name: orders
  # Datasource — the placeholder is resolved by Spring at startup
  datasource:
    url: jdbc:postgresql://\${DB_HOST:localhost}:5432/orders
    username: orders_app
server:
  port: 8080
app:
  greeting: Café ouvert
  cors:
    allowed-origins:
      - https://app.example.com
      - https://admin.example.com
---
spring:
  config:
    activate:
      on-profile: prod
server:
  port: 80
`

const CSV_SAMPLE = `id,customer.name,customer.city,zip,total,paid
1001,Ada Lovelace,London,02134,113.50,true
1002,"Pauling, Linus",Portland,,249,false
`

const YAML_SAMPLE = `# docker-compose style service definition
defaults: &defaults
  restart: unless-stopped
  logging:
    driver: json-file

services:
  api:
    <<: *defaults
    image: ghcr.io/example/api:1.4.2
    ports: ["8080:8080"]
    environment:
      FEATURE_FLAG: on
      REGION: NO
  worker:
    <<: *defaults
    image: ghcr.io/example/worker:1.4.2
    command: ["node", "worker.js"]
`

export const CONVERTERS = {
  '/json-to-csv': {
    from: 'JSON',
    to: 'CSV',
    inputLanguage: 'json',
    outputLanguage: 'none',
    ext: 'csv',
    mime: 'text/csv',
    swap: '/csv-to-json',
    sample: ORDERS,
    subtitle: 'Turn a JSON array into a spreadsheet — nested objects become dot-notation columns.',
    options: [
      { key: 'delimiter', label: 'Delimiter', type: 'select', default: ',', options: [[',', 'Comma ,'], [';', 'Semicolon ;'], ['\t', 'Tab'], ['|', 'Pipe |']] },
      { key: 'arrays', label: 'Arrays', type: 'select', default: 'json', options: [['json', 'Keep as JSON'], ['join', 'Join with "; "'], ['index', 'One column per index']] },
      { key: 'flattenNested', label: 'Flatten nested objects', type: 'check', default: true },
      { key: 'header', label: 'Header row', type: 'check', default: true },
      { key: 'quoteAll', label: 'Quote every field', type: 'check', default: false },
      { key: 'bom', label: 'Add BOM for Excel', type: 'check', default: false },
    ],
    convert(text, o) {
      const value = readJson(text)
      const r = jsonToCsv(value, o)
      const warnings = []
      if (!Array.isArray(value)) warnings.push({ text: 'The input is a single object, so it became one row. Wrap several records in [ ] to get one row each.' })
      return { text: r.text, download: o.bom ? '﻿' + r.text : r.text, table: { headers: r.headers, rows: r.rows }, summary: `${r.rows.length} rows × ${r.headers.length} columns`, warnings }
    },
  },

  '/csv-to-json': {
    from: 'CSV',
    to: 'JSON',
    inputLanguage: 'none',
    outputLanguage: 'json',
    ext: 'json',
    mime: 'application/json',
    swap: '/json-to-csv',
    sample: CSV_SAMPLE,
    subtitle: 'Turn CSV or TSV into JSON records, with types detected and dotted headers nested.',
    options: [
      { key: 'delimiter', label: 'Delimiter', type: 'select', default: 'auto', options: [['auto', 'Detect'], [',', 'Comma ,'], [';', 'Semicolon ;'], ['\t', 'Tab'], ['|', 'Pipe |']] },
      { key: 'shape', label: 'Output', type: 'select', default: 'objects', options: [['objects', 'Array of objects'], ['arrays', 'Array of arrays']] },
      jsonIndent,
      { key: 'header', label: 'First row is a header', type: 'check', default: true },
      { key: 'types', label: 'Detect numbers, booleans and null', type: 'check', default: true },
      { key: 'unflattenKeys', label: 'Nest dotted headers (a.b → {a:{b}})', type: 'check', default: true },
    ],
    convert(text, o) {
      const r = csvToJson(text, o)
      const names = { ',': 'comma', ';': 'semicolon', '\t': 'tab', '|': 'pipe' }
      return {
        text: toJsonText(r.value, o.indent === '0' ? undefined : Number(o.indent)),
        summary: `${r.value.length} records · ${names[r.delimiter]}-separated`,
        warnings: r.warnings.map((w) => ({ text: w })),
      }
    },
  },

  '/json-to-yaml': {
    from: 'JSON',
    to: 'YAML',
    inputLanguage: 'json',
    outputLanguage: 'yaml',
    ext: 'yaml',
    mime: 'application/yaml',
    swap: '/yaml-to-json',
    sample: `{
  "apiVersion": "apps/v1",
  "kind": "Deployment",
  "metadata": { "name": "api", "labels": { "app": "api", "tier": "backend" } },
  "spec": {
    "replicas": 3,
    "template": {
      "spec": {
        "containers": [
          { "name": "api", "image": "ghcr.io/example/api:1.4.2", "ports": [{ "containerPort": 8080 }],
            "env": [{ "name": "FEATURE_FLAG", "value": "on" }, { "name": "COUNTRY", "value": "NO" }] }
        ]
      }
    }
  }
}`,
    subtitle: 'Turn JSON into clean YAML for Kubernetes, Compose or CI config — strings that YAML would misread are quoted.',
    options: [
      indentOpt(),
      { key: 'quote', label: 'Strings', type: 'select', default: 'auto', options: [['auto', 'Quote only when needed'], ['single', "Always 'single'"], ['double', 'Always "double"']] },
      { key: 'sortKeys', label: 'Sort keys', type: 'check', default: false },
    ],
    convert(text, o) {
      const value = readJson(text)
      return { text: jsonToYaml(value, { ...o, indent: Number(o.indent) }), warnings: [] }
    },
  },

  '/yaml-to-json': {
    from: 'YAML',
    to: 'JSON',
    inputLanguage: 'yaml',
    outputLanguage: 'json',
    ext: 'json',
    mime: 'application/json',
    swap: '/json-to-yaml',
    sample: YAML_SAMPLE,
    subtitle: 'Turn YAML into JSON — anchors and merge keys resolved, multi-document files supported.',
    options: [
      jsonIndent,
      { key: 'multi', label: 'Several documents (---) become an array', type: 'check', default: true },
    ],
    convert(text, o) {
      const r = yamlToJson(text, { multi: o.multi })
      return {
        text: toJsonText(r.value, o.indent === '0' ? undefined : Number(o.indent)),
        summary: r.documents > 1 ? (o.multi ? `${r.documents} documents → array` : `first of ${r.documents} documents`) : undefined,
        warnings: r.warnings,
      }
    },
  },
}

CONVERTERS['/properties-to-yaml'] = {
  from: 'Properties',
  to: 'YAML',
  inputLanguage: 'properties',
  outputLanguage: 'yaml',
  ext: 'yml',
  mime: 'application/yaml',
  swap: '/yaml-to-properties',
  sample: PROPS_SAMPLE,
  subtitle: 'Turn application.properties into application.yml — profiles, lists and comments included.',
  options: [
    indentOpt(),
    { key: 'inferTypes', label: 'Write numbers and booleans unquoted', type: 'check', default: true },
    { key: 'keepComments', label: 'Keep comments', type: 'check', default: true },
  ],
  convert(text, o) {
    const r = propertiesToYaml(text, { ...o, indent: Number(o.indent) })
    return { text: r.text, summary: r.documents > 1 ? `${r.documents} documents` : undefined, warnings: r.warnings.map((w) => ({ text: w })) }
  },
}

CONVERTERS['/yaml-to-properties'] = {
  from: 'YAML',
  to: 'Properties',
  inputLanguage: 'yaml',
  outputLanguage: 'properties',
  ext: 'properties',
  mime: 'text/x-java-properties',
  swap: '/properties-to-yaml',
  sample: SPRING_YAML_SAMPLE,
  subtitle: 'Flatten application.yml into application.properties — dotted keys, [0] indexes, #--- documents.',
  options: [
    { key: 'separator', label: 'Separator', type: 'select', default: '=', options: [['=', 'key=value'], [': ', 'key: value'], [' = ', 'key = value']] },
    { key: 'escapeUnicode', label: 'Escape non-ASCII as \\uXXXX', type: 'check', default: true },
    { key: 'keepComments', label: 'Keep comments', type: 'check', default: true },
  ],
  convert(text, o) {
    const r = yamlToProperties(text, o)
    return { text: r.text, summary: r.documents > 1 ? `${r.documents} documents` : undefined, warnings: r.warnings.map((w) => ({ text: w })) }
  },
}

export const defaultsFor = (cfg) => Object.fromEntries(cfg.options.map((o) => [o.key, o.default]))
