// JSON -> typed model generation for common backend languages.

const pascal = (s) =>
  String(s)
    .replace(/[^a-zA-Z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toUpperCase()) || 'Model'

const camel = (s) => {
  const p = pascal(s)
  return p.charAt(0).toLowerCase() + p.slice(1)
}

const snake = (s) =>
  String(s)
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .toLowerCase()

function kindOf(v) {
  if (v === null || v === undefined) return 'null'
  if (Array.isArray(v)) return 'array'
  return typeof v
}

/** Walks the value, collecting a named struct per distinct object shape. */
function collect(value, name, structs) {
  const kind = kindOf(value)
  if (kind === 'object') {
    const fields = Object.entries(value).map(([k, v]) => ({
      key: k,
      kind: kindOf(v),
      child: collect(v, pascal(k), structs),
      sample: v,
    }))
    const typeName = pascal(name)
    let unique = typeName
    let n = 2
    while (structs.has(unique) && JSON.stringify(structs.get(unique).map((f) => f.key)) !== JSON.stringify(fields.map((f) => f.key))) {
      unique = `${typeName}${n++}`
    }
    structs.set(unique, fields)
    return { type: 'object', name: unique }
  }
  if (kind === 'array') {
    if (!value.length) return { type: 'array', of: { type: 'unknown' } }
    return { type: 'array', of: collect(value[0], name.replace(/s$/, '') || 'Item', structs) }
  }
  if (kind === 'number') return { type: Number.isInteger(value) ? 'int' : 'float' }
  if (kind === 'boolean') return { type: 'bool' }
  if (kind === 'null') return { type: 'null' }
  if (kind === 'string') {
    if (/^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2})/.test(value)) return { type: 'datetime' }
    return { type: 'string' }
  }
  return { type: 'unknown' }
}

const TYPE_MAPS = {
  typescript: { string: 'string', int: 'number', float: 'number', bool: 'boolean', datetime: 'string', null: 'null', unknown: 'unknown' },
  go: { string: 'string', int: 'int', float: 'float64', bool: 'bool', datetime: 'time.Time', null: 'interface{}', unknown: 'interface{}' },
  java: { string: 'String', int: 'Integer', float: 'Double', bool: 'Boolean', datetime: 'Instant', null: 'Object', unknown: 'Object' },
  python: { string: 'str', int: 'int', float: 'float', bool: 'bool', datetime: 'datetime', null: 'None', unknown: 'Any' },
  csharp: { string: 'string', int: 'int', float: 'double', bool: 'bool', datetime: 'DateTime', null: 'object', unknown: 'object' },
}

function renderType(ref, lang) {
  const map = TYPE_MAPS[lang]
  if (ref.type === 'object') {
    return lang === 'python' ? `"${ref.name}"` : ref.name
  }
  if (ref.type === 'array') {
    const inner = renderType(ref.of, lang)
    switch (lang) {
      case 'typescript': return `${inner}[]`
      case 'go': return `[]${inner}`
      case 'java': return `List<${inner}>`
      case 'python': return `List[${inner}]`
      case 'csharp': return `List<${inner}>`
      default: return inner
    }
  }
  return map[ref.type] || map.unknown
}

export function generate(json, rootName, lang) {
  const structs = new Map()
  collect(json, rootName, structs)
  const entries = [...structs.entries()].reverse()
  if (!entries.length) return '// Provide a JSON object (or an array of objects) to generate models.'

  const blocks = entries.map(([name, fields]) => {
    switch (lang) {
      case 'typescript':
        return [
          `export interface ${name} {`,
          ...fields.map((f) => `  ${/^[A-Za-z_$][\w$]*$/.test(f.key) ? f.key : `"${f.key}"`}${f.kind === 'null' ? '?' : ''}: ${renderType(f.child, lang)};`),
          '}',
        ].join('\n')

      case 'go':
        return [
          `type ${name} struct {`,
          ...fields.map((f) => `\t${pascal(f.key)} ${renderType(f.child, lang)} \`json:"${f.key}"\``),
          '}',
        ].join('\n')

      case 'java':
        return [
          `public class ${name} {`,
          ...fields.map((f) => `    private ${renderType(f.child, lang)} ${camel(f.key)};`),
          '',
          ...fields.flatMap((f) => {
            const t = renderType(f.child, lang)
            const c = pascal(f.key)
            return [
              `    public ${t} get${c}() { return ${camel(f.key)}; }`,
              `    public void set${c}(${t} ${camel(f.key)}) { this.${camel(f.key)} = ${camel(f.key)}; }`,
            ]
          }),
          '}',
        ].join('\n')

      case 'python':
        return [
          '@dataclass',
          `class ${name}:`,
          ...fields.map((f) => `    ${snake(f.key)}: ${renderType(f.child, lang)}${f.kind === 'null' ? ' = None' : ''}`),
        ].join('\n')

      case 'csharp':
        return [
          `public class ${name}`,
          '{',
          ...fields.map((f) => `    [JsonPropertyName("${f.key}")]\n    public ${renderType(f.child, lang)} ${pascal(f.key)} { get; set; }`),
          '}',
        ].join('\n')

      default:
        return ''
    }
  })

  const headers = {
    go: 'package models\n\nimport "time"\n',
    java: 'import java.time.Instant;\nimport java.util.List;\n',
    python: 'from dataclasses import dataclass\nfrom datetime import datetime\nfrom typing import Any, List, Optional\n',
    csharp: 'using System;\nusing System.Collections.Generic;\nusing System.Text.Json.Serialization;\n',
    typescript: '',
  }

  return (headers[lang] || '') + '\n' + blocks.join('\n\n')
}

export const LANGUAGES = [
  { value: 'typescript', label: 'TypeScript' },
  { value: 'go', label: 'Go' },
  { value: 'java', label: 'Java' },
  { value: 'python', label: 'Python' },
  { value: 'csharp', label: 'C#' },
]
